/**
 * A&L Talent — Rota de Candidatura Pública
 * Salva candidato, anexo de currículo e vincula à vaga no OpenCATS
 */

import { getDb } from '../db.js'
import { saveCandidateAttachment, sendError, sendSuccess } from '../helpers.js'
import { validateUploadedFile } from '../upload.js'

export async function applyHandler(req, res) {
  const { name, email, phone, joborder_id, city, state, message } = req.body

  const resumeFile = req.file

  if (resumeFile) {
    const validation = await validateUploadedFile(resumeFile.path, resumeFile.originalname)
    if (!validation.valid) {
      return sendError(res, validation.error || 'Arquivo de currículo inválido.', 400)
    }
  }

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !joborder_id) {
    return sendError(res, 'Preencha todos os campos obrigatórios: Nome, E-mail, Telefone e Vaga.', 400)
  }

  const jobId = parseInt(joborder_id)
  if (isNaN(jobId)) {
    return sendError(res, 'ID da vaga inválido.', 400)
  }

  const db = await getDb()
  const conn = await db.getConnection()
  let candidateId = null

  try {
    await conn.beginTransaction()

    const cleanEmail = email.trim().toLowerCase()

    // 1. Verifica se o candidato já existe pelo e-mail
    const [existing] = await conn.execute(`SELECT candidate_id FROM candidate WHERE email1 = ? OR email2 = ? LIMIT 1`, [
      cleanEmail,
      cleanEmail,
    ])

    if (existing.length > 0) {
      candidateId = existing[0].candidate_id
      await conn.execute(
        `
        UPDATE candidate SET
          phone_cell = COALESCE(NULLIF(?, ''), phone_cell),
          city = COALESCE(NULLIF(?, ''), city),
          state = COALESCE(NULLIF(?, ''), state),
          date_modified = NOW()
        WHERE candidate_id = ?
      `,
        [phone.trim(), city?.trim() || null, state?.trim()?.toUpperCase() || null, candidateId]
      )
    } else {
      // 2. Insere novo candidato nativo
      const nameParts = name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const [insertResult] = await conn.execute(
        `
        INSERT INTO candidate (
          first_name,
          last_name,
          email1,
          phone_cell,
          city,
          state,
          notes,
          date_created,
          date_modified,
          entered_by,
          owner
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, 1)
      `,
        [
          firstName,
          lastName,
          cleanEmail,
          phone.trim(),
          city?.trim() || '',
          state?.trim()?.toUpperCase() || '',
          message?.trim() || '',
        ]
      )

      candidateId = insertResult.insertId
    }

    // 3. Verifica se candidatura já existe para este par (candidato x vaga)
    const [existingApp] = await conn.execute(
      `SELECT candidate_joborder_id FROM candidate_joborder
       WHERE candidate_id = ? AND joborder_id = ? LIMIT 1`,
      [candidateId, jobId]
    )

    if (existingApp.length > 0) {
      // Candidatura já existe — atualiza currículo se novo arquivo enviado
      let attachmentId = null
      if (resumeFile) {
        attachmentId = await saveCandidateAttachment(conn, candidateId, resumeFile)
      }
      await conn.commit()
      return sendSuccess(
        res,
        {
          candidate_id: candidateId,
          attachment_id: attachmentId,
          is_update: true,
        },
        'Candidatura atualizada com sucesso!'
      )
    }

    // 4. Cria a candidatura (candidate_joborder)
    // status 100 = No Contact (novo candidato no pipeline)
    const [appResult] = await conn.execute(
      `
      INSERT INTO candidate_joborder (
        candidate_id,
        joborder_id,
        date_created,
        date_modified,
        status
      ) VALUES (?, ?, NOW(), NOW(), 100)
    `,
      [candidateId, jobId]
    )

    // 5. Registra no histórico de status do OpenCATS
    await conn
      .execute(
        `
      INSERT INTO candidate_joborder_status_history (
        candidate_id, joborder_id, date, status_from, status_to
      ) VALUES (?, ?, NOW(), 0, 100)
    `,
        [candidateId, jobId]
      )
      .catch(() => {})

    // 6. Salva o currículo como attachment
    let attachmentId = null
    if (resumeFile) {
      attachmentId = await saveCandidateAttachment(conn, candidateId, resumeFile)
    }

    // 7. Registra atividade
    await conn
      .execute(
        `
      INSERT INTO activity (
        data_item_type,
        data_item_id,
        joborder_id,
        entered_by,
        date_occurred,
        date_created,
        date_modified,
        type,
        notes
      ) VALUES (100, ?, ?, 1, NOW(), NOW(), NOW(), 100, ?)
    `,
        [candidateId, jobId, `Candidatura recebida pelo Portal A&L Talent para a vaga #${jobId}`]
      )
      .catch(() => {})

    await conn.commit()

    return sendSuccess(
      res,
      {
        candidate_id: candidateId,
        application_id: appResult.insertId,
        attachment_id: attachmentId,
      },
      'Candidatura enviada com sucesso!',
      201
    )
  } catch (err) {
    await conn.rollback()
    console.error('[/api/apply] Erro:', err.message)

    // Limpa arquivo temporário em caso de erro
    if (resumeFile) {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(resumeFile.path)
      } catch (_) {}
    }

    return sendError(res, 'Erro ao processar candidatura. Tente novamente.', 500)
  } finally {
    conn.release()
  }
}
