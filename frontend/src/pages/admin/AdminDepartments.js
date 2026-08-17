/**
 * A&L Talent Admin — Gestão de Departamentos da Empresa
 */

import { adminGetDepartments, adminCreateDepartment, adminDeleteDepartment } from '../../api.js'
import { renderAdminLayout, bindAdminLayoutEvents } from '../../components/AdminLayout.js'
import { navigate } from '../../router.js'
import { showToast } from '../../components/Toast.js'

export async function renderAdminDepartments(params, appEl) {
  let departments = []
  try {
    const res = await adminGetDepartments()
    departments = res.departments || []
  } catch (err) {
    if (err.message.includes('401')) {
      navigate('/admin/login')
      return
    }
  }

  const content = `
    <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; align-items: start;">

      <!-- TABELA DE DEPARTAMENTOS -->
      <div class="data-card">
        <div class="data-card-header">
          <div class="data-card-title">Áreas & Departamentos Cadastrados</div>
          <span style="font-size: 0.8125rem; color: var(--ael-muted);">${departments.length} áreas</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome da Área</th>
                <th>Vagas Vinculadas</th>
                <th style="text-align: right;">Ações</th>
              </tr>
            </thead>
            <tbody id="admin-dept-tbody">
              ${renderDeptRows(departments)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- FORMULÁRIO DE NOVO DEPARTAMENTO -->
      <div class="data-card">
        <div class="data-card-header">
          <div class="data-card-title">Adicionar Novo Departamento</div>
        </div>

        <form id="add-dept-form" style="padding: 1.5rem;">
          <div class="form-group">
            <label class="form-label" for="new-dept-name">Nome do Departamento *</label>
            <input
              id="new-dept-name"
              type="text"
              class="form-control"
              placeholder="Ex: Suprimentos, Planejamento, Meio Ambiente..."
              required
            />
            <div class="form-hint">Este departamento ficará disponível imediatamente para novas vagas e filtros do portal.</div>
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="add-dept-btn">
            <span>Cadastrar Departamento</span>
          </button>
        </form>
      </div>

    </div>
  `

  appEl.innerHTML = renderAdminLayout(content, {
    title: 'Departamentos da Empresa',
    activeRoute: '/admin/departments',
  })

  bindAdminLayoutEvents(appEl)
  bindDeptEvents(appEl, departments)
}

function renderDeptRows(departments) {
  if (!departments.length) {
    return `
      <tr>
        <td colspan="3" style="text-align: center; color: var(--ael-muted); padding: 2rem;">
          Nenhum departamento cadastrado.
        </td>
      </tr>
    `
  }

  return departments.map(d => `
    <tr data-id="${d.company_department_id}">
      <td>
        <div style="font-weight: 700; color: var(--ael-ink); font-size: 0.9375rem;">${escHtml(d.name)}</div>
      </td>
      <td>
        <span class="badge ${d.total_jobs > 0 ? 'badge-green' : 'badge-dark'}">
          ${d.total_jobs} vaga${d.total_jobs !== 1 ? 's' : ''}
        </span>
      </td>
      <td>
        <div class="table-actions" style="justify-content: flex-end;">
          <button class="btn-icon danger delete-dept-btn" data-id="${d.company_department_id}" data-name="${escAttr(d.name)}" title="Excluir departamento">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('')
}

function bindDeptEvents(appEl, initialDepts) {
  const form = document.getElementById('add-dept-form')
  const btn  = document.getElementById('add-dept-btn')
  const nameInput = document.getElementById('new-dept-name')

  async function reload() {
    try {
      const res = await adminGetDepartments()
      document.getElementById('admin-dept-tbody').innerHTML = renderDeptRows(res.departments || [])
      bindDeleteEvents()
    } catch (err) {
      showToast({ title: 'Erro', message: err.message, type: 'error' })
    }
  }

  function bindDeleteEvents() {
    appEl.querySelectorAll('.delete-dept-btn').forEach(b => {
      b.addEventListener('click', async () => {
        const id   = b.dataset.id
        const name = b.dataset.name
        if (confirm(`Deseja excluir o departamento "${name}"?`)) {
          try {
            await adminDeleteDepartment(id)
            showToast({ title: 'Departamento Excluído', message: `Área "${name}" removida.`, type: 'success' })
            reload()
          } catch (err) {
            showToast({ title: 'Erro', message: err.message, type: 'error' })
          }
        }
      })
    })
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const name = nameInput.value.trim()
    if (!name) return

    btn.disabled = true
    btn.querySelector('span').textContent = 'Cadastrando...'

    try {
      await adminCreateDepartment(name)
      showToast({ title: 'Departamento Cadastrado', message: `Área "${name}" disponível com sucesso!`, type: 'success' })
      nameInput.value = ''
      reload()
    } catch (err) {
      showToast({ title: 'Erro', message: err.message, type: 'error' })
    } finally {
      btn.disabled = false
      btn.querySelector('span').textContent = 'Cadastrar Departamento'
    }
  })

  bindDeleteEvents()
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function escAttr(s) { return escHtml(s) }
