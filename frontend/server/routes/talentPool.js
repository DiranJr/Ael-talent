/**
 * A&L Talent — Rotas do Banco de Talentos, Candidaturas & Portal do Candidato
 *
 * Arquitetura de Autenticação Hardened & Helpers Centralizados
 */

import express from 'express'
import { getDb } from '../db.js'
import { upload } from '../upload.js'
import { adminAuth } from './admin.js'
import {
  hashPassword,
  verifyPassword,
  dummyPasswordVerify,
  validatePasswordPolicy,
} from '../auth/password.js'
import {
  signCandidateToken,
  generateResetToken,
  hashResetToken,
} from '../auth/tokens.js'
import {
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
} from '../auth/rateLimit.js'
import { candidateAuth } from '../auth/candidateAuth.js'
import {
  saveCandidateAttachment,
  getCandidateExtraFields,
  formatCandidateProfile,
  sendSuccess,
  sendError,
  formatWhatsAppUrl,
  STATUS_MAP,
} from '../helpers.js'

const router = express.Router()

// Helper: formata objeto completo do candidato para resposta
async function getFormattedCandidate(db, candidateId) {
  const [candRows] = await db.query('SELECT * FROM candidate WHERE candidate_id = ?', [candidateId])
  if (!candRows.length) return null
  const c = candRows[0]

  const extras = await getCandidateExtraFields(db, candidateId, false)

  // Candidaturas
  const [apps] = await db.query(
    `SELECT
      cj.candidate_joborder_id,
      cj.joborder_id,
      cj.status AS status_code,
      cj.date_created AS applied_at,
      j.title AS job_title,
      j.city AS job_city,
      j.state AS job_state,
      d.name AS department_name,
      cjs.short_description AS status_label
     FROM candidate_joborder cj
     JOIN joborder j ON j.joborder_id = cj.joborder_id
     LEFT JOIN company_department d ON d.company_department_id = j.company_department_id
     LEFT JOIN candidate_joborder_status cjs ON cjs.candidate_joborder_status_id = cj.status
     WHERE cj.candidate_id = ?
     ORDER BY cj.date_created DESC`,
    [candidateId]
  )

  const [attachments] = await db.query(
    `SELECT attachment_id, original_filename, file_size_kb, date_created
     FROM attachment
     WHERE data_item_type = 100 AND data_item_id = ?
     ORDER BY date_created DESC`,
    [candidateId]
  )

  const [activities] = await db.query(
    `SELECT activity_id, notes, date_created
     FROM activity
     WHERE data_item_type = 100 AND data_item_id = ?
     ORDER BY date_created DESC LIMIT 20`,
    [candidateId]
  )

  return formatCandidateProfile(c, extras, apps, attachments, activities)
}

// ============================================================================
// 1. LOOKUP DE STATUS DE CADASTRO POR E-MAIL (Proteção de PII)
// ============================================================================
router.get('/lookup', async (req, res) => {
  try {
    const { email } = req.query
    if (!email?.trim()) {
      return sendError(res, 'E-mail é obrigatório.', 400)
    }

    const db = await getDb()
    const cleanEmail = email.trim().toLowerCase()

    const [candRows] = await db.query(
      'SELECT candidate_id, first_name FROM candidate WHERE (email1 = ? OR email2 = ?) AND is_active = 1 LIMIT 1',
      [cleanEmail, cleanEmail]
    )

    if (!candRows.length) {
      return res.json({ found: false, candidate: null })
    }

    const c = candRows[0]
    const [authRows] = await db.query(
      'SELECT id FROM candidate_auth WHERE candidate_id = ? LIMIT 1',
      [c.candidate_id]
    )

    return res.json({
      found: true,
      has_password: authRows.length > 0,
      first_name: c.first_name,
    })
  } catch (err) {
    console.error('Erro no lookup do candidato:', err)
    return sendError(res, 'Erro ao verificar e-mail.', 500)
  }
})

