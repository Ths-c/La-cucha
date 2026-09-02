import { useState } from 'react'
import { PlusIcon, WhatsAppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useNotes } from '@/features/notes/hooks'
import { NoteForm } from '@/features/notes/NoteForm'
import { NotesList } from '@/features/notes/NotesList'
import { buildWhatsAppMessage } from '@/utils/notes'
import { buildWhatsAppUrl } from '@/utils/phone'
import type { Note } from '@/features/notes/types'

const WHATSAPP_NUMBER = '+5491155566677'

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

    const message = buildWhatsAppMessage(notes)
    const url = buildWhatsAppUrl(WHATSAPP_NUMBER, message)
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
          subtitle={`Número configurado: ${WHATSAPP_NUMBER}`}
          action={
            <Button
              variant="secondary"
              onClick={handleSendToWhatsApp}
              disabled={notes.length === 0}
            >
              <WhatsAppIcon className="size-4" />
              Enviar todas las notas
            </Button>
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