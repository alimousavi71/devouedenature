import gsap from 'gsap'
import { DURATION, EASE, shouldAnimate, isFinePointer } from './tokens.js'

/** Super-micro button motion depths */
const BTN = {
  hoverY: -4,
  hoverScale: 1.014,
  pressScale: 0.968,
  pressY: 2,
  labelHoverX: 5,
  labelHoverY: -2,
  labelPressX: 2,
  labelSpacingHover: '0.22em',
  labelSpacingRest: '0.16em',
}

const SELECTOR = '.dc-btn, .sweep-cta, [data-dc-btn-micro]'

function getLabel(el) {
  return el.querySelector('.sweep-cta__label, .dc-btn__label') || el
}

function isDisabled(el) {
  return el.disabled || el.getAttribute('aria-disabled') === 'true'
}

/**
 * Luxury super-micro interactions for all theme buttons.
 * Press · hover lift · label drift · letter-spacing breathe
 */
export function initSuperButtons(root = document) {
  if (!shouldAnimate()) return

  root.querySelectorAll(SELECTOR).forEach((el) => {
    if (el.dataset.dcBtnMotion || isDisabled(el)) return
    el.dataset.dcBtnMotion = '1'

    const label = getLabel(el)
    const fine = isFinePointer()

    const toHover = () => {
      gsap.to(el, {
        y: BTN.hoverY,
        scale: BTN.hoverScale,
        duration: DURATION.normal,
        ease: EASE.luxury,
        overwrite: 'auto',
      })
      gsap.to(label, {
        x: BTN.labelHoverX,
        y: BTN.labelHoverY,
        letterSpacing: BTN.labelSpacingHover,
        duration: DURATION.normal,
        ease: EASE.luxury,
        overwrite: 'auto',
      })
    }

    const toRest = () => {
      gsap.to(el, {
        y: 0,
        scale: 1,
        duration: DURATION.slow,
        ease: EASE.reveal,
        overwrite: 'auto',
      })
      gsap.to(label, {
        x: 0,
        y: 0,
        letterSpacing: BTN.labelSpacingRest,
        duration: DURATION.slow,
        ease: EASE.reveal,
        overwrite: 'auto',
      })
    }

    if (fine) {
      el.addEventListener('mouseenter', toHover)
      el.addEventListener('mouseleave', toRest)
      el.addEventListener('focusin', toHover)
      el.addEventListener('focusout', (event) => {
        if (!el.contains(event.relatedTarget)) toRest()
      })
    }

    el.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || isDisabled(el)) return
      gsap.to(el, {
        scale: BTN.pressScale,
        y: BTN.pressY,
        duration: DURATION.micro,
        ease: EASE.micro,
        overwrite: 'auto',
      })
      gsap.to(label, {
        x: BTN.labelPressX,
        y: 0,
        duration: DURATION.micro,
        ease: EASE.micro,
        overwrite: 'auto',
      })
    })

    const onRelease = () => {
      if (isDisabled(el)) return
      if (fine && el.matches(':hover')) {
        gsap.to(el, {
          scale: BTN.hoverScale,
          y: BTN.hoverY,
          duration: DURATION.fast,
          ease: EASE.luxury,
          overwrite: 'auto',
        })
        gsap.to(label, {
          x: BTN.labelHoverX,
          y: BTN.labelHoverY,
          letterSpacing: BTN.labelSpacingHover,
          duration: DURATION.fast,
          ease: EASE.luxury,
          overwrite: 'auto',
        })
      } else {
        gsap.to(el, {
          scale: 1,
          y: 0,
          duration: DURATION.fast,
          ease: EASE.luxury,
          overwrite: 'auto',
        })
        gsap.to(label, {
          x: 0,
          y: 0,
          duration: DURATION.fast,
          ease: EASE.luxury,
          overwrite: 'auto',
        })
      }
    }

    el.addEventListener('pointerup', onRelease)
    el.addEventListener('pointercancel', onRelease)
  })
}
