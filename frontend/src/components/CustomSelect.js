/**
 * A&L Talent — Custom Select Component
 * Substitui <select> nativo com dropdown totalmente estilizável
 *
 * @param {Object} options
 * @param {string}   options.id         — id do elemento
 * @param {string}   options.label      — label exibido
 * @param {string}   options.value      — valor inicial selecionado
 * @param {Array}    options.items      — [{ value, label }]
 * @param {string}   options.theme      — 'dark' | 'light' (default: 'light')
 * @param {Function} options.onChange   — callback(value)
 * @returns {HTMLElement}
 */
export function createCustomSelect({ id, label, value = '', items = [], theme = 'light', onChange }) {
  const isDark = theme === 'dark'

  const wrap = document.createElement('div')
  wrap.className = `custom-select ${isDark ? 'custom-select--dark' : 'custom-select--light'}`
  wrap.setAttribute('role', 'combobox')
  wrap.setAttribute('aria-expanded', 'false')
  wrap.setAttribute('aria-haspopup', 'listbox')
  wrap.id = id

  let currentValue = value
  let currentLabel = items.find((i) => i.value === value)?.label || items[0]?.label || label

  function getHtml() {
    return `
      <button
        class="custom-select__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded="false"
        id="${id}-btn"
      >
        <span class="custom-select__value">${escHtml(currentLabel)}</span>
        <svg class="custom-select__chevron" xmlns="http://www.w3.org/2000/svg"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <div class="custom-select__dropdown" role="listbox" aria-labelledby="${id}-btn" id="${id}-list">
        ${items
          .map(
            (item) => `
          <div
            class="custom-select__option ${item.value === currentValue ? 'is-selected' : ''}"
            role="option"
            aria-selected="${item.value === currentValue}"
            data-value="${escAttr(item.value)}"
            tabindex="-1"
          >
            ${item.value === currentValue ? checkIcon() : ''}
            <span>${escHtml(item.label)}</span>
          </div>
        `
          )
          .join('')}
      </div>
    `
  }

  function render() {
    wrap.innerHTML = getHtml()
    bindEvents()
  }

  function close() {
    wrap.setAttribute('aria-expanded', 'false')
    const trigger = wrap.querySelector('.custom-select__trigger')
    const dropdown = wrap.querySelector('.custom-select__dropdown')
    if (trigger) trigger.setAttribute('aria-expanded', 'false')
    if (dropdown) dropdown.classList.remove('is-open')
    wrap.classList.remove('is-open')
    document.removeEventListener('click', outsideClick)
    document.removeEventListener('keydown', onKeydown)
  }

  function open() {
    // Fecha outros selects abertos
    document.querySelectorAll('.custom-select.is-open').forEach((el) => {
      if (el !== wrap) el.querySelector('.custom-select__trigger')?.click()
    })

    wrap.setAttribute('aria-expanded', 'true')
    const trigger = wrap.querySelector('.custom-select__trigger')
    const dropdown = wrap.querySelector('.custom-select__dropdown')
    if (trigger) trigger.setAttribute('aria-expanded', 'true')
    if (dropdown) dropdown.classList.add('is-open')
    wrap.classList.add('is-open')

    // Foca item selecionado
    const selected = dropdown?.querySelector('.is-selected')
    selected?.focus()

    setTimeout(() => {
      document.addEventListener('click', outsideClick)
      document.addEventListener('keydown', onKeydown)
    }, 0)
  }

  function outsideClick(e) {
    if (!wrap.contains(e.target)) close()
  }

  function selectItem(value, label) {
    currentValue = value
    currentLabel = label
    render()
    if (onChange) onChange(value)
  }

  function onKeydown(e) {
    const dropdown = wrap.querySelector('.custom-select__dropdown')
    const options = [...(dropdown?.querySelectorAll('.custom-select__option') || [])]
    const focused = document.activeElement

    if (e.key === 'Escape') {
      close()
      wrap.querySelector('.custom-select__trigger')?.focus()
      return
    }

    if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
      const idx = options.indexOf(focused)
      const next =
        e.key === 'ArrowDown' ? options[Math.min(idx + 1, options.length - 1)] : options[Math.max(idx - 1, 0)]
      next?.focus()
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (focused?.classList.contains('custom-select__option')) {
        selectItem(focused.dataset.value, focused.querySelector('span')?.textContent || '')
        close()
        wrap.querySelector('.custom-select__trigger')?.focus()
      }
    }
  }

  function bindEvents() {
    const trigger = wrap.querySelector('.custom-select__trigger')
    const options = wrap.querySelectorAll('.custom-select__option')

    trigger?.addEventListener('click', (e) => {
      e.stopPropagation()
      wrap.classList.contains('is-open') ? close() : open()
    })

    options.forEach((opt) => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation()
        const val = opt.dataset.value
        const label = opt.querySelector('span')?.textContent || ''
        selectItem(val, label)
        close()
        trigger?.focus()
      })

      opt.addEventListener('mouseenter', () => opt.focus())
    })
  }

  render()

  // Expõe métodos
  wrap.getValue = () => currentValue
  wrap.setValue = (val) => {
    const item = items.find((i) => i.value === val)
    if (item) {
      currentValue = item.value
      currentLabel = item.label
      render()
    }
  }
  wrap.setItems = (newItems) => {
    items = newItems || []
    const match = items.find((i) => i.value === currentValue)
    if (!match) {
      currentValue = items[0]?.value || ''
      currentLabel = items[0]?.label || label
    } else {
      currentLabel = match.label
    }
    render()
  }

  return wrap
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function escAttr(s) {
  return escHtml(s)
}
function checkIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    style="flex-shrink:0;" aria-hidden="true">
    <path d="m20 6-11 11-5-5"/>
  </svg>`
}
