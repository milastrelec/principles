const stage = document.querySelector(".horizontal-stage");
const track = document.querySelector(".horizontal-track");
const cards = document.querySelectorAll(".principle-card");
const parallaxPanels = document.querySelectorAll("[data-parallax]");
const principlesOverview = document.querySelector(".principles-overview");
const detailSlides = document.querySelectorAll(".detail-slide");
const detailPrev = document.querySelector(".detail-control-prev");
const detailNext = document.querySelector(".detail-control-next");
const detailCounter = document.querySelector(".detail-counter");
const detailControls = document.querySelector(".detail-controls");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");

let ticking = false;
let currentDetailIndex = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isAdaptiveSlider() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function setDetailIndex(index) {
  if (!detailSlides.length) return;

  currentDetailIndex = clamp(index, 0, detailSlides.length - 1);
  if (detailCounter) {
    detailCounter.textContent = `${currentDetailIndex + 1} / ${detailSlides.length}`;
  }

  detailPrev?.toggleAttribute("disabled", currentDetailIndex === 0);
  detailNext?.toggleAttribute("disabled", currentDetailIndex === detailSlides.length - 1);
}

function getDesktopDetailIndex() {
  if (!stage || !detailSlides.length) return 0;

  const rect = stage.getBoundingClientRect();
  const max = stage.offsetHeight - window.innerHeight;
  const progress = max > 0 ? clamp(-rect.top / max, 0, 1) : 0;
  return Math.round(progress * (detailSlides.length - 1));
}

function getAdaptiveDetailIndex() {
  if (!track || !detailSlides.length) return 0;

  const slideWidth = track.clientWidth || 1;
  return Math.round(track.scrollLeft / slideWidth);
}

function goToDetailSlide(index) {
  if (!stage || !track || !detailSlides.length) return;

  const nextIndex = clamp(index, 0, detailSlides.length - 1);

  if (isAdaptiveSlider()) {
    track.scrollTo({ left: nextIndex * track.clientWidth, behavior: reduceMotion.matches ? "auto" : "smooth" });
    setDetailIndex(nextIndex);
    return;
  }

  const max = stage.offsetHeight - window.innerHeight;
  const target = stage.offsetTop + (max * nextIndex) / (detailSlides.length - 1);
  window.scrollTo({ top: target, behavior: reduceMotion.matches ? "auto" : "smooth" });
  setDetailIndex(nextIndex);
}

function updateDetailControlsVisibility() {
  if (!stage || !detailControls) return;

  const rect = stage.getBoundingClientRect();
  const isVisible = isAdaptiveSlider()
    ? rect.top < window.innerHeight && rect.bottom > 0
    : rect.top <= 0 && rect.bottom >= window.innerHeight * 0.98;
  detailControls.classList.toggle("is-visible", isVisible);
}

function updateHorizontalScroll() {
  if (!stage || !track) return;

  updateDetailControlsVisibility();

  if (isAdaptiveSlider()) {
    track.style.transform = "none";
    setDetailIndex(getAdaptiveDetailIndex());
    return;
  }

  const rect = stage.getBoundingClientRect();
  const max = stage.offsetHeight - window.innerHeight;
  const progress = max > 0 ? clamp(-rect.top / max, 0, 1) : 0;
  const distance = track.scrollWidth - window.innerWidth;

  track.style.transform = `translate3d(${-distance * progress}px, 0, 0)`;
  setDetailIndex(Math.round(progress * (detailSlides.length - 1)));
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
    card.classList.remove("is-easter-active");
    video.loop = true;
    video.currentTime = 0;
    video.play().catch(() => {});
  });

  card.addEventListener("mouseleave", () => {
    video.pause();
    video.currentTime = 0;
  });
});

function playSecondPrincipleEasterEgg() {
  if (reduceMotion.matches || !canHover.matches) return;

  const card = cards[1];
  const video = card?.querySelector("video");
  if (!card || !video || card.matches(":hover")) return;

  card.classList.add("is-easter-active");
  video.loop = false;
  video.currentTime = 0;

  const finish = () => {
    video.pause();
    video.currentTime = 0;
    video.loop = true;
    card.classList.remove("is-easter-active");
    video.removeEventListener("ended", finish);
  };

  video.addEventListener("ended", finish, { once: true });
  video.play().catch(finish);
}

if (principlesOverview && !reduceMotion.matches) {
  principlesOverview.classList.add("reveal-ready");

  const overviewObserver = new IntersectionObserver(
    ([entry], observer) => {
      const reachedOverview =
        entry.isIntersecting && entry.boundingClientRect.top <= window.innerHeight * 0.62;
      if (!reachedOverview) return;

      principlesOverview.classList.add("is-visible");
      window.setTimeout(() => {
        playSecondPrincipleEasterEgg();
        window.setInterval(playSecondPrincipleEasterEgg, 60000);
      }, 4600);
      observer.disconnect();
    },
    { threshold: 0.18, rootMargin: "0px 0px -18% 0px" }
  );

  overviewObserver.observe(principlesOverview);
}

detailPrev?.addEventListener("click", () => goToDetailSlide(currentDetailIndex - 1));
detailNext?.addEventListener("click", () => goToDetailSlide(currentDetailIndex + 1));
track?.addEventListener("scroll", () => {
  if (isAdaptiveSlider()) requestScrollEffectsUpdate();
}, { passive: true });

window.addEventListener("scroll", requestScrollEffectsUpdate, { passive: true });
window.addEventListener("resize", requestScrollEffectsUpdate);
reduceMotion.addEventListener("change", requestScrollEffectsUpdate);
setDetailIndex(0);
updateScrollEffects();
