/**
 * A&L Talent — Entry Point
 */

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/admin.css'

import { renderHeader } from './components/Header.js'
import { renderFooter } from './components/Footer.js'
import { initRouter, route } from './router.js'

// Páginas Públicas
import { renderHome }               from './pages/Home.js'
import { renderJobDetail }          from './pages/JobDetail.js'
import { renderTalentPool }         from './pages/TalentPool.js'
import { renderTalentPoolRegister } from './pages/TalentPoolRegister.js'
import { renderCandidatePortal }    from './pages/CandidatePortal.js'

// Páginas Administrativas (RH)
import { renderAdminLogin }       from './pages/admin/AdminLogin.js'
import { renderAdminDashboard }   from './pages/admin/AdminDashboard.js'
import { renderAdminJobs }        from './pages/admin/AdminJobs.js'
import { renderAdminJobForm }     from './pages/admin/AdminJobForm.js'
import { renderAdminCandidates }  from './pages/admin/AdminCandidates.js'
import { renderAdminTalentPool }  from './pages/admin/AdminTalentPool.js'
import { renderAdminDepartments } from './pages/admin/AdminDepartments.js'
import { renderAdminUsers }       from './pages/admin/AdminUsers.js'

const appEl    = document.getElementById('app')
const mainEl   = document.createElement('main')
mainEl.id      = 'main-content'
mainEl.setAttribute('role', 'main')

// ─── Layout Shell Público ───────────────────────────────────────
const { el: headerEl, cleanup: headerCleanup } = renderHeader()
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

// ─── Rotas Públicas ─────────────────────────────────────────────
route('/',                     renderHome)
route('/jobs',                 renderHome)
route('/jobs/:id',             renderJobDetail)
route('/jobs/:id/apply',       renderTalentPoolRegister) // Candidatura obrigatória via Perfil Estruturado do Banco de Talentos!
route('/talent-pool',          renderTalentPool)
route('/talent-pool/register', renderTalentPoolRegister)
route('/banco-talentos',       renderTalentPool)
route('/candidato',            renderCandidatePortal)
route('/meu-perfil',           renderCandidatePortal)

// ─── Rotas Administrativas (RH) ─────────────────────────────────
route('/admin/login',         renderAdminLogin)
route('/admin',               renderAdminDashboard)
route('/admin/jobs',          renderAdminJobs)
route('/admin/jobs/new',      renderAdminJobForm)
route('/admin/jobs/:id/edit', renderAdminJobForm)
route('/admin/candidates',    renderAdminCandidates)
route('/admin/talent-pool',   renderAdminTalentPool)
route('/admin/departments',   renderAdminDepartments)
route('/admin/users',         renderAdminUsers)

// ─── Inicia o router ───────────────────────────────────────────
initRouter(mainEl)

// ─── Scroll to top on route change ─────────────────────────────
window.addEventListener('hashchange', () => {
  window.scrollTo({ top: 0, behavior: 'instant' })
})
