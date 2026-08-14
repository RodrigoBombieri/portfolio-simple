/**
 * Embeds en vivo del showroom: cada card con `data-mockup-thumb` monta un iframe
 * apuntando al .dc.html real (Claude Design) recién cuando entra en viewport,
 * escalado con `transform` para entrar en el tamaño de la card. Al hacer click
 * se abre un modal con el mismo mockup a tamaño completo e interactivo.
 */
export function initMockupEmbeds(): void {
  const thumbs = document.querySelectorAll<HTMLElement>("[data-mockup-thumb]");
  if (!thumbs.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        mountThumb(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "200px" }
  );

  thumbs.forEach((thumb) => io.observe(thumb));

  function mountThumb(thumb: HTMLElement): void {
    const src = thumb.dataset.src;
    const w = Number(thumb.dataset.w);
    const h = Number(thumb.dataset.h);
    if (!src || !w || !h) return;

    const rect = thumb.getBoundingClientRect();
    const scale = rect.width / w;

    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.loading = "lazy";
    iframe.setAttribute("tabindex", "-1");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = `position:absolute;top:0;left:0;width:${w}px;height:${h}px;border:0;pointer-events:none;transform-origin:top left;transform:scale(${scale});background:#0a0c0f`;

    iframe.addEventListener("load", () => {
      const skeleton = thumb.querySelector<HTMLElement>("[data-mockup-skeleton]");
      if (skeleton) skeleton.style.display = "none";
    });

    thumb.appendChild(iframe);
  }

  // --- Modal a tamaño completo, interactivo ---
  const modal = document.querySelector<HTMLElement>("[data-mockup-modal]");
  const modalViewport = document.querySelector<HTMLElement>("[data-mockup-modal-viewport]");
  const modalFrame = document.querySelector<HTMLIFrameElement>("[data-mockup-modal-frame]");
  const modalTitle = document.querySelector<HTMLElement>("[data-mockup-modal-title]");
  const modalClose = document.querySelector<HTMLElement>("[data-mockup-modal-close]");
  if (!modal || !modalFrame || !modalViewport) return;

  // Tamaño "de diseño" del mockup actualmente abierto, para poder recalcular
  // el escalado si el usuario rota el teléfono o cambia el tamaño de ventana.
  let currentModalSize: { w?: number; h?: number } = {};

  function applyModalScale(): void {
    if (!modalFrame || !modalViewport) return;
    const { w, h } = currentModalSize;
    if (!w || !h) {
      modalFrame.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;background:var(--color-bg);";
      return;
    }
    const rect = modalViewport.getBoundingClientRect();
    // Nunca escalar hacia arriba más allá del tamaño real del diseño: solo achicar
    // lo necesario para que entre completo en el viewport disponible del modal
    // (evita que un mockup mobile quede gigante en un modal de escritorio, y que
    // uno "web" quede recortado/con scroll horizontal en un modal de celular).
    const scale = Math.min(rect.width / w, rect.height / h, 1);
    modalFrame.style.cssText = `position:absolute;top:50%;left:50%;width:${w}px;height:${h}px;border:0;background:var(--color-bg);transform-origin:center center;transform:translate(-50%,-50%) scale(${scale});`;
  }

  function openModal(src: string, title: string, w?: number, h?: number): void {
    if (!modal || !modalFrame) return;
    currentModalSize = { w, h };
    modalFrame.src = src;
    if (modalTitle) modalTitle.textContent = title;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    // El modal recién se hace visible acá, así que el viewport todavía no tenía
    // dimensiones reales en el momento del click: esperar un frame antes de medir.
    requestAnimationFrame(applyModalScale);
  }

  function closeModal(): void {
    if (!modal || !modalFrame) return;
    modal.classList.add("hidden");
    modalFrame.src = "about:blank";
    document.body.style.overflow = "";
    currentModalSize = {};
  }

  document.querySelectorAll<HTMLElement>("[data-mockup-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const src = trigger.dataset.src;
      const title = trigger.dataset.title ?? "";
      const w = Number(trigger.dataset.w) || undefined;
      const h = Number(trigger.dataset.h) || undefined;
      if (src) openModal(src, title, w, h);
    });
  });

  modalClose?.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });
  // Recalcula si el usuario rota el teléfono o redimensiona la ventana con el modal abierto.
  window.addEventListener("resize", () => {
    if (!modal.classList.contains("hidden")) applyModalScale();
  });
}
