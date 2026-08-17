/**
 * A&L Talent Admin — Rotas Gerais (Auth, Dashboard Stats, Departamentos)
 */

import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { getDb } from '../db.js'
import { signAdminToken, verifyAdminToken } from '../auth/tokens.js'
import { sendSuccess, sendError } from '../helpers.js'

/**
 * Middleware de Autenticação para Rotas Administrativas (RH)
 */
export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Acesso restrito ao RH. Faça login.', 401)
  }

  const token = authHeader.split(' ')[1]
  const user = verifyAdminToken(token)

  if (!user) {
    return sendError(res, 'Sessão administrativa expirada ou inválida.', 401)
  }

  req.adminUser = user
  next()
}

/**
 * POST /api/admin/login
 * Autentica usuário do RH utilizando bcrypt (padrão OpenCATS) ou MD5 (legado)
 */
export async function adminLoginHandler(req, res) {
  try {
    const { username, password } = req.body
    if (!username?.trim() || !password) {
      return sendError(res, 'Informe usuário e senha.', 400)
    }

    const db = await getDb()
    const [users] = await db.execute(
      `SELECT user_id, user_name, password, first_name, last_name, access_level, email
       FROM user
       WHERE user_name = ?
       LIMIT 1`,
      [username.trim()]
    )

    if (!users.length) {
      return sendError(res, 'Usuário ou senha inválidos.', 401)
    }

    const user = users[0]
    let passwordMatch = false

    // 1. Verificação Bcrypt (padrão do OpenCATS moderno)
    if (user.password.startsWith('$2y$') || user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      const normalizedHash = user.password.replace(/^\$2y\$/, '$2a$')
      passwordMatch = bcrypt.compareSync(password, normalizedHash)
    } else {
      // 2. Verificação MD5 com timingSafeEqual (legado OpenCATS)
      const md5Pass = crypto.createHash('md5').update(password).digest('hex')
      if (user.password.length === md5Pass.length) {
        passwordMatch = crypto.timingSafeEqual(Buffer.from(user.password, 'utf8'), Buffer.from(md5Pass, 'utf8'))
      }
    }

    if (!passwordMatch) {
      return sendError(res, 'Usuário ou senha inválidos.', 401)
    }

    // Cria token assinado com expiração de 24h
    const token = signAdminToken({
      user_id: user.user_id,
      user_name: user.user_name,
      access_level: user.access_level,
    })

    return sendSuccess(res, {
      token,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        username: user.user_name,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email || '',
        access_level: user.access_level,
        accessLevel: user.access_level,
        role: user.access_level >= 400 ? 'Administrador' : 'Recrutador',
        is_admin: user.access_level >= 400,
      },
    }, 'Login realizado com sucesso!')
  } catch (err) {
    console.error('[/api/admin/login] Erro:', err.message)
    return sendError(res, 'Erro no servidor de autenticação.', 500)
  }
}

/**
 * GET /api/admin/stats
 * Métricas do Dashboard do RH
 */
