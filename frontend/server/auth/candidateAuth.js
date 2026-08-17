/**
 * A&L Talent — Middleware de Autenticação do Candidato
 */

import { verifyCandidateToken } from './tokens.js'

export function candidateAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sessão expirada ou não autenticado.' })
  }

  const token = authHeader.split(' ')[1]
  const payload = verifyCandidateToken(token)

  if (!payload?.candidate_id) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' })
  }

  req.candidate = payload
  next()
}
