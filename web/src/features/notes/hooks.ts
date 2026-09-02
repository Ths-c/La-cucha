import { useState, useCallback, useEffect } from 'react'
import type { Note } from './types'
import {
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  generateId,
} from '@/utils/notes'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setNotes(getNotes())
    setIsLoading(false)
  }, [])

  const createNote = useCallback((title: string, content: string) => {
    const newNote: Note = {
      id: generateId(),
      title,
      content,
      createdAt: new Date().toISOString(),
    }
    addNote(newNote)
    setNotes((prev) => [newNote, ...prev])
  }, [])

  const editNote = useCallback((id: string, title: string, content: string) => {
    const updated: Note = {
      id,
      title,
      content,
      createdAt: new Date().toISOString(),
    }
    updateNote(updated)
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
  }, [])

  const removeNote = useCallback((id: string) => {
    deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const refresh = useCallback(() => {
    setNotes(getNotes())
  }, [])

  return {
    notes,
    isLoading,
    createNote,
    editNote,
    removeNote,
    refresh,
  }
}