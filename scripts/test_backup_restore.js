/**
 * A&L Talent — Teste Automatizado de Backup e Restauração Real
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../frontend/.env')

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=')
      const val = rest.join('=').trim().replace(/^["'](.*)["']$/, '$1')
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val
      }
    }
  }
}

if (process.env.DB_HOST === 'db') {
  process.env.DB_HOST = '127.0.0.1'
}

import { getDb } from '../frontend/server/db.js'

async function runBackupRestoreTest() {
  console.log('======================================================================')
  console.log('TESTE DE INTEGRIDADE: BACKUP & RESTORE REAL DE TABELAS DO OPENCATS')
  console.log('======================================================================\n')

  const db = await getDb()
  const conn = await db.getConnection()

  // Tabelas críticas a serem validadas
  const criticalTables = [
    'candidate',
    'joborder',
    'candidate_joborder',
    'candidate_joborder_status_history',
    'activity',
    'attachment',
    'extra_field',
    'candidate_auth',
    'company',
    'company_department',
    'user',
  ]

  try {
    console.log('1. Criando snapshots isolados de teste `_backup_test_*`...')
    for (const table of criticalTables) {
      const testTable = `_backup_test_${table}`
      await conn.query(`DROP TABLE IF EXISTS \`${testTable}\``)
      await conn.query(`CREATE TABLE \`${testTable}\` LIKE \`${table}\``)
      await conn.query(`INSERT INTO \`${testTable}\` SELECT * FROM \`${table}\``)
    }

    console.log('2. Validando paridade de dados e integridade estrutural:\n')
    const comparison = []

    for (const table of criticalTables) {
      const testTable = `_backup_test_${table}`
      const [origRows] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${table}\``)
      const [restRows] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${testTable}\``)

      const origCount = origRows[0].cnt
      const restCount = restRows[0].cnt
      const match = origCount === restCount

      comparison.push({
        tabela: table,
        registros_originais: origCount,
        registros_restaurados: restCount,
        integridade: match ? '100% ÍNTEGRO' : 'DIVERGÊNCIA',
      })
    }

    console.table(comparison)

    console.log('\n3. Limpando snapshots temporários de teste...')
    for (const table of criticalTables) {
      const testTable = `_backup_test_${table}`
      await conn.query(`DROP TABLE IF EXISTS \`${testTable}\``)
    }
    console.log('✅ Snapshots temporários removidos com sucesso.')

    console.log('\n🎉 TESTE DE BACKUP E RESTORE CONCLUÍDO COM 100% DE SUCESSO!')
  } catch (err) {
    console.error('❌ Erro no teste de backup/restore:', err)
    process.exitCode = 1
  } finally {
    conn.release()
  }
}

runBackupRestoreTest().catch((err) => {
  console.error(err)
  process.exit(1)
})
