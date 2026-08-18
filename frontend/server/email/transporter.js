/**
 * A&L Talent — Transporter Oficial de E-mail (Brevo SMTP Relay)
 *
 * Suporte a:
 * - Brevo SMTP Relay (smtp-relay.brevo.com:587)
 * - Modos de teste/mock em memória e log em desenvolvimento
 * - Timeouts rigorosos (10s conexão, 15s socket)
 * - Verificação de integridade (verifyEmailTransport)
 */

import nodemailer from 'nodemailer'

let transporter = null
let mockSentEmails = []

/**
 * Cria ou recupera o transporter ativo do Nodemailer
 * @returns {import('nodemailer').Transporter}
 */
export function getEmailTransporter() {
  if (transporter) return transporter

  const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_EMAIL_MODE === 'mock'
  const isDevMock = process.env.DEV_EMAIL_MODE === 'mock'

  if (isTest || isDevMock) {
    transporter = createMockTransporter()
    return transporter
  }

  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com'
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true' || port === 465

  // Se credenciais estiverem configuradas, conecta ao Brevo / SMTP real
  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000, // 10s timeout de conexão
      greetingTimeout: 10000, // 10s timeout de handshake
      socketTimeout: 15000, // 15s timeout de socket
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    })
  } else {
    // Modo de fallback seguro para desenvolvimento local sem SMTP configurado
    transporter = createDevLogTransporter()
  }

  return transporter
}

/**
 * Cria transporter de log para desenvolvimento local
 */
function createDevLogTransporter() {
  return {
    sendMail: async (mailOptions) => {
      const now = new Date().toISOString()
      console.log('\n======================================================================')
      console.log(`📧 [BREVO SMTP DEV / SIMULAÇÃO] — ${now}`)
      console.log(`Para: ${mailOptions.to}`)
      console.log(`De: ${mailOptions.from}`)
      console.log(`Assunto: ${mailOptions.subject}`)
      if (mailOptions.text) console.log(`Texto:\n${mailOptions.text}`)
      console.log('======================================================================\n')
      return {
        messageId: `dev-mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        response: '250 Mock email accepted',
      }
    },
    verify: async () => true,
  }
}

/**
 * Cria transporter em memória para testes automatizados unitários/CI
 */
function createMockTransporter() {
  return {
    sendMail: async (mailOptions) => {
      const messageId = `test-mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      mockSentEmails.push({
        ...mailOptions,
        messageId,
        sentAt: new Date(),
      })
      return {
        messageId,
        response: '250 Test mock email delivered',
      }
    },
    verify: async () => true,
  }
}

/**
 * Retorna lista de e-mails enviados em modo mock (apenas testes)
 */
export function getMockSentEmails() {
  return [...mockSentEmails]
}

/**
 * Limpa histórico de e-mails mock
 */
export function clearMockSentEmails() {
  mockSentEmails = []
}

/**
 * Reseta o transporter para forçar recriação (útil em testes)
 */
export function resetEmailTransporter() {
  transporter = null
  mockSentEmails = []
}

/**
 * Verifica status de configuração e conectividade SMTP
 * @returns {Promise<{ configured: boolean, ok: boolean, error?: string }>}
 */
export async function verifyEmailTransport() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    return {
      configured: false,
      ok: process.env.NODE_ENV !== 'production',
      error: 'SMTP_USER ou SMTP_PASS não configurados.',
    }
  }

  try {
    const t = getEmailTransporter()
    if (typeof t.verify === 'function') {
      await t.verify()
      return { configured: true, ok: true }
    }
    return { configured: true, ok: true }
  } catch (err) {
    return {
      configured: true,
      ok: false,
      error: err.message,
    }
  }
}
