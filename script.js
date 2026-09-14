const stage = document.querySelector(".horizontal-stage");
const track = document.querySelector(".horizontal-track");
const cards = document.querySelectorAll(".principle-card");
const parallaxPanels = document.querySelectorAll("[data-parallax]");

function updateHorizontalScroll() {
  if (!stage || !track || window.matchMedia("(max-width: 560px)").matches) return;

  const rect = stage.getBoundingClientRect();
  const max = stage.offsetHeight - window.innerHeight;
  const progress = Math.min(Math.max(-rect.top / max, 0), 1);
  const distance = track.scrollWidth - window.innerWidth;

  track.style.transform = `translate3d(${-distance * progress}px, 0, 0)`;
}

function updateParallax() {
  const viewport = window.innerHeight || 1;

  parallaxPanels.forEach((panel) => {
    const media = panel.querySelector("video, img, .intro-logo");
    if (!media) return;

    const rect = panel.getBoundingClientRect();
    const progress = (viewport - rect.top) / (viewport + rect.height);
    const offset = (progress - 0.5) * 42;

    media.style.transform = media.classList.contains("intro-logo")
      ? `translate3d(-50%, ${offset}px, 0)`
      : `translate3d(0, ${offset}px, 0)`;
  });
}

function updateScrollEffects() {
  updateHorizontalScroll();
  updateParallax();
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

window.addEventListener("scroll", updateScrollEffects, { passive: true });
window.addEventListener("resize", updateScrollEffects);
updateScrollEffects();
