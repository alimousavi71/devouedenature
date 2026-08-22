import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Luxury motion tokens — redesign/DesignSystem.dc.html
 * Durations tuned for editorial pacing; eases use bespoke cubic-bezier curves.
 */
export const DURATION = {
  micro: 0.14,
  fast: 0.2,
  normal: 0.38,
  slow: 0.62,
  editorial: 1.05,
  cinematic: 1.35,
}

export const STAGGER = {
  micro: 0.04,
  tight: 0.05,
  normal: 0.09,
  loose: 0.12,
  hero: 0.06,
  overlay: 0.06,
  section: 0.08,
  maxItems: 20,
}

/** Editorial rise distance (px) */
export const RISE = 36
export const RISE_SUBTLE = 18
export const IMAGE_SCALE = 1.06

/**
 * Professional easing library — cubic-bezier curves + GSAP presets.
 * editorial ≈ DesignSystem cubic-bezier(0.22, 0.61, 0.36, 1)
 */
export const EASE = {
  micro: 'power4.out',
  fast: 'power3.out',
  normal: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  slow: 'cubic-bezier(0.16, 1, 0.3, 1)',
  editorial: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  luxury: 'cubic-bezier(0.19, 1, 0.22, 1)',
  reveal: 'cubic-bezier(0.16, 1, 0.3, 1)',
  drawer: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  enter: 'expo.out',
  exit: 'power2.in',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  scrub: 'none',
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function shouldAnimate() {
  return !prefersReducedMotion()
}

export function isFinePointer() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function killTriggers(root = document) {
  ScrollTrigger.getAll().forEach((st) => {
    const trigger = st.trigger
    if (!trigger) return
    if (root === document || root.contains(trigger)) st.kill()
  })
}

export function cappedStagger(count, each = STAGGER.normal) {
  const capped = Math.min(Math.max(count, 1), STAGGER.maxItems)
  return capped <= 1 ? each : { each, amount: Math.min(capped * each, 0.72) }
}
