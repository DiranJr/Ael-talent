/**
 * A&L Talent Admin — Layout Shell Component
 */

import { clearAdminAuth, getAdminToken, getAdminUser } from '../api.js'
import { getCurrentPath, navigate } from '../router.js'

export function renderAdminLayout(
  contentHtml,
  { title = 'Painel RH', activeRoute = '/admin', topActionsHtml = '' } = {}
) {
  const token = getAdminToken()
  if (!token) {
    navigate('/admin/login')
    return ''
  }

  const user = getAdminUser() || { name: 'Recursos Humanos', username: 'admin' }
  const path = getCurrentPath()
  const isAdmin = (user.access_level || 0) >= 400

  const navItems = [
    { label: 'Dashboard', route: '/admin', icon: dashboardIcon() },
    { label: 'Vagas', route: '/admin/jobs', icon: briefcaseIcon() },
    { label: 'Candidatos & Triagem', route: '/admin/candidates', icon: usersIcon() },
    { label: 'Banco de Talentos', route: '/admin/talent-pool', icon: talentPoolIcon() },
    { label: 'Departamentos', route: '/admin/departments', icon: folderIcon() },
  ]

  if (isAdmin) {
    navItems.push({ label: 'Equipe & Acessos', route: '/admin/users', icon: userCheckIcon() })
  }

  const sidebarNavHtml = navItems
    .map((item) => {
      const isActive = path === item.route || (item.route !== '/admin' && path.startsWith(item.route))
      return `
      <a href="#${item.route}" class="admin-nav-item ${isActive ? 'active' : ''}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    `
    })
    .join('')

  return `
    <div class="admin-shell">
      <!-- SIDEBAR -->
      <aside class="admin-sidebar" id="admin-sidebar">
        <div class="admin-sidebar-header">
          <img src="/logo.png" alt="A&L Engenharia" style="height:32px;width:auto;object-fit:contain;" />
          <div>
            <div style="font-size:0.875rem;font-weight:700;color:white;">A&L Talent</div>
            <div style="font-size:0.6875rem;color:var(--ael-green-accent);text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">
              ${isAdmin ? 'Painel do RH' : 'Painel do Recrutador'}
            </div>
          </div>
        </div>

        <nav class="admin-sidebar-nav">
          ${sidebarNavHtml}

          <div style="margin-top:auto;padding-top:1rem;border-top:1px solid var(--ael-dark-border);">
            <a href="#/" target="_blank" class="admin-nav-item" style="color:var(--ael-green-accent);">
              ${externalIcon()}
              <span>Ver Portal Público ↗</span>
            </a>
          </div>
        </nav>

        <div class="admin-sidebar-footer">
          <div class="admin-user-card">
            <div class="admin-user-avatar" style="${isAdmin ? 'background:var(--ael-dark-surface);color:var(--ael-green-accent);border:1.5px solid var(--ael-green-accent);' : ''}">${(user.name || 'RH').charAt(0).toUpperCase()}</div>
            <div class="admin-user-info">
              <div class="admin-user-name">${escHtml(user.name)}</div>
              <div class="admin-user-role" style="color:${isAdmin ? 'var(--ael-green-accent)' : 'var(--ael-dark-muted)'};font-weight:600;">
                ${isAdmin ? '👑 Administrador' : '💼 Recrutador(a)'}
              </div>
            </div>
            <button class="admin-logout-btn" id="admin-logout-btn" title="Sair do painel" type="button">
              ${logoutIcon()}
            </button>
          </div>
        <div class="admin-sidebar-backdrop" id="admin-sidebar-backdrop"></div>
      </aside>

      <!-- MAIN -->
      <div class="admin-main">
        <header class="admin-topbar">
          <div style="display:flex;align-items:center;gap:1rem;">
            <button id="admin-menu-toggle" class="admin-menu-toggle-btn" type="button" aria-label="Abrir menu lateral">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1 class="admin-topbar-title">${escHtml(title)}</h1>
          </div>

          <div class="admin-topbar-actions">
            ${topActionsHtml}
          </div>
        </header>

        <main class="admin-body">
          ${contentHtml}
        </main>
      </div>
    </div>
  `
}

export function bindAdminLayoutEvents(appEl) {
  // Logout
  document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    clearAdminAuth()
    navigate('/admin/login')
  })

  // Mobile / Tablet toggle
  const toggleBtn = document.getElementById('admin-menu-toggle')
  const sidebar = document.getElementById('admin-sidebar')
  const backdrop = document.getElementById('admin-sidebar-backdrop')

  function toggleSidebar() {
    sidebar?.classList.toggle('open')
  }

  function closeSidebar() {
    sidebar?.classList.remove('open')
  }

  toggleBtn?.addEventListener('click', toggleSidebar)
  backdrop?.addEventListener('click', closeSidebar)
}

/* ─── Helpers ─────────────────────────────────────────────── */
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function dashboardIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`
}

function briefcaseIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
}

function usersIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
}

function folderIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`
}

function talentPoolIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
}

function externalIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`
}

function logoutIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`
}

function userCheckIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`
}