// ============================================================================
// 2. LOGIN DO CANDIDATO (candidate_auth + Proteção contra Força Bruta & Lockout)
// ============================================================================
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email?.trim()) {
      return sendError(res, 'Informe seu e-mail.', 400)
    }

    const db = await getDb()
    const cleanEmail = email.trim().toLowerCase()

    const [candRows] = await db.query(
      'SELECT candidate_id, first_name, last_name, email1 FROM candidate WHERE (email1 = ? OR email2 = ?) AND is_active = 1 LIMIT 1',
      [cleanEmail, cleanEmail]
    )

    // Mitigação de enumeração de contas por tempo de resposta
    if (!candRows.length) {
      dummyPasswordVerify()
      return sendError(res, 'E-mail ou senha inválidos.', 401)
    }

    const c = candRows[0]
    const [authRows] = await db.query(
      'SELECT id, password_hash, failed_attempts, locked_until FROM candidate_auth WHERE candidate_id = ? LIMIT 1',
      [c.candidate_id]
    )

    // Primeiro acesso (sem senha configurada)
    if (!authRows.length) {
      if (!password?.trim()) {
        return res.json({
          first_access: true,
          message: 'Primeiro acesso detectado. Crie uma senha para acessar seu perfil com segurança.'
        })
      } else {
        const policyCheck = validatePasswordPolicy(password.trim())
        if (!policyCheck.valid) {
          return sendError(res, policyCheck.error, 400)
        }

        const newHash = hashPassword(password.trim())
        await db.query(
          `INSERT INTO candidate_auth (candidate_id, password_hash, failed_attempts, last_login, created_at, updated_at)
           VALUES (?, ?, 0, NOW(), NOW(), NOW())`,
          [c.candidate_id, newHash]
        )

        const token = signCandidateToken({
          candidate_id: c.candidate_id,
          email: c.email1,
          name: `${c.first_name} ${c.last_name}`.trim()
        })

        const candidate = await getFormattedCandidate(db, c.candidate_id)
        return sendSuccess(res, {
          token,
          candidate,
        }, `Bem-vindo(a), ${c.first_name}!`)
      }
    }

    const auth = authRows[0]

    // Verificação de bloqueio por tentativas consecutivas (Lockout de 15 minutos)
    if (auth.locked_until && new Date(auth.locked_until) > new Date()) {
      const remainingMin = Math.ceil((new Date(auth.locked_until).getTime() - Date.now()) / (60 * 1000))
      return sendError(res, `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${remainingMin} minuto(s).`, 423)
    }

    if (!password?.trim()) {
      return sendError(res, 'Informe sua senha de acesso.', 400)
    }

    const passwordMatch = verifyPassword(password, auth.password_hash)

    if (!passwordMatch) {
      const failedAttempts = (auth.failed_attempts || 0) + 1
      let lockSql = 'failed_attempts = ?'
      const lockParams = [failedAttempts]

      // Bloqueia por 15 minutos após 5 tentativas consecutivas
      if (failedAttempts >= 5) {
        lockSql += ', locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE)'
      }

      await db.query(
        `UPDATE candidate_auth SET ${lockSql} WHERE candidate_id = ?`,
        [...lockParams, c.candidate_id]
      )

      return sendError(res, 'E-mail ou senha inválidos.', 401)
    }

    // Sucesso: reseta tentativas falhas e registra last_login
    await db.query(
      `UPDATE candidate_auth SET
        failed_attempts = 0,
        locked_until = NULL,
        last_login = NOW()
       WHERE candidate_id = ?`,
      [c.candidate_id]
    )

    const token = signCandidateToken({
      candidate_id: c.candidate_id,
      email: c.email1,
      name: `${c.first_name} ${c.last_name}`.trim()
    })

    const candidate = await getFormattedCandidate(db, c.candidate_id)

    return sendSuccess(res, {
      token,
      candidate,
    }, `Bem-vindo(a), ${c.first_name}!`)
  } catch (err) {
    console.error('Erro no login do candidato:', err)
    return sendError(res, 'Erro ao autenticar.', 500)
  }
})

