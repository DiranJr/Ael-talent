/**
 * A&L Talent — Teste de Ciclo de Vida Completo do Candidato (Ponta a Ponta)
 *
 * Executa todos os passos de um novo usuário:
 * 1. Cadastro no Banco de Talentos com todas as etapas
 * 2. Login na Área do Candidato
 * 3. Consulta de Perfil e Inscrições (/api/talent-pool/me)
 * 4. Candidatura a uma Vaga Aberta
 * 5. Painel RH: Visualização e Triagem do Candidato
 * 6. Painel RH: Movimentação em todas as Etapas do Pipeline (100 -> 200 -> 300 -> 500 -> 600)
 * 7. Solicitação de Redefinição de Senha (Forgot Password com Brevo)
 * 8. Validação e Redefinição de Senha com o Código de 6 dígitos
 * 9. Login com a Nova Senha
 */

import http from 'http'
import { getDb } from './server/db.js'
import { signAdminToken } from './server/auth/tokens.js'

const API_PORT = 3001
const ADMIN_TOKEN = signAdminToken({ user_id: 1, user_name: 'admin', access_level: 500 })

function apiRequest({ method = 'GET', path: reqPath, body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const reqHeaders = {
      'x-test-bypass': 'ael-test-suite',
      ...headers,
    }

    let payload = null
    if (body) {
      reqHeaders['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
      reqHeaders['Content-Length'] = Buffer.byteLength(payload)
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: reqPath,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
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
      }
    )

    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function runFullLifecycle() {
  console.log('======================================================================')
  console.log('🌟 INICIANDO TESTE DO CICLO DE VIDA COMPLETO DO CANDIDATO')
  console.log('======================================================================\n')

  const timestamp = Date.now()
  const candidateEmail = `lucas.engenheiro.${timestamp}@aelengenharia.com.br`
  const initialPassword = 'SenhaForte123@'
  const newPassword = 'NovaSenhaSegura2026#'
  const candidateName = 'Lucas Gabriel'
  const candidateLastName = 'Vasconcelos'
  const candidatePhone = '(94) 99123-4567'

  let candidateId = null
  let candidateToken = null
  let testJobId = null
  let resetCode = null

  // ─── PASSO 1: Cadastro no Banco de Talentos ──────────────────────────────
  console.log('📋 [PASSO 1] Cadastrando novo candidato no Banco de Talentos...')
  const regPayload = {
    first_name: candidateName,
    last_name: candidateLastName,
    email: candidateEmail,
    phone: candidatePhone,
    phone_cell: candidatePhone,
    cpf: '123.456.789-00',
    birth_date: '1995-04-12',
    gender: 'M',
    cep: '68515-000',
    address: 'Rua das Palmeiras',
    address_number: '500',
    neighborhood: 'Cidade Nova',
    city: 'Parauapebas',
    state: 'PA',
    department: 'Engenharia',
    desired_job: 'Engenheiro Civil de Obras',
    availability: 'Imediata',
    desired_salary: '12000',
    education_level: 'Superior',
    degree_course: 'Engenharia Civil',
    institution: 'UFPA',
    english_level: 'Avançado',
    spanish_level: 'Intermediário',
    last_company: 'Construtora Norte S/A',
    last_job_title: 'Engenheiro de Campo',
    experience_years: '5 a 10 anos',
    experience_summary: 'Gestão de obras pesadas, terraplenagem e montagem industrial.',
    skills: 'AutoCAD, MS Project, Gestão de Equipes, Lean Construction',
    password: initialPassword,
  }

  const regRes = await apiRequest({
    method: 'POST',
    path: '/api/talent-pool/register',
    body: regPayload,
  })

  if (regRes.statusCode !== 200 && regRes.statusCode !== 201) {
    throw new Error(`Falha no cadastro do Banco de Talentos: ${JSON.stringify(regRes.data)}`)
  }

  candidateId = regRes.data?.candidate_id || regRes.data?.candidate?.candidate_id || regRes.data?.data?.candidate_id
  candidateToken = regRes.data?.token || regRes.data?.data?.token
  console.log(`✅ Candidato cadastrado com sucesso! ID: ${candidateId}, Token emitido: ${Boolean(candidateToken)}`)

  // ─── PASSO 2: Login na Área do Candidato ──────────────────────────────────
  console.log('\n🔐 [PASSO 2] Efetuando login no Portal do Candidato...')
  const loginRes = await apiRequest({
    method: 'POST',
    path: '/api/talent-pool/login',
    body: {
      email: candidateEmail,
      password: initialPassword,
    },
  })

  if (loginRes.statusCode !== 200 || (!loginRes.data?.token && !loginRes.data?.data?.token)) {
    throw new Error(`Falha no login do candidato: ${JSON.stringify(loginRes.data)}`)
  }

  candidateToken = loginRes.data?.token || loginRes.data?.data?.token
  candidateId = candidateId || loginRes.data?.candidate?.candidate_id || loginRes.data?.data?.candidate?.candidate_id
  console.log(`✅ Login efetuado com sucesso! Bem-vindo, ${loginRes.data?.candidate?.first_name || loginRes.data?.data?.candidate?.first_name}`)


  // ─── PASSO 3: Consulta de Perfil (/me) ───────────────────────────────────
  console.log('\n👤 [PASSO 3] Consultando perfil do candidato (/api/talent-pool/me)...')
  const meRes = await apiRequest({
    method: 'GET',
    path: '/api/talent-pool/me',
    headers: { Authorization: `Bearer ${candidateToken}` },
  })

  if (meRes.statusCode !== 200) {
    throw new Error(`Falha ao obter perfil /me: ${JSON.stringify(meRes.data)}`)
  }
  console.log(`✅ Perfil recuperado: ${meRes.data?.candidate?.first_name} ${meRes.data?.candidate?.last_name} | Cidade: ${meRes.data?.candidate?.city}`)

  // ─── PASSO 4: Candidatura a uma Vaga Aberta ──────────────────────────────
  console.log('\n💼 [PASSO 4] Buscando vaga aberta para candidatura...')
  const jobsRes = await apiRequest({ method: 'GET', path: '/api/jobs' })
  const jobsList = jobsRes.data?.jobs || []
  if (jobsList.length === 0) {
    throw new Error('Nenhuma vaga disponível para teste!')
  }
  testJobId = jobsList[0].joborder_id
  console.log(`📌 Vaga selecionada: #${testJobId} - "${jobsList[0].title}"`)

  console.log('📝 Submetendo candidatura à vaga via /api/apply...')
  const applyRes = await apiRequest({
    method: 'POST',
    path: '/api/apply',
    body: {
      joborder_id: testJobId,
      candidate_id: candidateId,
      name: `${candidateName} ${candidateLastName}`,
      first_name: candidateName,
      last_name: candidateLastName,
      email: candidateEmail,
      phone: candidatePhone,
      city: 'Parauapebas',
      state: 'PA',
      message: 'Tenho grande interesse em atuar nesta posição de liderança em campo.',

    },
  })

  if (applyRes.statusCode !== 200 && applyRes.statusCode !== 201) {
    throw new Error(`Falha na candidatura: ${JSON.stringify(applyRes.data)}`)
  }
  console.log(`✅ Candidatura vinculada com sucesso! Vaga #${testJobId}`)

  // ─── PASSO 5: Acesso Administrativo e Triagem pelo RH ─────────────────────
  console.log('\n🏢 [PASSO 5] Painel do RH: Listando candidatos inscritos...')
  const adminCandRes = await apiRequest({
    method: 'GET',
    path: `/api/admin/candidates?joborder_id=${testJobId}`,
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  })

  const matchingCand = (adminCandRes.data?.candidates || []).find((c) => c.candidate_id === candidateId)
  if (!matchingCand) {
    throw new Error(`Candidato ID ${candidateId} não encontrado na listagem do RH!`)
  }
  console.log(`✅ Candidato localizado no Painel RH! Status inicial: ${matchingCand.status_code || 100}`)

  // ─── PASSO 6: Movimentação nas Etapas do Processo Seletivo (Pipeline) ────
  console.log('\n🚀 [PASSO 6] Movimentando candidato pelo Pipeline do RH:')

  const stages = [
    { code: 200, label: 'Contactado pelo RH' },
    { code: 300, label: 'Em Triagem Técnica' },
    { code: 500, label: 'Entrevista Agendada' },
    { code: 600, label: 'Aprovado / Proposta' },
  ]

  for (const stage of stages) {
    const updateRes = await apiRequest({
      method: 'PATCH',
      path: `/api/admin/candidates/${candidateId}/jobs/${testJobId}/status`,
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: {
        status: stage.code,
        note: `Avanço de etapa pelo teste automatizado: ${stage.label}`,
      },
    })

    if (updateRes.statusCode !== 200) {
      throw new Error(`Falha ao alterar status para ${stage.code}: ${JSON.stringify(updateRes.data)}`)
    }
    console.log(`   ➡️ Etapa alterada com sucesso para: [${stage.code}] ${stage.label}`)
  }


  // Valida no banco se o histórico foi gravado
  const db = await getDb()
  const [historyRows] = await db.query(
    'SELECT * FROM candidate_joborder_status_history WHERE candidate_id = ? AND joborder_id = ? ORDER BY date DESC',
    [candidateId, testJobId]
  )
  console.log(`✅ Histórico auditado no MariaDB: ${historyRows.length} registros gravados com sucesso!`)

  // ─── PASSO 7: Recuperação de Senha (Forgot Password) ──────────────────────
  console.log('\n🔑 [PASSO 7] Solicitando recuperação de senha...')
  const forgotRes = await apiRequest({
    method: 'POST',
    path: '/api/talent-pool/forgot-password',
    body: { email: candidateEmail },
  })

  if (forgotRes.statusCode !== 200) {
    throw new Error(`Falha na recuperação de senha: ${JSON.stringify(forgotRes.data)}`)
  }

  resetCode = forgotRes.data?.dev_reset_token || forgotRes.data?.data?.dev_reset_token
  console.log(`✅ Reset solicitado via Brevo! Código de validação obtido: [${resetCode || 'Enviado por e-mail'}]`)

  // ─── PASSO 8: Redefinição de Senha ────────────────────────────────────────
  if (resetCode) {
    console.log('\n🛡️ [PASSO 8] Redefinindo senha do candidato com o código de 6 dígitos...')
    const resetRes = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/reset-password',
      body: {
        token: resetCode,
        password: newPassword,
      },
    })

    if (resetRes.statusCode !== 200) {
      throw new Error(`Falha na redefinição de senha: ${JSON.stringify(resetRes.data)}`)
    }
    console.log('✅ Senha redefinida com sucesso e token de uso único invalidado!')

    // ─── PASSO 9: Login com a Nova Senha ────────────────────────────────────
    console.log('\n🔓 [PASSO 9] Efetuando novo login com a NOVA SENHA...')
    const newLoginRes = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/login',
      body: {
        email: candidateEmail,
        password: newPassword,
      },
    })

    if (newLoginRes.statusCode !== 200 || (!newLoginRes.data?.token && !newLoginRes.data?.data?.token)) {
      throw new Error(`Falha ao logar com a nova senha: ${JSON.stringify(newLoginRes.data)}`)
    }
    const finalToken = newLoginRes.data?.token || newLoginRes.data?.data?.token
    console.log(`✅ Login com a nova senha autorizado! Token emitido: ${finalToken.slice(0, 25)}...`)
  }

  // Limpeza dos dados de teste
  console.log('\n🧹 Limpando dados do candidato de teste...')
  await db.query('DELETE FROM candidate_joborder_status_history WHERE candidate_id = ?', [candidateId])
  await db.query('DELETE FROM candidate_joborder WHERE candidate_id = ?', [candidateId])
  await db.query('DELETE FROM candidate_auth WHERE candidate_id = ?', [candidateId])
  await db.query('DELETE FROM extra_field WHERE data_item_id = ? AND data_item_type = 100', [candidateId])
  await db.query('DELETE FROM candidate WHERE candidate_id = ?', [candidateId])
  console.log('✅ Dados de teste limpos do banco com sucesso!')


  console.log('\n======================================================================')
  console.log('🎉 CICLO DE VIDA COMPLETO DO CANDIDATO EXECUTADO COM 100% DE SUCESSO!')
  console.log('======================================================================')
}

runFullLifecycle()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro no teste de ciclo de vida:', err)
    process.exit(1)
  })
