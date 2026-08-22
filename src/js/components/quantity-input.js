// quantity-input — +/- stepper for dc-qty-stepper.liquid
class QuantityInput extends HTMLElement {
  connectedCallback() {
    if (this.dataset.dcQtyBound) return
    this.dataset.dcQtyBound = '1'

    const input = this.querySelector('input')
    const minus = this.querySelector('[name="minus"]')
    const plus = this.querySelector('[name="plus"]')
    if (!input) return

    const min = parseInt(input.min || '1', 10)
    const max = parseInt(input.max || '9', 10)

    minus?.addEventListener('click', () => {
      const val = parseInt(input.value || String(min), 10)
      input.value = String(Math.max(min, val - 1))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    plus?.addEventListener('click', () => {
      const val = parseInt(input.value || String(min), 10)
      input.value = String(Math.min(max, val + 1))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }
}

if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', QuantityInput)
}
