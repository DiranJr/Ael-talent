/**
 * A&L Talent — Utilitários, Formatadores e Helpers Centralizados
 */

import path from 'path'

/**
 * Mapeamento canônico dos status do pipeline de seleção do OpenCATS
 */
export const STATUS_MAP = {
  0: { label: 'Sem Status', color: 'gray' },
  100: { label: 'Novo / Recebido', color: 'blue' },
  200: { label: 'Contactado', color: 'teal' },
  250: { label: 'Candidato Respondeu', color: 'purple' },
  300: { label: 'Em Triagem', color: 'amber' },
  400: { label: 'Enviado ao Gestor', color: 'indigo' },
  500: { label: 'Entrevista', color: 'orange' },
  600: { label: 'Aprovado / Proposta', color: 'green' },
  650: { label: 'Banco de Talentos / Futuro', color: 'slate' },
  675: { label: 'Desistiu', color: 'red' },
  700: { label: 'Não Selecionado', color: 'red' },
  800: { label: 'Contratado', color: 'emerald' },
}

/**
 * Helper padronizado para respostas de sucesso
 */
export function sendSuccess(res, payload = {}, message = '', statusCode = 200) {
  const reqId = res?.req?.id
  if (typeof payload === 'string') {
    return res.status(statusCode).json({
      success: true,
      message: payload,
      ...(reqId ? { request_id: reqId } : {}),
    })
  }
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...(reqId ? { request_id: reqId } : {}),
    ...payload,
  })
}

/**
 * Helper padronizado para respostas de erro
 */
export function sendError(
  res,
  message = 'Ocorreu um erro ao processar a solicitação.',
  statusCode = 500,
  details = null
) {
  const reqId = res?.req?.id
  const response = {
    success: false,
    error: message,
    message,
    ...(reqId ? { request_id: reqId } : {}),
  }
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details
  }
  return res.status(statusCode).json(response)
}

/**
 * Salva anexo de currículo na tabela attachment do OpenCATS
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} dbOrConn
 * @param {number} candidateId
 * @param {Express.Multer.File} file
 */
export async function saveCandidateAttachment(dbOrConn, candidateId, file) {
  if (!file) return null

  const mimeType = file.mimetype || 'application/octet-stream'
  const fileSizeKb = Math.max(1, Math.round((file.size || 0) / 1024))
  const storedName = file.filename
  const originalName = file.originalname || file.filename

  const [result] = await dbOrConn.execute(
    `
    INSERT INTO attachment (
      data_item_type,
      data_item_id,
      title,
      original_filename,
      stored_filename,
      content_type,
      resume,
      file_size_kb,
      md5_sum,
      md5_sum_text,
      date_created,
      date_modified
    ) VALUES (100, ?, ?, ?, ?, ?, 1, ?, '', '', NOW(), NOW())
  `,
    [candidateId, `Currículo — ${originalName}`, originalName, storedName, mimeType, fileSizeKb]
  )

  return result.insertId
}

/**
 * Salva anexo de foto de perfil na tabela attachment do OpenCATS e extra_field
 * @param {import('mysql2/promise').Connection|import('mysql2/promise').Pool} dbOrConn
 * @param {number} candidateId
 * @param {Express.Multer.File} file
 */
export async function saveCandidatePhoto(dbOrConn, candidateId, file) {
  if (!file) return null

  const mimeType = file.mimetype || 'image/jpeg'
  const fileSizeKb = Math.max(1, Math.round((file.size || 0) / 1024))
  const storedName = file.filename
  const originalName = file.originalname || file.filename

  // Remove fotos anteriores para manter apenas a mais recente
  await dbOrConn
    .execute(
      `DELETE FROM attachment WHERE data_item_id = ? AND data_item_type = 100 AND (title = 'Foto de Perfil' OR content_type LIKE 'image/%')`,
      [candidateId]
    )
    .catch(() => {})

  const [result] = await dbOrConn.execute(
    `
    INSERT INTO attachment (
      data_item_type,
      data_item_id,
      title,
      original_filename,
      stored_filename,
      content_type,
      resume,
      file_size_kb,
      md5_sum,
      md5_sum_text,
      date_created,
      date_modified
    ) VALUES (100, ?, 'Foto de Perfil', ?, ?, ?, 0, ?, '', '', NOW(), NOW())
  `,
    [candidateId, originalName, storedName, mimeType, fileSizeKb]
  )

  await saveCandidateExtraField(dbOrConn, candidateId, 'Foto de Perfil', storedName)

  return result.insertId
}

/**
 * Salva ou atualiza um extra_field do candidato
 */
