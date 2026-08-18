import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../server/auth/password.js'
import {
  signCandidateToken,
  verifyCandidateToken,
  signAdminToken,
  verifyAdminToken,
  generateResetToken,
  hashResetToken,
} from '../../server/auth/tokens.js'

describe('Auth Password Hashing (Scrypt)', () => {
  it('deve gerar hash scrypt com salt e formato correto', async () => {
    const password = 'MinhaSenhaSegura@2026'
    const hash = await hashPassword(password)

    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
    expect(hash.includes(':')).toBe(true)
    const [saltHex, derivedKeyHex] = hash.split(':')
    expect(saltHex.length).toBe(32) // 16 bytes = 32 hex chars
    expect(derivedKeyHex.length).toBe(128) // 64 bytes = 128 hex chars
  })

  it('deve validar senha correta com sucesso', async () => {
    const password = 'SenhaCorreta#123'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('deve rejeitar senha incorreta', async () => {
    const password = 'SenhaCorreta#123'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword('SenhaErrada#999', hash)
    expect(isValid).toBe(false)
  })

  it('deve rejeitar hash inválido ou corrompido de forma segura sem lançar exceção não tratada', async () => {
    const isValid1 = await verifyPassword('qualquer', 'invalido')
    const isValid2 = await verifyPassword('qualquer', '')
    const isValid3 = await verifyPassword('qualquer', null)
    expect(isValid1).toBe(false)
    expect(isValid2).toBe(false)
    expect(isValid3).toBe(false)
  })
})

describe('Auth Tokens (Candidate & Admin)', () => {
  it('deve gerar e verificar token de candidato com payload integro', () => {
    const candidate = {
      candidate_id: 2048,
      first_name: 'Carlos',
      last_name: 'Menezes',
      email: 'carlos.menezes@example.com',
      type: 'candidate',
    }

    const token = signCandidateToken(candidate)
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const verified = verifyCandidateToken(token)
    expect(verified).toBeDefined()
    expect(verified.candidate_id).toBe(2048)
    expect(verified.email).toBe('carlos.menezes@example.com')
    expect(verified.type).toBe('candidate')
  })

  it('deve gerar e verificar token de administrador com papel e permissões', () => {
    const user = {
      user_id: 1,
      username: 'admin.rh',
      first_name: 'Gestor',
      last_name: 'RH',
      access_level: 400,
      type: 'admin',
    }

    const token = signAdminToken(user)
    expect(token).toBeDefined()

    const verified = verifyAdminToken(token)
    expect(verified).toBeDefined()
    expect(verified.user_id).toBe(1)
    expect(verified.access_level).toBe(400)
    expect(verified.type).toBe('admin')
  })

  it('deve rejeitar token adulterado ou com assinatura inválida', () => {
    const token = signCandidateToken({ candidate_id: 100, email: 'teste@ex.com' })
    const tampered = token.slice(0, -4) + 'abcd'
    expect(verifyCandidateToken(tampered)).toBeNull()
    expect(verifyCandidateToken('token_totalmente_invalido')).toBeNull()
  })

  it('deve gerar e hashear código de recuperação de 6 dígitos com SHA-256', () => {
    const { code, token, tokenHash, expiresAt } = generateResetToken()
    expect(code.length).toBe(6) // 6 dígitos numéricos
    expect(/^\d{6}$/.test(code)).toBe(true)
    expect(token).toBe(code)
    expect(tokenHash.length).toBe(64) // SHA-256 hex
    expect(hashResetToken(code)).toBe(tokenHash)
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
  })
})

