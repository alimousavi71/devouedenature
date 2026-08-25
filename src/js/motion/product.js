import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { DURATION, EASE, prefersReducedMotion } from './tokens.js'
import { staggerEach } from './stagger.js'

const RISE = 40
const RISE_GALLERY = 56

/**
 * Product PDP entrance — above-the-fold, no scroll dependency.
 */
export function initProductEntrance(root = document) {
  const productRoot = root.querySelector('[data-dc-product-root]:not([data-dc-product-played])')
  if (!productRoot || prefersReducedMotion()) return

  productRoot.setAttribute('data-dc-product-played', '1')

  productRoot.querySelectorAll('[data-reveal]').forEach((el) => {
    el.setAttribute('data-revealed', '1')
    gsap.set(el, { clearProps: 'all' })
  })

  const gallery = productRoot.querySelector('[data-dc-product-gallery]')
  const buyItems = productRoot.querySelectorAll('[data-dc-product-item]')
  const tl = gsap.timeline({
    defaults: { ease: EASE.luxury },
    onComplete: () => ScrollTrigger.refresh(),
  })

  if (gallery) {
    gsap.set(gallery, { opacity: 0, y: RISE_GALLERY, scale: 0.96 })
    tl.to(
      gallery,
      { opacity: 1, y: 0, scale: 1, duration: DURATION.cinematic, ease: EASE.reveal },
      0.08,
    )
  }

  if (buyItems.length) {
    gsap.set(buyItems, { opacity: 0, y: RISE })
    tl.to(
      buyItems,
      {
        opacity: 1,
        y: 0,
        duration: DURATION.slow,
        ease: EASE.luxury,
        stagger: staggerEach(buyItems.length, 'section'),
      },
      gallery ? 0.22 : 0.08,
    )
  }
}
