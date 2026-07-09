import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { publicUrl } from '@/lib/uploads'
import { formatMesAno } from '@/lib/format'
import type { PublicContext } from '@/layouts/PublicLayout'

type ProjectCard = {
  id: string
  title: string
  summary: string | null
  outlet: string | null
  published_at: string | null
  cover_path: string | null
}

export default function Categoria() {
  const { slug } = useParams()
  const { categorias } = useOutletContext<PublicContext>()
  const [projetos, setProjetos] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)

  const categoria = categorias.find((c) => c.slug === slug)

  useEffect(() => {
    if (!categoria) {
      setLoading(false)
      return
    }
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('projects')
        .select('id, title, summary, outlet, published_at, cover_path')
        .eq('status', 'published')
        .eq('category_id', categoria!.id)
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false })
      if (!cancelled) setProjetos(data ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [categoria])

  if (!categoria) {
    return (
      <div className="pc-wrap" style={{ padding: 64, textAlign: 'center', color: 'var(--muted)' }}>
        Categoria não encontrada.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="pc-wrap" style={{ padding: 64, textAlign: 'center', color: 'var(--muted)' }}>
        Carregando…
      </div>
    )
  }

  return (
    <main className="pc-wrap pc-projetos">
      <h1 className="pc-section-title">{categoria.name}</h1>
      <div className="pc-grid">
        {projetos.map((p) => (
          <Link key={p.id} to={`/projeto/${p.id}`} className="pc-card">
            {p.cover_path && (
              <img
                className="pc-card-cover"
                src={publicUrl('public-assets', p.cover_path) ?? undefined}
                alt=""
              />
            )}
            <div className="pc-card-body">
              <span className="pc-card-cat">{categoria.name}</span>
              <h3>{p.title}</h3>
              {p.summary && <p>{p.summary}</p>}
              <div className="pc-card-foot">
                <span>{p.outlet ?? '—'}</span>
                <span>{formatMesAno(p.published_at)}</span>
              </div>
            </div>
          </Link>
        ))}
        {projetos.length === 0 && (
          <p style={{ color: 'var(--muted)', gridColumn: '1 / -1', textAlign: 'center' }}>
            Nenhum projeto publicado nesta categoria ainda.
          </p>
        )}
      </div>
    </main>
  )
}
