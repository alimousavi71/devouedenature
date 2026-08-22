import gsap from "gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "./tokens.js";
import { staggerEach } from "./stagger.js";
import { stopSmoothScroll, startSmoothScroll } from "./smooth-scroll.js";

/**
 * Shared GSAP open/close for edge drawers (cart, mobile nav).
 * Always interruptible — kill() on reverse so close is immediate.
 */
export function animateDrawerOpen({
  root,
  panel,
  scrim,
  from = "right",
  onComplete,
} = {}) {
  if (!root || !panel) return;

  const xFrom = from === "left" ? "-100%" : "100%";

  gsap.set(panel, { x: xFrom });
  if (scrim) gsap.set(scrim, { opacity: 0 });

  root.classList.remove("hidden");
  root.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  stopSmoothScroll();

  const staggerEls = panel.querySelectorAll("[data-dc-drawer-item]");

  if (prefersReducedMotion()) {
    gsap.set(scrim, { opacity: 1 });
    gsap.set(panel, { x: 0 });
    gsap.set(staggerEls, { opacity: 1, y: 0 });
    root.classList.add("is-open");
    onComplete?.();
    return;
  }

  if (root._dcDrawerTl) {
    root._dcDrawerTl.kill();
    root._dcDrawerTl = null;
  }
  gsap.killTweensOf([panel, scrim, ...staggerEls].filter(Boolean));

  const tl = gsap.timeline({
    defaults: { ease: EASE.slow },
    onComplete: () => {
      root.classList.add("is-open");
      onComplete?.();
    },
  });

  if (scrim) {
    tl.to(scrim, { opacity: 1, duration: DURATION.slow }, 0);
  }
  tl.to(panel, { x: 0, duration: DURATION.slow }, 0);

  if (staggerEls.length) {
    gsap.set(staggerEls, { opacity: 0, y: 10 });
    tl.to(
      staggerEls,
      {
        opacity: 1,
        y: 0,
        duration: DURATION.normal,
        stagger: staggerEach(staggerEls.length, "tight"),
        ease: EASE.normal,
      },
      0.12,
    );
  }

  root._dcDrawerTl = tl;
}

export function animateDrawerClose({
  root,
  panel,
  scrim,
  to = "right",
  onComplete,
} = {}) {
  if (!root || !panel) return;

  const finish = () => {
    root.classList.add("hidden");
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    startSmoothScroll();
    onComplete?.();
  };

  const staggerEls = panel.querySelectorAll("[data-dc-drawer-item]");

  if (prefersReducedMotion()) {
    finish();
    return;
  }

  if (root._dcDrawerTl) {
    root._dcDrawerTl.kill();
    root._dcDrawerTl = null;
  }
  gsap.killTweensOf([panel, scrim, ...staggerEls].filter(Boolean));

  const xTo = to === "left" ? "-100%" : "100%";
  const tl = gsap.timeline({
    defaults: { ease: EASE.slow },
    onComplete: finish,
  });

  if (staggerEls.length) {
    tl.to(
      staggerEls,
      {
        opacity: 0,
        y: 6,
        duration: DURATION.fast,
        stagger: { each: STAGGER.tight, from: "end" },
        ease: EASE.fast,
      },
      0,
    );
  }

  if (scrim)
    tl.to(
      scrim,
      { opacity: 0, duration: DURATION.fast },
      staggerEls.length ? 0.06 : 0,
    );
  tl.to(
    panel,
    { x: xTo, duration: DURATION.slow },
    staggerEls.length ? 0.04 : 0,
  );

  root._dcDrawerTl = tl;
}
