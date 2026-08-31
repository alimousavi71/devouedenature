import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { DURATION, EASE, RISE_SUBTLE, STAGGER, prefersReducedMotion, cappedStagger } from './tokens.js'
import { scrollStaggerGroup } from './stagger.js'

/**
 * Editorial scroll scenes — campaign bands, section headings, image drift.
 */
export function initEditorial(root = document) {
  if (prefersReducedMotion()) return

  initSectionHeadings(root)
  initCampaignScenes(root)
  initEditorialImages(root)
}

/** Animate display headings + nearby label/copy as a stagger group */
function initSectionHeadings(root) {
  root.querySelectorAll('section:not([data-revealed])').forEach((section) => {
    const heading = section.querySelector(':scope > div h1, :scope > div h2, :scope > header h1, :scope > header h2')
    if (!heading || heading.closest('[data-reveal], [data-reveal-stagger]') || heading.dataset.dcHeadingPlayed) return
    if (!heading.classList.contains('font-display') && !heading.matches('[class*="text-h"], [class*="text-page-title"], [class*="text-[54px"], [class*="text-[32px"]')) return

    heading.dataset.dcHeadingPlayed = '1'

    const prev = heading.previousElementSibling
    const group =
      prev && !prev.closest('[data-reveal], [data-reveal-stagger]') && !prev.classList.contains('font-display')
        ? [prev, heading]
        : [heading]

    scrollStaggerGroup({
      trigger: heading,
      targets: group,
      from: { opacity: 0, y: RISE_SUBTLE },
      to: {
        opacity: 1,
        y: 0,
        duration: DURATION.editorial,
        ease: EASE.luxury,
      },
      preset: 'section',
      start: 'top 90%',
    })
  })
}

/** Full-bleed campaign / hero bands — subtle scale + opacity scrub */
function initCampaignScenes(root) {
  root.querySelectorAll('[data-dc-campaign], .dc-campaign-section').forEach((section) => {
    if (section.dataset.dcCampaignBound) return
    section.dataset.dcCampaignBound = '1'

    const inner = section.querySelector('[data-dc-campaign-inner]') || section.querySelector('h2, .font-display')
    const media = section.querySelector('img, video, [data-dc-hero-media]')
    const copyBlocks = section.querySelectorAll('[data-dc-campaign-copy], p, .font-mono')

    if (media) {
      gsap.fromTo(
        media,
        { scale: 1.08 },
        {
          scale: 1,
          ease: EASE.scrub,
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        },
      )
    }

    if (inner && !inner.hasAttribute('data-reveal-stagger')) {
      gsap.fromTo(
        inner,
        { y: 40, opacity: 0.6 },
        {
          y: 0,
          opacity: 1,
          ease: EASE.scrub,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'top 35%',
            scrub: 1,
          },
        },
      )
    }

    const staggerCopy = Array.from(copyBlocks).filter(
      (el) => el !== inner && !el.closest('[data-reveal], [data-reveal-stagger]'),
    )
    if (staggerCopy.length > 1) {
      scrollStaggerGroup({
        trigger: section,
        targets: staggerCopy.slice(0, STAGGER.maxItems),
        from: { opacity: 0, y: 12 },
        to: { opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.reveal },
        preset: 'tight',
        start: 'top 78%',
      })
    }
  })
}

/** Editorial images — gentle drift on scroll */
function initEditorialImages(root) {
  root.querySelectorAll('[data-dc-editorial-img]:not([data-dc-editorial-bound])').forEach((wrap) => {
    wrap.dataset.dcEditorialBound = '1'
    const img = wrap.querySelector('img') || wrap
    gsap.fromTo(
      img,
      { y: -20, scale: 1.04 },
      {
        y: 20,
        scale: 1,
        ease: EASE.scrub,
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      },
    )
  })
}

/** Split hero / display title into staggered words */
export function splitTitleWords(titleEl) {
  if (!titleEl || titleEl.dataset.dcSplit) {
    return titleEl?.querySelectorAll('[data-dc-split-word]') || []
  }
  titleEl.dataset.dcSplit = '1'
  const words = titleEl.textContent.trim().split(/\s+/).filter(Boolean)
  titleEl.innerHTML = words
    .map(
      (word) =>
        `<span class="dc-split-word"><span data-dc-split-word>${word}</span></span>`,
    )
    .join('')
  return titleEl.querySelectorAll('[data-dc-split-word]')
}

export function animateTitleWords(words, timeline, position = 0) {
  if (!words.length) return
  gsap.set(words, { y: '110%', opacity: 0 })
  timeline.to(
    words,
    {
      y: '0%',
      opacity: 1,
      duration: DURATION.editorial,
      stagger: cappedStagger(words.length, STAGGER.hero),
      ease: EASE.luxury,
    },
    position,
  )
}
