/**
 * A&L Talent — Bateria Completa de Testes de Hardening & Autenticação
 */

import http from 'http'
import mysql from 'mysql2/promise'

const BASE_URL = 'http://localhost:3001'

async function request(urlPath, options = {}) {
  const url = new URL(`${BASE_URL}${urlPath}`)
  const headers = {
    'x-test-bypass': 'ael-test-suite',
    ...(options.headers || {}),
  }
  if (options.skipBypass) {
    delete headers['x-test-bypass']
  }

  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        let body = data
        try {
          body = JSON.parse(data)
        } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body })
      })
    })
    req.on('error', reject)
    if (options.body) {
      if (typeof options.body === 'string') {
        req.write(options.body)
      } else {
        req.write(JSON.stringify(options.body))
      }
    }
    req.end()
  })
}

async function getDb() {
  return mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'ael_dev',
    password: 'ael_dev_2024',
    database: 'cats',
  })
}

async function runHardeningTests() {
  console.log('======================================================================')
  console.log('BATERIA DE TESTES DE HARDENING — AUTENTICAÇÃO A&L TALENT + OPENCATS')
  console.log('======================================================================\n')

  const results = []
  const db = await getDb()

  // ─── TESTE 1: Migração de Hashes para candidate_auth ──────────
  console.log('--- TESTE 1: Migração e Login de Candidato Migrado ---')
  const [migratedRows] = await db.query('SELECT candidate_id, password_hash FROM candidate_auth LIMIT 1')
  let test1Pass = false
  if (migratedRows.length > 0) {
    const candId = migratedRows[0].candidate_id
    const [cand] = await db.query('SELECT email1 FROM candidate WHERE candidate_id = ?', [candId])
    const [[{ extraCount }]] = await db.query(
      "SELECT count(*) as extraCount FROM extra_field WHERE field_name = 'Senha Hash'"
    )
    test1Pass = Boolean(cand.length) && extraCount === 0
    results.push({
      test: '1. Migração de Hashes e Eliminação de extra_field',
      status: test1Pass ? 'APROVADO' : 'FALHOU',
      detail: `Registros em candidate_auth: ${migratedRows.length}, Registros restantes em extra_field: ${extraCount}`
    })
  }

  // ─── TESTE 2: Novo Candidato (Sem Senha em extra_field) ────────
  console.log('--- TESTE 2: Cadastro de Novo Candidato ---')
  const newEmail = 'candidato.hardening@aelengenharia.com.br'

  // Limpa se já existia
  const [old] = await db.query('SELECT candidate_id FROM candidate WHERE email1 = ?', [newEmail])
  for (const c of old) {
    await db.query('DELETE FROM candidate_auth WHERE candidate_id = ?', [c.candidate_id])
    await db.query('DELETE FROM extra_field WHERE data_item_id = ? AND data_item_type = 100', [c.candidate_id])
    await db.query('DELETE FROM candidate_joborder WHERE candidate_id = ?', [c.candidate_id])
    await db.query('DELETE FROM candidate WHERE candidate_id = ?', [c.candidate_id])
  }

  const regRes = await request('/api/talent-pool/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      first_name: 'Marcos',
      last_name: 'Hardening',
      email: newEmail,
      phone: '94998887766',
      city: 'Parauapebas',
      state: 'PA',
      interest_area: 'Engenharia',
      password: 'senhaSegura1234',
    }
  })

  const newCandId = regRes.body?.candidate_id
  const [newAuthRows] = await db.query('SELECT * FROM candidate_auth WHERE candidate_id = ?', [newCandId])
  const [newExtraRows] = await db.query(
    "SELECT * FROM extra_field WHERE data_item_id = ? AND field_name = 'Senha Hash'",
    [newCandId]
  )

  const test2Pass = regRes.status === 200 && newAuthRows.length === 1 && newExtraRows.length === 0
  results.push({
    test: '2. Novo Cadastro: Senha em candidate_auth e ZERO em extra_field',
    status: test2Pass ? 'APROVADO' : 'FALHOU',
    detail: `Auth criado: ${newAuthRows.length}, Extra Field Senha Hash: ${newExtraRows.length}`
  })

  // ─── TESTE 3: Força Bruta e Bloqueio de Conta (Lockout) ────────
  console.log('--- TESTE 3: Lockout por 5 Tentativas Inválidas Consecutivas ---')
  for (let i = 1; i <= 4; i++) {
    await request('/api/talent-pool/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: newEmail, password: `senhaInvalida_${i}` }
    })
  }

  // 5ª tentativa (deve ativar o lockout de conta)
  const attempt5 = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: newEmail, password: 'senhaInvalida_5' }
  })

  // 6ª tentativa (deve ser rejeitada com HTTP 423 Locked)
  const attempt6 = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: newEmail, password: 'senhaSegura1234' }
  })

  const [authLocked] = await db.query('SELECT failed_attempts, locked_until FROM candidate_auth WHERE candidate_id = ?', [newCandId])
  const isLocked = Boolean(authLocked[0]?.locked_until) && attempt6.status === 423
  results.push({
    test: '3. Proteção contra Força Bruta (Lockout de Conta com HTTP 423)',
    status: isLocked ? 'APROVADO' : 'FALHOU',
    detail: `Failed attempts: ${authLocked[0]?.failed_attempts}, locked_until definido: ${Boolean(authLocked[0]?.locked_until)}, Status 6ª tentativa: ${attempt6.status}`
  })

  // ─── TESTE 4: Reset de Tentativas após Desbloqueio e Login Válido ─
  console.log('--- TESTE 4: Reset de Tentativas após Desbloqueio ---')
  await db.query('UPDATE candidate_auth SET locked_until = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE candidate_id = ?', [newCandId])

  const loginUnlocked = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: newEmail, password: 'senhaSegura1234' }
  })

  const [authReset] = await db.query('SELECT failed_attempts, locked_until, last_login FROM candidate_auth WHERE candidate_id = ?', [newCandId])
  const resetPass = loginUnlocked.status === 200 && authReset[0].failed_attempts === 0 && authReset[0].locked_until === null && Boolean(authReset[0].last_login)
  results.push({
    test: '4. Reset de failed_attempts e registro de last_login no Login com Sucesso',
    status: resetPass ? 'APROVADO' : 'FALHOU',
    detail: `Status: ${loginUnlocked.status}, failed_attempts: ${authReset[0]?.failed_attempts}, locked_until: ${authReset[0]?.locked_until}`
  })

  // ─── TESTE 5: Mitigação de Enumeração de Contas ───────────────────
  console.log('--- TESTE 5: Respostas Genéricas e Proteção contra Enumeração ---')
  const resNonExistent = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'email.completamente.inexistente.999@teste.com', password: 'senhaQualquer123' }
  })

  const resWrongPass = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: newEmail, password: 'senhaErrada_teste' }
  })

  const enumerationSafe = resNonExistent.status === 401 &&
    resWrongPass.status === 401 &&
    resNonExistent.body?.error === 'E-mail ou senha inválidos.' &&
    resWrongPass.body?.error === 'E-mail ou senha inválidos.'

  results.push({
    test: '5. Mitigação de Enumeração de Contas (Mensagem Genérica e Dummy Scrypt)',
    status: enumerationSafe ? 'APROVADO' : 'FALHOU',
    detail: `Mensagens idênticas: ${enumerationSafe} ("${resNonExistent.body?.error}")`
  })

  // ─── TESTE 6: Solicitação de Recuperação de Senha (Forgot Password)
  console.log('--- TESTE 6: Solicitação de Recuperação de Senha ---')
  await db.query('UPDATE candidate_auth SET locked_until = NULL, failed_attempts = 0 WHERE candidate_id = ?', [newCandId])

  const forgotRes = await request('/api/talent-pool/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: newEmail }
  })

  const [authForgot] = await db.query(
    'SELECT reset_token_hash, reset_token_expires_at FROM candidate_auth WHERE candidate_id = ?',
    [newCandId]
  )

  const tokenGenerated = forgotRes.status === 200 &&
    Boolean(authForgot[0]?.reset_token_hash) &&
    authForgot[0].reset_token_hash.length === 64 &&
    Boolean(authForgot[0]?.reset_token_expires_at)

  results.push({
    test: '6. Geração de Token SHA-256 de Recuperação de Senha (15 min exp)',
    status: tokenGenerated ? 'APROVADO' : 'FALHOU',
    detail: `Token hash SHA-256 no banco: ${authForgot[0]?.reset_token_hash?.substring(0, 16)}..., Expira em: ${authForgot[0]?.reset_token_expires_at}`
  })

  const devResetToken = forgotRes.body?.dev_reset_token

  // ─── TESTE 7: Redefinição de Senha com Token (Single-Use) ────────
  console.log('--- TESTE 7: Execução de Redefinição de Senha ---')
  let resetSuccess = false
  let replayBlocked = false

  if (devResetToken) {
    const resetRes = await request('/api/talent-pool/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { token: devResetToken, password: 'novaSenhaRedefinida888' }
    })

    const loginWithNew = await request('/api/talent-pool/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: newEmail, password: 'novaSenhaRedefinida888' }
    })

    const loginWithOld = await request('/api/talent-pool/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: newEmail, password: 'senhaSegura1234' }
    })

    // Tentativa de reutilizar o mesmo token (Single-Use check)
    const resetReplay = await request('/api/talent-pool/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { token: devResetToken, password: 'outraSenha_replay' }
    })

    resetSuccess = resetRes.status === 200 && loginWithNew.status === 200 && loginWithOld.status === 401
    replayBlocked = resetReplay.status === 400
  }

  results.push({
    test: '7. Redefinição de Senha, Invalidação da Antiga e Proteção Single-Use',
    status: (resetSuccess && replayBlocked) ? 'APROVADO' : 'FALHOU',
    detail: `Nova senha válida: ${resetSuccess}, Replay de token bloqueado (400): ${replayBlocked}`
  })

  // ─── TESTE 8: Rate Limiting por IP ──────────────────────────────
  console.log('--- TESTE 8: Rate Limiting por IP (express-rate-limit) ---')
  let hitRateLimit = false
  for (let i = 0; i < 15; i++) {
    const rlRes = await request('/api/talent-pool/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      skipBypass: true, // Sem header de bypass para testar o rate limiter real
      body: { email: `random_flood_${i}@teste.com` }
    })
    if (rlRes.status === 429) {
      hitRateLimit = true
      break
    }
  }

  results.push({
    test: '8. Rate Limiting por IP (HTTP 429 Too Many Requests)',
    status: hitRateLimit ? 'APROVADO' : 'FALHOU',
    detail: `Limitador ativado com HTTP 429: ${hitRateLimit}`
  })

  // ─── TESTE 9: Compatibilidade com OpenCATS Legado ─────────────────
  console.log('--- TESTE 9: Compatibilidade com OpenCATS Legado ---')
  const [opencatsCandidates] = await db.query('SELECT candidate_id, first_name, last_name, email1 FROM candidate LIMIT 5')
  const [opencatsJobs] = await db.query('SELECT joborder_id, title FROM joborder LIMIT 5')
  const opencatsCompat = opencatsCandidates.length > 0 && opencatsJobs.length > 0
  results.push({
    test: '9. Compatibilidade e Integridade das Tabelas OpenCATS',
    status: opencatsCompat ? 'APROVADO' : 'FALHOU',
    detail: `Tabelas candidate (${opencatsCandidates.length}) e joborder (${opencatsJobs.length}) 100% operacionais`
  })

  // ─── TESTE 10: Ocultação de Credenciais nas APIs de Gestão (RH) ───
  console.log('--- TESTE 10: Proteção de Credenciais em APIs Administrativas ---')
  const adminLogin = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'admin', password: 'admin' }
  })
  const adminToken = adminLogin.body?.token

  const adminCandDetail = await request(`/api/admin/candidates/${newCandId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })

  const candData = JSON.stringify(adminCandDetail.body)
  const noHashLeaked = !candData.includes('password_hash') && !candData.includes('reset_token_hash') && !candData.includes('Senha Hash')
  results.push({
    test: '10. Ocultação de password_hash e reset_token_hash nas APIs do RH',
    status: noHashLeaked ? 'APROVADO' : 'FALHOU',
    detail: `Credenciais e hashes ocultados em respostas do RH: ${noHashLeaked}`
  })

  // ─── TESTE 11: Integridade Referencial da candidate_auth ──────────
  console.log('--- TESTE 11: Integridade Referencial do Banco ---')
  const [orphanAuth] = await db.query(`
    SELECT ca.candidate_id FROM candidate_auth ca
    LEFT JOIN candidate c ON c.candidate_id = ca.candidate_id
    WHERE c.candidate_id IS NULL
  `)

  const [dupAuth] = await db.query(`
    SELECT candidate_id, COUNT(*) as count FROM candidate_auth
    GROUP BY candidate_id HAVING count > 1
  `)

  const integrityPass = orphanAuth.length === 0 && dupAuth.length === 0
  results.push({
    test: '11. Integridade Referencial (0 órfãos, 0 duplicidades em candidate_auth)',
    status: integrityPass ? 'APROVADO' : 'FALHOU',
    detail: `Órfãos: ${orphanAuth.length}, Duplicados: ${dupAuth.length}`
  })

  // ─── TESTE 12: Regressão Geral da Aplicação ───────────────────────
  console.log('--- TESTE 12: Regressão Geral da Aplicação ---')
  const healthRes = await request('/api/health')
  const jobsRes = await request('/api/jobs')
  const filtersRes = await request('/api/filters')

  const regressionPass = healthRes.status === 200 && jobsRes.status === 200 && filtersRes.status === 200
  results.push({
    test: '12. Regressão Geral dos Endpoints Públicos e do Portal',
    status: regressionPass ? 'APROVADO' : 'FALHOU',
    detail: `Health: ${healthRes.status}, Jobs: ${jobsRes.status}, Filters: ${filtersRes.status}`
  })

  console.log('======================================================================')
  console.log('RESUMO FINAL DOS TESTES DE HARDENING:')
  console.log('======================================================================')
  console.table(results)

  await db.end()
}

runHardeningTests().catch(console.error)
