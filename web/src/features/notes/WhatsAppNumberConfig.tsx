import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface WhatsAppNumberConfigProps {
  number: string
  onSave: (raw: string) => void
  onClear: () => void
}

// Configuración del número destino del envío de notas por WhatsApp.
// Muestra el valor guardado con opción a editar, o el formulario directo
// si todavía no hay ninguno configurado.
export function WhatsAppNumberConfig({ number, onSave, onClear }: WhatsAppNumberConfigProps) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  const startEditing = () => {
    setDraft(number)
    setError(undefined)
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setError(undefined)
  }

  const handleSave = () => {
    if (!draft.trim()) {
      setError('Ingresá un número de WhatsApp')
      return
    }
    try {
      onSave(draft)
      setEditing(false)
      setError(undefined)
      toast.success('Número de WhatsApp guardado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Número inválido')
    }
  }

  const handleClear = () => {
    onClear()
    setEditing(false)
    setError(undefined)
    toast.info('Número de WhatsApp eliminado')
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Número: </span>
        <span className="font-medium text-slate-900">{number || '(no configurado)'}</span>
        <Button variant="ghost" size="sm" onClick={startEditing}>
          {number ? 'Editar' : 'Configurar'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="w-full sm:w-64">
        <Input
          id="whatsapp-number"
          label="Número de WhatsApp"
          placeholder="Ej: +5491100000000"
          hint="Con código de país. Se usa para enviar las notas."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          error={error}
          inputMode="tel"
        />
      </div>
      <div className="flex gap-2 pb-0.5">
        <Button size="sm" onClick={handleSave}>
          Guardar
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel}>
          Cancelar
        </Button>
        {number && (
          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={handleClear}>
            Quitar
          </Button>
        )}
      </div>
    </div>
  )
}
