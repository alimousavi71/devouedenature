/**
 * Smooth/hash scroll for in-page anchors, offset for fixed header.
 */
function headerOffset() {
  const shell = document.querySelector('[data-dc-header-shell]')
  return shell ? Math.ceil(shell.getBoundingClientRect().height) + 16 : 120
}

function scrollToHash(hash = window.location.hash, behavior = 'smooth') {
  if (!hash || hash === '#') return false
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  const el = document.getElementById(id)
  if (!el) return false

  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset()
  window.scrollTo({ top: Math.max(0, top), behavior })
  return true
}

export function initHashScroll() {
  // After layout (fonts/images) — native hash jump often fires too early / under fixed header
  if (window.location.hash) {
    requestAnimationFrame(() => {
      scrollToHash(window.location.hash, 'auto')
      window.setTimeout(() => scrollToHash(window.location.hash, 'auto'), 200)
      window.setTimeout(() => scrollToHash(window.location.hash, 'auto'), 600)
    })
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="#"]')
    if (!link) return

    const href = link.getAttribute('href')
    if (!href || href === '#') return

    let url
    try {
      url = new URL(href, window.location.origin)
    } catch {
      return
    }

    if (url.origin !== window.location.origin) return
    if (url.pathname !== window.location.pathname) return
    if (!url.hash) return

    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)))
    if (!el) return

    event.preventDefault()
    history.pushState(null, '', url.hash)
    scrollToHash(url.hash, 'smooth')
  })

  window.addEventListener('hashchange', () => {
    scrollToHash(window.location.hash, 'smooth')
  })
}
