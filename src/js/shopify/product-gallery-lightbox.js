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

function parseSources(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function applyItemToLayer(layer, item) {
  if (!layer || !item) return;
  layer.src = item.src;
  if (item.srcset) layer.srcset = item.srcset;
  else layer.removeAttribute("srcset");
  layer.alt = item.alt;
}

/**
 * Full-screen product media viewer — images + Shopify / external video.
 */
export class ProductGalleryLightbox {
  constructor(galleryRoot, { onIndexChange } = {}) {
    this.gallery = galleryRoot;
    this.lightbox = galleryRoot.querySelector("[data-dc-gallery-lightbox]");
    if (!this.lightbox) return;

    this.mountToBody();

    this.scrim = this.lightbox.querySelector("[data-dc-gallery-lightbox-scrim]");
    this.track = this.lightbox.querySelector("[data-dc-gallery-lightbox-track]");
    this.counter = this.lightbox.querySelector(
      "[data-dc-gallery-lightbox-counter]",
    );
    this.closeBtn = this.lightbox.querySelector(
      "[data-dc-gallery-lightbox-close-btn]",
    );
    this.video = this.lightbox.querySelector("[data-dc-gallery-lightbox-video]");
    this.external = this.lightbox.querySelector(
      "[data-dc-gallery-lightbox-external]",
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
    if (!this.lightbox || this.lightbox.dataset.dcLightboxMounted === "1")
      return;
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
        type: thumb.dataset.mediaType || "image",
        src: thumb.dataset.mediaSrcHires || thumb.dataset.mediaSrc || "",
        srcset:
          thumb.dataset.mediaSrcsetHires || thumb.dataset.mediaSrcset || "",
        alt: thumb.dataset.mediaAlt || "",
        sources: parseSources(thumb.dataset.mediaSources),
        external: thumb.dataset.mediaExternal || "",
      });
    });
    return Array.from(byIndex.values()).sort((a, b) => a.index - b.index);
  }

  getActiveIndex() {
    const current = this.gallery.querySelector(
      '[data-dc-gallery-thumb][aria-current="true"]',
    );
    if (current) return parseInt(current.dataset.index, 10);
    return 0;
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

  stopMedia() {
    if (this.video) {
      try {
        this.video.pause();
      } catch {
        /* noop */
      }
      this.video.removeAttribute("src");
      this.video.innerHTML = "";
      this.video.classList.add("hidden");
      this.video.load();
    }
    if (this.external) {
      this.external.innerHTML = "";
      this.external.classList.add("hidden");
    }
    this.track
      ?.querySelectorAll("[data-dc-gallery-lightbox-img]")
      .forEach((img) => {
        img.classList.remove("hidden");
      });
  }

  showItem(item, { animate = false, direction = 1 } = {}) {
    if (!item) return;

    this.stopMedia();

    if (item.type === "video") {
      this.track
        ?.querySelectorAll("[data-dc-gallery-lightbox-img]")
        .forEach((img) => img.classList.add("hidden"));
      if (this.video) {
        this.video.classList.remove("hidden");
        if (item.src) this.video.setAttribute("poster", item.src);
        this.video.innerHTML = item.sources
          .map(
            (source) =>
              `<source src="${source.url}" type="${source.type || "video/mp4"}">`,
          )
          .join("");
        this.video.load();
        this.video.muted = true;
        const play = this.video.play();
        if (play?.catch) play.catch(() => {});
      }
      this.onIndexChange?.(item.index);
      return;
    }

    if (item.type === "external_video") {
      this.track
        ?.querySelectorAll("[data-dc-gallery-lightbox-img]")
        .forEach((img) => img.classList.add("hidden"));
      if (this.external && item.external) {
        this.external.classList.remove("hidden");
        this.external.innerHTML = `<iframe src="${item.external}" class="absolute inset-0 w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${item.alt || "Product video"}"></iframe>`;
      }
      this.onIndexChange?.(item.index);
      return;
    }

    const layers = getLightboxLayers(this.lightbox);
    if (!layers) return;

    if (!animate) {
      applyItemToLayer(layers.active, item);
      this.onIndexChange?.(item.index);
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
        this.onIndexChange?.(item.index);
      },
    });
  }

  setImage(index, { animate = false, direction = 1 } = {}) {
    const item = this.items[index];
    if (!item) return;

    this.index = index;
    this.setCounter(index);
    this.showItem(item, { animate, direction });
  }

  step(delta) {
    if (this.items.length < 2 || this._sliding) return;
    const next = (this.index + delta + this.items.length) % this.items.length;
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
    this.setCounter(index);
    this.showItem(item);

    animateLightboxOpen({
      root: this.lightbox,
      scrim: this.scrim,
      image: item?.type === "image" ? layers?.active : this.video || this.external,
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
    const item = this.items[this.index];

    animateLightboxClose({
      root: this.lightbox,
      scrim: this.scrim,
      image: item?.type === "image" ? layers?.active : this.video || this.external,
      ui: this.getUiElements(),
      onComplete: () => {
        this.stopMedia();
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