export async function adminStatsHandler(req, res) {
  try {
    const db = await getDb()

    // 1. Total de vagas ativas/publicadas
    const [[{ total_active_jobs }]] = await db.execute(`
      SELECT COUNT(*) AS total_active_jobs
      FROM joborder
      WHERE status = 'Active-Share' OR public = 1
    `)

    // 2. Total geral de vagas
    const [[{ total_jobs }]] = await db.execute(`
      SELECT COUNT(*) AS total_jobs FROM joborder
    `)

    // 3. Total de candidatos cadastrados
    const [[{ total_candidates }]] = await db.execute(`
      SELECT COUNT(*) AS total_candidates FROM candidate
    `)

    // 4. Candidaturas nos últimos 7 dias
    const [[{ recent_applications }]] = await db.execute(`
      SELECT COUNT(*) AS recent_applications
      FROM candidate_joborder
      WHERE date_created >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `)

    // 5. Últimas 6 candidaturas recebidas
    const [latestApplications] = await db.execute(`
      SELECT
        cj.candidate_joborder_id,
        cj.candidate_id,
        cj.joborder_id,
        cj.status AS status_code,
        cj.date_created,
        c.first_name,
        c.last_name,
        c.email1,
        c.phone_cell,
        c.city,
        c.state,
        jo.title AS job_title,
        att.attachment_id,
        att.original_filename
      FROM candidate_joborder cj
      JOIN candidate c ON cj.candidate_id = c.candidate_id
      JOIN joborder jo ON cj.joborder_id = jo.joborder_id
      LEFT JOIN attachment att ON att.data_item_id = c.candidate_id AND att.data_item_type = 100 AND att.resume = 1
      ORDER BY cj.date_created DESC
      LIMIT 6
    `)

    // 6. Vagas com mais candidaturas
    const [topJobs] = await db.execute(`
      SELECT
        jo.joborder_id,
        jo.title,
        jo.city,
        jo.state,
        jo.status,
        COALESCE(cd.name, 'Geral') AS department,
        COUNT(cj.candidate_joborder_id) AS total_applicants
      FROM joborder jo
      LEFT JOIN company_department cd ON jo.company_department_id = cd.company_department_id
      LEFT JOIN candidate_joborder cj ON jo.joborder_id = cj.joborder_id
      GROUP BY jo.joborder_id
      ORDER BY total_applicants DESC, jo.date_created DESC
      LIMIT 5
    `)

    return res.json({
      metrics: {
        activeJobs: total_active_jobs,
        totalJobs: total_jobs,
        totalCandidates: total_candidates,
        recentApplications: recent_applications,
      },
      latestApplications,
      topJobs,
    })
  } catch (err) {
    console.error('[/api/admin/stats] Erro:', err.message)
    return sendError(res, 'Erro ao carregar estatísticas do dashboard.', 500)
  }
}

/**
 * GET /api/admin/departments
 * Lista departamentos e contagem de vagas vinculadas
 */
export async function adminGetDepartmentsHandler(req, res) {
  try {
    const db = await getDb()
    const [rows] = await db.execute(`
      SELECT
        cd.company_department_id,
        cd.name,
        cd.date_created,
        COUNT(jo.joborder_id) AS total_jobs
      FROM company_department cd
      LEFT JOIN joborder jo ON cd.company_department_id = jo.company_department_id
      GROUP BY cd.company_department_id
      ORDER BY cd.name ASC
    `)

    return res.json({ departments: rows })
  } catch (err) {
    console.error('[/api/admin/departments] Erro:', err.message)
    return sendError(res, 'Erro ao buscar departamentos.', 500)
  }
}

/**
 * POST /api/admin/departments
 * Cria novo departamento no OpenCATS
 */
export async function adminCreateDepartmentHandler(req, res) {
  try {
    const { name } = req.body
    if (!name?.trim()) {
      return sendError(res, 'Nome do departamento é obrigatório.', 400)
    }

    const db = await getDb()

    // Verifica se já existe
    const [existing] = await db.execute(
      `SELECT company_department_id FROM company_department WHERE name = ? LIMIT 1`,
      [name.trim()]
    )

    if (existing.length > 0) {
      return sendError(res, 'Este departamento já está cadastrado.', 409)
    }

    const [result] = await db.execute(`
      INSERT INTO company_department (name, company_id, date_created, created_by)
      VALUES (?, 2, NOW(), 1)
    `, [name.trim()])

    return sendSuccess(res, {
      department: {
        company_department_id: result.insertId,
        name: name.trim(),
      },
    }, 'Departamento criado com sucesso!', 201)
  } catch (err) {
    console.error('[/api/admin/departments] Erro:', err.message)
    return sendError(res, 'Erro ao criar departamento.', 500)
  }
}

/**
 * DELETE /api/admin/departments/:id
 * Remove departamento se não tiver vagas ativas
 */
export async function adminDeleteDepartmentHandler(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id || isNaN(id)) {
      return sendError(res, 'ID de departamento inválido.', 400)
    }

    const db = await getDb()

    // Desvincula vagas ou remove departamento
    await db.execute(`UPDATE joborder SET company_department_id = NULL WHERE company_department_id = ?`, [id])
    await db.execute(`DELETE FROM company_department WHERE company_department_id = ?`, [id])

    return sendSuccess(res, {}, 'Departamento removido com sucesso.')
  } catch (err) {
    console.error('[/api/admin/departments/:id] Erro:', err.message)
    return sendError(res, 'Erro ao excluir departamento.', 500)
  }
}
