import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { STAGGER, cappedStagger, prefersReducedMotion } from './tokens.js'

/** Resolve stagger preset → GSAP stagger config */
export function staggerEach(count, preset = 'normal') {
  const each = STAGGER[preset] ?? STAGGER.normal
  return cappedStagger(count, each)
}

/** Add a staggered `.to()` on a timeline */
export function timelineStagger(timeline, targets, vars, position = 0, preset = 'normal') {
  const list = gsap.utils.toArray(targets).filter(Boolean)
  if (!list.length || !timeline) return timeline

  return timeline.to(
    list,
    {
      ...vars,
      stagger: staggerEach(list.length, preset),
    },
    position,
  )
}

/** Play once — safe for elements already in viewport on load */
export function createScrollReveal({
  trigger,
  targets,
  from = {},
  to = {},
  preset = 'normal',
  start = 'top 85%',
  once = true,
  onComplete,
  marker,
  playedAttr = 'data-reveal-played',
} = {}) {
  const list = gsap.utils.toArray(targets).filter(Boolean)
  if (!list.length || !trigger || prefersReducedMotion()) {
    if (!prefersReducedMotion()) gsap.set(list, to)
    list.forEach((el) => el?.setAttribute?.('data-revealed', '1'))
    onComplete?.(list)
    return null
  }

  if (trigger.getAttribute(playedAttr)) return null

  gsap.set(list, from)

  let played = false
  const play = () => {
    if (played) return
    played = true
    trigger.setAttribute(playedAttr, '1')

    gsap.to(list, {
      ...to,
      stagger: staggerEach(list.length, preset),
      overwrite: 'auto',
      onComplete: () => {
        list.forEach((el) => el?.setAttribute?.('data-revealed', '1'))
        onComplete?.(list)
      },
    })
  }

  const st = ScrollTrigger.create({
    trigger,
    start,
    once,
    markers: marker,
    onEnter: play,
    onEnterBack: once ? undefined : play,
  })

  if (st.isActive) play()

  return st
}

/** @deprecated alias */
export function scrollStaggerGroup(options) {
  return createScrollReveal(options)
}

/** Group direct sibling [data-reveal] nodes under one parent */
export function groupSiblingReveals(root, selector = '[data-reveal]') {
  const grouped = new Set()

  root.querySelectorAll(selector).forEach((el) => {
    if (el.hasAttribute('data-revealed') || el.closest('[data-reveal-stagger]')) return
    if (el.closest('[data-dc-product-root]')) return

    const parent = el.parentElement
    if (!parent || grouped.has(parent)) return

    const siblings = Array.from(parent.children).filter(
      (child) =>
        child.matches(selector) &&
        !child.hasAttribute('data-revealed') &&
        !child.closest('[data-reveal-stagger]'),
    )

    if (siblings.length < 2) return

    grouped.add(parent)
    siblings.forEach((s) => s.setAttribute('data-reveal-sibling', '1'))
  })

  return grouped
}
