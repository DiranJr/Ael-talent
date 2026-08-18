/** Toast notification system */

let container = null

function getContainer() {
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    container.setAttribute('role', 'status')
    container.setAttribute('aria-live', 'polite')
    document.body.appendChild(container)
  }
  return container
}

export function showToast({ title, message, type = 'success', duration = 4500 }) {
  const c = getContainer()
  const el = document.createElement('div')
  el.className = `toast ${type === 'error' ? 'toast-error' : ''}`

  const icon =
    type === 'error'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`

  el.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <strong>${title}</strong>
      ${message ? `<span>${message}</span>` : ''}
    </div>
  `

  c.appendChild(el)

  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateX(30px)'
    el.style.transition = '300ms ease'
    setTimeout(() => el.remove(), 300)
  }, duration)
}
