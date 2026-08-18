/**
 * A&L Talent — Página Home
 * Listagem de vagas com hero, filtros e cards dinâmicos
 */

import { getFilters, getJobs } from '../api.js'
import { createCustomSelect } from '../components/CustomSelect.js'
import { navigate } from '../router.js'

let debounceTimer = null

export async function renderHome(params, appEl) {
  // Render shell imediato
  appEl.innerHTML = `
    <!-- HERO -->
    <section class="hero" id="inicio" aria-labelledby="hero-title">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-grid-overlay" aria-hidden="true"></div>

      <div class="hero-inner">
        <div class="hero-copy animate-up">
          <div class="hero-kicker">
            <span class="hero-dot" aria-hidden="true"></span>
            Engenharia genuinamente paraense
          </div>

          <h1 id="hero-title" class="hero-title">
            Construa sua história<br>
            com a <em>A&amp;L.</em>
          </h1>

          <p class="hero-lead">
            Valorizamos talentos locais e pessoas comprometidas com segurança,
            excelência e resultados que permanecem.
          </p>

          <div class="hero-actions">
            <a href="#vagas" class="btn btn-primary btn-lg" id="hero-cta-vagas">
              Ver vagas abertas
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </a>
            <a href="https://aelengenharia.com.br/" target="_blank" rel="noreferrer" class="btn btn-ghost btn-lg">
              Conheça a A&L
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M13 5H19V11"/><path d="M19 5L5 19"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Card de busca lateral -->
        <aside class="hero-search-card animate-up animate-up-delay-2">
          <h3>Encontre sua oportunidade</h3>
          <p>Filtre por área ou localidade.</p>

          <div class="form-group">
            <label class="form-label" style="color:rgba(255,255,255,0.75);" for="hero-search">
              Palavra-chave
            </label>
            <input
              id="hero-search"
              class="form-control form-control-dark"
              type="search"
              placeholder="Ex.: técnico, administrativo..."
              autocomplete="off"
            />
          </div>

          <div class="form-group">
            <label class="form-label" style="color:rgba(255,255,255,0.75);" for="hero-dept-select">
              Área
            </label>
            <div id="hero-dept-container"></div>
          </div>

          <button class="btn btn-accent btn-full" id="hero-search-btn" type="button">
            Buscar vagas
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </button>
        </aside>
      </div>
    </section>

    <!-- STATS STRIP — dados reais A&L Engenharia -->
    <div class="stats-strip" aria-label="A&L em números">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item animate-up">
            <strong>20 anos</strong>
            <span>de solidez<br>construtiva</span>
          </div>
          <div class="stat-item animate-up animate-up-delay-1">
            <strong>+500</strong>
            <span>obras<br>realizadas</span>
          </div>
          <div class="stat-item animate-up animate-up-delay-2">
            <strong>+30</strong>
            <span>clientes<br>atendidos</span>
          </div>
          <div class="stat-item animate-up animate-up-delay-3">
            <strong>+1000</strong>
            <span>colaboradores</span>
          </div>
          <div class="stat-item animate-up animate-up-delay-4">
            <strong>+200</strong>
            <span>equipamentos<br>próprios</span>
          </div>
          <div class="stat-item animate-up" style="animation-delay:400ms;">
            <strong>5</strong>
            <span>cidades com<br>presença regional</span>
          </div>
        </div>
      </div>
    </div>

    <!-- VAGAS -->
    <section class="section" id="vagas" aria-labelledby="vagas-title">
      <div class="container">
        <div class="section-header">
          <div class="eyebrow">Oportunidades</div>
          <div class="section-header-grid">
            <div>
              <h2 id="vagas-title">Vagas para construir<br>o próximo capítulo.</h2>
            </div>
            <div id="jobs-count-wrap"></div>
          </div>
        </div>

        <!-- Barra de filtros -->
        <div class="filters-bar" role="search" aria-label="Filtrar vagas">
          <div class="filter-input-wrap" style="flex:1;min-width:240px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              id="filter-search"
              class="form-control"
              type="search"
              placeholder="Buscar vaga..."
              aria-label="Buscar vaga"
              autocomplete="off"
            />
          </div>

          <div id="filter-dept-container" style="width:200px;"></div>
          <div id="filter-location-container" style="width:200px;"></div>
        </div>

        <!-- Lista de vagas -->
        <div id="jobs-list" aria-live="polite" aria-label="Lista de vagas">
          <div class="page-loader"><div class="spinner"></div></div>
        </div>
      </div>
    </section>

    <!-- PROCESSO SELETIVO -->
    <section class="section section-dark" aria-labelledby="processo-title">
      <div class="container">
        <div class="section-header">
          <div class="eyebrow eyebrow-light">Processo seletivo</div>
          <h2 id="processo-title" style="color:white;">Um processo claro,<br>do cadastro à admissão.</h2>
        </div>

        <div class="steps-grid" role="list">
          <div class="step animate-up" role="listitem">
            <div class="step-number" aria-hidden="true">01</div>
            <h3 style="color:white;">Cadastro</h3>
            <p>Candidatura em uma vaga ou entrada no banco de talentos.</p>
          </div>
          <div class="step animate-up animate-up-delay-1" role="listitem">
            <div class="step-number" aria-hidden="true">02</div>
            <h3 style="color:white;">Triagem</h3>
            <p>O RH avalia os perfis e organiza os candidatos.</p>
          </div>
          <div class="step animate-up animate-up-delay-2" role="listitem">
            <div class="step-number" aria-hidden="true">03</div>
            <h3 style="color:white;">Entrevista</h3>
            <p>Etapas com RH e, quando necessário, gestor responsável.</p>
          </div>
          <div class="step animate-up animate-up-delay-3" role="listitem">
            <div class="step-number" aria-hidden="true">04</div>
            <h3 style="color:white;">Admissão</h3>
            <p>Formalização e início de uma nova história na A&L.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- BANCO DE TALENTOS -->
    <section class="section section-alt" id="banco-talentos" aria-labelledby="talentos-title">
      <div class="container">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:3rem;align-items:center;">
          <div>
            <div class="eyebrow">Banco de Talentos</div>
            <h2 id="talentos-title">Não encontrou a vaga ideal agora?</h2>
            <p class="lead" style="margin-top:1rem;max-width:520px;">
              Cadastre seu perfil profissional de forma proativa. Nosso time de Recursos Humanos avalia continuamente novos talentos para projetos de engenharia, infraestrutura, mineração e operações corporativas.
            </p>
            <div style="margin-top:1.5rem;display:flex;gap:1rem;flex-wrap:wrap;">
              <a href="#/talent-pool/register" class="btn btn-primary btn-lg" id="home-talent-pool-register-btn">
                Cadastrar no Banco de Talentos
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </a>
              <a href="#/candidato" class="btn btn-secondary btn-lg">
                Já possui cadastro? Acessar perfil
              </a>
            </div>
          </div>

          <div style="background:white;border-radius:var(--ael-radius-xl);padding:var(--ael-space-2xl);box-shadow:var(--ael-shadow-md);border:1.5px solid var(--ael-line);">
            <h3 style="font-size:1.125rem;font-weight:700;color:var(--ael-dark);margin-bottom:0.75rem;">
              Vantagens do Banco de Talentos A&L
            </h3>
            <ul style="display:flex;flex-direction:column;gap:0.75rem;color:var(--ael-muted);font-size:0.9375rem;padding-left:1.25rem;margin-bottom:1.5rem;line-height:1.5;">
              <li>Notificação prioritária em novas oportunidades</li>
              <li>Acompanhamento de status de processos seletivos</li>
              <li>Histórico profissional estruturado e atualizável</li>
              <li>Segurança e privacidade de dados com conformidade LGPD</li>
            </ul>
            <a href="#/talent-pool" class="btn btn-ghost btn-full" style="justify-content:center;">
              Saiba mais sobre o Banco de Talentos
            </a>
          </div>
        </div>
      </div>
    </section>
  `

  // Monta CustomSelects com itens padrão iniciais
  const initialDeptItems = [{ value: '', label: 'Todas as áreas' }]
  const initialLocItems = [{ value: '', label: 'Todas as localidades' }]

  const heroDeptContainer = document.getElementById('hero-dept-container')
  const heroDeptSelect = createCustomSelect({
    id: 'hero-dept-select',
    label: 'Todas as áreas',
    value: '',
    items: initialDeptItems,
    theme: 'dark',
  })
  if (heroDeptContainer) heroDeptContainer.appendChild(heroDeptSelect)

  const filterDeptContainer = document.getElementById('filter-dept-container')
  const filterDeptSelect = createCustomSelect({
    id: 'filter-dept-select',
    label: 'Todas as áreas',
    value: '',
    items: initialDeptItems,
    theme: 'light',
    onChange: () => onFilterChange(),
  })
  if (filterDeptContainer) filterDeptContainer.appendChild(filterDeptSelect)

  const filterLocContainer = document.getElementById('filter-location-container')
  const filterLocSelect = createCustomSelect({
    id: 'filter-loc-select',
    label: 'Todas as localidades',
    value: '',
    items: initialLocItems,
    theme: 'light',
    onChange: () => onFilterChange(),
  })
  if (filterLocContainer) filterLocContainer.appendChild(filterLocSelect)

  // Carrega departamentos e localidades dinâmicos cadastrados pelo RH no OpenCATS
  getFilters()
    .then(({ departments, locations }) => {
      if (departments && departments.length > 0) {
        const deptItems = [{ value: '', label: 'Todas as áreas' }, ...departments]
        heroDeptSelect.setItems(deptItems)
        filterDeptSelect.setItems(deptItems)
      }
      if (locations && locations.length > 0) {
        const locItems = [{ value: '', label: 'Todas as localidades' }, ...locations]
        filterLocSelect.setItems(locItems)
      }
    })
    .catch((err) => {
      console.warn('Erro ao carregar filtros dinâmicos do OpenCATS:', err)
    })

  // Anchor scroll para #vagas via hero CTA
  document.getElementById('hero-cta-vagas')?.addEventListener('click', (e) => {
    e.preventDefault()
    document.getElementById('vagas')?.scrollIntoView({ behavior: 'smooth' })
  })

  // Busca pelo card lateral do hero
  document.getElementById('hero-search-btn')?.addEventListener('click', () => {
    const search = document.getElementById('hero-search')?.value || ''
    const dept = heroDeptSelect.getValue()
    document.getElementById('filter-search').value = search
    filterDeptSelect.setValue(dept)
    document.getElementById('vagas')?.scrollIntoView({ behavior: 'smooth' })
    loadJobs({ search, department: dept, location: filterLocSelect.getValue() })
  })

  // Filtros
  const filterSearch = document.getElementById('filter-search')

  const onFilterChange = () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      loadJobs({
        search: filterSearch.value,
        department: filterDeptSelect.getValue(),
        location: filterLocSelect.getValue(),
      })
    }, 350)
  }

  filterSearch.addEventListener('input', onFilterChange)

  // Carrega vagas iniciais
  await loadJobs({})

  // Cleanup
  return () => {
    clearTimeout(debounceTimer)
  }
}

