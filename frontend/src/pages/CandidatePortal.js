import {
  candidateForgotPassword,
  candidateGetMe,
  candidateLogin,
  candidateResetPassword,
  candidateSetPassword,
  clearCandidateAuth,
  getCandidateToken,
  getFilters,
  getJobs,
  registerTalentPool,
  setCandidateAuth,
  uploadCandidatePhoto,
} from '../api.js'

import { showToast } from '../components/Toast.js'
import { navigate } from '../router.js'

export async function renderCandidatePortal(params, appEl) {
  const token = getCandidateToken()
  let candidateData = null
  let departments = []
  let jobsList = []

  if (token) {
    appEl.innerHTML = renderCandidatePortalSkeleton()
  }

  try {
    const [filtersRes, jobsRes, meRes] = await Promise.all([
      getFilters(),
      getJobs().catch(() => ({ jobs: [] })),
      token ? candidateGetMe().catch(() => null) : Promise.resolve(null),
    ])
    departments = (filtersRes.departments || []).filter((d) => d.value)
    jobsList = jobsRes.jobs || []

    if (token) {
      if (meRes?.success && meRes.candidate) {
        candidateData = meRes.candidate
      } else {
        clearCandidateAuth()
      }
    }
  } catch (err) {
    clearCandidateAuth()
  }

  if (!candidateData) {
    renderAuthScreen(appEl, departments, params)
  } else {
    renderPortalDashboard(appEl, candidateData, departments, jobsList)
  }
}

