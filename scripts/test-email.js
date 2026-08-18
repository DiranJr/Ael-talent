#!/usr/bin/env node
/**
 * A&L Talent — Script de Teste Manual de E-mail Transacional (Brevo)
 *
 * Uso:
 *   EMAIL_TEST_TO=seu-email@dominio.com npm run email:test
 *   ou configure EMAIL_TEST_TO no arquivo .env
 */

import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carrega .env manualmente
function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim()
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) process.env[key] = val
      }
    }
  }
}

loadEnv(path.resolve(__dirname, '../frontend/.env'))
loadEnv(path.resolve(__dirname, '../.env'))

import { sendTestEmail, verifyEmailTransport } from '../frontend/server/email/index.js'


async function main() {
  console.log('======================================================================')
  console.log('🚀 A&L TALENT — TESTE DE E-MAIL TRANSACIONAL (BREVO)')
  console.log('======================================================================')

  const testTo = process.env.EMAIL_TEST_TO || process.env.SMTP_USER
  const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com'
  const smtpPort = process.env.SMTP_PORT || '587'
  const smtpUser = process.env.SMTP_USER

  console.log(`📌 Provedor SMTP: ${smtpHost}:${smtpPort}`)
  console.log(`📌 Usuário SMTP:  ${smtpUser ? smtpUser.slice(0, 4) + '****' : '(Não configurado)'}`)
  console.log(`📌 Destinatário:  ${testTo || '(Nenhum definido via EMAIL_TEST_TO)'}\n`)

  if (!testTo) {
    console.warn('⚠️  Para disparar um e-mail de teste real, defina a variável EMAIL_TEST_TO:')
    console.warn('   Exemplo: EMAIL_TEST_TO=seu-email@dominio.com npm run email:test\n')
    process.exit(1)
  }

  console.log('1. Verificando conectividade SMTP com Brevo...')
  const health = await verifyEmailTransport()

  if (!health.configured) {
    console.warn(`⚠️  Aviso: ${health.error || 'Credenciais SMTP não preenchidas.'}`)
    console.warn('   O e-mail será executado em modo de simulação/log local.')
  } else if (!health.ok) {
    console.error(`❌ Erro ao conectar no servidor Brevo: ${health.error}`)
    process.exit(1)
  } else {
    console.log('✅ Conexão SMTP estabelecida com sucesso com smtp-relay.brevo.com!')
  }

  console.log(`\n2. Enviando e-mail de teste para ${testTo}...`)
  const result = await sendTestEmail({ toEmail: testTo, requestId: 'manual-cli-test' })

  if (result.success) {
    console.log('======================================================================')
    console.log('🎉 E-MAIL ENVIADO COM SUCESSO!')
    console.log(`🆔 Message ID:   ${result.messageId}`)
    console.log(`⏱️  Tempo de Envio: ${result.durationMs}ms`)
    console.log('======================================================================\n')
    process.exit(0)
  } else {
    console.error('======================================================================')
    console.error(`❌ FALHA NO ENVIO: ${result.error}`)
    console.error('======================================================================\n')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Erro inesperado no teste de e-mail:', err)
  process.exit(1)
})
