import { useEffect, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { publicUrl, removeFromBucket, uploadToBucket, validateFileSize } from '@/lib/uploads'
import { useConfirm } from '@/components/ConfirmDialogProvider'

type FormValues = {
  full_name: string
  headline: string
  bio: string
  personal_statement: string
  email: string
  city: string
  instagram: string
  linkedin: string
  twitter: string
  whatsapp: string
  website: string
}

const VAZIO: FormValues = {
  full_name: '',
  headline: '',
  bio: '',
  personal_statement: '',
  email: '',
  city: '',
  instagram: '',
  linkedin: '',
  twitter: '',
  whatsapp: '',
  website: '',
}

export default function Configuracoes() {
  const confirm = useConfirm()
  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: VAZIO })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [bannerPath, setBannerPath] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single()
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (data) {
        const social = data.social_links ?? {}
        reset({
          full_name: data.full_name ?? '',
          headline: data.headline ?? '',
          bio: data.bio ?? '',
          personal_statement: data.personal_statement ?? '',
          email: data.email ?? '',
          city: data.city ?? '',
          instagram: social.instagram ?? '',
          linkedin: social.linkedin ?? '',
          twitter: social.twitter ?? '',
          whatsapp: social.whatsapp ?? '',
          website: social.website ?? '',
        })
        setPhotoPath(data.photo_path)
        setBannerPath(data.banner_path)
      }
      setLoading(false)
    }
    load()
  }, [reset])

  function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const sizeError = validateFileSize(file)
    if (sizeError) {
      setError(sizeError)
      return
    }
    setPhotoFile(file)
  }

  function onPickBanner(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const sizeError = validateFileSize(file)
    if (sizeError) {
      setError(sizeError)
      return
    }
    setBannerFile(file)
  }

  async function removerBanner() {
    const ok = await confirm({
      title: 'Remover banner',
      message: 'O banner do topo será removido da página pública. Você pode enviar outro depois.',
      confirmLabel: 'Remover',
      danger: true,
    })
    if (!ok) return

    const pathToRemove = bannerPath
    setBannerFile(null)
    setBannerPath(null)

    const { error } = await supabase.from('site_settings').update({ banner_path: null }).eq('id', 1)
    if (error) {
      setError(error.message)
      setBannerPath(pathToRemove)
      return
    }
    if (pathToRemove) await removeFromBucket('public-assets', [pathToRemove])
  }

  async function removerFoto() {
    const ok = await confirm({
      title: 'Remover foto de perfil',
      message: 'A foto será removida do hero da página pública. Você pode enviar outra depois.',
      confirmLabel: 'Remover',
      danger: true,
    })
    if (!ok) return

    const pathToRemove = photoPath
    setPhotoFile(null)
    setPhotoPath(null)

    const { error } = await supabase.from('site_settings').update({ photo_path: null }).eq('id', 1)
    if (error) {
      setError(error.message)
      setPhotoPath(pathToRemove)
      return
    }
    if (pathToRemove) await removeFromBucket('public-assets', [pathToRemove])
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      let finalPhotoPath = photoPath
      if (photoFile) finalPhotoPath = await uploadToBucket('public-assets', photoFile)

      let finalBannerPath = bannerPath
      if (bannerFile) finalBannerPath = await uploadToBucket('public-assets', bannerFile)

      const social_links: Record<string, string> = {}
      if (values.instagram.trim()) social_links.instagram = values.instagram.trim()
      if (values.linkedin.trim()) social_links.linkedin = values.linkedin.trim()
      if (values.twitter.trim()) social_links.twitter = values.twitter.trim()
      if (values.whatsapp.trim()) social_links.whatsapp = values.whatsapp.trim()
      if (values.website.trim()) social_links.website = values.website.trim()

      const { error } = await supabase
        .from('site_settings')
        .update({
          // full_name, headline e bio são NOT NULL no banco — nunca enviar null
          full_name: values.full_name.trim(),
          headline: values.headline.trim(),
          bio: values.bio.trim(),
          personal_statement: values.personal_statement.trim() || null,
          email: values.email.trim() || null,
          city: values.city.trim() || null,
          social_links,
          photo_path: finalPhotoPath,
          banner_path: finalBannerPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)

      if (error) throw new Error(error.message)

      setPhotoPath(finalPhotoPath)
      setBannerPath(finalBannerPath)
      setPhotoFile(null)
      setBannerFile(null)
      setSuccess(true)
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
        <h1 className="ad-h1">Configurações do site</h1>
        <button type="submit" className="ad-btn" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>

      {error && <p style={{ color: '#B3261E', marginBottom: 12, fontSize: 14 }}>{error}</p>}
      {success && (
        <p style={{ color: '#0E7A4E', marginBottom: 12, fontSize: 14 }}>Alterações salvas.</p>
      )}

      <div className="ad-form-grid">
        <div className="ad-panel">
          <div className="ad-field">
            <label className="ad-label">Nome completo</label>
            <input className="ad-input" {...register('full_name', { required: true })} />
          </div>
          <div className="ad-field">
            <label className="ad-label">Subtítulo</label>
            <input className="ad-input" {...register('headline')} />
          </div>
          <div className="ad-field">
            <label className="ad-label">Bio (hero)</label>
            <textarea className="ad-textarea" {...register('bio')} />
          </div>
          <div className="ad-field" style={{ marginBottom: 0 }}>
            <label className="ad-label">Carta de apresentação</label>
            <textarea
              className="ad-textarea"
              style={{ minHeight: 180 }}
              {...register('personal_statement')}
            />
          </div>
        </div>

        <div className="ad-panel">
          <div className="ad-field">
            <label className="ad-label">Email de contato</label>
            <input className="ad-input" type="email" {...register('email')} />
          </div>
          <div className="ad-field">
            <label className="ad-label">Cidade</label>
            <input className="ad-input" {...register('city')} />
          </div>
          <div className="ad-field">
            <label className="ad-label">Foto de perfil</label>
            <label className="ad-drop" style={{ display: 'block' }}>
              <b>{photoFile ? photoFile.name : photoPath ? 'Substituir foto' : 'Enviar foto'}</b>
              JPG ou PNG
              <input type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} />
            </label>
            {(photoFile || photoPath) && (
              <img
                src={
                  photoFile
                    ? URL.createObjectURL(photoFile)
                    : (publicUrl('public-assets', photoPath) ?? undefined)
                }
                alt="Prévia da foto de perfil"
                style={{
                  marginTop: 10,
                  width: 96,
                  height: 96,
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  borderRadius: 'var(--radius-hero)',
                  border: '1px solid var(--line)',
                }}
              />
            )}
            {(photoFile || photoPath) && (
              <button
                type="button"
                className="ad-mini ad-mini-danger"
                style={{ marginTop: 8 }}
                onClick={removerFoto}
              >
                Remover foto
              </button>
            )}
          </div>
          <div className="ad-field">
            <label className="ad-label">Banner do topo</label>
            <label className="ad-drop" style={{ display: 'block' }}>
              <b>{bannerFile ? bannerFile.name : bannerPath ? 'Substituir banner' : 'Enviar banner'}</b>
              JPG ou PNG
              <input type="file" accept="image/*" onChange={onPickBanner} style={{ display: 'none' }} />
            </label>
            {(bannerFile || bannerPath) && (
              <img
                src={
                  bannerFile
                    ? URL.createObjectURL(bannerFile)
                    : (publicUrl('public-assets', bannerPath) ?? undefined)
                }
                alt="Prévia do banner"
                style={{
                  marginTop: 10,
                  width: '100%',
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--line)',
                }}
              />
            )}
            {(bannerFile || bannerPath) && (
              <button
                type="button"
                className="ad-mini ad-mini-danger"
                style={{ marginTop: 8 }}
                onClick={removerBanner}
              >
                Remover banner
              </button>
            )}
          </div>
          <div className="ad-field" style={{ marginBottom: 0 }}>
            <label className="ad-label">Redes sociais</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="ad-input" placeholder="Instagram (URL)" {...register('instagram')} />
              <input className="ad-input" placeholder="LinkedIn (URL)" {...register('linkedin')} />
              <input className="ad-input" placeholder="Twitter / X (URL)" {...register('twitter')} />
              <input className="ad-input" placeholder="WhatsApp (link wa.me)" {...register('whatsapp')} />
              <input className="ad-input" placeholder="Site pessoal (URL)" {...register('website')} />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
