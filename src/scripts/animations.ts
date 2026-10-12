import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
gsap.registerEase("draw", (p: number) => {
  // Aproximación numérica de cubic-bezier(0.2, 0.7, 0.1, 1) vía power4.out suavizado
  return 1 - Math.pow(1 - p, 3.4);
});

/** Revela elementos [data-animate]: fundido + desplazamiento corto */
function initRevealAnimations(): void {
  const elements = document.querySelectorAll<HTMLElement>("[data-animate]");

  if (prefersReducedMotion) {
    gsap.set(elements, { opacity: 1, y: 0 });
    return;
  }

  elements.forEach((el, index) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "draw",
        delay: (index % 4) * 0.05,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      }
    );
  });
}

/** Titulares con reveal por máscara (clip-path), en lugar de un fade-up genérico */
function initMaskReveals(): void {
  const titles = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (prefersReducedMotion) {
    gsap.set(titles, { clipPath: "none" });
    return;
  }
  titles.forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: "inset(0 0 100% 0)", y: 28 },
      {
        clipPath: "inset(-10% -2% -25% -2%)",
        y: 0,
        duration: 0.9,
        ease: "draw",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onComplete: () => {
          // clip-path:none (no clearProps): si no, la regla CSS inicial volvería a ocultarlo
          gsap.set(el, { clipPath: "none", clearProps: "transform" });
        },
      }
    );
  });
}

/** Líneas, cotas y bordes que se "dibujan" al entrar en viewport */
function initDrawLines(): void {
  const lines = document.querySelectorAll<HTMLElement>("[data-draw]");
  if (prefersReducedMotion) {
    gsap.set(lines, { scaleX: 1, scaleY: 1 });
    return;
  }
  lines.forEach((el) => {
    const vertical = el.dataset.draw === "y";
    gsap.to(el, {
      [vertical ? "scaleY" : "scaleX"]: 1,
      duration: 0.9,
      ease: "draw",
      scrollTrigger: { trigger: el, start: "top 94%", once: true },
    });
  });
}

/** Trazos SVG [data-draw-path]: se dibujan con stroke-dashoffset */
function initDrawPaths(): void {
  const paths = document.querySelectorAll<SVGGeometryElement>("[data-draw-path]");
  paths.forEach((path) => {
    path.setAttribute("pathLength", "1");
    if (prefersReducedMotion) return;
    gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
    const trigger = path.closest<HTMLElement>("[data-draw-scope]") ?? (path as unknown as HTMLElement);
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: Number(path.dataset.drawDuration ?? 2.2),
      ease: "power2.inOut",
      scrollTrigger: { trigger, start: "top 75%", once: true },
    });
  });

  // Marcadores/waypoints que aparecen después de la ruta
  const markers = document.querySelectorAll<SVGElement>("[data-draw-marker]");
  if (!markers.length) return;
  if (prefersReducedMotion) {
    gsap.set(markers, { opacity: 1 });
    return;
  }
  const scope = markers[0].closest<HTMLElement>("[data-draw-scope]");
  gsap.fromTo(
    markers,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.4,
      stagger: 0.28,
      delay: 0.3,
      ease: "none",
      scrollTrigger: { trigger: scope ?? markers[0], start: "top 75%", once: true },
    }
  );
}

/** Navbar: sólido con línea inferior al scrollear (sin blur) */
function initNavbarScrollState(): void {
  const navbar = document.querySelector<HTMLElement>("[data-navbar]");
  if (!navbar) return;

  ScrollTrigger.create({
    start: "top -40",
    onUpdate: (self) => {
      navbar.dataset.scrolled = String(self.scroll() > 40);
    },
  });
}

/** Circuito del proceso: el trazo verde recorre los pasos con el scroll (scrub) */
function initProcessCircuit(): void {
  const circuit = document.querySelector<HTMLElement>("[data-process-circuit]");
  const progress = document.querySelector<HTMLElement>("[data-process-progress]");
  if (!circuit || !progress) return;

  const nodes = Array.from(circuit.querySelectorAll<HTMLElement>("[data-process-node]"));
  const setActive = (p: number) => {
    nodes.forEach((node, i) => {
      const threshold = nodes.length > 1 ? i / (nodes.length - 1) : 0;
      node.dataset.active = String(p >= threshold - 0.001);
    });
  };

  if (prefersReducedMotion) {
    progress.style.setProperty("--p", "1");
    setActive(1);
    return;
  }

  setActive(0);
  gsap.to(progress, {
    "--p": 1,
    ease: "none",
    scrollTrigger: {
      trigger: circuit,
      start: "top 65%",
      end: "bottom 60%",
      scrub: 0.6,
      onUpdate: (self) => setActive(self.progress),
    },
  });
}

export function initAnimations(): void {
  initRevealAnimations();
  initMaskReveals();
  initDrawLines();
  initDrawPaths();
  initNavbarScrollState();
  initProcessCircuit();
}

