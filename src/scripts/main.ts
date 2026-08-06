import { initSmoothScroll } from "@scripts/smoothScroll";
import { initAnimations } from "@scripts/animations";
import { SITE } from "@data/site";

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

/** Toggle de tema claro/oscuro, persistido en localStorage */
function initThemeToggle(): void {
  const toggles = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");
  if (!toggles.length) return;

  const themeColor: Record<"dark" | "light", string> = {
    dark: "#05070d",
    light: "#f6f8fb",
  };

  const applyTheme = (theme: "dark" | "light") => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector<HTMLMetaElement>("#theme-color-meta");
    if (meta) meta.content = themeColor[theme];
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = current === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* localStorage no disponible: el cambio no persiste entre visitas */
      }
    });
  });
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
        window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
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
  initThemeToggle();
  initContactForm();
  initSmoothScroll();
  initAnimations();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
