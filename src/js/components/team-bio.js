// Team member bios — native <dialog> View more panel (stay on About page).

export function initTeamBios(root = document) {
  root.querySelectorAll('[data-dc-team-bio-open]').forEach((trigger) => {
    if (trigger.dataset.dcTeamBioBound === '1') return
    trigger.dataset.dcTeamBioBound = '1'

    trigger.addEventListener('click', () => {
      const id = trigger.getAttribute('data-dc-team-bio-open')
      const dialog = id ? document.getElementById(id) : null
      if (!dialog || typeof dialog.showModal !== 'function') return
      dialog.showModal()
    })
  })

  root.querySelectorAll('[data-dc-team-bio]').forEach((dialog) => {
    if (dialog.dataset.dcTeamBioBound === '1') return
    dialog.dataset.dcTeamBioBound = '1'

    dialog.querySelectorAll('[data-dc-team-bio-close]').forEach((btn) => {
      btn.addEventListener('click', () => dialog.close())
    })

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close()
    })
  })
}
