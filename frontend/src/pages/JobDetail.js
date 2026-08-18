/**
 * A&L Talent — Página de Detalhe da Vaga
 */

import { getJob } from '../api.js'
import { navigate } from '../router.js'

export async function renderJobDetail({ id }, appEl) {
  // Skeleton estruturado imediato enquanto busca os dados da vaga
  appEl.innerHTML = renderJobDetailSkeleton()

  let job
  try {
    const data = await getJob(id)
    job = data.job || data
  } catch (err) {
    appEl.innerHTML = errorState(err.message)
    return
  }

  if (!job) {
    appEl.innerHTML = notFoundState()
    return
  }

  const dept = job.department || job.departmentName || ''
  const location = [job.city, job.state].filter(Boolean).join(' — ') || job.location || ''
  const type = job.type || 'CLT'
  const desc = job.description || ''

  appEl.innerHTML = `
    <!-- HERO DETALHE -->
    <section class="job-detail-hero" aria-labelledby="job-detail-title">
      <div class="container job-detail-hero-inner">
        <!-- Breadcrumb -->
        <nav class="job-detail-breadcrumb" aria-label="Navegação estrutural">
          <a href="#/">Início</a>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <a href="#/">Vagas</a>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <span style="color:rgba(255,255,255,0.6);">${escHtml(job.title)}</span>
        </nav>

        <!-- Badges -->
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.25rem;">
          ${dept ? `<span class="badge badge-accent">${escHtml(dept)}</span>` : ''}
          <span class="badge" style="background:rgba(0,230,118,0.15);color:#00E676;border:1px solid rgba(0,230,118,0.25);">
            Vaga ativa
          </span>
        </div>

        <!-- Título -->
        <h1 id="job-detail-title" class="job-detail-title">${escHtml(job.title)}</h1>

        <!-- Meta -->
        <div class="job-detail-meta-row">
          ${
            location
              ? `
            <div class="job-detail-meta-item">
              ${mapPinIcon()}
              <span>${escHtml(location)}</span>
            </div>`
              : ''
          }
          ${
            type
              ? `
            <div class="job-detail-meta-item">
              ${briefcaseIcon()}
              <span>${escHtml(type)}</span>
            </div>`
              : ''
          }
          ${
            job.date_created
              ? `
            <div class="job-detail-meta-item">
              ${calendarIcon()}
              <span>Publicada em ${formatDate(job.date_created)}</span>
            </div>`
              : ''
          }
        </div>

        <!-- CTA rápido -->
        <a href="#apply-section" class="btn btn-accent btn-lg" id="hero-apply-btn">
          Candidatar-se agora
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </a>
      </div>
    </section>

    <!-- CONTEÚDO + SIDEBAR -->
    <section class="section section-sm" id="main-content">
      <div class="container">
        <div class="job-detail-layout">

          <!-- Corpo da vaga -->
          <div class="job-detail-body">
            <h2>Sobre a oportunidade</h2>
            <div id="job-desc-content">
              ${renderDescription(desc)}
            </div>
          </div>

          <!-- Sidebar / Apply Card -->
          <aside class="job-detail-sidebar">
            <div class="apply-card" id="apply-section">
              <div class="eyebrow" style="margin-bottom:0.75rem;">Candidatura</div>
              <h3>${escHtml(job.title)}</h3>
              <p>Preencha seus dados e envie seu currículo. Nossa equipe de RH avaliará seu perfil.</p>
              <a href="#/jobs/${id}/apply" class="btn btn-primary btn-full btn-lg" id="open-apply-btn">
                Iniciar candidatura
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </a>

              <!-- Detalhes da vaga -->
              <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--ael-line);">
                ${
                  dept
                    ? `
                  <div style="display:flex;justify-content:space-between;padding:0.5rem 0;font-size:0.875rem;">
                    <span style="color:var(--ael-muted);">Área</span>
                    <span style="font-weight:600;color:var(--ael-ink);">${escHtml(dept)}</span>
                  </div>`
                    : ''
                }
                ${
                  location
                    ? `
                  <div style="display:flex;justify-content:space-between;padding:0.5rem 0;font-size:0.875rem;border-top:1px solid var(--ael-line);">
                    <span style="color:var(--ael-muted);">Local</span>
                    <span style="font-weight:600;color:var(--ael-ink);">${escHtml(location)}</span>
                  </div>`
                    : ''
                }
                <div style="display:flex;justify-content:space-between;padding:0.5rem 0;font-size:0.875rem;border-top:1px solid var(--ael-line);">
                  <span style="color:var(--ael-muted);">Regime</span>
                  <span style="font-weight:600;color:var(--ael-ink);">${escHtml(type)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.5rem 0;font-size:0.875rem;border-top:1px solid var(--ael-line);">
                  <span style="color:var(--ael-muted);">Status</span>
                  <span style="font-weight:600;color:#00874a;">Aberta</span>
                </div>
              </div>
            </div>

            <!-- Back -->
            <div style="margin-top:1rem;text-align:center;">
              <button class="btn btn-outline btn-sm btn-full" id="back-btn" type="button">
                ← Voltar às vagas
              </button>
            </div>
          </aside>

        </div>
      </div>
    </section>
  `

  // Anchor scroll para candidatura
  document.getElementById('hero-apply-btn')?.addEventListener('click', (e) => {
    e.preventDefault()
    document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth' })
  })

  // Botão candidatura → página Apply
  document.getElementById('open-apply-btn')?.addEventListener('click', (e) => {
    e.preventDefault()
    navigate(`/jobs/${id}/apply`)
  })

  // Voltar
  document.getElementById('back-btn')?.addEventListener('click', () => {
    navigate('/')
  })
}

