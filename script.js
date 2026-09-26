// Nav border on scroll
const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Copy Discord handle
const discordBtn = document.getElementById("discordCopy");
const discordHint = document.getElementById("discordHint");
discordBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(discordBtn.dataset.handle);
    discordHint.textContent = "Copied ✓";
  } catch {
    discordHint.textContent = "Add rockmedia.co on Discord";
  }
  setTimeout(() => (discordHint.textContent = "Copy"), 2000);
});

// Reveal on scroll
const revealEls = document.querySelectorAll(".section h2, .about-grid, .service-list li, .work-grid, .founder-card, .contact-grid");
if ("IntersectionObserver" in window) {
  revealEls.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
}
