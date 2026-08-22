// /cart page behavior — talks to Shopify's real Ajax Cart API.
// Does not reuse sections/main-cart-items.liquid's JS; fresh implementation
// wired to sections/dc-cart-page.liquid + snippets/dc-cart-page-line-item.liquid.
// The <form method="post" action="{routes.cart_url}"> already works with a
// full page reload if JS fails — everything here is progressive enhancement.

function routeUrl(key) {
  return (window.routes && window.routes[key]) || `/${key.replace('_url', '').replace(/_/g, '/')}.js`
}

function formatMoney(cents, currency) {
  try {
    return new Intl.NumberFormat(document.documentElement.lang || undefined, {
      style: 'currency',
      currency: currency || window.Shopify?.currency?.active || 'USD',
    }).format((cents || 0) / 100)
  } catch (e) {
    return `${((cents || 0) / 100).toFixed(2)}`
  }
}

function debounce(fn, wait) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

class DcCartPage {
  constructor(root) {
    if (root.dataset.dcCartPageBound) return
    root.dataset.dcCartPageBound = '1'

    this.root = root
    this.itemsEl = root.querySelector('[data-dc-cart-page-items]')
    this.subtotalEl = root.querySelector('[data-dc-cart-subtotal]')
    this.totalEl = root.querySelector('[data-dc-cart-total]')
    this.noteEl = root.querySelector('[data-dc-cart-note]')
    this.discountInput = root.querySelector('[data-dc-discount-code]')
    this.discountApply = root.querySelector('[data-dc-discount-apply]')

    this.bindQuantityEvents()
    this.bindNote()
    this.bindDiscount()
  }

  bindQuantityEvents() {
    this.itemsEl?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-dc-cart-remove]')
      const decBtn = e.target.closest('[data-dc-qty-decrease]')
      const incBtn = e.target.closest('[data-dc-qty-increase]')
      const line = e.target.closest('[data-dc-cart-line]')
      if (!line) return
      const key = line.dataset.key

      if (removeBtn) {
        e.preventDefault()
        return this.change(key, 0)
      }
      if (decBtn || incBtn) {
        e.preventDefault()
        const valueInput = line.querySelector('[data-dc-qty-value]')
        const current = parseInt(valueInput?.value || '1', 10)
        const next = decBtn ? Math.max(0, current - 1) : current + 1
        return this.change(key, next)
      }
    })

    // Typing a quantity directly (and blurring, or hitting Enter) also updates.
    this.itemsEl?.addEventListener(
      'change',
      debounce((e) => {
        const input = e.target.closest('[data-dc-qty-value]')
        if (!input) return
        const line = input.closest('[data-dc-cart-line]')
        this.change(line.dataset.key, Math.max(0, parseInt(input.value || '0', 10)))
      }, 300)
    )
  }

  bindNote() {
    this.noteEl?.addEventListener(
      'change',
      debounce((e) => {
        fetch(routeUrl('cart_update_url'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ note: e.target.value }),
        })
      }, 300)
    )
  }

  bindDiscount() {
    this.discountApply?.addEventListener('click', () => {
      const code = this.discountInput?.value.trim()
      if (!code) return
      // Shopify's documented mechanism for applying a discount code outside
      // checkout: navigate to /discount/{code}?redirect=<path>. There's no
      // Ajax Cart API endpoint for this — a real navigation is required.
      window.location.href = `/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(window.location.pathname)}`
    })
  }

  async change(key, quantity) {
    const line = this.itemsEl.querySelector(`[data-dc-cart-line][data-key="${key}"]`)
    line?.classList.add('opacity-50', 'pointer-events-none')

    const res = await fetch(routeUrl('cart_change_url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
    })
    const cart = await res.json()
    this.render(cart)
    document.dispatchEvent(new CustomEvent('dc:cart:updated', { detail: { cart } }))
  }

  render(cart) {
    if (cart.item_count === 0) {
      window.location.reload()
      return
    }

    if (this.subtotalEl) this.subtotalEl.textContent = formatMoney(cart.original_total_price, cart.currency)
    if (this.totalEl) this.totalEl.textContent = formatMoney(cart.total_price, cart.currency)

    cart.items.forEach((item) => {
      const line = this.itemsEl.querySelector(`[data-dc-cart-line][data-key="${item.key}"]`)
      if (!line) return
      line.classList.remove('opacity-50', 'pointer-events-none')
      const qtyValue = line.querySelector('[data-dc-qty-value]')
      if (qtyValue) qtyValue.value = item.quantity
      const priceEl = line.querySelector('[data-dc-line-price]')
      if (priceEl) priceEl.textContent = formatMoney(item.final_line_price, cart.currency)
    })

    // A line that hit quantity 0 is gone from `cart.items` — remove its row.
    this.itemsEl.querySelectorAll('[data-dc-cart-line]').forEach((line) => {
      const stillPresent = cart.items.some((item) => item.key === line.dataset.key)
      if (!stillPresent) line.remove()
    })
  }
}

export function initCartPage(scope = document) {
  const root = scope.id === 'dc-cart-form' ? scope : scope.querySelector?.('#dc-cart-form') || document.getElementById('dc-cart-form')
  if (!root) return
  return new DcCartPage(root)
}
