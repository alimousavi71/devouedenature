import gsap from 'gsap'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '../motion/tokens.js'
import { stopSmoothScroll, startSmoothScroll } from '../motion/smooth-scroll.js'

let openRoot = null
let lastFocus = null

function mountToBody(root) {
  if (!root || root.dataset.dcTeamBioMounted === '1') return
  document.body.appendChild(root)
  root.dataset.dcTeamBioMounted = '1'
}

function lockPage() {
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  stopSmoothScroll()
}

function unlockPage() {
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
  startSmoothScroll()
}

function openBio(root) {
  if (!root || openRoot === root) return

  if (openRoot) closeBio(openRoot, true)

  mountToBody(root)
  lastFocus = document.activeElement

  const scrim = root.querySelector('.dc-team-bio__scrim')
  const panel = root.querySelector('[data-dc-team-bio-panel]')
  const ui = root.querySelectorAll('[data-dc-team-bio-ui]')
  const scroll = root.querySelector('[data-dc-team-bio-scroll]')

  root.classList.remove('hidden')
  root.classList.add('is-open')
  root.setAttribute('aria-hidden', 'false')
  lockPage()
  openRoot = root

  if (scroll) scroll.scrollTop = 0

  const closeBtn = root.querySelector('[data-dc-team-bio-close]:not(.dc-team-bio__scrim)')
  closeBtn?.focus({ preventScroll: true })

  gsap.killTweensOf([scrim, panel, ...ui].filter(Boolean))

  if (prefersReducedMotion()) {
    if (scrim) gsap.set(scrim, { opacity: 1 })
    if (panel) gsap.set(panel, { opacity: 1, y: 0, scale: 1 })
    gsap.set(ui, { opacity: 1, y: 0 })
    return
  }

  if (scrim) gsap.set(scrim, { opacity: 0 })
  if (panel) gsap.set(panel, { opacity: 0, y: 28, scale: 0.98 })
  gsap.set(ui, { opacity: 0, y: 10 })

  const tl = gsap.timeline()
  if (scrim) {
    tl.to(scrim, { opacity: 1, duration: 0.32, ease: EASE.normal }, 0)
  }
  if (panel) {
    tl.to(
      panel,
      { opacity: 1, y: 0, scale: 1, duration: DURATION.slow, ease: EASE.reveal },
      STAGGER.overlay,
    )
  }
  if (ui.length) {
    tl.to(
      ui,
      {
        opacity: 1,
        y: 0,
        duration: DURATION.normal,
        ease: EASE.reveal,
        stagger: 0.05,
      },
      STAGGER.overlay + 0.06,
    )
  }

  root._dcTeamBioTl = tl
}

function closeBio(root, immediate = false) {
  if (!root || !root.classList.contains('is-open')) return

  const scrim = root.querySelector('.dc-team-bio__scrim')
  const panel = root.querySelector('[data-dc-team-bio-panel]')
  const ui = root.querySelectorAll('[data-dc-team-bio-ui]')

  const finish = () => {
    root.classList.add('hidden')
    root.classList.remove('is-open')
    root.setAttribute('aria-hidden', 'true')
    if (openRoot === root) openRoot = null
    unlockPage()
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true })
    }
    lastFocus = null
  }

  root._dcTeamBioTl?.kill()

  if (immediate || prefersReducedMotion()) {
    gsap.set([scrim, panel, ...ui].filter(Boolean), { clearProps: 'opacity,transform' })
    finish()
    return
  }

  const tl = gsap.timeline({ onComplete: finish })
  if (ui.length) {
    tl.to(ui, { opacity: 0, y: 6, duration: DURATION.fast, ease: EASE.exit, stagger: 0.02 }, 0)
  }
  if (panel) {
    tl.to(
      panel,
      { opacity: 0, y: 16, scale: 0.985, duration: DURATION.normal, ease: EASE.exit },
      0.02,
    )
  }
  if (scrim) {
    tl.to(scrim, { opacity: 0, duration: 0.28, ease: EASE.exit }, 0.04)
  }
}

export function initTeamBios(root = document) {
  root.querySelectorAll('[data-dc-team-bio-open]').forEach((trigger) => {
    if (trigger.dataset.dcTeamBioBound === '1') return
    trigger.dataset.dcTeamBioBound = '1'

    trigger.addEventListener('click', () => {
      const id = trigger.getAttribute('data-dc-team-bio-open')
      const bio = id ? document.getElementById(id) : null
      if (bio) openBio(bio)
    })
  })

  root.querySelectorAll('[data-dc-team-bio]').forEach((bio) => {
    if (bio.dataset.dcTeamBioBound === '1') return
    bio.dataset.dcTeamBioBound = '1'

    bio.querySelectorAll('[data-dc-team-bio-close]').forEach((btn) => {
      btn.addEventListener('click', () => closeBio(bio))
    })
  })

  if (document.documentElement.dataset.dcTeamBioEsc !== '1') {
    document.documentElement.dataset.dcTeamBioEsc = '1'
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && openRoot) {
        event.preventDefault()
        closeBio(openRoot)
      }
    })
  }
}
