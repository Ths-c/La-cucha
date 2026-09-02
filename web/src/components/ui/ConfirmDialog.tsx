import { useRef, useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title="" size="md">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
}

/** Estado de confirmación imperativo: `await confirm({...})` -> boolean. */
export function useConfirm() {
  const [state, setState] = useState<ConfirmOptions & { open: boolean }>({ title: '', open: false })
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setState({ ...opts, open: true })
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }

  const close = (result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setState((s) => ({ ...s, open: false }))
  }

  const ConfirmationDialog = () => (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      tone={state.tone}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  )

  return { confirm, ConfirmationDialog }
}