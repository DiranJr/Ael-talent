/**
 * A&L Talent — Formulário de Candidatura
 */

import { getJob, submitApplication } from '../api.js'
import { showToast } from '../components/Toast.js'
import { navigate } from '../router.js'

export async function renderApply({ id }, appEl) {
  // Carrega dados da vaga para contexto
  let job = null
  try {
    const data = await getJob(id)
    job = data.job || data
  } catch (_) {}

  const title = job?.title || 'Vaga'

  appEl.innerHTML = `
    <!-- Hero small -->
    <section style="
      background: var(--ael-dark-surface);
      padding-top: calc(var(--ael-header-h) + 3rem);
      padding-bottom: 3rem;
      position: relative;
      overflow: hidden;
    ">
      <div style="
        position:absolute;inset:0;
        background:radial-gradient(ellipse 50% 60% at 60% 50%, rgba(0,91,58,0.15) 0%, transparent 70%);
      " aria-hidden="true"></div>

      <div class="container" style="position:relative;z-index:2;">
        <!-- Breadcrumb -->
        <nav style="display:flex;align-items:center;gap:0.5rem;font-size:0.8125rem;color:rgba(255,255,255,0.45);margin-bottom:1.5rem;">
          <a href="#/" style="color:rgba(255,255,255,0.45);transition:color 150ms;" onmouseenter="this.style.color='#00E676'" onmouseleave="this.style.color='rgba(255,255,255,0.45)'">Início</a>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          <a href="#/jobs/${id}" style="color:rgba(255,255,255,0.45);transition:color 150ms;" onmouseenter="this.style.color='#00E676'" onmouseleave="this.style.color='rgba(255,255,255,0.45)'">${escHtml(title)}</a>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          <span>Candidatura</span>
        </nav>

        <div class="eyebrow eyebrow-light">Candidatura</div>
        <h1 style="font-size:clamp(1.75rem,3.5vw,2.75rem);font-weight:900;color:white;letter-spacing:-0.03em;margin-bottom:0.75rem;">
          ${escHtml(title)}
        </h1>
        <p style="font-size:0.9375rem;color:rgba(255,255,255,0.55);">
          Preencha o formulário abaixo. Todos os campos com * são obrigatórios.
        </p>
      </div>
    </section>

    <!-- FORMULÁRIO -->
    <section class="section section-sm section-alt" id="main-content">
      <div class="container-sm">
        <div style="
          background:white;
          border-radius:var(--ael-radius-xl);
          box-shadow:var(--ael-shadow-lg);
          border:1.5px solid var(--ael-line);
          overflow:hidden;
        ">
          <!-- Cabeçalho do card -->
          <div style="
            padding:1.5rem 2rem;
            background:var(--ael-surface);
            border-bottom:1.5px solid var(--ael-line);
            display:flex;align-items:center;gap:0.75rem;
          ">
            <div style="
              width:40px;height:40px;
              background:var(--ael-green-base);
              border-radius:var(--ael-radius-md);
              display:flex;align-items:center;justify-content:center;
              color:white;flex-shrink:0;
            ">
              ${userIcon()}
            </div>
            <div>
              <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--ael-muted);">
                Dados do candidato
              </div>
              <div style="font-size:0.875rem;font-weight:600;color:var(--ael-ink);">
                Vaga: ${escHtml(title)}
              </div>
            </div>
          </div>

          <!-- Form -->
          <form id="apply-form" novalidate style="padding:2rem;">

            <!-- Grid 2 colunas -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem 1.5rem;">

              <div class="form-group" style="grid-column:1/-1;">
                <label class="form-label" for="apply-name">Nome completo *</label>
                <input
                  id="apply-name"
                  name="name"
                  class="form-control"
                  type="text"
                  placeholder="Como você se chama?"
                  autocomplete="name"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="apply-email">E-mail *</label>
                <input
                  id="apply-email"
                  name="email"
                  class="form-control"
                  type="email"
                  placeholder="seu@email.com"
                  autocomplete="email"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="apply-phone">Telefone / WhatsApp *</label>
                <input
                  id="apply-phone"
                  name="phone"
                  class="form-control"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  autocomplete="tel"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="apply-city">Cidade</label>
                <input
                  id="apply-city"
                  name="city"
                  class="form-control"
                  type="text"
                  placeholder="Sua cidade"
                  autocomplete="address-level2"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="apply-state">Estado</label>
                <input
                  id="apply-state"
                  name="state"
                  class="form-control"
                  type="text"
                  placeholder="UF"
                  maxlength="2"
                  autocomplete="address-level1"
                />
              </div>

            </div>

            <!-- Currículo upload -->
            <div class="form-group">
              <label class="form-label">Currículo * <span style="font-weight:400;color:var(--ael-muted);">(PDF, DOC ou DOCX, máx. 5MB)</span></label>
              <div class="upload-area" id="upload-area" role="button" tabindex="0" aria-label="Clique ou arraste seu currículo aqui">
                <input
                  type="file"
                  id="apply-resume"
                  name="resume"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
                <div class="upload-icon" aria-hidden="true">${uploadIcon()}</div>
                <h4>Arraste seu currículo aqui</h4>
                <p>ou <span class="upload-link" id="upload-link-btn">clique para selecionar</span></p>
                <p style="margin-top:0.5rem;font-size:0.75rem;color:var(--ael-muted);">PDF, DOC, DOCX • Máx. 5MB</p>
              </div>
              <div id="upload-preview" style="display:none;"></div>
              <div class="form-error" id="resume-error" style="display:none;"></div>
            </div>

            <!-- Mensagem -->
            <div class="form-group">
              <label class="form-label" for="apply-message">Apresentação <span style="font-weight:400;color:var(--ael-muted);">(opcional)</span></label>
              <textarea
                id="apply-message"
                name="message"
                class="form-control"
                rows="4"
                placeholder="Conte um pouco sobre você, sua experiência e por que tem interesse nesta vaga..."
                style="resize:vertical;"
              ></textarea>
              <div class="form-hint">Máximo 1000 caracteres.</div>
            </div>

            <!-- Privacidade -->
            <div style="
              background:var(--ael-surface);
              border-radius:var(--ael-radius-md);
              padding:1rem;
              margin-bottom:1.5rem;
              font-size:0.8125rem;
              color:var(--ael-muted);
              line-height:1.6;
              border:1px solid var(--ael-line);
            ">
              <strong style="color:var(--ael-ink);">🔒 Privacidade</strong> — Seus dados e currículo serão utilizados exclusivamente
              para fins de recrutamento pela A&L Engenharia. Não compartilhamos suas informações com terceiros.
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:1rem;flex-wrap:wrap;">
              <button type="submit" class="btn btn-primary btn-lg" id="submit-btn" style="flex:1;justify-content:center;">
                <span id="submit-text">Enviar candidatura</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
              <button type="button" class="btn btn-outline" id="cancel-btn">
                Cancelar
              </button>
            </div>

          </form>
        </div>
      </div>
    </section>
  `

  // ─── Upload handling ────────────────────────────────────────
  const uploadArea = document.getElementById('upload-area')
  const fileInput = document.getElementById('apply-resume')
  const uploadLink = document.getElementById('upload-link-btn')
  const previewEl = document.getElementById('upload-preview')
  const resumeError = document.getElementById('resume-error')

  uploadLink?.addEventListener('click', () => fileInput.click())
  uploadArea?.addEventListener('click', (e) => {
    if (e.target !== uploadLink) fileInput.click()
  })
  uploadArea?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInput.click()
    }
  })

  // Drag & drop
  uploadArea?.addEventListener('dragover', (e) => {
    e.preventDefault()
    uploadArea.classList.add('drag-over')
  })
  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'))
  uploadArea?.addEventListener('drop', (e) => {
    e.preventDefault()
    uploadArea.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  })

  fileInput?.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0])
  })

  function handleFile(file) {
    resumeError.style.display = 'none'
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const ext = file.name.split('.').pop().toLowerCase()

    if (!allowed.includes(file.type) && !['pdf', 'doc', 'docx'].includes(ext)) {
      resumeError.textContent = 'Formato não permitido. Use PDF, DOC ou DOCX.'
      resumeError.style.display = 'block'
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      resumeError.textContent = 'Arquivo muito grande. O limite é 5MB.'
      resumeError.style.display = 'block'
      return
    }

    // Atualiza input se veio de drag/drop
    if (fileInput.files[0] !== file) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileInput.files = dt.files
    }

    const sizeKB = (file.size / 1024).toFixed(0)
    previewEl.style.display = 'block'
    previewEl.innerHTML = `
      <div class="upload-preview">
        <div class="upload-preview-icon">${fileIcon()}</div>
        <div class="upload-preview-info">
          <div class="upload-preview-name">${escHtml(file.name)}</div>
          <div class="upload-preview-size">${sizeKB} KB</div>
        </div>
        <button type="button" id="remove-file-btn" style="color:var(--ael-muted);padding:0.25rem;" aria-label="Remover arquivo">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
    `

    document.getElementById('remove-file-btn')?.addEventListener('click', () => {
      fileInput.value = ''
      previewEl.style.display = 'none'
      previewEl.innerHTML = ''
    })
  }

  // Máscara dinâmica de telefone
  const phoneInput = document.getElementById('apply-phone')
  phoneInput?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 11) v = v.slice(0, 11)
    if (v.length > 10) {
      e.target.value = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    } else if (v.length > 6) {
      e.target.value = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
    } else if (v.length > 2) {
      e.target.value = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2')
    } else {
      e.target.value = v
    }
  })

  // ─── Submit ─────────────────────────────────────────────────
  const form = document.getElementById('apply-form')
  const submitBtn = document.getElementById('submit-btn')
  const submitTxt = document.getElementById('submit-text')

  form?.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Validação básica
    const name = document.getElementById('apply-name').value.trim()
    const email = document.getElementById('apply-email').value.trim()
    const phone = document.getElementById('apply-phone').value.trim()
    const file = fileInput.files[0]

    if (!name || !email || !phone || !file) {
      showToast({
        title: 'Campos obrigatórios',
        message: 'Preencha nome, e-mail, telefone e currículo.',
        type: 'error',
      })
      return
    }

    // Disable
    submitBtn.disabled = true
    submitBtn.classList.add('is-loading')
    submitTxt.textContent = 'Enviando...'

    try {
      const fd = new FormData(form)
      fd.set('joborder_id', id)

      await submitApplication(fd)

      // Sucesso
      appEl.innerHTML = successState(title, id)
    } catch (err) {
      showToast({ title: 'Erro ao enviar', message: err.message, type: 'error' })
      submitBtn.disabled = false
      submitBtn.classList.remove('is-loading')
      submitTxt.textContent = 'Enviar candidatura'
    }
  })

  // Cancelar
  document.getElementById('cancel-btn')?.addEventListener('click', () => {
    navigate(`/jobs/${id}`)
  })
}

