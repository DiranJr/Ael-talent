/**
 * A&L Talent — Entry Point com Route-Level Code Splitting
 */

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/admin.css'

import { renderFooter } from './components/Footer.js'
import { renderHeader } from './components/Header.js'
import { initRouter, route } from './router.js'

const appEl = document.getElementById('app')
const mainEl = document.createElement('main')
mainEl.id = 'main-content'
mainEl.setAttribute('role', 'main')

// ─── Layout Shell Público ───────────────────────────────────────
const { el: headerEl } = renderHeader()
const footerEl = renderFooter()

appEl.appendChild(headerEl)
appEl.appendChild(mainEl)
appEl.appendChild(footerEl)

// Controla visibilidade de Header/Footer públicos nas rotas de admin
function updateLayoutVisibility() {
  const hash = window.location.hash.slice(1) || '/'
  const isAdmin = hash.startsWith('/admin')
  headerEl.style.display = isAdmin ? 'none' : ''
  footerEl.style.display = isAdmin ? 'none' : ''
}
window.addEventListener('hashchange', updateLayoutVisibility)
updateLayoutVisibility()

// ─── Rotas Públicas (Dynamic Imports / Code Splitting) ────────────
route('/', () => import('./pages/Home.js').then((m) => m.renderHome))
route('/jobs', () => import('./pages/Home.js').then((m) => m.renderHome))
route('/jobs/:id', () => import('./pages/JobDetail.js').then((m) => m.renderJobDetail))
route('/jobs/:id/apply', () => import('./pages/TalentPoolRegister.js').then((m) => m.renderTalentPoolRegister))
route('/talent-pool', () => import('./pages/TalentPoolRegister.js').then((m) => m.renderTalentPoolRegister))
route('/talent-pool/register', () => import('./pages/TalentPoolRegister.js').then((m) => m.renderTalentPoolRegister))
route('/banco-talentos', () => import('./pages/TalentPoolRegister.js').then((m) => m.renderTalentPoolRegister))
route('/candidato', () => import('./pages/CandidatePortal.js').then((m) => m.renderCandidatePortal))
route('/meu-perfil', () => import('./pages/CandidatePortal.js').then((m) => m.renderCandidatePortal))

// ─── Rotas Administrativas RH (Carregadas exclusivamente sob demanda) ─
route('/admin/login', () => import('./pages/admin/AdminLogin.js').then((m) => m.renderAdminLogin))
route('/admin', () => import('./pages/admin/AdminDashboard.js').then((m) => m.renderAdminDashboard))
route('/admin/jobs', () => import('./pages/admin/AdminJobs.js').then((m) => m.renderAdminJobs))
route('/admin/jobs/new', () => import('./pages/admin/AdminJobForm.js').then((m) => m.renderAdminJobForm))
route('/admin/jobs/:id/edit', () => import('./pages/admin/AdminJobForm.js').then((m) => m.renderAdminJobForm))
route('/admin/candidates', () => import('./pages/admin/AdminCandidates.js').then((m) => m.renderAdminCandidates))
route('/admin/talent-pool', () => import('./pages/admin/AdminTalentPool.js').then((m) => m.renderAdminTalentPool))
route('/admin/departments', () => import('./pages/admin/AdminDepartments.js').then((m) => m.renderAdminDepartments))
route('/admin/users', () => import('./pages/admin/AdminUsers.js').then((m) => m.renderAdminUsers))

// ─── Inicia o router ───────────────────────────────────────────
initRouter(mainEl)

// ─── Scroll to top on route change (exceto se for para a seção de vagas) ─────────────────────────────
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1) || '/'
  if (hash !== '/jobs' && !hash.includes('vagas')) {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
})
