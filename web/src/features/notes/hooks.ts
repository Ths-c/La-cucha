import { useState, useCallback, useEffect } from 'react'
import type { Note } from './types'
import {
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  generateId,
  getConfiguredWhatsAppNumber,
  setConfiguredWhatsAppNumber,
  clearConfiguredWhatsAppNumber,
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

// Número de WhatsApp destino del envío de notas (persistido en localStorage).
// `saveNumber` valida/normaliza y lanza Error si el valor es inválido.
export function useWhatsAppNumber() {
  const [number, setNumber] = useState(() => getConfiguredWhatsAppNumber())

  const saveNumber = useCallback((raw: string) => {
    const normalized = setConfiguredWhatsAppNumber(raw)
    setNumber(normalized)
    return normalized
  }, [])

  const clearNumber = useCallback(() => {
    clearConfiguredWhatsAppNumber()
    setNumber('')
  }, [])

  return { number, saveNumber, clearNumber }
}