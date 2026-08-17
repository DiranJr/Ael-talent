/**
 * A&L Talent Admin — Gestão e Busca no Banco de Talentos
 * Rota: #/admin/talent-pool
 */

import {
  adminGetTalentPool,
  adminGetTalentPoolCandidateDetail,
  adminAssignCandidateToJob,
  adminGetJobs,
  adminGetDepartments,
  getAttachmentDownloadUrl,
} from '../../api.js'
import { renderAdminLayout, bindAdminLayoutEvents } from '../../components/AdminLayout.js'
import { navigate } from '../../router.js'
import { showToast } from '../../components/Toast.js'

export async function renderAdminTalentPool(params, appEl) {
  let candidates = []
  let jobs = []
  let departments = []

  try {
    const [tpRes, jobsRes, deptRes] = await Promise.all([
      adminGetTalentPool(),
      adminGetJobs({ status: 'active' }),
      adminGetDepartments(),
    ])
    candidates  = tpRes.candidates || []
    jobs        = jobsRes.jobs || []
    departments = deptRes.departments || []
  } catch (err) {
    if (err.message.includes('401')) {
      navigate('/admin/login')
      return
    }
  }

  const content = `
    <!-- FILTROS ESTRUTURADOS -->
    <div class="data-card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
      <div style="display: flex; gap: 0.875rem; align-items: center; flex-wrap: wrap;">
        <!-- Busca Livre -->
        <div style="flex: 1; min-width: 220px;">
          <input
            id="tp-search-input"
            type="search"
            class="form-control"
            placeholder="Buscar por nome, competência (ex: Excel, AutoCAD), cargo..."
            style="padding: 0.5rem 0.875rem; font-size: 0.875rem;"
          />
        </div>

        <!-- Filtro por Área -->
        <div style="width: 180px;">
          <select id="tp-filter-area" class="form-control" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
            <option value="">Todas as Áreas</option>
            ${departments.map(d => `<option value="${escAttr(d.name)}">${escHtml(d.name)}</option>`).join('')}
            <option value="Operacional">Operacional</option>
            <option value="Engenharia">Engenharia</option>
            <option value="Administrativo">Administrativo</option>
            <option value="Segurança do Trabalho">Segurança do Trabalho</option>
          </select>
        </div>

        <!-- Filtro por Experiência -->
        <div style="width: 180px;">
          <select id="tp-filter-exp" class="form-control" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
            <option value="">Toda Experiência</option>
            <option value="Sem experiência">Primeiro Emprego</option>
            <option value="1 a 3 anos">1 a 3 anos</option>
            <option value="3 a 5 anos">3 a 5 anos</option>
            <option value="5 a 10 anos">5 a 10 anos</option>
            <option value="Mais de 10 anos">Mais de 10 anos</option>
          </select>
        </div>

        <!-- Filtro por Escolaridade -->
        <div style="width: 180px;">
          <select id="tp-filter-edu" class="form-control" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
            <option value="">Toda Escolaridade</option>
            <option value="Ensino Médio">Ensino Médio</option>
            <option value="Técnico">Técnico</option>
            <option value="Superior">Superior</option>
            <option value="Pós-Graduação">Pós-Graduação / MBA</option>
          </select>
        </div>
      </div>
    </div>

    <!-- LISTA DE CANDIDATOS DO BANCO -->
    <div class="data-card">
      <div class="data-card-header">
        <div class="data-card-title">
          Profissionais Cadastrados <span id="tp-count" style="font-size: 0.8125rem; font-weight: 400; color: var(--ael-muted);">(${candidates.length} encontrados)</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--ael-muted);">Dados estruturados do OpenCATS (Extra Fields & Competências)</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Profissional</th>
              <th>Área & Cargo Desejado</th>
              <th>Local & Contato</th>
              <th>Experiência & Formação</th>
              <th>Competências</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody id="tp-tbody">
            ${renderCandidatesRows(candidates)}
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL DE DETALHES COMPLETOS DO CANDIDATO -->
    <div id="tp-detail-modal" class="admin-modal-backdrop" style="display: none;">
      <div class="admin-modal" style="max-width: 720px; max-height: 88vh; overflow-y: auto;">
        <div class="admin-modal-header">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink);" id="modal-cand-title">Perfil Profissional</h3>
          <button id="close-detail-modal-btn" class="btn-icon" style="border: none;">✕</button>
        </div>
        <div class="admin-modal-body" id="modal-cand-body">
          <div style="text-align: center; padding: 2rem; color: var(--ael-muted);">Carregando...</div>
        </div>
      </div>
    </div>

    <!-- MODAL: ADICIONAR CANDIDATO A UMA VAGA -->
    <div id="tp-assign-modal" class="admin-modal-backdrop" style="display: none;">
      <div class="admin-modal" style="max-width: 500px;">
        <div class="admin-modal-header">
          <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--ael-ink);">Adicionar a uma Vaga Aberta</h3>
          <button id="close-assign-modal-btn" class="btn-icon" style="border: none;">✕</button>
        </div>
        <div class="admin-modal-body">
          <input type="hidden" id="assign-cand-id" />

          <div style="margin-bottom: 1.25rem;">
            <div style="font-weight: 700; color: var(--ael-ink);" id="assign-cand-name">Nome do Candidato</div>
            <div style="font-size: 0.8125rem; color: var(--ael-muted);" id="assign-cand-sub">Área do Candidato</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="assign-job-select">Selecione a Oportunidade *</label>
            <select id="assign-job-select" class="form-control" required>
              <option value="">Selecione uma vaga...</option>
              ${jobs.map(j => `
                <option value="${j.joborder_id}">
                  ${escHtml(j.title)} (${escHtml(j.city || 'Parauapebas')} - ${escHtml(j.department_name || 'Geral')})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="assign-status-select">Etapa Inicial no Processo *</label>
            <select id="assign-status-select" class="form-control">
              <option value="100">📥 Novo / Recebido (No Contact)</option>
              <option value="300" selected>🔍 Em Triagem Técnica (Qualifying)</option>
              <option value="500">🗣️ Entrevista Agendada (Interviewing)</option>
            </select>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button id="cancel-assign-btn" class="btn btn-outline btn-sm">Cancelar</button>
          <button id="confirm-assign-btn" class="btn btn-primary btn-sm">Vincular ao Processo</button>
        </div>
      </div>
    </div>
  `

  appEl.innerHTML = renderAdminLayout(content, {
    title: 'Banco de Talentos A&L',
    activeRoute: '/admin/talent-pool',
  })

  bindAdminLayoutEvents(appEl)
  bindTalentPoolEvents(appEl, candidates, jobs)
}

function renderCandidatesRows(candidates) {
  if (!candidates.length) {
    return `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--ael-muted); padding: 3rem;">
          Nenhum profissional encontrado com os filtros selecionados.
        </td>
      </tr>
    `
  }

  return candidates.map(c => {
    return `
      <tr data-id="${c.candidate_id}">
        <td>
          <div style="font-weight: 700; color: var(--ael-ink); font-size: 0.9375rem;">
            ${escHtml(c.full_name)}
          </div>
          <div style="font-size: 0.75rem; color: var(--ael-muted);">
            Cadastrado em ${formatDate(c.date_created)}
            ${c.total_applications > 0 ? `· <strong style="color:var(--ael-green-base);">${c.total_applications} vaga(s)</strong>` : ''}
          </div>
        </td>

        <td>
          <span class="badge badge-green" style="margin-bottom: 0.25rem; display: inline-block;">
            ${escHtml(c.interest_area || 'Geral')}
          </span>
          <div style="font-weight: 600; color: var(--ael-ink); font-size: 0.8125rem;">
            ${escHtml(c.desired_role || 'Não informado')}
          </div>
        </td>

        <td>
          <div style="font-size: 0.8125rem; color: var(--ael-ink); font-weight: 500;">
            ${escHtml([c.city, c.state].filter(Boolean).join(' - ') || 'Parauapebas - PA')}
          </div>
          <div style="font-size: 0.75rem; color: var(--ael-muted);">
            ${escHtml(c.phone || '')}
          </div>
        </td>

        <td>
          <div style="font-size: 0.8125rem; color: var(--ael-ink); font-weight: 600;">
            ${escHtml(c.experience_years || 'Sem exp.')}
          </div>
          <div style="font-size: 0.75rem; color: var(--ael-muted);">
            ${escHtml(c.education_level || 'Médio')}
          </div>
        </td>

        <td>
          <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; max-width: 220px;">
            ${(c.key_skills || []).slice(0, 3).map(skill => `
              <span style="
                background: rgba(0,91,58,0.08);
                color: var(--ael-green-dark);
                font-size: 0.6875rem;
                padding: 0.15rem 0.4rem;
                border-radius: 4px;
                font-weight: 600;
              ">${escHtml(skill)}</span>
            `).join('')}
            ${(c.key_skills || []).length > 3 ? `<span style="font-size: 0.6875rem; color: var(--ael-muted);">+${c.key_skills.length - 3}</span>` : ''}
          </div>
        </td>

        <td>
          <div class="table-actions" style="justify-content: flex-end;">
            ${c.whatsapp_link ? `
              <a href="${c.whatsapp_link}" target="_blank" class="btn-icon whatsapp" title="Conversar no WhatsApp (${escAttr(c.phone)})">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </a>` : ''}

            ${c.attachment_id ? `
              <a href="${getAttachmentDownloadUrl(c.attachment_id)}" target="_blank" rel="noopener" class="btn-icon" title="Baixar Currículo">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </a>` : ''}

            <button type="button" class="btn-icon view-detail-btn" data-id="${c.candidate_id}" title="Ver Perfil Completo">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>

            <button type="button" class="btn btn-sm btn-primary assign-job-btn" data-id="${c.candidate_id}" data-name="${escAttr(c.full_name)}" data-area="${escAttr(c.interest_area || '')}" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; gap: 0.25rem;">
              <span>+ Vaga</span>
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

