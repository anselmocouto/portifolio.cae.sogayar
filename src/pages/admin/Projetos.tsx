import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { removeFromBucket } from '@/lib/uploads'
import { formatDataCompleta } from '@/lib/format'
import { useConfirm } from '@/components/ConfirmDialogProvider'

type RawProject = {
  id: string
  title: string
  outlet: string | null
  published_at: string | null
  status: 'draft' | 'published'
  featured: boolean
  categories: { name: string; color: string } | null
  project_files: { count: number }[]
}

type ProjectRow = {
  id: string
  title: string
  outlet: string | null
  published_at: string | null
  status: 'draft' | 'published'
  featured: boolean
  categoryName: string | null
  fileCount: number
}

export default function Projetos() {
  const [projetos, setProjetos] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()
  const confirm = useConfirm()

  async function load() {
    setLoading(true)
    setError(null)

    const { data, error } = (await supabase
      .from('projects')
      .select(
        'id, title, outlet, published_at, status, featured, categories(name, color), project_files(count)'
      )
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })) as unknown as {
      data: RawProject[] | null
      error: PostgrestError | null
    }

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setProjetos(
      (data ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        outlet: p.outlet,
        published_at: p.published_at,
        status: p.status,
        featured: p.featured,
        categoryName: p.categories?.name ?? null,
        fileCount: p.project_files?.[0]?.count ?? 0,
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtrados = useMemo(
    () => projetos.filter((p) => p.title.toLowerCase().includes(busca.toLowerCase())),
    [projetos, busca]
  )

  async function excluir(p: ProjectRow) {
    const ok = await confirm({
      title: 'Excluir projeto',
      message: `Excluir o projeto "${p.title}"? Os anexos também serão removidos.`,
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return

    // buscar caminhos de arquivos e capa antes do delete (cascade apaga as linhas de project_files)
    const [{ data: files }, { data: full }] = await Promise.all([
      supabase.from('project_files').select('file_path').eq('project_id', p.id),
      supabase.from('projects').select('cover_path').eq('id', p.id).single(),
    ])

    const { error } = await supabase.from('projects').delete().eq('id', p.id)
    if (error) {
      setError(error.message)
      return
    }

    setProjetos((prev) => prev.filter((x) => x.id !== p.id))

    const filePaths = (files ?? []).map((f) => f.file_path)
    if (filePaths.length) await removeFromBucket('project-files', filePaths)
    if (full?.cover_path) await removeFromBucket('public-assets', [full.cover_path])
  }

  return (
    <>
      <div className="ad-head">
        <h1 className="ad-h1">Projetos</h1>
        <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 480, justifyContent: 'flex-end' }}>
          <input
            className="ad-input"
            style={{ maxWidth: 260 }}
            placeholder="Buscar projeto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button type="button" className="ad-btn" onClick={() => navigate('/admin/projetos/novo')}>
            + Novo projeto
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#B3261E', marginBottom: 12, fontSize: 14 }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Carregando…</p>
      ) : (
        <div className="ad-card">
          <div className="ad-row ad-row-head">
            <span>Título</span>
            <span>Categoria</span>
            <span>Data</span>
            <span>Status</span>
            <span></span>
          </div>
          {filtrados.map((p) => (
            <div key={p.id} className="ad-row">
              <span className="ad-titulo" onClick={() => navigate(`/admin/projetos/${p.id}`)}>
                {p.featured && (
                  <span className="ad-star" title="Destaque">
                    ★{' '}
                  </span>
                )}
                {p.title}
                <small>
                  {p.outlet ?? '—'} · {p.fileCount} arquivo{p.fileCount !== 1 ? 's' : ''}
                </small>
              </span>
              <span>{p.categoryName ?? '—'}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDataCompleta(p.published_at)}</span>
              <span>
                <span className={`ad-badge ${p.status === 'published' ? 'ad-pub' : 'ad-draft'}`}>
                  {p.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </span>
              <span className="ad-acoes">
                <Link to={`/admin/projetos/${p.id}`} className="ad-mini">
                  Editar
                </Link>
                <button type="button" className="ad-mini ad-mini-danger" onClick={() => excluir(p)}>
                  Excluir
                </button>
              </span>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              Nenhum projeto encontrado. Clique em "+ Novo projeto" para começar.
            </div>
          )}
        </div>
      )}
    </>
  )
}
