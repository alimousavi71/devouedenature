import Lenis from 'lenis'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from './tokens.js'

/** @type {Lenis | null} */
let lenis = null
/** @type {((time: number) => void) | null} */
let tickerCallback = null

/**
 * Lenis smooth scroll — synced with GSAP ScrollTrigger via gsap.ticker.
 * @see https://www.npmjs.com/package/lenis#gsap-scrolltrigger
 */
export function initSmoothScroll() {
  if (lenis || prefersReducedMotion()) return lenis

  const isCoarse = window.matchMedia('(pointer: coarse)').matches

  lenis = new Lenis({
    duration: isCoarse ? 0.85 : 1.1,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.85,
    touchMultiplier: isCoarse ? 1.2 : 1,
    autoRaf: false,
  })

  const scroller = document.documentElement

  lenis.on('scroll', () => {
    ScrollTrigger.update()
    document.dispatchEvent(new CustomEvent('dc:scroll'))
  })

  ScrollTrigger.scrollerProxy(scroller, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value, { immediate: true })
      }
      return lenis.scroll
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      }
    },
    pinType: scroller.style.transform ? 'transform' : 'fixed',
  })

  tickerCallback = (time) => {
    lenis?.raf(time * 1000)
  }
  gsap.ticker.add(tickerCallback)
  gsap.ticker.lagSmoothing(0)

  ScrollTrigger.addEventListener('refresh', () => lenis?.resize())
  ScrollTrigger.refresh()

  document.documentElement.classList.add('lenis', 'lenis-smooth')

  return lenis
}

export function getLenis() {
  return lenis
}

export function getScrollY() {
  return lenis?.scroll ?? window.scrollY ?? 0
}

/** Pause while drawers/modals lock body scroll */
export function stopSmoothScroll() {
  lenis?.stop()
}

export function startSmoothScroll() {
  lenis?.start()
}

export function destroySmoothScroll() {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback)
    tickerCallback = null
  }
  lenis?.destroy()
  lenis = null
  document.documentElement.classList.remove('lenis', 'lenis-smooth')
}
