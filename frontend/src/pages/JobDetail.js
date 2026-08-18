import { candidateGetMe, getCandidateToken, getJob, registerTalentPool } from '../api.js'
import { showToast } from '../components/Toast.js'
import { navigate } from '../router.js'

export async function renderJobDetail({ id }, appEl) {
  // Skeleton estruturado imediato enquanto busca os dados da vaga
  appEl.innerHTML = renderJobDetailSkeleton()

  let job
  let candidateData = null
  const token = getCandidateToken()

  try {
    const [data, meRes] = await Promise.all([
      getJob(id),
      token ? candidateGetMe().catch(() => null) : Promise.resolve(null),
    ])
    job = data.job || data
    if (meRes?.success && meRes.candidate) {
      candidateData = meRes.candidate
    }
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

  const alreadyApplied = candidateData?.applications?.find(
    (a) => String(a.joborder_id) === String(id) || String(a.job_id) === String(id)
  )
  const appStatusLabel = alreadyApplied ? getCandidateAppStatus(alreadyApplied) : ''
  const jobMeta = getJobStatusMeta(job.status)

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
          <span class="badge" style="background:${jobMeta.bg};color:${jobMeta.color};border:1px solid ${jobMeta.color}40;">
            ${jobMeta.badge}
          </span>
          ${
            alreadyApplied
              ? `<span class="badge" style="background:rgba(0,230,118,0.25);color:#ffffff;font-weight:700;">✓ Inscrito: ${escHtml(appStatusLabel)}</span>`
              : ''
          }
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
        ${
          alreadyApplied
            ? `
          <a href="#/candidato" class="btn btn-accent btn-lg">
            ✓ Ver no Meu Painel (${escHtml(appStatusLabel)})
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </a>
        `
            : !jobMeta.isApplyAllowed
              ? `
          <div style="background: rgba(255,255,255,0.15); padding: 0.75rem 1.25rem; border-radius: var(--ael-radius-md); font-weight: 700; color: #ffffff;">
            ⚠️ Inscrições encerradas/pausadas pelo RH para esta vaga
          </div>
        `
              : candidateData
                ? `
          <button class="btn btn-accent btn-lg hero-quick-apply-btn" type="button">
            ⚡ Candidatar-se com 1 Clique
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
        `
                : `
          <a href="#apply-section" class="btn btn-accent btn-lg" id="hero-apply-btn">
            Candidatar-se agora
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </a>
        `
        }
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

              ${
                alreadyApplied
                  ? `
                <div style="background: rgba(0, 91, 58, 0.08); border: 1.5px solid var(--ael-green-base); border-radius: var(--ael-radius-md); padding: 1.25rem; text-align: center; margin-block: 1rem;">
                  <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">✅</div>
                  <div style="font-weight: 800; color: var(--ael-green-dark); font-size: 1rem; margin-bottom: 0.25rem;">
                    Inscrição Confirmada!
                  </div>
                  <div style="font-size: 0.8125rem; color: var(--ael-text); margin-bottom: 0.5rem;">
                    Etapa Atual no RH: <strong style="color: var(--ael-green-dark);">${escHtml(appStatusLabel)}</strong>
                  </div>
                  <a href="#/candidato" class="btn btn-primary btn-full btn-sm">
                    Acessar Minha Área de Candidato
                  </a>
                </div>
              `
                  : !jobMeta.isApplyAllowed
                    ? `
                <div style="background: rgba(220, 38, 38, 0.06); border: 1px solid rgba(220,38,38,0.2); border-radius: var(--ael-radius-md); padding: 1rem; text-align: center; margin-block: 1rem;">
                  <div style="font-weight: 700; color: #b91c1c; font-size: 0.875rem;">Inscrições Indisponíveis</div>
                  <p style="font-size: 0.75rem; color: var(--ael-muted); margin: 0.35rem 0 0 0;">Esta vaga foi marcada como <strong>${escHtml(jobMeta.label)}</strong> pelo RH.</p>
                </div>
              `
                    : candidateData
                      ? `
                <p style="font-size: 0.875rem; color: var(--ael-text); margin-bottom: 1rem;">
                  Você está conectado como <strong>${escHtml(candidateData.first_name)} ${escHtml(candidateData.last_name)}</strong> (${escHtml(candidateData.email)}).
                </p>

                <button type="button" class="btn btn-primary btn-full btn-lg" id="quick-apply-btn" style="box-shadow: 0 4px 16px rgba(0, 230, 118, 0.3);">
                  <span>⚡ Candidatar-se com 1 Clique</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </button>

                <div style="text-align: center; margin-top: 0.75rem;">
                  <a href="#/jobs/${id}/apply" style="font-size: 0.75rem; color: var(--ael-muted); text-decoration: underline;">
                    Deseja atualizar dados do seu perfil antes de enviar?
                  </a>
                </div>
              `
                      : `
                <p>Preencha seus dados e envie seu currículo. Nossa equipe de RH avaliará seu perfil.</p>
                <a href="#/jobs/${id}/apply" class="btn btn-primary btn-full btn-lg" id="open-apply-btn">
                  Iniciar candidatura
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </a>
              `
              }

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
                  <span style="font-weight:700;color:${jobMeta.color};">${escHtml(jobMeta.label)}</span>
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

  // 1-Click Apply Handler para Candidato Logado
  async function handleOneClickApply(buttonEl) {
    if (!candidateData || !id) return
    buttonEl.disabled = true
    const origHtml = buttonEl.innerHTML
    buttonEl.innerHTML = `<span>Enviando candidatura...</span>`

    try {
      const payload = new FormData()
      payload.append('first_name', candidateData.first_name || '')
      payload.append('last_name', candidateData.last_name || '')
      payload.append('email', candidateData.email || '')
      payload.append('phone', candidateData.phone || '')
      payload.append('city', candidateData.city || '')
      payload.append('state', candidateData.state || 'PA')
      payload.append('interest_area', job.department || candidateData.interest_area || 'Geral')
      payload.append('desired_role', job.title || candidateData.desired_role || '')
      payload.append('job_id', id)
      payload.append('educations', JSON.stringify(candidateData.educations || []))
      payload.append('experiences', JSON.stringify(candidateData.experiences || []))
      payload.append('key_skills', (candidateData.key_skills || []).join(', '))
      payload.append('notes', candidateData.notes || '')
      payload.append('consent_lgpd', 'true')

      await registerTalentPool(payload)
      showToast({
        title: 'Candidatura Confirmada!',
        message: `Sua candidatura para a vaga "${job.title}" foi enviada com sucesso!`,
        type: 'success',
      })
      renderJobDetail({ id }, appEl)
    } catch (err) {
      showToast({ title: 'Erro ao candidatar-se', message: err.message, type: 'error' })
      buttonEl.disabled = false
      buttonEl.innerHTML = origHtml
    }
  }

  document.getElementById('quick-apply-btn')?.addEventListener('click', (e) => {
    handleOneClickApply(e.currentTarget)
  })

  document.querySelectorAll('.hero-quick-apply-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleOneClickApply(btn)
    })
  })

  // Anchor scroll para candidatura não logada
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

