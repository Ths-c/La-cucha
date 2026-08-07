// Logger mínimo y estructurado (JSON) con niveles. No se registran secretos:
// solo mensajes, contexto y códigos de error.

type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function shouldLog(level: Level): boolean {
  const configured = (process.env.LOG_LEVEL ?? 'info') as Level
  return LEVEL_PRIORITY[level] >= (LEVEL_PRIORITY[configured] ?? 20)
}

function write(level: Level, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return
  const entry: Record<string, unknown> = { level, message, timestamp: new Date().toISOString() }
  if (context) Object.assign(entry, context)
  const line = JSON.stringify(entry)
  if (level === 'error' || level === 'warn') {
    console.error(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => write('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => write('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => write('error', message, context),
}