/**
 * Scroll suave con offset para compensar el navbar fijo.
 *
 * Se aplica a enlaces con hash (ej. "#servicios" o "/#servicios"). El sitio
 * tiene páginas separadas (/, /showroom, /portfolio-tecnico) que comparten
 * Navbar/Footer, así que los links de sección se escriben como "/#seccion"
 * para que funcionen desde cualquier página:
 * - Si el hash apunta a un elemento de la página actual, se hace scroll
 *   suave sin recargar (preventDefault).
 * - Si no (porque estamos en otra página), se deja la navegación normal del
 *   navegador, que carga la home y salta al hash — compensado luego por
 *   initHashScrollOnLoad().
 */
const NAVBAR_OFFSET = 88;

function scrollToElement(target: HTMLElement, behavior: ScrollBehavior = "smooth"): void {
  const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
  window.scrollTo({ top, behavior });
}

export function initSmoothScroll(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href) return;

      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const hash = href.slice(hashIndex);
      const path = href.slice(0, hashIndex);
      if (hash === "#") return;

      // El link solo se intercepta si apunta a esta misma página
      // ("#seccion", "/#seccion" estando en "/", o la ruta actual exacta).
      const isSamePage = path === "" || path === window.location.pathname;
      if (!isSamePage) return;

      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;

      event.preventDefault();

      scrollToElement(target);

      // Cierra el menú móvil si estaba abierto
      document.dispatchEvent(new CustomEvent("nav:close-mobile-menu"));

      history.pushState(null, "", hash);
    });
  });
}

/**
 * Al cargar una página con un hash en la URL (ej. llegar a "/#servicios"
 * desde /showroom), compensa el navbar fijo — el salto nativo del navegador
 * no lo tiene en cuenta.
 */
export function initHashScrollOnLoad(): void {
  if (!window.location.hash) return;

  const target = document.querySelector<HTMLElement>(window.location.hash);
  if (!target) return;

  requestAnimationFrame(() => scrollToElement(target, "auto"));
}
