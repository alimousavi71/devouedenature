import gsap from "gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "./tokens.js";
import { staggerEach } from "./stagger.js";
import { stopSmoothScroll, startSmoothScroll } from "./smooth-scroll.js";

const UI_RISE = 10;

function resetUi(ui = []) {
  ui.forEach((el) => gsap.set(el, { clearProps: "opacity,transform" }));
}

/** DesignSystem overlay — scrim 320 ms, then image + UI stagger */
export function animateLightboxOpen({
  root,
  scrim,
  image,
  ui = [],
  onComplete,
} = {}) {
  if (!root) return;

  root.classList.remove("hidden");
  root.classList.add("is-open");
  root.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  stopSmoothScroll();

  const visibleUi = ui.filter(Boolean);

  if (prefersReducedMotion()) {
    if (scrim) gsap.set(scrim, { opacity: 1 });
    if (image) gsap.set(image, { opacity: 1, x: 0, scale: 1 });
    resetUi(visibleUi);
    onComplete?.();
    return;
  }

  gsap.killTweensOf([scrim, image, ...visibleUi].filter(Boolean));
  if (scrim) gsap.set(scrim, { opacity: 0 });
  if (image) gsap.set(image, { opacity: 0, x: 0, scale: 0.985 });
  gsap.set(visibleUi, { opacity: 0, y: UI_RISE });

  const tl = gsap.timeline({ onComplete });
  if (scrim) {
    tl.to(scrim, { opacity: 1, duration: 0.32, ease: EASE.normal }, 0);
  }
  if (image) {
    tl.to(
      image,
      { opacity: 1, scale: 1, duration: DURATION.slow, ease: EASE.reveal },
      STAGGER.overlay,
    );
  }
  if (visibleUi.length) {
    tl.to(
      visibleUi,
      {
        opacity: 1,
        y: 0,
        duration: DURATION.normal,
        ease: EASE.reveal,
        stagger: staggerEach(visibleUi.length, "tight"),
      },
      STAGGER.overlay + STAGGER.tight,
    );
  }

  root._dcLightboxTl = tl;
}

export function animateLightboxClose({
  root,
  scrim,
  image,
  ui = [],
  onComplete,
} = {}) {
  if (!root) return;

  const visibleUi = ui.filter(Boolean);

  const finish = () => {
    root.classList.add("hidden");
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    startSmoothScroll();
    if (scrim) gsap.set(scrim, { clearProps: "opacity" });
    if (image) gsap.set(image, { clearProps: "opacity,transform" });
    resetUi(visibleUi);
    onComplete?.();
  };

  if (prefersReducedMotion()) {
    finish();
    return;
  }

  if (root._dcLightboxTl) {
    root._dcLightboxTl.kill();
    root._dcLightboxTl = null;
  }
  gsap.killTweensOf([scrim, image, ...visibleUi].filter(Boolean));

  const tl = gsap.timeline({ onComplete: finish });

  if (visibleUi.length) {
    tl.to(
      visibleUi,
      {
        opacity: 0,
        y: UI_RISE * 0.6,
        duration: DURATION.fast,
        ease: EASE.exit,
        stagger: { each: STAGGER.tight, from: "end" },
      },
      0,
    );
  }
  if (image) {
    tl.to(
      image,
      { opacity: 0, scale: 0.99, duration: DURATION.fast, ease: EASE.exit },
      visibleUi.length ? STAGGER.tight : 0,
    );
  }
  if (scrim) {
    tl.to(
      scrim,
      { opacity: 0, duration: 0.28, ease: EASE.fast },
      visibleUi.length ? STAGGER.tight * 2 : 0.04,
    );
  }

  root._dcLightboxTl = tl;
}

/** Horizontal slide — outgoing first, incoming staggered */
export function animateLightboxSlide({
  outgoing,
  incoming,
  direction = 1,
  onComplete,
} = {}) {
  if (!outgoing || !incoming) {
    onComplete?.();
    return;
  }

  const dist = 52;
  const slideStagger = STAGGER.tight;

  if (prefersReducedMotion()) {
    gsap.set(outgoing, { opacity: 0, x: 0, clearProps: "transform" });
    gsap.set(incoming, { opacity: 1, x: 0 });
    onComplete?.();
    return;
  }

  gsap.killTweensOf([outgoing, incoming]);
  gsap.set(outgoing, { x: 0, opacity: 1 });
  gsap.set(incoming, {
    x: direction > 0 ? dist : -dist,
    opacity: 0,
  });

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(outgoing, { opacity: 0, x: 0, clearProps: "transform" });
      gsap.set(incoming, { x: 0, opacity: 1, clearProps: "transform" });
      onComplete?.();
    },
  });

  tl.to(
    outgoing,
    {
      x: direction > 0 ? -dist : dist,
      opacity: 0,
      duration: DURATION.normal,
      ease: EASE.luxury,
    },
    0,
  );
  tl.to(
    incoming,
    {
      x: 0,
      opacity: 1,
      duration: DURATION.normal,
      ease: EASE.reveal,
    },
    slideStagger,
  );
}
