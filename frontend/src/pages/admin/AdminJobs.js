/**
 * A&L Talent Admin — Listagem e Gestão de Vagas com Recrutadores
 */

import { adminGetJobs, adminToggleJobStatus, adminDeleteJob, getAdminUser } from '../../api.js'
import { renderAdminLayout, bindAdminLayoutEvents } from '../../components/AdminLayout.js'
import { navigate } from '../../router.js'
import { showToast } from '../../components/Toast.js'

export async function renderAdminJobs(params, appEl) {
  let jobsData = []
  const currentUser = getAdminUser() || {}

  try {
    const res = await adminGetJobs()
    jobsData = res.jobs || []
  } catch (err) {
    if (err.message.includes('401')) {
      navigate('/admin/login')
      return
    }
  }

  const topActions = `
    <a href="#/admin/jobs/new" class="btn btn-primary btn-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      <span>Nova Vaga</span>
    </a>
  `

  const myJobsCount = jobsData.filter(j => j.recruiter_id === currentUser.user_id).length

  const content = `
    <!-- FILTROS E BUSCA -->
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <button class="btn btn-sm btn-dark job-filter-btn active" data-status="">Todas (${jobsData.length})</button>
        ${myJobsCount > 0 ? `<button class="btn btn-sm btn-outline job-recruiter-filter-btn" data-recruiter="${currentUser.user_id}">⭐ Minhas Vagas (${myJobsCount})</button>` : ''}
        <button class="btn btn-sm btn-outline job-filter-btn" data-status="active">Publicadas</button>
        <button class="btn btn-sm btn-outline job-filter-btn" data-status="hold">Pausadas</button>
        <button class="btn btn-sm btn-outline job-filter-btn" data-status="closed">Encerradas</button>
      </div>

      <div style="width: 280px;">
        <input id="admin-job-search" type="search" class="form-control" placeholder="Buscar vaga ou recrutador..." style="padding: 0.5rem 0.875rem; font-size: 0.875rem;" />
      </div>
    </div>

    <!-- TABELA DE VAGAS -->
    <div class="data-card">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Título da Vaga</th>
              <th>Departamento</th>
              <th>Recrutador(a)</th>
              <th>Local</th>
              <th>Inscritos</th>
              <th>Status</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody id="admin-jobs-tbody">
            ${renderJobsRows(jobsData, currentUser)}
          </tbody>
        </table>
      </div>
    </div>
  `

  appEl.innerHTML = renderAdminLayout(content, {
    title: 'Gestão de Vagas',
    activeRoute: '/admin/jobs',
    topActionsHtml: topActions,
  })

  bindAdminLayoutEvents(appEl)
  bindJobsEvents(appEl, jobsData, currentUser)
}

