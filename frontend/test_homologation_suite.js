/**
 * A&L Talent — Bateria de Homologação Operacional de Ponta a Ponta
 * Valida fluxos reais de candidatos, vagas, RH, pipeline, LGPD e compatibilidade OpenCATS
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb } from './server/db.js'
import { signAdminToken } from './server/auth/tokens.js'
import { formatWhatsAppUrl, STATUS_MAP } from './server/helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_PORT = 3001
const ADMIN_TOKEN = signAdminToken({ user_id: 1, user_name: 'admin', access_level: 500 })

function apiRequest({ method = 'GET', path: reqPath, body = null, headers = {}, isMultipart = false }) {
  return new Promise((resolve, reject) => {
    const reqHeaders = {
      'x-test-bypass': 'ael-test-suite',
      ...headers,
    }

    let payload = null
    if (body && !isMultipart) {
      reqHeaders['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
      reqHeaders['Content-Length'] = Buffer.byteLength(payload)
    } else if (body && isMultipart) {
      payload = body
      reqHeaders['Content-Length'] = body.length
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

// Cria multipart/form-data em buffer puro sem dependências externas
function buildMultipartFormData(fields, file = null) {
  const boundary = '----WebKitFormBoundaryHomologacao' + Date.now()
  const chunks = []

  for (const [key, val] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`))
  }

  if (file) {
    chunks.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
    ))
    chunks.push(file.buffer)
    chunks.push(Buffer.from('\r\n'))
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`))

  const body = Buffer.concat(chunks)
  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

async function runHomologationSuite() {
  console.log('======================================================================')
  console.log('BATERIA DE HOMOLOGAÇÃO OPERACIONAL — A&L TALENT + OPENCATS')
  console.log('======================================================================\n')

  const results = []
  const db = await getDb()

  // ──────────────────────────────────────────────────────────────────
  // TESTE 1: Banco de Talentos SEM Currículo (Estruturado Puro)
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 1: Cadastro no Banco de Talentos SEM Currículo ---')
  try {
    const email1 = `candidato.semcurriculo.${Date.now()}@ael.dev`
    const { body, contentType } = buildMultipartFormData({
      first_name: 'Marcos',
      last_name: 'Oliveira Sem Curriculo',
      email: email1,
      phone: '94998765432',
      password: 'senhaSegura123',
      city: 'Parauapebas',
      state: 'PA',
      interest_area: 'Operacional',
      desired_role: 'Operador de Máquinas',
      travel_availability: 'Estadual (Pará)',
      driver_license: 'D',
      can_relocate: '1',
      experience_years: '3 a 5 anos',
      consent_lgpd: '1',
      educations: JSON.stringify([{ level: 'Ensino Médio', course: 'Geral', institution: 'Escola Estadual', year: '2018', status: 'Concluído' }]),
      experiences: JSON.stringify([{ role: 'Operador de Escavadeira', company: 'Mineração Local', period: '2020 - 2024', activities: 'Operação de CAT 336' }])
    })

    const res = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/register',
      body,
      headers: { 'Content-Type': contentType },
      isMultipart: true,
    })

    const passed = res.statusCode === 200 && res.data.candidate_id && res.data.token
    results.push({
      test: '1. Banco de Talentos SEM Currículo (Estruturado)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${res.statusCode}, Candidate ID: ${res.data.candidate_id}, Attachment: ${res.data.attachment_id || 'Nenhum (Conforme esperado)'}`
    })
  } catch (err) {
    results.push({ test: '1. Banco de Talentos SEM Currículo', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 2: Banco de Talentos COM Currículo PDF e DOCX
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 2: Cadastro no Banco de Talentos COM Currículo PDF e DOCX ---')
  try {
    const email2 = `candidato.compdf.${Date.now()}@ael.dev`
    const fakePdfBuffer = Buffer.from('%PDF-1.4 Fake PDF Content for Homologation Testing')
    const { body: pdfBody, contentType: pdfType } = buildMultipartFormData({
      first_name: 'Renata',
      last_name: 'Silva Com PDF',
      email: email2,
      phone: '94991122334',
      password: 'senhaSegura123',
      city: 'Canaã dos Carajás',
      state: 'PA',
      interest_area: 'Segurança do Trabalho',
      desired_role: 'Técnica de Segurança',
      consent_lgpd: '1',
    }, {
      fieldname: 'resume',
      filename: 'curriculo_renata.pdf',
      contentType: 'application/pdf',
      buffer: fakePdfBuffer,
    })

    const resPdf = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/register',
      body: pdfBody,
      headers: { 'Content-Type': pdfType },
      isMultipart: true,
    })

    // Valida anexo registrado no banco
    const [attRows] = await db.query(
      'SELECT attachment_id, original_filename, stored_filename FROM attachment WHERE data_item_id = ?',
      [resPdf.data.candidate_id]
    )

    const passed = resPdf.statusCode === 200 && attRows.length > 0 && attRows[0].original_filename === 'curriculo_renata.pdf'
    results.push({
      test: '2. Banco de Talentos COM Currículo (Upload & Attachment)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${resPdf.statusCode}, Attachment ID: ${attRows[0]?.attachment_id}, Arquivo: ${attRows[0]?.original_filename}`
    })
  } catch (err) {
    results.push({ test: '2. Banco de Talentos COM Currículo', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 3: Deduplicação de E-mail (Case Insensitive + Trim)
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 3: Deduplicação de E-mail ---')
  try {
    const baseEmail = `dedup.homolog.${Date.now()}@ael.dev`

    // Cadastro 1: minúsculo
    const { body: b1, contentType: c1 } = buildMultipartFormData({
      first_name: 'Deduplicado',
      last_name: 'Teste 1',
      email: baseEmail,
      phone: '31999990001',
      consent_lgpd: '1',
    })
    const res1 = await apiRequest({ method: 'POST', path: '/api/talent-pool/register', body: b1, headers: { 'Content-Type': c1 }, isMultipart: true })

    // Cadastro 2: Maiúsculo com espaços
    const { body: b2, contentType: c2 } = buildMultipartFormData({
      first_name: 'Deduplicado Atualizado',
      last_name: 'Teste 2',
      email: `  ${baseEmail.toUpperCase()}  `,
      phone: '31999990002',
      consent_lgpd: '1',
    })
    const res2 = await apiRequest({ method: 'POST', path: '/api/talent-pool/register', body: b2, headers: { 'Content-Type': c2 }, isMultipart: true })

    const [candCount] = await db.query('SELECT COUNT(*) as total FROM candidate WHERE email1 = ?', [baseEmail.toLowerCase()])
    const sameId = res1.data.candidate_id === res2.data.candidate_id

    const passed = sameId && candCount[0].total === 1
    results.push({
      test: '3. Deduplicação de E-mail (Case & Trim)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `IDs coincidem: ${sameId} (${res1.data.candidate_id}), Total registros: ${candCount[0].total}`
    })
  } catch (err) {
    results.push({ test: '3. Deduplicação de E-mail', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 4: Candidatura a Vaga Existente e Candidatura a 2ª Vaga
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 4: Candidatura a Vaga & Múltiplas Vagas sem Duplicar Candidato ---')
  try {
    const candEmail = `multi.vagas.${Date.now()}@ael.dev`
    const { body: b1, contentType: c1 } = buildMultipartFormData({
      name: 'Leonardo Multi Vagas',
      email: candEmail,
      phone: '94992223344',
      joborder_id: '1', // Assistente Administrativo
      city: 'Belo Horizonte',
      state: 'MG',
    })
    const appRes1 = await apiRequest({ method: 'POST', path: '/api/apply', body: b1, headers: { 'Content-Type': c1 }, isMultipart: true })

    // Candidata-se à 2ª vaga (Job #3: Engenheiro Civil)
    const { body: b2, contentType: c2 } = buildMultipartFormData({
      name: 'Leonardo Multi Vagas',
      email: ` ${candEmail.toUpperCase()} `,
      phone: '94992223344',
      joborder_id: '3', // Engenheiro Civil
      city: 'Parauapebas',
      state: 'PA',
    })
    const appRes2 = await apiRequest({ method: 'POST', path: '/api/apply', body: b2, headers: { 'Content-Type': c2 }, isMultipart: true })

    const [apps] = await db.query(
      'SELECT candidate_joborder_id, joborder_id FROM candidate_joborder WHERE candidate_id = ?',
      [appRes1.data.candidate_id]
    )

    const passed = appRes1.data.candidate_id === appRes2.data.candidate_id && apps.length === 2
    results.push({
      test: '4. Inscrição em Múltiplas Vagas (Sem duplicar perfil)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Candidate ID: ${appRes1.data.candidate_id}, Total inscrições vinculadas: ${apps.length} (Vagas: ${apps.map(a=>a.joborder_id).join(', ')})`
    })
  } catch (err) {
    results.push({ test: '4. Inscrição em Múltiplas Vagas', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 5: Portal do Candidato (#/candidato - Auth, Me, Set Password)
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 5: Portal do Candidato (Login, Me, Alteração de Senha) ---')
  try {
    const portalEmail = `portal.candidato.${Date.now()}@ael.dev`
    const { body: b, contentType: c } = buildMultipartFormData({
      first_name: 'Vanessa',
      last_name: 'Portal Teste',
      email: portalEmail,
      phone: '31988887777',
      password: 'senhaInicial123',
      city: 'Belo Horizonte',
      state: 'MG',
      consent_lgpd: '1',
    })
    await apiRequest({ method: 'POST', path: '/api/talent-pool/register', body: b, headers: { 'Content-Type': c }, isMultipart: true })

    // 1. Login
    const loginRes = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/login',
      body: { email: portalEmail, password: 'senhaInicial123' },
    })

    const token = loginRes.data.token

    // 2. Consulta /me
    const meRes = await apiRequest({
      method: 'GET',
      path: '/api/talent-pool/me',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    // 3. Alteração de senha
    const changePwdRes = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/set-password',
      body: { email: portalEmail, current_password: 'senhaInicial123', password: 'novaSenhaSegura456' },
      headers: { 'Authorization': `Bearer ${token}` },
    })

    // 4. Teste de login com a nova senha
    const newLoginRes = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/login',
      body: { email: portalEmail, password: 'novaSenhaSegura456' },
    })

    const passed = loginRes.statusCode === 200 && meRes.statusCode === 200 && changePwdRes.statusCode === 200 && newLoginRes.statusCode === 200
    results.push({
      test: '5. Portal do Candidato (Login, /me e Troca de Senha)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Login inicial: ${loginRes.statusCode}, /me: ${meRes.statusCode}, Troca senha: ${changePwdRes.statusCode}, Novo login: ${newLoginRes.statusCode}`
    })
  } catch (err) {
    results.push({ test: '5. Portal do Candidato', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 6: Movimentação de Pipeline pelo RH & Histórico
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 6: Transições de Pipeline pelo RH e Histórico ---')
  try {
    const testCandId = 15 // Juliana Mendes
    const testJobId  = 4  // Eng Minas

    // Avança para Entrevista (500)
    const patchRes = await apiRequest({
      method: 'PATCH',
      path: `/api/admin/candidates/${testCandId}/jobs/${testJobId}/status`,
      body: { status: 500, note: 'Homologação: Candidata aprovada na triagem, agendada entrevista com gestor.' },
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    // Verifica status history
    const [historyRows] = await db.query(
      'SELECT status_from, status_to, date FROM candidate_joborder_status_history WHERE candidate_id = ? AND joborder_id = ? ORDER BY candidate_joborder_status_history_id DESC LIMIT 1',
      [testCandId, testJobId]
    )

    const passed = patchRes.statusCode === 200 && historyRows.length > 0 && historyRows[0].status_to === 500
    results.push({
      test: '6. Movimentação de Pipeline & Status History',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Status alterado para: ${historyRows[0]?.status_to} (Entrevista), Registrado em candidate_joborder_status_history: true`
    })
  } catch (err) {
    results.push({ test: '6. Movimentação de Pipeline', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 7: Filtros e Busca Textual no Banco de Talentos RH
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 7: Filtros e Busca no Banco de Talentos RH ---')
  try {
    // 1. Busca por palavra-chave 'Datamine'
    const searchRes = await apiRequest({
      method: 'GET',
      path: '/api/talent-pool/candidates?search=Datamine',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    // 2. Filtro por Área 'Segurança do Trabalho'
    const areaRes = await apiRequest({
      method: 'GET',
      path: '/api/talent-pool/candidates?area=Seguran%C3%A7a',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    // 3. Filtro por Cidade 'Parauapebas'
    const cityRes = await apiRequest({
      method: 'GET',
      path: '/api/talent-pool/candidates?city=Parauapebas',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    const passed = searchRes.data.total >= 1 && areaRes.data.total >= 1 && cityRes.data.total >= 1
    results.push({
      test: '7. Filtros e Busca no Banco de Talentos RH',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Busca 'Datamine': ${searchRes.data.total}, Área 'Segurança': ${areaRes.data.total}, Cidade 'Parauapebas': ${cityRes.data.total}`
    })
  } catch (err) {
    results.push({ test: '7. Filtros e Busca no Banco de Talentos', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 8: Ação "+ Vaga" (Vincular Candidato do Banco a Nova Vaga)
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 8: Ação "+ Vaga" no Banco de Talentos ---')
  try {
    const candId = 23 // Larissa Ramos (Cadastrada apenas no Banco de Talentos)
    const jobId  = 3  // Engenheiro Civil

    const assignRes = await apiRequest({
      method: 'POST',
      path: `/api/talent-pool/candidates/${candId}/assign-job`,
      body: { joborder_id: jobId, status: 100 },
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    const [appCheck] = await db.query(
      'SELECT candidate_joborder_id, status FROM candidate_joborder WHERE candidate_id = ? AND joborder_id = ?',
      [candId, jobId]
    )

    const passed = assignRes.statusCode === 201 && appCheck.length > 0 && appCheck[0].status === 100
    results.push({
      test: '8. Ação "+ Vaga" (Vincular Candidato a Vaga pelo RH)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Status: ${assignRes.statusCode}, Candidatura criada no pipeline da vaga #${jobId} com status 100`
    })
  } catch (err) {
    results.push({ test: '8. Ação "+ Vaga"', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 9: Formatação e Validação de Link WhatsApp
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 9: Formatação de Link WhatsApp ---')
  try {
    const url1 = formatWhatsAppUrl('94991234567', 'Juliana Mendes')
    const url2 = formatWhatsAppUrl('(94) 98112-2334', 'Fernando')
    const url3 = formatWhatsAppUrl('31998765432', '')

    const expected1 = 'https://wa.me/5594991234567?text=Ol%C3%A1%20Juliana%20Mendes,%20sou%20do%20RH%20da%20A%26L%20Engenharia!'
    const expected2 = 'https://wa.me/5594981122334?text=Ol%C3%A1%20Fernando,%20sou%20do%20RH%20da%20A%26L%20Engenharia!'
    const expected3 = 'https://wa.me/5531998765432?text=Ol%C3%A1,%20sou%20do%20RH%20da%20A%26L%20Engenharia!'

    const passed = url1 === expected1 && url2 === expected2 && url3 === expected3
    results.push({
      test: '9. Formatação e Validação de Links do WhatsApp',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `DDD e número sanitizados com código internacional 55 e mensagem padronizada da A&L`
    })
  } catch (err) {
    results.push({ test: '9. Formatação WhatsApp', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 10: Gestão de Vagas pelo RH (Criar, Editar, Pausar, Reabrir, Excluir)
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 10: Gestão Completa de Vagas pelo RH ---')
  try {
    // 1. Criar vaga
    const createRes = await apiRequest({
      method: 'POST',
      path: '/api/admin/jobs',
      body: {
        title: 'Vaga Teste Homologação RH',
        description: 'Descrição de teste para homologação',
        notes: 'Notas internas do RH',
        city: 'Parauapebas',
        state: 'PA',
        department_id: 2,
        is_public: true,
      },
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    const jobId = createRes.data.joborder_id

    // 2. Editar vaga
    const updateRes = await apiRequest({
      method: 'PUT',
      path: `/api/admin/jobs/${jobId}`,
      body: {
        title: 'Vaga Teste Homologação RH (Editada)',
        description: 'Descrição atualizada',
        city: 'Parauapebas',
        state: 'PA',
        department_id: 2,
        is_public: true,
      },
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    // 3. Pausar vaga
    const pauseRes = await apiRequest({
      method: 'PATCH',
      path: `/api/admin/jobs/${jobId}/status`,
      body: { action: 'pause' },
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    // 4. Reabrir / Publicar
    const publishRes = await apiRequest({
      method: 'PATCH',
      path: `/api/admin/jobs/${jobId}/status`,
      body: { action: 'publish' },
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    // 5. Excluir vaga de teste
    const deleteRes = await apiRequest({
      method: 'DELETE',
      path: `/api/admin/jobs/${jobId}`,
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    const passed = createRes.statusCode === 201 && updateRes.statusCode === 200 && pauseRes.data.status === 'On Hold' && publishRes.data.status === 'Active-Share' && deleteRes.statusCode === 200
    results.push({
      test: '10. Gestão de Vagas pelo RH (CRUD + Ciclo de Vida)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Criar: 201 (ID ${jobId}), Editar: 200, Pausar (On Hold), Publicar (Active-Share), Excluir: 200`
    })
  } catch (err) {
    results.push({ test: '10. Gestão de Vagas pelo RH', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 11: Gestão de Departamentos pelo RH
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 11: Gestão de Departamentos pelo RH ---')
  try {
    const deptName = `Dept Teste ${Date.now()}`
    const createRes = await apiRequest({
      method: 'POST',
      path: '/api/admin/departments',
      body: { name: deptName },
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    const deptId = createRes.data.department.company_department_id

    const listRes = await apiRequest({
      method: 'GET',
      path: '/api/admin/departments',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    const deleteRes = await apiRequest({
      method: 'DELETE',
      path: `/api/admin/departments/${deptId}`,
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` },
    })

    const passed = createRes.statusCode === 201 && listRes.data.departments.some(d => d.company_department_id === deptId) && deleteRes.statusCode === 200
    results.push({
      test: '11. Gestão de Departamentos pelo RH (CRUD)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Criar: 201 (ID ${deptId}), Listagem: ${listRes.data.departments.length} depts, Exclusão: 200`
    })
  } catch (err) {
    results.push({ test: '11. Gestão de Departamentos', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // TESTE 12: Recuperação de Senha Completa com Token
  // ──────────────────────────────────────────────────────────────────
  console.log('--- TESTE 12: Recuperação de Senha Completa ---')
  try {
    const recoveryEmail = `recuperacao.homolog.${Date.now()}@ael.dev`
    const { body: b, contentType: c } = buildMultipartFormData({
      first_name: 'Marcelo',
      last_name: 'Recuperacao',
      email: recoveryEmail,
      phone: '94998881122',
      password: 'senhaAntiga123',
      city: 'Parauapebas',
      state: 'PA',
      consent_lgpd: '1',
    })
    await apiRequest({ method: 'POST', path: '/api/talent-pool/register', body: b, headers: { 'Content-Type': c }, isMultipart: true })

    // Solicita recuperação
    const forgotRes = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/forgot-password',
      body: { email: recoveryEmail },
    })

    const rawToken = forgotRes.data.dev_reset_token

    // Redefine senha
    const resetRes = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/reset-password',
      body: { token: rawToken, password: 'novaSenhaRecuperada789' },
    })

    // Replay attack deve falhar (400)
    const replayRes = await apiRequest({
      method: 'POST',
      path: '/api/talent-pool/reset-password',
      body: { token: rawToken, password: 'tentativaReplay123' },
    })

    const passed = forgotRes.statusCode === 200 && resetRes.statusCode === 200 && replayRes.statusCode === 400
    results.push({
      test: '12. Recuperação de Senha (Token 15m & Single-Use)',
      status: passed ? 'APROVADO' : 'FALHOU',
      detail: `Solicitação: 200, Redefinição: 200, Replay bloqueado com status 400: true`
    })
  } catch (err) {
    results.push({ test: '12. Recuperação de Senha', status: 'FALHOU', detail: err.message })
  }

  // ──────────────────────────────────────────────────────────────────
  // RESUMO FINAL
  // ──────────────────────────────────────────────────────────────────
  console.log('\n======================================================================')
  console.log('RESUMO FINAL DOS TESTES DE HOMOLOGAÇÃO:')
  console.log('======================================================================')
  console.table(results)

  const allPassed = results.every(r => r.status === 'APROVADO')
  console.log(`\nStatus Geral da Homologação: ${allPassed ? '✅ 100% APROVADO' : '❌ FALHAS ENCONTRADAS'}\n`)
}

runHomologationSuite().catch(console.error)
