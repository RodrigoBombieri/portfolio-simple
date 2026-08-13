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
  const modalFrame = document.querySelector<HTMLIFrameElement>("[data-mockup-modal-frame]");
  const modalTitle = document.querySelector<HTMLElement>("[data-mockup-modal-title]");
  const modalClose = document.querySelector<HTMLElement>("[data-mockup-modal-close]");
  if (!modal || !modalFrame) return;

  function openModal(src: string, title: string): void {
    if (!modal || !modalFrame) return;
    modalFrame.src = src;
    if (modalTitle) modalTitle.textContent = title;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal(): void {
    if (!modal || !modalFrame) return;
    modal.classList.add("hidden");
    modalFrame.src = "about:blank";
    document.body.style.overflow = "";
  }

  document.querySelectorAll<HTMLElement>("[data-mockup-open]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const src = trigger.dataset.src;
      const title = trigger.dataset.title ?? "";
      if (src) openModal(src, title);
    });
  });

  modalClose?.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });
}
