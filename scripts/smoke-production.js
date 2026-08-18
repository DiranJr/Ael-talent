/**
 * A&L Talent + OpenCATS — Suíte de Smoke Tests de Produção
 * Valida prontidão de rotas, API, banco, autenticação, headers de segurança e observabilidade
 * Uso: node scripts/smoke-production.js [BASE_URL]
 */

const BASE_URL = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '')

async function runSmokeTests() {
  console.log('======================================================================')
  console.log(` [A&L TALENT] Executando Smoke Tests de Produção contra: ${BASE_URL}`)
  console.log('======================================================================\n')

  const results = []
  let allPassed = true

  async function check(name, fn) {
    process.stdout.write(`⏳ ${name}... `)
    try {
      const detail = await fn()
      console.log('✅ APROVADO')
      results.push({ teste: name, status: 'APROVADO', detalhe: detail || 'OK' })
    } catch (err) {
      console.log(`❌ FALHOU: ${err.message}`)
      results.push({ teste: name, status: 'FALHOU', detalhe: err.message })
      allPassed = false
    }
  }

  // 1. Frontend SPA Root
  await check('1. Frontend SPA (GET /)', async () => {
    const res = await fetch(`${BASE_URL}/`)
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`)
    const text = await res.text()
    if (!text.includes('id="app"')) throw new Error('Root #app não encontrado no HTML retornado')
    return 'HTTP 200 — Shell HTML carregado'
  })

  // 2. Health Check & DB Readiness
  await check('2. Health Check & Conectividade DB (GET /api/health)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`)
    const data = await res.json()
    if (data.status !== 'ok' || data.db !== 'connected') {
      throw new Error(`Health status inesperado: ${JSON.stringify(data)}`)
    }
    if (!data.request_id) throw new Error('Campo request_id ausente no health check')
    return `Status: ${data.status}, DB: ${data.db}, Uptime: ${data.uptime}s, ReqID: ${data.request_id.slice(0, 8)}...`
  })

  // 3. Mural Público de Vagas
  await check('3. Mural de Vagas Públicas (GET /api/jobs)', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`)
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data.jobs)) throw new Error('Array de vagas não retornado')
    return `HTTP 200 — ${data.jobs.length} vagas ativas listadas`
  })

  // 4. Filtros Dinâmicos do RH
  await check('4. Filtros Dinâmicos do RH (GET /api/filters)', async () => {
    const res = await fetch(`${BASE_URL}/api/filters`)
    if (res.status !== 200) throw new Error(`HTTP Status ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data.departments) || !Array.isArray(data.locations)) {
      throw new Error('Formato de filtros inválido')
    }
    return `HTTP 200 — ${data.departments.length} depts, ${data.locations.length} localidades`
  })

  // 5. Autenticação Administrativa
  await check('5. Login Administrativo RH (POST /api/admin/login)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-bypass': 'ael-test-suite' },
      body: JSON.stringify({ username: 'admin', password: 'admin_senha_incorreta_proposital' }),
    })
    // Deve rejeitar com 401 sem vazar detalhes internos
    if (res.status !== 401) throw new Error(`Esperado status 401 para credenciais incorretas, recebido ${res.status}`)
    const data = await res.json()
    if (!data.error && !data.message) throw new Error('Mensagem de erro segura ausente')
    return 'HTTP 401 — Credenciais inválidas rejeitadas com segurança'
  })

  // 6. Portal do Candidato Auth Protection
  await check('6. Portal do Candidato Auth (POST /api/talent-pool/login)', async () => {
    const res = await fetch(`${BASE_URL}/api/talent-pool/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-bypass': 'ael-test-suite' },
      body: JSON.stringify({ email: 'candidato.inexistente@ael.test', password: 'qualquer_senha' }),
    })
    if (res.status !== 401 && res.status !== 404) {
      throw new Error(`Esperado status 401/404, recebido ${res.status}`)
    }
    return `HTTP ${res.status} — Proteção de autenticação ativa`
  })

  // 7. Headers de Segurança & Rastreabilidade
  await check('7. Headers de Segurança e Request ID', async () => {
    const customReqId = 'smoke-test-uuid-12345'
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'x-request-id': customReqId },
    })
    const returnedReqId = res.headers.get('x-request-id')
    const nosniff = res.headers.get('x-content-type-options')
    const frameOpt = res.headers.get('x-frame-options')

    if (returnedReqId !== customReqId) {
      throw new Error(`x-request-id não propagado corretamente. Esperado: ${customReqId}, Recebido: ${returnedReqId}`)
    }
    if (nosniff !== 'nosniff') {
      throw new Error(`X-Content-Type-Options incorreto: ${nosniff}`)
    }
    if (frameOpt !== 'SAMEORIGIN') {
      throw new Error(`X-Frame-Options incorreto: ${frameOpt}`)
    }
    return `x-request-id validado (${returnedReqId}), nosniff: OK, frame-options: OK`
  })

  console.log('\n======================================================================')
  console.log('RESUMO DOS SMOKE TESTS DE PRODUÇÃO:')
  console.log('======================================================================')
  console.table(results)

  if (!allPassed) {
    console.log('\n❌ SMOKE TESTS FALHARAM! Verifique os erros acima.')
    process.exit(1)
  }

  console.log('\n🎉 TODOS OS SMOKE TESTS DE PRODUÇÃO FORAM 100% APROVADOS!')
}

runSmokeTests().catch((err) => {
  console.error('Falha fatal nos smoke tests:', err)
  process.exit(1)
})
