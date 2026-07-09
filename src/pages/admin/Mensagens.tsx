import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useConfirm } from '@/components/ConfirmDialogProvider'
import type { AdminContext } from '@/layouts/AdminLayout'

type Mensagem = {
  id: string
  name: string
  email: string
  message: string
  read: boolean
  created_at: string
}

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso)
  )
}

export default function Mensagens() {
  const confirm = useConfirm()
  const { refreshNaoLidas } = useOutletContext<AdminContext>()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('contact_messages')
      .select('id, name, email, message, read, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setMensagens(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function marcarComoLida(m: Mensagem) {
    setMensagens((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: true } : x)))
    const { error } = await supabase.from('contact_messages').update({ read: true }).eq('id', m.id)
    if (error) {
      setError(error.message)
      load()
    }
    refreshNaoLidas()
  }

  async function excluirMensagem(m: Mensagem) {
    const ok = await confirm({
      title: 'Excluir mensagem',
      message: `Excluir a mensagem de "${m.name}"? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return

    setMensagens((prev) => prev.filter((x) => x.id !== m.id))
    const { error } = await supabase.from('contact_messages').delete().eq('id', m.id)
    if (error) {
      setError(error.message)
      load()
    }
    refreshNaoLidas()
  }

  return (
    <>
      <div className="ad-head">
        <h1 className="ad-h1">Mensagens recebidas</h1>
      </div>

      {error && <p style={{ color: '#B3261E', marginBottom: 12, fontSize: 14 }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Carregando…</p>
      ) : (
        <div className="ad-card">
          {mensagens.map((m) => (
            <div key={m.id} className="ad-msg" data-nova={!m.read}>
              {!m.read && <span className="ad-dot" title="Não lida" />}
              <span className="ad-avatar">{iniciais(m.name)}</span>
              <div style={{ flex: 1 }}>
                <div className="ad-msg-top">
                  <b>
                    {m.name} <small>· {m.email}</small>
                  </b>
                  <small>{formatDateTime(m.created_at)}</small>
                </div>
                <p>{m.message}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!m.read && (
                    <button type="button" className="ad-mini" onClick={() => marcarComoLida(m)}>
                      Marcar como lida
                    </button>
                  )}
                  <button
                    type="button"
                    className="ad-mini ad-mini-danger"
                    onClick={() => excluirMensagem(m)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
          {mensagens.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              Nenhuma mensagem recebida ainda.
            </div>
          )}
        </div>
      )}
    </>
  )
}