function bindTalentPoolEvents(appEl, initialCandidates, jobs) {
  let candidates = initialCandidates

  const searchInput = document.getElementById('tp-search-input')
  const areaSelect   = document.getElementById('tp-filter-area')
  const expSelect    = document.getElementById('tp-filter-exp')
  const eduSelect    = document.getElementById('tp-filter-edu')

  async function refetch() {
    try {
      const res = await adminGetTalentPool({
        search: searchInput?.value || '',
        area: areaSelect?.value || '',
        experience: expSelect?.value || '',
        education: eduSelect?.value || '',
      })
      candidates = res.candidates || []
      const tbody = document.getElementById('tp-tbody')
      const countEl = document.getElementById('tp-count')
      if (tbody) tbody.innerHTML = renderCandidatesRows(candidates)
      if (countEl) countEl.textContent = `(${candidates.length} encontrados)`
    } catch (err) {
      showToast({ title: 'Erro', message: err.message, type: 'error' })
    }
  }

  let timer = null
  searchInput?.addEventListener('input', () => {
    clearTimeout(timer)
    timer = setTimeout(refetch, 300)
  })
  areaSelect?.addEventListener('change', refetch)
  expSelect?.addEventListener('change', refetch)
  eduSelect?.addEventListener('change', refetch)

  // Modais
  const detailModal = document.getElementById('tp-detail-modal')
  const assignModal = document.getElementById('tp-assign-modal')

  // Delegação de cliques para botões e modais
  appEl.addEventListener('click', async (e) => {
    // 1. Ver Detalhes
    const viewBtn = e.target.closest('.view-detail-btn')
    if (viewBtn) {
      const id = viewBtn.dataset.id
      if (!id || !detailModal) return
      detailModal.style.display = 'flex'
      const bodyEl = document.getElementById('modal-cand-body')
      const titleEl = document.getElementById('modal-cand-title')
      if (bodyEl) bodyEl.innerHTML = '<div style="text-align: center; padding: 2.5rem; color: var(--ael-muted);">Carregando perfil completo...</div>'

      try {
        const res = await adminGetTalentPoolCandidateDetail(id)
        const cand = res.candidate
        if (titleEl) titleEl.textContent = cand.full_name || 'Perfil Profissional'
        if (bodyEl) bodyEl.innerHTML = renderCandidateDetailHtml(cand)
      } catch (err) {
        if (bodyEl) bodyEl.innerHTML = `<div style="color: var(--ael-red); padding: 1.5rem; text-align: center;">${err.message}</div>`
      }
      return
    }

    // 2. Adicionar a Vaga (+ Vaga)
    const assignBtn = e.target.closest('.assign-job-btn')
    if (assignBtn) {
      if (!assignModal) return
      const candId = document.getElementById('assign-cand-id')
      const candName = document.getElementById('assign-cand-name')
      const candSub = document.getElementById('assign-cand-sub')
      if (candId) candId.value = assignBtn.dataset.id || ''
      if (candName) candName.textContent = assignBtn.dataset.name || 'Candidato'
      if (candSub) candSub.textContent = `Área: ${assignBtn.dataset.area || 'Geral'}`
      assignModal.style.display = 'flex'
      return
    }

    // 3. Fechar modais ao clicar no backdrop ou botão de fechar
    if (detailModal && (e.target === detailModal || e.target.closest('#close-detail-modal-btn'))) {
      detailModal.style.display = 'none'
      return
    }

    if (assignModal && (e.target === assignModal || e.target.closest('#close-assign-modal-btn') || e.target.closest('#cancel-assign-btn'))) {
      assignModal.style.display = 'none'
      return
    }
  })

  // Confirmar vínculo à vaga
  document.getElementById('confirm-assign-btn')?.addEventListener('click', async (e) => {
    e.preventDefault()
    const candidateId = document.getElementById('assign-cand-id')?.value
    const jobId       = document.getElementById('assign-job-select')?.value
    const status      = document.getElementById('assign-status-select')?.value || 100

    if (!jobId) {
      showToast({ title: 'Atenção', message: 'Selecione uma oportunidade para vincular o profissional.', type: 'error' })
      return
    }

    const confirmBtn = document.getElementById('confirm-assign-btn')
    if (confirmBtn) {
      confirmBtn.disabled = true
      confirmBtn.textContent = 'Vinculando...'
    }

    try {
      const res = await adminAssignCandidateToJob(candidateId, jobId, status)
      showToast({ title: 'Sucesso', message: res.message, type: 'success' })
      if (assignModal) assignModal.style.display = 'none'
      await refetch()
    } catch (err) {
      showToast({ title: 'Erro ao Vincular', message: err.message, type: 'error' })
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false
        confirmBtn.textContent = 'Vincular ao Processo'
      }
    }
  })
}

