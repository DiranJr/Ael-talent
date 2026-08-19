/**
 * A&L Talent — Bateria Completa de Testes de Hardening & Segurança Pós-Auditoria
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import mysql from 'mysql2/promise'
import {
  signCandidateToken,
  verifyCandidateToken,
  signAdminToken,
  verifyAdminToken,
  generateResetToken,
  hashResetToken,
} from './server/auth/tokens.js'
import { validateUploadedFile } from './server/upload.js'

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
  console.log('BATERIA DE TESTES DE HARDENING & SEGURANÇA — A&L TALENT + OPENCATS')
  console.log('======================================================================\n')

  const results = []
  const db = await getDb()

  try {
    // ─── TESTE 1: Tokens HMAC Timing-Safe e Validação Rigorosa ─────────
    console.log('--- TESTE 1: Tokens HMAC Timing-Safe (Unitário) ---')

  const validCandToken = signCandidateToken({ candidate_id: 999, email: 'cand@teste.com' })
  const validCandPayload = verifyCandidateToken(validCandToken)

  const validAdminToken = signAdminToken({ user_id: 888, user_name: 'admin_test' })
  const validAdminPayload = verifyAdminToken(validAdminToken)

  // Token expirado
  const now = Date.now()
  const expData = Buffer.from(JSON.stringify({ candidate_id: 999, exp: now - 1000 })).toString('base64url')
  const expSig = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'ael_talent_candidate_secret_2024').update(expData).digest('base64url')
  const expiredToken = `${expData}.${expSig}`
  const expiredResult = verifyCandidateToken(expiredToken)

  // Payload alterado (assinatura não bate)
  const [dataPart, sigPart] = validCandToken.split('.')
  const tamperedData = Buffer.from(JSON.stringify({ candidate_id: 1, exp: now + 999999 })).toString('base64url')
  const tamperedPayloadResult = verifyCandidateToken(`${tamperedData}.${sigPart}`)

  // Assinatura adulterada
  const tamperedSigResult = verifyCandidateToken(`${dataPart}.assinatura_falsa_invalida`)

  // Token truncado
  const truncatedResult = verifyCandidateToken(validCandToken.substring(0, 20))

  // Token sem ponto
  const noDotResult = verifyCandidateToken('token_sem_ponto_totalmente_invalido')

  // Ausência de candidate_id / user_id
  const noCandIdData = Buffer.from(JSON.stringify({ email: 'sem_id@teste.com', exp: now + 999999 })).toString('base64url')
  const noCandIdSig = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'ael_talent_candidate_secret_2024').update(noCandIdData).digest('base64url')
  const noCandIdResult = verifyCandidateToken(`${noCandIdData}.${noCandIdSig}`)

  const tokensPass = validCandPayload?.candidate_id === 999 &&
    validAdminPayload?.user_id === 888 &&
    expiredResult === null &&
    tamperedPayloadResult === null &&
    tamperedSigResult === null &&
    truncatedResult === null &&
    noDotResult === null &&
    noCandIdResult === null

  results.push({
    test: '1. Tokens HMAC Timing-Safe (Válido, Expirado, Adulterado, Truncado, Sem Ponto, Sem ID)',
    status: tokensPass ? 'APROVADO' : 'FALHOU',
    detail: `Cand ID: ${validCandPayload?.candidate_id}, Admin ID: ${validAdminPayload?.user_id}, Rejeições: ${expiredResult === null && tamperedSigResult === null}`
  })

  // ─── TESTE 2: Primeiro Acesso — Bloqueio de Account Takeover ─────────
  console.log('--- TESTE 2: Primeiro Acesso sem Senha — Bloqueio de Account Takeover ---')
  const legacyEmail = 'candidato.legado.sem.auth@aelengenharia.com.br'

  // Limpa registros prévios
  const [oldLeg] = await db.query('SELECT candidate_id FROM candidate WHERE email1 = ?', [legacyEmail])
  for (const c of oldLeg) {
    await db.query('DELETE FROM candidate_auth WHERE candidate_id = ?', [c.candidate_id])
    await db.query('DELETE FROM extra_field WHERE data_item_id = ? AND data_item_type = 100', [c.candidate_id])
    await db.query('DELETE FROM candidate WHERE candidate_id = ?', [c.candidate_id])
  }

  // Cria candidato legado apenas na tabela candidate (sem candidate_auth)
  const [insertLeg] = await db.query(
    `INSERT INTO candidate (first_name, last_name, email1, phone_cell, city, state, source, is_active, date_created, date_modified, entered_by)
     VALUES ('Lucas', 'Legado', ?, '94991119988', 'Parauapebas', 'PA', 'OpenCATS Legado', 1, NOW(), NOW(), 1)`,
    [legacyEmail]
  )
  const legCandId = insertLeg.insertId

  // 2.1 Tentativa de login direto enviando senha: deve responder first_access e NÃO criar hash
  const loginFirstAccess = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: legacyEmail, password: 'tentativaSenhaDireta123' }
  })

  const [authCheckLeg1] = await db.query('SELECT * FROM candidate_auth WHERE candidate_id = ?', [legCandId])
  const firstAccessProtected = loginFirstAccess.status === 200 &&
    loginFirstAccess.body.first_access === true &&
    authCheckLeg1.length === 0

  // 2.2 Tentativa de chamar /set-password sem Bearer Token nem autorização: deve responder 401
  const setPwdUnauthorized = await request('/api/talent-pool/set-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: legacyEmail, password: 'novaSenhaHacker999' }
  })

  const takeoverBlocked = setPwdUnauthorized.status === 401

  // 2.3 Fluxo legítimo de ativação via Forgot/Reset Token
  const forgotRes = await request('/api/talent-pool/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: legacyEmail }
  })
  const devToken = forgotRes.body?.dev_reset_token

  let activationSuccess = false
  if (devToken) {
    const activateRes = await request('/api/talent-pool/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { token: devToken, password: 'senhaAtivadaSegura123' }
    })

    const loginAfterActivation = await request('/api/talent-pool/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: legacyEmail, password: 'senhaAtivadaSegura123' }
    })

    activationSuccess = activateRes.status === 200 && loginAfterActivation.status === 200
  }

  const test2Pass = firstAccessProtected && takeoverBlocked && activationSuccess
  results.push({
    test: '2. Primeiro Acesso Seguro (Login first_access, /set-password 401, Ativação via Token)',
    status: test2Pass ? 'APROVADO' : 'FALHOU',
    detail: `Login sem auth: ${loginFirstAccess.body?.first_access}, Bloqueio 401: ${takeoverBlocked}, Ativação: ${activationSuccess}`
  })

  // ─── TESTE 3: /set-password com verifyCandidateToken ──────────────
  console.log('--- TESTE 3: /set-password com Bearer Token Válido vs Inválido ---')
  const candLogin = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: legacyEmail, password: 'senhaAtivadaSegura123' }
  })
  const validBearerToken = candLogin.body?.token

  // 3.1 Alteração com Bearer Token válido
  const setPwdValid = await request('/api/talent-pool/set-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validBearerToken}`,
    },
    body: { email: legacyEmail, password: 'senhaAlteradaViaBearer888' }
  })

  // 3.2 Tentativa com Bearer Token adulterado
  const setPwdInvalidBearer = await request('/api/talent-pool/set-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validBearerToken}_adulterado`,
    },
    body: { email: legacyEmail, password: 'senhaNaoAutorizada777' }
  })

  // 3.3 Login com a nova senha para confirmar persistência
  const loginNewPwd = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: legacyEmail, password: 'senhaAlteradaViaBearer888' }
  })

  const test3Pass = setPwdValid.status === 200 &&
    setPwdInvalidBearer.status === 401 &&
    loginNewPwd.status === 200

  results.push({
    test: '3. /set-password com verifyCandidateToken (Bearer válido: 200, Bearer inválido: 401)',
    status: test3Pass ? 'APROVADO' : 'FALHOU',
    detail: `Bearer Válido: ${setPwdValid.status}, Bearer Inválido: ${setPwdInvalidBearer.status}, Novo Login: ${loginNewPwd.status}`
  })

  // ─── TESTE 4: Bloqueio de Redefinição de Senha via /register ───────
  console.log('--- TESTE 4: Bloqueio de Alteração de Senha de Candidato Existente via /register ---')
  const regExistingWithPwd = await request('/api/talent-pool/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      first_name: 'Lucas',
      last_name: 'Legado Atualizado',
      email: legacyEmail,
      phone: '94991119988',
      city: 'Parauapebas',
      state: 'PA',
      password: 'senhaTentativaSobrescrever999',
    }
  })

  const loginWithHackerPwd = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: legacyEmail, password: 'senhaTentativaSobrescrever999' }
  })

  const loginWithOriginalPwd = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: legacyEmail, password: 'senhaAlteradaViaBearer888' }
  })

  const test4Pass = regExistingWithPwd.status === 409 &&
    loginWithHackerPwd.status === 401 &&
    loginWithOriginalPwd.status === 200

  results.push({
    test: '4. Bloqueio de Cadastro e Troca de Senha via /register para Candidato Existente',
    status: test4Pass ? 'APROVADO' : 'FALHOU',
    detail: `Tentativa anônima rejeitada com status 409: ${regExistingWithPwd.status === 409}, Senha original mantida (200)`
  })

  // ─── TESTE 5: Proteção de PII e Anti-Enumeração em /lookup ────────
  console.log('--- TESTE 5: /lookup Anti-Enumeração ---')
  const lookupExisting = await request(`/api/talent-pool/lookup?email=${encodeURIComponent(legacyEmail)}`)
  const lookupNonExisting = await request('/api/talent-pool/lookup?email=inexistente_total_999@teste.com')

  const noPiiLeaked = lookupExisting.status === 200 &&
    lookupExisting.body?.status === 'ok' &&
    lookupExisting.body?.first_name === undefined &&
    lookupExisting.body?.candidate_id === undefined &&
    lookupExisting.body?.has_password === undefined &&
    lookupNonExisting.body?.status === 'ok'

  results.push({
    test: '5. Proteção de PII e Anti-Enumeração em /lookup ({ status: "ok" })',
    status: noPiiLeaked ? 'APROVADO' : 'FALHOU',
    detail: `Resposta uniforme sem expor existência, nome ou status de senha`
  })

  // ─── TESTE 6: Validação de Assinatura Real de Arquivos (Uploads) ───
  console.log('--- TESTE 6: Validação de Magic Bytes de Uploads ---')
  const tmpDir = os.tmpdir()

  // 6.1 PDF Válido
  const validPdfPath = path.join(tmpDir, `test_valid_${Date.now()}.pdf`)
  await fs.promises.writeFile(validPdfPath, Buffer.from('%PDF-1.7\n%Fake PDF content for test\n%%EOF'))
  const validPdfRes = await validateUploadedFile(validPdfPath, 'curriculo.pdf')

  // 6.2 DOCX Válido
  const validDocxPath = path.join(tmpDir, `test_valid_${Date.now()}.docx`)
  const docxHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04])
  const docxContent = Buffer.from('[Content_Types].xml\nword/document.xml\nfake docx body')
  await fs.promises.writeFile(validDocxPath, Buffer.concat([docxHeader, docxContent]))
  const validDocxRes = await validateUploadedFile(validDocxPath, 'curriculo.docx')

  // 6.3 EXE disfarçado de PDF (MZ header)
  const exeAsPdfPath = path.join(tmpDir, `test_exe_${Date.now()}.pdf`)
  await fs.promises.writeFile(exeAsPdfPath, Buffer.from('MZ\x90\x00\x03\x00\x00\x00Fake Executable Binary'))
  const exeAsPdfRes = await validateUploadedFile(exeAsPdfPath, 'malware.pdf')

  // 6.4 Texto puro renomeado para .pdf
  const txtAsPdfPath = path.join(tmpDir, `test_txt_${Date.now()}.pdf`)
  await fs.promises.writeFile(txtAsPdfPath, Buffer.from('Este é um texto simples que não é PDF'))
  const txtAsPdfRes = await validateUploadedFile(txtAsPdfPath, 'texto.pdf')

  // 6.5 ZIP genérico renomeado para .docx sem estrutura Office
  const fakeZipDocxPath = path.join(tmpDir, `test_fakezip_${Date.now()}.docx`)
  await fs.promises.writeFile(fakeZipDocxPath, Buffer.concat([docxHeader, Buffer.from('fotos_viagem/imagem.jpg\nmusica.mp3')]))
  const fakeZipDocxRes = await validateUploadedFile(fakeZipDocxPath, 'arquivo.docx')

  // 6.6 Arquivo vazio (0 bytes)
  const emptyFilePath = path.join(tmpDir, `test_empty_${Date.now()}.pdf`)
  await fs.promises.writeFile(emptyFilePath, Buffer.alloc(0))
  const emptyFileRes = await validateUploadedFile(emptyFilePath, 'vazio.pdf')

  // Limpeza
  for (const p of [validPdfPath, validDocxPath, exeAsPdfPath, txtAsPdfPath, fakeZipDocxPath, emptyFilePath]) {
    try { await fs.promises.unlink(p) } catch (_) {}
  }

  const uploadValidationPass = validPdfRes.valid === true &&
    validDocxRes.valid === true &&
    exeAsPdfRes.valid === false &&
    txtAsPdfRes.valid === false &&
    fakeZipDocxRes.valid === false &&
    emptyFileRes.valid === false

  results.push({
    test: '6. Validação Real de Uploads (Magic Bytes: PDF, DOCX, EXE disfarçado, TXT, Fake ZIP, Vazio)',
    status: uploadValidationPass ? 'APROVADO' : 'FALHOU',
    detail: `PDF: ${validPdfRes.valid}, DOCX: ${validDocxRes.valid}, EXE bloqueado: ${!exeAsPdfRes.valid}, TXT bloqueado: ${!txtAsPdfRes.valid}, Fake ZIP bloqueado: ${!fakeZipDocxRes.valid}`
  })

  // ─── TESTE 7: Filtros SQL e Paginação no Banco de Talentos (>200) ───
  console.log('--- TESTE 7: Filtros SQL e Paginação do Banco de Talentos com 250+ registros ---')
  const adminLogin = await request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'admin', password: 'admin' }
  })
  const adminToken = adminLogin.body?.token

  const seedPrefix = `seed_test_${Date.now()}`
  const testCandidateIds = []

  // Insere 220 candidatos "Operação de Mina" e 10 "Engenharia de Automação Avançada"
  console.log('    Inserindo lote de 230 candidatos fictícios para validar filtros pós-LIMIT 200...')
  for (let i = 1; i <= 220; i++) {
    const [ins] = await db.query(
      `INSERT INTO candidate (first_name, last_name, email1, phone_cell, city, state, source, is_active, date_created, date_modified, entered_by)
       VALUES (?, 'Ficticio', ?, '94990001122', 'Parauapebas', 'PA', 'Seed Test', 1, DATE_SUB(NOW(), INTERVAL ? MINUTE), NOW(), 1)`,
      [`OpMina_${i}`, `${seedPrefix}_op_${i}@teste.com`, i + 50]
    )
    testCandidateIds.push(ins.insertId)
    await db.query(
      'INSERT INTO extra_field (data_item_id, field_name, value, import_id, data_item_type) VALUES (?, ?, ?, 0, 100)',
      [ins.insertId, 'Area de Interesse', 'Operacao de Mina']
    )
  }

  // 10 candidatos especiais criados propositalmente com data mais antiga (que ficariam além do índice 200 se ordenado por date_created)
  for (let i = 1; i <= 10; i++) {
    const [ins] = await db.query(
      `INSERT INTO candidate (first_name, last_name, email1, phone_cell, city, state, source, is_active, date_created, date_modified, entered_by)
       VALUES (?, 'Especial', ?, '94998881122', 'Maraba', 'PA', 'Seed Test', 1, DATE_SUB(NOW(), INTERVAL ? MINUTE), NOW(), 1)`,
      [`EngAuto_${i}`, `${seedPrefix}_eng_${i}@teste.com`, 400 + i]
    )
    testCandidateIds.push(ins.insertId)
    await db.query(
      'INSERT INTO extra_field (data_item_id, field_name, value, import_id, data_item_type) VALUES (?, ?, ?, 0, 100)',
      [ins.insertId, 'Area de Interesse', 'Engenharia de Automacao Avancada']
    )
  }

  // Consulta com filtro por área "Engenharia de Automacao Avancada"
  const filterRes = await request('/api/talent-pool/candidates?area=Engenharia de Automacao Avancada&page=1&limit=50', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })

  const totalFiltered = filterRes.body?.total
  const returnedCount = filterRes.body?.candidates?.length
  const allMatchArea = filterRes.body?.candidates?.every(c => c.interest_area === 'Engenharia de Automacao Avancada')

  // Limpeza dos 230 candidatos de teste
  console.log('    Limpando lote de teste...')
  if (testCandidateIds.length > 0) {
    await db.query('DELETE FROM extra_field WHERE data_item_type = 100 AND data_item_id IN (?)', [testCandidateIds])
    await db.query('DELETE FROM candidate WHERE candidate_id IN (?)', [testCandidateIds])
  }

  const test7Pass = filterRes.status === 200 &&
    totalFiltered === 10 &&
    returnedCount === 10 &&
    allMatchArea === true

  results.push({
    test: '7. Filtros SQL Nativos no Banco de Talentos (Resgata registros além da posição 200)',
    status: test7Pass ? 'APROVADO' : 'FALHOU',
    detail: `Total encontrado: ${totalFiltered}/10, Retornados na página: ${returnedCount}, Correspondência exata: ${allMatchArea}`
  })

  // ─── TESTE 8: Bloqueio de Força Bruta e Lockout ───────────────────
  console.log('--- TESTE 8: Proteção contra Força Bruta (Lockout HTTP 423) ---')
  const bruteEmail = 'brute.test@aelengenharia.com.br'

  // Limpa e cadastra
  const [oldBrute] = await db.query('SELECT candidate_id FROM candidate WHERE email1 = ?', [bruteEmail])
  for (const c of oldBrute) {
    await db.query('DELETE FROM candidate_auth WHERE candidate_id = ?', [c.candidate_id])
    await db.query('DELETE FROM candidate WHERE candidate_id = ?', [c.candidate_id])
  }

  const regBrute = await request('/api/talent-pool/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      first_name: 'Brute',
      last_name: 'Test',
      email: bruteEmail,
      phone: '94998887711',
      city: 'Parauapebas',
      state: 'PA',
      password: 'senhaValida12345',
    }
  })
  const bruteCandId = regBrute.body?.candidate_id

  for (let i = 1; i <= 5; i++) {
    await request('/api/talent-pool/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: bruteEmail, password: `senhaErrada_${i}` }
    })
  }

  // 6ª tentativa bloqueada com 423
  const attempt6 = await request('/api/talent-pool/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: bruteEmail, password: 'senhaValida12345' }
  })

  const isLocked = attempt6.status === 423
  results.push({
    test: '8. Bloqueio de Conta por Força Bruta (HTTP 423 Locked)',
    status: isLocked ? 'APROVADO' : 'FALHOU',
    detail: `Status na 6ª tentativa consecutiva: ${attempt6.status}`
  })

  // ─── TESTE 9: Single-Use de Token de Redefinição ───────────────────
  console.log('--- TESTE 9: Single-Use e Replay Attack de Token ---')
  await db.query('UPDATE candidate_auth SET locked_until = NULL, failed_attempts = 0 WHERE candidate_id = ?', [bruteCandId])

  const forgotBrute = await request('/api/talent-pool/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: bruteEmail }
  })
  const resetTokenSingle = forgotBrute.body?.dev_reset_token

  let singleUsePass = false
  if (resetTokenSingle) {
    const use1 = await request('/api/talent-pool/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { token: resetTokenSingle, password: 'senhaRedefinidaNova123' }
    })

    const use2Replay = await request('/api/talent-pool/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { token: resetTokenSingle, password: 'tentativaReplay999' }
    })

    singleUsePass = use1.status === 200 && use2Replay.status === 400
  }

  results.push({
    test: '9. Single-Use de Token (1º uso: 200, 2º uso/replay: 400)',
    status: singleUsePass ? 'APROVADO' : 'FALHOU',
    detail: `Token invalidado imediatamente após o primeiro uso: ${singleUsePass}`
  })

  // ─── TESTE 10: Rate Limiting Real por IP ─────────────────────────
  console.log('--- TESTE 10: Rate Limiting por IP (sem bypass) ---')
  let hitRateLimit = false
  for (let i = 0; i < 15; i++) {
    const rlRes = await request('/api/talent-pool/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      skipBypass: true,
      body: { email: `rate_limit_probe_${i}@teste.com` }
    })
    if (rlRes.status === 429) {
      hitRateLimit = true
      break
    }
  }

  results.push({
    test: '10. Rate Limiting por IP (HTTP 429 Too Many Requests)',
    status: hitRateLimit ? 'APROVADO' : 'FALHOU',
    detail: `Limitador ativado com HTTP 429 sem header de bypass: ${hitRateLimit}`
  })

  } finally {
    // Teardown: limpeza automática de massas de teste
    try {
      const [testCands] = await db.query(`
        SELECT candidate_id FROM candidate
        WHERE email1 LIKE '%@aelengenharia.com.br' OR email1 LIKE '%brute%' OR email1 LIKE '%auditoria%' OR email1 LIKE '%legado%'
      `)
      const testIds = testCands.map((c) => c.candidate_id)
      if (testIds.length > 0) {
        await db.query(`DELETE FROM attachment WHERE data_item_type = 100 AND data_item_id IN (?)`, [testIds])
        await db.query(`DELETE FROM extra_field WHERE data_item_type = 100 AND data_item_id IN (?)`, [testIds])
        await db.query(`DELETE FROM candidate_joborder_status_history WHERE candidate_id IN (?)`, [testIds])
        await db.query(`DELETE FROM candidate_joborder WHERE candidate_id IN (?)`, [testIds])
        await db.query(`DELETE FROM candidate WHERE candidate_id IN (?)`, [testIds])
      }
    } catch (cleanErr) {
      console.warn('Aviso de limpeza de teste:', cleanErr.message)
    }

    await db.end()
  }

  console.log('\n======================================================================')
  console.log('RESUMO FINAL DOS TESTES DE HARDENING & SEGURANÇA:')
  console.log('======================================================================')
  console.table(results)

  const allPassed = results.every((r) => r.status === 'APROVADO')
  console.log(`\nStatus Geral: ${allPassed ? '✅ 100% APROVADO' : '❌ FALHAS ENCONTRADAS'}\n`)
}

runHardeningTests().catch(console.error)



