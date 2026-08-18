import { describe, it, expect } from 'vitest'
import { sanitizeMeta } from '../../server/logger.js'

describe('Logger Structured Sanitizer (Zero-PII)', () => {
  it('deve mascarar senhas, tokens e segredos em objetos simples', () => {
    const input = {
      user: 'admin',
      password: 'SuperSecretPassword#123',
      current_password: 'OldPassword123',
      token: 'jwt.token.here',
      reset_token_hash: 'hash-value',
      status: 200,
    }

    const sanitized = sanitizeMeta(input)
    expect(sanitized.user).toBe('admin')
    expect(sanitized.password).toBe('[REDACTED]')
    expect(sanitized.current_password).toBe('[REDACTED]')
    expect(sanitized.token).toBe('[REDACTED]')
    expect(sanitized.reset_token_hash).toBe('[REDACTED]')
    expect(sanitized.status).toBe(200)
  })

  it('deve mascarar campos aninhados e buffers de currículo', () => {
    const input = {
      action: 'apply',
      payload: {
        candidate_email: 'candidato@test.com',
        auth: {
          bearer: 'secret-bearer-token',
        },
        curriculo: Buffer.from('PDF content'),
      }
    }

    const sanitized = sanitizeMeta(input)
    expect(sanitized.payload.candidate_email).toBe('candidato@test.com')
    expect(sanitized.payload.auth.bearer).toBe('[REDACTED]')
    expect(sanitized.payload.curriculo).toBe('[REDACTED]')
  })
})
