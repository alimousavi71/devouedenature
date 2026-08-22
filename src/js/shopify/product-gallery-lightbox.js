import {
  animateLightboxOpen,
  animateLightboxClose,
  animateLightboxSlide,
} from "../motion/lightbox.js";

function getLightboxLayers(root) {
  const track = root.querySelector("[data-dc-gallery-lightbox-track]");
  if (!track) return null;
  const layers = track.querySelectorAll("[data-dc-gallery-lightbox-img]");
  if (layers.length < 2) return null;
  const active =
    track.querySelector(
      "[data-dc-gallery-lightbox-img][data-dc-gallery-lightbox-active]",
    ) || layers[0];
  const next = active === layers[0] ? layers[1] : layers[0];
  return { track, layers, active, next };
}

function applyItemToLayer(layer, item) {
  if (!layer || !item) return;
  layer.src = item.src;
  if (item.srcset) layer.srcset = item.srcset;
  else layer.removeAttribute("srcset");
  layer.alt = item.alt;
}

/**
 * Full-screen product image viewer — portaled to body.
 */
export class ProductGalleryLightbox {
  constructor(galleryRoot, { onIndexChange } = {}) {
    this.gallery = galleryRoot;
    this.lightbox = galleryRoot.querySelector("[data-dc-gallery-lightbox]");
    if (!this.lightbox) return;

    this.mountToBody();

    this.scrim = this.lightbox.querySelector("[data-dc-gallery-lightbox-scrim]");
    this.track = this.lightbox.querySelector("[data-dc-gallery-lightbox-track]");
    this.counter = this.lightbox.querySelector("[data-dc-gallery-lightbox-counter]");
    this.closeBtn = this.lightbox.querySelector(
      "[data-dc-gallery-lightbox-close-btn]",
    );
    this.trigger = galleryRoot.querySelector("[data-dc-gallery-zoom]");
    this.onIndexChange = onIndexChange;

    this.items = this.collectItems();
    this.index = 0;
    this.isOpen = false;
    this._closing = false;
    this._sliding = false;
    this.lastFocused = null;

    this.onKeydown = this.onKeydown.bind(this);

    if (!this.items.length || !this.trigger) return;

    this.bind();
  }

  mountToBody() {
    if (!this.lightbox || this.lightbox.dataset.dcLightboxMounted === "1") return;
    document.body.appendChild(this.lightbox);
    this.lightbox.dataset.dcLightboxMounted = "1";
  }

  collectItems() {
    const byIndex = new Map();
    this.gallery.querySelectorAll("[data-dc-gallery-thumb]").forEach((thumb) => {
      const index = parseInt(thumb.dataset.index, 10);
      if (Number.isNaN(index) || byIndex.has(index)) return;
      byIndex.set(index, {
        index,
        src: thumb.dataset.mediaSrcHires || thumb.dataset.mediaSrc || "",
        srcset:
          thumb.dataset.mediaSrcsetHires || thumb.dataset.mediaSrcset || "",
        alt: thumb.dataset.mediaAlt || "",
      });
    });
    return Array.from(byIndex.values()).sort((a, b) => a.index - b.index);
  }

  getActiveIndex() {
    const current = this.gallery.querySelector(
      '[data-dc-gallery-thumb][aria-current="true"]',
    );
    if (current) return parseInt(current.dataset.index, 10);

    const activeImg = this.gallery.querySelector(
      "[data-dc-gallery-img][data-dc-gallery-active]",
    );
    if (!activeImg?.src) return 0;

    const activePath = activeImg.currentSrc || activeImg.src;
    const match = this.items.find((item) => {
      if (!item.src) return false;
      try {
        return (
          new URL(item.src, window.location.origin).pathname ===
          new URL(activePath, window.location.origin).pathname
        );
      } catch {
        return item.src === activePath;
      }
    });
    return match?.index ?? 0;
  }

