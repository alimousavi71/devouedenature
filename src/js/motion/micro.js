import gsap from 'gsap'
import { DURATION, EASE, shouldAnimate, isFinePointer, STAGGER } from './tokens.js'
import { initSuperButtons } from './buttons.js'
import { initAccordions } from './accordions.js'

/** Micro translateY depths (px) */
const LIFT = {
  link: -3,
  cardMedia: -10,
  cardMeta: -6,
  cardSub: -4,
}

/**
 * Luxury micro-interactions — buttons, links, cards, accordions, navigation.
 */
export function initMicro(root = document) {
  initAccordions(root)

  if (!shouldAnimate()) return

  initSuperButtons(root)
  initLinkMicro(root)
  initVariantMicro(root)
  initGalleryThumbMicro(root)
  initFilterPillMicro(root)
  initSaveToggleMicro(root)
  initFooterMotion(root)

  if (isFinePointer()) {
    initProductCardHover(root)
    initSimpleCardHover(root)
    initLiftHover(root)
    initEditorialImageHover(root)
  }
}

function bindOnce(el, key, fn) {
  const attr = `dcMicro${key}`
  if (el.dataset[attr]) return
  el.dataset[attr] = '1'
  fn(el)
}

function initLinkMicro(root) {
  if (!isFinePointer()) return
  root.querySelectorAll('.dc-link:not([data-dc-nav-link])').forEach((link) => {
    bindOnce(link, 'Link', (el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(el, { y: LIFT.link, duration: DURATION.fast, ease: EASE.luxury, overwrite: 'auto' })
      })
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { y: 0, duration: DURATION.normal, ease: EASE.reveal, overwrite: 'auto' })
      })
    })
  })
}

function initVariantMicro(root) {
  root.querySelectorAll('[data-dc-option-value]').forEach((btn) => {
    bindOnce(btn, 'Variant', (el) => {
      el.addEventListener('click', () => {
        gsap.fromTo(
          el,
          { scale: 1 },
          { scale: 0.95, duration: DURATION.micro, yoyo: true, repeat: 1, ease: EASE.luxury }
        )
      })
    })
  })
}

function initGalleryThumbMicro(root) {
  root.querySelectorAll('[data-dc-gallery-thumb]').forEach((thumb) => {
    bindOnce(thumb, 'Thumb', (el) => {
      el.addEventListener('click', () => {
        gsap.fromTo(
          el,
          { scale: 1, opacity: 1 },
          { scale: 0.92, opacity: 0.85, duration: DURATION.micro, yoyo: true, repeat: 1, ease: EASE.luxury }
        )
      })
    })
  })
}

function initFilterPillMicro(root) {
  root.querySelectorAll('[data-dc-filter-pill]').forEach((pill) => {
    bindOnce(pill, 'Filter', (el) => {
      el.addEventListener('click', () => {
        gsap.fromTo(
          el,
          { scale: 1 },
          { scale: 0.93, duration: DURATION.micro, yoyo: true, repeat: 1, ease: EASE.luxury }
        )
      })
    })
  })
}

function initSaveToggleMicro(root) {
  root.querySelectorAll('[data-dc-save-toggle]').forEach((btn) => {
    bindOnce(btn, 'Save', (el) => {
      el.addEventListener('click', () => {
        gsap.fromTo(
          el,
          { scale: 1 },
          { scale: 0.9, duration: DURATION.micro, yoyo: true, repeat: 1, ease: EASE.luxury }
        )
      })
    })
  })
}

function initFooterMotion(root) {
  if (!isFinePointer()) return
  root.querySelectorAll('.dc-footer-link').forEach((link) => {
    bindOnce(link, 'Footer', (el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(el, { x: 3, opacity: 1, duration: DURATION.normal, ease: EASE.luxury, overwrite: 'auto' })
      })
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, duration: DURATION.slow, ease: EASE.reveal, overwrite: 'auto' })
      })
    })
  })
}

