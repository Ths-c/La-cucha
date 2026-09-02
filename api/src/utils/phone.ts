// Normalización del número de WhatsApp para poder usarlo en una URL wa.me.

// Formato de salida: solo dígitos con `+` inicial (p. ej. `+5491155566677`).
// El número DEBE incluir el código de país. Se eliminan espacios, guiones,
// paréntesis y puntos del valor ingresado.
export const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/

/**
 * Normaliza un número de WhatsApp a `+<códigoDePaís><número>`, sin separator
 * visuales. Lanza Error si el valor es inválido.
 */
export function normalizeWhatsApp(raw: string): string {
  const digitsOnly = raw.replace(/[\s\-().]/g, '')
  if (!PHONE_REGEX.test(digitsOnly)) {
    throw new Error('Número de WhatsApp inválido')
  }
  return digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`
}

// Construye la URL de WhatsApp con el mensaje codificado.
// https://wa.me/<phone>?text=<encoded>
export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = phone.replace(/[\s\-().]/g, '')
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}