async function loadJobs({ search = '', department = '', location = '' } = {}) {
  const list = document.getElementById('jobs-list')
  const countWrap = document.getElementById('jobs-count-wrap')
  if (!list) return

  // Renderiza 3 skeleton cards durante o loading
  list.innerHTML = `
    <div class="jobs-grid">
      <div class="skeleton-card">
        <div class="skeleton skeleton-pill"></div>
        <div class="skeleton skeleton-title" style="margin-top:0.5rem;"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton skeleton-pill"></div>
        <div class="skeleton skeleton-title" style="margin-top:0.5rem;"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton skeleton-pill"></div>
        <div class="skeleton skeleton-title" style="margin-top:0.5rem;"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    </div>
  `

  try {
    const data = await getJobs({ search, department, location })
    const jobs = data.jobs || data

    if (countWrap) {
      countWrap.innerHTML =
        jobs.length > 0
          ? `<span class="filter-count">${jobs.length} vaga${jobs.length !== 1 ? 's' : ''} encontrada${jobs.length !== 1 ? 's' : ''}</span>`
          : ''
    }

    if (!jobs.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            ${briefcaseIcon()}
          </div>
          <h3>Nenhuma vaga encontrada</h3>
          <p>Não há vagas abertas com os filtros selecionados. Tente outros termos ou
            <a href="#/talent-pool/register" style="color:var(--ael-green-base);font-weight:600;">cadastre-se no banco de talentos</a>.
          </p>
        </div>
      `
      return
    }

    list.innerHTML = `<div class="jobs-grid">${jobs.map(jobCard).join('')}</div>`

    // Clique nos cards
    list.querySelectorAll('.job-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.preventDefault()
        navigate(`/jobs/${card.dataset.id}`)
      })

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/jobs/${card.dataset.id}`)
        }
      })
    })
  } catch (err) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${alertIcon()}</div>
        <h3>Erro ao carregar vagas</h3>
        <p>${err.message}</p>
      </div>
    `
  }
}

function jobCard(job) {
  const dept = job.department || job.departmentName || ''
  const location = [job.city, job.state].filter(Boolean).join(' — ') || job.location || ''
  const type = job.type || 'CLT'

  return `
    <article
      class="job-card"
      data-id="${job.joborder_id || job.id}"
      tabindex="0"
      role="link"
      aria-label="Ver vaga: ${escHtml(job.title)}"
    >
      <div class="job-card-badge-row">
        ${dept ? `<span class="badge badge-green">${escHtml(dept)}</span>` : ''}
        <span class="badge badge-dark">${escHtml(type)}</span>
      </div>

      <h3 class="job-card-title">${escHtml(job.title)}</h3>

      <p class="job-card-desc">${escHtml(job.description || 'Ver detalhes da oportunidade.')}</p>

      <div class="job-card-meta">
        ${
          location
            ? `
          <div class="job-card-meta-item">
            ${mapPinIcon()}
            <span>${escHtml(location)}</span>
          </div>`
            : ''
        }
        ${
          type
            ? `
          <div class="job-card-meta-item">
            ${briefcaseSmIcon()}
            <span>${escHtml(type)}</span>
          </div>`
            : ''
        }
      </div>

      <div class="job-card-footer">
        <span style="font-size:0.75rem;color:var(--ael-muted);">
          ${job.date_created ? `Publicada em ${formatDate(job.date_created)}` : 'Vaga aberta'}
        </span>
        <div class="job-card-arrow" aria-hidden="true">
          ${arrowIcon()}
        </div>
      </div>
    </article>
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
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`

const briefcaseSmIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect width="20" height="14" x="2" y="7" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>`

const briefcaseIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect width="20" height="14" x="2" y="7" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>`

const alertIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>`

const arrowIcon = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>`
