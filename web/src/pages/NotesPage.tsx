import { useState } from 'react'
import { PlusIcon, WhatsAppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useNotes } from '@/features/notes/hooks'
import { NoteForm } from '@/features/notes/NoteForm'
import { NotesList } from '@/features/notes/NotesList'
import { sendNotesViaWhatsApp, getConfiguredWhatsAppNumber } from '@/utils/notes'
import type { Note } from '@/features/notes/types'

export function NotesPage() {
  const { notes, createNote, editNote, removeNote } = useNotes()
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  const handleCreate = (title: string, content: string) => {
    createNote(title, content)
    setFormOpen(false)
    toast('Nota creada', 'success')
  }

  const handleEdit = (title: string, content: string) => {
    if (editingNote) {
      editNote(editingNote.id, title, content)
      setFormOpen(false)
      setEditingNote(null)
      toast('Nota actualizada', 'success')
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta nota?')) {
      removeNote(id)
      toast('Nota eliminada', 'success')
    }
  }

  const handleSendToWhatsApp = () => {
    if (notes.length === 0) {
      toast('No hay notas para enviar', 'info')
      return
    }

    const url = sendNotesViaWhatsApp(notes)
    if (!url) {
      toast('Configurá un número de WhatsApp primero', 'info')
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
    toast('Abriendo WhatsApp...', 'info')
  }

  const openCreateForm = () => {
    setEditingNote(null)
    setFormOpen(true)
  }

  const openEditForm = (note: Note) => {
    setEditingNote(note)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas"
        subtitle="Tus notas personales"
        action={
          <Button variant="primary" onClick={openCreateForm}>
            <PlusIcon className="size-4" />
            Nueva nota
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="Enviar a WhatsApp"
          subtitle={
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Número: </span>
              <span className="font-medium text-slate-900">{getConfiguredWhatsAppNumber() || '(no configurado)'}</span>
            </div>
          }
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleSendToWhatsApp}
                disabled={notes.length === 0 || !getConfiguredWhatsAppNumber()}
              >
                <WhatsAppIcon className="size-4" />
                Enviar todas las notas
              </Button>
            </div>
          }
        />
        <CardBody className="pt-0">
          <NotesList notes={notes} onEdit={openEditForm} onDelete={handleDelete} />
        </CardBody>
      </Card>

      <NoteForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingNote(null)
        }}
        onSubmit={editingNote ? handleEdit : handleCreate}
        initialData={editingNote}
        isEditing={!!editingNote}
      />
    </div>
  )
}