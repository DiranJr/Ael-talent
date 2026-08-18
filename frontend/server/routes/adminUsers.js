/**
 * A&L Talent — Rotas de Gestão de Usuários e Recrutadores do RH
 * Apenas Administradores (access_level >= 400) podem cadastrar, editar e excluir usuários.
 */

import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { getDb } from '../db.js'
import { sendError, sendSuccess } from '../helpers.js'

const router = Router()

// Middleware de verificação de permissão de Super Admin / Admin
function requireSuperAdmin(req, res, next) {
  const accessLevel = req.adminUser?.access_level || 0
  if (accessLevel < 400) {
    return sendError(res, 'Acesso restrito. Apenas administradores podem gerenciar usuários.', 403)
  }
  next()
}

/**
 * GET /api/admin/users
 * Lista todos os usuários do RH (Administradores e Recrutadores) com contagem de vagas
 */
router.get('/', async (req, res) => {
  const db = await getDb()
  try {
    const [users] = await db.query(`
      SELECT 
        u.user_id,
        u.user_name,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.title,
        u.access_level,
        u.phone_work,
        u.phone_cell,
        (SELECT COUNT(*) FROM joborder j WHERE j.recruiter = u.user_id AND j.status = 'Active-Share') AS active_jobs_count,
        (SELECT COUNT(*) FROM joborder j WHERE j.recruiter = u.user_id) AS total_jobs_count
      FROM user u
      WHERE u.is_test_user = 0
      ORDER BY u.access_level DESC, u.first_name ASC
    `)

    const formattedUsers = users.map((u) => ({
      ...u,
      role: u.access_level >= 400 ? 'Administrador' : 'Recrutador',
      is_admin: u.access_level >= 400,
    }))

    return sendSuccess(res, { users: formattedUsers })
  } catch (err) {
    console.error('Erro ao listar usuários:', err)
    return sendError(res, 'Erro ao buscar usuários do RH.', 500)
  }
})

/**
 * POST /api/admin/users
 * Cadastra novo usuário/recrutador
 */
router.post('/', requireSuperAdmin, async (req, res) => {
  const { user_name, first_name, last_name, email, password, title, access_level = 200 } = req.body

  if (!user_name || !first_name || !last_name || !password) {
    return sendError(res, 'Preencha usuário, nome, sobrenome e senha obrigatórios.', 400)
  }

  if (password.length < 8) {
    return sendError(res, 'A senha deve conter no mínimo 8 caracteres.', 400)
  }

  const cleanUserName = user_name.trim().toLowerCase()
  const cleanEmail = (email || '').trim().toLowerCase()
  const db = await getDb()

  try {
    // Verifica duplicidade de username
    const [existing] = await db.query('SELECT user_id FROM user WHERE user_name = ?', [cleanUserName])
    if (existing.length > 0) {
      return sendError(res, 'Já existe um usuário com este login de acesso.', 409)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const level = parseInt(access_level, 10) >= 400 ? 500 : 200

    const [result] = await db.query(
      `
      INSERT INTO user (
        user_name, first_name, last_name, email, password, 
        title, access_level, can_change_password, is_test_user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
    `,
      [
        cleanUserName,
        first_name.trim(),
        last_name.trim(),
        cleanEmail || null,
        hashedPassword,
        title?.trim() || (level >= 400 ? 'Administrador de RH' : 'Recrutador(a)'),
        level,
      ]
    )

    return sendSuccess(
      res,
      {
        user_id: result.insertId,
        user_name: cleanUserName,
        full_name: `${first_name.trim()} ${last_name.trim()}`,
        role: level >= 400 ? 'Administrador' : 'Recrutador',
      },
      'Usuário criado com sucesso!',
      201
    )
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err)
    return sendError(res, 'Erro ao criar usuário do RH.', 500)
  }
})

/**
 * PUT /api/admin/users/:id
 * Atualiza dados ou redefine senha do usuário
 */
router.put('/:id', requireSuperAdmin, async (req, res) => {
  const userId = parseInt(req.params.id, 10)
  const { first_name, last_name, email, title, access_level, password } = req.body

  if (!userId) {
    return sendError(res, 'ID de usuário inválido.', 400)
  }

  const db = await getDb()

  try {
    const [userRows] = await db.query('SELECT user_id, user_name FROM user WHERE user_id = ?', [userId])
    if (userRows.length === 0) {
      return sendError(res, 'Usuário não encontrado.', 404)
    }

    const updates = []
    const params = []

    if (first_name) {
      updates.push('first_name = ?')
      params.push(first_name.trim())
    }
    if (last_name) {
      updates.push('last_name = ?')
      params.push(last_name.trim())
    }
    if (email !== undefined) {
      updates.push('email = ?')
      params.push(email?.trim().toLowerCase() || null)
    }
    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title?.trim() || null)
    }
    if (access_level !== undefined) {
      const level = parseInt(access_level, 10) >= 400 ? 500 : 200
      updates.push('access_level = ?')
      params.push(level)
    }
    if (password && password.trim()) {
      if (password.trim().length < 8) {
        return sendError(res, 'A nova senha deve ter no mínimo 8 caracteres.', 400)
      }
      const hashedPassword = await bcrypt.hash(password.trim(), 10)
      updates.push('password = ?')
      params.push(hashedPassword)
    }

    if (updates.length === 0) {
      return sendError(res, 'Nenhum dado informado para atualização.', 400)
    }

    params.push(userId)
    await db.query(`UPDATE user SET ${updates.join(', ')} WHERE user_id = ?`, params)

    return sendSuccess(res, { user_id: userId }, 'Usuário atualizado com sucesso!')
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err)
    return sendError(res, 'Erro ao atualizar usuário.', 500)
  }
})

/**
 * DELETE /api/admin/users/:id
 * Remove usuário (impede excluir o próprio usuário autenticado)
 */
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const userId = parseInt(req.params.id, 10)
  const currentUserId = req.adminUser?.user_id

  if (!userId) {
    return sendError(res, 'ID de usuário inválido.', 400)
  }

  if (userId === currentUserId) {
    return sendError(res, 'Você não pode excluir sua própria conta de administrador.', 400)
  }

  const db = await getDb()

  try {
    // Reatribui vagas ativas para o admin principal (ID 1) antes de excluir
    await db.query('UPDATE joborder SET recruiter = 1 WHERE recruiter = ?', [userId])
    await db.query('DELETE FROM user WHERE user_id = ?', [userId])

    return sendSuccess(res, { user_id: userId }, 'Usuário removido com sucesso!')
  } catch (err) {
    console.error('Erro ao excluir usuário:', err)
    return sendError(res, 'Erro ao remover usuário.', 500)
  }
})

export default router