// ─── TELA DE AUTENTICAÇÃO E RECUPERAÇÃO DE SENHA DO CANDIDATO ────────────────
function renderAuthScreen(appEl, departments, initialParams = {}) {
  // Modos: 'login' | 'forgot' | 'reset' | 'first_access'
  let currentMode = initialParams?.token ? 'reset' : 'login'
  let pendingEmail = ''
  let resetToken = initialParams?.token || ''

  function renderForm() {
    let cardContent = ''

    if (currentMode === 'login') {
      cardContent = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="
            width: 56px; height: 56px; border-radius: var(--ael-radius-md);
            background: rgba(0, 91, 58, 0.1); color: var(--ael-green-base);
            display: flex; align-items: center; justify-content: center;
            margin-inline: auto; margin-bottom: 1rem;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--ael-ink);">Portal do Candidato</h2>
          <p style="font-size: 0.875rem; color: var(--ael-muted); margin-top: 0.25rem;">
            Acesse seu perfil com e-mail e senha cadastrados.
          </p>
        </div>

        <form id="candidate-login-form">
          <div class="form-group">
            <label class="form-label" for="cand-login-email">Seu E-mail *</label>
            <input
              id="cand-login-email"
              type="email"
              class="form-control"
              placeholder="seu.email@exemplo.com"
              value="${escAttr(pendingEmail)}"
              required
            />
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label class="form-label" for="cand-login-password" style="margin-bottom: 0;">Sua Senha *</label>
              <button type="button" id="btn-goto-forgot" style="background: none; border: none; font-size: 0.8125rem; color: var(--ael-green-base); font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0;">
                Esqueceu a senha?
              </button>
            </div>
            <div style="position: relative;">
              <input
                id="cand-login-password"
                type="password"
                class="form-control"
                placeholder="Sua senha secreta"
                style="padding-right: 2.75rem;"
                required
              />
              <button type="button" class="btn-toggle-pwd" data-target="cand-login-password" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--ael-muted); padding: 0.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="cand-login-btn">
            <span>Entrar no Meu Painel</span>
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.25rem;">
          <button type="button" id="btn-goto-first-access" style="background: none; border: none; font-size: 0.8125rem; color: var(--ael-muted); font-weight: 500; cursor: pointer;">
            Primeiro acesso? <strong style="color: var(--ael-green-base);">Cadastre sua senha aqui</strong>
          </button>
        </div>
      `
    } else if (currentMode === 'forgot') {
      cardContent = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="
            width: 56px; height: 56px; border-radius: var(--ael-radius-md);
            background: rgba(234, 88, 12, 0.1); color: #ea580c;
            display: flex; align-items: center; justify-content: center;
            margin-inline: auto; margin-bottom: 1rem;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--ael-ink);">Recuperar Senha</h2>
          <p style="font-size: 0.875rem; color: var(--ael-muted); margin-top: 0.25rem;">
            Informe o e-mail cadastrado no Banco de Talentos para redefinir sua senha.
          </p>
        </div>

        <form id="candidate-forgot-form">
          <div class="form-group">
            <label class="form-label" for="forgot-email">Seu E-mail Cadastrado *</label>
            <input
              id="forgot-email"
              type="email"
              class="form-control"
              placeholder="seu.email@exemplo.com"
              value="${escAttr(pendingEmail)}"
              required
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary btn-full btn-lg" id="forgot-submit-btn">
              <span>Enviar Instruções de Recuperação</span>
            </button>
            <button type="button" class="btn btn-outline btn-full" id="forgot-cancel-btn">
              Voltar ao Login
            </button>
          </div>
        </form>
      `
    } else if (currentMode === 'reset') {
      cardContent = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="
            width: 56px; height: 56px; border-radius: var(--ael-radius-md);
            background: rgba(0, 91, 58, 0.1); color: var(--ael-green-base);
            display: flex; align-items: center; justify-content: center;
            margin-inline: auto; margin-bottom: 1rem;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--ael-ink);">Validar Código de 6 Dígitos</h2>
          <p style="font-size: 0.875rem; color: var(--ael-muted); margin-top: 0.25rem;">
            Enviamos um código de verificação para o seu e-mail. Digite-o abaixo junto com sua nova senha.
          </p>
        </div>

        <form id="candidate-reset-form">
          <div class="form-group">
            <label class="form-label" for="reset-token-input" style="text-align: center; display: block;">Código de Verificação (6 dígitos) *</label>
            <input
              id="reset-token-input"
              type="text"
              class="form-control"
              placeholder="Ex: 123456"
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
              style="font-size: 1.35rem; font-weight: 800; letter-spacing: 0.35rem; text-align: center; color: var(--ael-green-base);"
              required
            />
            <small style="font-size: 0.75rem; color: var(--ael-muted); margin-top: 0.35rem; display: block; text-align: center;">
              Verifique sua caixa de entrada e spam (válido por 15 minutos).
            </small>
          </div>

          <div class="form-group">
            <label class="form-label" for="reset-new-pass">Nova Senha (mínimo 8 caracteres) *</label>
            <div style="position: relative;">
              <input
                id="reset-new-pass"
                type="password"
                class="form-control"
                placeholder="Crie sua nova senha"
                minlength="8"
                style="padding-right: 2.75rem;"
                required
              />
              <button type="button" class="btn-toggle-pwd" data-target="reset-new-pass" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--ael-muted); padding: 0.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reset-pass-confirm">Confirmar Nova Senha *</label>
            <div style="position: relative;">
              <input
                id="reset-pass-confirm"
                type="password"
                class="form-control"
                placeholder="Repita a nova senha"
                minlength="8"
                style="padding-right: 2.75rem;"
                required
              />
              <button type="button" class="btn-toggle-pwd" data-target="reset-pass-confirm" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--ael-muted); padding: 0.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary btn-full btn-lg" id="reset-submit-btn">
              <span>Salvar Nova Senha & Acessar</span>
            </button>
            <button type="button" class="btn btn-outline btn-full" id="reset-cancel-btn">
              Não recebeu o código? Reenviar / Voltar
            </button>
          </div>
        </form>
      `
    } else if (currentMode === 'first_access') {
      cardContent = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="
            width: 56px; height: 56px; border-radius: var(--ael-radius-md);
            background: rgba(0, 91, 58, 0.1); color: var(--ael-green-base);
            display: flex; align-items: center; justify-content: center;
            margin-inline: auto; margin-bottom: 1rem;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--ael-ink);">Primeiro Acesso</h2>
          <p style="font-size: 0.875rem; color: var(--ael-muted); margin-top: 0.25rem;">
            Cadastre sua senha segura para gerenciar seu perfil.
          </p>
        </div>

        <form id="candidate-first-access-form">
          <div class="form-group">
            <label class="form-label" for="first-email">Confirme seu E-mail Cadastrado *</label>
            <input id="first-email" type="email" class="form-control" placeholder="seu.email@exemplo.com" value="${escAttr(pendingEmail)}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="first-pass">Nova Senha (mínimo 8 caracteres) *</label>
            <div style="position: relative;">
              <input id="first-pass" type="password" class="form-control" placeholder="Crie sua nova senha segura" minlength="8" style="padding-right: 2.75rem;" required />
              <button type="button" class="btn-toggle-pwd" data-target="first-pass" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--ael-muted); padding: 0.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="first-pass-confirm">Confirmar Nova Senha *</label>
            <div style="position: relative;">
              <input id="first-pass-confirm" type="password" class="form-control" placeholder="Repita a nova senha" minlength="8" style="padding-right: 2.75rem;" required />
              <button type="button" class="btn-toggle-pwd" data-target="first-pass-confirm" style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--ael-muted); padding: 0.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary btn-full btn-lg" id="first-submit-btn">
              <span>Salvar Senha & Acessar</span>
            </button>
            <button type="button" class="btn btn-outline btn-full" id="first-cancel-btn">
              Voltar ao Login
            </button>
          </div>
        </form>
      `
    }

    appEl.innerHTML = `
      <div style="background: var(--ael-surface); min-height: 100vh; padding-top: calc(var(--ael-header-h) + 2.5rem); padding-bottom: 5rem; display: flex; align-items: center;">
        <div class="container" style="max-width: 480px; margin-inline: auto;">
          <div class="data-card" style="padding: 2.5rem 2rem;">
            ${cardContent}
            <div style="text-align: center; margin-top: 1.75rem; font-size: 0.8125rem; color: var(--ael-muted); border-top: 1px solid var(--ael-line); padding-top: 1.25rem;">
              Ainda não possui cadastro no Banco de Talentos?
              <a href="#/talent-pool/register" style="color: var(--ael-green-base); font-weight: 700; text-decoration: none;">Cadastrar Perfil</a>
            </div>
          </div>
        </div>
      </div>
    `

    bindAuthEvents()
  }

  function bindAuthEvents() {
    // Alternar visibilidade de senhas
    document.querySelectorAll('.btn-toggle-pwd').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target
        const input = document.getElementById(targetId)
        if (!input) return
        const isPassword = input.type === 'password'
        input.type = isPassword ? 'text' : 'password'
        btn.innerHTML = isPassword
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9.88 9.88 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
      })
    })

    // Navegações entre modos
    document.getElementById('btn-goto-forgot')?.addEventListener('click', () => {
      pendingEmail = document.getElementById('cand-login-email')?.value.trim() || pendingEmail
      currentMode = 'forgot'
      renderForm()
    })

    document.getElementById('btn-goto-first-access')?.addEventListener('click', () => {
      pendingEmail = document.getElementById('cand-login-email')?.value.trim() || pendingEmail
      currentMode = 'first_access'
      renderForm()
    })

    document.getElementById('forgot-cancel-btn')?.addEventListener('click', () => {
      currentMode = 'login'
      renderForm()
    })

    document.getElementById('reset-cancel-btn')?.addEventListener('click', () => {
      currentMode = 'forgot'
      renderForm()
    })

    document.getElementById('first-cancel-btn')?.addEventListener('click', () => {
      currentMode = 'login'
      renderForm()
    })

    // 1. Submit de Login
    document.getElementById('candidate-login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('cand-login-email').value.trim()
      const password = document.getElementById('cand-login-password').value
      const btn = document.getElementById('cand-login-btn')

      btn.disabled = true
      btn.querySelector('span').textContent = 'Autenticando...'

      try {
        const res = await candidateLogin(email, password)
        if (res.first_access) {
          showToast({ title: 'Primeiro Acesso', message: res.message, type: 'info' })
          pendingEmail = email
          currentMode = 'first_access'
          renderForm()
          return
        }

        if (res.token && res.candidate) {
          setCandidateAuth(res.token, res.candidate)
          showToast({ title: 'Acesso Autorizado', message: `Olá, ${res.candidate.first_name}!`, type: 'success' })
          renderPortalDashboard(appEl, res.candidate, departments)
        }
      } catch (err) {
        showToast({ title: 'Erro de Acesso', message: err.message, type: 'error' })
        btn.disabled = false
        btn.querySelector('span').textContent = 'Entrar no Meu Painel'
      }
    })

    // 2. Submit de Solicitação de Recuperação (Forgot)
    document.getElementById('candidate-forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('forgot-email').value.trim()
      const btn = document.getElementById('forgot-submit-btn')

      btn.disabled = true
      btn.querySelector('span').textContent = 'Enviando instruções...'

      try {
        const res = await candidateForgotPassword(email)
        pendingEmail = email
        resetToken = ''

        if (res.dev_reset_token) {
          showToast({
            title: 'Código de Teste (Local)',
            message: `Seu código de validação é: ${res.dev_reset_token}`,
            type: 'info',
            duration: 12000,
          })
        } else {
          showToast({
            title: 'Código Enviado',
            message: 'Enviamos o código de 6 dígitos para seu e-mail.',
            type: 'success',
          })
        }

        currentMode = 'reset'
        renderForm()
      } catch (err) {
        showToast({ title: 'Erro na Solicitação', message: err.message, type: 'error' })
        btn.disabled = false
        btn.querySelector('span').textContent = 'Enviar Instruções de Recuperação'
      }
    })

    // 3. Submit de Redefinição com Token (Reset)
    document.getElementById('candidate-reset-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const token = document.getElementById('reset-token-input').value.trim()
      const pass = document.getElementById('reset-new-pass').value
      const pass2 = document.getElementById('reset-pass-confirm').value

      if (pass !== pass2) {
        showToast({ title: 'Senhas Diferentes', message: 'A confirmação de senha não coincide.', type: 'error' })
        return
      }

      if (pass.length < 8) {
        showToast({ title: 'Senha Curta', message: 'A nova senha deve ter no mínimo 8 caracteres.', type: 'error' })
        return
      }

      const btn = document.getElementById('reset-submit-btn')
      btn.disabled = true
      btn.querySelector('span').textContent = 'Redefinindo senha...'

      try {
        const res = await candidateResetPassword(token, pass)
        if (res.token && res.candidate) {
          setCandidateAuth(res.token, res.candidate)
          showToast({
            title: 'Senha Redefinida com Sucesso',
            message: `Olá, ${res.candidate.first_name}! Você já está conectado.`,
            type: 'success',
          })
          renderPortalDashboard(appEl, res.candidate, departments)
        } else {
          showToast({ title: 'Sucesso', message: res.message || 'Senha redefinida com sucesso!', type: 'success' })
          currentMode = 'login'
          renderForm()
        }
      } catch (err) {
        showToast({ title: 'Erro ao Redefinir', message: err.message, type: 'error' })
        btn.disabled = false
        btn.querySelector('span').textContent = 'Salvar Nova Senha & Acessar'
      }
    })

    // 4. Submit de Primeiro Acesso (First Access)
    document.getElementById('candidate-first-access-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('first-email').value.trim()
      const pass = document.getElementById('first-pass').value
      const pass2 = document.getElementById('first-pass-confirm').value

      if (pass !== pass2) {
        showToast({ title: 'Senhas Diferentes', message: 'A confirmação de senha não coincide.', type: 'error' })
        return
      }

      if (pass.length < 8) {
        showToast({ title: 'Senha Curta', message: 'A nova senha deve ter no mínimo 8 caracteres.', type: 'error' })
        return
      }

      const btn = document.getElementById('first-submit-btn')
      btn.disabled = true
      btn.querySelector('span').textContent = 'Salvando...'

      try {
        const res = await candidateSetPassword(email, pass)
        setCandidateAuth(res.token, res.candidate)
        showToast({ title: 'Senha Cadastrada', message: res.message || 'Senha criada com sucesso!', type: 'success' })
        renderPortalDashboard(appEl, res.candidate, departments)
      } catch (err) {
        showToast({ title: 'Erro ao Cadastrar Senha', message: err.message, type: 'error' })
        btn.disabled = false
        btn.querySelector('span').textContent = 'Salvar Senha & Acessar'
      }
    })
  }

  renderForm()
}

