/**
 * Scroll suave con offset para compensar el navbar fijo.
 * Se aplica a todos los enlaces internos (href^="#").
 */
const NAVBAR_OFFSET = 88;

export function initSmoothScroll(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      event.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;

      window.scrollTo({ top, behavior: "smooth" });

      // Cierra el menú móvil si estaba abierto
      document.dispatchEvent(new CustomEvent("nav:close-mobile-menu"));

      history.pushState(null, "", href);
    });
  });
}
