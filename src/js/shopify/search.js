// Search page — loading skeleton crossfade + results entrance (Search.dc.html).

import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../motion/tokens.js'

function crossfadeSearchState(loading, content, showLoading) {
  if (prefersReducedMotion()) {
    loading.classList.toggle('hidden', !showLoading)
    loading.setAttribute('aria-hidden', String(!showLoading))
    content.classList.toggle('hidden', showLoading)
    return
  }

  gsap.killTweensOf([loading, content])

  if (showLoading) {
    loading.classList.remove('hidden')
    loading.setAttribute('aria-hidden', 'false')
    gsap.fromTo(
      loading,
      { opacity: 0 },
      { opacity: 1, duration: DURATION.normal, ease: EASE.luxury }
    )
    gsap.to(content, {
      opacity: 0,
      y: -8,
      duration: DURATION.normal,
      ease: EASE.exit,
      onComplete: () => content.classList.add('hidden'),
    })
    return
  }

  content.classList.remove('hidden')
  gsap.fromTo(
    content,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.reveal }
  )
  gsap.to(loading, {
    opacity: 0,
    duration: DURATION.normal,
    ease: EASE.exit,
    onComplete: () => {
      loading.classList.add('hidden')
      loading.setAttribute('aria-hidden', 'true')
      gsap.set(loading, { opacity: 1 })
    },
  })
}

export function initSearch(root = document) {
  root.querySelectorAll('[data-dc-search-form]').forEach((form) => {
    if (form.dataset.dcSearchBound) return
    form.dataset.dcSearchBound = '1'

    form.addEventListener('submit', () => {
      const page = document.querySelector('[data-dc-search-page]')
      const loading = page?.querySelector('[data-dc-search-loading]')
      const content = page?.querySelector('[data-dc-search-content]')
      const query = form.querySelector('[name="q"]')?.value?.trim()

      if (page && loading && content && query) {
        crossfadeSearchState(loading, content, true)
      }
    })
  })

  const input = root.querySelector('[data-dc-search-input]')
  if (input && !input.dataset.dcSearchFocusBound) {
    input.dataset.dcSearchFocusBound = '1'
    input.focus({ preventScroll: true })
  }

  const page = root.querySelector('[data-dc-search-page]') || document.querySelector('[data-dc-search-page]')
  const loading = page?.querySelector('[data-dc-search-loading]')
  if (loading && !loading.dataset.dcSkeletonBound && !prefersReducedMotion()) {
    loading.dataset.dcSkeletonBound = '1'
    gsap.to(loading.querySelectorAll('.dc-search-skeleton > div'), {
      opacity: 0.55,
      duration: 0.9,
      stagger: 0.08,
      repeat: -1,
      yoyo: true,
      ease: EASE.inOut,
    })
  }
}
