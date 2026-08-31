import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import {
  DURATION,
  EASE,
  RISE,
  IMAGE_SCALE,
  STAGGER,
  prefersReducedMotion,
  killTriggers,
  cappedStagger,
} from './tokens.js'
import { initEditorial } from './editorial.js'
import { groupSiblingReveals, createScrollReveal, timelineStagger } from './stagger.js'
import { initProductEntrance } from './product.js'

/**
 * Editorial scroll reveals + hero entrance + soft parallax.
 */
export function initReveal(root = document) {
  if (root !== document) {
    killTriggers(root)
    root.querySelectorAll('[data-revealed]').forEach((el) => el.removeAttribute('data-revealed'))
    root.querySelectorAll('[data-reveal-sibling]').forEach((el) => el.removeAttribute('data-reveal-sibling'))
    root.querySelectorAll('[data-hero-played]').forEach((el) => el.removeAttribute('data-hero-played'))
    root.querySelectorAll('[data-parallax-bound]').forEach((el) => el.removeAttribute('data-parallax-bound'))
    root.querySelectorAll('[data-dc-heading-played]').forEach((el) => el.removeAttribute('data-dc-heading-played'))
    root.querySelectorAll('[data-dc-campaign-bound]').forEach((el) => el.removeAttribute('data-dc-campaign-bound'))
    root.querySelectorAll('[data-dc-editorial-bound]').forEach((el) => el.removeAttribute('data-dc-editorial-bound'))
  }

  if (prefersReducedMotion()) {
    root.querySelectorAll('[data-reveal], [data-reveal-stagger] > *, [data-dc-hero] *').forEach((el) => {
      gsap.set(el, { clearProps: 'all' })
      el.setAttribute('data-revealed', '1')
    })
    return
  }

  initProductEntrance(root)
  initExplicitStaggerGroups(root)
  initSiblingStaggerGroups(root)
  initSingleReveals(root)

  initHero(root)
  initParallax(root)
  initEditorial(root)
}

function initExplicitStaggerGroups(root) {
  root.querySelectorAll('[data-reveal-stagger]:not([data-revealed])').forEach((group) => {
    const children = Array.from(group.children).filter((c) => !c.hasAttribute('data-revealed'))
    if (!children.length) return

    const animated = children.slice(0, STAGGER.maxItems)
    const instant = children.slice(STAGGER.maxItems)
    if (instant.length) gsap.set(instant, { opacity: 1, y: 0 })

    createScrollReveal({
      trigger: group,
      targets: animated,
      from: { opacity: 0, y: RISE },
      to: {
        opacity: 1,
        y: 0,
        duration: DURATION.editorial,
        ease: EASE.luxury,
      },
      preset: 'normal',
      start: 'top 85%',
      onComplete: () => group.setAttribute('data-revealed', '1'),
    })
  })
}

function initSiblingStaggerGroups(root) {
  groupSiblingReveals(root)

  root.querySelectorAll('[data-reveal-sibling]:not([data-revealed])').forEach((el) => {
    const parent = el.parentElement
    if (!parent || parent.dataset.dcSiblingStaggerBound) return

    const siblings = Array.from(parent.children).filter(
      (child) =>
        child.hasAttribute('data-reveal-sibling') && !child.hasAttribute('data-revealed'),
    )
    if (siblings.length < 2) return

    parent.dataset.dcSiblingStaggerBound = '1'

    createScrollReveal({
      trigger: parent,
      targets: siblings,
      from: { opacity: 0, y: RISE * 0.85 },
      to: {
        opacity: 1,
        y: 0,
        duration: DURATION.editorial,
        ease: EASE.luxury,
      },
      preset: 'section',
      start: 'top 85%',
    })
  })
}

function initSingleReveals(root) {
  root.querySelectorAll('[data-reveal]:not([data-revealed]):not([data-reveal-sibling])').forEach((el) => {
    if (el.closest('[data-dc-product-root]')) return
    if (el.closest('[data-reveal-stagger]')) return
    if (el.parentElement?.closest('[data-reveal]:not([data-reveal-stagger])')) {
      const ancestor = el.parentElement.closest('[data-reveal]')
      if (ancestor && ancestor !== el) return
    }

    const isImage = el.matches('img') || el.querySelector(':scope > img')
    const isMask = el.hasAttribute('data-reveal-mask')
    const isFloat = el.hasAttribute('data-reveal-float')
    const isSection = el.matches('section')

    gsap.set(el, {
      opacity: 0,
      y: isMask ? 0 : isFloat ? RISE * 0.6 : isSection ? RISE * 1.1 : RISE,
      ...(isImage || isMask ? { scale: IMAGE_SCALE } : {}),
      ...(isMask ? { clipPath: 'inset(0 0 100% 0)' } : {}),
      ...(isFloat ? { rotate: 0.4 } : {}),
    })

    let played = false
    const play = () => {
      if (played) return
      played = true
      el.setAttribute('data-revealed', '1')
      gsap.to(el, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        clipPath: isMask ? 'inset(0 0 0% 0)' : undefined,
        duration: DURATION.editorial,
        ease: EASE.reveal,
        overwrite: 'auto',
      })
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: play,
    })

    if (st.isActive) play()
  })
}

