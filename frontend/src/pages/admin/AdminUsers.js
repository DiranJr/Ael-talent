/**
 * A&L Talent Admin — Gestão de Usuários & Recrutadores da Equipe
 * Rota: #/admin/users
 */

import { adminCreateUser, adminDeleteUser, adminGetUsers, adminUpdateUser, getAdminUser } from '../../api.js'
import { renderAdminLayout } from '../../components/AdminLayout.js'
import { showToast } from '../../components/Toast.js'

function escHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function renderAdminUsers(params, appEl) {
  const currentUser = getAdminUser() || {}
  const isAdmin = (currentUser.access_level || 0) >= 400

  let users = []
  let isLoading = true

  async function loadData() {
    try {
      const res = await adminGetUsers()
      users = res.users || []
    } catch (err) {
      showToast({ title: 'Erro', message: err.message || 'Erro ao carregar equipe.', type: 'error' })
    } finally {
      isLoading = false
      render()
    }
  }

  function render() {
    const topActions = isAdmin
      ? `
      <button class="btn btn-primary btn-sm" id="btn-create-user">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
        <span>Novo Recrutador / Acesso</span>
      </button>
    `
      : ''

    const contentHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <p style="color: var(--ael-muted); font-size: 0.875rem; margin: 0;">
          Gerencie os membros da equipe de R&S, níveis de permissão e distribuição de vagas.
        </p>
        <span class="badge badge-accent" style="font-size: 0.8125rem; padding: 0.35rem 0.75rem;">
          ${users.length} membro(s) ativo(s)
        </span>
      </div>

      ${
        isLoading
          ? `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
          <div class="skeleton-card" style="height: 180px;"></div>
          <div class="skeleton-card" style="height: 180px;"></div>
          <div class="skeleton-card" style="height: 180px;"></div>
        </div>
      `
          : users.length === 0
            ? `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>Nenhum usuário cadastrado</h3>
          <p>Adicione recrutadores para conduzir triagens e processos seletivos.</p>
        </div>
      `
            : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem;">
          ${users
            .map((u) => {
              const isSelf = u.user_id === currentUser.user_id
              const isUserAdmin = u.access_level >= 400
              return `
              <div class="data-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; margin-bottom: 0;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.875rem;">
                      <div style="
                        width: 46px; height: 46px; border-radius: var(--ael-radius-md);
                        background: ${isUserAdmin ? 'var(--ael-dark-surface)' : 'var(--ael-green-base)'};
                        color: ${isUserAdmin ? 'var(--ael-green-accent)' : '#ffffff'};
                        display: flex; align-items: center; justify-content: center;
                        font-weight: 800; font-size: 1.125rem;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                      ">
                        ${escHtml((u.first_name || 'U').charAt(0).toUpperCase())}
                      </div>
                      <div>
                        <div style="font-weight: 700; font-size: 1rem; color: var(--ael-ink); line-height: 1.2;">
                          ${escHtml(u.full_name)}
                          ${isSelf ? '<span style="font-size:0.6875rem;background:rgba(0,230,118,0.15);color:var(--ael-green-base);padding:2px 6px;border-radius:4px;margin-left:4px;font-weight:700;">Você</span>' : ''}
                        </div>
                        <div style="font-size: 0.8125rem; color: var(--ael-muted); margin-top: 2px;">
                          @${escHtml(u.user_name)} · ${escHtml(u.title || (isUserAdmin ? 'Administrador de RH' : 'Recrutador(a)'))}
                        </div>
                      </div>
                    </div>

                    <span class="badge ${isUserAdmin ? 'badge-accent' : 'badge-status'}" style="font-size: 0.6875rem; font-weight: 700;">
                      ${isUserAdmin ? '👑 Administrador' : '💼 Recrutador'}
                    </span>
                  </div>

                  <div style="font-size: 0.8125rem; color: var(--ael-ink); margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem;">
                    ${
                      u.email
                        ? `
                      <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--ael-muted);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <span style="word-break: break-all;">${escHtml(u.email)}</span>
                      </div>
                    `
                        : ''
                    }
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--ael-green-base); font-weight: 600; margin-top: 0.25rem;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      <span>${u.active_jobs_count || 0} vaga(s) ativa(s) sob gestão</span>
                    </div>
                  </div>
                </div>

                ${
                  isAdmin
                    ? `
                  <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid var(--ael-line); padding-top: 0.875rem; margin-top: 0.5rem;">
                    <button class="admin-action-btn btn-edit-user" data-id="${u.user_id}">
                      ✏️ Editar / Senha
                    </button>
                    ${
                      !isSelf
                        ? `
                      <button class="admin-action-btn btn-danger btn-delete-user" data-id="${u.user_id}" data-name="${escHtml(u.full_name)}">
                        🗑 Excluir
                      </button>
                    `
                        : ''
                    }
                  </div>
                `
                    : ''
                }
              </div>
            `
            })
            .join('')}
        </div>
      `
      }

      <!-- MODAL DE CADASTRO / EDIÇÃO -->
      <div id="user-modal-overlay" style="
        display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        z-index: 999; align-items: center; justify-content: center; padding: 1.5rem;
      ">
        <div class="data-card" style="max-width: 520px; width: 100%; padding: 2rem; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 id="modal-title" style="font-size: 1.25rem; font-weight: 800; color: var(--ael-ink);">Novo Usuário / Recrutador</h3>
            <button id="modal-close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--ael-muted);">×</button>
          </div>

          <form id="user-form">
            <input type="hidden" id="user-edit-id" value="" />

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label" for="user-first-name">Nome *</label>
                <input id="user-first-name" type="text" class="form-control" placeholder="Ex: Paula" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="user-last-name">Sobrenome *</label>
                <input id="user-last-name" type="text" class="form-control" placeholder="Ex: Santos" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="user-username">Usuário de Acesso (Login) *</label>
              <input id="user-username" type="text" class="form-control" placeholder="Ex: paula.santos" required autocomplete="username" />
            </div>

            <div class="form-group">
              <label class="form-label" for="user-email">E-mail Corporativo</label>
              <input id="user-email" type="email" class="form-control" placeholder="paula@aelengenharia.com.br" />
            </div>

            <div class="form-group">
              <label class="form-label" for="user-title">Cargo / Função</label>
              <input id="user-title" type="text" class="form-control" placeholder="Ex: Recrutadora Técnica de Engenharia" />
            </div>

            <div class="form-group">
              <label class="form-label" for="user-access-level">Papel no Sistema *</label>
              <select id="user-access-level" class="form-control" required style="font-size:0.9375rem;">
                <option value="200">💼 Recrutador(a) (Triagem, Pipeline, Notas e WhatsApp)</option>
                <option value="500">👑 Administrador(a) (Gestão Completa + Criação de Acessos)</option>
              </select>
            </div>

            <div class="form-group" id="pwd-group">
              <label class="form-label" for="user-password" id="pwd-label">Senha de Acesso *</label>
              <input id="user-password" type="password" class="form-control" placeholder="Mínimo 6 caracteres" minlength="6" />
              <div id="pwd-help" style="font-size: 0.75rem; color: var(--ael-muted); margin-top: 4px; display: none;">
                Deixe em branco se não desejar alterar a senha atual.
              </div>
            </div>

            <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.75rem;">
              <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="modal-submit-btn">
                <span>Salvar Acesso</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    appEl.innerHTML = renderAdminLayout(contentHtml, {
      title: 'Equipe & Recrutadores',
      activeRoute: '/admin/users',
      topActionsHtml: topActions,
    })

    bindEvents()
  }

  function bindEvents() {
    const modal = document.getElementById('user-modal-overlay')
    const btnCreate = document.getElementById('btn-create-user')
    const btnClose = document.getElementById('modal-close-btn')
    const btnCancel = document.getElementById('modal-cancel-btn')
    const form = document.getElementById('user-form')

    function openModal(editUser = null) {
      if (!modal) return
      modal.style.display = 'flex'

      const editId = document.getElementById('user-edit-id')
      const titleEl = document.getElementById('modal-title')
      const usernameInput = document.getElementById('user-username')
      const pwdInput = document.getElementById('user-password')
      const pwdLabel = document.getElementById('pwd-label')
      const pwdHelp = document.getElementById('pwd-help')

      if (editUser) {
        titleEl.textContent = 'Editar Recrutador / Acesso'
        editId.value = editUser.user_id
        document.getElementById('user-first-name').value = editUser.first_name || ''
        document.getElementById('user-last-name').value = editUser.last_name || ''
        usernameInput.value = editUser.user_name || ''
        usernameInput.disabled = true
        document.getElementById('user-email').value = editUser.email || ''
        document.getElementById('user-title').value = editUser.title || ''
        document.getElementById('user-access-level').value = editUser.access_level >= 400 ? '500' : '200'
        pwdInput.value = ''
        pwdInput.required = false
        pwdLabel.textContent = 'Nova Senha (Opcional)'
        pwdHelp.style.display = 'block'
      } else {
        titleEl.textContent = 'Novo Usuário / Recrutador'
        editId.value = ''
        form.reset()
        usernameInput.disabled = false
        pwdInput.required = true
        pwdLabel.textContent = 'Senha de Acesso *'
        pwdHelp.style.display = 'none'
      }
    }

    function closeModal() {
      if (modal) modal.style.display = 'none'
    }

    btnCreate?.addEventListener('click', () => openModal())
    btnClose?.addEventListener('click', closeModal)
    btnCancel?.addEventListener('click', closeModal)

    // Editar Usuário
    appEl.querySelectorAll('.btn-edit-user').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10)
        const userToEdit = users.find((u) => u.user_id === id)
        if (userToEdit) openModal(userToEdit)
      })
    })

    // Excluir Usuário
    appEl.querySelectorAll('.btn-delete-user').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id, 10)
        const name = btn.dataset.name
        if (
          confirm(`Tem certeza que deseja remover o acesso de "${name}"? Suas vagas serão atribuídas ao administrador.`)
        ) {
          try {
            await adminDeleteUser(id)
            showToast({ title: 'Sucesso', message: 'Usuário removido.', type: 'success' })
            loadData()
          } catch (err) {
            showToast({ title: 'Erro', message: err.message || 'Erro ao excluir usuário.', type: 'error' })
          }
        }
      })
    })

    // Submit Form
    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const editId = document.getElementById('user-edit-id').value
      const submitBtn = document.getElementById('modal-submit-btn')

      const payload = {
        first_name: document.getElementById('user-first-name').value.trim(),
        last_name: document.getElementById('user-last-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        title: document.getElementById('user-title').value.trim(),
        access_level: parseInt(document.getElementById('user-access-level').value, 10),
      }

      const pwd = document.getElementById('user-password').value
      if (pwd) payload.password = pwd

      submitBtn.disabled = true
      submitBtn.querySelector('span').textContent = 'Salvando...'

      try {
        if (editId) {
          await adminUpdateUser(editId, payload)
          showToast({ title: 'Sucesso', message: 'Acesso atualizado com sucesso!', type: 'success' })
        } else {
          payload.user_name = document.getElementById('user-username').value.trim()
          await adminCreateUser(payload)
          showToast({ title: 'Sucesso', message: 'Novo recrutador cadastrado!', type: 'success' })
        }
        closeModal()
        loadData()
      } catch (err) {
        showToast({ title: 'Erro', message: err.message || 'Falha ao salvar usuário.', type: 'error' })
      } finally {
        submitBtn.disabled = false
        submitBtn.querySelector('span').textContent = 'Salvar Acesso'
      }
    })
  }

  loadData()
}
