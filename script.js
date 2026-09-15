const stage = document.querySelector(".horizontal-stage");
const track = document.querySelector(".horizontal-track");
const cards = document.querySelectorAll(".principle-card");
const parallaxPanels = document.querySelectorAll("[data-parallax]");
const principlesOverview = document.querySelector(".principles-overview");
const detailSlides = document.querySelectorAll(".detail-slide");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let ticking = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateDetailSlides(progress) {
  if (!detailSlides.length || reduceMotion.matches) return;

  const slideCount = detailSlides.length;
  const position = progress * (slideCount - 1);

  detailSlides.forEach((slide, index) => {
    const delta = index - position;
    const clampedDelta = clamp(delta, -1.25, 1.25);
    const presence = 1 - clamp(Math.abs(delta), 0, 1);
    const easedPresence = 1 - Math.pow(1 - presence, 3);

    const absence = 1 - easedPresence;

    slide.style.setProperty("--slide-presence", easedPresence.toFixed(4));
    slide.style.setProperty("--slide-drift", clampedDelta.toFixed(4));
    slide.style.setProperty("--slide-bg-x", `${(-132 * clampedDelta).toFixed(2)}px`);
    slide.style.setProperty("--slide-bg-y", `${(34 * Math.abs(clampedDelta)).toFixed(2)}px`);
    slide.style.setProperty("--slide-bg-scale", (1.02 + absence * 0.16).toFixed(4));
    slide.style.setProperty("--slide-title-x", `${(170 * clampedDelta).toFixed(2)}px`);
    slide.style.setProperty("--slide-title-y", `${(-96 * Math.abs(clampedDelta)).toFixed(2)}px`);
    slide.style.setProperty("--slide-title-scale", (0.9 + easedPresence * 0.1).toFixed(4));
    slide.style.setProperty("--slide-title-opacity", (0.04 + easedPresence * 0.96).toFixed(4));
    slide.style.setProperty("--slide-copy-x", `${(-124 * clampedDelta).toFixed(2)}px`);
    slide.style.setProperty("--slide-copy-y", `${(92 * Math.abs(clampedDelta)).toFixed(2)}px`);
    slide.style.setProperty("--slide-copy-opacity", (0.02 + easedPresence * 0.98).toFixed(4));
    slide.style.setProperty("--slide-overlay-alpha", (0.3 - easedPresence * 0.2).toFixed(4));
    slide.style.setProperty("--slide-overlay-opacity", (0.25 + easedPresence * 0.65).toFixed(4));
  });
}

function updateHorizontalScroll() {
  if (!stage || !track || window.matchMedia("(max-width: 560px)").matches) return;

  const rect = stage.getBoundingClientRect();
  const max = stage.offsetHeight - window.innerHeight;
  const progress = clamp(-rect.top / max, 0, 1);
  const distance = track.scrollWidth - window.innerWidth;

  track.style.transform = `translate3d(${-distance * progress}px, 0, 0)`;
  updateDetailSlides(progress);
}

function updateParallax() {
  if (reduceMotion.matches) return;

  const viewport = window.innerHeight || 1;

  parallaxPanels.forEach((panel) => {
    const rect = panel.getBoundingClientRect();
    const centerDelta = rect.top + rect.height / 2 - viewport / 2;
    const normalized = clamp(centerDelta / viewport, -1.25, 1.25);
    const visibility = 1 - clamp(Math.abs(normalized), 0, 1);

    const media = panel.querySelector("video, img, .intro-logo");
    const mediaOffset = -normalized * 78;
    const contentOffset = normalized * 42;
    const contentScale = 0.982 + visibility * 0.018;
    const contentOpacity = 0.78 + visibility * 0.22;

    panel.style.setProperty("--panel-content-y", `${contentOffset.toFixed(2)}px`);
    panel.style.setProperty("--panel-content-scale", contentScale.toFixed(4));
    panel.style.setProperty("--panel-content-opacity", contentOpacity.toFixed(4));

    if (!media) return;

    if (media.classList.contains("intro-logo")) {
      media.style.transform = `translate3d(-50%, ${mediaOffset.toFixed(2)}px, 0)`;
    } else {
      media.style.transform = `translate3d(0, ${mediaOffset.toFixed(2)}px, 0) scale(1.06)`;
    }
  });
}

function updateScrollEffects() {
  updateHorizontalScroll();
  updateParallax();
  ticking = false;
}

function requestScrollEffectsUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(updateScrollEffects);
}

cards.forEach((card) => {
  const video = card.querySelector("video");
  if (!video) return;

  card.addEventListener("mouseenter", () => {
    video.currentTime = 0;
    video.play().catch(() => {});
  });

  card.addEventListener("mouseleave", () => {
    video.pause();
    video.currentTime = 0;
  });
});

if (principlesOverview && !reduceMotion.matches) {
  principlesOverview.classList.add("reveal-ready");

  const overviewObserver = new IntersectionObserver(
    ([entry], observer) => {
      const reachedOverview =
        entry.isIntersecting && entry.boundingClientRect.top <= window.innerHeight * 0.62;
      if (!reachedOverview) return;

      principlesOverview.classList.add("is-visible");
      observer.disconnect();
    },
    { threshold: 0.18, rootMargin: "0px 0px -18% 0px" }
  );

  overviewObserver.observe(principlesOverview);
}

window.addEventListener("scroll", requestScrollEffectsUpdate, { passive: true });
window.addEventListener("resize", requestScrollEffectsUpdate);
reduceMotion.addEventListener("change", requestScrollEffectsUpdate);
updateScrollEffects();
