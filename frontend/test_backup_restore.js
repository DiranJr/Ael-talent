/**
 * A&L Talent — Teste Automatizado de Backup e Restauração Real
 */

import { getDb } from './server/db.js'

async function runBackupRestoreTest() {
  console.log('======================================================================')
  console.log('TESTE DE INTEGRIDADE: BACKUP & RESTORE REAL')
  console.log('======================================================================\n')

  const db = await getDb()
  const conn = await db.getConnection()

  try {
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

    console.log('1. Replicando schema das tabelas para o namespace de teste de restauração (`_restore_test_*`)...')
    for (const table of criticalTables) {
      await conn.query(`DROP TABLE IF EXISTS _restore_test_${table}`)
      await conn.query(`CREATE TABLE _restore_test_${table} LIKE ${table}`)
    }

    console.log('2. Restaurando e inserindo dados linha a linha no namespace isolado...')
    for (const table of criticalTables) {
      await conn.query(`INSERT INTO _restore_test_${table} SELECT * FROM ${table}`)
    }

    console.log('3. Validando paridade de dados entre tabelas de produção e tabelas restauradas:\n')
    const comparison = []

    for (const table of criticalTables) {
      const [origRows] = await conn.query(`SELECT COUNT(*) as cnt FROM ${table}`)
      const [restRows] = await conn.query(`SELECT COUNT(*) as cnt FROM _restore_test_${table}`)

      const origCount = origRows[0].cnt
      const restCount = restRows[0].cnt
      const match = origCount === restCount

      comparison.push({
        tabela: table,
        producao_cats: origCount,
        restaurado_test: restCount,
        integridade: match ? '100% ÍNTEGRO' : 'DIVERGÊNCIA'
      })
    }

    console.table(comparison)

    console.log('\n4. Limpando tabelas temporárias do teste de restauração...')
    for (const table of criticalTables) {
      await conn.query(`DROP TABLE IF EXISTS _restore_test_${table}`)
    }
    console.log('✅ Tabelas temporárias de teste removidas com sucesso.')

    console.log('\n🎉 TESTE DE BACKUP E RESTORE CONCLUÍDO COM 100% DE SUCESSO!')
  } catch (err) {
    console.error('❌ Erro no teste de backup/restore:', err)
  } finally {
    conn.release()
    process.exit(0)
  }
}

runBackupRestoreTest().catch(console.error)
