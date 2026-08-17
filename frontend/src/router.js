/**
 * A&L Talent — Router SPA (hash-based) com suporte a Query String (?param=val)
 */

const routes = {}
let currentCleanup = null

export function route(path, handler) {
  routes[path] = handler
}

export function navigate(path) {
  window.location.hash = path
}

export function getCurrentPath() {
  const hash = window.location.hash.slice(1) || '/'
  return hash.split('?')[0] || '/'
}

export function getQueryParams() {
  const hash = window.location.hash.slice(1) || ''
  const qsIndex = hash.indexOf('?')
  if (qsIndex === -1) return {}
  const qs = hash.slice(qsIndex + 1)
  const params = {}
  new URLSearchParams(qs).forEach((val, key) => {
    params[key] = val
  })
  return params
}

function matchRoute(fullPath) {
  const [pathname, queryString] = fullPath.split('?')
  const queryParams = {}
  if (queryString) {
    new URLSearchParams(queryString).forEach((val, key) => {
      queryParams[key] = val
    })
  }

  // Exact match no pathname puro
  if (routes[pathname]) {
    return { handler: routes[pathname], params: { ...queryParams } }
  }

  // Param match: /jobs/:id
  for (const pattern of Object.keys(routes)) {
    const patternParts = pattern.split('/')
    const pathParts    = pathname.split('/')

    if (patternParts.length !== pathParts.length) continue

    const params = { ...queryParams }
    let matched = true

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i])
      } else if (patternParts[i] !== pathParts[i]) {
        matched = false
        break
      }
    }

    if (matched) return { handler: routes[pattern], params }
  }

  return null
}

export function initRouter(appEl) {
  async function render() {
    const rawHash = window.location.hash.slice(1) || '/'
    const matched = matchRoute(rawHash)

    if (currentCleanup) {
      currentCleanup()
      currentCleanup = null
    }

    if (!matched) {
      appEl.innerHTML = notFoundPage()
      return
    }

    // Scroll ao topo instantâneo
    window.scrollTo({ top: 0, behavior: 'instant' })

    // Show loading
    appEl.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`

    try {
      const result = await matched.handler(matched.params, appEl)
      if (typeof result === 'function') currentCleanup = result
    } catch (err) {
      console.error('Route error:', err)
      appEl.innerHTML = errorPage(err.message)
    }
  }

  window.addEventListener('hashchange', render)
  render()
}

function notFoundPage() {
  return `
    <div class="section">
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">
            ${iconSvg('map-pin-off')}
          </div>
          <h3>Página não encontrada</h3>
          <p>A página que você buscou não existe ou foi removida.</p>
          <a href="#/" class="btn btn-primary">Voltar ao início</a>
        </div>
      </div>
    </div>
  `
}

function errorPage(message) {
  return `
    <div class="section">
      <div class="container">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Erro ao carregar página</h3>
          <p>${escHtml(message || 'Ocorreu um erro inesperado.')}</p>
          <a href="#/" class="btn btn-primary">Voltar ao início</a>
        </div>
      </div>
    </div>
  `
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function iconSvg(name) {
  if (name === 'map-pin-off') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.75 4.5a7.5 7.5 0 0 1 6.75 7.5c0 4.5-6.75 9.75-6.75 9.75S6 16.5 6 12a7.48 7.48 0 0 1 1.5-4.5"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`
  }
  return ''
}
