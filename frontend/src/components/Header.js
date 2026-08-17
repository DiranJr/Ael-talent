/**
 * A&L Talent — Header / Barra de Navegação Principal
 */

import logoUrl from '../assets/logo.png'

export function renderHeader() {
  const header = document.createElement('header')
  header.className = 'site-header'
  header.id = 'site-header'
  header.setAttribute('role', 'banner')

  header.innerHTML = `
    <a class="sr-only skip-link" href="#main-content">Ir para o conteúdo</a>
    <div class="header-inner">
      <a class="header-brand" href="#/" aria-label="A&L Engenharia Carreiras — início">
        <img src="${logoUrl}" alt="A&L Engenharia" class="header-logo-img" />
        <div>
          <span class="header-brand-name">A&L Engenharia</span>
          <span class="header-brand-sub">Carreiras</span>
        </div>
      </a>

      <nav class="header-nav" id="header-nav" aria-label="Navegação principal">
        <a href="#/" class="nav-link" data-route="/">Início</a>
        <a href="#/jobs" class="nav-link" data-route="/jobs">Vagas</a>
        <a href="#/talent-pool" class="nav-link" data-route="/talent-pool">Banco de Talentos</a>
        <a href="#/candidato" class="nav-link" data-route="/candidato" style="font-weight: 600;">Área do Candidato 👤</a>
        <a href="#/admin" class="nav-link nav-admin-badge" data-route="/admin">Painel RH 🔒</a>
        <a href="https://aelengenharia.com.br/" target="_blank" rel="noreferrer" class="nav-highlight">
          aelengenharia.com.br ↗
        </a>
      </nav>

      <button class="header-mobile-btn" id="mobile-menu-btn" aria-label="Abrir menu" aria-expanded="false" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>
        </svg>
      </button>
    </div>
  `

  // Scroll behavior: mantém consistência visual de contraste
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 15)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // Marca link ativo baseado na rota
  const updateActive = () => {
    const hash = window.location.hash.slice(1) || '/'
    header.querySelectorAll('.nav-link[data-route]').forEach(link => {
      const route = link.dataset.route
      link.classList.toggle('active', hash === route || (route !== '/' && hash.startsWith(route)))
    })
  }
  window.addEventListener('hashchange', updateActive)
  updateActive()

  // Mobile menu toggle
  const mobileBtn = header.querySelector('#mobile-menu-btn')
  const navMenu = header.querySelector('#header-nav')
  mobileBtn?.addEventListener('click', () => {
    const expanded = mobileBtn.getAttribute('aria-expanded') === 'true'
    mobileBtn.setAttribute('aria-expanded', String(!expanded))
    navMenu?.classList.toggle('is-open', !expanded)
  })

  return {
    el: header,
    cleanup: () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hashchange', updateActive)
    }
  }
}
