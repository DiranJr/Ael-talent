/**
 * A&L Talent — Serviço de Envio de E-mails (Nodemailer + Templates HTML)
 */

import nodemailer from 'nodemailer'

let transporter = null

export function getMailer() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true' || port === 465

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    })
  } else {
    // Transporter de fallback para desenvolvimento / mock
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n======================================================================')
        console.log('📧 [DEV EMAIL INTERCEPTED]')
        console.log(`Para: ${mailOptions.to}`)
        console.log(`Assunto: ${mailOptions.subject}`)
        if (mailOptions.text) console.log(`Texto:\n${mailOptions.text}`)
        console.log('======================================================================\n')
        return { messageId: `mock-${Date.now()}` }
      },
    }
  }

  return transporter
}

/**
 * Envia e-mail com o código de 6 dígitos para recuperação de senha
 * @param {string} toEmail - E-mail do destinatário
 * @param {string} candidateName - Nome do candidato
 * @param {string} code - Código numérico de 6 dígitos
 */
export async function sendPasswordResetEmail(toEmail, candidateName, code) {
  const mailer = getMailer()
  const from = process.env.SMTP_FROM || 'carreiras@aelengenharia.com.br'

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha — A&L Talent</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f8; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          <!-- Header Verde A&L -->
          <tr>
            <td style="background-color: #005B3A; padding: 28px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.5px;">A&L ENGENHARIA</h1>
              <p style="color: #a7f3d0; font-size: 13px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Portal de Carreiras & Banco de Talentos</p>
            </td>
          </tr>

          <!-- Corpo do E-mail -->
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Recuperação de Senha</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                Olá, <strong>${candidateName || 'Candidato(a)'}</strong>!
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Recebemos uma solicitação para redefinir a senha do seu perfil no Banco de Talentos da A&L Engenharia. Utilize o código de verificação de 6 dígitos abaixo:
              </p>

              <!-- Caixa do Código de 6 Dígitos -->
              <div style="background-color: #f0fdf4; border: 2px dashed #005B3A; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 25px 0;">
                <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #005B3A; letter-spacing: 1px; display: block; margin-bottom: 8px;">Seu Código de Verificação</span>
                <span style="font-size: 34px; font-weight: 800; color: #005B3A; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${code}</span>
                <span style="font-size: 12px; color: #64748b; display: block; margin-top: 8px;">⏳ Válido por 15 minutos</span>
              </div>

              <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 20px 0;">
                Digite esse código na tela de redefinição de senha para criar sua nova senha de acesso.
              </p>
              <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                Se você não solicitou a redefinição de senha, nenhuma ação é necessária. Sua senha atual permanecerá segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #64748b; margin: 0;">
                © ${new Date().getFullYear()} A&L Engenharia e Construções. Todos os direitos reservados.
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">
                Parauapebas / PA — Brasil
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
A&L ENGENHARIA — RECUPERAÇÃO DE SENHA

Olá, ${candidateName || 'Candidato(a)'}!

Seu código de verificação para redefinir sua senha é: ${code}

Este código é válido por 15 minutos.

Se você não solicitou esta alteração, ignore este e-mail.
© ${new Date().getFullYear()} A&L Engenharia e Construções.
  `

  try {
    const result = await mailer.sendMail({
      from: `"A&L Talent" <${from}>`,
      to: toEmail,
      subject: `Código de Recuperação de Senha: ${code} — A&L Talent`,
      text,
      html,
    })
    console.log(`[EMAIL] Código de recuperação enviado com sucesso para ${toEmail} (Message ID: ${result.messageId})`)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error(`[EMAIL ERROR] Falha ao enviar e-mail para ${toEmail}:`, error.message)
    // Não interrompe o fluxo caso ocorra erro no SMTP em dev
    return { success: false, error: error.message }
  }
}
