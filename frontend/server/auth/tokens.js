/**
 * A&L Talent — Gerenciamento de Tokens de Sessão e Recuperação
 */

import crypto from 'crypto'

const isProd = process.env.NODE_ENV === 'production'

const CANDIDATE_SECRET = process.env.SESSION_SECRET || 'ael_talent_candidate_secret_2024'
const ADMIN_SECRET     = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || 'ael_talent_admin_secret_2024'

if (isProd) {
  if (CANDIDATE_SECRET === 'ael_talent_candidate_secret_2024' || CANDIDATE_SECRET.length < 32) {
    console.error('❌ CRÍTICO: SESSION_SECRET fraco (< 32 chars) ou padrão detectado em ambiente de produção!')
    process.exit(1)
  }
  if (ADMIN_SECRET === 'ael_talent_admin_secret_2024' || ADMIN_SECRET.length < 32) {
    console.error('❌ CRÍTICO: ADMIN_SESSION_SECRET fraco (< 32 chars) ou padrão detectado em ambiente de produção!')
    process.exit(1)
  }
}

const CANDIDATE_EXP_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias
const ADMIN_EXP_MS     = 24 * 60 * 60 * 1000      // 24 horas

/**
 * Emite token assinado para o candidato
 */
export function signCandidateToken(payload) {
  const tokenData = {
    ...payload,
    exp: Date.now() + CANDIDATE_EXP_MS,
  }
  const data = Buffer.from(JSON.stringify(tokenData)).toString('base64url')
  const sig = crypto.createHmac('sha256', CANDIDATE_SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

/**
 * Valida token do candidato de forma timing-safe
 */
export function verifyCandidateToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [data, sig] = parts
  if (!data || !sig) return null

  const expectedSig = crypto.createHmac('sha256', CANDIDATE_SECRET).update(data).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    if (!payload || typeof payload !== 'object') return null
    if (!payload.exp || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null
    if (!payload.candidate_id) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Emite token assinado para o RH / Admin
 */
export function signAdminToken(payload) {
  const tokenData = {
    ...payload,
    exp: Date.now() + ADMIN_EXP_MS,
  }
  const data = Buffer.from(JSON.stringify(tokenData)).toString('base64url')
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

/**
 * Valida token administrativo de forma timing-safe
 */
export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [data, sig] = parts
  if (!data || !sig) return null

  const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    if (!payload || typeof payload !== 'object') return null
    if (!payload.exp || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null
    if (!payload.user_id) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Gera token criptográfico de recuperação de senha (32 bytes) e seu hash SHA-256
 * @returns {{ token: string, tokenHash: string, expiresAt: Date }}
 */
export function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashResetToken(token)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
  return { token, tokenHash, expiresAt }
}

/**
 * Calcula SHA-256 do token de recuperação
 * @param {string} token
 * @returns {string}
 */
export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
