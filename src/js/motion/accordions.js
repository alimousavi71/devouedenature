import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { DURATION, EASE, prefersReducedMotion } from './tokens.js'

/** DesignSystem.dc.html — Slow · 520 ms */
const ACCORDION_DURATION = 0.52

function getBody(details) {
  return details.querySelector('.dc-accordion__body')
}

function getPanel(body) {
  return (
    body?.querySelector('.dc-accordion__content, .dc-accordion__panel, .overflow-hidden') ||
    body?.firstElementChild
  )
}

function setAnimating(details, value) {
  if (value) details.dataset.dcAccordionAnimating = '1'
  else delete details.dataset.dcAccordionAnimating
}

function isAnimating(details) {
  return details.dataset.dcAccordionAnimating === '1'
}

function refreshScroll() {
  ScrollTrigger.refresh()
}

/**
 * Smooth accordion open/close — height + icon rotation, no layout jump.
 * Works for product, FAQ, and contact accordions (.dc-accordion).
 */
export function initAccordions(root = document) {
  if (prefersReducedMotion()) return

  root.querySelectorAll('.dc-accordion').forEach((details) => {
    if (details.dataset.dcAccordionMotion) return

    const summary = details.querySelector('summary')
    const body = getBody(details)
    const panel = getPanel(body)
    const icon = details.querySelector('.dc-accordion__icon')

    if (!summary || !body || !panel) return

    details.dataset.dcAccordionMotion = '1'

    gsap.set(icon, { transformOrigin: '50% 50%', force3D: true })

    if (details.open) {
      gsap.set(body, { height: 'auto', overflow: 'hidden' })
      gsap.set(panel, { opacity: 1 })
      gsap.set(icon, { rotation: 45 })
    } else {
      gsap.set(body, { height: 0, overflow: 'hidden' })
      gsap.set(panel, { opacity: 0 })
    }

    summary.addEventListener('click', (event) => {
      event.preventDefault()
      if (isAnimating(details)) return

      const opening = !details.open
      setAnimating(details, true)

      if (opening) {
        details.open = true
        const targetHeight = body.scrollHeight

        gsap.set(body, { height: 0, overflow: 'hidden' })
        gsap.set(panel, { opacity: 0 })

        gsap
          .timeline({
            defaults: { ease: EASE.drawer, overwrite: 'auto' },
            onComplete: () => {
              gsap.set(body, { height: 'auto' })
              setAnimating(details, false)
              refreshScroll()
            },
          })
          .to(body, { height: targetHeight, duration: ACCORDION_DURATION }, 0)
          .to(
            panel,
            { opacity: 1, duration: DURATION.normal, ease: EASE.luxury },
            ACCORDION_DURATION * 0.22,
          )

        if (icon) {
          gsap.to(icon, {
            rotation: 45,
            duration: ACCORDION_DURATION,
            ease: EASE.luxury,
          })
        }
      } else {
        const currentHeight = body.offsetHeight

        gsap.set(body, { height: currentHeight, overflow: 'hidden' })

        gsap
          .timeline({
            defaults: { ease: EASE.drawer, overwrite: 'auto' },
            onComplete: () => {
              details.open = false
              gsap.set(body, { height: 0, overflow: 'hidden' })
              gsap.set(panel, { opacity: 0 })
              setAnimating(details, false)
              refreshScroll()
            },
          })
          .to(panel, { opacity: 0, duration: DURATION.fast, ease: EASE.exit }, 0)
          .to(body, { height: 0, duration: ACCORDION_DURATION }, 0.04)

        if (icon) {
          gsap.to(icon, {
            rotation: 0,
            duration: ACCORDION_DURATION,
            ease: EASE.luxury,
          })
        }
      }
    })
  })
}
