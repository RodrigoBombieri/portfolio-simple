/**
 * Bloom muy leve para la escena de drones (solo tema oscuro + desktop).
 * Se importa aparte, de forma dinámica: mobile y tema claro no lo descargan.
 */
import { Vector2, type Camera, type Scene, type WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export interface DroneBloom {
  render(): void;
  setSize(w: number, h: number, dpr: number): void;
  dispose(): void;
}

export function createDroneBloom(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  w: number,
  h: number,
  dpr: number
): DroneBloom {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  // Intensidad baja, radio corto y umbral alto: solo "enciende" el verde fósforo.
  const bloom = new UnrealBloomPass(new Vector2(w, h), 0.28, 0.1, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return {
    render: () => composer.render(),
    setSize: (nw, nh, ndpr) => {
      composer.setPixelRatio(ndpr);
      composer.setSize(nw, nh);
    },
    dispose: () => {
      bloom.dispose();
      composer.dispose();
    },
  };
}
