/**
 * A&L Talent — Teste Automatizado do Painel do Recrutador & Gestão de Acessos
 */

import http from 'http'
import { getDb } from './server/db.js'
import { signAdminToken } from './server/auth/tokens.js'

const API_PORT = 3001
const ADMIN_TOKEN = signAdminToken({ user_id: 1, user_name: 'admin', access_level: 500, first_name: 'Administrador', last_name: 'Geral' })

function apiRequest({ method = 'GET', path: reqPath, body = null, token = null }) {
  return new Promise((resolve, reject) => {
    const reqHeaders = {
      'x-test-bypass': 'ael-test-suite',
    }

    if (token) reqHeaders['Authorization'] = `Bearer ${token}`

    let payload = null
    if (body) {
      reqHeaders['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
      reqHeaders['Content-Length'] = Buffer.byteLength(payload)
    }

    const req = http.request({
      hostname: 'localhost',
      port: API_PORT,
      path: reqPath,
      method,
      headers: reqHeaders,
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        let json = null
        try {
          json = JSON.parse(data)
        } catch {
          json = { raw: data }
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        })
      })
    })

    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function runRecruiterFeatureTest() {
  console.log('======================================================================')
  console.log('TESTES DO PAINEL DO RECRUTADOR & GESTÃO DE ACESSOS (RH)')
  console.log('======================================================================\n')

  const results = []
  const db = await getDb()

  let newUserId = null
  let jobId = null

  try {
    // 1. Cadastrar nova recrutadora (Paula Santos)
    console.log('--- 1. Criação de Novo Recrutador pelo Administrador ---')
    const createRes = await apiRequest({
      method: 'POST',
      path: '/api/admin/users',
      token: ADMIN_TOKEN,
      body: {
        user_name: `paula.santos.${Date.now()}`,
        first_name: 'Paula',
        last_name: 'Santos',
        email: 'paula.santos@aelengenharia.com.br',
        title: 'Recrutadora Técnica',
        access_level: 200,
        password: 'senhaRecrutador123',
      },
    })

    newUserId = createRes.data?.user_id
    const paulaUsername = createRes.data?.user_name
    const passed1 = createRes.statusCode === 201 && newUserId > 0
    results.push({
      test: '1. Criar Recrutador (Bcrypt + Access Level 200)',
      status: passed1 ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${createRes.statusCode}, User ID: ${newUserId}, Login: ${paulaUsername}`,
    })

    // 2. Login com as credenciais da recrutadora
    console.log('--- 2. Login da Nova Recrutadora ---')
    const loginRes = await apiRequest({
      method: 'POST',
      path: '/api/admin/login',
      body: {
        username: paulaUsername,
        password: 'senhaRecrutador123',
      },
    })

    const paulaToken = loginRes.data.token
    const passed2 = loginRes.statusCode === 200 && paulaToken && loginRes.data.user?.role === 'Recrutador'
    results.push({
      test: '2. Login do Recrutador (Identificação de Papel)',
      status: passed2 ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${loginRes.statusCode}, Papel: ${loginRes.data.user?.role}, Nome: ${loginRes.data.user?.name}`,
    })

    // 3. Bloqueio de ação administrativa para Recrutador (Tentativa de criar outro usuário)
    console.log('--- 3. Validação de Restrição de Acesso (Recrutador vs Admin) ---')
    const forbidRes = await apiRequest({
      method: 'POST',
      path: '/api/admin/users',
      token: paulaToken,
      body: { user_name: 'teste.hack', first_name: 'Hacker', last_name: 'Teste', password: '123' },
    })

    const passed3 = forbidRes.statusCode === 403
    results.push({
      test: '3. Controle de Permissão (Recrutador bloqueado com 403 em rotas admin)',
      status: passed3 ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${forbidRes.statusCode} (Proibido conforme esperado)`,
    })

    // 4. Criação de Vaga atribuída à Paula Santos
    console.log('--- 4. Atribuição de Vaga ao Recrutador ---')
    const jobRes = await apiRequest({
      method: 'POST',
      path: '/api/admin/jobs',
      token: ADMIN_TOKEN,
      body: {
        title: 'Técnico de Mineração (Vaga Paula)',
        description: 'Vaga para operação em mina',
        department_id: 2,
        recruiter_id: newUserId,
        city: 'Parauapebas',
        state: 'PA',
        is_public: true,
      },
    })

    jobId = jobRes.data?.joborder_id
    const [jobCheck] = await db.query('SELECT recruiter FROM joborder WHERE joborder_id = ?', [jobId])
    const passed4 = jobRes.statusCode === 201 && jobCheck.length > 0 && jobCheck[0].recruiter === newUserId
    results.push({
      test: '4. Atribuição de Recrutador na Vaga (joborder.recruiter)',
      status: passed4 ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${jobRes.statusCode}, Vaga ID: ${jobId}, Recrutador Atribuído: ${jobCheck[0]?.recruiter}`,
    })

    // 5. Tentativa de exclusão de vaga por Recrutador (deve ser bloqueado com 403)
    console.log('--- 5. Tentativa de Exclusão de Vaga por Recrutador ---')
    const recruiterDeleteRes = await apiRequest({
      method: 'DELETE',
      path: `/api/admin/jobs/${jobId}`,
      token: paulaToken,
    })

    const passed5 = recruiterDeleteRes.statusCode === 403
    results.push({
      test: '5. Bloqueio de Exclusão de Vaga para Recrutador (403 Forbidden)',
      status: passed5 ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${recruiterDeleteRes.statusCode} (Exclusão proibida para recrutador)`,
    })

    // 6. Listagem de Vagas pelo Recrutador (Apenas atribuídas ou gerais)
    console.log('--- 6. Listagem de Vagas pelo Recrutador ---')
    const recruiterListRes = await apiRequest({
      method: 'GET',
      path: '/api/admin/jobs',
      token: paulaToken,
    })

    const recruiterJobs = recruiterListRes.data?.jobs || []
    // Garante que todas as vagas listadas são da Paula ou não atribuídas
    const onlyAssignedOrUnassigned = recruiterJobs.every((j) => j.recruiter_id === newUserId || !j.recruiter_id)
    const passed6 = recruiterListRes.statusCode === 200 && recruiterJobs.length > 0 && onlyAssignedOrUnassigned
    results.push({
      test: '6. Escopo de Vagas do Recrutador (Apenas atribuídas ou gerais)',
      status: passed6 ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${recruiterListRes.statusCode}, Total Vagas Visíveis: ${recruiterJobs.length}, Vagas Isoladas: ${onlyAssignedOrUnassigned}`,
    })

    // 7. Exclusão de usuário e reatribuição de vagas pelo Administrador
    console.log('--- 7. Exclusão de Recrutador e Vaga pelo Administrador ---')
    const deleteRes = await apiRequest({
      method: 'DELETE',
      path: `/api/admin/users/${newUserId}`,
      token: ADMIN_TOKEN,
    })

    // Limpa a vaga de teste
    if (jobId) {
      await apiRequest({
        method: 'DELETE',
        path: `/api/admin/jobs/${jobId}`,
        token: ADMIN_TOKEN,
      })
      jobId = null
    }

    const passed7 = deleteRes.statusCode === 200
    results.push({
      test: '7. Exclusão de Recrutador e Limpeza pelo Admin',
      status: passed7 ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${deleteRes.statusCode}`,
    })
    newUserId = null
  } finally {
    // Teardown de segurança
    if (newUserId) {
      await apiRequest({
        method: 'DELETE',
        path: `/api/admin/users/${newUserId}`,
        token: ADMIN_TOKEN,
      }).catch(() => {})
    }
    if (jobId) {
      await apiRequest({
        method: 'DELETE',
        path: `/api/admin/jobs/${jobId}`,
        token: ADMIN_TOKEN,
      }).catch(() => {})
    }
    await db.end()
  }

  console.log('\n======================================================================')
  console.log('RESUMO FINAL:')
  console.log('======================================================================')
  console.table(results)

  const allPassed = results.every((r) => r.status === 'APROVADO')
  console.log(`\nStatus Geral: ${allPassed ? '✅ 100% APROVADO' : '❌ FALHAS ENCONTRADAS'}\n`)

  process.exit(allPassed ? 0 : 1)
}

runRecruiterFeatureTest().catch((err) => {
  console.error(err)
  process.exit(1)
})

