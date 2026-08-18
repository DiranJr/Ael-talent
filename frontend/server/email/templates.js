/**
 * A&L Talent — Templates Oficiais de E-mail Transacional
 *
 * Design moderno, responsivo, compatível com clientes móveis e dark mode.
 * Identidade visual: A&L Engenharia (#005B3A).
 */

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Template Base de Layout HTML
 */
function renderBaseHtml({ preheader, title, contentHtml }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)} — A&L Talent</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  ${
    preheader
      ? `<div style="display: none; font-size: 1px; color: #f4f6f8; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${escapeHtml(
          preheader
        )}</div>`
      : ''
  }
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header A&L Engenharia -->
          <tr>
            <td style="background-color: #005B3A; padding: 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">A&L ENGENHARIA</h1>
              <p style="color: #a7f3d0; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">Banco de Talentos & Carreiras</p>
            </td>
          </tr>

          <!-- Corpo Principal -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Rodapé Institucional -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
                © ${new Date().getFullYear()} A&L Engenharia e Construções. Todos os direitos reservados.
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 6px 0 0 0;">
                Parauapebas / PA — Brasil
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * 1. Template: Redefinição de Senha
 */
export function renderPasswordResetTemplate({ name, resetUrl, code, expiresInMinutes = 15 }) {
  const safeName = escapeHtml(name || 'Candidato(a)')
  const safeUrl = escapeHtml(resetUrl)
  const safeCode = escapeHtml(code || '')

  const subject = 'A&L Talent — Redefinição de senha'
  const preheader = `Código de verificação: ${code}. Link válido por ${expiresInMinutes} minutos.`

  const contentHtml = `
    <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">Recuperação de Senha</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
      Olá, <strong>${safeName}</strong>!
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
      Recebemos uma solicitação para redefinir a senha do seu perfil no Banco de Talentos da A&L Engenharia.
    </p>

    <!-- Botão de Ação Direto -->
    ${
      resetUrl
        ? `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${safeUrl}" target="_blank" style="display: inline-block; background-color: #005B3A; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,91,58,0.25);">
        Redefinir Minha Senha
      </a>
    </div>`
        : ''
    }

    <!-- Caixa de Código de 6 Dígitos -->
    ${
      code
        ? `
    <div style="background-color: #f0fdf4; border: 2px dashed #005B3A; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
      <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #005B3A; letter-spacing: 1px; display: block; margin-bottom: 6px;">Código de Verificação</span>
      <span style="font-size: 32px; font-weight: 800; color: #005B3A; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">${safeCode}</span>
      <span style="font-size: 12px; color: #64748b; display: block; margin-top: 6px;">⏳ Válido por ${expiresInMinutes} minutos</span>
    </div>`
        : ''
    }

    <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 16px 0;">
      Caso prefira, acesse diretamente o portal e informe o código acima na tela de redefinição.
    </p>
    <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      Se você não solicitou esta redefinição de senha, nenhuma ação é necessária. Sua conta permanecerá segura.
    </p>
  `

  const text = `
A&L TALENT — REDEFINIÇÃO DE SENHA

Olá, ${name || 'Candidato(a)'}!

Recebemos uma solicitação para redefinir sua senha de acesso.

${resetUrl ? `Acesse o link abaixo para criar sua nova senha:\n${resetUrl}\n\n` : ''}${
  code ? `Ou utilize o código de verificação de 6 dígitos: ${code}\n\n` : ''
}Este código/link expira em ${expiresInMinutes} minutos.

Se você não solicitou esta alteração, ignore este e-mail.
© ${new Date().getFullYear()} A&L Engenharia e Construções.
  `.trim()

  const html = renderBaseHtml({ preheader, title: 'Recuperação de Senha', contentHtml })

  return { subject, html, text }
}

/**
 * 2. Template: Primeiro Acesso (Ativação de Conta)
 */
