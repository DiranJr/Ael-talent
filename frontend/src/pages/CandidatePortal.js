/**
 * A&L Talent — Portal do Candidato com Autenticação Segura (E-mail + Senha)
 * Rota: #/candidato ou #/meu-perfil
 */

import {
  candidateGetMe,
  candidateLogin,
  candidateSetPassword,
  clearCandidateAuth,
  getCandidateToken,
  getFilters,
  registerTalentPool,
  setCandidateAuth,
} from '../api.js'
import { showToast } from '../components/Toast.js'
import { navigate } from '../router.js'

export async function renderCandidatePortal(params, appEl) {
  const token = getCandidateToken()
  let candidateData = null
  let departments = []

  if (token) {
    appEl.innerHTML = renderCandidatePortalSkeleton()
  }

  try {
    const filtersRes = await getFilters()
    departments = (filtersRes.departments || []).filter((d) => d.value)

    if (token) {
      const res = await candidateGetMe()
      if (res?.success && res.candidate) {
        candidateData = res.candidate
      } else {
        clearCandidateAuth()
      }
    }
  } catch (err) {
    clearCandidateAuth()
  }

  if (!candidateData) {
    renderLoginScreen(appEl, departments)
  } else {
    renderPortalDashboard(appEl, candidateData, departments)
  }
}

// ─── TELA DE LOGIN COM E-MAIL E SENHA ────────────────────────
function renderLoginScreen(appEl, departments) {
  let isFirstAccessMode = false
  let pendingEmail = ''

  function renderForm() {
    appEl.innerHTML = `
      <div style="background: var(--ael-surface); min-height: 100vh; padding-top: calc(var(--ael-header-h) + 2.5rem); padding-bottom: 5rem; display: flex; align-items: center;">
        <div class="container" style="max-width: 480px; margin-inline: auto;">
          <div class="data-card" style="padding: 2.5rem 2rem;">
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
                ${isFirstAccessMode ? 'Cadastre sua senha segura de acesso.' : 'Acesse seu perfil com e-mail e senha cadastrados.'}
              </p>
            </div>

            ${
              !isFirstAccessMode
                ? `
              <!-- FORMULÁRIO DE LOGIN NORMAL -->
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
                    <button type="button" id="cand-forgot-pwd-btn" style="background: none; border: none; font-size: 0.75rem; color: var(--ael-green-base); font-weight: 600; cursor: pointer;">
                      Criar / Redefinir Senha
                    </button>
                  </div>
                  <input
                    id="cand-login-password"
                    type="password"
                    class="form-control"
                    placeholder="Sua senha secreta"
                    required
                  />
                </div>

                <button type="submit" class="btn btn-primary btn-full btn-lg" id="cand-login-btn">
                  <span>Entrar no Meu Painel</span>
                </button>
              </form>
            `
                : `
              <!-- FORMULÁRIO DE PRIMEIRO ACESSO / DEFINIR SENHA -->
              <form id="candidate-setpwd-form">
                <div class="form-group">
                  <label class="form-label" for="setpwd-email">Confirme seu E-mail *</label>
                  <input id="setpwd-email" type="email" class="form-control" value="${escAttr(pendingEmail)}" required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="setpwd-pass">Nova Senha (mínimo 8 caracteres) *</label>
                  <input id="setpwd-pass" type="password" class="form-control" placeholder="Crie sua nova senha segura" minlength="8" required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="setpwd-pass-confirm">Confirmar Nova Senha *</label>
                  <input id="setpwd-pass-confirm" type="password" class="form-control" placeholder="Repita a nova senha" minlength="8" required />
                </div>

                <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                  <button type="button" class="btn btn-outline" id="setpwd-cancel-btn">Cancelar</button>
                  <button type="submit" class="btn btn-primary btn-full" id="setpwd-submit-btn">Salvar Senha & Acessar</button>
                </div>
              </form>
            `
            }

            <div style="text-align: center; margin-top: 1.75rem; font-size: 0.8125rem; color: var(--ael-muted); border-top: 1px solid var(--ael-line); padding-top: 1.25rem;">
              Ainda não possui cadastro no Banco de Talentos?
              <a href="#/talent-pool/register" style="color: var(--ael-green-base); font-weight: 700; text-decoration: none;">Cadastrar Perfil</a>
            </div>
          </div>
        </div>
      </div>
    `
    bindLoginEvents()
  }

  function bindLoginEvents() {
    // Redefinir / Criar Senha
    document.getElementById('cand-forgot-pwd-btn')?.addEventListener('click', () => {
      pendingEmail = document.getElementById('cand-login-email')?.value.trim() || ''
      isFirstAccessMode = true
      renderForm()
    })

    document.getElementById('setpwd-cancel-btn')?.addEventListener('click', () => {
      isFirstAccessMode = false
      renderForm()
    })

    // Submit de Login
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
          isFirstAccessMode = true
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

    // Submit de Definir Nova Senha
    document.getElementById('candidate-setpwd-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('setpwd-email').value.trim()
      const pass = document.getElementById('setpwd-pass').value
      const pass2 = document.getElementById('setpwd-pass-confirm').value

      if (pass !== pass2) {
        showToast({ title: 'Senhas Diferentes', message: 'A confirmação de senha não coincide.', type: 'error' })
        return
      }

      const btn = document.getElementById('setpwd-submit-btn')
      btn.disabled = true
      btn.textContent = 'Salvando...'

      try {
        const res = await candidateSetPassword(email, pass)
        setCandidateAuth(res.token, res.candidate)
        showToast({ title: 'Senha Salva', message: res.message, type: 'success' })
        renderPortalDashboard(appEl, res.candidate, departments)
      } catch (err) {
        showToast({ title: 'Erro ao Salvar Senha', message: err.message, type: 'error' })
        btn.disabled = false
        btn.textContent = 'Salvar Senha & Acessar'
      }
    })
  }

  renderForm()
}

