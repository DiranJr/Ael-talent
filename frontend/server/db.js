/**
 * A&L Talent — Conexão MySQL2 ao banco OpenCATS
 */

import mysql from 'mysql2/promise'
import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  const missing = []
  if (!process.env.DB_HOST) missing.push('DB_HOST')
  if (!process.env.DB_NAME) missing.push('DB_NAME')
  if (!process.env.DB_USER) missing.push('DB_USER')
  if (!process.env.DB_PASS) missing.push('DB_PASS')

  if (missing.length > 0) {
    console.error(`❌ CRÍTICO: Variáveis de banco obrigatórias ausentes em produção: ${missing.join(', ')}`)
    process.exit(1)
  }
}

let pool = null

export async function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'cats',
      user: process.env.DB_USER || 'ael_dev',
      password: process.env.DB_PASS || 'ael_dev_2024',
      waitForConnections: true,
      connectionLimit: 10,
      timezone: 'Z',
      charset: 'utf8mb4',
    })

    // Teste de conexão
    try {
      await pool.execute('SELECT 1')
      console.log('✅ Banco de dados conectado:', process.env.DB_NAME || 'cats')
    } catch (err) {
      console.error('❌ Erro ao conectar ao banco:', err.message)
      pool = null
      throw err
    }
  }

  return pool
}
