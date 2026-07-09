import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import '@/styles/confirm.css'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Substitui window.confirm por um diálogo próprio, estilizado. Uso: `if (!(await confirm('Excluir?'))) return`. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm precisa estar dentro de <ConfirmDialogProvider>.')
  return ctx
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    const normalized = typeof opts === 'string' ? { message: opts } : opts
    setOptions(normalized)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  function handle(result: boolean) {
    setOptions(null)
    resolveRef.current?.(result)
    resolveRef.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="confirm-overlay" role="presentation" onClick={() => handle(false)}>
          <div
            className="confirm-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-title" className="confirm-title">
              {options.title ?? 'Confirmar ação'}
            </h3>
            <p className="confirm-message">{options.message}</p>
            <div className="confirm-actions">
              <button type="button" className="confirm-btn" onClick={() => handle(false)}>
                {options.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                type="button"
                className={`confirm-btn ${options.danger ? 'confirm-btn-danger' : 'confirm-btn-primary'}`}
                onClick={() => handle(true)}
              >
                {options.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