export async function saveCandidateExtraField(dbOrConn, candidateId, fieldName, value) {
  const [existing] = await dbOrConn.query(
    'SELECT extra_field_id FROM extra_field WHERE data_item_type = 100 AND data_item_id = ? AND field_name = ?',
    [candidateId, fieldName]
  )
  if (existing.length > 0) {
    await dbOrConn.execute('UPDATE extra_field SET value = ? WHERE extra_field_id = ?', [
      String(value || ''),
      existing[0].extra_field_id,
    ])
  } else {
    await dbOrConn.execute(
      'INSERT INTO extra_field (data_item_type, data_item_id, field_name, value) VALUES (100, ?, ?, ?)',
      [candidateId, fieldName, String(value || '')]
    )
  }
}

/**
 * Recupera extra_fields de um candidato como dicionário chave-valor
 * (Oculta campos confidenciais por padrão)
 */
export async function getCandidateExtraFields(dbOrConn, candidateId, includeSecrets = false) {
  const [rows] = await dbOrConn.query(
    'SELECT field_name, value FROM extra_field WHERE data_item_type = 100 AND data_item_id = ?',
    [candidateId]
  )
  const map = {}
  for (const r of rows) {
    if (!includeSecrets && r.field_name === 'Senha Hash') continue
    map[r.field_name] = r.value
  }
  return map
}

/**
 * Formata link direto para conversa no WhatsApp com texto de saudação
 */
export function formatWhatsAppUrl(phone, name = '') {
  if (!phone) return null
  const cleanPhone = String(phone).replace(/\D/g, '')
  if (cleanPhone.length < 10) return null

  let fullNumber = cleanPhone
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    fullNumber = `55${cleanPhone}`
  }

  const greeting = name
    ? `Ol%C3%A1%20${encodeURIComponent(name.trim())},%20sou%20do%20RH%20da%20A%26L%20Engenharia!`
    : `Ol%C3%A1,%20sou%20do%20RH%20da%20A%26L%20Engenharia!`

  return `https://wa.me/${fullNumber}?text=${greeting}`
}

/**
 * Formata objeto completo do perfil do candidato para retorno da API
 */
export function formatCandidateProfile(c, extras = {}, apps = [], attachments = [], activities = []) {
  if (!c) return null

  let educations = []
  try {
    if (extras['Formacao Academica']) educations = JSON.parse(extras['Formacao Academica'])
  } catch {
    if (extras['Escolaridade'] || extras['Curso']) {
      educations = [
        {
          level: extras['Escolaridade'] || 'Superior Completo',
          course: extras['Curso'] || '',
          institution: extras['Instituicao de Ensino'] || '',
          year: extras['Ano de Conclusao'] || '',
          status: 'Concluído',
        },
      ]
    }
  }

  let experiences = []
  try {
    if (extras['Historico Profissional']) experiences = JSON.parse(extras['Historico Profissional'])
  } catch {
    if (extras['Ultimo Cargo'] || c.current_employer) {
      experiences = [
        {
          role: extras['Ultimo Cargo'] || '',
          company: c.current_employer || '',
          period: extras['Tempo de Experiencia'] || '',
          activities: '',
        },
      ]
    }
  }

  // Foto de Perfil
  const photoAtt = attachments.find(
    (a) => a.title === 'Foto de Perfil' || (a.content_type && a.content_type.startsWith('image/'))
  )
  const photo_url = photoAtt ? `/api/attachments/${photoAtt.attachment_id}/download` : null

  return {
    candidate_id: c.candidate_id,
    first_name: c.first_name,
    last_name: c.last_name,
    full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
    email: c.email1,
    phone: c.phone_cell,
    whatsapp_link: formatWhatsAppUrl(c.phone_cell, c.first_name),
    city: c.city,
    state: c.state,
    linkedin: c.web_site,
    current_employer: c.current_employer,
    desired_pay: c.desired_pay || '',
    interest_area: extras['Area de Interesse'] || '',
    desired_role: extras['Cargo Desejado'] || '',
    travel_availability: extras['Disponibilidade para Viagens'] || 'Total (Qualquer região)',
    driver_license: extras['CNH'] || 'Não possui',
    can_relocate: Boolean(c.can_relocate),
    experience_years: extras['Tempo de Experiencia'] || '1 a 3 anos',
    notes: c.notes || '',
    key_skills: c.key_skills
      ? c.key_skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    source: c.source,
    photo_url,
    photo_attachment_id: photoAtt?.attachment_id || null,
    date_created: c.date_created,
    date_modified: c.date_modified,
    educations: educations.length
      ? educations
      : [{ level: 'Superior Completo', course: '', institution: '', year: '', status: 'Concluído' }],
    experiences: experiences.length ? experiences : [{ role: '', company: '', period: '', activities: '' }],
    extra_fields: extras,
    applications: apps,
    attachments,
    activities,
  }
}
