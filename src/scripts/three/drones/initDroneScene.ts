/**
 * Cargador liviano de la escena 3D de /drones. NO importa Three: el módulo de
 * la escena (y Three) se piden con import dinámico recién cuando:
 *  1. ya hubo primer paint (FCP) y el evento load,
 *  2. el navegador está ocioso (requestIdleCallback, fallback setTimeout),
 *  3. el escenario está cerca de entrar en viewport (IntersectionObserver).
 * Con movimiento reducido o sin WebGL queda la vista en planta (SVG).
 */
type IdleCb = (cb: () => void, opts?: { timeout: number }) => number;

function whenIdle(cb: () => void): void {
  const ric = (window as unknown as { requestIdleCallback?: IdleCb }).requestIdleCallback;
  if (ric) ric(cb, { timeout: 2000 });
  else window.setTimeout(cb, 200);
}

function afterFirstPaint(cb: () => void): void {
  let done = false;
  const fire = () => {
    if (done) return;
    done = true;
    requestAnimationFrame(() => requestAnimationFrame(cb));
  };
  const go = () => {
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
      /* sin PerformanceObserver de paint: queda el tope */
    }
    window.setTimeout(fire, 3000);
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

/** Chequeo barato de WebGL antes de descargar Three. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function initDroneScene(): void {
  const root = document.querySelector<HTMLElement>("[data-drone-scene]");
  if (!root || root.dataset.sceneInit) return;
  root.dataset.sceneInit = "1";

  const showFallback = () => {
    root.dataset.sceneState = "fallback";
    // El layout cambia (de sticky a lista): que ScrollTrigger recalcule.
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => ScrollTrigger.refresh()).catch(() => {});
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.dataset.sceneState = "fallback";
    return;
  }
  if (!hasWebGL()) {
    showFallback();
    return;
  }

  afterFirstPaint(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        whenIdle(() => {
          import("./droneScene")
            .then(({ createDroneScene }) => {
              const scene = createDroneScene(root);
              if (!scene) {
                showFallback();
                return;
              }
              root.dataset.sceneState = "live";
              const dispose = () => scene.dispose();
              document.addEventListener("astro:before-swap", dispose, { once: true });
              window.addEventListener(
                "pagehide",
                (e) => {
                  if (!e.persisted) dispose();
                },
                { once: true }
              );
            })
            .catch(showFallback);
        });
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(root);
  });
}
