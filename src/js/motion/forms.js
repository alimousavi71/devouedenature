import gsap from 'gsap'
import { DURATION, EASE, shouldAnimate } from './tokens.js'
import { scrollStaggerGroup, staggerEach } from './stagger.js'

/**
 * Form micro-interactions — focus emphasis, status message reveals.
 */
export function initForms(root = document) {
  initFieldFocus(root)
  initFormMessages(root)
  initFormFieldStagger(root)
}

function initFieldFocus(root) {
  root
    .querySelectorAll('.dc-field input, .dc-field textarea, .dc-field select')
    .forEach((input) => {
      if (input.dataset.dcFieldMotion) return
      input.dataset.dcFieldMotion = '1'

      const field = input.closest('.dc-field')
      if (!field) return

      input.addEventListener('focus', () => {
        if (!shouldAnimate()) return
        gsap.to(field, {
          '--dc-field-focus': 1,
          duration: DURATION.fast,
          ease: EASE.normal,
        })
      })
      input.addEventListener('blur', () => {
        if (!shouldAnimate()) return
        gsap.to(field, {
          '--dc-field-focus': 0,
          duration: DURATION.fast,
          ease: EASE.normal,
        })
      })
    })
}

function initFormMessages(root) {
  const messages = [...root.querySelectorAll(
    '[data-dc-form-message], .shopify-challenge__message, .form-status',
  )].filter((msg) => {
    if (msg.dataset.dcFormMsgPlayed) return false
    msg.dataset.dcFormMsgPlayed = '1'
    return true
  })

  if (!messages.length || !shouldAnimate()) return

  gsap.from(messages, {
    opacity: 0,
    y: 10,
    duration: DURATION.normal,
    ease: EASE.editorial,
    stagger: staggerEach(messages.length, 'tight'),
  })
}

/** Stagger form fields on scroll into view */
function initFormFieldStagger(root) {
  root.querySelectorAll('form .dc-field:not([data-dc-field-staggered])').forEach((field) => {
    const form = field.closest('form')
    if (!form || form.dataset.dcFormStaggerBound) return

    const fields = form.querySelectorAll('.dc-field')
    if (fields.length < 2) return

    form.dataset.dcFormStaggerBound = '1'
    fields.forEach((f) => f.setAttribute('data-dc-field-staggered', '1'))

    scrollStaggerGroup({
      trigger: form,
      targets: fields,
      from: { opacity: 0, y: 14 },
      to: { opacity: 1, y: 0, duration: DURATION.normal, ease: EASE.reveal },
      preset: 'tight',
      start: 'top 88%',
    })
  })
}
