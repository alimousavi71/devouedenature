// New collection filter/sort/save behavior — talks to Shopify's real
// Search & Discovery filter params and native `sort_by`. Does not reuse
// snippets/facets.liquid or its JS; fresh implementation for dc-collection-grid.liquid.

const SAVED_KEY = 'dc:saved-products'

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')
  } catch (e) {
    return []
  }
}

function setSaved(ids) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids))
}

function initSaveToggles(root) {
  root.querySelectorAll('[data-dc-save-toggle]').forEach((btn) => {
    const id = btn.dataset.productId
    const saved = getSaved()
    const label = btn.querySelector('[data-dc-save-label]')

    const paint = (isSaved) => {
      btn.setAttribute('aria-pressed', String(isSaved))
      if (label) label.textContent = isSaved ? 'Saved' : 'Save'
      btn.classList.toggle('is-saved', isSaved)
    }
    paint(saved.includes(id))

    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const current = getSaved()
      const isSaved = current.includes(id)
      const next = isSaved ? current.filter((x) => x !== id) : [...current, id]
      setSaved(next)
      paint(!isSaved)
    })
  })
}

function initSort(root) {
  const select = root.querySelector('[data-dc-sort-select]')
  if (!select) return
  select.addEventListener('change', () => {
    const url = new URL(window.location.href)
    url.searchParams.set('sort_by', select.value)
    window.location.href = url.toString()
  })
}

export function initCollection(root = document) {
  initSaveToggles(root)
  initSort(root)
}
