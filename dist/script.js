const hero = document.querySelector(".hero");
const heroVideo = document.querySelector(".hero-video");
const intro = document.querySelector(".intro");
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
  detailControls.classList.toggle("is-visible", rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.35);
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
  const nextIndex = Math.round(progress * (detailSlides.length - 1));
  const distance = window.innerWidth * nextIndex;

  track.style.transform = `translate3d(${-distance}px, 0, 0)`;
  setDetailIndex(nextIndex);
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


function loadHeroVideo() {
  if (!heroVideo || heroVideo.dataset.loaded === "true") return;

  const source = heroVideo.dataset.src;
  if (!source) return;

  heroVideo.hidden = false;
  heroVideo.src = source;
  heroVideo.dataset.loaded = "true";
  heroVideo.addEventListener("canplay", () => heroVideo.classList.add("is-ready"), { once: true });
  heroVideo.load();
  heroVideo.play().catch(() => {});
}

function scheduleHeroVideoLoad() {
  if (reduceMotion.matches) return;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConnection = connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType);
  if (slowConnection) return;

  const run = () => {
    const startLoading = () => window.setTimeout(loadHeroVideo, 1600);
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(startLoading, { timeout: 2200 });
    } else {
      startLoading();
    }
  };

  if (document.readyState === "complete") {
    run();
  } else {
    window.addEventListener("load", run, { once: true });
  }
}

function scrollToIntroAfterHeroVideo() {
  if (!hero || !intro) return;

  const heroBottom = hero.offsetTop + hero.offsetHeight;
  const stillViewingHero = window.scrollY < heroBottom - window.innerHeight * 0.28;
  if (!stillViewingHero) return;

  intro.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
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

heroVideo?.addEventListener("ended", scrollToIntroAfterHeroVideo, { once: true });
scheduleHeroVideoLoad();

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
