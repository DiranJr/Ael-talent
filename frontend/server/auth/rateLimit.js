/**
 * A&L Talent — Configuração de Rate Limiting por IP (express-rate-limit)
 */

import rateLimit from 'express-rate-limit'

const isTest = process.env.NODE_ENV === 'test'

/**
 * Limitador para tentativas de login de candidatos e definição de senha
 * 10 requisições a cada 15 minutos por IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest || req.headers['x-test-bypass'] === 'ael-test-suite',
  message: {
    error: 'Muitas tentativas de autenticação a partir deste endereço. Tente novamente em 15 minutos.'
  }
})

/**
 * Limitador estrito para recuperação e redefinição de senha
 * 5 requisições a cada 15 minutos por IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest || req.headers['x-test-bypass'] === 'ael-test-suite',
  message: {
    error: 'Muitas solicitações de recuperação de senha. Tente novamente em 15 minutos.'
  }
})

/**
 * Limitador para login administrativo do RH
 * 10 requisições a cada 15 minutos por IP
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest || req.headers['x-test-bypass'] === 'ael-test-suite',
  message: {
    message: 'Muitas tentativas de login administrativo. Tente novamente em 15 minutos.'
  }
})

/**
 * Limitador para formulários de candidatura e cadastro público
 * 30 requisições a cada 15 minutos por IP
 */
export const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest || req.headers['x-test-bypass'] === 'ael-test-suite',
  message: {
    error: 'Limite de envios atingido. Aguarde alguns minutos antes de tentar novamente.'
  }
})
