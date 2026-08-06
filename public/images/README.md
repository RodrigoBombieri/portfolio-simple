# Imágenes del proyecto

Coloca aquí las imágenes reales referenciadas en `src/data/projects.ts`:

- `proyecto-erp.jpg` — Sistema de gestión empresarial
- `proyecto-landing.png` — Landing corporativa
- `proyecto-stock.png` — Sistema de stock
- `proyecto-plataforma.jpg` — Plataforma web
- `proyecto-drones.jpg` — Software para drones
- `proyecto-api.png` — Web API para profesionales

Recomendaciones:

- Formato `.webp` o `.jpg` optimizado, relación de aspecto 16:9 para proyectos.
- Peso recomendado < 200 KB por imagen para mantener el Lighthouse > 95.
- Si usas `<Image />` de `astro:assets`, muévelas a `src/assets/` en vez de `public/` para optimización automática.

Mientras no existan, las tarjetas ocultan la imagen rota automáticamente (ver `onerror` en `ProjectCard.astro`).
