import { initMotion } from './motion/index.js'
import { initHeader } from './components/header.js'
import { initCart } from './shopify/cart.js'
import { initToast } from './components/toast.js'
import { initProductForm } from './shopify/product-form.js'
import { initCollection } from './shopify/collection.js'
import { initCartPage } from './shopify/cart-page.js'
import { initSearch } from './shopify/search.js'
import { initFaqTabs } from './shopify/faq-tabs.js'
import { initLocalizationForms } from './components/localization-form.js'
import './components/quantity-input.js'
import './shopify/product-recommendations.js'

document.addEventListener('DOMContentLoaded', () => {
  initMotion()
  initHeader()
  initCart()
  initToast()
  initProductForm()
  initCollection()
  initCartPage()
  initSearch()
  initFaqTabs()
  initLocalizationForms()
})

// Sections re-rendered by the Shopify Theme Editor need reveal re-initialized.
document.addEventListener('shopify:section:load', (event) => {
  initMotion(event.target)
  initHeader(event.target)
  initProductForm(event.target)
  initCollection(event.target)
  initCartPage(event.target)
  initSearch(event.target)
  initFaqTabs(event.target)
  initLocalizationForms(event.target)
})
