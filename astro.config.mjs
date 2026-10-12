// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// Dominio real de producción (afecta sitemap.xml, canonical y og:url)
const SITE_URL = "https://www.bombieridev.com.ar";

export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // Solo afecta a `npm run dev`: las escenas 3D importan Three con import
    // dinámico, así que Vite descubre estos módulos tarde y la primera carga
    // falla con "Outdated Optimize Dep" (504) y queda el fallback estático.
    // Listarlos acá hace que Vite los pre-empaquete al arrancar.
    optimizeDeps: {
      include: [
        "three",
        "three/examples/jsm/lines/Line2.js",
        "three/examples/jsm/lines/LineGeometry.js",
        "three/examples/jsm/lines/LineMaterial.js",
        "three/examples/jsm/lines/LineSegments2.js",
        "three/examples/jsm/lines/LineSegmentsGeometry.js",
        "three/examples/jsm/postprocessing/EffectComposer.js",
        "three/examples/jsm/postprocessing/RenderPass.js",
        "three/examples/jsm/postprocessing/UnrealBloomPass.js",
        "three/examples/jsm/postprocessing/OutputPass.js",
        "three/examples/jsm/utils/BufferGeometryUtils.js",
      ],
    },
  },
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
});
