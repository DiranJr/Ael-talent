/**
 * A&L Talent — Bateria Completa de Testes de Auditoria e Validação Técnica
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

async function runTests() {
  console.log('====================================================')
  console.log('BATERIA DE TESTES DE AUDITORIA — A&L TALENT + OPENCATS')
  console.log('====================================================\n')
  const results = []

  const db = await getDb()

  // ─── TESTE 1: Deduplicação de E-mail (Case & Trim) ─────────────
  console.log('--- TESTE 1: Normalização de E-mail e Deduplicação ---')
  const testEmail1 = '  Auditoria.Deduplicacao@AelEngenharia.com.br  '
  const cleanTestEmail = 'auditoria.deduplicacao@aelengenharia.com.br'

  // Limpa se já existia de testes anteriores
  const [oldCands] = await db.query('SELECT candidate_id FROM candidate WHERE email1 = ?', [cleanTestEmail])
  for (const c of oldCands) {
    await db.query('DELETE FROM extra_field WHERE data_item_id = ? AND data_item_type = 100', [c.candidate_id])
    await db.query('DELETE FROM candidate_joborder WHERE candidate_id = ?', [c.candidate_id])
    await db.query('DELETE FROM candidate_joborder_status_history WHERE candidate_id = ?', [c.candidate_id])
    await db.query('DELETE FROM activity WHERE data_item_id = ? AND data_item_type = 100', [c.candidate_id])
    await db.query('DELETE FROM candidate WHERE candidate_id = ?', [c.candidate_id])
  }

  // 1.1 Cadastro 1 com espaços e maiúsculas
  const reg1 = await request('/api/talent-pool/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      first_name: 'Carlos',
      last_name: 'Auditoria 1',
      email: testEmail1,
      phone: '94991112233',
      city: 'Parauapebas',
      state: 'PA',
      interest_area: 'Engenharia',
      desired_role: 'Engenheiro Civil',
      password: 'senhaSegura123',
    }
  })

  // 1.2 Cadastro 2 com minúsculas e sem espaços
  const reg2 = await request('/api/talent-pool/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      first_name: 'Carlos',
      last_name: 'Auditoria Atualizado',
      email: cleanTestEmail,
      phone: '94991112233',
      city: 'Parauapebas',
      state: 'PA',
      interest_area: 'Engenharia',
      desired_role: 'Engenheiro Civil Sênior',
    }
  })

  // 1.3 Cadastro 3 com variação de maiúsculas
  const reg3 = await request('/api/talent-pool/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      first_name: 'Carlos',
      last_name: 'Auditoria Atualizado 2',
      email: 'AUDITORIA.DEDUPLICACAO@AELENGENHARIA.COM.BR',
      phone: '94991112233',
      city: 'Parauapebas',
      state: 'PA',
      interest_area: 'Engenharia',
      desired_role: 'Engenheiro Coordenador',
    }
  })

  const [candsAfter] = await db.query('SELECT candidate_id, first_name, last_name, email1 FROM candidate WHERE email1 = ?', [cleanTestEmail])
  const deduplicationSuccess = candsAfter.length === 1 && reg1.body.candidate_id === reg2.body.candidate_id && reg2.body.candidate_id === reg3.body.candidate_id
  results.push({
    test: '1. Deduplicação por E-mail (Case Insensitive + Trim)',
    status: deduplicationSuccess ? 'APROVADO' : 'FALHOU',
    detail: `Total registros: ${candsAfter.length}, IDs idênticos: ${deduplicationSuccess}`
  })

  const candidateId = reg1.body.candidate_id

  // ─── TESTE 2: Login do Candidato com Scrypt ─────────────────────
  console.log('--- TESTE 2: Autenticação do Candidato com Scrypt ---')
  const loginValid = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: cleanTestEmail, password: 'senhaSegura123' }
  })

  const loginInvalidPass = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: cleanTestEmail, password: 'senhaErrada999' }
  })

  const authSuccess = loginValid.status === 200 && Boolean(loginValid.body.token) && loginInvalidPass.status === 401
  results.push({
    test: '2. Login do Candidato (Scrypt + Token)',
    status: authSuccess ? 'APROVADO' : 'FALHOU',
    detail: `Login válido: 200 (token gerado), Senha incorreta: 401`
  })

  const candidateToken = loginValid.body.token

  // ─── TESTE 3: Acesso ao Perfil /me com Token vs sem Token ────────
  console.log('--- TESTE 3: Perfil do Candidato (/me) ---')
  const meAuth = await request('/api/talent-pool/me', {
    headers: { 'Authorization': `Bearer ${candidateToken}` }
  })
  const meNoAuth = await request('/api/talent-pool/me')

  const meSuccess = meAuth.status === 200 && meAuth.body.candidate.candidate_id === candidateId && meNoAuth.status === 401
  results.push({
    test: '3. Proteção de Perfil (/me)',
    status: meSuccess ? 'APROVADO' : 'FALHOU',
    detail: `Autenticado: 200, Sem Token: 401`
  })

  // ─── TESTE 4: Candidatura e Pipeline OpenCATS ───────────────────
  console.log('--- TESTE 4: Candidatura e Pipeline OpenCATS ---')
  const [jobs] = await db.query('SELECT joborder_id, title FROM joborder LIMIT 1')
  const testJobId = jobs[0]?.joborder_id || 1

  await request('/api/talent-pool/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      first_name: 'Carlos',
      last_name: 'Auditoria Atualizado',
      email: cleanTestEmail,
      phone: '94991112233',
      city: 'Parauapebas',
      state: 'PA',
      interest_area: 'Engenharia',
      job_id: testJobId,
    }
  })

  const [cjRows] = await db.query('SELECT * FROM candidate_joborder WHERE candidate_id = ? AND joborder_id = ?', [candidateId, testJobId])
  const [historyRows] = await db.query('SELECT * FROM candidate_joborder_status_history WHERE candidate_id = ? AND joborder_id = ?', [candidateId, testJobId])
  const [actRows] = await db.query('SELECT * FROM activity WHERE data_item_id = ? AND data_item_type = 100', [candidateId])

  const pipelineSuccess = cjRows.length === 1 && historyRows.length >= 1 && actRows.length >= 1
  results.push({
    test: '4. Inscrição na Vaga + Status History + Activity',
    status: pipelineSuccess ? 'APROVADO' : 'FALHOU',
    detail: `CJ: ${cjRows.length}, Status History: ${historyRows.length}, Activity: ${actRows.length}`
  })

  // ─── TESTE 5: Login do RH e Autenticação Administrativa ────────
  console.log('--- TESTE 5: Login do RH (Bcrypt) e Proteção de Rotas ---')
  const adminLoginValid = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'admin', password: 'admin' }
  })

  const adminLoginInvalid = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'admin', password: 'senhaErradaDoAdmin' }
  })

  const adminToken = adminLoginValid.body.token

  const adminCandidatesNoAuth = await request('/api/admin/candidates')
  const adminJobsNoAuth = await request('/api/admin/jobs')
  const adminStatsNoAuth = await request('/api/admin/stats')
  const talentPoolListNoAuth = await request('/api/talent-pool/candidates')

  const adminCandidatesWithAuth = await request('/api/admin/candidates', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })

  const adminAuthSuccess = adminLoginValid.status === 200 &&
    Boolean(adminToken) &&
    adminLoginInvalid.status === 401 &&
    adminCandidatesNoAuth.status === 401 &&
    adminJobsNoAuth.status === 401 &&
    adminStatsNoAuth.status === 401 &&
    talentPoolListNoAuth.status === 401 &&
    adminCandidatesWithAuth.status === 200

  results.push({
    test: '5. Autenticação Administrativa e Proteção de Endpoints RH',
    status: adminAuthSuccess ? 'APROVADO' : 'FALHOU',
    detail: `Login Bcrypt: 200, Sem Token: 401 (todos), Com Token: 200`
  })

  // ─── TESTE 6: Mudança de Status pelo RH com Histórico ──────────
  console.log('--- TESTE 6: Mudança de Status pelo RH com Histórico ---')
  const updateStatusRes = await request(`/api/admin/candidates/${candidateId}/jobs/${testJobId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: { status: 300, note: 'Candidato qualificado na triagem técnica' }
  })

  const [historyAfterRH] = await db.query(
    'SELECT * FROM candidate_joborder_status_history WHERE candidate_id = ? AND joborder_id = ? ORDER BY candidate_joborder_status_history_id DESC LIMIT 1',
    [candidateId, testJobId]
  )

  const statusHistoryLogged = historyAfterRH.length > 0 && historyAfterRH[0].status_to === 300
  results.push({
    test: '6. Transição de Pipeline do RH gravada no Status History',
    status: statusHistoryLogged ? 'APROVADO' : 'FALHOU',
    detail: `Status mudado para 300, registrado em candidate_joborder_status_history: ${statusHistoryLogged}`
  })

  // ─── TESTE 7: Não-exposição de Senha Hash ────────────────────────
  console.log('--- TESTE 7: Verificação de Ocultação de Senha Hash ---')
  const candDetailRes = await request(`/api/talent-pool/candidates/${candidateId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })
  const exposedInAdmin = Boolean(candDetailRes.body?.candidate?.extra_fields?.['Senha Hash'])
  const [efSettings] = await db.query("SELECT * FROM extra_field_settings WHERE field_name = 'Senha Hash'")
  const exposedInOpenCatsSettings = efSettings.length > 0

  const passwordProtected = !exposedInAdmin && !exposedInOpenCatsSettings
  results.push({
    test: '7. Ocultação de Senha Hash (API + OpenCATS UI Settings)',
    status: passwordProtected ? 'APROVADO' : 'FALHOU',
    detail: `Exposta no Admin API: ${exposedInAdmin}, Exposta no OpenCATS UI: ${exposedInOpenCatsSettings}`
  })

  // ─── TESTE 8: Proteção contra Account Takeover em /set-password ───
  console.log('--- TESTE 8: Proteção de Redefinição de Senha ---')
  const setPwdNoAuth = await request('/api/talent-pool/set-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: cleanTestEmail, password: 'novaSenhaHacker999' }
  })

  const takeoverBlocked = setPwdNoAuth.status === 401
  results.push({
    test: '8. Proteção contra Account Takeover (/set-password desautorizado)',
    status: takeoverBlocked ? 'APROVADO' : 'FALHOU',
    detail: `Tentativa sem autenticação bloqueada com status: ${setPwdNoAuth.status}`
  })

  // ─── TESTE 9: Proteção de PII e Anti-Enumeração no Lookup ─────────
  console.log('--- TESTE 9: Proteção de Dados Pessoais em /lookup ---')
  const lookupRes = await request(`/api/talent-pool/lookup?email=${encodeURIComponent(cleanTestEmail)}`)
  const lookupSafe = lookupRes.status === 200 &&
    lookupRes.body?.status === 'ok' &&
    lookupRes.body?.first_name === undefined &&
    lookupRes.body?.candidate_id === undefined &&
    lookupRes.body?.has_password === undefined
  results.push({
    test: '9. Proteção de Dados Pessoais e Anti-Enumeração em Lookup Público',
    status: lookupSafe ? 'APROVADO' : 'FALHOU',
    detail: `Lookup retorna resposta uniforme status: ok sem expor PII ou enumeração de e-mails`
  })

  // ─── TESTE 10: Headers de Segurança ─────────────────────────────
  console.log('--- TESTE 10: Headers de Segurança HTTP ---')
  const healthCheck = await request('/api/health')
  const hasNosniff = healthCheck.headers['x-content-type-options'] === 'nosniff'
  const hasFrameOptions = healthCheck.headers['x-frame-options'] === 'SAMEORIGIN'

  const headersSafe = hasNosniff && hasFrameOptions
  results.push({
    test: '10. Headers de Segurança HTTP (nosniff, SAMEORIGIN)',
    status: headersSafe ? 'APROVADO' : 'FALHOU',
    detail: `X-Content-Type-Options: ${healthCheck.headers['x-content-type-options']}, X-Frame-Options: ${healthCheck.headers['x-frame-options']}`
  })

  console.log('====================================================')
  console.log('RESUMO FINAL DOS TESTES DE AUDITORIA:')
  console.log('====================================================')
  console.table(results)

  await db.end()
}

runTests().catch(console.error)
