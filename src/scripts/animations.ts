import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Revela elementos [data-animate] con fade + slide al entrar en viewport */
function initRevealAnimations(): void {
  const elements = document.querySelectorAll<HTMLElement>("[data-animate]");

  if (prefersReducedMotion) {
    gsap.set(elements, { opacity: 1, y: 0 });
    return;
  }

  elements.forEach((el, index) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: (index % 4) * 0.06,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      }
    );
  });
}

/** Cambia el fondo del navbar al hacer scroll */
function initNavbarScrollState(): void {
  const navbar = document.querySelector<HTMLElement>("[data-navbar]");
  if (!navbar) return;

  ScrollTrigger.create({
    start: "top -80",
    onUpdate: (self) => {
      navbar.classList.toggle("border-border-soft", self.scroll() > 80);
      navbar.classList.toggle("bg-bg/80", self.scroll() > 80);
      navbar.classList.toggle("backdrop-blur-xl", self.scroll() > 80);
      navbar.classList.toggle("shadow-[0_1px_0_0_rgba(255,255,255,0.04)]", self.scroll() > 80);
    },
  });
}

/** Anima la línea de progreso de la línea de tiempo del proceso */
function initProcessTimeline(): void {
  const lines = document.querySelectorAll<HTMLElement>("[data-process-line]");
  if (!lines.length || prefersReducedMotion) return;

  const timeline = document.querySelector<HTMLElement>("[data-timeline]");
  if (!timeline) return;

  gsap.to(lines, {
    scaleX: 1,
    duration: 0.9,
    ease: "power2.inOut",
    stagger: 0.15,
    scrollTrigger: {
      trigger: timeline,
      start: "top 70%",
    },
  });
}

/** Parallax sutil para los blobs decorativos de fondo */
function initParallaxBlobs(): void {
  if (prefersReducedMotion) return;

  const blobs = document.querySelectorAll<HTMLElement>(".animate-float");
  blobs.forEach((blob) => {
    gsap.to(blob, {
      y: "+=16",
      scrollTrigger: {
        trigger: blob,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5,
      },
    });
  });
}

export function initAnimations(): void {
  initRevealAnimations();
  initNavbarScrollState();
  initProcessTimeline();
  initParallaxBlobs();
}