// ============================================================================
// 3. DEFINIR / ALTERAR SENHA DO CANDIDATO
// ============================================================================
router.post('/set-password', authLimiter, async (req, res) => {
  try {
    const { email, password, current_password } = req.body
    if (!email?.trim() || !password?.trim()) {
      return sendError(res, 'Informe seu e-mail e nova senha.', 400)
    }

    const policy = validatePasswordPolicy(password.trim())
    if (!policy.valid) {
      return sendError(res, policy.error, 400)
    }

    const db = await getDb()
    const cleanEmail = email.trim().toLowerCase()

    const [candRows] = await db.query(
      'SELECT candidate_id, first_name, last_name, email1 FROM candidate WHERE (email1 = ? OR email2 = ?) AND is_active = 1 LIMIT 1',
      [cleanEmail, cleanEmail]
    )

    if (!candRows.length) {
      return sendError(res, 'Candidato não encontrado.', 404)
    }

    const c = candRows[0]
    const [authRows] = await db.query(
      'SELECT id, password_hash FROM candidate_auth WHERE candidate_id = ? LIMIT 1',
      [c.candidate_id]
    )

    const authHeader = req.headers.authorization
    let isAuthorized = false

    // Se possui token válido do candidato
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const payload = signCandidateToken(token)
      if (payload?.candidate_id === c.candidate_id) {
        isAuthorized = true
      }
    }

    // Se não está autenticado por token mas possui senha configurada, exige senha atual
    if (!isAuthorized && authRows.length > 0) {
      if (current_password?.trim() && verifyPassword(current_password, authRows[0].password_hash)) {
        isAuthorized = true
      }
    }

    // Primeiro acesso
    if (!authRows.length) {
      isAuthorized = true
    }

    if (!isAuthorized) {
      return sendError(res, 'Para alterar a senha, informe sua senha atual ou acesse autenticado.', 401)
    }

    const newHash = hashPassword(password.trim())

    if (authRows.length > 0) {
      await db.query(
        `UPDATE candidate_auth SET
          password_hash = ?,
          password_changed_at = NOW(),
          failed_attempts = 0,
          locked_until = NULL,
          reset_token_hash = NULL,
          reset_token_expires_at = NULL
         WHERE candidate_id = ?`,
        [newHash, c.candidate_id]
      )
    } else {
      await db.query(
        `INSERT INTO candidate_auth (candidate_id, password_hash, failed_attempts, created_at, updated_at)
         VALUES (?, ?, 0, NOW(), NOW())`,
        [c.candidate_id, newHash]
      )
    }

    const token = signCandidateToken({
      candidate_id: c.candidate_id,
      email: c.email1,
      name: `${c.first_name} ${c.last_name}`.trim()
    })

    const candidate = await getFormattedCandidate(db, c.candidate_id)

    return sendSuccess(res, {
      token,
      candidate,
    }, 'Senha cadastrada com sucesso!')
  } catch (err) {
    console.error('Erro ao definir senha:', err)
    return sendError(res, 'Erro ao salvar senha.', 500)
  }
})

// ============================================================================
// 4. SOLICITAÇÃO DE RECUPERAÇÃO DE SENHA (Forgot Password)
// ============================================================================
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body
    if (!email?.trim()) {
      return sendError(res, 'Informe seu e-mail cadastrado.', 400)
    }

    const db = await getDb()
    const cleanEmail = email.trim().toLowerCase()

    const [candRows] = await db.query(
      'SELECT candidate_id, first_name, last_name, email1 FROM candidate WHERE (email1 = ? OR email2 = ?) AND is_active = 1 LIMIT 1',
      [cleanEmail, cleanEmail]
    )

    if (candRows.length > 0) {
      const c = candRows[0]
      const { token, tokenHash, expiresAt } = generateResetToken()

      const [authRows] = await db.query(
        'SELECT id FROM candidate_auth WHERE candidate_id = ? LIMIT 1',
        [c.candidate_id]
      )

      if (authRows.length > 0) {
        await db.query(
          `UPDATE candidate_auth SET
            reset_token_hash = ?,
            reset_token_expires_at = ?
           WHERE candidate_id = ?`,
          [tokenHash, expiresAt, c.candidate_id]
        )
      } else {
        await db.query(
          `INSERT INTO candidate_auth (candidate_id, password_hash, reset_token_hash, reset_token_expires_at, created_at, updated_at)
           VALUES (?, '', ?, ?, NOW(), NOW())`,
          [c.candidate_id, tokenHash, expiresAt]
        )
      }

      console.log(`[AUTH] Token de recuperação gerado para candidato ID ${c.candidate_id} (expira em 15m)`)

      if (process.env.NODE_ENV !== 'production') {
        res.locals.devResetToken = token
      }
    } else {
      dummyPasswordVerify()
    }

    const responsePayload = {
      message: 'Se o e-mail informado estiver cadastrado em nossa base, você receberá as instruções de recuperação.'
    }

    if (res.locals?.devResetToken) {
      responsePayload.dev_reset_token = res.locals.devResetToken
    }

    return sendSuccess(res, responsePayload)
  } catch (err) {
    console.error('Erro na solicitação de recuperação de senha:', err)
    return sendError(res, 'Erro ao processar solicitação.', 500)
  }
})

