/**
 * A&L Talent — Script Oficial de Limpeza do Banco de Dados para Pré-Produção
 * Limpa candidatos de teste, candidaturas, histórico de pipeline, atividades, logs e arquivos temporários.
 * Preserva: Estrutura, Usuários Admin (RH), Empresa A&L e Departamentos Oficiais.
 */

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getDb } from '../frontend/server/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function cleanDatabase() {
  console.log('======================================================================')
  console.log('LIMPEZA DO BANCO DE DADOS — PREPARAÇÃO PARA PRODUÇÃO')
  console.log('======================================================================\n')

  const db = await getDb()
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    console.log('1. Limpando dados de testes de candidatos...')
    await conn.query('DELETE FROM candidate_auth')
    await conn.query('DELETE FROM candidate_joborder_status_history')
    await conn.query('DELETE FROM candidate_joborder')
    await conn.query('DELETE FROM activity WHERE data_item_type = 100 OR data_item_type = 200')
    await conn.query('DELETE FROM attachment WHERE data_item_type = 100')
    await conn.query('DELETE FROM extra_field WHERE data_item_type = 100')
    await conn.query('DELETE FROM candidate')
    
    // Reseta AUTO_INCREMENT dos candidatos
    await conn.query('ALTER TABLE candidate AUTO_INCREMENT = 1')
    await conn.query('ALTER TABLE candidate_auth AUTO_INCREMENT = 1')
    await conn.query('ALTER TABLE candidate_joborder AUTO_INCREMENT = 1')
    await conn.query('ALTER TABLE candidate_joborder_status_history AUTO_INCREMENT = 1')
    await conn.query('ALTER TABLE attachment AUTO_INCREMENT = 1')

    await conn.commit()
    console.log('✅ Banco de dados limpo com sucesso! (Candidatos, inscrições, histórico e autenticação zerados).')

    // 2. Limpeza física de arquivos de currículo de teste na pasta de uploads
    console.log('\n2. Limpando arquivos físicos temporários de uploads...')
    const uploadDirs = [
      path.resolve(__dirname, '../opencats/upload'),
      path.resolve(__dirname, '../frontend/server/uploads'),
      path.resolve(__dirname, '../uploads')
    ]

    for (const dir of uploadDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
        let removed = 0
        for (const file of files) {
          if (file !== '.gitkeep' && file !== '.gitignore' && file !== 'index.html') {
            const filePath = path.join(dir, file)
            if (fs.lstatSync(filePath).isFile()) {
              fs.unlinkSync(filePath)
              removed++
            }
          }
        }
        console.log(`   - Diretório ${dir}: ${removed} arquivo(s) de teste removido(s).`)
      }
    }

    // 3. Verificação do estado das tabelas
    console.log('\n3. Status atual do banco limpo:')
    const [candCount] = await conn.query('SELECT COUNT(*) as total FROM candidate')
    const [jobCount] = await conn.query('SELECT COUNT(*) as total FROM joborder')
    const [deptCount] = await conn.query('SELECT COUNT(*) as total FROM company_department')
    const [userCount] = await conn.query('SELECT COUNT(*) as total FROM user')

    console.table([
      { Tabela: 'candidate (Candidatos)', Registros: candCount[0].total },
      { Tabela: 'joborder (Vagas Cadastradas)', Registros: jobCount[0].total },
      { Tabela: 'company_department (Departamentos)', Registros: deptCount[0].total },
      { Tabela: 'user (Usuários RH/Admin)', Registros: userCount[0].total },
    ])

    console.log('\n🎉 BANCO DE DADOS PRONTO E HIGIENIZADO PARA OPERAÇÃO!')
  } catch (err) {
    await conn.rollback()
    console.error('❌ Erro na limpeza do banco:', err)
  } finally {
    conn.release()
    process.exit(0)
  }
}

cleanDatabase().catch(console.error)
