import { logger } from './logger'

// Utilidades de fechas dependientes de zona horaria. La zona se centraliza en
// config (TIMEZONE). No hardcodear zonas fuera de aquí.

// Retorna { year, month, day } para una fecha en la zona indicada.
function ymd(date: Date, timezone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0'
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')) }
}

// Devuelve [start, endExclusive) del mes de `ref` en la zona dada, como
// instantes UTC absolutos. end = inicio del mes siguiente.
function deriveMonthRange(timezone: string, ref: Date): { start: Date; end: Date } {
  const { year, month } = ymd(ref, timezone)
  const startLocal = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const endLocal = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  // Ajustamos para que el "día 1 00:00" corresponda al inicio de mes en TZ.
  const start = shiftToTzMidnight(startLocal, timezone)
  const end = shiftToTzMidnight(endLocal, timezone)
  return { start, end }
}

// Ajusta un Date "local-nominal" para que apunte al instante en que empieza ese
// día/mes EN la zona horaria deseada (no a las 00:00 UTC).
function shiftToTzMidnight(utcParsed: Date, timezone: string): Date {
  // utcParsed representa {Y,M,D 00:00} en UTC "nominal". Obtenemos el offset de
  // la TZ para ese día y restamos: inicio local = 00:00 local.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  }).formatToParts(utcParsed) as { type: string; value: string }[]
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value // p. ej. "-03"
  const offsetMinutes = parseOffsetMinutes(offsetPart ?? '')
  return new Date(utcParsed.getTime() - offsetMinutes * 60_000)
}

function parseOffsetMinutes(offsetToken: string): number {
  // Formato "GMT-03:00" / "-03:00".
  const m = offsetToken.match(/([+-])(\d{2})(?::?(\d{2}))?/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const hours = Number(m[2])
  const minutes = Number(m[3] ?? '00')
  return sign * (hours * 60 + minutes)
}

export function getMonthRange(timezone: string, ref: Date = new Date()): { start: Date; end: Date } {
  try {
    return deriveMonthRange(timezone, ref)
  } catch (err) {
    logger.warn('Fallback a rango UTC por error de zona horaria', { timezone, error: String(err) })
    const { year, month } = { year: ref.getUTCFullYear(), month: ref.getUTCMonth() + 1 }
    return { start: new Date(Date.UTC(year, month - 1, 1)), end: new Date(Date.UTC(year, month, 1)) }
  }
}