export function renderFirstAccessTemplate({ name, resetUrl, code, expiresInMinutes = 15 }) {
  const safeName = escapeHtml(name || 'Candidato(a)')
  const safeUrl = escapeHtml(resetUrl)
  const safeCode = escapeHtml(code || '')

  const subject = 'A&L Talent — Primeiro acesso'
  const preheader = `Seu perfil está cadastrado no Banco de Talentos. Crie sua senha de acesso.`

  const contentHtml = `
    <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">Bem-vindo(a) ao A&L Talent!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
      Olá, <strong>${safeName}</strong>!
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
      Seu perfil está cadastrado em nosso Banco de Talentos. Para criar sua senha e acessar a Área do Candidato, clique no botão abaixo:
    </p>

    <!-- Botão de Ação Direto -->
    ${
      resetUrl
        ? `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${safeUrl}" target="_blank" style="display: inline-block; background-color: #005B3A; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,91,58,0.25);">
        Criar Minha Senha de Acesso
      </a>
    </div>`
        : ''
    }

    <!-- Código de 6 Dígitos -->
    ${
      code
        ? `
    <div style="background-color: #f0fdf4; border: 2px dashed #005B3A; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
      <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #005B3A; letter-spacing: 1px; display: block; margin-bottom: 6px;">Código de Ativação</span>
      <span style="font-size: 32px; font-weight: 800; color: #005B3A; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">${safeCode}</span>
      <span style="font-size: 12px; color: #64748b; display: block; margin-top: 6px;">⏳ Válido por ${expiresInMinutes} minutos</span>
    </div>`
        : ''
    }

    <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 16px 0;">
      No portal, você poderá acompanhar o status das suas candidaturas e manter seu currículo sempre atualizado.
    </p>
    <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      Este link é exclusivo para sua conta e expira em ${expiresInMinutes} minutos.
    </p>
  `

  const text = `
A&L TALENT — PRIMEIRO ACESSO

Olá, ${name || 'Candidato(a)'}!

Seu perfil já existe em nossa plataforma.
Para criar sua senha e acessar sua Área do Candidato:

${resetUrl ? `Acesse o link:\n${resetUrl}\n\n` : ''}${
  code ? `Código de ativação: ${code}\n\n` : ''
}Este link/código expira em ${expiresInMinutes} minutos.

© ${new Date().getFullYear()} A&L Engenharia e Construções.
  `.trim()

  const html = renderBaseHtml({ preheader, title: 'Primeiro Acesso', contentHtml })

  return { subject, html, text }
}

/**
 * 3. Template: Teste de Configuração SMTP (Brevo)
 */
export function renderTestEmailTemplate({ to, timestamp }) {
  const subject = 'A&L Talent — Teste de E-mail Transacional (Brevo)'
  const preheader = 'Teste de conectividade do serviço de e-mails A&L Talent.'

  const contentHtml = `
    <h2 style="font-size: 18px; font-weight: 700; color: #005B3A; margin: 0 0 16px 0;">✅ Teste de E-mail Transacional</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
      Este é um e-mail de teste disparado pelo sistema <strong>A&L Talent</strong> via <strong>Brevo SMTP Relay</strong>.
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-family: monospace; font-size: 13px; color: #334155;">
      <div><strong>Destinatário:</strong> ${escapeHtml(to)}</div>
      <div><strong>Data/Hora:</strong> ${escapeHtml(timestamp || new Date().toISOString())}</div>
      <div><strong>Provedor:</strong> Brevo SMTP Relay (smtp-relay.brevo.com)</div>
      <div><strong>Status:</strong> Conectado com Sucesso</div>
    </div>
    <p style="font-size: 13px; color: #64748b; margin: 0;">
      A infraestrutura de e-mails transacionais está devidamente homologada e pronta para envio em produção.
    </p>
  `

  const text = `
A&L TALENT — TESTE DE E-MAIL TRANSACIONAL (BREVO)

Destinatário: ${to}
Data/Hora: ${timestamp || new Date().toISOString()}
Provedor: Brevo SMTP Relay
Status: Conectado com Sucesso

© ${new Date().getFullYear()} A&L Engenharia e Construções.
  `.trim()

  const html = renderBaseHtml({ preheader, title: 'Teste de E-mail', contentHtml })

  return { subject, html, text }
}
