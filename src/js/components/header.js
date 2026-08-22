import gsap from "gsap";
import { initDialogs } from "./dialog.js";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "../motion/tokens.js";
import { getScrollY } from "../motion/smooth-scroll.js";

function syncHeaderSpacer(root = document) {
  const shell =
    root.querySelector("[data-dc-header-shell]") ||
    document.querySelector("[data-dc-header-shell]");
  const spacer =
    root.querySelector("[data-dc-header-spacer]") ||
    document.querySelector("[data-dc-header-spacer]");
  if (!shell || !spacer) return;

  const set = () => {
    const height = shell.offsetHeight;
    document.documentElement.style.setProperty(
      "--dc-header-offset",
      `${height}px`,
    );
    if (spacer.dataset.dcHeaderSpacerMode === "overlay") {
      spacer.style.height = "0px";
    } else {
      spacer.style.height = `${height}px`;
    }
  };

  set();

  if (!shell.dataset.dcSpacerBound) {
    shell.dataset.dcSpacerBound = "1";
    window.addEventListener("resize", set, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(set).observe(shell);
    }
  }
}

function animateMobileSubpanel(panel, open) {
  if (prefersReducedMotion()) {
    panel.classList.toggle("hidden", !open);
    panel.style.cssText = "";
    return;
  }

  gsap.killTweensOf(panel);

  if (open) {
    panel.classList.remove("hidden");
    panel.style.overflow = "hidden";
    panel.style.height = "auto";
    const targetHeight = panel.scrollHeight;
    panel.style.height = "0px";
    panel.style.opacity = "0";

    gsap.to(panel, {
      height: targetHeight,
      opacity: 1,
      duration: DURATION.slow,
      ease: EASE.drawer,
      onComplete: () => {
        panel.style.height = "auto";
        panel.style.overflow = "";
      },
    });

    const links = panel.querySelectorAll("a");
    if (links.length) {
      gsap.fromTo(
        links,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: DURATION.normal,
          ease: EASE.luxury,
          stagger: STAGGER.tight,
          delay: 0.08,
          overwrite: "auto",
        },
      );
    }
    return;
  }

  gsap.to(panel, {
    height: 0,
    opacity: 0,
    duration: DURATION.normal,
    ease: EASE.exit,
    onComplete: () => {
      panel.classList.add("hidden");
      panel.style.cssText = "";
    },
  });
}

export function initHeader(root = document) {
  initDialogs(root);
  syncHeaderSpacer(root);

  const header = root.querySelector("[data-dc-header-transparent]");
  if (header && !header.dataset.dcScrollBound) {
    header.dataset.dcScrollBound = "1";
    const solidClasses = ["bg-bg/95", "backdrop-blur-[10px]", "border-border"];
    const transparentClasses = ["bg-transparent", "border-transparent"];
    const onScroll = () => {
      const scrolled = getScrollY() > 40;
      header.classList.toggle("is-scrolled", scrolled);
      header.classList.remove(
        ...(scrolled ? transparentClasses : solidClasses),
      );
      header.classList.add(...(scrolled ? solidClasses : transparentClasses));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("dc:scroll", onScroll);
    onScroll();
  }

  root.querySelectorAll("[data-dc-expand]").forEach((trigger) => {
    if (trigger.dataset.dcExpandBound) return;
    trigger.dataset.dcExpandBound = "1";
    const panel = document.getElementById(
      trigger.getAttribute("data-dc-expand"),
    );
    if (!panel) return;

    const plus = trigger.querySelector(".dc-mobile-nav__plus");

    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      trigger.setAttribute("aria-expanded", String(next));
      animateMobileSubpanel(panel, next);

      if (plus) {
        if (prefersReducedMotion()) {
          plus.style.transform = next ? "rotate(45deg)" : "";
          return;
        }
        gsap.to(plus, {
          rotate: next ? 45 : 0,
          duration: 0.42,
          ease: EASE.drawer,
          overwrite: "auto",
        });
      }
    });
  });

  initMegaMenus(root);
}

function initMegaMenus(root) {
  root.querySelectorAll("[data-dc-nav-item]").forEach((item) => {
    if (item.dataset.dcMegaBound) return;
    item.dataset.dcMegaBound = "1";

    const trigger = item.querySelector("[data-dc-mega-trigger]");
    const panel = item.querySelector(".dc-mega-menu");
    if (!trigger || !panel) return;

    let openTl = null;
    const cols = panel.querySelectorAll("[data-dc-mega-col]");

    const show = () => {
      trigger.setAttribute("aria-expanded", "true");
      panel.classList.remove("invisible");

      if (prefersReducedMotion()) {
        gsap.set(panel, { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" });
        gsap.set(cols, { opacity: 1, y: 0 });
        return;
      }

      if (openTl) openTl.kill();
      gsap.killTweensOf([panel, ...cols]);

      gsap.set(panel, { clipPath: "inset(0 0 100% 0)" });
      gsap.set(cols, { opacity: 0, y: 14 });

      openTl = gsap.timeline({ defaults: { ease: EASE.drawer } });
      openTl.fromTo(
        panel,
        { opacity: 0, y: -10 },
        {
          opacity: 1,
          y: 0,
          clipPath: "inset(0 0 0% 0)",
          duration: DURATION.slow,
          ease: EASE.drawer,
        },
        0,
      );
      openTl.to(
        cols,
        {
          opacity: 1,
          y: 0,
          duration: DURATION.normal,
          stagger: STAGGER.tight,
          ease: EASE.luxury,
        },
        0.1,
      );
    };

    const hide = () => {
      trigger.setAttribute("aria-expanded", "false");

      if (prefersReducedMotion()) {
        gsap.set(panel, { opacity: 0 });
        panel.classList.add("invisible");
        return;
      }

      if (openTl) openTl.kill();
      gsap.killTweensOf([panel, ...cols]);

      openTl = gsap.timeline({
        onComplete: () => panel.classList.add("invisible"),
      });
      openTl.to(
        cols,
        {
          opacity: 0,
          y: 8,
          duration: DURATION.fast,
          stagger: { each: STAGGER.tight, from: "end" },
          ease: EASE.exit,
        },
        0,
      );
      openTl.to(
        panel,
        {
          opacity: 0,
          y: -8,
          clipPath: "inset(0 0 100% 0)",
          duration: DURATION.normal,
          ease: EASE.exit,
        },
        0.04,
      );
    };

    item.addEventListener("mouseenter", show);
    item.addEventListener("mouseleave", hide);
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      isOpen ? hide() : show();
    });
    item.addEventListener("focusout", (event) => {
      if (!item.contains(event.relatedTarget)) hide();
    });
  });
}