/* ─── Estado de sucesso ──────────────────────────────────────── */
function successState(title, id) {
  return `
    <div class="section">
      <div class="container-sm" style="text-align:center;">
        <div style="
          width:80px;height:80px;
          background:rgba(0,91,58,0.10);
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 1.5rem;
          border:2px solid rgba(0,91,58,0.20);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="var(--ael-green-base)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="m9 11 3 3L22 4"/>
          </svg>
        </div>
        <div class="eyebrow" style="justify-content:center;">Candidatura enviada</div>
        <h2 style="margin-bottom:1rem;">Recebemos sua candidatura!</h2>
        <p style="color:var(--ael-muted);max-width:440px;margin:0 auto 2rem;font-size:1rem;line-height:1.7;">
          Sua candidatura para <strong>${escHtml(title)}</strong> foi registrada.
          Nossa equipe de RH analisará seu perfil e entrará em contato se houver compatibilidade.
        </p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <a href="#/" class="btn btn-primary btn-lg">Ver outras vagas</a>
          <a href="#/jobs/${id}" class="btn btn-outline btn-lg">Ver detalhes da vaga</a>
        </div>
      </div>
    </div>
  `
}

/* ─── Helpers ─────────────────────────────────────────────── */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const userIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`

const uploadIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" x2="12" y1="3" y2="15"/>
  </svg>`

const fileIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>`
