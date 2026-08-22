import { animateDrawerOpen, animateDrawerClose } from '../motion/drawers.js'

// Generic open/close/focus-trap dialog — GSAP drawer motion via motion/drawers.
// Markup:
//   <div id="X" data-dc-dialog class="hidden" data-dc-drawer-from="left">
//     <div class="dc-dialog__scrim" data-dc-dialog-close></div>
//     <div class="dc-dialog__panel">...</div>
//   </div>
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export class Dialog {
  constructor(el) {
    this.el = el
    this.panel = el.querySelector('.dc-dialog__panel') || el
    this.scrim = el.querySelector('.dc-dialog__scrim')
    this.from = el.getAttribute('data-dc-drawer-from') || 'left'
    this.lastFocused = null
    this.onKeydown = this.onKeydown.bind(this)
    this._closing = false

    el.querySelectorAll('[data-dc-dialog-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.close())
    })
  }

  open() {
    this._closing = false
    this.lastFocused = document.activeElement
    animateDrawerOpen({
      root: this.el,
      panel: this.panel,
      scrim: this.scrim,
      from: this.from,
      onComplete: () => {
        document.addEventListener('keydown', this.onKeydown)
        const focusable = this.panel.querySelectorAll(FOCUSABLE)
        if (focusable.length) focusable[0].focus()
      },
    })
  }

  close() {
    if (this._closing) return
    this._closing = true
    document.removeEventListener('keydown', this.onKeydown)
    animateDrawerClose({
      root: this.el,
      panel: this.panel,
      scrim: this.scrim,
      to: this.from,
      onComplete: () => {
        this._closing = false
        if (this.lastFocused) this.lastFocused.focus()
      },
    })
  }

  onKeydown(event) {
    if (event.key === 'Escape') {
      this.close()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = Array.from(this.panel.querySelectorAll(FOCUSABLE))
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}

export function initDialogs(root = document) {
  const dialogs = new Map()

  root.querySelectorAll('[data-dc-dialog]').forEach((el) => {
    if (el.dataset.dcDialogBound) return
    el.dataset.dcDialogBound = '1'
    dialogs.set(el.id, new Dialog(el))
  })

  root.querySelectorAll('[data-dc-dialog-open]').forEach((trigger) => {
    if (trigger.dataset.dcDialogOpenBound) return
    trigger.dataset.dcDialogOpenBound = '1'
    trigger.addEventListener('click', () => {
      const dialog = dialogs.get(trigger.getAttribute('data-dc-dialog-open'))
      if (dialog) dialog.open()
    })
  })

  return dialogs
}
