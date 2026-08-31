import Swiper from 'swiper'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

/**
 * About recognition image carousel — sections/dc-about-recognition.liquid
 */
export function initRecognitionSwipers(root = document) {
  root.querySelectorAll('[data-dc-recognition-carousel]:not([data-dc-recognition-bound])').forEach((carousel) => {
    carousel.dataset.dcRecognitionBound = '1'

    const swiperEl = carousel.querySelector('.dc-recognition-swiper')
    const paginationEl = carousel.querySelector('[data-dc-recognition-pagination]')
    const slides = carousel.querySelectorAll('.swiper-slide')

    if (!swiperEl || slides.length < 2) return

    const autoplay = carousel.dataset.autoplay === 'true'
    const delay = Number(carousel.dataset.delay || 5000)
    const loop = carousel.dataset.loop !== 'false'
    const effect = carousel.dataset.effect === 'fade' ? 'fade' : 'slide'

    new Swiper(swiperEl, {
      modules: [Autoplay, Pagination, EffectFade],
      slidesPerView: 1,
      effect,
      fadeEffect: { crossFade: true },
      loop,
      speed: 700,
      autoplay: autoplay
        ? {
            delay,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }
        : false,
      pagination: paginationEl
        ? {
            el: paginationEl,
            clickable: true,
          }
        : undefined,
    })
  })
}
