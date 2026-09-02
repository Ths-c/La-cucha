// Almacenamiento del token de autenticación del dueño en localStorage.
// No es crítico (es un panel de un solo usuario), pero se limpia ante 401.

const TOKEN_KEY = 'lacucha.auth.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// Evento global que dispara el cierre de sesión ante un 401.
export const AUTH_UNAUTHORIZED_EVENT = 'lacucha:unauthorized'

export function emitUnauthorized(): void {
  clearToken()
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
}