// ─── DASHBOARD DO CANDIDATO ──────────────────────────────────
function renderPortalDashboard(appEl, cand, departments, jobsList = []) {
  let activeTab = 'candidaturas' // 'candidaturas' ou 'perfil'

  function renderView() {
    const apps = cand.applications || []
    const edus = cand.educations || []
    const exps = cand.experiences || []

    appEl.innerHTML = `
      <div style="background: var(--ael-surface); min-height: 100vh; padding-top: calc(var(--ael-header-h) + 2rem); padding-bottom: 5rem;">
        <div class="container" style="max-width: 860px; margin-inline: auto;">

          <!-- TOP PROFILE CARD -->
          <div class="data-card" style="padding: 1.75rem 2rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 1.25rem;">
                <div style="position: relative; width: 56px; height: 56px; flex-shrink: 0;">
                  ${
                    cand.photo_url
                      ? `<img src="${cand.photo_url}" alt="${escAttr(cand.full_name)}" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2.5px solid var(--ael-green-base); box-shadow: 0 4px 12px rgba(0,0,0,0.08);" id="portal-avatar-img" />`
                      : `<div style="width: 56px; height: 56px; border-radius: 50%; background: var(--ael-green-base); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.375rem; font-weight: 800; border: 2.5px solid var(--ael-green-base);" id="portal-avatar-initials">
                          ${(cand.first_name || 'C').charAt(0).toUpperCase()}
                        </div>`
                  }
                  <label for="portal-avatar-input" style="position: absolute; bottom: -4px; right: -4px; width: 24px; height: 24px; border-radius: 50%; background: #ffffff; border: 1.5px solid var(--ael-line); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.15);" title="Alterar foto de perfil">
                    <span style="font-size: 11px;">📷</span>
                  </label>
                  <input type="file" id="portal-avatar-input" accept="image/png, image/jpeg, image/webp" style="display: none;" />
                </div>
                <div>
                  <h1 style="font-size: 1.375rem; font-weight: 800; color: var(--ael-ink); margin: 0;">
                    ${escHtml(cand.full_name)}
                  </h1>
                  <div style="font-size: 0.8125rem; color: var(--ael-muted); margin-top: 0.15rem;">
                    ${escHtml(cand.email)} · ${escHtml(cand.phone)} · ${escHtml([cand.city, cand.state].filter(Boolean).join(' - '))}
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem; align-items: center;">
                <a href="#/" class="btn btn-sm btn-outline">
                  <span>Ver Mural Geral</span>
                </a>
                <button type="button" class="btn btn-sm btn-dark" id="cand-logout-btn">
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TABS DE NAVEGAÇÃO -->
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
            <button class="btn btn-sm ${activeTab === 'candidaturas' ? 'btn-primary' : 'btn-outline'}" id="tab-btn-apps" style="font-weight: 700;">
              Minhas Candidaturas (${apps.length})
            </button>
            <button class="btn btn-sm ${activeTab === 'perfil' ? 'btn-primary' : 'btn-outline'}" id="tab-btn-profile" style="font-weight: 700;">
              Editar Meu Perfil Estruturado
            </button>
          </div>

          <!-- CONTEÚDO DA ABA: MINHAS CANDIDATURAS -->
          ${
            activeTab === 'candidaturas'
              ? `
            <div class="data-card" style="margin-bottom: 1.5rem;">
              <div class="data-card-header">
                <div class="data-card-title">Processos Seletivos em Andamento</div>
                <span style="font-size: 0.8125rem; color: var(--ael-muted);">Status atualizado em tempo real pelo RH</span>
              </div>

              ${
                apps.length
                  ? `
                <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
                  ${apps
                    .map((a) => {
                      const st = getCandidateAppStatus(a)
                      return `
                    <div style="
                      background: #ffffff;
                      border: 1.5px solid var(--ael-line);
                      border-radius: var(--ael-radius-lg);
                      padding: 1.5rem;
                      display: flex;
                      flex-direction: column;
                      gap: 1rem;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                    ">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                        <div>
                          <div style="font-size: 1.125rem; font-weight: 800; color: var(--ael-ink);">
                            ${escHtml(a.job_title)}
                          </div>
                          <div style="font-size: 0.8125rem; color: var(--ael-muted); margin-top: 0.25rem;">
                            ${escHtml(a.department_name || 'Geral')} · ${escHtml([a.job_city, a.job_state].filter(Boolean).join(' - ') || 'Parauapebas - PA')} · Inscrito em ${formatDate(a.applied_at)}
                          </div>
                        </div>

                        <div>
                          <span class="status-pill ${st.color}" style="font-size: 0.8125rem; padding: 0.4rem 0.875rem; font-weight: 700;">
                            ${escHtml(st.label)}
                          </span>
                        </div>
                      </div>

                      <!-- PIPELINE PROGRESS TRACKER (4 ETAPAS) -->
                      <div style="
                        background: rgba(0,0,0,0.02);
                        border: 1px solid var(--ael-line);
                        border-radius: var(--ael-radius-md);
                        padding: 0.875rem 1rem;
                        margin-top: 0.25rem;
                      ">
                        <div style="font-size: 0.75rem; font-weight: 700; color: var(--ael-muted); text-transform: uppercase; margin-bottom: 0.65rem; letter-spacing: 0.05em;">
                          Progresso no Processo Seletivo (A&L RH):
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
                          ${[
                            { step: 1, title: '1. Inscrição' },
                            { step: 2, title: '2. Triagem' },
                            { step: 3, title: '3. Entrevista' },
                            { step: 4, title: '4. Decisão' },
                          ]
                            .map((p) => {
                              const isPast = st.step > p.step
                              const isCurrent = st.step === p.step
                              const isDeclined = st.isDeclined && isCurrent

                              let bg = 'rgba(0,0,0,0.06)'
                              let color = 'var(--ael-muted)'
                              let border = 'none'

                              if (isDeclined) {
                                bg = '#fee2e2'
                                color = '#b91c1c'
                                border = '1px solid #f87171'
                              } else if (isCurrent) {
                                bg = 'var(--ael-green-base)'
                                color = '#ffffff'
                                border = '1px solid var(--ael-green-dark)'
                              } else if (isPast) {
                                bg = 'rgba(0, 91, 58, 0.12)'
                                color = 'var(--ael-green-dark)'
                              }

                              return `
                              <div style="
                                background: ${bg};
                                color: ${color};
                                border: ${border};
                                padding: 0.4rem 0.25rem;
                                border-radius: var(--ael-radius-sm);
                                text-align: center;
                                font-size: 0.6875rem;
                                font-weight: 700;
                                transition: all 0.2s;
                              ">
                                ${isPast ? '✓ ' : ''}${p.title}
                              </div>
                            `
                            })
                            .join('')}
                        </div>
                      </div>
                    </div>
                  `
                    })
                    .join('')}
                </div>
              `
                  : `
                <div style="text-align: center; padding: 2.5rem 1.5rem; color: var(--ael-muted);">
                  <p style="margin-bottom: 0.75rem; font-weight: 600; color: var(--ael-ink);">Você ainda não se inscreveu em nenhuma vaga específica.</p>
                  <p style="font-size: 0.875rem; color: var(--ael-text); margin-bottom: 0;">Seu perfil está <strong>ativo no Banco de Talentos oficial da A&L</strong> e disponível para seleção pelo RH.</p>
                </div>
              `
              }
            </div>


            <!-- SEÇÃO DE VAGAS ABERTAS COM 1-CLIQUE -->
            <div class="data-card">
              <div class="data-card-header">
                <div class="data-card-title">⚡ Oportunidades Abertas (Candidatura em 1 Clique)</div>
                <span style="font-size: 0.8125rem; color: var(--ael-muted);">Candidate-se instantaneamente com seu perfil ativo</span>
              </div>

              <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                ${
                  jobsList && jobsList.length
                    ? jobsList
                        .map((j) => {
                          const jobId = j.joborder_id || j.id
                          const isApplied = apps.some(
                            (a) => String(a.joborder_id) === String(jobId) || String(a.job_id) === String(jobId)
                          )
                          return `
                      <div style="
                        background: #ffffff;
                        border: 1.5px solid var(--ael-line);
                        border-radius: var(--ael-radius-lg);
                        padding: 1.25rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 1rem;
                        flex-wrap: wrap;
                      ">
                        <div>
                          <div style="font-size: 1.0625rem; font-weight: 800; color: var(--ael-ink);">
                            ${escHtml(j.title)}
                          </div>
                          <div style="font-size: 0.8125rem; color: var(--ael-muted); margin-top: 0.25rem;">
                            ${escHtml(j.department || j.departmentName || 'Geral')} · ${escHtml([j.city, j.state].filter(Boolean).join(' - ') || 'Parauapebas - PA')} · ${escHtml(j.type || 'CLT')}
                          </div>
                        </div>

                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                          <a href="#/jobs/${jobId}" class="btn btn-sm btn-outline">
                            Ver Detalhes
                          </a>
                          ${
                            isApplied
                              ? `
                            <span class="status-pill green" style="padding: 0.4rem 0.875rem; font-weight: 700;">
                              ✓ Já Inscrito
                            </span>
                          `
                              : `
                            <button type="button" class="btn btn-sm btn-primary portal-quick-apply-btn" data-job-id="${jobId}" data-job-title="${escAttr(j.title)}" data-job-dept="${escAttr(j.department || j.departmentName || '')}">
                              <span>⚡ Candidatar-se</span>
                            </button>
                          `
                          }
                        </div>
                      </div>
                    `
                        })
                        .join('')
                    : `
                  <p style="color: var(--ael-muted); text-align: center; margin: 0; padding: 1.5rem 0;">Nenhuma outra vaga aberta no momento.</p>
                `
                }
              </div>
            </div>
          `
              : ''
          }

          <!-- CONTEÚDO DA ABA: MEU PERFIL -->
          ${
            activeTab === 'perfil'
              ? `
            <div class="data-card" style="padding: 2rem;">
              <form id="cand-edit-profile-form">
                <div class="data-card-title" style="margin-bottom: 1.5rem;">Atualizar Informações do Perfil</div>

                <!-- FOTO DE PERFIL CARD -->
                <div style="display: flex; align-items: center; gap: 1.5rem; padding: 1.25rem; background: rgba(0, 91, 58, 0.04); border-radius: var(--ael-radius-lg); border: 1px solid var(--ael-line); margin-bottom: 1.75rem;">
                  <div style="width: 76px; height: 76px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 2.5px solid var(--ael-green-base); background: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                    ${
                      cand.photo_url
                        ? `<img src="${cand.photo_url}" alt="Foto de Perfil" id="edit-photo-preview" style="width: 100%; height: 100%; object-fit: cover;" />`
                        : `<span id="edit-photo-preview-placeholder" style="font-size: 2rem; color: var(--ael-muted);">👤</span>`
                    }
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 0.9375rem; color: var(--ael-ink); margin-bottom: 0.25rem;">Foto de Perfil</div>
                    <div style="font-size: 0.8125rem; color: var(--ael-muted); margin-bottom: 0.75rem;">Adicione uma foto profissional para seu cadastro no Banco de Talentos (JPG, PNG ou WEBP até 5MB).</div>
                    <label for="edit-photo-file" class="btn btn-sm btn-outline" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
                      <span>📷 Alterar Foto</span>
                    </label>
                    <input type="file" id="edit-photo-file" accept="image/png, image/jpeg, image/webp" style="display: none;" />
                  </div>
                </div>

                <!-- DADOS BÁSICOS -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Nome *</label>
                    <input type="text" id="prof-first-name" class="form-control" value="${escAttr(cand.first_name)}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Sobrenome *</label>
                    <input type="text" id="prof-last-name" class="form-control" value="${escAttr(cand.last_name)}" required />
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">WhatsApp / Celular com DDD *</label>
                    <input type="tel" id="prof-phone" class="form-control" value="${escAttr(cand.phone)}" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Cidade / UF *</label>
                    <input type="text" id="prof-city" class="form-control" value="${escAttr(cand.city)}" required />
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Área de Interesse *</label>
                    <select id="prof-area" class="form-control" required>
                      ${departments.map((d) => `<option value="${escAttr(d.name)}" ${cand.interest_area === d.name ? 'selected' : ''}>${escHtml(d.name)}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Cargo Desejado</label>
                    <input type="text" id="prof-desired-role" class="form-control" value="${escAttr(cand.desired_role)}" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Resumo Profissional (Apresentação / Mini-Bio)</label>
                  <textarea id="prof-notes" class="form-control" rows="3" style="resize: vertical;">${escHtml(cand.notes)}</textarea>
                </div>

                <!-- FORMAÇÕES -->
                <div style="margin-top: 2rem; border-top: 1px solid var(--ael-line); padding-top: 1.5rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <strong style="color: var(--ael-ink); font-size: 1rem;">Formações Acadêmicas (${edus.length})</strong>
                    <button type="button" class="btn btn-sm btn-outline" id="prof-add-edu-btn" style="gap: 0.35rem; font-weight: 600;">
                      <span>+ Adicionar Formação</span>
                    </button>
                  </div>

                  <div id="prof-edus-list" style="display: flex; flex-direction: column; gap: 1.25rem;">
                    ${edus
                      .map(
                        (e, idx) => `
                      <div class="prof-edu-item" data-idx="${idx}" style="
                        background: var(--ael-surface);
                        padding: 1.25rem;
                        border-radius: var(--ael-radius-md);
                        border: 1px solid var(--ael-line);
                      ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                          <span style="font-weight: 700; font-size: 0.8125rem; color: var(--ael-green-base);">
                            Formação #${idx + 1}
                          </span>
                          ${
                            edus.length > 1
                              ? `<button type="button" class="btn-icon danger prof-del-edu" data-idx="${idx}" title="Remover formação" style="width: 26px; height: 26px;">✕</button>`
                              : ''
                          }
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                          <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Nível de Escolaridade</label>
                            <select class="form-control p-edu-level">
                              <option value="Superior Completo" ${e.level === 'Superior Completo' ? 'selected' : ''}>Superior Completo</option>
                              <option value="Superior Cursando" ${e.level === 'Superior Cursando' ? 'selected' : ''}>Superior Cursando</option>
                              <option value="Pós-Graduação / Especialização" ${e.level === 'Pós-Graduação / Especialização' ? 'selected' : ''}>Pós-Graduação / Especialização</option>
                              <option value="Mestrado / Doutorado" ${e.level === 'Mestrado / Doutorado' ? 'selected' : ''}>Mestrado / Doutorado</option>
                              <option value="Técnico Completo" ${e.level === 'Técnico Completo' ? 'selected' : ''}>Técnico Completo</option>
                              <option value="Técnico Cursando" ${e.level === 'Técnico Cursando' ? 'selected' : ''}>Técnico Cursando</option>
                              <option value="Ensino Médio Completo" ${e.level === 'Ensino Médio Completo' ? 'selected' : ''}>Ensino Médio Completo</option>
                              <option value="Ensino Fundamental" ${e.level === 'Ensino Fundamental' ? 'selected' : ''}>Ensino Fundamental</option>
                            </select>
                          </div>
                          <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Curso / Área de Estudo</label>
                            <input type="text" class="form-control p-edu-course" placeholder="Ex: Contabilidade, Engenharia..." value="${escAttr(e.course)}" />
                          </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 0.75rem; margin-top: 0.75rem;">
                          <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Instituição de Ensino</label>
                            <input type="text" class="form-control p-edu-inst" placeholder="Ex: Uniasselvi, UFPA, PUC..." value="${escAttr(e.institution)}" />
                          </div>
                          <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Conclusão / Previsão 📅</label>
                            <input type="month" class="form-control p-edu-year" value="${escAttr(normalizeMonthForInput(e.year))}" />
                          </div>
                        </div>
                      </div>
                    `
                      )
                      .join('')}
                  </div>
                </div>

                <!-- EXPERIÊNCIAS -->
                <div style="margin-top: 2rem; border-top: 1px solid var(--ael-line); padding-top: 1.5rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <strong style="color: var(--ael-ink); font-size: 1rem;">Experiências Profissionais (${exps.length})</strong>
                    <button type="button" class="btn btn-sm btn-outline" id="prof-add-exp-btn" style="gap: 0.35rem; font-weight: 600;">
                      <span>+ Adicionar Experiência</span>
                    </button>
                  </div>

                  <div id="prof-exps-list" style="display: flex; flex-direction: column; gap: 1.25rem;">
                    ${exps
                      .map((exp, idx) => {
                        const expDates = parsePeriodForInputs(exp.period, exp)
                        return `
                      <div class="prof-exp-item" data-idx="${idx}" style="
                        background: var(--ael-surface);
                        padding: 1.25rem;
                        border-radius: var(--ael-radius-md);
                        border: 1px solid var(--ael-line);
                      ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                          <span style="font-weight: 700; font-size: 0.8125rem; color: var(--ael-green-base);">
                            Experiência #${idx + 1}
                          </span>
                          ${
                            exps.length > 1
                              ? `<button type="button" class="btn-icon danger prof-del-exp" data-idx="${idx}" title="Remover experiência" style="width: 26px; height: 26px;">✕</button>`
                              : ''
                          }
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                          <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Cargo Ocupado</label>
                            <input type="text" class="form-control p-exp-role" placeholder="Ex: Assistente Adm, Engenheiro..." value="${escAttr(exp.role)}" />
                          </div>
                          <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Empresa / Contratante</label>
                            <input type="text" class="form-control p-exp-comp" placeholder="Ex: Delícia de Minas, A&L..." value="${escAttr(exp.company)}" />
                          </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem;">
                          <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Mês/Ano de Início 📅</label>
                            <input type="month" class="form-control p-exp-start" value="${escAttr(expDates.start_date)}" />
                          </div>
                          <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 0.75rem; margin-bottom: 0.25rem;">Mês/Ano de Saída 📅</label>
                            <input
                              type="month"
                              class="form-control p-exp-end"
                              value="${escAttr(expDates.end_date)}"
                              ${expDates.is_current ? 'disabled style="opacity:0.5;background:var(--ael-line);"' : ''}
                            />
                          </div>
                        </div>

                        <div style="margin-top: 0.65rem; display: flex; align-items: center; gap: 0.5rem;">
                          <input
                            type="checkbox"
                            class="p-exp-current-cb"
                            id="prof-exp-curr-${idx}"
                            ${expDates.is_current ? 'checked' : ''}
                            style="width: 16px; height: 16px; accent-color: var(--ael-green-base); cursor: pointer;"
                          />
                          <label for="prof-exp-curr-${idx}" style="font-size: 0.8125rem; color: var(--ael-ink); font-weight: 600; cursor: pointer;">
                            Trabalho atualmente nesta empresa (Emprego Atual)
                          </label>
                        </div>
                      </div>
                    `
                      })
                      .join('')}
                  </div>
                </div>

                <div style="margin-top: 2rem; border-top: 1px solid var(--ael-line); padding-top: 1.5rem; display: flex; justify-content: flex-end;">
                  <button type="submit" class="btn btn-primary btn-lg" id="save-profile-btn">
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            </div>
          `
              : ''
          }

        </div>
      </div>
    `
    bindDashboardEvents()
  }

  function saveCurrentProfileForm() {
    cand.first_name = document.getElementById('prof-first-name')?.value.trim() ?? cand.first_name
    cand.last_name = document.getElementById('prof-last-name')?.value.trim() ?? cand.last_name
    cand.phone = document.getElementById('prof-phone')?.value.trim() ?? cand.phone
    cand.city = document.getElementById('prof-city')?.value.trim() ?? cand.city
    cand.interest_area = document.getElementById('prof-area')?.value ?? cand.interest_area
    cand.desired_role = document.getElementById('prof-desired-role')?.value.trim() ?? cand.desired_role
    cand.notes = document.getElementById('prof-notes')?.value.trim() ?? cand.notes

    const eduItems = document.querySelectorAll('.prof-edu-item')
    if (eduItems.length) {
      cand.educations = Array.from(eduItems).map((item) => {
        const rawYear = item.querySelector('.p-edu-year')?.value || ''
        const yearFmt = formatMonthForDisplay(rawYear) || rawYear
        return {
          level: item.querySelector('.p-edu-level')?.value || 'Superior Completo',
          course: item.querySelector('.p-edu-course')?.value || '',
          institution: item.querySelector('.p-edu-inst')?.value || '',
          year: yearFmt,
          status: 'Concluído',
        }
      })
    }

    const expItems = document.querySelectorAll('.prof-exp-item')
    if (expItems.length) {
      cand.experiences = Array.from(expItems).map((item) => {
        const role = item.querySelector('.p-exp-role')?.value || ''
        const company = item.querySelector('.p-exp-comp')?.value || ''
        const startDate = item.querySelector('.p-exp-start')?.value || ''
        const endDate = item.querySelector('.p-exp-end')?.value || ''
        const isCurrent = item.querySelector('.p-exp-current-cb')?.checked || false
        const period = buildPeriodFromInputs(startDate, endDate, isCurrent)
        return {
          role,
          company,
          start_date: startDate,
          end_date: endDate,
          is_current: isCurrent,
          period,
          activities: '',
        }
      })
    }
  }

  function bindDashboardEvents() {
    // Sair
    document.getElementById('cand-logout-btn')?.addEventListener('click', () => {
      clearCandidateAuth()
      showToast({ title: 'Sessão Encerrada', message: 'Você saiu do portal do candidato.', type: 'info' })
      renderAuthScreen(appEl, departments)
    })

    // Tabs
    document.getElementById('tab-btn-apps')?.addEventListener('click', () => {
      saveCurrentProfileForm()
      activeTab = 'candidaturas'
      renderView()
    })

    document.getElementById('tab-btn-profile')?.addEventListener('click', () => {
      activeTab = 'perfil'
      renderView()
    })

    // Adicionar formação
    document.getElementById('prof-add-edu-btn')?.addEventListener('click', () => {
      saveCurrentProfileForm()
      cand.educations = cand.educations || []
      cand.educations.push({
        level: 'Superior Completo',
        course: '',
        institution: '',
        year: '',
        status: 'Concluído',
      })
      renderView()
    })

    document.querySelectorAll('.prof-del-edu').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveCurrentProfileForm()
        const idx = parseInt(btn.dataset.idx)
        cand.educations.splice(idx, 1)
        renderView()
      })
    })

    // Adicionar experiência
    document.getElementById('prof-add-exp-btn')?.addEventListener('click', () => {
      saveCurrentProfileForm()
      cand.experiences = cand.experiences || []
      cand.experiences.push({
        role: '',
        company: '',
        start_date: '',
        end_date: '',
        is_current: false,
        period: '',
        activities: '',
      })
      renderView()
    })

    document.querySelectorAll('.prof-del-exp').forEach((btn) => {
      btn.addEventListener('click', () => {
        saveCurrentProfileForm()
        const idx = parseInt(btn.dataset.idx)
        cand.experiences.splice(idx, 1)
        renderView()
      })
    })

    // Toggle de checkbox "Emprego Atual"
    document.querySelectorAll('.p-exp-current-cb').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const card = e.target.closest('.prof-exp-item')
        const endInput = card?.querySelector('.p-exp-end')
        if (endInput) {
          endInput.disabled = e.target.checked
          if (e.target.checked) {
            endInput.value = ''
            endInput.style.opacity = '0.5'
            endInput.style.background = 'var(--ael-line)'
          } else {
            endInput.style.opacity = '1'
            endInput.style.background = ''
          }
        }
      })
    })

    // Salvar Perfil
    document.getElementById('cand-edit-profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const btn = document.getElementById('save-profile-btn')
      btn.disabled = true
      btn.querySelector('span').textContent = 'Salvando...'

      saveCurrentProfileForm()

      const payload = new FormData()
      payload.append('first_name', document.getElementById('prof-first-name').value.trim())
      payload.append('last_name', document.getElementById('prof-last-name').value.trim())
      payload.append('email', cand.email)
      payload.append('phone', document.getElementById('prof-phone').value.trim())
      payload.append('city', document.getElementById('prof-city').value.trim())
      payload.append('state', cand.state || 'PA')
      payload.append('interest_area', document.getElementById('prof-area').value)
      payload.append('desired_role', document.getElementById('prof-desired-role').value.trim())
      payload.append('notes', document.getElementById('prof-notes').value.trim())
      payload.append('educations', JSON.stringify(cand.educations || []))
      payload.append('experiences', JSON.stringify(cand.experiences || []))
      payload.append('key_skills', (cand.key_skills || []).join(', '))
      payload.append('consent_lgpd', 'true')

      try {
        await registerTalentPool(payload)
        showToast({
          title: 'Perfil Atualizado',
          message: 'Suas informações foram salvas com sucesso!',
          type: 'success',
        })
        const ref = await candidateGetMe()
        if (ref?.success && ref.candidate) cand = ref.candidate
        activeTab = 'candidaturas'
        renderView()
      } catch (err) {
        showToast({ title: 'Erro ao Salvar', message: err.message, type: 'error' })
        btn.disabled = false
        btn.querySelector('span').textContent = 'Salvar Alterações'
      }
    })

    // Handler de Candidatura em 1 Clique direto do painel
    document.querySelectorAll('.portal-quick-apply-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const targetBtn = e.currentTarget
        const jobId = targetBtn.dataset.jobId
        const jobTitle = targetBtn.dataset.jobTitle
        const jobDept = targetBtn.dataset.jobDept

        targetBtn.disabled = true
        targetBtn.innerHTML = '<span>Enviando...</span>'

        try {
          const payload = new FormData()
          payload.append('first_name', cand.first_name || '')
          payload.append('last_name', cand.last_name || '')
          payload.append('email', cand.email)
          payload.append('phone', cand.phone || '')
          payload.append('city', cand.city || '')
          payload.append('state', cand.state || 'PA')
          payload.append('interest_area', jobDept || cand.interest_area || 'Geral')
          payload.append('desired_role', jobTitle || cand.desired_role || '')
          payload.append('job_id', jobId)
          payload.append('educations', JSON.stringify(cand.educations || []))
          payload.append('experiences', JSON.stringify(cand.experiences || []))
          payload.append('key_skills', (cand.key_skills || []).join(', '))
          payload.append('notes', cand.notes || '')
          payload.append('consent_lgpd', 'true')

          await registerTalentPool(payload)
          showToast({
            title: 'Candidatura Confirmada!',
            message: `Sua candidatura para a vaga "${jobTitle}" foi realizada com sucesso!`,
            type: 'success',
          })

          const ref = await candidateGetMe()
          if (ref?.success && ref.candidate) cand = ref.candidate
          renderView()
        } catch (err) {
          showToast({ title: 'Erro ao candidatar-se', message: err.message, type: 'error' })
          targetBtn.disabled = false
          targetBtn.innerHTML = '<span>⚡ Candidatar-se</span>'
        }
      })
    })

    // Handler de Upload de Foto de Perfil
    const onPhotoChange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast({
          title: 'Formato Inválido',
          message: 'Por favor, selecione uma imagem em formato JPG, PNG ou WEBP.',
          type: 'error',
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast({
          title: 'Arquivo Muito Grande',
          message: 'A foto de perfil deve ter no máximo 5MB.',
          type: 'error',
        })
        return
      }

      try {
        showToast({ title: 'Enviando Foto...', message: 'Fazendo upload da imagem de perfil.', type: 'info' })
        const res = await uploadCandidatePhoto(file)
        cand.photo_url = res.photo_url
        showToast({
          title: 'Foto Atualizada!',
          message: 'Sua foto de perfil foi salva com sucesso no Banco de Talentos!',
          type: 'success',
        })
        const ref = await candidateGetMe()
        if (ref?.success && ref.candidate) cand = ref.candidate
        renderView()
      } catch (err) {
        showToast({ title: 'Erro no Upload', message: err.message, type: 'error' })
      }
    }

    document.getElementById('portal-avatar-input')?.addEventListener('change', onPhotoChange)
    document.getElementById('edit-photo-file')?.addEventListener('change', onPhotoChange)
  }

  renderView()
}

