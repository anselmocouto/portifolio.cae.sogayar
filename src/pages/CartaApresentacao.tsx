import { useOutletContext } from 'react-router-dom'
import type { PublicContext } from '@/layouts/PublicLayout'

export default function CartaApresentacao() {
  const { perfil } = useOutletContext<PublicContext>()

  if (!perfil?.personal_statement) {
    return (
      <div className="pc-wrap" style={{ padding: 64, textAlign: 'center', color: 'var(--muted)' }}>
        Nenhuma carta de apresentação cadastrada ainda.
      </div>
    )
  }

  return (
    <section className="pc-statement">
      <div className="pc-wrap">
        <h1 className="pc-section-title">Carta de Apresentação</h1>
        <div className="pc-statement-body">
          {perfil.personal_statement.split('\n\n').map((par, i) => (
            <p key={i}>{par}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
