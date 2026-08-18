/**
 * A&L Talent Admin — Dashboard Principal do RH
 */

import { adminGetStats, getAttachmentDownloadUrl } from '../../api.js'
import { bindAdminLayoutEvents, renderAdminLayout } from '../../components/AdminLayout.js'
import { navigate } from '../../router.js'

export async function renderAdminDashboard(params, appEl) {
  const topActions = `
    <a href="#/admin/jobs/new" class="btn btn-primary btn-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      <span>Nova Vaga</span>
    </a>
  `

  // Renderiza Skeleton imediato dentro do Layout Administrativo
  appEl.innerHTML = renderAdminLayout(renderDashboardSkeleton(), {
    title: 'Painel de Recrutamento',
    activeRoute: '/admin',
    topActionsHtml: topActions,
  })
  bindAdminLayoutEvents(appEl)

  let statsData = null
  try {
    statsData = await adminGetStats()
  } catch (err) {
    if (err.message.includes('401')) {
      navigate('/admin/login')
      return
    }
  }

  const metrics = statsData?.metrics || { activeJobs: 0, totalJobs: 0, totalCandidates: 0, recentApplications: 0 }
  const latestApps = statsData?.latestApplications || []
  const topJobs = statsData?.topJobs || []

  const content = `
    <!-- CARDS DE MÉTRICAS -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div>
          <div class="metric-label">Vagas Publicadas</div>
          <div class="metric-value">${metrics.activeJobs}</div>
        </div>
        <div class="metric-icon green">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <div class="metric-label">Total de Candidatos</div>
          <div class="metric-value">${metrics.totalCandidates}</div>
        </div>
        <div class="metric-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <div class="metric-label">Inscrições (Últimos 7 dias)</div>
          <div class="metric-value">${metrics.recentApplications}</div>
        </div>
        <div class="metric-icon amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <div class="metric-label">Total Geral de Vagas</div>
          <div class="metric-value">${metrics.totalJobs}</div>
        </div>
        <div class="metric-icon purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
        </div>
      </div>
    </div>

    <!-- GRID 2 COLUNAS -->
    <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; align-items: start;">

      <!-- ÚLTIMAS CANDIDATURAS -->
      <div class="data-card" style="margin-bottom: 0;">
        <div class="data-card-header">
          <div class="data-card-title">Candidaturas Recentes</div>
          <a href="#/admin/candidates" class="btn btn-outline btn-sm">Ver todas →</a>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Vaga</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${
                latestApps.length
                  ? latestApps
                      .map(
                        (app) => `
                <tr>
                  <td>
                    <div style="font-weight: 600; color: var(--ael-ink);">${escHtml(app.first_name)} ${escHtml(app.last_name)}</div>
                    <div style="font-size: 0.75rem; color: var(--ael-muted);">${escHtml(app.city || 'Parauapebas')} · ${escHtml(app.phone_cell || '')}</div>
                  </td>
                  <td>
                    <div style="font-weight: 500;">${escHtml(app.job_title)}</div>
                  </td>
                  <td>
                    <div style="font-size: 0.8125rem; color: var(--ael-muted);">${formatDate(app.date_created)}</div>
                  </td>
                  <td>
                    <div class="table-actions">
                      ${
                        app.phone_cell
                          ? `
                        <a href="https://wa.me/55${app.phone_cell.replace(/\D/g, '')}" target="_blank" class="btn-icon whatsapp" title="Conversar no WhatsApp">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </a>`
                          : ''
                      }
                      ${
                        app.attachment_id
                          ? `
                        <a href="${getAttachmentDownloadUrl(app.attachment_id)}" target="_blank" rel="noopener" class="btn-icon" title="Ver Currículo">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </a>`
                          : ''
                      }
                    </div>
                  </td>
                </tr>
              `
                      )
                      .join('')
                  : `
                <tr>
                  <td colspan="4" style="text-align: center; color: var(--ael-muted); padding: 2rem;">
                    Nenhuma candidatura recebida ainda.
                  </td>
                </tr>
              `
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- VAGAS COM MAIS CANDIDATURAS -->
      <div class="data-card" style="margin-bottom: 0;">
        <div class="data-card-header">
          <div class="data-card-title">Vagas em Destaque</div>
          <a href="#/admin/jobs" class="btn btn-outline btn-sm">Gerenciar →</a>
        </div>

        <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem;">
          ${
            topJobs.length
              ? topJobs
                  .map(
                    (job) => `
            <div style="padding: 1rem; border: 1px solid var(--ael-line); border-radius: var(--ael-radius-md); background: #fafbfb;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.375rem;">
                <strong style="color: var(--ael-ink); font-size: 0.9375rem;">${escHtml(job.title)}</strong>
                <span class="badge ${job.status === 'Active-Share' ? 'badge-green' : 'badge-dark'}">
                  ${job.status === 'Active-Share' ? 'Publicada' : job.status}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; color: var(--ael-muted);">
                <span>${escHtml(job.department)} · ${escHtml(job.city || 'PA')}</span>
                <strong style="color: var(--ael-green-base);">${job.total_applicants} inscritos</strong>
              </div>
            </div>
          `
                  )
                  .join('')
              : `
            <div style="text-align: center; color: var(--ael-muted); padding: 2rem;">
              Nenhuma vaga cadastrada.
            </div>
          `
          }
        </div>
      </div>

    </div>
  `

  appEl.innerHTML = renderAdminLayout(content, {
    title: 'Painel de Recrutamento',
    activeRoute: '/admin',
    topActionsHtml: topActions,
  })

  bindAdminLayoutEvents(appEl)
}

function renderDashboardSkeleton() {
  return `
    <div class="metrics-grid" aria-hidden="true">
      ${[1, 2, 3, 4]
        .map(
          () => `
        <div class="skeleton-metric-card">
          <div style="display:flex;flex-direction:column;gap:0.5rem;flex:1;">
            <div class="skeleton" style="width:60%;height:14px;"></div>
            <div class="skeleton" style="width:40%;height:28px;"></div>
          </div>
          <div class="skeleton skeleton-circle"></div>
        </div>
      `
        )
        .join('')}
    </div>

    <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.5rem; align-items: start;" aria-hidden="true">
      <div class="data-card" style="margin-bottom: 0;">
        <div class="data-card-header">
          <div class="skeleton" style="width:160px;height:18px;"></div>
          <div class="skeleton" style="width:90px;height:28px;"></div>
        </div>
        <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
          ${[1, 2, 3, 4, 5]
            .map(
              () => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--ael-line);">
              <div style="display:flex;flex-direction:column;gap:0.35rem;width:40%;">
                <div class="skeleton" style="width:80%;height:16px;"></div>
                <div class="skeleton" style="width:50%;height:12px;"></div>
              </div>
              <div class="skeleton" style="width:30%;height:16px;"></div>
              <div class="skeleton" style="width:15%;height:14px;"></div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="data-card" style="margin-bottom: 0;">
        <div class="data-card-header">
          <div class="skeleton" style="width:140px;height:18px;"></div>
          <div class="skeleton" style="width:80px;height:28px;"></div>
        </div>
        <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem;">
          ${[1, 2, 3]
            .map(
              () => `
            <div style="padding: 1rem; border: 1px solid var(--ael-line); border-radius: var(--ael-radius-md); display:flex; flex-direction:column; gap:0.5rem;">
              <div style="display:flex;justify-content:space-between;">
                <div class="skeleton" style="width:65%;height:16px;"></div>
                <div class="skeleton" style="width:20%;height:16px;"></div>
              </div>
              <div class="skeleton" style="width:40%;height:12px;"></div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(str) {
  try {
    return new Date(str).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