function initHero(root) {
  const hero = root.querySelector('[data-dc-hero]:not([data-hero-played])')
  if (!hero) return
  hero.setAttribute('data-hero-played', '1')

  const media = hero.querySelector('[data-dc-hero-media]')
  const eyebrow = hero.querySelector('[data-dc-hero-eyebrow]')
  const title = hero.querySelector('[data-dc-hero-title]')
  const copy = hero.querySelector('[data-dc-hero-copy]')
  const cta = hero.querySelector('[data-dc-hero-cta]')

  const tl = gsap.timeline({ defaults: { ease: EASE.luxury } })
  let cursor = 0

  if (media) {
    const mediaTarget = media.querySelector('img, video') || media
    gsap.set(mediaTarget, { scale: 1.1, opacity: 0.75 })
    tl.to(mediaTarget, { scale: 1, opacity: 1, duration: DURATION.cinematic, ease: EASE.reveal }, cursor)
    cursor += STAGGER.hero
  }

  if (eyebrow) {
    gsap.set(eyebrow, { opacity: 0, y: 14 })
    tl.to(eyebrow, { opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.reveal }, cursor)
    cursor += STAGGER.tight
  }

  if (title) {
    gsap.set(title, { opacity: 0, y: 36 })
    tl.to(title, { opacity: 1, y: 0, duration: DURATION.editorial, ease: EASE.luxury }, cursor)
    cursor += STAGGER.section
  }

  const copyTargets = [copy, cta].filter(Boolean)
  if (copyTargets.length) {
    gsap.set(copyTargets, { opacity: 0, y: 20 })
    timelineStagger(
      tl,
      copyTargets,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: DURATION.slow,
        ease: EASE.editorial,
      },
      cursor,
      'hero',
    )
  }
}

function initParallax(root) {
  if (window.matchMedia('(pointer: coarse)').matches) return

  root.querySelectorAll('[data-parallax]:not([data-parallax-bound])').forEach((el) => {
    el.setAttribute('data-parallax-bound', '1')
    const amount = parseFloat(el.getAttribute('data-parallax')) || 48
    const scale = parseFloat(el.getAttribute('data-parallax-scale')) || 0

    gsap.to(el, {
      y: amount,
      ...(scale ? { scale: 1 + scale } : {}),
      ease: EASE.scrub,
      scrollTrigger: {
        trigger: el.parentElement || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
    })
  })
}

export function initPageEntrance() {
  if (prefersReducedMotion()) return

  const bar = document.querySelector('[data-dc-header]')
  if (bar && !bar.dataset.dcEntrancePlayed) {
    bar.dataset.dcEntrancePlayed = '1'

    const navLinks = bar.querySelectorAll('.dc-nav-link, nav a')
    const tl = gsap.timeline({ defaults: { ease: EASE.luxury } })

    gsap.set(bar, { opacity: 0, y: -12 })
    tl.to(bar, { opacity: 1, y: 0, duration: DURATION.slow }, 0)

    if (navLinks.length) {
      gsap.set(navLinks, { opacity: 0, y: -6 })
      timelineStagger(
        tl,
        navLinks,
        { opacity: 1, y: 0, duration: DURATION.normal, ease: EASE.reveal },
        STAGGER.tight,
        'tight',
      )
    }
  }

  const hasHero = document.querySelector('[data-dc-hero]')
  const hasProduct = document.querySelector('[data-dc-product-root]')
  const main = document.getElementById('MainContent')
  if (main && !hasHero && !hasProduct && !main.dataset.dcEntrancePlayed) {
    main.dataset.dcEntrancePlayed = '1'

    const blocks = main.querySelectorAll(':scope > section, :scope > .shopify-section')
    const targets = blocks.length > 1 ? Array.from(blocks).slice(0, 4) : [main]

    gsap.set(targets, { opacity: 0, y: 16 })
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: DURATION.slow,
      ease: EASE.reveal,
      stagger: cappedStagger(targets.length, STAGGER.section),
      delay: 0.1,
    })
  }
}
