import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { publicUrl, removeFromBucket, uploadToBucket, validateFileSize } from '@/lib/uploads'
import { useConfirm } from '@/components/ConfirmDialogProvider'

type CategoriaOption = { id: string; name: string }

type FormValues = {
  title: string
  summary: string
  content: string
  outlet: string
  published_at: string
  external_url: string
  category_id: string
  status: 'draft' | 'published'
  featured: boolean
}

type Attachment = {
  id: string
  file_name: string
  file_path: string
  downloadable: boolean
}

type LinkItem = { url: string; description: string }

const VAZIO: FormValues = {
  title: '',
  summary: '',
  content: '',
  outlet: '',
  published_at: '',
  external_url: '',
  category_id: '',
  status: 'draft',
  featured: false,
}

export default function ProjetoForm() {
  const { id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: VAZIO })

  const [categorias, setCategorias] = useState<CategoriaOption[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [coverPath, setCoverPath] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const [links, setLinks] = useState<LinkItem[]>([])

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('sort_order', { ascending: true })
      .then(({ data }) => setCategorias(data ?? []))
  }, [])

  useEffect(() => {
    if (isNew) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.from('projects').select('*').eq('id', id as string).single()
      if (cancelled) return
      if (error || !data) {
        setError(error?.message ?? 'Projeto não encontrado.')
        setLoading(false)
        return
      }
      reset({
        title: data.title,
        summary: data.summary ?? '',
        content: data.content ?? '',
        outlet: data.outlet ?? '',
        published_at: data.published_at ?? '',
        external_url: data.external_url ?? '',
        category_id: data.category_id ?? '',
        status: data.status,
        featured: data.featured,
      })
      setCoverPath(data.cover_path)
      setLinks(data.links ?? [])

      const { data: files } = await supabase
        .from('project_files')
        .select('id, file_name, file_path, downloadable')
        .eq('project_id', id as string)
      if (!cancelled) setAttachments(files ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, isNew, reset])

  function onPickCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const sizeError = validateFileSize(file)
    if (sizeError) {
      setError(sizeError)
      return
    }
    setCoverFile(file)
  }

  function onPickAttachments(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const f of files) {
      const sizeError = validateFileSize(f)
      if (sizeError) {
        setError(sizeError)
        return
      }
    }
    setPendingFiles((prev) => [...prev, ...files])
  }

  function removePendingFile(idx: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  function addLink() {
    setLinks((prev) => [...prev, { url: '', description: '' }])
  }

  function updateLink(idx: number, field: keyof LinkItem, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)))
  }

  function removeLink(idx: number) {
    setLinks((prev) => prev.filter((_, i) => i !== idx))
  }

  async function removeAttachment(a: Attachment) {
    const ok = await confirm({
      title: 'Remover arquivo',
      message: `Remover o arquivo "${a.file_name}"?`,
      confirmLabel: 'Remover',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('project_files').delete().eq('id', a.id)
    if (error) {
      setError(error.message)
      return
    }
    await removeFromBucket('project-files', [a.file_path])
    setAttachments((prev) => prev.filter((x) => x.id !== a.id))
  }

  async function toggleDownloadable(a: Attachment) {
    const { error } = await supabase
      .from('project_files')
      .update({ downloadable: !a.downloadable })
      .eq('id', a.id)
    if (error) {
      setError(error.message)
      return
    }
    setAttachments((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, downloadable: !x.downloadable } : x))
    )
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setError(null)
    try {
      let finalCoverPath = coverPath
      if (coverFile) {
        finalCoverPath = await uploadToBucket('public-assets', coverFile)
      }

      const payload = {
        title: values.title.trim(),
        summary: values.summary.trim() || null,
        content: values.content.trim() || null,
        outlet: values.outlet.trim() || null,
        published_at: values.published_at || null,
        external_url: values.external_url.trim() || null,
        category_id: values.category_id || null,
        status: values.status,
        featured: values.featured,
        cover_path: finalCoverPath,
        links: links
          .map((l) => ({ url: l.url.trim(), description: l.description.trim() }))
          .filter((l) => l.url),
        updated_at: new Date().toISOString(),
      }

      let projectId = id
      if (isNew) {
        const { data, error } = await supabase.from('projects').insert(payload).select('id').single()
        if (error || !data) throw new Error(error?.message ?? 'Falha ao criar projeto.')
        projectId = data.id
      } else {
        const { error } = await supabase.from('projects').update(payload).eq('id', id as string)
        if (error) throw new Error(error.message)
      }

      for (const file of pendingFiles) {
        const path = await uploadToBucket('project-files', file)
        const { error } = await supabase.from('project_files').insert({
          project_id: projectId as string,
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          downloadable: true,
        })
        if (error) throw new Error(error.message)
      }

      navigate('/admin/projetos')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Carregando…</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="ad-head">
        <h1 className="ad-h1">{isNew ? 'Novo projeto' : 'Editar projeto'}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="ad-btn ad-btn-ghost"
            onClick={() => navigate('/admin/projetos')}
          >
            Cancelar
          </button>
          <button type="submit" className="ad-btn" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#B3261E', marginBottom: 12, fontSize: 14 }}>{error}</p>}

      <div className="ad-form-grid">
        <div className="ad-panel">
          <div className="ad-field">
            <label className="ad-label">Título *</label>
            <input className="ad-input" {...register('title', { required: true })} />
          </div>
          <div className="ad-field">
            <label className="ad-label">Resumo (aparece no card)</label>
            <textarea className="ad-textarea" {...register('summary')} />
          </div>
          <div className="ad-field">
            <label className="ad-label">Conteúdo completo (página de detalhe)</label>
            <textarea
              className="ad-textarea"
              style={{ minHeight: 220 }}
              {...register('content')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="ad-field">
              <label className="ad-label">Veículo</label>
              <input className="ad-input" {...register('outlet')} />
            </div>
            <div className="ad-field">
              <label className="ad-label">Data de publicação</label>
              <input className="ad-input" type="date" {...register('published_at')} />
            </div>
          </div>
          <div className="ad-field">
            <label className="ad-label">Link da matéria original</label>
            <input className="ad-input" placeholder="https://..." {...register('external_url')} />
          </div>

          <div className="ad-field">
            <label className="ad-label">Links extras (com descrição)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map((link, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      className="ad-input"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateLink(idx, 'url', e.target.value)}
                    />
                    <input
                      className="ad-input"
                      placeholder="Descrição (ex.: certificado, matéria sobre o prêmio...)"
                      value={link.description}
                      onChange={(e) => updateLink(idx, 'description', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="ad-mini ad-mini-danger"
                    onClick={() => removeLink(idx)}
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button type="button" className="ad-mini" onClick={addLink} style={{ alignSelf: 'flex-start' }}>
                + Adicionar link
              </button>
            </div>
          </div>

          <div className="ad-field" style={{ marginBottom: 0 }}>
            <label className="ad-label">Arquivos do projeto</label>
            <label className="ad-drop" style={{ display: 'block' }}>
              <b>Arraste arquivos ou clique para enviar</b>
              PDF da matéria, fotos, áudio, vídeo — funciona como backup permanente do clipping
              <input type="file" multiple onChange={onPickAttachments} style={{ display: 'none' }} />
            </label>

            {(attachments.length > 0 || pendingFiles.length > 0) && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13.5,
                      padding: '8px 12px',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ flex: 1 }}>{a.file_name}</span>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12.5,
                        color: 'var(--muted)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={a.downloadable}
                        onChange={() => toggleDownloadable(a)}
                      />
                      Download
                    </label>
                    <button
                      type="button"
                      className="ad-mini ad-mini-danger"
                      onClick={() => removeAttachment(a)}
                    >
                      Remover
                    </button>
                  </div>
                ))}
                {pendingFiles.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13.5,
                      padding: '8px 12px',
                      border: '1px dashed var(--line)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ flex: 1 }}>{f.name} (novo — enviado ao salvar)</span>
                    <button type="button" className="ad-mini" onClick={() => removePendingFile(i)}>
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ad-panel">
          <div className="ad-field">
            <label className="ad-label">Categoria</label>
            <select className="ad-select" {...register('category_id')}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ad-field">
            <label className="ad-label">Status</label>
            <select className="ad-select" {...register('status')}>
              <option value="draft">Rascunho (não aparece no site)</option>
              <option value="published">Publicado</option>
            </select>
          </div>
          <label className="ad-check">
            <input type="checkbox" {...register('featured')} />
            Marcar como destaque
          </label>

          <div className="ad-field" style={{ marginBottom: 0 }}>
            <label className="ad-label">Capa do projeto</label>
            <label className="ad-drop" style={{ display: 'block' }}>
              <b>
                {coverFile
                  ? coverFile.name
                  : coverPath
                    ? 'Substituir imagem de capa'
                    : 'Enviar imagem de capa'}
              </b>
              JPG ou PNG
              <input type="file" accept="image/*" onChange={onPickCover} style={{ display: 'none' }} />
            </label>
            {(coverFile || coverPath) && (
              <img
                src={coverFile ? URL.createObjectURL(coverFile) : (publicUrl('public-assets', coverPath) ?? undefined)}
                alt="Prévia da capa"
                style={{
                  marginTop: 10,
                  width: '100%',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--line)',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