// ============================================================================
// 5. REDEFINIÇÃO DE SENHA COM TOKEN (Reset Password)
// ============================================================================
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token?.trim() || !password?.trim()) {
      return sendError(res, 'Token e nova senha são obrigatórios.', 400)
    }

    const policy = validatePasswordPolicy(password.trim())
    if (!policy.valid) {
      return sendError(res, policy.error, 400)
    }

    const db = await getDb()
    const tokenHash = hashResetToken(token.trim())

    const [authRows] = await db.query(
      `SELECT ca.id, ca.candidate_id, c.first_name, c.last_name, c.email1
       FROM candidate_auth ca
       JOIN candidate c ON ca.candidate_id = c.candidate_id
       WHERE ca.reset_token_hash = ? AND ca.reset_token_expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    )

    if (!authRows.length) {
      return sendError(res, 'Link de recuperação inválido ou expirado. Por favor, solicite uma nova redefinição.', 400)
    }

    const user = authRows[0]
    const newHash = hashPassword(password.trim())

    await db.query(
      `UPDATE candidate_auth SET
        password_hash = ?,
        password_changed_at = NOW(),
        failed_attempts = 0,
        locked_until = NULL,
        reset_token_hash = NULL,
        reset_token_expires_at = NULL
       WHERE id = ?`,
      [newHash, user.id]
    )

    console.log(`[AUTH] Senha redefinida com sucesso para o candidato ID ${user.candidate_id}`)

    return sendSuccess(res, {}, 'Senha redefinida com sucesso! Você já pode acessar seu painel.')
  } catch (err) {
    console.error('Erro ao redefinir senha:', err)
    return sendError(res, 'Erro ao redefinir senha.', 500)
  }
})

// ============================================================================
// 6. MEU PERFIL (AUTENTICADO VIA TOKEN)
// ============================================================================
router.get('/me', candidateAuth, async (req, res) => {
  try {
    const db = await getDb()
    const candidate = await getFormattedCandidate(db, req.candidate.candidate_id)
    if (!candidate) {
      return sendError(res, 'Perfil não encontrado.', 404)
    }
    return sendSuccess(res, { candidate })
  } catch (err) {
    return sendError(res, 'Erro ao carregar perfil.', 500)
  }
})

// ============================================================================
// 7. CADASTRO / ATUALIZAÇÃO NO BANCO DE TALENTOS & CANDIDATURA DIRETA
// ============================================================================
router.post('/register', registrationLimiter, upload.single('resume'), async (req, res) => {
  const db = await getDb()
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      city,
      state,
      linkedin,
      interest_area,
      desired_role,
      travel_availability,
      driver_license,
      can_relocate,
      desired_pay,
      experience_years,
      notes,
      key_skills,
      consent_lgpd,
      job_id,
    } = req.body

    // Parse e Sanitização de Formações e Experiências
    let educationsList = []
    if (req.body.educations) {
      try {
        const raw = typeof req.body.educations === 'string'
          ? JSON.parse(req.body.educations)
          : req.body.educations
        if (Array.isArray(raw)) {
          educationsList = raw.slice(0, 20)
        }
      } catch (e) {
        console.warn('Erro ao parsear educations:', e.message)
      }
    }

    let experiencesList = []
    if (req.body.experiences) {
      try {
        const raw = typeof req.body.experiences === 'string'
          ? JSON.parse(req.body.experiences)
          : req.body.experiences
        if (Array.isArray(raw)) {
          experiencesList = raw.slice(0, 20)
        }
      } catch (e) {
        console.warn('Erro ao parsear experiences:', e.message)
      }
    }

    // Validações obrigatórias
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !phone?.trim()) {
      await conn.rollback()
      return sendError(res, 'Preencha os campos obrigatórios: Nome, Sobrenome, E-mail e WhatsApp/Telefone.', 400)
    }

    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      await conn.rollback()
      return sendError(res, 'E-mail inválido.', 400)
    }

    const cleanPhone = phone.trim()
    const cleanFirst = first_name.trim()
    const cleanLast  = last_name.trim()

    // 1. DEDUPLICAÇÃO NATIVA
    const [existing] = await conn.query(
      'SELECT candidate_id, source FROM candidate WHERE email1 = ? OR email2 = ? LIMIT 1',
      [cleanEmail, cleanEmail]
    )

    let candidateId
    let isNew = false

    const mainEmployer = experiencesList[0]?.company || req.body.current_employer || ''
    const mainRole = experiencesList[0]?.role || req.body.last_role || desired_role || ''

    if (existing.length > 0) {
      candidateId = existing[0].candidate_id
      await conn.query(
        `UPDATE candidate SET
          first_name = ?,
          last_name = ?,
          phone_cell = ?,
          city = ?,
          state = ?,
          web_site = ?,
          current_employer = COALESCE(NULLIF(?, ''), current_employer),
          desired_pay = COALESCE(NULLIF(?, ''), desired_pay),
          can_relocate = ?,
          notes = COALESCE(NULLIF(?, ''), notes),
          key_skills = COALESCE(NULLIF(?, ''), key_skills),
          date_modified = NOW()
        WHERE candidate_id = ?`,
        [
          cleanFirst,
          cleanLast,
          cleanPhone,
          city?.trim() || null,
          state?.trim()?.toUpperCase() || null,
          linkedin?.trim() || null,
          mainEmployer.trim(),
          desired_pay?.trim() || '',
          can_relocate === '1' || can_relocate === true || can_relocate === 'true' ? 1 : 0,
          notes?.trim() || '',
          Array.isArray(key_skills) ? key_skills.join(', ') : (key_skills?.trim() || ''),
          candidateId
        ]
      )
    } else {
      isNew = true
      const [insertRes] = await conn.query(
        `INSERT INTO candidate (
          first_name, last_name, email1, phone_cell,
          city, state, web_site, current_employer,
          desired_pay, can_relocate, notes, key_skills,
          source, is_active, date_created, date_modified, entered_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Banco de Talentos A&L', 1, NOW(), NOW(), 0)`,
        [
          cleanFirst,
          cleanLast,
          cleanEmail,
          cleanPhone,
          city?.trim() || 'Parauapebas',
          state?.trim()?.toUpperCase() || 'PA',
          linkedin?.trim() || null,
          mainEmployer.trim() || null,
          desired_pay?.trim() || null,
          can_relocate === '1' || can_relocate === true || can_relocate === 'true' ? 1 : 0,
          notes?.trim() || null,
          Array.isArray(key_skills) ? key_skills.join(', ') : (key_skills?.trim() || null)
        ]
      )
      candidateId = insertRes.insertId
    }

    // 2. EXTRA FIELDS
    const primaryEducation = educationsList[0] || {}
    const extraFieldsMap = {
      'Area de Interesse': interest_area?.trim() || null,
      'Cargo Desejado': desired_role?.trim() || null,
      'Disponibilidade para Viagens': travel_availability?.trim() || null,
      'CNH': driver_license?.trim() || null,
      'Escolaridade': primaryEducation.level || req.body.education_level || null,
      'Curso': primaryEducation.course || req.body.course || null,
      'Instituicao de Ensino': primaryEducation.institution || req.body.institution || null,
      'Ano de Conclusao': primaryEducation.year || req.body.graduation_year || null,
      'Tempo de Experiencia': experience_years?.trim() || null,
      'Ultimo Cargo': mainRole.trim() || null,
      'Formacao Academica': educationsList.length ? JSON.stringify(educationsList) : null,
      'Historico Profissional': experiencesList.length ? JSON.stringify(experiencesList) : null,
      'Consentimento LGPD': consent_lgpd
        ? `Autorizado em ${new Date().toLocaleString('pt-BR')} (IP: ${req.ip || '127.0.0.1'})`
        : null
    }

    for (const [fieldName, val] of Object.entries(extraFieldsMap)) {
      if (val !== null && val !== undefined && val !== '') {
        await conn.query(
          'DELETE FROM extra_field WHERE data_item_id = ? AND data_item_type = 100 AND field_name = ?',
          [candidateId, fieldName]
        )
        await conn.query(
          'INSERT INTO extra_field (data_item_id, field_name, value, import_id, data_item_type) VALUES (?, ?, ?, 0, 100)',
          [candidateId, fieldName, String(val)]
        )
      }
    }

    // 3. CANDIDATE_AUTH (Grava senha exclusivamente na tabela candidate_auth)
    if (password && password.trim().length >= 8) {
      const pwdPolicy = validatePasswordPolicy(password.trim())
      if (pwdPolicy.valid) {
        const newHash = hashPassword(password.trim())
        const [authCheck] = await conn.query(
          'SELECT id FROM candidate_auth WHERE candidate_id = ?',
          [candidateId]
        )

        if (authCheck.length > 0) {
          await conn.query(
            `UPDATE candidate_auth SET
              password_hash = ?,
              password_changed_at = NOW(),
              failed_attempts = 0,
              locked_until = NULL
             WHERE candidate_id = ?`,
            [newHash, candidateId]
          )
        } else {
          await conn.query(
            `INSERT INTO candidate_auth (candidate_id, password_hash, failed_attempts, created_at, updated_at)
             VALUES (?, ?, 0, NOW(), NOW())`,
            [candidateId, newHash]
          )
        }
      }
    }

    // 4. ANEXO DE CURRÍCULO
    let attachmentId = null
    if (req.file) {
      attachmentId = await saveCandidateAttachment(conn, candidateId, req.file)
    }

    // 5. SE `job_id` INFORMADO, VINCULA AO PIPELINE DA VAGA
    let appliedJobTitle = null
    if (job_id) {
      const jobId = parseInt(job_id)
      if (jobId) {
        const [jobCheck] = await conn.query('SELECT title FROM joborder WHERE joborder_id = ?', [jobId])
        if (jobCheck.length > 0) {
          appliedJobTitle = jobCheck[0].title

          const [existsInJob] = await conn.query(
            'SELECT candidate_joborder_id FROM candidate_joborder WHERE candidate_id = ? AND joborder_id = ?',
            [candidateId, jobId]
          )

          if (existsInJob.length === 0) {
            await conn.query(
              `INSERT INTO candidate_joborder (
                candidate_id, joborder_id, status, added_by, date_created, date_modified
              ) VALUES (?, ?, 100, 0, NOW(), NOW())`,
              [candidateId, jobId]
            )

            await conn.query(
              `INSERT INTO candidate_joborder_status_history (
                candidate_id, joborder_id, date, status_from, status_to
              ) VALUES (?, ?, NOW(), 0, 100)`,
              [candidateId, jobId]
            )
          }
        }
      }
    }

    // 6. REGISTRO DE ATIVIDADE
    const activityNote = appliedJobTitle
      ? `Candidatura enviada para a vaga "${appliedJobTitle}" e perfil registrado no Banco de Talentos.`
      : (isNew
          ? `Cadastro realizado no Banco de Talentos A&L (Área: ${interest_area || 'Geral'})`
          : `Perfil atualizado no Banco de Talentos A&L (Área: ${interest_area || 'Geral'})`)

    await conn.query(
      `INSERT INTO activity (
        data_item_id, data_item_type, type, notes, date_created, entered_by
      ) VALUES (?, 100, 400, ?, NOW(), 0)`,
      [candidateId, activityNote]
    )

    await conn.commit()

    const token = signCandidateToken({
      candidate_id: candidateId,
      email: cleanEmail,
      name: `${cleanFirst} ${cleanLast}`
    })

    return sendSuccess(res, {
      isNew,
      token,
      candidate_id: candidateId,
      attachment_id: attachmentId,
      job_title: appliedJobTitle,
    }, appliedJobTitle
      ? `Candidatura para a vaga "${appliedJobTitle}" realizada com sucesso!`
      : (isNew
          ? 'Cadastro realizado com sucesso no Banco de Talentos da A&L Engenharia!'
          : 'Perfil atualizado com sucesso no Banco de Talentos!'), 200)

  } catch (err) {
    await conn.rollback()
    console.error('Erro no cadastro do Banco de Talentos:', err)
    return sendError(res, 'Erro interno ao processar cadastro.', 500)
  } finally {
    conn.release()
  }
})

