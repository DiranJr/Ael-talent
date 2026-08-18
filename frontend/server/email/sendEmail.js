/**
 * A&L Talent — Serviço Centralizado de Envio de E-mails Transacionais
 *
 * Funcionalidades:
 * - Sanitização rigorosa contra Email Header Injection (CWE-93 / CRLF Injection)
 * - Safe Logging sem vazamento de PII, senhas ou tokens secretos
 * - Resiliência com 1 retry simples para falhas transitórias de conexão
 * - Padronização de Remetente (Brevo) e Reply-To
 */

import { renderFirstAccessTemplate, renderPasswordResetTemplate, renderTestEmailTemplate } from './templates.js'
import { getEmailTransporter } from './transporter.js'

/**
 * Sanitiza valores de cabeçalhos de e-mail contra CRLF Injection (CWE-93)
 * @param {string} val
 * @returns {string}
 */
export function sanitizeHeader(val) {
  if (!val) return ''
  return String(val)
    .replace(/[\r\n\t]/g, '')
    .trim()
}

/**
 * Sanitiza e mascara e-mail para exibição segura em logs sem violação de LGPD
 * @param {string} email
 * @returns {string}
 */
export function maskEmailForLogs(email) {
  if (!email || typeof email !== 'string') return '[empty]'
  const clean = sanitizeHeader(email)
  const parts = clean.split('@')
  if (parts.length !== 2) return '[invalid_email]'
  const user = parts[0]
  const domain = parts[1]
  const maskedUser =
    user.length <= 2 ? user[0] + '*' : user.slice(0, 2) + '*'.repeat(Math.max(1, user.length - 3)) + user.slice(-1)
  return `${maskedUser}@${domain}`
}

/**
 * Constrói a URL completa e segura de redefinição de senha
 * @param {string} token
 * @returns {string}
 */
export function buildResetUrl(token) {
  if (!token) return ''
  const baseUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '')
  const safeToken = encodeURIComponent(String(token).trim())
  return `${baseUrl}/#/reset-password?token=${safeToken}`
}

/**
 * Envia e-mail genérico com retry e safe logging
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  templateName = 'transactional',
  requestId = 'system',
}) {
  const startTime = Date.now()
  const cleanTo = sanitizeHeader(to)
  const cleanSubject = sanitizeHeader(subject)
  const fromName = sanitizeHeader(process.env.SMTP_FROM_NAME || 'A&L Talent')
  const fromEmail = sanitizeHeader(process.env.SMTP_FROM || 'carreiras@aelengenharia.com.br')
  const replyTo = sanitizeHeader(process.env.SMTP_REPLY_TO || 'rh@aelengenharia.com.br')

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: cleanTo,
    replyTo,
    subject: cleanSubject,
    text,
    html,
  }

  const transporter = getEmailTransporter()
  let lastError = null

  // Executa envio com 1 retry para falhas transitórias de conexão
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions)
      const durationMs = Date.now() - startTime

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          request_id: requestId,
          event: 'email_send',
          template: templateName,
          to: maskEmailForLogs(cleanTo),
          status: 'success',
          attempt,
          message_id: info.messageId,
          duration_ms: durationMs,
        })
      )

      return {
        success: true,
        messageId: info.messageId,
        durationMs,
      }
    } catch (err) {
      lastError = err
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }

  const durationMs = Date.now() - startTime
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      request_id: requestId,
      event: 'email_send',
      template: templateName,
      to: maskEmailForLogs(cleanTo),
      status: 'failed',
      error: lastError?.message || 'Unknown SMTP error',
      duration_ms: durationMs,
    })
  )

  return {
    success: false,
    error: lastError?.message || 'Falha no envio de e-mail',
    durationMs,
  }
}

/**
 * Envia e-mail de recuperação de senha com link e código de 6 dígitos
 */
export async function sendPasswordResetEmail({ toEmail, candidateName, token, code, requestId = 'pwd-reset' }) {
  const resetUrl = buildResetUrl(token)
  const template = renderPasswordResetTemplate({
    name: candidateName,
    resetUrl,
    code,
    expiresInMinutes: 15,
  })

  return sendTransactionalEmail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    templateName: 'password_reset',
    requestId,
  })
}

/**
 * Envia e-mail de primeiro acesso (ativação de conta)
 */
export async function sendFirstAccessEmail({ toEmail, candidateName, token, code, requestId = 'first-access' }) {
  const resetUrl = buildResetUrl(token)
  const template = renderFirstAccessTemplate({
    name: candidateName,
    resetUrl,
    code,
    expiresInMinutes: 15,
  })

  return sendTransactionalEmail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    templateName: 'first_access',
    requestId,
  })
}

/**
 * Envia e-mail de teste de conectividade (usado pelo script de teste Brevo)
 */
export async function sendTestEmail({ toEmail, requestId = 'test-email' }) {
  const template = renderTestEmailTemplate({
    to: toEmail,
    timestamp: new Date().toISOString(),
  })

  return sendTransactionalEmail({
    to: toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    templateName: 'test_email',
    requestId,
  })
}
