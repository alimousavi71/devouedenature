import { initReveal } from '../motion/reveal.js'
import { initMicro } from '../motion/micro.js'

class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    if (this.dataset.dcRecBound) return
    this.dataset.dcRecBound = '1'

    const load = () => {
      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const doc = document.createElement('div')
          doc.innerHTML = text
          const source = doc.querySelector('product-recommendations')
          if (source?.innerHTML.trim()) {
            this.innerHTML = source.innerHTML
            initReveal(this)
            initMicro(this)
          }
        })
        .catch(() => {})
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return
          observer.disconnect()
          load()
        },
        { rootMargin: '0px 0px 400px 0px' }
      )
      observer.observe(this)
    } else {
      load()
    }
  }
}

if (!customElements.get('product-recommendations')) {
  customElements.define('product-recommendations', ProductRecommendations)
}