function renderCandidateDetailHtml(c) {
  const ex = c.extra_fields || {}
  const apps = c.applications || []
  const acts = c.activities || []
  const atts = c.attachments || []
  const mainAttachmentId = c.attachment_id || atts[0]?.attachment_id

  return `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.875rem;">
      <div>
        <span style="color: var(--ael-muted); display: block; font-size: 0.75rem;">E-mail & Telefone</span>
        <strong>${escHtml(c.email1)}</strong><br>
        <span>${escHtml(c.phone_cell || 'Sem telefone')}</span>
      </div>
      <div>
        <span style="color: var(--ael-muted); display: block; font-size: 0.75rem;">Localização & Disponibilidade</span>
        <strong>${escHtml(c.city)} - ${escHtml(c.state)}</strong><br>
        <span>Mudança: ${c.can_relocate ? 'Sim' : 'Não'} · Viagens: ${escHtml(ex['Disponibilidade para Viagens'] || 'Não informado')}</span>
      </div>
    </div>

    ${mainAttachmentId ? `
      <div style="margin-bottom: 1.25rem; display: flex; gap: 0.75rem; align-items: center; background: rgba(0, 91, 58, 0.06); padding: 0.75rem 1rem; border-radius: var(--ael-radius-md); border: 1px solid rgba(0, 91, 58, 0.15);">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--ael-green-base); flex-shrink: 0;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <div style="flex: 1;">
          <div style="font-weight: 700; font-size: 0.875rem; color: var(--ael-ink);">Currículo Anexado</div>
          <div style="font-size: 0.75rem; color: var(--ael-muted);">${escHtml(c.original_filename || atts[0]?.original_filename || 'Documento do Candidato')}</div>
        </div>
        <a href="${getAttachmentDownloadUrl(mainAttachmentId)}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="gap: 0.35rem; font-size: 0.75rem; padding: 0.35rem 0.75rem;">
          📄 Abrir / Baixar
        </a>
      </div>
    ` : ''}

    <div style="background: var(--ael-surface); border-radius: var(--ael-radius-md); padding: 1rem; margin-bottom: 1.25rem; font-size: 0.875rem;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <div><strong>Área de Interesse:</strong> ${escHtml(ex['Area de Interesse'] || 'Geral')}</div>
        <div><strong>Cargo Desejado:</strong> ${escHtml(ex['Cargo Desejado'] || 'Não informado')}</div>
        <div><strong>Escolaridade:</strong> ${escHtml(ex['Escolaridade'] || 'Médio')}</div>
        <div><strong>Tempo Experiência:</strong> ${escHtml(ex['Tempo de Experiencia'] || 'Não informado')}</div>
        <div><strong>Curso:</strong> ${escHtml(ex['Curso'] || 'Não informado')}</div>
        <div><strong>Instituição:</strong> ${escHtml(ex['Instituicao de Ensino'] || 'Não informada')}</div>
        <div><strong>CNH:</strong> ${escHtml(ex['CNH'] || 'Não possui')}</div>
        <div><strong>Empresa Atual:</strong> ${escHtml(c.current_employer || 'Não informada')}</div>
      </div>
    </div>

    ${c.notes ? `
      <div style="margin-bottom: 1.25rem;">
        <span style="color: var(--ael-muted); display: block; font-size: 0.75rem; margin-bottom: 0.25rem;">Resumo Profissional</span>
        <p style="font-size: 0.875rem; color: var(--ael-ink); line-height: 1.6; background: #ffffff; border: 1px solid var(--ael-line); border-radius: var(--ael-radius-md); padding: 0.75rem;">
          ${escHtml(c.notes)}
        </p>
      </div>
    ` : ''}

    ${c.key_skills ? `
      <div style="margin-bottom: 1.25rem;">
        <span style="color: var(--ael-muted); display: block; font-size: 0.75rem; margin-bottom: 0.35rem;">Competências Técnicas</span>
        <div style="display: flex; flex-wrap: wrap; gap: 0.375rem;">
          ${c.key_skills.split(',').map(s => `
            <span style="background: rgba(0,91,58,0.1); color: var(--ael-green-dark); font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600;">
              ${escHtml(s.trim())}
            </span>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- CANDIDATURAS / VAGAS ASSOCIADAS -->
    <div style="margin-bottom: 1.25rem;">
      <span style="font-size: 0.8125rem; font-weight: 700; color: var(--ael-ink); display: block; margin-bottom: 0.5rem;">
        Processos Seletivos em Andamento (${apps.length})
      </span>
      ${apps.length ? `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${apps.map(a => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid var(--ael-line); padding: 0.625rem 0.875rem; border-radius: var(--ael-radius-md); font-size: 0.8125rem;">
              <div>
                <strong>${escHtml(a.job_title)}</strong>
                <span style="color: var(--ael-muted);">(${escHtml(a.job_city || 'Parauapebas')})</span>
              </div>
              <span class="status-pill green">${escHtml(a.status_label || 'Em Triagem')}</span>
            </div>
          `).join('')}
        </div>
      ` : `<div style="font-size: 0.8125rem; color: var(--ael-muted);">Nenhuma vaga vinculada ainda.</div>`}
    </div>

    <!-- LINHA DO TEMPO / ATIVIDADES -->
    <div>
      <span style="font-size: 0.8125rem; font-weight: 700; color: var(--ael-ink); display: block; margin-bottom: 0.5rem;">
        Histórico de Atividades
      </span>
      <div style="display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.75rem;">
        ${acts.map(act => `
          <div style="color: var(--ael-text); display: flex; gap: 0.5rem;">
            <span style="color: var(--ael-muted); min-width: 110px;">${formatDate(act.date_created)}:</span>
            <span>${escHtml(act.notes)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function escAttr(s) { return escHtml(s) }
function formatDate(str) {
  try { return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return '' }
}