/* ─── Renderiza a descrição da vaga ─────────────────────────── */
function renderDescription(text) {
  if (!text) return '<p style="color:var(--ael-muted);">Descrição não disponível.</p>'

  // Se já contiver HTML, sanitizar levemente
  const hasHtml = /<[a-z][\s\S]*>/i.test(text)
  if (hasHtml) {
    return `<div>${text}</div>`
  }

  // Texto plano → converter quebras em parágrafos
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${escHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/* ─── Estados de erro ────────────────────────────────────────── */
function errorState(msg) {
  return `
    <div class="section">
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">${alertIcon()}</div>
          <h3>Erro ao carregar vaga</h3>
          <p>${msg}</p>
          <a href="#/" class="btn btn-primary">Voltar às vagas</a>
        </div>
      </div>
    </div>
  `
}

function notFoundState() {
  return `
    <div class="section">
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">${briefcaseIcon()}</div>
          <h3>Vaga não encontrada</h3>
          <p>Esta vaga pode ter sido encerrada ou removida.</p>
          <a href="#/" class="btn btn-primary">Ver outras vagas</a>
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

function formatDate(str) {
  try {
    return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return ''
  }
}

const mapPinIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`

const briefcaseIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect width="20" height="14" x="2" y="7" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>`

const calendarIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>`

const alertIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>`

function renderJobDetailSkeleton() {
  return `
    <section class="job-detail-hero" aria-hidden="true">
      <div class="container job-detail-hero-inner">
        <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:1.5rem;">
          <div class="skeleton" style="width:50px;height:14px;background:rgba(255,255,255,0.1);"></div>
          <span style="color:rgba(255,255,255,0.2);">›</span>
          <div class="skeleton" style="width:50px;height:14px;background:rgba(255,255,255,0.1);"></div>
          <span style="color:rgba(255,255,255,0.2);">›</span>
          <div class="skeleton" style="width:140px;height:14px;background:rgba(255,255,255,0.1);"></div>
        </div>

        <div style="display:flex;gap:0.5rem;margin-bottom:1.25rem;">
          <div class="skeleton" style="width:100px;height:24px;border-radius:4px;background:rgba(255,255,255,0.1);"></div>
          <div class="skeleton" style="width:80px;height:24px;border-radius:4px;background:rgba(255,255,255,0.1);"></div>
        </div>

        <div class="skeleton" style="width:65%;height:44px;margin-bottom:1.5rem;background:rgba(255,255,255,0.15);border-radius:6px;"></div>

        <div style="display:flex;gap:1.5rem;margin-bottom:2rem;">
          <div class="skeleton" style="width:120px;height:18px;background:rgba(255,255,255,0.1);"></div>
          <div class="skeleton" style="width:90px;height:18px;background:rgba(255,255,255,0.1);"></div>
          <div class="skeleton" style="width:140px;height:18px;background:rgba(255,255,255,0.1);"></div>
        </div>

        <div class="skeleton" style="width:200px;height:48px;border-radius:6px;background:rgba(0,230,118,0.25);"></div>
      </div>
    </section>

    <section class="section section-sm">
      <div class="container">
        <div class="job-detail-layout">
          <div class="job-detail-body" style="display:flex;flex-direction:column;gap:1.25rem;">
            <div class="skeleton" style="width:35%;height:28px;"></div>
            <div class="skeleton" style="width:100%;height:16px;"></div>
            <div class="skeleton" style="width:95%;height:16px;"></div>
            <div class="skeleton" style="width:90%;height:16px;"></div>
            <div class="skeleton" style="width:75%;height:16px;"></div>
            <div class="skeleton" style="width:100%;height:16px;margin-top:1rem;"></div>
            <div class="skeleton" style="width:85%;height:16px;"></div>
            <div class="skeleton" style="width:60%;height:16px;"></div>
          </div>

          <aside class="job-detail-sidebar">
            <div class="apply-card" style="display:flex;flex-direction:column;gap:1rem;">
              <div class="skeleton" style="width:80px;height:14px;"></div>
              <div class="skeleton" style="width:85%;height:24px;"></div>
              <div class="skeleton" style="width:100%;height:14px;"></div>
              <div class="skeleton" style="width:100%;height:44px;border-radius:6px;margin-top:0.5rem;"></div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `
}
