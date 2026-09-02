import { formatDate } from '@/utils/notes'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { EditIcon, TrashIcon } from '@/components/icons'
import type { Note } from './types'

interface NotesListProps {
  notes: Note[]
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

export function NotesList({ notes, onEdit, onDelete }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">No hay notas aún. Crea tu primera nota.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardBody className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium text-slate-900">{note.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{note.content}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(note.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(note)}
                  aria-label={`Editar "${note.title}"`}
                >
                  <EditIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(note.id)}
                  aria-label={`Eliminar "${note.title}"`}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}