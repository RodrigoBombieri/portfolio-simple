/**
 * Bloom muy leve para el fósforo (solo tema oscuro + desktop). Se carga aparte
 * con import dinámico para que mobile / tema claro nunca descarguen el composer.
 */
import { Vector2, type Camera, type Scene, type WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export interface Bloom {
  render(): void;
  setSize(w: number, h: number, dpr: number): void;
  dispose(): void;
}

export function createBloom(renderer: WebGLRenderer, scene: Scene, camera: Camera, w: number, h: number, dpr: number): Bloom {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  // Intensidad baja, radio corto y umbral alto: solo "enciende" los pulsos verdes.
  const bloom = new UnrealBloomPass(new Vector2(w, h), 0.3, 0.08, 0.6);
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