// ============================================================================
// 8. LISTAGEM DO BANCO DE TALENTOS PARA O RH (Protegido com adminAuth)
// ============================================================================
router.get('/candidates', adminAuth, async (req, res) => {
  try {
    const db = await getDb()
    const { search, area, experience, education, state, city } = req.query

    let sql = `
      SELECT
        c.candidate_id,
        c.first_name,
        c.last_name,
        c.email1,
        c.phone_cell,
        c.city,
        c.state,
        c.web_site,
        c.current_employer,
        c.desired_pay,
        c.can_relocate,
        c.notes,
        c.key_skills,
        c.source,
        c.date_created,
        c.date_modified,
        a.attachment_id,
        a.original_filename,
        (
          SELECT GROUP_CONCAT(DISTINCT j.title SEPARATOR ', ')
          FROM candidate_joborder cj
          JOIN joborder j ON j.joborder_id = cj.joborder_id
          WHERE cj.candidate_id = c.candidate_id
        ) as applied_jobs_titles,
        (
          SELECT COUNT(cj.candidate_joborder_id)
          FROM candidate_joborder cj
          WHERE cj.candidate_id = c.candidate_id
        ) as total_applications
      FROM candidate c
      LEFT JOIN (
        SELECT data_item_id, MAX(attachment_id) as attachment_id, original_filename
        FROM attachment
        WHERE data_item_type = 100 AND resume = 1
        GROUP BY data_item_id
      ) a ON a.data_item_id = c.candidate_id
      WHERE c.is_active = 1
    `
    const params = []

    if (search) {
      const term = `%${search.trim()}%`
      sql += ` AND (
        CONCAT(c.first_name, ' ', c.last_name) LIKE ?
        OR c.email1 LIKE ?
        OR c.phone_cell LIKE ?
        OR c.city LIKE ?
        OR c.key_skills LIKE ?
        OR c.notes LIKE ?
        OR c.current_employer LIKE ?
      )`
      params.push(term, term, term, term, term, term, term)
    }

    if (city) {
      sql += ` AND c.city LIKE ?`
      params.push(`%${city.trim()}%`)
    }

    if (state) {
      sql += ` AND c.state = ?`
      params.push(state.trim().toUpperCase())
    }

    sql += ` ORDER BY c.date_created DESC LIMIT 200`

    const [candidates] = await db.query(sql, params)

    const candidateIds = candidates.map(c => c.candidate_id)
    let extraFieldsByCand = {}

    if (candidateIds.length > 0) {
      const [extraRows] = await db.query(
        `SELECT data_item_id, field_name, value
         FROM extra_field
         WHERE data_item_type = 100 AND data_item_id IN (?)`,
        [candidateIds]
      )

      for (const row of extraRows) {
        if (row.field_name === 'Senha Hash') continue

        if (!extraFieldsByCand[row.data_item_id]) {
          extraFieldsByCand[row.data_item_id] = {}
        }
        extraFieldsByCand[row.data_item_id][row.field_name] = row.value
      }
    }

    const formatted = candidates.map(c => {
      const extras = extraFieldsByCand[c.candidate_id] || {}

      let educations = []
      try {
        if (extras['Formacao Academica']) educations = JSON.parse(extras['Formacao Academica'])
      } catch {}

      let experiences = []
      try {
        if (extras['Historico Profissional']) experiences = JSON.parse(extras['Historico Profissional'])
      } catch {}

      return {
        candidate_id: c.candidate_id,
        full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email1,
        phone: c.phone_cell,
        whatsapp_link: formatWhatsAppUrl(c.phone_cell, c.first_name),
        city: c.city,
        state: c.state,
        linkedin: c.web_site,
        current_employer: c.current_employer,
        desired_pay: c.desired_pay,
        can_relocate: Boolean(c.can_relocate),
        notes: c.notes,
        key_skills: c.key_skills ? c.key_skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        source: c.source,
        date_created: c.date_created,
        attachment_id: c.attachment_id,
        applied_jobs_titles: c.applied_jobs_titles,
        total_applications: c.total_applications || 0,
        interest_area: extras['Area de Interesse'] || null,
        desired_role: extras['Cargo Desejado'] || null,
        travel_availability: extras['Disponibilidade para Viagens'] || null,
        driver_license: extras['CNH'] || null,
        education_level: extras['Escolaridade'] || null,
        course: extras['Curso'] || null,
        institution: extras['Instituicao de Ensino'] || null,
        graduation_year: extras['Ano de Conclusao'] || null,
        experience_years: extras['Tempo de Experiencia'] || null,
        last_role: extras['Ultimo Cargo'] || null,
        educations,
        experiences,
      }
    })

    let filtered = formatted
    if (area) {
      filtered = filtered.filter(c => c.interest_area && c.interest_area.toLowerCase().includes(area.toLowerCase()))
    }
    if (experience) {
      filtered = filtered.filter(c => c.experience_years && c.experience_years.toLowerCase().includes(experience.toLowerCase()))
    }
    if (education) {
      filtered = filtered.filter(c => c.education_level && c.education_level.toLowerCase().includes(education.toLowerCase()))
    }

    return res.json({
      success: true,
      total: filtered.length,
      candidates: filtered,
    })
  } catch (err) {
    console.error('Erro ao consultar Banco de Talentos:', err)
    return sendError(res, 'Erro ao consultar candidatos.', 500)
  }
})

