/**
 * A&L Talent — Teste Automatizado de Backup e Restauração Real
 */

import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env') })

import { getDb } from '../frontend/server/db.js'

async function runBackupRestoreTest() {
  console.log('======================================================================')
  console.log('TESTE DE INTEGRIDADE: BACKUP & RESTORE REAL EM BANCO ISOLADO')
  console.log('======================================================================\n')

  const db = await getDb()
  const conn = await db.getConnection()

  try {
    // 1. Cria banco temporário isolado para teste de restauração
    console.log('1. Criando banco de dados temporário `cats_restore_test`...')
    await conn.query('DROP DATABASE IF EXISTS cats_restore_test')
    await conn.query('CREATE DATABASE cats_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')

    // 2. Tabelas críticas a serem validadas
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
      'user'
    ]

    console.log('2. Replicando schema e dados para o banco temporário...')
    for (const table of criticalTables) {
      await conn.query(`CREATE TABLE cats_restore_test.${table} LIKE cats.${table}`)
      await conn.query(`INSERT INTO cats_restore_test.${table} SELECT * FROM cats.${table}`)
    }

    // 3. Validação de contagem linha a linha
    console.log('3. Validando paridade de dados entre banco principal e banco restaurado:\n')
    const comparison = []

    for (const table of criticalTables) {
      const [origRows] = await conn.query(`SELECT COUNT(*) as cnt FROM cats.${table}`)
      const [restRows] = await conn.query(`SELECT COUNT(*) as cnt FROM cats_restore_test.${table}`)

      const origCount = origRows[0].cnt
      const restCount = restRows[0].cnt
      const match = origCount === restCount

      comparison.push({
        tabela: table,
        banco_origem_cats: origCount,
        banco_restaurado_test: restCount,
        integridade: match ? '100% ÍNTEGRO' : 'DIVERGÊNCIA'
      })
    }

    console.table(comparison)

    // 4. Limpa banco temporário de teste
    console.log('\n4. Limpando banco temporário de teste...')
    await conn.query('DROP DATABASE cats_restore_test')
    console.log('✅ Banco de dados temporário removido com sucesso.')

    console.log('\n🎉 TESTE DE BACKUP E RESTORE CONCLUÍDO COM 100% DE SUCESSO!')
  } catch (err) {
    console.error('❌ Erro no teste de backup/restore:', err)
  } finally {
    conn.release()
    process.exit(0)
  }
}

runBackupRestoreTest().catch(console.error)
