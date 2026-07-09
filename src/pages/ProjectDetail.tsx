import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { publicUrl } from '@/lib/uploads'
import { formatDataCompleta } from '@/lib/format'
import '@/styles/public.css'

type RawProject = {
  id: string
  title: string
  summary: string | null
  content: string | null
  outlet: string | null
  published_at: string | null
  external_url: string | null
  cover_path: string | null
  links: { url: string; description: string }[]
  categories: { name: string; slug: string } | null
}

type Attachment = {
  id: string
  file_name: string
  file_path: string
  mime_type: string | null
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [projeto, setProjeto] = useState<RawProject | null>(null)
  const [arquivos, setArquivos] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)

      const { data, error } = (await supabase
        .from('projects')
        .select(
          'id, title, summary, content, outlet, published_at, external_url, cover_path, links, categories(name, slug)'
        )
        .eq('id', id as string)
        .eq('status', 'published')
        .single()) as unknown as { data: RawProject | null; error: unknown }

      if (cancelled) return
      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProjeto(data)

      const { data: files } = await supabase
        .from('project_files')
        .select('id, file_name, file_path, mime_type')
        .eq('project_id', id as string)
        .eq('downloadable', true)
      if (!cancelled) setArquivos(files ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (projeto?.title) document.title = `${projeto.title} — Portfólio`
  }, [projeto])

  if (loading) {
    return (
      <div className="pc-wrap" style={{ padding: 64, textAlign: 'center', color: 'var(--muted)' }}>
        Carregando…
      </div>
    )
  }

  if (notFound || !projeto) {
    return (
      <div className="pc-wrap" style={{ padding: 64, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Projeto não encontrado.</p>
        <Link to="/" className="pc-detail-back">
          ← Voltar ao portfólio
        </Link>
      </div>
    )
  }

  const backTo = projeto.categories?.slug ? `/categoria/${projeto.categories.slug}` : '/'
  const backLabel = projeto.categories?.name
    ? `← Voltar a ${projeto.categories.name}`
    : '← Voltar ao portfólio'

  const fotos = arquivos.filter((a) => a.mime_type?.startsWith('image/'))
  const outrosArquivos = arquivos.filter((a) => !a.mime_type?.startsWith('image/'))

  function scrollCarousel(dir: 'prev' | 'next') {
    const track = carouselRef.current
    if (!track) return
    const slide = track.querySelector<HTMLElement>('.pc-carousel-slide')
    const gap = 12
    const largura = slide ? slide.getBoundingClientRect().width + gap : track.clientWidth * 0.7
    track.scrollBy({ left: dir === 'next' ? largura : -largura, behavior: 'smooth' })
  }

  return (
    <>
      <div className="pc-wrap pc-detail-header">
        <Link to={backTo} className="pc-detail-back">
          {backLabel}
        </Link>

        {projeto.cover_path && (
          <img
            className="pc-detail-cover"
            src={publicUrl('public-assets', projeto.cover_path) ?? undefined}
            alt=""
          />
        )}

        <span className="pc-card-cat">{projeto.categories?.name ?? 'Sem categoria'}</span>
        <h1 className="pc-h1" style={{ fontSize: 'clamp(32px, 4vw, 46px)', marginTop: 8 }}>
          {projeto.title}
        </h1>
        <div className="pc-card-foot" style={{ border: 'none', paddingTop: 0, maxWidth: 320 }}>
          <span>{projeto.outlet ?? '—'}</span>
          <span>{formatDataCompleta(projeto.published_at)}</span>
        </div>
      </div>

      <div className="pc-wrap">
        <div className="pc-detail-body">
          {(projeto.content ?? projeto.summary ?? '')
            .split('\n\n')
            .filter(Boolean)
            .map((par, i) => <p key={i}>{par}</p>)}

          {projeto.external_url && (
            <a
              href={projeto.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="pc-btn"
              style={{ marginBottom: 24, display: 'inline-block' }}
            >
              Ver matéria original
            </a>
          )}

          {projeto.links.length > 0 && (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 4px' }}>Links</h3>
              <div className="pc-files">
                {projeto.links.map((link, i) => (
                  <a
                    key={i}
                    className="pc-file-link"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🔗 {link.description || link.url}
                  </a>
                ))}
              </div>
            </>
          )}

          {fotos.length > 0 && (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 4px' }}>Fotos</h3>
              <div className="pc-carousel">
                <div className="pc-carousel-track" ref={carouselRef}>
                  {fotos.map((a) => (
                    <a
                      key={a.id}
                      className="pc-carousel-slide"
                      href={publicUrl('project-files', a.file_path) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={publicUrl('project-files', a.file_path) ?? undefined} alt={a.file_name} />
                    </a>
                  ))}
                </div>
                {fotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="pc-carousel-nav pc-carousel-prev"
                      onClick={() => scrollCarousel('prev')}
                      aria-label="Foto anterior"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="pc-carousel-nav pc-carousel-next"
                      onClick={() => scrollCarousel('next')}
                      aria-label="Próxima foto"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {outrosArquivos.length > 0 && (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 4px' }}>Anexos</h3>
              <div className="pc-files">
                {outrosArquivos.map((a) => (
                  <a
                    key={a.id}
                    className="pc-file-link"
                    href={publicUrl('project-files', a.file_path) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={a.file_name}
                  >
                    ⬇ {a.file_name}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
