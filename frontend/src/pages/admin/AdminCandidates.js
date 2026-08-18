/**
 * A&L Talent Admin — Gestão de Candidatos e Triagem
 */

import {
  adminGetCandidates,
  adminGetJobs,
  adminUpdateCandidateStatus,
  getAdminUser,
  getAttachmentDownloadUrl,
} from '../../api.js'
import { bindAdminLayoutEvents, renderAdminLayout } from '../../components/AdminLayout.js'
import { showToast } from '../../components/Toast.js'
import { navigate } from '../../router.js'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: '100', label: 'Novo / Recebido' },
  { value: '200', label: 'Contactado' },
  { value: '300', label: 'Em Triagem' },
  { value: '500', label: 'Entrevista' },
  { value: '600', label: 'Aprovado / Proposta' },
  { value: '650', label: 'Banco de Talentos' },
  { value: '700', label: 'Não Selecionado' },
]

export async function renderAdminCandidates(params, appEl) {
  const currentUser = getAdminUser() || {}
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const selectedJobId = params?.joborder_id || urlParams.get('joborder_id') || ''

  // Renderiza Skeleton imediato
  appEl.innerHTML = renderAdminLayout(renderCandidatesSkeleton(), {
    title: 'Triagem de Candidatos',
    activeRoute: '/admin/candidates',
  })
  bindAdminLayoutEvents(appEl)

  let candidates = []
  let jobs = []

  try {
    const [candRes, jobsRes] = await Promise.all([adminGetCandidates({ joborder_id: selectedJobId }), adminGetJobs()])
    candidates = candRes.candidates || []
    jobs = jobsRes.jobs || []
  } catch (err) {
    if (err.message.includes('401')) {
      navigate('/admin/login')
      return
    }
  }

  const content = `
    <!-- BARRA DE FILTROS -->
    <div class="data-card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <!-- Busca -->
        <div style="flex: 1; min-width: 220px;">
          <input
            id="cand-filter-search"
            type="search"
            class="form-control"
            placeholder="Buscar por nome, e-mail, vaga ou recrutador..."
          />
        </div>

        <!-- Filtro por Vaga -->
        <div style="width: 260px;">
          <select id="cand-filter-job" class="form-control">
            <option value="">Todas as Vagas (${jobs.length})</option>
            ${jobs
              .map(
                (j) => `
              <option value="${j.joborder_id}" ${String(j.joborder_id) === selectedJobId ? 'selected' : ''}>
                ${escHtml(j.title)} (${j.total_applicants || 0})
              </option>
            `
              )
              .join('')}
          </select>
        </div>

        <!-- Filtro por Status -->
        <div style="width: 200px;">
          <select id="cand-filter-status" class="form-control">
            ${STATUS_OPTIONS.map((s) => `<option value="${s.value}">${s.label}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- TABELA DE CANDIDATOS -->
    <div class="data-card">
      <div class="data-card-header">
        <div class="data-card-title">
          Candidatos Inscritos <span id="cand-total-count" style="font-size: 0.8125rem; font-weight: 400; color: var(--ael-muted);">(${candidates.length} encontrados)</span>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Candidato</th>
              <th>Contato & WhatsApp</th>
              <th>Vaga & Recrutador(a)</th>
              <th>Data de Envio</th>
              <th>Etapa do Processo</th>
              <th style="text-align: right;">Currículo & Ações</th>
            </tr>
          </thead>
          <tbody id="admin-candidates-tbody">
            ${renderCandidatesRows(candidates, currentUser)}
          </tbody>
        </table>
      </div>
    </div>
  `

  appEl.innerHTML = renderAdminLayout(content, {
    title: 'Triagem de Candidatos',
    activeRoute: '/admin/candidates',
  })

  bindAdminLayoutEvents(appEl)
  bindCandidatesEvents(appEl, candidates, currentUser)
}

function renderCandidatesSkeleton() {
  return `
    <div class="data-card" style="margin-bottom: 1.5rem; padding: 1.25rem;" aria-hidden="true">
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="skeleton" style="flex: 1; height: 38px; border-radius: 6px;"></div>
        <div class="skeleton" style="width: 240px; height: 38px; border-radius: 6px;"></div>
        <div class="skeleton" style="width: 180px; height: 38px; border-radius: 6px;"></div>
      </div>
    </div>

    <div class="data-card" aria-hidden="true">
      <div class="data-card-header">
        <div class="skeleton" style="width: 180px; height: 18px;"></div>
      </div>
      <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.875rem;">
        ${[1, 2, 3, 4, 5, 6]
          .map(
            () => `
          <div style="display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1.2fr 1fr; gap: 1rem; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--ael-line);">
            <div style="display:flex;flex-direction:column;gap:0.35rem;">
              <div class="skeleton" style="width: 70%; height: 16px;"></div>
              <div class="skeleton" style="width: 40%; height: 12px;"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.35rem;">
              <div class="skeleton" style="width: 80%; height: 14px;"></div>
              <div class="skeleton" style="width: 50%; height: 12px;"></div>
            </div>
            <div class="skeleton" style="width: 75%; height: 14px;"></div>
            <div class="skeleton" style="width: 60%; height: 14px;"></div>
            <div class="skeleton" style="width: 90%; height: 30px; border-radius: 4px;"></div>
            <div style="display:flex;justify-content:flex-end;">
              <div class="skeleton" style="width: 80px; height: 28px; border-radius: 4px;"></div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `
}

function renderCandidatesRows(candidates, currentUser) {
  if (!candidates.length) {
    return `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--ael-muted); padding: 3rem;">
          Nenhum candidato encontrado com os filtros selecionados.
        </td>
      </tr>
    `
  }

  return candidates
    .map((c) => {
      const isMyJob = c.recruiter_id === currentUser?.user_id
      const downloadUrl = c.attachment_id ? getAttachmentDownloadUrl(c.attachment_id) : null
      return `
      <tr data-id="${c.candidate_id}" data-job-id="${c.joborder_id}">
        <!-- CANDIDATO -->
        <td>
          <div style="font-weight: 700; color: var(--ael-ink); font-size: 0.9375rem;">${escHtml(c.full_name)}</div>
          <div style="font-size: 0.75rem; color: var(--ael-muted);">
            ${escHtml([c.city, c.state].filter(Boolean).join(' - ') || 'Localidade não informada')}
          </div>
        </td>

        <!-- CONTATO -->
        <td>
          <div style="font-size: 0.8125rem; color: var(--ael-ink);">${escHtml(c.email || '—')}</div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 2px;">
            <span style="font-size: 0.75rem; color: var(--ael-muted);">${escHtml(c.phone || '—')}</span>
            ${
              c.whatsapp_link
                ? `
              <a href="${c.whatsapp_link}" target="_blank" rel="noreferrer" class="btn btn-sm btn-ghost" style="padding: 1px 6px; font-size: 0.6875rem; color: #25D366; font-weight: 700;" title="Abrir conversa no WhatsApp">
                💬 WhatsApp
              </a>
            `
                : ''
            }
          </div>
        </td>

        <!-- VAGA E RECRUTADOR -->
        <td>
          <div style="font-weight: 600; font-size: 0.875rem; color: var(--ael-ink);">
            ${escHtml(c.job_title || '—')}
          </div>
          <div style="font-size: 0.75rem; color: ${isMyJob ? 'var(--ael-green-base)' : 'var(--ael-muted)'}; margin-top: 1px;">
            👤 ${escHtml(c.recruiter_name || 'Não atribuído')} ${isMyJob ? '<strong style="color:var(--ael-green-base);">(Sua Vaga)</strong>' : ''}
          </div>
        </td>

        <!-- DATA DE ENVIO -->
        <td>
          <div style="font-size: 0.8125rem; color: var(--ael-ink);">${formatDate(c.applied_at)}</div>
        </td>

        <!-- ETAPA DO PROCESSO COM SELECT RÁPIDO -->
        <td>
          <select class="form-control status-select" data-candidate-id="${c.candidate_id}" data-job-id="${c.joborder_id}" data-current-status="${c.status_code}" style="padding: 0.35rem 0.65rem; font-size: 0.8125rem; font-weight: 600; min-width: 150px;">
            <option value="100" ${c.status_code == 100 ? 'selected' : ''}>Novo / Recebido</option>
            <option value="200" ${c.status_code == 200 ? 'selected' : ''}>Contactado</option>
            <option value="300" ${c.status_code == 300 ? 'selected' : ''}>Em Triagem</option>
            <option value="500" ${c.status_code == 500 ? 'selected' : ''}>Entrevista</option>
            <option value="600" ${c.status_code == 600 ? 'selected' : ''}>Aprovado / Proposta</option>
            <option value="650" ${c.status_code == 650 ? 'selected' : ''}>Banco de Talentos</option>
            <option value="700" ${c.status_code == 700 ? 'selected' : ''}>Não Selecionado</option>
          </select>
        </td>

        <!-- AÇÕES -->
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.5rem; align-items: center;">
            ${
              downloadUrl
                ? `
              <a href="${downloadUrl}" target="_blank" rel="noopener" class="admin-action-btn" title="Visualizar / Baixar Currículo">
                📄 Currículo
              </a>
            `
                : '<span style="font-size: 0.75rem; color: var(--ael-muted);">Sem PDF</span>'
            }
          </div>
        </td>
      </tr>
    `
    })
    .join('')
}

function bindCandidatesEvents(appEl, candidates, currentUser) {
  let searchQ = ''
  let jobFilter = ''
  let statusFilter = ''

  function filterAndRender() {
    let filtered = candidates

    if (jobFilter) {
      filtered = filtered.filter((c) => String(c.joborder_id) === String(jobFilter))
    }

    if (statusFilter) {
      filtered = filtered.filter((c) => String(c.status_code) === String(statusFilter))
    }

    if (searchQ) {
      const q = searchQ.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          (c.full_name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.job_title || '').toLowerCase().includes(q) ||
          (c.recruiter_name || '').toLowerCase().includes(q)
      )
    }

    const tbody = document.getElementById('admin-candidates-tbody')
    const countEl = document.getElementById('cand-total-count')
    if (tbody) tbody.innerHTML = renderCandidatesRows(filtered, currentUser)
    if (countEl) countEl.textContent = `(${filtered.length} encontrados)`
    bindStatusSelects(appEl)
  }

  document.getElementById('cand-filter-search')?.addEventListener('input', (e) => {
    searchQ = e.target.value.trim()
    filterAndRender()
  })

  document.getElementById('cand-filter-job')?.addEventListener('change', (e) => {
    jobFilter = e.target.value
    filterAndRender()
  })

  document.getElementById('cand-filter-status')?.addEventListener('change', (e) => {
    statusFilter = e.target.value
    filterAndRender()
  })

  bindStatusSelects(appEl)
}

function bindStatusSelects(appEl) {
  appEl.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const candidateId = select.dataset.candidateId
      const jobId = select.dataset.jobId
      const newStatus = select.value
      const prevStatus = select.dataset.currentStatus || select.defaultValue

      const note = prompt('Deseja adicionar uma observação de triagem para o histórico? (Opcional):', '')
      if (note === null) {
        select.value = prevStatus
        return
      }

      select.disabled = true

      try {
        await adminUpdateCandidateStatus(candidateId, jobId, {
          status: newStatus,
          note: note ? note.trim() : '',
        })
        select.dataset.currentStatus = newStatus
        showToast({
          title: 'Status atualizado!',
          message: 'A etapa do candidato foi registrada com sua autoria.',
          type: 'success',
        })
      } catch (err) {
        select.value = prevStatus
        showToast({ title: 'Erro ao atualizar', message: err.message, type: 'error' })
      } finally {
        select.disabled = false
      }
    })
  })
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(d)
  }
}
