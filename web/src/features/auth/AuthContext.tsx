import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { API_URL } from '@/lib/api/client'
import { getToken, setToken, clearToken, AUTH_UNAUTHORIZED_EVENT } from '@/services/token'

interface AuthContextValue {
  isAuthenticated: boolean
  /** true mientras se restaura el token al cargar la app. */
  initializing: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const initializing = false

  // Si llega un 401 desde cualquier request, cerramos la sesión.
  useEffect(() => {
    const onUnauthorized = () => setTokenState(null)
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = (await res.json()) as { data?: { token: string }; error?: { message?: string } }
    if (!res.ok || !json.data?.token) {
      throw new Error(json.error?.message ?? 'No se pudo iniciar sesión.')
    }
    setToken(json.data.token)
    setTokenState(json.data.token)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
  }, [])

  const isAuthenticated = !!token

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, initializing, login, logout }),
    [isAuthenticated, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}