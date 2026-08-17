/**
 * A&L Talent — API Client
 * Consome o servidor Node.js em /api/*
 */

const API_BASE = '/api'

export function getAdminToken() {
  return localStorage.getItem('ael_admin_token')
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('ael_admin_user') || 'null')
  } catch {
    return null
  }
}

export function setAdminAuth(token, user) {
  localStorage.setItem('ael_admin_token', token)
  localStorage.setItem('ael_admin_user', JSON.stringify(user))
}

export function clearAdminAuth() {
  localStorage.removeItem('ael_admin_token')
  localStorage.removeItem('ael_admin_user')
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getAdminToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
      throw new Error(err.message || `Erro ${res.status}`)
    }

    return await res.json()
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o serviço está rodando.')
    }
    throw err
  }
}

// ─── Rotas Públicas ─────────────────────────────────────────────

/** Lista vagas publicadas com filtros opcionais */
export async function getJobs({ search = '', department = '', location = '' } = {}) {
  const params = new URLSearchParams()
  if (search)     params.set('q', search)
  if (department) params.set('department', department)
  if (location)   params.set('location', location)

  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/jobs${qs}`)
}

/** Detalhe de uma vaga */
export async function getJob(id) {
  return apiFetch(`/jobs/${id}`)
}

/** Retorna filtros dinâmicos de departamentos e localidades do OpenCATS */
export async function getFilters() {
  return apiFetch('/filters')
}

/** Submete candidatura com arquivo */
export async function submitApplication(formData) {
  const res = await fetch(`${API_BASE}/apply`, {
    method: 'POST',
    body: formData, // FormData — não setar Content-Type
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Erro ${res.status}` }))
    throw new Error(err.message || 'Erro ao enviar candidatura.')
  }

  return res.json()
}

// ─── Rotas Administrativas (RH) ─────────────────────────────────

/** Login do RH */
export async function adminLogin(username, password) {
  const data = await apiFetch('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (data.token && data.user) {
    setAdminAuth(data.token, data.user)
  }
  return data
}

/** Métricas do Dashboard */
export async function adminGetStats() {
  return apiFetch('/admin/stats')
}

/** Lista de vagas para o painel */
export async function adminGetJobs({ status = '', search = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search) params.set('search', search)
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/admin/jobs${qs}`)
}

/** Criar nova vaga */
export async function adminCreateJob(data) {
  return apiFetch('/admin/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** Atualizar vaga existente */
export async function adminUpdateJob(id, data) {
  return apiFetch(`/admin/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/** Alternar status rápido da vaga */
export async function adminToggleJobStatus(id, action) {
  return apiFetch(`/admin/jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  })
}

/** Excluir vaga */
export async function adminDeleteJob(id) {
  return apiFetch(`/admin/jobs/${id}`, { method: 'DELETE' })
}

/** Lista de candidatos do painel */
export async function adminGetCandidates({ joborder_id = '', status = '', search = '' } = {}) {
  const params = new URLSearchParams()
  if (joborder_id) params.set('joborder_id', joborder_id)
  if (status)       params.set('status', status)
  if (search)       params.set('search', search)
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/admin/candidates${qs}`)
}

/** Detalhe completo de um candidato */
export async function adminGetCandidateDetail(id) {
  return apiFetch(`/admin/candidates/${id}`)
}

/** Alterar status do candidato no processo seletivo */
export async function adminUpdateCandidateStatus(candidateId, jobId, { status, note }) {
  return apiFetch(`/admin/candidates/${candidateId}/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  })
}

/** Departamentos */
export async function adminGetDepartments() {
  return apiFetch('/admin/departments')
}

export async function adminCreateDepartment(name) {
  return apiFetch('/admin/departments', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function adminDeleteDepartment(id) {
  return apiFetch(`/admin/departments/${id}`, { method: 'DELETE' })
}

// ─── Gestão de Usuários e Recrutadores (RH) ────────────────────

export async function adminGetUsers() {
  return apiFetch('/admin/users')
}

export async function adminCreateUser(userData) {
  return apiFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function adminUpdateUser(id, userData) {
  return apiFetch(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  })
}

export async function adminDeleteUser(id) {
  return apiFetch(`/admin/users/${id}`, { method: 'DELETE' })
}

// ─── Banco de Talentos ─────────────────────────────────────────

/** Cadastro público no Banco de Talentos (com upload opcional) */
export async function registerTalentPool(formData) {
  try {
    const res = await fetch(`${API_BASE}/talent-pool/register`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || data.message || `Erro ${res.status}`)
    }
    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.')
    }
    throw err
  }
}

/** Listagem de candidatos do Banco de Talentos com filtros estruturados */
export async function adminGetTalentPool(filters = {}) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(k, v)
  }
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch(`/talent-pool/candidates${qs}`)
}

/** Detalhes de um candidato do Banco de Talentos */
export async function adminGetTalentPoolCandidateDetail(id) {
  return apiFetch(`/talent-pool/candidates/${id}`)
}

/** Vincular candidato do Banco de Talentos a uma vaga */
export async function adminAssignCandidateToJob(candidateId, jobId, status = 100) {
  return apiFetch(`/talent-pool/candidates/${candidateId}/assign-job`, {
    method: 'POST',
    body: JSON.stringify({ joborder_id: jobId, status }),
  })
}

/** Lookup de perfil de candidato por e-mail */
export async function lookupCandidate(email) {
  return apiFetch(`/talent-pool/lookup?email=${encodeURIComponent(email)}`)
}

// ─── Autenticação e Sessão do Candidato ─────────────────────────

export function getCandidateToken() {
  return localStorage.getItem('ael_candidate_token')
}

export function getCandidateUser() {
  try {
    return JSON.parse(localStorage.getItem('ael_candidate_user') || 'null')
  } catch {
    return null
  }
}

export function setCandidateAuth(token, user) {
  localStorage.setItem('ael_candidate_token', token)
  if (user) {
    localStorage.setItem('ael_candidate_user', JSON.stringify(user))
  }
}

export function clearCandidateAuth() {
  localStorage.removeItem('ael_candidate_token')
  localStorage.removeItem('ael_candidate_user')
}

/** Login do candidato com e-mail e senha */
export async function candidateLogin(email, password) {
  return apiFetch('/talent-pool/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/** Definir / cadastrar senha do candidato */
export async function candidateSetPassword(email, password) {
  return apiFetch('/talent-pool/set-password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/** Obter perfil do candidato autenticado */
export async function candidateGetMe() {
  const token = getCandidateToken()
  return apiFetch('/talent-pool/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

/** Solicitar recuperação de senha */
export async function candidateForgotPassword(email) {
  return apiFetch('/talent-pool/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

/** Redefinir senha com token de recuperação */
export async function candidateResetPassword(token, password) {
  return apiFetch('/talent-pool/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

