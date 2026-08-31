/**
 * Footer country / currency disclosure — snippets/dc-localization-form.liquid
 */
import { stopSmoothScroll, startSmoothScroll } from '../motion/smooth-scroll.js'

export function initLocalizationForms(root = document) {
  root.querySelectorAll('[data-dc-localization]:not([data-dc-localization-bound])').forEach((wrapper) => {
    wrapper.dataset.dcLocalizationBound = '1'

    const form = wrapper.querySelector('form')
    const button = wrapper.querySelector('[data-dc-disclosure-button]')
    const panel = wrapper.querySelector('[data-dc-disclosure-panel]')
    const input = wrapper.querySelector('input[name="country_code"]')

    if (!form || !button || !panel || !input) return

    const close = () => {
      button.setAttribute('aria-expanded', 'false')
      panel.hidden = true
      startSmoothScroll()
    }

    const open = () => {
      button.setAttribute('aria-expanded', 'true')
      panel.hidden = false
      stopSmoothScroll()
    }

    button.addEventListener('click', (event) => {
      event.stopPropagation()
      const expanded = button.getAttribute('aria-expanded') === 'true'
      if (expanded) close()
      else open()
    })

    panel.addEventListener(
      'wheel',
      (event) => {
        event.stopPropagation()
      },
      { passive: true }
    )

    panel.addEventListener(
      'touchmove',
      (event) => {
        event.stopPropagation()
      },
      { passive: true }
    )

    wrapper.querySelectorAll('[data-dc-country-option]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault()
        input.value = link.dataset.value
        form.submit()
      })
    })

    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) close()
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close()
    })
  })
}