function getCandidateAppStatus(app) {
  const code = parseInt(app?.status_code ?? app?.status ?? 100)
  switch (code) {
    case 100:
      return { label: '📥 Recebido / Em Análise', color: 'blue', step: 1, isDeclined: false }
    case 200:
      return { label: '📞 Contactado pelo RH', color: 'teal', step: 2, isDeclined: false }
    case 250:
      return { label: '💬 Resposta Registrada', color: 'purple', step: 2, isDeclined: false }
    case 300:
      return { label: '🔍 Em Triagem Técnica', color: 'amber', step: 2, isDeclined: false }
    case 400:
      return { label: '📤 Encaminhado à Gestão', color: 'indigo', step: 3, isDeclined: false }
    case 500:
      return { label: '🗣️ Entrevista Agendada', color: 'orange', step: 3, isDeclined: false }
    case 600:
      return { label: '🏆 Aprovado / Proposta', color: 'green', step: 4, isDeclined: false }
    case 650:
      return { label: '📂 Banco de Talentos (Futuro)', color: 'slate', step: 4, isDeclined: false }
    case 700:
      return { label: '❌ Não Selecionado nesta Vaga', color: 'gray', step: 4, isDeclined: true }
    case 800:
      return { label: '🎉 Contratado(a)', color: 'green', step: 4, isDeclined: false }
    default:
      return { label: app?.status_label || '📥 Em Análise', color: 'blue', step: 1, isDeclined: false }
  }
}

