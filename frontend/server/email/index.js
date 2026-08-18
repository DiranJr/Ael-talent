/**
 * A&L Talent — Módulo Centralizado de E-mail Transacional (Brevo)
 */

export {
  buildResetUrl,
  maskEmailForLogs,
  sanitizeHeader,
  sendFirstAccessEmail,
  sendPasswordResetEmail,
  sendTestEmail,
  sendTransactionalEmail,
} from './sendEmail.js'
export {
  renderFirstAccessTemplate,
  renderPasswordResetTemplate,
  renderTestEmailTemplate,
} from './templates.js'

export {
  clearMockSentEmails,
  getEmailTransporter,
  getMockSentEmails,
  resetEmailTransporter,
  verifyEmailTransport,
} from './transporter.js'
