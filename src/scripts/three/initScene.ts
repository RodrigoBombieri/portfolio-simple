/**
 * Cargador liviano de la escena 3D del hero. NO importa Three.js: el módulo
 * de la escena (y Three) se piden con import dinámico en idle, después del
 * primer paint y del evento load, para que el LCP siga siendo el título HTML.
 */
type IdleCb = (cb: () => void, opts?: { timeout: number }) => number;

function whenIdle(cb: () => void): void {
  const ric = (window as unknown as { requestIdleCallback?: IdleCb }).requestIdleCallback;
  if (ric) ric(cb, { timeout: 2500 });
  else window.setTimeout(cb, 200);
}

/** Resuelve cuando el navegador ya pintó contenido (FCP), con tope de seguridad. */
function afterFirstContentfulPaint(cb: () => void): void {
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    // doble rAF: garantiza al menos un frame pintado antes de seguir
    requestAnimationFrame(() => requestAnimationFrame(cb));
  };
  try {
    if (performance.getEntriesByName("first-contentful-paint").length) return fire();
    const po = new PerformanceObserver((list) => {
      if (list.getEntriesByName("first-contentful-paint").length) {
        po.disconnect();
        fire();
      }
    });
    po.observe({ type: "paint", buffered: true });
  } catch {
    /* sin PerformanceObserver de paint: se usa solo el tope */
  }
  window.setTimeout(fire, 3000);
}

function afterFirstPaintAndLoad(cb: () => void): void {
  const go = () => afterFirstContentfulPaint(() => whenIdle(cb));
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

export function initHeroScene(): void {
  const mount = document.querySelector<HTMLElement>("[data-scene-mount]");
  if (!mount) return;

  const showFallback = () => {
    mount.dataset.sceneState = "fallback";
  };

  // Movimiento reducido: no se descarga Three; queda el diagrama estático.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showFallback();
    return;
  }

  afterFirstPaintAndLoad(() => {
    import("./systemScene")
      .then(({ createSystemScene }) => {
        const scene = createSystemScene(mount);
        if (!scene) {
          showFallback();
          return;
        }
        mount.dataset.sceneState = "live";
        document.addEventListener("astro:before-swap", () => scene.dispose(), { once: true });
        window.addEventListener("pagehide", (e) => {
          if (!e.persisted) scene.dispose();
        });
      })
      .catch(showFallback);
  });
}