// ─── DASHBOARD DO CANDIDATO ──────────────────────────────────
function renderPortalDashboard(appEl, cand, departments) {
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
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="
                  width: 52px; height: 52px; border-radius: 50%;
                  background: var(--ael-green-base); color: #ffffff;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 1.25rem; font-weight: 800;
                ">
                  ${(cand.first_name || 'C').charAt(0).toUpperCase()}
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
                <a href="#/jobs" class="btn btn-sm btn-outline">
                  <span>Ver Vagas Abertas</span>
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
            <div class="data-card">
              <div class="data-card-header">
                <div class="data-card-title">Processos Seletivos em Andamento</div>
                <span style="font-size: 0.8125rem; color: var(--ael-muted);">Acompanhe o status em tempo real</span>
              </div>

              ${
                apps.length
                  ? `
                <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                  ${apps
                    .map(
                      (a) => `
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
                          ${escHtml(a.job_title)}
                        </div>
                        <div style="font-size: 0.8125rem; color: var(--ael-muted); margin-top: 0.25rem;">
                          ${escHtml(a.department_name || 'Geral')} · ${escHtml([a.job_city, a.job_state].filter(Boolean).join(' - ') || 'Parauapebas - PA')} · Inscrito em ${formatDate(a.applied_at)}
                        </div>
                      </div>

                      <div>
                        <span class="status-pill ${getStatusColor(a.status)}">
                          ${escHtml(getStatusLabel(a.status))}
                        </span>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
                  : `
                <div style="text-align: center; padding: 3.5rem 1.5rem; color: var(--ael-muted);">
                  <p style="margin-bottom: 1.25rem;">Você ainda não se candidatou a nenhuma vaga específica.</p>
                  <p style="font-size: 0.875rem; color: var(--ael-text);">Seu perfil está <strong>ativo no Banco de Talentos oficial</strong> e disponível para busca pelo RH!</p>
                  <a href="#/jobs" class="btn btn-primary" style="margin-top: 1rem;">Explorar Vagas Abertas</a>
                </div>
              `
              }
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
                    <button type="button" class="btn btn-sm btn-outline" id="prof-add-edu-btn">+ Adicionar Formação</button>
                  </div>

                  <div id="prof-edus-list" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${edus
                      .map(
                        (e, idx) => `
                      <div class="prof-edu-item" data-idx="${idx}" style="background: var(--ael-surface); padding: 1rem; border-radius: var(--ael-radius-md); border: 1px solid var(--ael-line);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                          <span style="font-weight: 700; font-size: 0.8125rem; color: var(--ael-green-base);">Formação #${idx + 1}</span>
                          ${edus.length > 1 ? `<button type="button" class="btn-icon danger prof-del-edu" data-idx="${idx}" style="width: 24px; height: 24px;">✕</button>` : ''}
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                          <input type="text" class="form-control p-edu-level" placeholder="Nível (ex: Superior)" value="${escAttr(e.level)}" />
                          <input type="text" class="form-control p-edu-course" placeholder="Curso" value="${escAttr(e.course)}" />
                        </div>
                        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 0.75rem; margin-top: 0.5rem;">
                          <input type="text" class="form-control p-edu-inst" placeholder="Instituição" value="${escAttr(e.institution)}" />
                          <input type="text" class="form-control p-edu-year" placeholder="Ano" value="${escAttr(e.year)}" />
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
                    <button type="button" class="btn btn-sm btn-outline" id="prof-add-exp-btn">+ Adicionar Experiência</button>
                  </div>

                  <div id="prof-exps-list" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${exps
                      .map(
                        (exp, idx) => `
                      <div class="prof-exp-item" data-idx="${idx}" style="background: var(--ael-surface); padding: 1rem; border-radius: var(--ael-radius-md); border: 1px solid var(--ael-line);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                          <span style="font-weight: 700; font-size: 0.8125rem; color: var(--ael-green-base);">Experiência #${idx + 1}</span>
                          ${exps.length > 1 ? `<button type="button" class="btn-icon danger prof-del-exp" data-idx="${idx}" style="width: 24px; height: 24px;">✕</button>` : ''}
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                          <input type="text" class="form-control p-exp-role" placeholder="Cargo" value="${escAttr(exp.role)}" />
                          <input type="text" class="form-control p-exp-comp" placeholder="Empresa" value="${escAttr(exp.company)}" />
                        </div>
                        <div style="margin-top: 0.5rem;">
                          <input type="text" class="form-control p-exp-per" placeholder="Período (ex: 2021 a 2023)" value="${escAttr(exp.period)}" />
                        </div>
                      </div>
                    `
                      )
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

  function bindDashboardEvents() {
    // Sair
    document.getElementById('cand-logout-btn')?.addEventListener('click', () => {
      clearCandidateAuth()
      showToast({ title: 'Sessão Encerrada', message: 'Você saiu do portal do candidato.', type: 'info' })
      renderLoginScreen(appEl, departments)
    })

    // Tabs
    document.getElementById('tab-btn-apps')?.addEventListener('click', () => {
      activeTab = 'candidaturas'
      renderView()
    })

    document.getElementById('tab-btn-profile')?.addEventListener('click', () => {
      activeTab = 'perfil'
      renderView()
    })

    // Adicionar formação
    document.getElementById('prof-add-edu-btn')?.addEventListener('click', () => {
      cand.educations = cand.educations || []
      cand.educations.push({ level: 'Superior', course: '', institution: '', year: '', status: 'Concluído' })
      renderView()
    })

    document.querySelectorAll('.prof-del-edu').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx)
        cand.educations.splice(idx, 1)
        renderView()
      })
    })

    // Adicionar experiência
    document.getElementById('prof-add-exp-btn')?.addEventListener('click', () => {
      cand.experiences = cand.experiences || []
      cand.experiences.push({ role: '', company: '', period: '', activities: '' })
      renderView()
    })

    document.querySelectorAll('.prof-del-exp').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx)
        cand.experiences.splice(idx, 1)
        renderView()
      })
    })

    // Salvar Perfil
    document.getElementById('cand-edit-profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const btn = document.getElementById('save-profile-btn')
      btn.disabled = true
      btn.querySelector('span').textContent = 'Salvando...'

      // Coleta formações
      const eduItems = document.querySelectorAll('.prof-edu-item')
      const educations = Array.from(eduItems).map((item) => ({
        level: item.querySelector('.p-edu-level')?.value || '',
        course: item.querySelector('.p-edu-course')?.value || '',
        institution: item.querySelector('.p-edu-inst')?.value || '',
        year: item.querySelector('.p-edu-year')?.value || '',
      }))

      // Coleta experiências
      const expItems = document.querySelectorAll('.prof-exp-item')
      const experiences = Array.from(expItems).map((item) => ({
        role: item.querySelector('.p-exp-role')?.value || '',
        company: item.querySelector('.p-exp-comp')?.value || '',
        period: item.querySelector('.p-exp-per')?.value || '',
      }))

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
      payload.append('educations', JSON.stringify(educations))
      payload.append('experiences', JSON.stringify(experiences))
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
  }

  renderView()
}

function getStatusLabel(status) {
  switch (parseInt(status)) {
    case 100:
      return '📥 Recebido / Em Análise'
    case 200:
      return '📞 Contactado pelo RH'
    case 300:
      return '🔍 Em Triagem Técnica'
    case 400:
      return '📤 Enviado ao Gestor'
    case 500:
      return '🗣️ Entrevista Agendada'
    case 600:
      return '🏆 Aprovado / Proposta'
    case 650:
      return '📂 Banco de Talentos (Futuro)'
    case 700:
      return '❌ Não Selecionado'
    default:
      return 'Em Análise'
  }
}

function getStatusColor(status) {
  switch (parseInt(status)) {
    case 500:
    case 600:
      return 'green'
    case 300:
    case 400:
      return 'amber'
    case 700:
      return 'gray'
    default:
      return 'green'
  }
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
