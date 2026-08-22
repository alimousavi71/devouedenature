import gsap from 'gsap'
import { DURATION, EASE, prefersReducedMotion } from '../motion/tokens.js'

// Toast/notification — 3 variants per redesign/Overlays.dc.html:
// confirm (dark filled, "View basket" action), info (outlined, "Undo"),
// warning (outlined stock-warning). No scrim; stacks bottom-center.

const VARIANT_CLASSES = {
  confirm: 'bg-ink text-bg',
  info: 'bg-bg text-ink border border-border',
  warning: 'bg-bg text-error border border-error',
}

function ensureContainer() {
  let el = document.getElementById('DcToastContainer')
  if (!el) {
    el = document.createElement('div')
    el.id = 'DcToastContainer'
    el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center'
    document.body.appendChild(el)
  }
  return el
}

function showToast({ variant = 'confirm', message, actionLabel, onAction, undoLabel, onUndo } = {}) {
  const container = ensureContainer()
  const toast = document.createElement('div')
  toast.className = `flex items-center gap-4 px-4 py-3 font-body text-body-sm shadow-1 ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.confirm}`
  toast.setAttribute('role', 'status')

  const text = document.createElement('span')
  text.textContent = message
  toast.appendChild(text)

  const label = actionLabel || undoLabel
  const handler = onAction || onUndo
  if (label && handler) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'font-mono text-caption uppercase underline shrink-0'
    btn.textContent = label
    btn.addEventListener('click', () => {
      handler()
      dismissToast(toast)
    })
    toast.appendChild(btn)
  }

  container.appendChild(toast)

  if (prefersReducedMotion()) {
    window.setTimeout(() => dismissToast(toast), 5000)
    return
  }

  gsap.fromTo(
    toast,
    { opacity: 0, y: 20, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: DURATION.normal, ease: EASE.enter }
  )

  window.setTimeout(() => dismissToast(toast), 5000)
}

function dismissToast(toast) {
  if (!toast.isConnected) return
  if (prefersReducedMotion()) {
    toast.remove()
    return
  }
  gsap.to(toast, {
    opacity: 0,
    y: 12,
    scale: 0.98,
    duration: DURATION.normal,
    ease: EASE.exit,
    onComplete: () => toast.remove(),
  })
}

export function initToast() {
  document.addEventListener('dc:toast', (e) => showToast(e.detail))
}