function normalizeMonthForInput(str) {
  if (!str) return ''
  const s = String(str).trim()
  // Pattern MM/YYYY (e.g. 12/2025)
  const mmyyyy = s.match(/^(\d{1,2})\/(\d{4})$/)
  if (mmyyyy) {
    const mm = mmyyyy[1].padStart(2, '0')
    const yyyy = mmyyyy[2]
    return `${yyyy}-${mm}`
  }
  // Pattern YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return s
  // Pattern YYYY (e.g. 2025)
  if (/^\d{4}$/.test(s)) return `${s}-12`
  return ''
}

function formatMonthForDisplay(str) {
  if (!str) return ''
  const s = String(str).trim()
  // Pattern YYYY-MM
  const yyyymm = s.match(/^(\d{4})-(\d{2})$/)
  if (yyyymm) {
    return `${yyyymm[2]}/${yyyymm[1]}`
  }
  return s
}

function parsePeriodForInputs(periodStr, expObj = {}) {
  if (expObj.start_date || expObj.end_date || expObj.is_current !== undefined) {
    return {
      start_date: normalizeMonthForInput(expObj.start_date),
      end_date: normalizeMonthForInput(expObj.end_date),
      is_current: Boolean(expObj.is_current || !expObj.end_date),
    }
  }

  const p = String(periodStr || '').trim()
  const isCurrent = /momento|atual|presente|hoje/i.test(p)

  // Extrai meses/anos do texto
  const months = p.match(/\b\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}\b|\b\d{4}\b/g) || []
  const start_date = months[0] ? normalizeMonthForInput(months[0]) : ''
  const end_date = !isCurrent && months[1] ? normalizeMonthForInput(months[1]) : ''

  return {
    start_date,
    end_date,
    is_current: isCurrent || (!end_date && Boolean(start_date)),
  }
}

