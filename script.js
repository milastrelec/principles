const stage = document.querySelector(".horizontal-stage");
const track = document.querySelector(".horizontal-track");
const cards = document.querySelectorAll(".principle-card");
const parallaxPanels = document.querySelectorAll("[data-parallax]");
const principlesOverview = document.querySelector(".principles-overview");
const detailSlides = document.querySelectorAll(".detail-slide");
const detailControls = document.querySelector(".detail-controls");
const detailButtons = document.querySelectorAll("[data-detail-direction]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let ticking = false;
let currentDetailIndex = 0;
let snapTimer;
let isSnapping = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDetailScrollState() {
  if (!stage || !track || window.matchMedia("(max-width: 560px)").matches) return null;

  const rect = stage.getBoundingClientRect();
  const max = stage.offsetHeight - window.innerHeight;
  const progress = clamp(-rect.top / max, 0, 1);
  const distance = track.scrollWidth - window.innerWidth;
  const slideCount = detailSlides.length || 1;
  const index = Math.round(progress * (slideCount - 1));
  const isActive = rect.top < window.innerHeight && rect.bottom > 0;

  return { rect, max, progress, distance, slideCount, index, isActive };
}

function updateDetailControls(state) {
  if (!detailControls || !state) return;

  detailControls.classList.toggle("is-visible", state.isActive);
  detailButtons.forEach((button) => {
    const direction = button.dataset.detailDirection;
    button.disabled =
      !state.isActive ||
      (direction === "prev" && currentDetailIndex <= 0) ||
      (direction === "next" && currentDetailIndex >= state.slideCount - 1);
  });
}

function scrollToDetailIndex(index, smooth = true) {
  const state = getDetailScrollState();
  if (!state || state.slideCount <= 1) return;

  const nextIndex = clamp(index, 0, state.slideCount - 1);
  const target = stage.offsetTop + (state.max * nextIndex) / (state.slideCount - 1);

  isSnapping = true;
  window.scrollTo({
    top: target,
    behavior: smooth && !reduceMotion.matches ? "smooth" : "auto",
  });

  window.setTimeout(() => {
    isSnapping = false;
    requestScrollEffectsUpdate();
  }, smooth ? 420 : 0);
}

function scheduleDetailSnap(state) {
  if (!state || !state.isActive || isSnapping || reduceMotion.matches) return;

  window.clearTimeout(snapTimer);
  snapTimer = window.setTimeout(() => {
    const latestState = getDetailScrollState();
    if (!latestState || !latestState.isActive) return;
    scrollToDetailIndex(latestState.index);
  }, 140);
}

function updateHorizontalScroll() {
  const state = getDetailScrollState();
  if (!state) {
    detailControls?.classList.remove("is-visible");
    return;
  }

  currentDetailIndex = state.index;
  track.style.transform = `translate3d(${-state.distance * state.progress}px, 0, 0)`;
  updateDetailControls(state);
  scheduleDetailSnap(state);
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

detailButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.detailDirection === "next" ? 1 : -1;
    scrollToDetailIndex(currentDetailIndex + direction);
  });
});

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
