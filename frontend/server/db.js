/**
 * A&L Talent — Conexão MySQL2 ao banco OpenCATS
 */

import mysql from 'mysql2/promise'
import 'dotenv/config'

let pool = null

export async function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME     || 'cats',
      user:     process.env.DB_USER     || 'ael_dev',
      password: process.env.DB_PASS     || 'ael_dev_2024',
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
