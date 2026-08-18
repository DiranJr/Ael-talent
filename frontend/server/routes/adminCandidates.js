/**
 * A&L Talent Admin — Gestão Completa de Candidatos & Triagem
 */

import fs from 'fs'
import path from 'path'
import { getDb } from '../db.js'
import { formatWhatsAppUrl, getCandidateExtraFields, STATUS_MAP, sendError, sendSuccess } from '../helpers.js'
import { UPLOAD_DIR } from '../upload.js'

/**
 * GET /api/admin/candidates
 * Lista todos os candidatos com dados da vaga, contato, currículo e recrutador
 */
export async function adminGetCandidatesHandler(req, res) {
  try {
    const db = await getDb()
    const { joborder_id, status, recruiter, search = '' } = req.query
    const user = req.adminUser || {}
    const isAdmin = (user.access_level || 0) >= 400

    let where = 'WHERE 1=1'
    const params = []

    // Regra: se não for admin, só pode ver candidatos de vagas designadas para ele OU vagas sem recrutador designado
    if (!isAdmin && user.user_id) {
      where += ' AND (jo.recruiter = ? OR jo.recruiter IS NULL OR jo.recruiter = 0)'
      params.push(user.user_id)
    } else if (recruiter) {
      where += ' AND jo.recruiter = ?'
      params.push(parseInt(recruiter, 10))
    }

    if (joborder_id) {
      where += ' AND cj.joborder_id = ?'
      params.push(parseInt(joborder_id, 10))
    }

    if (status) {
      where += ' AND cj.status = ?'
      params.push(parseInt(status, 10))
    }

    if (search) {
      where +=
        ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email1 LIKE ? OR c.phone_cell LIKE ? OR c.city LIKE ? OR jo.title LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    const sql = `
      SELECT
        c.candidate_id,
        c.first_name,
        c.last_name,
        c.email1 AS email,
        c.phone_cell AS phone,
        c.city,
        c.state,
        c.notes,
        cj.candidate_joborder_id,
        cj.joborder_id,
        cj.status AS status_code,
        cj.date_created AS applied_at,
        cj.date_modified AS status_updated_at,
        jo.title AS job_title,
        jo.recruiter AS recruiter_id,
        COALESCE(CONCAT(u_rec.first_name, ' ', u_rec.last_name), 'Não atribuído') AS recruiter_name,
        COALESCE(cd.name, '') AS department_name,
        att.attachment_id,
        att.original_filename,
        att.file_size_kb,
        photo_att.photo_attachment_id
      FROM candidate_joborder cj
      JOIN candidate c ON cj.candidate_id = c.candidate_id
      JOIN joborder jo ON cj.joborder_id = jo.joborder_id
      LEFT JOIN user u_rec ON jo.recruiter = u_rec.user_id
      LEFT JOIN company_department cd ON jo.company_department_id = cd.company_department_id
      LEFT JOIN attachment att ON att.data_item_id = c.candidate_id AND att.data_item_type = 100 AND att.resume = 1
      LEFT JOIN (
        SELECT data_item_id, MAX(attachment_id) as photo_attachment_id
        FROM attachment
        WHERE data_item_type = 100 AND (title = 'Foto de Perfil' OR content_type LIKE 'image/%')
        GROUP BY data_item_id
      ) photo_att ON photo_att.data_item_id = c.candidate_id
      ${where}
      ORDER BY cj.date_modified DESC, cj.date_created DESC
    `

    const [rows] = await db.execute(sql, params)

    const candidates = rows.map((c) => ({
      ...c,
      full_name: `${c.first_name} ${c.last_name}`.trim(),
      status_info: STATUS_MAP[c.status_code] || { label: `Status ${c.status_code}`, color: 'gray' },
      whatsapp_link: formatWhatsAppUrl(c.phone, c.first_name),
      photo_url: c.photo_attachment_id ? `/api/attachments/${c.photo_attachment_id}/download` : null,
    }))

    return res.json({
      success: true,
      candidates,
      total: candidates.length,
      statusMap: STATUS_MAP,
    })
  } catch (err) {
    console.error('[/api/admin/candidates] Erro:', err.message)
    return sendError(res, 'Erro ao buscar candidatos do painel.', 500)
  }
}

/**
 * GET /api/admin/candidates/:id
 * Detalhes completos de um candidato no contexto de um processo seletivo
 */
export async function adminGetCandidateDetailHandler(req, res) {
  try {
    const candidateId = parseInt(req.params.id)
    if (!candidateId || isNaN(candidateId)) {
      return sendError(res, 'ID de candidato inválido.', 400)
    }

    const db = await getDb()

    // 1. Dados cadastrais do candidato
    const [candRows] = await db.execute(
      `
      SELECT
        c.candidate_id,
        c.first_name,
        c.last_name,
        c.email1 AS email,
        c.phone_cell AS phone,
        c.phone_work,
        c.address,
        c.city,
        c.state,
        c.notes,
        c.key_skills,
        c.current_employer,
        c.current_pay,
        c.desired_pay,
        c.can_relocate,
        c.date_created,
        c.date_modified
      FROM candidate c
      WHERE c.candidate_id = ?
      LIMIT 1
    `,
      [candidateId]
    )

    if (candRows.length === 0) {
      return sendError(res, 'Candidato não encontrado.', 404)
    }

    const c = candRows[0]

    // 2. Extra fields estruturados
    const extraFields = await getCandidateExtraFields(db, candidateId)

    let educations = []
    let experiences = []
    try {
      if (extraFields['Formações Acadêmicas']) {
        educations = JSON.parse(extraFields['Formações Acadêmicas'])
      }
    } catch (_) {}
    try {
      if (extraFields['Experiências Profissionais']) {
        experiences = JSON.parse(extraFields['Experiências Profissionais'])
      }
    } catch (_) {}

    // 3. Anexos / Currículos
    const [attachments] = await db.execute(
      `
      SELECT
        attachment_id,
        original_filename,
        content_type,
        file_size_kb,
        date_created
      FROM attachment
      WHERE data_item_id = ? AND data_item_type = 100
      ORDER BY date_created DESC
    `,
      [candidateId]
    )

    // 4. Candidaturas e vagas associadas
    const [applications] = await db.execute(
      `
      SELECT
        cj.candidate_joborder_id,
        cj.joborder_id,
        cj.status AS status_code,
        cj.date_created AS applied_at,
        cj.date_modified AS status_updated_at,
        jo.title AS job_title,
        jo.city AS job_city,
        jo.state AS job_state,
        jo.recruiter AS recruiter_id,
        COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Não atribuído') AS recruiter_name,
        COALESCE(cd.name, '') AS department_name
      FROM candidate_joborder cj
      JOIN joborder jo ON cj.joborder_id = jo.joborder_id
      LEFT JOIN user u ON jo.recruiter = u.user_id
      LEFT JOIN company_department cd ON jo.company_department_id = cd.company_department_id
      WHERE cj.candidate_id = ?
      ORDER BY cj.date_created DESC
    `,
      [candidateId]
    )

    // 5. Histórico de atividades / anotações com autoria do recrutador
    const [activities] = await db.execute(
      `
      SELECT 
        a.activity_id, 
        a.notes, 
        a.date_created, 
        a.type,
        a.entered_by,
        COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Equipe RH') AS author_name
      FROM activity a
      LEFT JOIN user u ON a.entered_by = u.user_id
      WHERE a.data_item_id = ? AND a.data_item_type = 100
      ORDER BY a.date_created DESC
      LIMIT 30
    `,
      [candidateId]
    )

    return res.json({
      success: true,
      candidate: {
        ...c,
        full_name: `${c.first_name} ${c.last_name}`.trim(),
        whatsapp_link: formatWhatsAppUrl(c.phone, c.first_name),
        extra_fields: extraFields,
        educations,
        experiences,
        attachments,
        applications: applications.map((a) => ({
          ...a,
          status_info: STATUS_MAP[a.status_code] || { label: `Status ${a.status_code}`, color: 'gray' },
        })),
        activities,
      },
    })
  } catch (err) {
    console.error('[/api/admin/candidates/:id] Erro:', err.message)
    return sendError(res, 'Erro ao buscar detalhes do candidato.', 500)
  }
}

/**
 * PATCH /api/admin/candidates/:candidateId/jobs/:jobId/status
 * Altera status do candidato no pipeline do processo seletivo com registro de autoria do recrutador
 */
export async function adminUpdateCandidateStatusHandler(req, res) {
  try {
    const candidateId = parseInt(req.params.candidateId)
    const jobId = parseInt(req.params.jobId)
    const { status, note } = req.body

    const statusCode = parseInt(status)
    if (isNaN(statusCode) || isNaN(candidateId) || isNaN(jobId)) {
      return sendError(res, 'Dados inválidos para alteração de status.', 400)
    }

    const db = await getDb()
    const userId = req.adminUser?.user_id || 1
    const authorName = req.adminUser?.first_name
      ? `${req.adminUser.first_name} ${req.adminUser.last_name || ''}`.trim()
      : req.adminUser?.user_name || 'Recrutador(a)'

    // 1. Busca status atual para histórico
    const [currentStatusRows] = await db.execute(
      `SELECT status FROM candidate_joborder WHERE candidate_id = ? AND joborder_id = ? LIMIT 1`,
      [candidateId, jobId]
    )

    const statusFrom = currentStatusRows.length > 0 ? currentStatusRows[0].status || 0 : 0

    // 2. Atualiza candidate_joborder
    await db.execute(
      `
      UPDATE candidate_joborder
      SET status = ?, date_modified = NOW()
      WHERE candidate_id = ? AND joborder_id = ?
    `,
      [statusCode, candidateId, jobId]
    )

    // 3. Registra na tabela nativa de histórico de status do OpenCATS
    await db
      .execute(
        `
      INSERT INTO candidate_joborder_status_history (
        candidate_id, joborder_id, date, status_from, status_to
      ) VALUES (?, ?, NOW(), ?, ?)
    `,
        [candidateId, jobId, statusFrom, statusCode]
      )
      .catch(() => {})

    const statusLabel = STATUS_MAP[statusCode]?.label || `Status ${statusCode}`

    // 4. Registra no histórico de atividades com autoria do recrutador autenticado
    const noteText = note?.trim()
      ? `[${authorName}] Status alterado para "${statusLabel}": ${note.trim()}`
      : `[${authorName}] Status do processo alterado para "${statusLabel}"`

    await db
      .execute(
        `
      INSERT INTO activity (
        data_item_type, data_item_id, joborder_id, entered_by,
        date_occurred, date_created, date_modified, type, notes
      ) VALUES (100, ?, ?, ?, NOW(), NOW(), NOW(), 800, ?)
    `,
        [candidateId, jobId, userId, noteText]
      )
      .catch(() => {})

    return sendSuccess(
      res,
      {
        statusCode,
        statusInfo: STATUS_MAP[statusCode],
        authorName,
      },
      `Candidato movido para "${statusLabel}".`
    )
  } catch (err) {
    console.error('[/api/admin/candidates/status] Erro:', err.message)
    return sendError(res, 'Erro ao atualizar status do candidato.', 500)
  }
}

/**
 * GET /api/admin/attachments/:id/download
 * Baixa ou abre o currículo do candidato diretamente com verificação de Path Traversal
 */
export async function adminDownloadAttachmentHandler(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id || isNaN(id)) {
      return sendError(res, 'ID de anexo inválido.', 400)
    }

    const db = await getDb()
    const [rows] = await db.execute(
      `
      SELECT original_filename, stored_filename, content_type
      FROM attachment
      WHERE attachment_id = ?
      LIMIT 1
    `,
      [id]
    )

    if (rows.length === 0) {
      return sendError(res, 'Anexo não encontrado.', 404)
    }

    const { original_filename, stored_filename, content_type } = rows[0]

    // Proteção rigorosa contra Path Traversal
    const safeStoredFilename = path.basename(stored_filename)
    const filePath = path.resolve(UPLOAD_DIR, safeStoredFilename)

    if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return sendError(res, 'Acesso negado ao arquivo.', 403)
    }

    if (!fs.existsSync(filePath)) {
      return sendError(res, 'Arquivo físico não encontrado no servidor de armazenamento.', 404)
    }

    const safeOriginal = (original_filename || 'curriculo.pdf').replace(/["\r\n]/g, '')
    res.setHeader('Content-Type', content_type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${safeOriginal}"`)
    res.setHeader('X-Content-Type-Options', 'nosniff')

    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (err) {
    console.error('[/api/admin/attachments/download] Erro:', err.message)
    return sendError(res, 'Erro ao processar download do anexo.', 500)
  }
}
