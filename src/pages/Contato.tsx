import { useEffect, useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SOCIAL_LABELS, socialHref } from '@/lib/social'
import type { PublicContext } from '@/layouts/PublicLayout'

export default function Contato() {
  const { perfil } = useOutletContext<PublicContext>()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)

  useEffect(() => {
    if (!enviado) return
    const timer = setTimeout(() => setEnviado(false), 5000)
    return () => clearTimeout(timer)
  }, [enviado])

  async function enviarMensagem(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setEnviando(true)
    setErroForm(null)
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    })
    setEnviando(false)
    if (error) {
      setErroForm(error.message)
      return
    }
    setEnviado(true)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <section className="pc-wrap pc-contato">
      <h1 className="pc-section-title">Entre em Contato</h1>
      <div className="pc-contato-grid">
        <div>
          {perfil?.email && (
            <div className="pc-info">
              <span className="pc-info-icon">✉</span>
              <div>
                <b>Email</b>
                <span>{perfil.email}</span>
              </div>
            </div>
          )}
          {perfil?.city && (
            <div className="pc-info">
              <span className="pc-info-icon">📍</span>
              <div>
                <b>Localização</b>
                <span>{perfil.city}</span>
              </div>
            </div>
          )}
          {perfil?.social_links &&
            Object.entries(perfil.social_links).some(([, v]) => v?.trim()) && (
              <div className="pc-info">
                <span className="pc-info-icon">🔗</span>
                <div>
                  <b>Redes sociais</b>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {Object.entries(perfil.social_links)
                      .filter(([, v]) => v?.trim())
                      .map(([platform, value]) => (
                        <a
                          key={platform}
                          href={socialHref(platform, value)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--sub)', fontSize: 15.5 }}
                        >
                          {SOCIAL_LABELS[platform] ?? platform}
                        </a>
                      ))}
                  </div>
                </div>
              </div>
            )}
        </div>

        <div>
          {enviado ? (
            <div className="pc-ok">Mensagem enviada! Obrigado pelo contato — respondo em breve.</div>
          ) : (
            <form onSubmit={enviarMensagem}>
              {erroForm && <div className="pc-error">{erroForm}</div>}
              <label className="pc-label" htmlFor="contact-name">
                Nome
              </label>
              <input
                id="contact-name"
                className="pc-input"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <label className="pc-label" htmlFor="contact-email">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                className="pc-input"
                placeholder="seu.email@exemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <label className="pc-label" htmlFor="contact-message">
                Mensagem
              </label>
              <textarea
                id="contact-message"
                className="pc-textarea"
                placeholder="Sua mensagem..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              <button type="submit" className="pc-btn" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar mensagem'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
