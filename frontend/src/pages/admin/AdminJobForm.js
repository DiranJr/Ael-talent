/**
 * A&L Talent Admin — Formulário de Criação e Edição de Vagas
 */

import { adminCreateJob, adminUpdateJob, getJob, adminGetDepartments, adminCreateDepartment, adminGetUsers } from '../../api.js'
import { renderAdminLayout, bindAdminLayoutEvents } from '../../components/AdminLayout.js'
import { navigate } from '../../router.js'
import { showToast } from '../../components/Toast.js'

export async function renderAdminJobForm({ id }, appEl) {
  const isEditing = Boolean(id)
  let existingJob = null
  let departments = []
  let recruiters = []

  try {
    const [deptRes, usersRes, jobRes] = await Promise.all([
      adminGetDepartments(),
      adminGetUsers().catch(() => ({ users: [] })),
      isEditing ? getJob(id).catch(() => null) : Promise.resolve(null)
    ])
    departments = deptRes.departments || []
    recruiters = usersRes.users || []
    if (jobRes) {
      existingJob = jobRes.job || null
    }
  } catch (err) {
    if (err.message.includes('401')) {
      navigate('/admin/login')
      return
    }
  }

  const job = existingJob || {
    title: '',
    description: '',
    notes: '',
    type: 'Full Time',
    city: 'Parauapebas',
    state: 'PA',
    company_department_id: '',
    recruiter_id: '',
    openings: 1,
    status: 'Active-Share',
    public: 1,
  }

  const isPublicChecked = (job.status === 'Active-Share' || job.public === 1)

  const content = `
    <div style="max-width: 800px; margin-inline: auto;">
      <!-- Breadcrumb -->
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--ael-muted); margin-bottom: 1.5rem;">
        <a href="#/admin/jobs" style="color: var(--ael-muted); text-decoration: none;">Vagas</a>
        <span>›</span>
        <span style="color: var(--ael-ink); font-weight: 600;">${isEditing ? 'Editar Vaga' : 'Nova Vaga'}</span>
      </div>

      <div class="data-card">
        <div class="data-card-header">
          <div class="data-card-title">${isEditing ? `Editar Vaga #${id}` : 'Cadastrar Nova Oportunidade'}</div>
          <span style="font-size: 0.8125rem; color: var(--ael-muted);">Preencha os dados da oportunidade</span>
        </div>

        <form id="admin-job-form" style="padding: 2rem;">
          <!-- TÍTULO -->
          <div class="form-group">
            <label class="form-label" for="job-title">Título da Vaga *</label>
            <input
              id="job-title"
              name="title"
              type="text"
              class="form-control"
              placeholder="Ex: Engenheiro de Planejamento, Assistente Administrativo..."
              value="${escAttr(job.title)}"
              required
            />
          </div>

          <!-- GRID: DEPARTAMENTO + RECRUTADOR -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label class="form-label" style="margin-bottom: 0;" for="job-department">Departamento / Área *</label>
                <button type="button" id="quick-add-dept-btn" style="font-size: 0.75rem; color: var(--ael-green-base); font-weight: 600; cursor: pointer;">
                  + Nova área
                </button>
              </div>
              <select id="job-department" name="department_id" class="form-control" required>
                <option value="">Selecione o departamento</option>
                ${departments.map(d => `
                  <option value="${d.company_department_id}" ${String(d.company_department_id) === String(job.company_department_id) ? 'selected' : ''}>
                    ${escHtml(d.name)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="job-recruiter">Recrutador(a) Responsável</label>
              <select id="job-recruiter" name="recruiter_id" class="form-control">
                <option value="">Selecione o(a) recrutador(a)</option>
                ${recruiters.map(u => `
                  <option value="${u.user_id}" ${String(u.user_id) === String(job.recruiter_id || job.recruiter) ? 'selected' : ''}>
                    ${escHtml(u.full_name)} (${escHtml(u.role)})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- GRID: REGIME, CIDADE, ESTADO, VAGAS -->
          <div style="display: grid; grid-template-columns: 1.2fr 1.2fr 0.6fr 0.6fr; gap: 1.25rem;">
            <div class="form-group">
              <label class="form-label" for="job-type">Regime de Contratação</label>
              <select id="job-type" name="type" class="form-control">
                <option value="Full Time" ${job.type === 'Full Time' ? 'selected' : ''}>CLT / Efetivo (Full Time)</option>
                <option value="PJ" ${job.type === 'PJ' ? 'selected' : ''}>Prestador de Serviços (PJ)</option>
                <option value="Estágio" ${job.type === 'Estágio' ? 'selected' : ''}>Estágio</option>
                <option value="Temporário" ${job.type === 'Temporário' ? 'selected' : ''}>Temporário / Obra</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="job-city">Cidade *</label>
              <input
                id="job-city"
                name="city"
                type="text"
                class="form-control"
                placeholder="Ex: Parauapebas..."
                value="${escAttr(job.city || 'Parauapebas')}"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="job-state">UF *</label>
              <input
                id="job-state"
                name="state"
                type="text"
                class="form-control"
                placeholder="PA"
                maxlength="2"
                value="${escAttr(job.state || 'PA')}"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="job-openings">Nº Vagas</label>
              <input
                id="job-openings"
                name="openings"
                type="number"
                min="1"
                class="form-control"
                value="${job.openings || 1}"
              />
            </div>
          </div>

          <!-- DESCRIÇÃO -->
          <div class="form-group">
            <label class="form-label" for="job-desc">Descrição da Oportunidade (Atividades, Requisitos, Benefícios) *</label>
            <textarea
              id="job-desc"
              name="description"
              rows="8"
              class="form-control"
              placeholder="Descreva as responsabilidades, requisitos obrigatórios, diferenciais e benefícios oferecidos..."
              style="resize: vertical; font-family: inherit; line-height: 1.6;"
              required
            >${escHtml(job.description || '')}</textarea>
            <div class="form-hint">Dica: Use tópicos e quebras de linha para deixar o texto limpo para os candidatos.</div>
          </div>

          <!-- NOTAS INTERNAS (PRIVADAS) -->
          <div class="form-group">
            <label class="form-label" for="job-notes">Observações Internas do RH <span style="font-weight:400;color:var(--ael-muted);">(visível apenas para a equipe)</span></label>
            <input
              id="job-notes"
              name="notes"
              type="text"
              class="form-control"
              placeholder="Ex: Alinhado com Gestor Carlos · Foco em candidatos com experiência em mina"
              value="${escAttr(job.notes || '')}"
            />
          </div>

          <!-- SWITCH DE PUBLICAÇÃO -->
          <div style="
            background: rgba(0,91,58,0.06);
            border: 1.5px solid rgba(0,91,58,0.20);
            border-radius: var(--ael-radius-lg);
            padding: 1.25rem;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <div>
              <div style="font-weight: 700; color: var(--ael-ink); font-size: 0.9375rem;">Publicar no Portal de Carreiras</div>
              <div style="font-size: 0.8125rem; color: var(--ael-muted);">
                Se desmarcado, a vaga fica salva como rascunho / oculta do mural público.
              </div>
            </div>
            <label class="switch" style="position: relative; display: inline-block; width: 48px; height: 26px;">
              <input type="checkbox" id="job-is-public" ${isPublicChecked ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
              <span class="slider" style="
                position: absolute; cursor: pointer; inset: 0;
                background-color: #ccc; transition: .3s; border-radius: 34px;
              "></span>
            </label>
          </div>

          <!-- BOTÕES DE AÇÃO -->
          <div style="display: flex; gap: 1rem; justify-content: flex-end; border-top: 1px solid var(--ael-line); padding-top: 1.5rem;">
            <a href="#/admin/jobs" class="btn btn-ghost">Cancelar</a>
            <button type="submit" class="btn btn-primary btn-lg" id="job-submit-btn">
              <span>${isEditing ? 'Salvar Alterações' : 'Criar e Publicar Vaga'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `

  appEl.innerHTML = renderAdminLayout(content, {
    title: isEditing ? 'Editar Vaga' : 'Nova Vaga',
    activeRoute: '/admin/jobs',
  })

  bindAdminLayoutEvents(appEl)
  bindFormEvents(isEditing, id)
}

function bindFormEvents(isEditing, id) {
  const form = document.getElementById('admin-job-form')
  const submitBtn = document.getElementById('job-submit-btn')
  const isPublicToggle = document.getElementById('job-is-public')
  const slider = isPublicToggle?.nextElementSibling

  if (isPublicToggle && slider) {
    const updateSlider = () => {
      slider.style.backgroundColor = isPublicToggle.checked ? 'var(--ael-green-base)' : '#ccc'
    }
    isPublicToggle.addEventListener('change', updateSlider)
    updateSlider()
  }

  // Quick Add Departamento
  document.getElementById('quick-add-dept-btn')?.addEventListener('click', async () => {
    const name = prompt('Digite o nome da nova Área / Departamento:')
    if (!name?.trim()) return

    try {
      const res = await adminCreateDepartment(name.trim())
      showToast({ title: 'Área criada!', message: `Departamento "${name}" adicionado.`, type: 'success' })

      const select = document.getElementById('job-department')
      const newOpt = document.createElement('option')
      newOpt.value = res.department.company_department_id
      newOpt.textContent = res.department.name
      newOpt.selected = true
      select.appendChild(newOpt)
    } catch (err) {
      showToast({ title: 'Erro', message: err.message, type: 'error' })
    }
  })

  // Submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const isPublic = document.getElementById('job-is-public').checked
    const recruiterId = document.getElementById('job-recruiter').value

    const payload = {
      title: document.getElementById('job-title').value.trim(),
      department_id: document.getElementById('job-department').value,
      recruiter_id: recruiterId || null,
      type: document.getElementById('job-type').value,
      city: document.getElementById('job-city').value.trim(),
      state: document.getElementById('job-state').value.trim().toUpperCase(),
      openings: parseInt(document.getElementById('job-openings').value) || 1,
      description: document.getElementById('job-desc').value.trim(),
      notes: document.getElementById('job-notes').value.trim(),
      is_public: isPublic,
      status: isPublic ? 'Active-Share' : 'On Hold',
    }

    submitBtn.disabled = true
    submitBtn.querySelector('span').textContent = isEditing ? 'Salvando...' : 'Criando...'

    try {
      if (isEditing) {
        await adminUpdateJob(id, payload)
        showToast({ title: 'Vaga atualizada!', message: 'As alterações foram salvas com sucesso.', type: 'success' })
      } else {
        await adminCreateJob(payload)
        showToast({ title: 'Vaga criada!', message: 'A vaga já está visível para a equipe.', type: 'success' })
      }
      navigate('/admin/jobs')
    } catch (err) {
      showToast({ title: 'Erro ao salvar', message: err.message || 'Verifique os dados.', type: 'error' })
      submitBtn.disabled = false
      submitBtn.querySelector('span').textContent = isEditing ? 'Salvar Alterações' : 'Criar e Publicar Vaga'
    }
  })
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escAttr(s) {
  return String(s ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
