import Swiper from 'swiper'
import { FreeMode } from 'swiper/modules'
import 'swiper/css'

/**
 * FAQ tab panels — sections/dc-faq-tabs.liquid
 */
export function initFaqTabs(root = document) {
  root.querySelectorAll('[data-dc-faq-tabs]:not([data-dc-faq-tabs-bound])').forEach((section) => {
    section.dataset.dcFaqTabsBound = '1'

    const tabs = Array.from(section.querySelectorAll('[data-dc-faq-tab]'))
    const panels = Array.from(section.querySelectorAll('[data-dc-faq-panel]'))
    if (!tabs.length || !panels.length) return

    const mobileTabs = tabs.filter((tab) => tab.closest('[data-dc-faq-tabs-swiper]'))
    let swiper = null

    const swiperRoot = section.querySelector('[data-dc-faq-tabs-swiper] .swiper')
    if (swiperRoot && mobileTabs.length) {
      swiper = new Swiper(swiperRoot, {
        modules: [FreeMode],
        slidesPerView: 'auto',
        spaceBetween: 4,
        freeMode: {
          enabled: true,
          momentumBounce: false,
        },
      })
    }

    const activate = (id) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.dcFaqTab === id
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false')
        tab.classList.toggle('is-active', isActive)
      })

      panels.forEach((panel) => {
        const isActive = panel.dataset.dcFaqPanel === id
        panel.hidden = !isActive
        panel.classList.toggle('is-active', isActive)
      })

      if (swiper) {
        const index = mobileTabs.findIndex((tab) => tab.dataset.dcFaqTab === id)
        if (index >= 0) swiper.slideTo(index)
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        activate(tab.dataset.dcFaqTab)
      })
    })

    const initial = tabs.find((tab) => tab.classList.contains('is-active')) || tabs[0]
    if (initial) activate(initial.dataset.dcFaqTab)
  })
}
