/**
 * A&L Talent — Testes Unitários do Módulo de E-mail Transacional (Brevo)
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildResetUrl,
  clearMockSentEmails,
  getMockSentEmails,
  maskEmailForLogs,
  renderFirstAccessTemplate,
  renderPasswordResetTemplate,
  renderTestEmailTemplate,
  resetEmailTransporter,
  sanitizeHeader,
  sendFirstAccessEmail,
  sendPasswordResetEmail,
  sendTestEmail,
  sendTransactionalEmail,
  verifyEmailTransport,
} from '../../server/email/index.js'

describe('Email Service (Brevo SMTP & Templates)', () => {
  beforeEach(() => {
    process.env.TEST_EMAIL_MODE = 'mock'
    process.env.APP_URL = 'https://carreiras.aelengenharia.com.br'
    resetEmailTransporter()
    clearMockSentEmails()
  })

  describe('Sanitização & Segurança', () => {
    it('deve remover quebras de linha e tabulações para evitar Header Injection (CRLF)', () => {
      const maliciousSubject = 'Assunto Seguro\r\nBcc: hacker@exemplo.com\n\tInjeção'
      const sanitized = sanitizeHeader(maliciousSubject)
      expect(sanitized).toBe('Assunto SeguroBcc: hacker@exemplo.comInjeção')
      expect(sanitized).not.toContain('\r')
      expect(sanitized).not.toContain('\n')
      expect(sanitized).not.toContain('\t')
    })

    it('deve mascarar e-mails para logs preservando LGPD', () => {
      expect(maskEmailForLogs('candidato@aelengenharia.com.br')).toBe('ca******o@aelengenharia.com.br')
      expect(maskEmailForLogs('jo@empresa.com')).toBe('j*@empresa.com')
      expect(maskEmailForLogs('')).toBe('[empty]')
      expect(maskEmailForLogs('invalido')).toBe('[invalid_email]')
    })

    it('deve construir URL segura de redefinição de senha com URL Encoding', () => {
      const token = 'token+com espaços&simbolos=123'
      const url = buildResetUrl(token)
      expect(url).toBe('https://carreiras.aelengenharia.com.br/#/reset-password?token=token%2Bcom%20espa%C3%A7os%26simbolos%3D123')
    })
  })

  describe('Renderização de Templates', () => {
    it('deve renderizar template de Recuperação de Senha com link e código de 6 dígitos', () => {
      const tpl = renderPasswordResetTemplate({
        name: 'Maria Silva',
        resetUrl: 'https://carreiras.aelengenharia.com.br/#/reset-password?token=abc123xyz',
        code: '582910',
        expiresInMinutes: 15,
      })

      expect(tpl.subject).toBe('A&L Talent — Redefinição de senha')
      expect(tpl.html).toContain('Maria Silva')
      expect(tpl.html).toContain('582910')
      expect(tpl.html).toContain('https://carreiras.aelengenharia.com.br/#/reset-password?token=abc123xyz')
      expect(tpl.html).toContain('15 minutos')
      expect(tpl.text).toContain('582910')
    })

    it('deve renderizar template de Primeiro Acesso com boas-vindas e ativação', () => {
      const tpl = renderFirstAccessTemplate({
        name: 'Carlos Oliveira',
        resetUrl: 'https://carreiras.aelengenharia.com.br/#/reset-password?token=first123',
        code: '901234',
        expiresInMinutes: 15,
      })

      expect(tpl.subject).toBe('A&L Talent — Primeiro acesso')
      expect(tpl.html).toContain('Carlos Oliveira')
      expect(tpl.html).toContain('901234')
      expect(tpl.html).toContain('Bem-vindo(a) ao A&L Talent!')
      expect(tpl.text).toContain('901234')
    })

    it('deve renderizar template de Teste do Brevo', () => {
      const tpl = renderTestEmailTemplate({
        to: 'teste@aelengenharia.com.br',
        timestamp: '2026-08-18T15:00:00.000Z',
      })

      expect(tpl.subject).toContain('Teste de E-mail Transacional')
      expect(tpl.html).toContain('teste@aelengenharia.com.br')
      expect(tpl.html).toContain('Brevo SMTP Relay')
    })
  })

  describe('Envio Mock & Integração de Serviços', () => {
    it('deve disparar e-mail de recuperação de senha com mock transporter', async () => {
      const result = await sendPasswordResetEmail({
        toEmail: 'candidato.teste@exemplo.com',
        candidateName: 'Diran Silva',
        token: 'token_reset_999',
        code: '456789',
        requestId: 'test-req-01',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()

      const sent = getMockSentEmails()
      expect(sent.length).toBe(1)
      expect(sent[0].to).toBe('candidato.teste@exemplo.com')
      expect(sent[0].subject).toBe('A&L Talent — Redefinição de senha')
      expect(sent[0].html).toContain('456789')
    })

    it('deve disparar e-mail de primeiro acesso com mock transporter', async () => {
      const result = await sendFirstAccessEmail({
        toEmail: 'novo.talento@exemplo.com',
        candidateName: 'Ana Souza',
        token: 'token_primeiro_888',
        code: '123456',
        requestId: 'test-req-02',
      })

      expect(result.success).toBe(true)
      const sent = getMockSentEmails()
      expect(sent.length).toBe(1)
      expect(sent[0].to).toBe('novo.talento@exemplo.com')
      expect(sent[0].subject).toBe('A&L Talent — Primeiro acesso')
    })

    it('deve verificar status do transporte com verifyEmailTransport', async () => {
      const status = await verifyEmailTransport()
      expect(status).toBeDefined()
      expect(typeof status.ok).toBe('boolean')
    })
  })
})
