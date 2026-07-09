import { Link, useOutletContext } from 'react-router-dom'
import { publicUrl } from '@/lib/uploads'
import { iniciaisDoNome } from '@/lib/format'
import type { PublicContext } from '@/layouts/PublicLayout'

export default function Home() {
  const { perfil } = useOutletContext<PublicContext>()

  return (
    <header className="pc-wrap" id="topo">
      <section className="pc-hero">
        <div>
          <h1 className="pc-h1">{perfil?.full_name || 'Portfólio'}</h1>
          {perfil?.headline && <p className="pc-sub">{perfil.headline}</p>}
          {perfil?.bio && <p className="pc-bio">{perfil.bio}</p>}
          <Link to="/carta-de-apresentacao" className="pc-btn">
            Carta de Apresentação
          </Link>
        </div>
        <div className="pc-foto">
          {perfil?.photo_path ? (
            <img
              src={publicUrl('public-assets', perfil.photo_path) ?? undefined}
              alt={perfil.full_name ?? ''}
            />
          ) : (
            <span className="pc-foto-ini">
              {perfil?.full_name ? iniciaisDoNome(perfil.full_name) : '—'}
            </span>
          )}
        </div>
      </section>
    </header>
  )
}
