import { initSmoothScroll } from "@scripts/smoothScroll";
import { initAnimations } from "@scripts/animations";

/** Menú móvil: abrir/cerrar + accesibilidad */
function initMobileMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const menu = document.querySelector<HTMLElement>("[data-mobile-menu]");
  const iconOpen = document.querySelector<HTMLElement>("[data-menu-icon-open]");
  const iconClose = document.querySelector<HTMLElement>("[data-menu-icon-close]");

  if (!toggle || !menu) return;

  const close = () => {
    menu.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
    iconOpen?.classList.remove("hidden");
    iconClose?.classList.add("hidden");
  };

  const open = () => {
    menu.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
    iconOpen?.classList.add("hidden");
    iconClose?.classList.remove("hidden");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? close() : open();
  });

  document.querySelectorAll("[data-mobile-link]").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("nav:close-mobile-menu", close);
}

/** Envío del formulario de contacto */
function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const endpoint = form.dataset.endpoint;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!status) return;

    const formData = new FormData(form);
    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    submitButton?.setAttribute("disabled", "true");
    status.textContent = "Enviando...";

    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Error en el envío");
      } else {
        // Sin endpoint configurado: fallback a mailto
        const name = formData.get("name");
        const email = formData.get("email");
        const message = formData.get("message");
        const subject = encodeURIComponent(`Presupuesto — ${name}`);
        const body = encodeURIComponent(`${message}\n\nContacto: ${email}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }

      status.textContent = "¡Gracias! Te responderé a la brevedad.";
      form.reset();
    } catch (error) {
      status.textContent = "Hubo un error. Escribime directamente por email o WhatsApp.";
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
}

function init(): void {
  initMobileMenu();
  initContactForm();
  initSmoothScroll();
  initAnimations();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
