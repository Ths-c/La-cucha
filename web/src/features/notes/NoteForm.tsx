import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { Note } from './types'

interface NoteFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, content: string) => void
  initialData?: Note | null
  isEditing?: boolean
}

export function NoteForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: NoteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ title: string; content: string }>()

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({ title: initialData.title, content: initialData.content })
      } else {
        reset({ title: '', content: '' })
      }
      setTimeout(() => {
        const input = document.getElementById('note-title') as HTMLInputElement
        input?.focus()
      }, 0)
    }
  }, [isOpen, initialData, reset])

  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    reset()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="note-form-title">
        <h2 id="note-form-title" className="mb-4 text-lg font-semibold text-slate-900">
          {isEditing ? 'Editar nota' : 'Nueva nota'}
        </h2>

        <form onSubmit={handleSubmit((data) => onSubmit(data.title, data.content))} className="space-y-4">
          <Input
            id="note-title"
            label="Título"
            placeholder="Título de la nota"
            error={errors.title?.message}
            maxLength={100}
            {...register('title', {
              required: 'El título es obligatorio',
              maxLength: { value: 100, message: 'Máximo 100 caracteres' },
            })}
          />

          <Textarea
            id="note-content"
            label="Contenido"
            placeholder="Escribe tu nota aquí..."
            error={errors.content?.message}
            rows={6}
            maxLength={5000}
            {...register('content', {
              required: 'El contenido es obligatorio',
              maxLength: { value: 5000, message: 'Máximo 5000 caracteres' },
            })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? 'Guardar cambios' : 'Crear nota'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}