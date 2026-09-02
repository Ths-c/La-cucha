import type { Note } from '@/features/notes/types'

const STORAGE_KEY = 'lacucha:notes'

export function getNotes(): Note[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function addNote(note: Note): void {
  const notes = getNotes()
  notes.unshift(note)
  saveNotes(notes)
}

export function updateNote(updated: Note): void {
  const notes = getNotes()
  const idx = notes.findIndex((n) => n.id === updated.id)
  if (idx >= 0) {
    notes[idx] = updated
    saveNotes(notes)
  }
}

export function deleteNote(id: string): void {
  const notes = getNotes().filter((n) => n.id !== id)
  saveNotes(notes)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function buildWhatsAppMessage(notes: Note[]): string {
  if (notes.length === 0) return ''

  const lines: string[] = []
  for (const note of notes) {
    lines.push(`**${note.title}**`)
    lines.push(note.content)
    lines.push('---')
  }
  lines.pop()
  return lines.join('\n')
}