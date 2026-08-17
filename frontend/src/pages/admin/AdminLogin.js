/**
 * A&L Talent Admin — Tela de Login do RH
 */

import { adminLogin, getAdminToken } from '../../api.js'
import { navigate } from '../../router.js'
import { showToast } from '../../components/Toast.js'

export async function renderAdminLogin(params, appEl) {
  // Se já logado, redireciona
  if (getAdminToken()) {
    navigate('/admin')
    return
  }

  appEl.innerHTML = `
    <div style="
      min-height: 100vh;
      background: var(--ael-dark-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,91,58,0.20) 0%, transparent 70%);
      " aria-hidden="true"></div>

      <div style="
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 420px;
        background: white;
        border-radius: var(--ael-radius-xl);
        padding: 2.5rem;
        box-shadow: 0 24px 64px rgba(0,0,0,0.50);
        border: 1.5px solid var(--ael-line);
      ">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="
            background: #002818;
            padding: 0.75rem 1.25rem;
            border-radius: var(--ael-radius-lg);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.25rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          ">
            <img src="/logo.png" alt="A&L Engenharia" style="height: 38px; width: auto; object-fit: contain;" />
          </div>
          <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--ael-ink); margin-bottom: 0.25rem;">Painel do RH</h1>
          <p style="font-size: 0.875rem; color: var(--ael-muted);">Acesse para gerenciar vagas e candidatos</p>
        </div>

        <form id="admin-login-form">
          <div class="form-group">
            <label class="form-label" for="login-username">Usuário</label>
            <input
              id="login-username"
              type="text"
              class="form-control"
              placeholder="Ex: admin"
              value="admin"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group" style="margin-bottom: 1.75rem;">
            <label class="form-label" for="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              class="form-control"
              placeholder="Sua senha de acesso"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-submit-btn">
            <span>Entrar no Painel</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
          </button>
        </form>

        <div style="margin-top: 1.5rem; text-align: center; border-top: 1px solid var(--ael-line); padding-top: 1.25rem;">
          <a href="#/" style="font-size: 0.8125rem; color: var(--ael-green-base); font-weight: 600; text-decoration: none;">
            ← Voltar ao Portal Público
          </a>
        </div>
      </div>
    </div>
  `

  const form = document.getElementById('admin-login-form')
  const btn  = document.getElementById('login-submit-btn')

  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const username = document.getElementById('login-username').value.trim()
    const password = document.getElementById('login-password').value

    btn.disabled = true
    btn.querySelector('span').textContent = 'Entrando...'

    try {
      await adminLogin(username, password)
      showToast({ title: 'Bem-vindo!', message: 'Login efetuado com sucesso.', type: 'success' })
      navigate('/admin')
    } catch (err) {
      showToast({ title: 'Erro de login', message: err.message || 'Credenciais inválidas.', type: 'error' })
      btn.disabled = false
      btn.querySelector('span').textContent = 'Entrar no Painel'
    }
  })
}
