import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import '@/styles/admin.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/admin')
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 24 }}>
      <h1 className="ad-h1" style={{ marginBottom: 24 }}>
        Entrar
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="ad-field">
          <label className="ad-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="ad-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="ad-field">
          <label className="ad-label" htmlFor="login-password">
            Senha
          </label>
          <input
            id="login-password"
            className="ad-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p style={{ color: '#B45309', fontSize: 14, marginBottom: 14 }}>{error}</p>
        )}
        <button type="submit" className="ad-btn" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