function initProductCardHover(root) {
  root.querySelectorAll('.dc-product-card:not([data-dc-card-motion])').forEach((card) => {
    card.dataset.dcCardMotion = '1'
    const media = card.querySelector('.dc-product-card__media')
    const meta = card.querySelector('.dc-product-card__meta')
    const note = card.querySelector('.dc-product-card__note')
    const save = card.querySelector('.dc-product-card__save')
    if (!media) return

    card.addEventListener('mouseenter', () => {
      const tl = gsap.timeline({ defaults: { ease: EASE.luxury, overwrite: 'auto' } })
      tl.to(media, { y: LIFT.cardMedia, duration: DURATION.slow }, 0)
      if (meta) tl.to(meta, { y: LIFT.cardMeta, duration: DURATION.slow }, STAGGER.micro)
      if (note) tl.to(note, { opacity: 1, y: LIFT.cardSub, duration: DURATION.normal, ease: EASE.reveal }, STAGGER.tight)
      if (save) tl.to(save, { opacity: 1, y: LIFT.cardSub, duration: DURATION.normal }, STAGGER.tight + STAGGER.micro)
    })
    card.addEventListener('mouseleave', () => {
      gsap.to(media, { y: 0, duration: DURATION.slow, ease: EASE.reveal, overwrite: 'auto' })
      if (meta) gsap.to(meta, { y: 0, duration: DURATION.slow, ease: EASE.reveal, overwrite: 'auto' })
      if (note) gsap.to(note, { y: 0, duration: DURATION.normal, ease: EASE.reveal, overwrite: 'auto' })
      if (save) gsap.to(save, { y: 0, duration: DURATION.normal, ease: EASE.reveal, overwrite: 'auto' })
    })
  })
}

/** Lineup / discover / about cards — lift + image scale (product-card language) */
function initSimpleCardHover(root) {
  root.querySelectorAll('[data-dc-card-hover]:not([data-dc-card-motion])').forEach((card) => {
    card.dataset.dcCardMotion = '1'

    const media = card.querySelector(
      '.dc-lineup-card__media, .dc-discover-card__media, .dc-about-member__media',
    )
    const meta = card.querySelector(
      '.dc-lineup-card__meta, .dc-discover-card__meta, .dc-about-member__meta',
    )
    const img = card.querySelector(
      '.dc-lineup-card__img, .dc-discover-card__img, .dc-about-member__img',
    )
    if (!media) return

    gsap.set(img || media, { transformOrigin: '50% 50%', force3D: true })

    card.addEventListener('mouseenter', () => {
      const tl = gsap.timeline({ defaults: { ease: EASE.luxury, overwrite: 'auto' } })
      tl.to(card, { y: LIFT.cardMeta, duration: DURATION.slow }, 0)
      if (img) {
        tl.to(img, { scale: 1.06, duration: DURATION.slow }, 0)
      } else {
        tl.to(media, { scale: 1.03, duration: DURATION.slow }, 0)
      }
      if (meta) {
        tl.to(meta, { y: LIFT.cardSub, duration: DURATION.slow }, STAGGER.micro)
      }
    })

    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, duration: DURATION.slow, ease: EASE.reveal, overwrite: 'auto' })
      if (img) {
        gsap.to(img, { scale: 1, duration: DURATION.editorial, ease: EASE.reveal, overwrite: 'auto' })
      } else {
        gsap.to(media, { scale: 1, duration: DURATION.editorial, ease: EASE.reveal, overwrite: 'auto' })
      }
      if (meta) {
        gsap.to(meta, { y: 0, duration: DURATION.slow, ease: EASE.reveal, overwrite: 'auto' })
      }
    })
  })
}

/** Soft lift for text cards / pillars without media */
function initLiftHover(root) {
  root.querySelectorAll('[data-dc-lift-hover]:not([data-dc-lift-bound])').forEach((el) => {
    el.dataset.dcLiftBound = '1'
    el.addEventListener('mouseenter', () => {
      gsap.to(el, { y: LIFT.cardSub, duration: DURATION.slow, ease: EASE.luxury, overwrite: 'auto' })
    })
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { y: 0, duration: DURATION.slow, ease: EASE.reveal, overwrite: 'auto' })
    })
  })
}

function initEditorialImageHover(root) {
  root.querySelectorAll('[data-dc-editorial-img] img').forEach((img) => {
    if (img.dataset.dcImgHover) return
    img.dataset.dcImgHover = '1'
    const wrap = img.closest('a, figure, div') || img
    wrap.addEventListener('mouseenter', () => {
      gsap.to(img, { scale: 1.03, duration: DURATION.slow, ease: EASE.luxury, overwrite: 'auto' })
    })
    wrap.addEventListener('mouseleave', () => {
      gsap.to(img, { scale: 1, duration: DURATION.editorial, ease: EASE.reveal, overwrite: 'auto' })
    })
  })
}
