/**
 * A&L Talent Admin — Gestão Completa de Vagas (Job Orders)
 */

import { getDb } from '../db.js'
import { sendError, sendSuccess } from '../helpers.js'

/**
 * GET /api/admin/jobs
 * Lista todas as vagas com contadores de candidatos, status detalhado e recrutador responsável
 */
export async function adminGetJobsHandler(req, res) {
  try {
    const db = await getDb()
    const { status = '', search = '', recruiter = '' } = req.query
    const user = req.adminUser || {}
    const isAdmin = (user.access_level || 0) >= 400

    let where = 'WHERE 1=1'
    const params = []

    // Regra: se não for admin, só pode ver vagas designadas para ele OU vagas sem recrutador designado
    if (!isAdmin && user.user_id) {
      where += ' AND (jo.recruiter = ? OR jo.recruiter IS NULL OR jo.recruiter = 0)'
      params.push(user.user_id)
    } else if (recruiter) {
      where += ' AND jo.recruiter = ?'
      params.push(parseInt(recruiter, 10))
    }

    if (status === 'active') {
      where += " AND (jo.status = 'Active-Share' OR jo.public = 1)"
    } else if (status === 'closed') {
      where += " AND (jo.status = 'Closed' OR jo.status = 'Canceled')"
    } else if (status === 'hold') {
      where += " AND jo.status = 'On Hold'"
    }

    if (search) {
      where += ' AND (jo.title LIKE ? OR jo.city LIKE ? OR cd.name LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    const sql = `
      SELECT
        jo.joborder_id,
        jo.title,
        jo.description,
        jo.notes,
        jo.type,
        jo.status,
        jo.is_hot,
        jo.public,
        jo.city,
        jo.state,
        jo.openings,
        jo.openings_available,
        jo.recruiter AS recruiter_id,
        COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Não atribuído') AS recruiter_name,
        jo.date_created,
        jo.date_modified,
        jo.company_department_id,
        COALESCE(cd.name, '') AS department_name,
        c.name AS company_name,
        COUNT(cj.candidate_joborder_id) AS total_applicants,
        SUM(CASE WHEN cj.status = 100 THEN 1 ELSE 0 END) AS new_applicants
      FROM joborder jo
      LEFT JOIN company c ON jo.company_id = c.company_id
      LEFT JOIN company_department cd ON jo.company_department_id = cd.company_department_id
      LEFT JOIN user u ON jo.recruiter = u.user_id
      LEFT JOIN candidate_joborder cj ON jo.joborder_id = cj.joborder_id
      ${where}
      GROUP BY jo.joborder_id
      ORDER BY jo.date_modified DESC
    `

    const [rows] = await db.execute(sql, params)
    return res.json({ success: true, jobs: rows, total: rows.length })
  } catch (err) {
    console.error('[/api/admin/jobs] Erro:', err.message)
    return sendError(res, 'Erro ao buscar vagas do painel.', 500)
  }
}

/**
 * POST /api/admin/jobs
 * Cria nova vaga pelo painel do RH
 */
export async function adminCreateJobHandler(req, res) {
  try {
    const {
      title,
      description,
      notes,
      type = 'Full Time',
      city = 'Parauapebas',
      state = 'PA',
      department_id,
      recruiter_id,
      openings = 1,
      is_public = true,
      status = 'Active-Share',
    } = req.body

    if (!title?.trim()) {
      return sendError(res, 'Título da vaga é obrigatório.', 400)
    }

    const db = await getDb()

    const finalStatus = is_public ? 'Active-Share' : status || 'Active'
    const finalPublic = is_public ? 1 : 0
    const finalOpenings = parseInt(openings) || 1
    const deptId = department_id ? parseInt(department_id) : null
    const recruiterId = recruiter_id ? parseInt(recruiter_id, 10) : req.adminUser?.user_id || 1
    const userId = req.adminUser?.user_id || 1

    const [result] = await db.execute(
      `
      INSERT INTO joborder (
        title,
        description,
        notes,
        type,
        status,
        is_hot,
        public,
        city,
        state,
        country,
        company_id,
        company_department_id,
        recruiter,
        openings,
        openings_available,
        entered_by,
        owner,
        date_created,
        date_modified
      ) VALUES (
        ?, ?, ?, ?, ?, 1, ?, ?, ?, 'BR', 2, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
    `,
      [
        title.trim(),
        description?.trim() || '',
        notes?.trim() || '',
        type,
        finalStatus,
        finalPublic,
        city?.trim() || '',
        state?.trim() || '',
        deptId,
        recruiterId,
        finalOpenings,
        finalOpenings,
        userId,
        userId,
      ]
    )

    return sendSuccess(
      res,
      {
        joborder_id: result.insertId,
      },
      'Vaga criada com sucesso!',
      201
    )
  } catch (err) {
    console.error('[/api/admin/jobs:POST] Erro:', err.message)
    return sendError(res, 'Erro ao criar vaga.', 500)
  }
}

/**
 * PUT /api/admin/jobs/:id
 * Atualiza vaga existente
 */
export async function adminUpdateJobHandler(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id || isNaN(id)) {
      return sendError(res, 'ID de vaga inválido.', 400)
    }

    const {
      title,
      description,
      notes,
      type = 'Full Time',
      city,
      state,
      department_id,
      recruiter_id,
      openings = 1,
      is_public = true,
      status,
    } = req.body

    if (!title?.trim()) {
      return sendError(res, 'Título da vaga é obrigatório.', 400)
    }

    const db = await getDb()

    const finalStatus = is_public ? 'Active-Share' : status || 'Active'
    const finalPublic = is_public ? 1 : 0
    const finalOpenings = parseInt(openings) || 1
    const deptId = department_id ? parseInt(department_id) : null
    const recruiterId = recruiter_id ? parseInt(recruiter_id, 10) : null

    const updateFields = [
      'title = ?',
      'description = ?',
      'notes = ?',
      'type = ?',
      'status = ?',
      'public = ?',
      'city = ?',
      'state = ?',
      'company_department_id = ?',
      'openings = ?',
      'date_modified = NOW()',
    ]

    const updateParams = [
      title.trim(),
      description?.trim() || '',
      notes?.trim() || '',
      type,
      finalStatus,
      finalPublic,
      city?.trim() || '',
      state?.trim() || '',
      deptId,
      finalOpenings,
    ]

    if (recruiterId) {
      updateFields.splice(9, 0, 'recruiter = ?')
      updateParams.splice(9, 0, recruiterId)
    }

    updateParams.push(id)

    await db.execute(
      `
      UPDATE joborder SET
        ${updateFields.join(', ')}
      WHERE joborder_id = ?
    `,
      updateParams
    )

    return sendSuccess(res, {}, 'Vaga atualizada com sucesso!')
  } catch (err) {
    console.error('[/api/admin/jobs/:id:PUT] Erro:', err.message)
    return sendError(res, 'Erro ao atualizar vaga.', 500)
  }
}

/**
 * PATCH /api/admin/jobs/:id/status
 * Altera status rápido da vaga (Publicar, Pausar, Encerrar)
 */
export async function adminToggleJobStatusHandler(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { action } = req.body

    if (!id || isNaN(id)) {
      return sendError(res, 'ID de vaga inválido.', 400)
    }

    const db = await getDb()

    let newStatus = 'Active-Share'
    let newPublic = 1

    if (action === 'pause') {
      newStatus = 'On Hold'
      newPublic = 0
    } else if (action === 'close') {
      newStatus = 'Closed'
      newPublic = 0
    } else if (action === 'publish' || action === 'reopen') {
      newStatus = 'Active-Share'
      newPublic = 1
    } else {
      return sendError(res, 'Ação inválida. Use: publish, pause, close, reopen.', 400)
    }

    await db.execute(
      `
      UPDATE joborder SET
        status = ?,
        public = ?,
        date_modified = NOW()
      WHERE joborder_id = ?
    `,
      [newStatus, newPublic, id]
    )

    return sendSuccess(
      res,
      { status: newStatus, public: newPublic },
      `Vaga ${newStatus === 'Active-Share' ? 'publicada' : newStatus === 'On Hold' ? 'pausada' : 'encerrada'} com sucesso!`
    )
  } catch (err) {
    console.error('[/api/admin/jobs/:id/status:PATCH] Erro:', err.message)
    return sendError(res, 'Erro ao alterar status da vaga.', 500)
  }
}

/**
 * DELETE /api/admin/jobs/:id
 * Exclui vaga e remove candidaturas vinculadas
 */
export async function adminDeleteJobHandler(req, res) {
  const user = req.adminUser || {}
  const isAdmin = (user.access_level || 0) >= 400
  if (!isAdmin) {
    return sendError(
      res,
      'Apenas Administradores do RH podem excluir vagas permanentemente. Recrutadores podem apenas pausar ou encerrar a vaga.',
      403
    )
  }

  let conn
  try {
    const id = parseInt(req.params.id)
    if (!id || isNaN(id)) {
      return sendError(res, 'ID de vaga inválido.', 400)
    }

    const db = await getDb()
    conn = await db.getConnection()
    await conn.beginTransaction()

    // Remove histórico e candidaturas vinculadas
    await conn.execute('DELETE FROM candidate_joborder_status_history WHERE joborder_id = ?', [id])
    await conn.execute('DELETE FROM candidate_joborder WHERE joborder_id = ?', [id])
    await conn.execute('DELETE FROM activity WHERE joborder_id = ?', [id])
    await conn.execute('DELETE FROM joborder WHERE joborder_id = ?', [id])

    await conn.commit()
    return sendSuccess(res, {}, 'Vaga excluída com sucesso!')
  } catch (err) {
    if (conn) await conn.rollback()
    console.error('[/api/admin/jobs/:id:DELETE] Erro:', err.message)
    return sendError(res, 'Erro ao excluir vaga.', 500)
  } finally {
    if (conn) conn.release()
  }
}
