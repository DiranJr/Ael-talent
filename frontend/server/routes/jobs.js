/**
 * A&L Talent — Rota de Vagas Públicas
 * Consulta joborders publicados do banco OpenCATS
 */

import { getDb } from '../db.js'
import { sendSuccess, sendError } from '../helpers.js'

/**
 * GET /api/jobs?q=...&department=...&location=...
 */
export async function jobsHandler(req, res) {
  try {
    const db = await getDb()
    const { q = '', department = '', location = '' } = req.query

    // Considera vagas ativas compartilhadas (Active-Share ou public = 1)
    let where = `WHERE (jo.status = 'Active-Share' OR jo.public = 1)`
    const params = []

    if (q) {
      where += ` AND (jo.title LIKE ? OR jo.description LIKE ?)`
      params.push(`%${q.trim()}%`, `%${q.trim()}%`)
    }

    if (department) {
      where += ` AND (cd.name LIKE ? OR jo.title LIKE ?)`
      params.push(`%${department.trim()}%`, `%${department.trim()}%`)
    }

    if (location) {
      where += ` AND (jo.city LIKE ? OR jo.state LIKE ?)`
      params.push(`%${location.trim()}%`, `%${location.trim()}%`)
    }

    const sql = `
      SELECT
        jo.joborder_id,
        jo.title,
        jo.description,
        COALESCE(cd.name, '') AS department,
        jo.city,
        jo.state,
        jo.type,
        jo.salary,
        jo.status,
        jo.is_hot,
        jo.date_created,
        jo.date_modified,
        c.name AS company_name
      FROM
        joborder jo
        LEFT JOIN company c ON jo.company_id = c.company_id
        LEFT JOIN company_department cd ON jo.company_department_id = cd.company_department_id
      ${where}
      ORDER BY jo.is_hot DESC, jo.date_modified DESC
      LIMIT 100
    `

    const [rows] = await db.execute(sql, params)

    return res.json({
      success: true,
      jobs: rows,
      total: rows.length,
    })
  } catch (err) {
    console.error('[/api/jobs] Erro:', err.message)
    return sendError(res, 'Erro ao buscar vagas. Tente novamente.', 500)
  }
}

/**
 * GET /api/jobs/:id
 */
export async function jobDetailHandler(req, res) {
  try {
    const db = await getDb()
    const id = parseInt(req.params.id)

    if (!id || isNaN(id)) {
      return sendError(res, 'ID de vaga inválido.', 400)
    }

    const [rows] = await db.execute(`
      SELECT
        jo.joborder_id,
        jo.title,
        jo.description,
        COALESCE(cd.name, '') AS department,
        jo.city,
        jo.state,
        jo.type,
        jo.salary,
        jo.status,
        jo.is_hot,
        jo.openings,
        jo.date_created,
        jo.date_modified,
        jo.notes,
        c.name AS company_name
      FROM
        joborder jo
        LEFT JOIN company c ON jo.company_id = c.company_id
        LEFT JOIN company_department cd ON jo.company_department_id = cd.company_department_id
      WHERE
        jo.joborder_id = ?
        AND (jo.status = 'Active-Share' OR jo.public = 1)
      LIMIT 1
    `, [id])

    if (!rows.length) {
      return sendError(res, 'Vaga não encontrada ou não está publicada.', 404)
    }

    return res.json({
      success: true,
      job: rows[0],
    })
  } catch (err) {
    console.error('[/api/jobs/:id] Erro:', err.message)
    return sendError(res, 'Erro ao buscar detalhes da vaga.', 500)
  }
}

/**
 * GET /api/filters
 * Retorna departamentos e localidades cadastrados dinamicamente pelo RH no OpenCATS
 */
export async function filtersHandler(req, res) {
  try {
    const db = await getDb()

    // 1. Departamentos
    const [deptRows] = await db.execute(`
      SELECT DISTINCT name FROM (
        SELECT name FROM company_department WHERE name IS NOT NULL AND TRIM(name) != ''
        UNION
        SELECT cd.name FROM joborder jo
        JOIN company_department cd ON jo.company_department_id = cd.company_department_id
        WHERE (jo.status = 'Active-Share' OR jo.public = 1)
      ) AS depts
      ORDER BY name ASC
    `)

    // 2. Localidades
    const [locRows] = await db.execute(`
      SELECT DISTINCT city, state
      FROM joborder
      WHERE (status = 'Active-Share' OR public = 1)
        AND city IS NOT NULL AND TRIM(city) != ''
      ORDER BY city ASC, state ASC
    `)

    const departments = deptRows.map(r => ({
      value: r.name,
      label: r.name,
    }))

    const locations = locRows.map(r => {
      const label = [r.city, r.state].filter(Boolean).join(' - ')
      return {
        value: r.city,
        label: label || r.city,
      }
    })

    return res.json({
      success: true,
      departments,
      locations,
    })
  } catch (err) {
    console.error('[/api/filters] Erro:', err.message)
    return sendError(res, 'Erro ao buscar filtros.', 500)
  }
}