function renderJobsRows(jobs, currentUser) {
  if (!jobs.length) {
    return `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--ael-muted); padding: 3rem;">
          Nenhuma vaga encontrada com os filtros selecionados.
        </td>
      </tr>
    `
  }

  return jobs.map(job => {
    const isClosed = job.status === 'Closed' || job.status === 'Canceled'
    const isHold = job.status === 'On Hold'
    const isPublic = !isClosed && !isHold && (job.status === 'Active-Share' || job.public === 1)
    const statusLabel = isClosed ? 'Encerrada' : (isHold ? 'Pausada' : (isPublic ? 'Publicada' : job.status))
    const statusPillClass = isPublic ? 'green' : (isHold ? 'amber' : 'gray')
    const isMyJob = job.recruiter_id === currentUser?.user_id

    return `
      <tr data-id="${job.joborder_id}">
        <td>
          <div style="font-weight: 700; color: var(--ael-ink); font-size: 0.9375rem;">${escHtml(job.title)}</div>
          <div style="font-size: 0.75rem; color: var(--ael-muted);">${escHtml(job.type || 'CLT')} · Criada em ${formatDate(job.date_created)}</div>
        </td>
        <td>
          <span style="font-weight: 500;">${escHtml(job.department_name || 'Geral')}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.8125rem;">
            <span style="color: ${isMyJob ? 'var(--ael-green-base)' : 'var(--ael-ink)'}; font-weight: ${isMyJob ? '700' : '500'};">
              ${escHtml(job.recruiter_name || 'Não atribuído')}
            </span>
            ${isMyJob ? '<span style="font-size:0.625rem;background:rgba(0,230,118,0.15);color:var(--ael-green-base);padding:1px 5px;border-radius:4px;font-weight:700;">Você</span>' : ''}
          </div>
        </td>
        <td>
          <span>${escHtml([job.city, job.state].filter(Boolean).join(' - ') || '—')}</span>
        </td>
        <td>
          <div style="font-weight: 700; font-size: 0.9375rem; color: var(--ael-green-base);">
            ${job.total_applicants || 0}
            ${job.new_applicants > 0 ? `<span style="font-size:0.6875rem;background:var(--ael-green-accent);color:var(--ael-dark-surface);font-weight:800;padding:1px 5px;border-radius:999px;margin-left:4px;">${job.new_applicants} novos</span>` : ''}
          </div>
        </td>
        <td>
          <span class="status-pill status-${statusPillClass}">${statusLabel}</span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.375rem; align-items: center; justify-content: flex-end;">
            <a href="#/admin/candidates?joborder_id=${job.joborder_id}" class="admin-action-btn" title="Ver candidatos inscritos">
              👥 Candidatos
            </a>

            <!-- Ações Rápidas de Ciclo de Vida -->
            ${isClosed ? `
              <button class="admin-action-btn btn-publish job-action-btn" data-action="reopen" data-id="${job.joborder_id}" title="Reabrir e publicar vaga no mural">
                🔄 Reabrir
              </button>
            ` : `
              ${isPublic ? `
                <button class="admin-action-btn job-action-btn" data-action="pause" data-id="${job.joborder_id}" title="Pausar vaga (ocultar temporariamente do portal)">
                  ⏸ Pausar
                </button>
              ` : `
                <button class="admin-action-btn btn-publish job-action-btn" data-action="publish" data-id="${job.joborder_id}" title="Publicar no portal de carreiras">
                  ▶ Publicar
                </button>
              `}

              <button class="admin-action-btn job-action-btn" data-action="close" data-id="${job.joborder_id}" title="Encerrar processo seletivo desta vaga">
                🔒 Encerrar
              </button>
            `}

            <a href="#/admin/jobs/${job.joborder_id}/edit" class="admin-action-btn" title="Editar vaga">
              ✏️ Editar
            </a>

            <button class="admin-action-btn btn-danger job-delete-btn" data-id="${job.joborder_id}" data-title="${escHtml(job.title)}" title="Excluir vaga">
              🗑 Excluir
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

function bindJobsEvents(appEl, jobsData, currentUser) {
  let currentStatus = ''
  let currentRecruiter = ''
  let currentSearch = ''

  function filterAndRender() {
    let filtered = jobsData

    if (currentStatus) {
      if (currentStatus === 'active') filtered = filtered.filter(j => j.status === 'Active-Share' || j.public === 1)
      else if (currentStatus === 'hold') filtered = filtered.filter(j => j.status === 'On Hold')
      else if (currentStatus === 'closed') filtered = filtered.filter(j => j.status === 'Closed' || j.status === 'Canceled')
    }

    if (currentRecruiter) {
      filtered = filtered.filter(j => String(j.recruiter_id) === String(currentRecruiter))
    }

    if (currentSearch) {
      const q = currentSearch.toLowerCase()
      filtered = filtered.filter(j =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.city || '').toLowerCase().includes(q) ||
        (j.department_name || '').toLowerCase().includes(q) ||
        (j.recruiter_name || '').toLowerCase().includes(q)
      )
    }

    const tbody = document.getElementById('admin-jobs-tbody')
    if (tbody) tbody.innerHTML = renderJobsRows(filtered, currentUser)
    bindRowActions(appEl)
  }

  // Filtros de Status
  appEl.querySelectorAll('.job-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      appEl.querySelectorAll('.job-filter-btn').forEach(b => {
        b.classList.remove('btn-dark', 'active')
        b.classList.add('btn-outline')
      })
      btn.classList.add('btn-dark', 'active')
      btn.classList.remove('btn-outline')
      currentStatus = btn.dataset.status
      currentRecruiter = ''
      filterAndRender()
    })
  })

  // Filtro Minhas Vagas
  appEl.querySelector('.job-recruiter-filter-btn')?.addEventListener('click', (e) => {
    const btn = e.currentTarget
    const isAlreadyActive = btn.classList.contains('btn-dark')
    
    appEl.querySelectorAll('.job-filter-btn, .job-recruiter-filter-btn').forEach(b => {
      b.classList.remove('btn-dark', 'active')
      b.classList.add('btn-outline')
    })

    if (!isAlreadyActive) {
      btn.classList.add('btn-dark', 'active')
      btn.classList.remove('btn-outline')
      currentRecruiter = btn.dataset.recruiter
      currentStatus = ''
    } else {
      currentRecruiter = ''
    }
    filterAndRender()
  })

  // Busca
  const searchInput = document.getElementById('admin-job-search')
  searchInput?.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim()
    filterAndRender()
  })

  bindRowActions(appEl)
}

function bindRowActions(appEl) {
  // Ações de Toggle Status (Publicar / Pausar / Encerrar / Reabrir)
  appEl.querySelectorAll('.job-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id
      const action = btn.dataset.action
      btn.disabled = true

      let msg = 'Status da vaga atualizado.'
      if (action === 'publish' || action === 'reopen') msg = 'Vaga publicada e visível no portal.'
      else if (action === 'pause') msg = 'Vaga pausada e ocultada temporariamente do mural.'
      else if (action === 'close') msg = 'Vaga encerrada com sucesso.'

      try {
        await adminToggleJobStatus(id, action)
        showToast({
          title: 'Status atualizado!',
          message: msg,
          type: 'success'
        })
        renderAdminJobs({}, appEl)
      } catch (err) {
        showToast({ title: 'Erro', message: err.message, type: 'error' })
        btn.disabled = false
      }
    })
  })

  // Ação de Exclusão
  appEl.querySelectorAll('.job-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id
      const title = btn.dataset.title
      if (confirm(`Tem certeza que deseja excluir a vaga "${title}"? Todas as candidaturas vinculadas serão removidas.`)) {
        btn.disabled = true
        try {
          await adminDeleteJob(id)
          showToast({ title: 'Vaga excluída', message: 'A vaga foi removida do sistema.', type: 'success' })
          renderAdminJobs({}, appEl)
        } catch (err) {
          showToast({ title: 'Erro ao excluir', message: err.message, type: 'error' })
          btn.disabled = false
        }
      }
    })
  })
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return String(d)
  }
}
