import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(Flip, ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Filtro por tipo del showroom, con transición GSAP Flip entre láminas */
export function initShowroomFilter(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>("[data-filter]");
  const sections = document.querySelectorAll<HTMLElement>("[data-category-section]");
  const laminas = document.querySelectorAll<HTMLElement>("[data-lamina]");
  if (!tabs.length || !sections.length) return;

  const apply = (filter: string) => {
    const state = prefersReducedMotion ? null : Flip.getState(laminas);

    sections.forEach((section) => {
      const show = filter === "all" || section.dataset.categorySection === filter;
      section.classList.toggle("hidden", !show);
    });
    tabs.forEach((tab) => {
      const active = tab.dataset.filter === filter;
      tab.dataset.active = String(active);
      tab.setAttribute("aria-pressed", String(active));
    });

    if (state) {
      Flip.from(state, {
        duration: 0.6,
        ease: "power3.out",
        nested: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else {
      ScrollTrigger.refresh();
    }

    if (filter !== "all") {
      history.replaceState(null, "", `#${filter}`);
    } else if (location.hash) {
      history.replaceState(null, "", location.pathname);
    }
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => apply(tab.dataset.filter ?? "all")));

  // Si se llega con #web, #mobile, etc., arranca filtrado por esa categoría
  const initial = location.hash.slice(1);
  if (initial && Array.from(sections).some((s) => s.dataset.categorySection === initial)) {
    apply(initial);
  }
}
