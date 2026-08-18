/**
 * A&L Talent — Logger Estruturado JSON com Proteção Rigorosa de PII
 */

const PII_FIELDS = new Set([
  'password',
  'current_password',
  'password_hash',
  'token',
  'dev_reset_token',
  'reset_token_hash',
  'authorization',
  'bearer',
  'cookie',
  'resume',
  'buffer',
  'file',
  'curriculo',
])

/**
 * Sanitiza recursivamente objetos removendo ou mascarando PII
 */
export function sanitizeMeta(data) {
  if (!data || typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeMeta(item))
  }

  const cleaned = {}
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (
      PII_FIELDS.has(lowerKey) ||
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret')
    ) {
      cleaned[key] = '[REDACTED]'
    } else if (val && typeof val === 'object') {
      cleaned[key] = sanitizeMeta(val)
    } else {
      cleaned[key] = val
    }
  }
  return cleaned
}

function writeLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    ...(meta.requestId ? { request_id: meta.requestId } : {}),
    ...(meta.method ? { method: meta.method } : {}),
    ...(meta.route ? { route: meta.route } : {}),
    ...(meta.status !== undefined ? { status: meta.status } : {}),
    ...(meta.durationMs !== undefined ? { duration_ms: meta.durationMs } : {}),
    message: typeof message === 'string' ? message : JSON.stringify(sanitizeMeta(message)),
    ...(meta.extra ? { meta: sanitizeMeta(meta.extra) } : {}),
    ...(meta.error
      ? {
          error: {
            name: meta.error.name || 'Error',
            message: meta.error.message,
            ...(process.env.NODE_ENV !== 'production' && meta.error.stack ? { stack: meta.error.stack } : {}),
          },
        }
      : {}),
  }

  const out = JSON.stringify(entry)
  if (level === 'error') {
    process.stderr.write(`${out}\n`)
  } else {
    process.stdout.write(`${out}\n`)
  }
}

export const logger = {
  info: (msg, meta) => writeLog('info', msg, meta),
  warn: (msg, meta) => writeLog('warn', msg, meta),
  error: (msg, meta) => writeLog('error', msg, meta),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      writeLog('debug', msg, meta)
    }
  },
}
