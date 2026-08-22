// New product-form behavior — variant selection, quantity, add-to-cart.
// Does not reuse the old product-form.js/quick-add.js; fresh implementation
// wired to sections/dc-product.liquid + snippets/dc-variant-selector.liquid.
// Dispatches dc:cart:add, already handled by src/js/shopify/cart.js.

import gsap from "gsap";
import { DURATION, EASE, prefersReducedMotion } from "../motion/tokens.js";
import { initProductGalleryLightbox } from "./product-gallery-lightbox.js";

function formatMoney(cents) {
  try {
    return new Intl.NumberFormat(document.documentElement.lang || undefined, {
      style: "currency",
      currency: window.Shopify?.currency?.active || "USD",
    }).format((cents || 0) / 100);
  } catch (e) {
    return `${((cents || 0) / 100).toFixed(2)}`;
  }
}

function findVariant(product, selections) {
  return product.variants.find((variant) =>
    variant.options.every((value, index) => value === selections[index]),
  );
}

function preloadImage(src, srcset) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    if (srcset) img.srcset = srcset;
    img.src = src;
  });
}

function getGalleryLayers(root) {
  const main = root.querySelector("[data-dc-gallery-main]");
  if (!main) return null;
  const layers = main.querySelectorAll("[data-dc-gallery-img]");
  if (layers.length < 2) return null;
  const active =
    main.querySelector("[data-dc-gallery-img][data-dc-gallery-active]") ||
    layers[0];
  const next = active === layers[0] ? layers[1] : layers[0];
  return { main, layers, active, next };
}

function imagePath(url) {
  if (!url) return "";
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return String(url).split("?")[0];
  }
}

class DcProductForm {
  constructor(root) {
    if (root.dataset.dcProductFormBound) return;
    root.dataset.dcProductFormBound = "1";

    this.root = root;
    const json = root.querySelector("[data-dc-product-json]");
    if (!json) return;
    this.product = JSON.parse(json.textContent);

    this.form = root.querySelector("[data-dc-product-form]");
    this.variantInput = root.querySelector("[data-dc-variant-id]");
    this.submitBtn = root.querySelector("#dc-add-to-bag");
    this.addLabel = this.form?.dataset.dcAddLabel || "Add to the bag";
    this.addedLabel = this.form?.dataset.dcAddedLabel || "Added to your bag";
    this.inStockMessage =
      this.form?.dataset.dcInStock || "In stock — ships within 48 hours";
    this.soldOutMessage = this.form?.dataset.dcSoldOut || "Sold out";
    this.priceEl = root.querySelector("[data-dc-price-value]");
    this.comparePriceEl = root.querySelector("[data-dc-compare-price]");
    this.stockDot = root.querySelector("[data-dc-stock-dot]");
    this.stockLabel = root.querySelector("[data-dc-stock-label]");
    this.qtyInput = root.querySelector("#dc-product-qty");
    this.savedBtn = root.querySelector("[data-dc-toggle-saved]");
    this.activeSizeEl = root.querySelector("[data-dc-active-size]");
    this.galleryTransition = null;

    this.selections =
      (
        this.product.selected_or_first_available_variant ||
        this.product.variants[0]
      )?.options || [];

    this.bindOptions();
    this.bindGalleryThumbs();
    this.bindGalleryLightbox();
    this.bindForm();
    this.bindSaved();
    this.updateOptionAvailability();
    this.onVariantChange();
  }

