import { initReveal, initPageEntrance } from './reveal.js'
import { initMicro } from './micro.js'
import { initForms } from './forms.js'
import { initSmoothScroll } from './smooth-scroll.js'
import ScrollTrigger from 'gsap/ScrollTrigger'

/**
 * Canonical motion entry — orchestrates GSAP systems from one bundle.
 */
export function initMotion(root = document) {
  if (root === document) {
    initSmoothScroll()
    initPageEntrance()
  }
  initReveal(root)
  initMicro(root)
  initForms(root)
  if (root === document) {
    ScrollTrigger.refresh()
  }
}

export { initReveal, initPageEntrance } from './reveal.js'
export { animateDrawerOpen, animateDrawerClose } from './drawers.js'
export { initSmoothScroll, getLenis, getScrollY, stopSmoothScroll, startSmoothScroll } from './smooth-scroll.js'
export { DURATION, EASE, STAGGER, prefersReducedMotion, shouldAnimate } from './tokens.js'
export { staggerEach, timelineStagger, scrollStaggerGroup, createScrollReveal } from './stagger.js'
export { initAccordions } from './accordions.js'
export { initProductEntrance } from './product.js'