// ============================================================================
// 9. DETALHES COMPLETOS DE UM CANDIDATO NO PAINEL DO RH (Protegido com adminAuth)
// ============================================================================
router.get('/candidates/:id', adminAuth, async (req, res) => {
  try {
    const db = await getDb()
    const candidateId = parseInt(req.params.id)
    if (!candidateId || isNaN(candidateId)) {
      return sendError(res, 'ID inválido.', 400)
    }

    const candidate = await getFormattedCandidate(db, candidateId)
    if (!candidate) {
      return sendError(res, 'Candidato não encontrado.', 404)
    }

    return sendSuccess(res, { candidate })
  } catch (err) {
    console.error('Erro ao buscar candidato:', err)
    return sendError(res, 'Erro ao buscar candidato.', 500)
  }
})

// ============================================================================
// 10. VINCULAR CANDIDATO DO BANCO DE TALENTOS A UMA VAGA (Protegido com adminAuth)
// ============================================================================
router.post('/candidates/:id/assign-job', adminAuth, async (req, res) => {
  try {
    const db = await getDb()
    const candidateId = parseInt(req.params.id)
    const { joborder_id, status } = req.body

    if (!candidateId || !joborder_id) {
      return sendError(res, 'Informe o ID do candidato e o ID da vaga.', 400)
    }

    const [check] = await db.query(
      'SELECT candidate_joborder_id FROM candidate_joborder WHERE candidate_id = ? AND joborder_id = ?',
      [candidateId, joborder_id]
    )

    if (check.length > 0) {
      return sendError(res, 'Este candidato já está inscrito ou associado a esta vaga.', 409)
    }

    const initialStatus = parseInt(status) || 100

    const [insRes] = await db.query(
      `INSERT INTO candidate_joborder (
        candidate_id, joborder_id, status, added_by, date_created, date_modified
      ) VALUES (?, ?, ?, 1, NOW(), NOW())`,
      [candidateId, joborder_id, initialStatus]
    )

    await db.query(
      `INSERT INTO candidate_joborder_status_history (
        candidate_id, joborder_id, date, status_from, status_to
      ) VALUES (?, ?, NOW(), 0, ?)`,
      [candidateId, joborder_id, initialStatus]
    )

    const [jobInfo] = await db.query('SELECT title FROM joborder WHERE joborder_id = ?', [joborder_id])
    const jobTitle = jobInfo[0]?.title || `#${joborder_id}`

    await db.query(
      `INSERT INTO activity (
        data_item_id, data_item_type, type, notes, date_created, entered_by
      ) VALUES (?, 100, 800, ?, NOW(), 1)`,
      [candidateId, `Candidato adicionado à vaga "${jobTitle}" a partir do Banco de Talentos.`]
    )

    return sendSuccess(res, {
      candidate_joborder_id: insRes.insertId,
    }, `Candidato vinculado com sucesso à vaga "${jobTitle}"!`, 201)
  } catch (err) {
    console.error('Erro ao vincular vaga:', err)
    return sendError(res, 'Erro ao vincular candidato à vaga.', 500)
  }
})

export default router