  bindOptions() {
    this.root.querySelectorAll("[data-dc-option-index]").forEach((group) => {
      const index = parseInt(group.dataset.dcOptionIndex, 10);
      group.querySelectorAll("[data-dc-option-value]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.selections[index] = btn.dataset.value;
          group
            .querySelectorAll("[data-dc-option-value]")
            .forEach((b) => b.removeAttribute("data-selected"));
          btn.setAttribute("data-selected", "true");
          this.onVariantChange();
          this.updateOptionAvailability();
        });
      });
    });
  }

  // Disables option buttons whose combination (with the currently-selected
  // other options) matches no available variant — e.g. a sold-out size for
  // the currently-selected color. Matches redesign/ProductStates.dc.html's
  // "variant unavailable" state; the disabled: Tailwind variant on the
  // button already carries the struck-through/muted visual.
  updateOptionAvailability() {
    this.root.querySelectorAll("[data-dc-option-index]").forEach((group) => {
      const index = parseInt(group.dataset.dcOptionIndex, 10);
      group.querySelectorAll("[data-dc-option-value]").forEach((btn) => {
        const combo = this.selections.slice();
        combo[index] = btn.dataset.value;
        const match = this.product.variants.find((variant) =>
          variant.options.every((value, i) => value === combo[i]),
        );
        btn.disabled = !(match && match.available);
      });
    });
  }

  onVariantChange() {
    const variant = findVariant(this.product, this.selections);
    if (!variant) {
      if (this.submitBtn) this.submitBtn.toggleAttribute("disabled", true);
      return;
    }

    if (this.variantInput) this.variantInput.value = variant.id;
    if (this.priceEl) this.priceEl.textContent = formatMoney(variant.price);
    if (this.comparePriceEl) {
      if (variant.compare_at_price > variant.price) {
        this.comparePriceEl.textContent = formatMoney(variant.compare_at_price);
        this.comparePriceEl.classList.remove("hidden");
      } else {
        this.comparePriceEl.classList.add("hidden");
      }
    }
    if (this.stockDot)
      this.stockDot.style.background = variant.available
        ? "#6E7F5B"
        : "#A03B2A";
    if (this.stockLabel)
      this.stockLabel.textContent = variant.available
        ? this.inStockMessage
        : this.soldOutMessage;
    if (this.submitBtn)
      this.submitBtn.toggleAttribute("disabled", !variant.available);
    if (this.activeSizeEl) this.activeSizeEl.textContent = variant.title;

    if (variant.featured_image?.src) {
      this.crossfadeMainImage(variant.featured_image.src);
    }

    const url = new URL(window.location.href);
    url.searchParams.set("variant", variant.id);
    window.history.replaceState({}, "", url);
  }

  bindGalleryThumbs() {
    this.root.querySelectorAll("[data-dc-gallery-thumb]").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const index = parseInt(thumb.dataset.index, 10);
        this.goToGalleryIndex(index, thumb);
      });
    });
  }

  goToGalleryIndex(index, thumbEl) {
    const thumb =
      thumbEl ||
      this.root.querySelector(`[data-dc-gallery-thumb][data-index="${index}"]`);
    if (!thumb) return;

    const src =
      thumb.dataset.mediaSrc ||
      this.product.media?.[index]?.preview_image?.src ||
      this.product.media?.[index]?.src;

    if (src) {
      this.crossfadeMainImage(src, thumb.dataset.mediaSrcset);
    }

    this.root.querySelectorAll("[data-dc-gallery-thumb]").forEach((t) => {
      const active = parseInt(t.dataset.index, 10) === index;
      t.classList.toggle("border-ink", active);
      t.classList.toggle("border-transparent", !active);
      if (active) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
    });
  }

  bindGalleryLightbox() {
    const gallery = this.root.querySelector("[data-dc-gallery-wrap]");
    if (!gallery || gallery.dataset.dcLightboxBound === "1") return;
    gallery.dataset.dcLightboxBound = "1";

    this.galleryLightbox = initProductGalleryLightbox(gallery, {
      onIndexChange: (index) => this.goToGalleryIndex(index),
    });
  }

  crossfadeMainImage(src, srcset) {
    if (!src) return;

    if (this.galleryTransition) {
      this.galleryTransition.kill();
      this.galleryTransition = null;
    }

    const gallery = getGalleryLayers(this.root);
    if (!gallery) return;

    gsap.killTweensOf(gallery.layers);
    gallery.layers.forEach((layer) => {
      const isActive = layer.hasAttribute("data-dc-gallery-active");
      gsap.set(layer, { opacity: isActive ? 1 : 0, clearProps: "transform" });
      layer.classList.toggle("opacity-0", !isActive);
      layer.classList.toggle("pointer-events-none", !isActive);
    });

    const active =
      gallery.main.querySelector(
        "[data-dc-gallery-img][data-dc-gallery-active]",
      ) || gallery.layers[0];
    const next =
      active === gallery.layers[0] ? gallery.layers[1] : gallery.layers[0];

    const currentPath = imagePath(active.currentSrc || active.src);
    const nextPath = imagePath(src);
    if (currentPath === nextPath) return;

    const swapLayers = () => {
      next.src = src;
      if (srcset) next.srcset = srcset;
      else next.removeAttribute("srcset");
      if (active.alt) next.alt = active.alt;

      gsap.killTweensOf(gallery.layers);
      gsap.set(active, { opacity: 1, clearProps: "transform" });
      gsap.set(next, { opacity: 0, scale: 1.02, clearProps: "transform" });

      if (prefersReducedMotion()) {
        active.removeAttribute("data-dc-gallery-active");
        active.setAttribute("aria-hidden", "true");
        active.classList.add("opacity-0", "pointer-events-none");
        next.setAttribute("data-dc-gallery-active", "");
        next.removeAttribute("aria-hidden");
        next.classList.remove("opacity-0", "pointer-events-none");
        gsap.set(active, { opacity: 0 });
        gsap.set(next, { opacity: 1 });
        return;
      }

      this.galleryTransition = gsap.timeline({
        defaults: { duration: DURATION.normal, ease: EASE.editorial },
        onComplete: () => {
          active.removeAttribute("data-dc-gallery-active");
          active.setAttribute("aria-hidden", "true");
          active.classList.add("opacity-0", "pointer-events-none");
          next.setAttribute("data-dc-gallery-active", "");
          next.removeAttribute("aria-hidden");
          next.classList.remove("opacity-0", "pointer-events-none");
          gsap.set(active, { opacity: 0 });
          gsap.set(next, { opacity: 1 });
          this.galleryTransition = null;
        },
      });

      this.galleryTransition.to(active, { opacity: 0, scale: 0.995 }, 0);
      this.galleryTransition.to(next, { opacity: 1, scale: 1 }, 0);
    };

    preloadImage(src, srcset).then(swapLayers);
  }

  bindForm() {
    if (!this.form) return;
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const quantity = parseInt(this.qtyInput?.value || "1", 10);
      if (this.submitBtn && !prefersReducedMotion()) {
        gsap.fromTo(
          this.submitBtn,
          { scale: 1 },
          {
            scale: 0.985,
            duration: DURATION.micro,
            yoyo: true,
            repeat: 1,
            ease: EASE.fast,
          },
        );
      }
      document.dispatchEvent(
        new CustomEvent("dc:cart:add", {
          detail: {
            id: this.variantInput?.value,
            quantity,
          },
        }),
      );
      if (this.submitBtn) {
        const label = this.submitBtn.querySelector(".sweep-cta__label");
        if (label) {
          label.textContent = this.addedLabel;
          this.submitBtn.classList.add("bg-secondary");
          this.submitBtn.classList.remove("bg-ink");
          setTimeout(() => {
            label.textContent = this.addLabel;
            this.submitBtn.classList.remove("bg-secondary");
            this.submitBtn.classList.add("bg-ink");
          }, 2400);
        }
      }
    });
  }

  bindSaved() {
    if (!this.savedBtn) return;
    this.savedBtn.addEventListener("click", () => {
      // No native Shopify wishlist concept — out of scope, needs an app/metafield-backed
      // implementation. Left as a no-op affordance for now.
    });
  }
}

export function initProductForm(scope = document) {
  scope
    .querySelectorAll("[data-dc-product-root]")
    .forEach((root) => new DcProductForm(root));
}
