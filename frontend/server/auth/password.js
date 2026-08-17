/**
 * A&L Talent — Utilitários Criptográficos de Senha
 *
 * Utiliza scrypt com salt aleatório e verificação timing-safe.
 */

import crypto from 'crypto'

const DUMMY_SALT = '0123456789abcdef0123456789abcdef'
const DUMMY_PASSWORD = 'dummy_comparison_password_for_timing_safety'

/**
 * Gera hash scrypt seguro com salt aleatório de 16 bytes
 * @param {string} password
 * @returns {string} `<salt_hex>:<hash_hex>`
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verifica senha contra hash scrypt armazenado usando timingSafeEqual
 * @param {string} password
 * @param {string} stored `<salt_hex>:<hash_hex>`
 * @returns {boolean}
 */
export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) {
    return false
  }

  const [salt, key] = stored.split(':')
  if (!salt || !key) return false

  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex')
    if (hash.length !== key.length) return false
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(key, 'utf8'))
  } catch (err) {
    return false
  }
}

/**
 * Executa scrypt dummy para mitigar ataques de enumeração de contas por timing
 */
export function dummyPasswordVerify() {
  try {
    crypto.scryptSync(DUMMY_PASSWORD, DUMMY_SALT, 64)
  } catch (_) {}
}

/**
 * Validação de política de senha: mínimo 8 caracteres, máximo 128
 * @param {string} password
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePasswordPolicy(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'A senha é obrigatória.' }
  }
  if (password.length < 8) {
    return { valid: false, error: 'A senha deve ter no mínimo 8 caracteres.' }
  }
  if (password.length > 128) {
    return { valid: false, error: 'A senha deve ter no máximo 128 caracteres.' }
  }
  return { valid: true }
}
