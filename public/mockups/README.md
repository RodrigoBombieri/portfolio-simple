# /public/mockups

Mockups del showroom generados en Claude Design, embebidos en vivo (no son capturas)
en `/showroom` vía iframe. Ver `src/data/showroom.ts` (data), `src/components/ui/ShowroomCard.astro`
(card + trigger del modal) y `src/scripts/mockupEmbeds.ts` (lazy-load + modal).

## Estructura

- `web-1..4.dc.html`, `mobile-1..4.dc.html` — cada mockup.
- `support.js` — runtime compartido por **todos** los `.dc.html` (carga React/Babel desde unpkg
  al abrirse). No se toca, no se duplica por mockup.
- `image-slot.js` — helper opcional para zonas de imagen tipo "subí tu foto" (lo usa `web-4`,
  puede reaparecer en mockups futuros).

Al agregar un mockup nuevo desde Claude Design: solo hace falta copiar su `.dc.html` acá
(mismo nombre que uses en `showroom.ts`) — `support.js` e `image-slot.js` ya están y se
reutilizan automáticamente por la ruta relativa `./support.js` que trae cada export.

## Requiere internet en el navegador del visitante

Cada `.dc.html` carga React, Babel y las fuentes/íconos desde CDN (unpkg, Google Fonts) al
renderizarse. Es transparente para el visitante (pasa en un instante), pero no va a
funcionar si se abre offline o en una red que bloquee esos dominios.
