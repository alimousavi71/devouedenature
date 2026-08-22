// New cart drawer behavior — talks to Shopify's real Ajax Cart API.
// Does not reuse the old snippets/cart-drawer.liquid + its JS; this is a
// fresh implementation wired to snippets/dc-cart-drawer.liquid.

import { animateDrawerOpen, animateDrawerClose } from '../motion/drawers.js'
import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../motion/tokens.js'

function routeJson(key) {
  const base = (window.routes && window.routes[key]) || `/${key.replace('_url', '').replace('_', '/')}`
  return base.endsWith('.js') ? base : `${base}.js`
}

function formatMoney(cents, currency) {
  try {
    return new Intl.NumberFormat(document.documentElement.lang || undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format((cents || 0) / 100)
  } catch (e) {
    return `${((cents || 0) / 100).toFixed(2)}`
  }
}

function lineItemHTML(item) {
  const props = Object.entries(item.properties || {}).filter(([, v]) => v)
  const propsHTML = props
    .map(([k, v]) => `<p class="font-mono text-caption text-muted">${k}: ${v}</p>`)
    .join('')

  const variantHTML =
    item.variant_title && item.variant_title !== 'Default Title'
      ? `<p class="mt-1.5 font-body text-[11px] text-secondary">${item.variant_title}</p>`
      : ''

  return `
    <li class="dc-cart-line grid grid-cols-[66px_minmax(0,1fr)_auto] gap-[18px] py-[18px]" data-dc-cart-line data-dc-drawer-item data-key="${item.key}">
      <a href="${item.url}" class="block w-[66px] aspect-[4/5] shrink-0 bg-elevated overflow-hidden">
        ${item.image ? `<img src="${item.image}" loading="lazy" class="w-full h-full object-cover" alt="">` : ''}
      </a>
      <div class="min-w-0 flex flex-col">
        <div class="flex items-start justify-between gap-2">
          <a href="${item.url}" class="font-display text-[17px] leading-[1.2] text-ink hover:text-secondary transition-colors duration-fast ease-fast line-clamp-2">${item.product_title}</a>
          <button type="button" data-dc-cart-remove aria-label="Remove" class="shrink-0 -mt-0.5 font-body text-[18px] leading-none text-secondary hover:text-ink transition-colors duration-fast ease-fast">&times;</button>
        </div>
        ${variantHTML}
        ${propsHTML}
        <div data-dc-qty-stepper class="dc-qty-stepper mt-[10px]">
          <button type="button" data-dc-qty-decrease class="dc-qty-stepper__btn" aria-label="Decrease quantity">&minus;</button>
          <span data-dc-qty-value class="dc-qty-stepper__value tabular-nums">${item.quantity}</span>
          <button type="button" data-dc-qty-increase class="dc-qty-stepper__btn" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <span data-dc-line-price class="shrink-0 font-body text-[13px] text-ink pt-0.5">${formatMoney(item.final_line_price, window.Shopify?.currency?.active)}</span>
    </li>
  `
}

class DcCart {
  constructor() {
    this.root = document.getElementById('DcCartDrawer')
    if (!this.root) return

    this.scrim = this.root.querySelector('[data-dc-cart-scrim]')
    this.panel = this.root.querySelector('[data-dc-cart-panel]')
    this.itemsEl = this.root.querySelector('[data-dc-cart-items]')
    this.emptyEl = this.root.querySelector('[data-dc-cart-empty]')
    this.bodyEl = this.root.querySelector('[data-dc-cart-body]')
    this.totalEl = this.root.querySelector('[data-dc-cart-total]')

    this.bindStaticEvents()
    document.addEventListener('dc:cart:add', (e) => this.add(e.detail))
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close()
    })

    // Cart icon (header, anywhere) opens the drawer instead of navigating to
    // /cart — progressive enhancement, the link still works with JS disabled.
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-dc-cart-open]')
      if (!trigger) return
      e.preventDefault()
      this.fetchCart().then((cart) => this.render(cart))
      this.open()
    })
  }

  bindStaticEvents() {
    this.root.querySelectorAll('[data-dc-cart-close]').forEach((btn) =>
      btn.addEventListener('click', () => this.close())
    )
    this.scrim?.addEventListener('click', () => this.close())
    this.itemsEl?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-dc-cart-remove]')
      const decBtn = e.target.closest('[data-dc-qty-decrease]')
      const incBtn = e.target.closest('[data-dc-qty-increase]')
      const line = e.target.closest('[data-dc-cart-line]')
      if (!line) return
      const key = line.dataset.key

      if (removeBtn) return this.change(key, 0)
      if (decBtn || incBtn) {
        const valueEl = line.querySelector('[data-dc-qty-value]')
        const current = parseInt(valueEl?.textContent || '1', 10)
        const next = decBtn ? Math.max(0, current - 1) : current + 1
        return this.change(key, next)
      }
    })
  }

  isOpen() {
    return this.root.classList.contains('is-open')
  }

  open() {
    animateDrawerOpen({
      root: this.root,
      panel: this.panel,
      scrim: this.scrim,
      from: 'right',
      onComplete: () => this.root.classList.add('is-open'),
    })
  }

  close() {
    this.root.classList.remove('is-open')
    animateDrawerClose({
      root: this.root,
      panel: this.panel,
      scrim: this.scrim,
      to: 'right',
    })
  }

  async fetchCart() {
    const res = await fetch(routeJson('cart_url'))
    return res.json()
  }

  async add({ id, quantity = 1, properties } = {}) {
    if (!id) return
    const res = await fetch(routeJson('cart_add_url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id, quantity, properties }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      document.dispatchEvent(new CustomEvent('dc:toast', { detail: { variant: 'warning', message: err.description || 'Could not add to bag.' } }))
      return
    }
    const cart = await this.fetchCart()
    this.render(cart)
    this.open()
    document.dispatchEvent(new CustomEvent('dc:toast', { detail: { variant: 'confirm', message: 'Added to your basket.', actionLabel: 'View basket', onAction: () => this.open() } }))
  }

  async change(key, quantity) {
    const res = await fetch(routeJson('cart_change_url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
    })
    const cart = await res.json()
    this.render(cart)
  }

  render(cart) {
    if (this.totalEl) this.totalEl.textContent = formatMoney(cart.total_price, cart.currency)

    document.querySelectorAll('[data-dc-cart-count]').forEach((el) => {
      const next = String(cart.item_count ?? 0)
      if (el.textContent === next) return
      el.textContent = next
      if (!prefersReducedMotion()) {
        gsap.fromTo(el, { scale: 1.12 }, { scale: 1, duration: DURATION.normal, ease: EASE.luxury })
      }
    })

    if (cart.item_count === 0) {
      this.emptyEl?.classList.remove('hidden')
      this.bodyEl?.classList.add('hidden')
      return
    }
    this.emptyEl?.classList.add('hidden')
    this.bodyEl?.classList.remove('hidden')

    if (this.itemsEl) {
      this.itemsEl.innerHTML = cart.items.map(lineItemHTML).join('')
    }

    document.dispatchEvent(new CustomEvent('dc:cart:updated', { detail: { cart } }))
  }
}

export function initCart() {
  return new DcCart()
}