function getJobStatusMeta(jobStatus) {
  switch (jobStatus) {
    case 'Active':
    case 'Active-Share':
      return {
        label: 'Aberta',
        badge: 'Vaga ativa',
        color: '#00874a',
        bg: 'rgba(0,230,118,0.15)',
        isApplyAllowed: true,
      }
    case 'On Hold':
      return {
        label: 'Pausada pelo RH',
        badge: 'Inscrições em Pausa',
        color: '#d97706',
        bg: 'rgba(217,119,6,0.15)',
        isApplyAllowed: false,
      }
    case 'Closed':
    case 'Cancelled':
      return {
        label: 'Encerrada',
        badge: 'Processo Encerrado',
        color: '#dc2626',
        bg: 'rgba(220,38,38,0.15)',
        isApplyAllowed: false,
      }
    case 'Filled':
      return {
        label: 'Preenchida',
        badge: 'Posição Preenchida',
        color: '#4b5563',
        bg: 'rgba(75,85,99,0.15)',
        isApplyAllowed: false,
      }
    default:
      return {
        label: 'Aberta',
        badge: 'Vaga ativa',
        color: '#00874a',
        bg: 'rgba(0,230,118,0.15)',
        isApplyAllowed: true,
      }
  }
}

function getCandidateAppStatus(app) {
  const code = parseInt(app?.status_code ?? app?.status ?? 100)
  switch (code) {
    case 100:
      return '📥 Recebido / Em Análise'
    case 200:
      return '📞 Contactado pelo RH'
    case 250:
      return '💬 Resposta Registrada'
    case 300:
      return '🔍 Em Triagem Técnica'
    case 400:
      return '📤 Encaminhado à Gestão'
    case 500:
      return '🗣️ Entrevista Agendada'
    case 600:
      return '🏆 Aprovado / Proposta'
    case 650:
      return '📂 Banco de Talentos (Futuro)'
    case 700:
      return '❌ Não Selecionado nesta Vaga'
    case 800:
      return '🎉 Contratado(a)'
    default:
      return app?.status_label || '📥 Em Análise'
  }
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