function buildPeriodFromInputs(startMonth, endMonth, isCurrent) {
  const startFmt = formatMonthForDisplay(startMonth)
  const endFmt = formatMonthForDisplay(endMonth)

  if (!startFmt && !endFmt) return ''
  if (isCurrent || !endFmt) {
    return startFmt ? `${startFmt} até o momento` : 'Até o momento'
  }
  return `${startFmt} a ${endFmt}`
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escAttr(s) {
  return escHtml(s)
}
function formatDate(str) {
  try {
    return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

function renderCandidatePortalSkeleton() {
  return `
    <div style="background: var(--ael-surface); min-height: 100vh; padding-top: calc(var(--ael-header-h) + 2rem); padding-bottom: 5rem;" aria-hidden="true">
      <div class="container">
        <!-- Header Banner Skeleton -->
        <div class="data-card" style="padding: 2rem; margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1.25rem;">
              <div class="skeleton" style="width: 64px; height: 64px; border-radius: var(--ael-radius-md);"></div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div class="skeleton" style="width: 200px; height: 24px;"></div>
                <div class="skeleton" style="width: 150px; height: 16px;"></div>
              </div>
            </div>
            <div class="skeleton" style="width: 100px; height: 36px; border-radius: 6px;"></div>
          </div>
        </div>

        <!-- Content Card Skeleton -->
        <div class="data-card" style="padding: 2rem;">
          <div style="display: flex; gap: 1rem; border-bottom: 1.5px solid var(--ael-line); padding-bottom: 1rem; margin-bottom: 2rem;">
            <div class="skeleton" style="width: 140px; height: 32px; border-radius: 4px;"></div>
            <div class="skeleton" style="width: 140px; height: 32px; border-radius: 4px;"></div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${[1, 2]
              .map(
                () => `
              <div style="padding: 1.5rem; border: 1.5px solid var(--ael-line); border-radius: var(--ael-radius-lg); display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="display: flex; justify-content: space-between;">
                  <div class="skeleton" style="width: 45%; height: 20px;"></div>
                  <div class="skeleton skeleton-pill"></div>
                </div>
                <div class="skeleton" style="width: 30%; height: 14px;"></div>
                <div class="skeleton" style="width: 25%; height: 14px;"></div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    </div>
  `
}
