/**
 * A&L Talent — Configuração de Rate Limiting por IP (express-rate-limit)
 */

import rateLimit from 'express-rate-limit'

export const isTestEnv = () => process.env.NODE_ENV === 'test'

/**
 * Limitador para tentativas de login de candidatos e definição de senha
 * Em produção: 10 requisições a cada 15 minutos por IP
 * Em desenvolvimento: 500 requisições
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTestEnv() && req.headers['x-test-bypass'] === 'ael-test-suite',
  message: {
    error: 'Muitas tentativas de autenticação a partir deste endereço. Tente novamente em 15 minutos.',
  },
})

/**
 * Limitador estrito para recuperação e redefinição de senha
 * Em produção: 5 requisições a cada 15 minutos por IP
 * Em desenvolvimento: 200 requisições
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTestEnv() && req.headers['x-test-bypass'] === 'ael-test-suite',
  message: {
    error: 'Muitas solicitações de recuperação de senha. Tente novamente em 15 minutos.',
  },
})

/**
 * Limitador para login administrativo do RH
 * Em produção: 10 requisições a cada 15 minutos por IP
 * Em desenvolvimento: 500 requisições
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTestEnv() && req.headers['x-test-bypass'] === 'ael-test-suite',
  message: {
    message: 'Muitas tentativas de login administrativo. Tente novamente em 15 minutos.',
  },
})

/**
 * Limitador para formulários de candidatura e cadastro público
 * Em produção: 30 requisições a cada 15 minutos por IP
 * Em desenvolvimento: 1000 requisições
 */
export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTestEnv() && req.headers['x-test-bypass'] === 'ael-test-suite',
  message: {
    error: 'Limite de envios atingido. Aguarde alguns minutos antes de tentar novamente.',
  },
})

const emailRequestTimestamps = new Map()

// Limpa entradas antigas a cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, timestamp] of emailRequestTimestamps.entries()) {
        if (now - timestamp > 10 * 60 * 1000) {
          emailRequestTimestamps.delete(key)
        }
      }
    },
    10 * 60 * 1000
  ).unref?.()
}

/**
 * Trava de Cooldown de 60 segundos por e-mail e por IP
 */
export function emailCooldownLimiter(req, res, next) {
  if (req.headers['x-test-bypass'] === 'ael-test-suite') {
    return next()
  }

  const email = (req.body?.email || '').trim().toLowerCase()
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  const key = `${ip}:${email}`

  const now = Date.now()
  const lastRequest = emailRequestTimestamps.get(key)
  const COOLDOWN_MS = 60 * 1000 // 60 segundos

  if (lastRequest && now - lastRequest < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastRequest)) / 1000)
    return res.status(429).json({
      success: false,
      error: `Por favor, aguarde ${remainingSeconds} segundo(s) antes de solicitar um novo código.`,
      retry_after_seconds: remainingSeconds,
    })
  }

  emailRequestTimestamps.set(key, now)
  next()
}