  bind() {
    this.trigger.addEventListener("click", (event) => {
      event.preventDefault();
      this.open();
    });
    this.trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.open();
      }
    });

    this.scrim?.addEventListener("click", () => this.close());
    this.closeBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.close();
    });

    const prev = this.lightbox.querySelector("[data-dc-gallery-lightbox-prev]");
    const next = this.lightbox.querySelector("[data-dc-gallery-lightbox-next]");
    prev?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.step(-1);
    });
    next?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.step(1);
    });

    this.toggleNav(this.items.length > 1);
  }

  getUiElements() {
    return [
      this.closeBtn,
      this.lightbox.querySelector("[data-dc-gallery-lightbox-prev]"),
      this.lightbox.querySelector("[data-dc-gallery-lightbox-next]"),
      this.counter,
    ].filter((el) => el && !el.classList.contains("hidden"));
  }

  toggleNav(show) {
    const nav = this.lightbox.querySelector("[data-dc-gallery-lightbox-nav]");
    const prev = this.lightbox.querySelector("[data-dc-gallery-lightbox-prev]");
    const next = this.lightbox.querySelector("[data-dc-gallery-lightbox-next]");
    nav?.classList.toggle("hidden", !show);
    prev?.classList.toggle("hidden", !show);
    next?.classList.toggle("hidden", !show);
  }

  setCounter(index) {
    if (this.counter) {
      this.counter.textContent = `${index + 1} / ${this.items.length}`;
    }
  }

  setImage(index, { animate = false, direction = 1 } = {}) {
    const item = this.items[index];
    if (!item) return;

    this.index = index;
    this.setCounter(index);

    const layers = getLightboxLayers(this.lightbox);
    if (!layers) return;

    if (!animate) {
      applyItemToLayer(layers.active, item);
      this.onIndexChange?.(index);
      return;
    }

    if (this._sliding) return;
    this._sliding = true;

    applyItemToLayer(layers.next, item);

    animateLightboxSlide({
      outgoing: layers.active,
      incoming: layers.next,
      direction,
      onComplete: () => {
        layers.active.removeAttribute("data-dc-gallery-lightbox-active");
        layers.active.classList.add("opacity-0", "pointer-events-none");
        layers.active.setAttribute("aria-hidden", "true");

        layers.next.setAttribute("data-dc-gallery-lightbox-active", "");
        layers.next.classList.remove("opacity-0", "pointer-events-none");
        layers.next.removeAttribute("aria-hidden");

        this._sliding = false;
        this.onIndexChange?.(index);
      },
    });
  }

  step(delta) {
    if (this.items.length < 2 || this._sliding) return;
    const next =
      (this.index + delta + this.items.length) % this.items.length;
    this.setImage(next, { animate: true, direction: delta });
  }

  open() {
    if (this.isOpen || this._closing) return;
    this.isOpen = true;
    this.lastFocused = document.activeElement;

    const index = this.getActiveIndex();
    this.index = index;
    const item = this.items[index];
    const layers = getLightboxLayers(this.lightbox);
    if (layers && item) applyItemToLayer(layers.active, item);
    this.setCounter(index);

    animateLightboxOpen({
      root: this.lightbox,
      scrim: this.scrim,
      image: layers?.active,
      ui: this.getUiElements(),
      onComplete: () => {
        document.addEventListener("keydown", this.onKeydown);
        this.closeBtn?.focus();
      },
    });
  }

  close() {
    if (!this.isOpen || this._closing) return;
    this._closing = true;
    this.isOpen = false;
    document.removeEventListener("keydown", this.onKeydown);

    const layers = getLightboxLayers(this.lightbox);

    animateLightboxClose({
      root: this.lightbox,
      scrim: this.scrim,
      image: layers?.active,
      ui: this.getUiElements(),
      onComplete: () => {
        this._closing = false;
        if (this.lastFocused?.focus) this.lastFocused.focus();
      },
    });
  }

  onKeydown(event) {
    if (event.key === "Escape") {
      this.close();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.step(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.step(1);
    }
  }
}

export function initProductGalleryLightbox(galleryRoot, options) {
  return new ProductGalleryLightbox(galleryRoot, options);
}
