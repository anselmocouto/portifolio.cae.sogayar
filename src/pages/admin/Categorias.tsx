import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'
import { useConfirm } from '@/components/ConfirmDialogProvider'
import type { PostgrestError } from '@supabase/supabase-js'

type RawCategory = {
  id: string
  name: string
  slug: string
  color: string
  sort_order: number
  projects: { count: number }[]
}

type CategoryRow = {
  id: string
  name: string
  slug: string
  color: string
  sort_order: number
  projectCount: number
}

const COR_PADRAO = '#3F4A5C'

export default function Categorias() {
  const confirm = useConfirm()
  const [categorias, setCategorias] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const [novoNome, setNovoNome] = useState('')
  const [novaCor, setNovaCor] = useState(COR_PADRAO)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)

    const { data, error } = (await supabase
      .from('categories')
      .select('id, name, slug, color, sort_order, projects(count)')
      .order('sort_order', { ascending: true })) as unknown as {
      data: RawCategory[] | null
      error: PostgrestError | null
    }

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setCategorias(
      (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        color: c.color,
        sort_order: c.sort_order,
        projectCount: c.projects?.[0]?.count ?? 0,
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function startRename(c: CategoryRow) {
    setRenamingId(c.id)
    setRenameValue(c.name)
  }

  async function confirmRename(id: string) {
    const name = renameValue.trim()
    setRenamingId(null)
    const original = categorias.find((c) => c.id === id)
    if (!original || !name || original.name === name) return

    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
    const { error } = await supabase
      .from('categories')
      .update({ name, slug: slugify(name) })
      .eq('id', id)

    if (error) {
      setError(error.message)
      load()
    }
  }

  async function mover(c: CategoryRow, direcao: 'up' | 'down') {
    const idx = categorias.findIndex((x) => x.id === c.id)
    const swapIdx = direcao === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= categorias.length) return
    const outra = categorias[swapIdx]

    const atualizado = categorias
      .map((x) => {
        if (x.id === c.id) return { ...x, sort_order: outra.sort_order }
        if (x.id === outra.id) return { ...x, sort_order: c.sort_order }
        return x
      })
      .sort((a, b) => a.sort_order - b.sort_order)
    setCategorias(atualizado)

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('categories').update({ sort_order: outra.sort_order }).eq('id', c.id),
      supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', outra.id),
    ])
    if (e1 || e2) {
      setError((e1 ?? e2)!.message)
      load()
    }
  }

  async function excluir(c: CategoryRow) {
    const aviso =
      c.projectCount > 0
        ? `"${c.name}" tem ${c.projectCount} projeto${c.projectCount !== 1 ? 's' : ''}. Eles ficarão sem categoria. Excluir mesmo assim?`
        : `Excluir a categoria "${c.name}"?`
    const ok = await confirm({ title: 'Excluir categoria', message: aviso, confirmLabel: 'Excluir', danger: true })
    if (!ok) return

    setCategorias((prev) => prev.filter((x) => x.id !== c.id))
    const { error } = await supabase.from('categories').delete().eq('id', c.id)

    if (error) {
      setError(error.message)
      load()
    }
  }

  async function adicionar() {
    const name = novoNome.trim()
    if (!name) return

    setSaving(true)
    const nextOrder = categorias.length
      ? Math.max(...categorias.map((c) => c.sort_order)) + 1
      : 0

    const { error } = await supabase.from('categories').insert({
      name,
      slug: slugify(name),
      color: novaCor,
      sort_order: nextOrder,
    })
    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }
    setNovoNome('')
    setNovaCor(COR_PADRAO)
    load()
  }

  return (
    <>
      <div className="ad-head">
        <h1 className="ad-h1">Categorias</h1>
      </div>

      {error && <p style={{ color: '#B3261E', marginBottom: 12, fontSize: 14 }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Carregando…</p>
      ) : (
        <div className="ad-card">
          {categorias.map((c, idx) => (
            <div key={c.id} className="ad-cat-row">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  type="button"
                  className="ad-mini"
                  disabled={idx === 0}
                  onClick={() => mover(c, 'up')}
                  style={{ padding: '1px 6px', lineHeight: 1 }}
                  aria-label="Mover para cima"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="ad-mini"
                  disabled={idx === categorias.length - 1}
                  onClick={() => mover(c, 'down')}
                  style={{ padding: '1px 6px', lineHeight: 1 }}
                  aria-label="Mover para baixo"
                >
                  ▼
                </button>
              </div>
              <span className="ad-swatch" style={{ background: c.color }} />
              {renamingId === c.id ? (
                <input
                  className="ad-input"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => confirmRename(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename(c.id)
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  style={{ flex: 1 }}
                />
              ) : (
                <span className="ad-cat-nome">{c.name}</span>
              )}
              <span className="ad-cat-count">
                {c.projectCount} projeto{c.projectCount !== 1 ? 's' : ''}
              </span>
              <button type="button" className="ad-mini" onClick={() => startRename(c)}>
                Renomear
              </button>
              <button type="button" className="ad-mini ad-mini-danger" onClick={() => excluir(c)}>
                Excluir
              </button>
            </div>
          ))}

          {categorias.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              Nenhuma categoria ainda.
            </div>
          )}

          <div className="ad-cat-add">
            <input
              className="ad-input"
              placeholder="Nova categoria..."
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && adicionar()}
            />
            <input
              type="color"
              value={novaCor}
              onChange={(e) => setNovaCor(e.target.value)}
              title="Cor da categoria"
              style={{
                width: 44,
                height: 44,
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-control)',
                padding: 2,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <button type="button" className="ad-btn" onClick={adicionar} disabled={saving}>
              {saving ? 'Adicionando…' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
