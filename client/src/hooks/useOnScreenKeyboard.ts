import { useState, useCallback, useEffect, useRef } from "react";

let inputCounter = 0;
const randomSuffix = Math.random().toString(36).slice(2, 6);

let oskInteracting = false;
let oskInteractingTimer: ReturnType<typeof setTimeout> | null = null;
let savedActiveInputId: string | null = null;
let restoreCallback: ((id: string) => void) | null = null;

export function markOskInteracting(currentActiveId: string | null) {
  oskInteracting = true;
  if (currentActiveId) {
    savedActiveInputId = currentActiveId;
  }
  if (oskInteractingTimer) clearTimeout(oskInteractingTimer);
  oskInteractingTimer = setTimeout(() => {
    oskInteracting = false;
    if (savedActiveInputId && restoreCallback) {
      const el = document.getElementById(savedActiveInputId);
      if (el) {
        restoreCallback(savedActiveInputId);
        el.focus();
      }
    }
  }, 200);
}

function suppressAutofill(el: HTMLInputElement | HTMLTextAreaElement) {
  el.setAttribute("autocomplete", "nope-" + randomSuffix);
  el.setAttribute("data-lpignore", "true");
  el.setAttribute("data-form-type", "other");
  el.setAttribute("data-1p-ignore", "true");

  if (el.tagName === "INPUT") {
    const input = el as HTMLInputElement;
    const t = input.type;
    if (t === "email" || t === "tel" || t === "url") {
      input.setAttribute("data-orig-type", t);
      input.type = "text";
    }
  }

  if (el.name) {
    el.setAttribute("data-orig-name", el.name);
    el.name = "osk_" + randomSuffix + "_" + (el.getAttribute("data-orig-name") || "f");
  }
}

function suppressAllInputs(container: HTMLElement) {
  const inputs = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  inputs.forEach(suppressAutofill);

  const forms = container.querySelectorAll("form");
  forms.forEach(f => f.setAttribute("autocomplete", "off"));
}

export function useOnScreenKeyboard() {
  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const listenersAttached = useRef(false);
  const docListenersAttached = useRef(false);
  const focusOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeInputIdRef = useRef<string | null>(null);

  activeInputIdRef.current = activeInputId;

  const scrollInputIntoView = useCallback((inputId: string) => {
    setTimeout(() => {
      const el = document.getElementById(inputId);
      if (!el) return;
      const kbd = document.getElementById("osk-keyboard");
      const kbdHeight = kbd ? kbd.getBoundingClientRect().height : 280;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const visibleBottom = viewportHeight - kbdHeight - 20;

      if (rect.bottom > visibleBottom || rect.top < 0) {
        const targetY = visibleBottom - rect.height - 40;
        const scrollAmount = rect.top - targetY;

        let scrolled = false;
        let node: HTMLElement | null = el.parentElement;
        while (node && node !== document.body) {
          const style = window.getComputedStyle(node);
          const isScrollable = (style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight;
          if (isScrollable) {
            node.scrollBy({ top: scrollAmount, behavior: "smooth" });
            scrolled = true;
            break;
          }
          node = node.parentElement;
        }

        if (!scrolled) {
          window.scrollBy({ top: scrollAmount, behavior: "smooth" });
        }
      }
    }, 50);
  }, []);

  const safeSetActiveInputId = useCallback((id: string | null) => {
    activeInputIdRef.current = id;
    setActiveInputId(id);
    if (id) {
      savedActiveInputId = id;
      scrollInputIntoView(id);
    }
  }, [scrollInputIntoView]);

  useEffect(() => {
    restoreCallback = (id: string) => {
      safeSetActiveInputId(id);
    };
    return () => {
      restoreCallback = null;
    };
  }, [safeSetActiveInputId]);

  const clearFocusTimer = useCallback(() => {
    if (focusOutTimer.current) {
      clearTimeout(focusOutTimer.current);
      focusOutTimer.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearFocusTimer();
    focusOutTimer.current = setTimeout(() => {
      if (oskInteracting) return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      const kbd = document.getElementById("osk-keyboard");
      if (kbd && active && kbd.contains(active)) return;
      safeSetActiveInputId(null);
      savedActiveInputId = null;
    }, 250);
  }, [clearFocusTimer, safeSetActiveInputId]);

  const attachListeners = useCallback((container: HTMLDivElement) => {
    if (listenersAttached.current) return;
    listenersAttached.current = true;

    suppressAllInputs(container);

    const observer = new MutationObserver(() => {
      suppressAllInputs(container);
    });
    observer.observe(container, { childList: true, subtree: true });

    function handleFocusIn(e: FocusEvent) {
      clearFocusTimer();
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        const inputEl = target as HTMLInputElement;
        if (inputEl.type === "checkbox" || inputEl.type === "radio" || inputEl.type === "hidden" || inputEl.type === "file") return;
        suppressAutofill(inputEl);
        if (!target.id) {
          inputCounter++;
          target.id = `osk-input-${inputCounter}`;
        }
        safeSetActiveInputId(target.id);
      }
    }

    function handleFocusOut() {
      if (oskInteracting) return;
      scheduleDismiss();
    }

    container.addEventListener("focusin", handleFocusIn);
    container.addEventListener("focusout", handleFocusOut);
  }, [clearFocusTimer, scheduleDismiss, safeSetActiveInputId]);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      containerElRef.current = node;
      attachListeners(node);
    }
  }, [attachListeners]);

  useEffect(() => {
    if (docListenersAttached.current) return;
    docListenersAttached.current = true;

    const portalObserver = new MutationObserver(() => {
      const portals = document.querySelectorAll("[data-radix-portal], [role='dialog']");
      portals.forEach(portal => {
        suppressAllInputs(portal as HTMLElement);
      });
    });
    portalObserver.observe(document.body, { childList: true, subtree: true });

    function handleDocFocusIn(e: FocusEvent) {
      clearFocusTimer();
      const target = e.target as HTMLElement;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

      const inputEl = target as HTMLInputElement;
      if (inputEl.type === "checkbox" || inputEl.type === "radio" || inputEl.type === "hidden" || inputEl.type === "file") return;

      if (containerElRef.current && containerElRef.current.contains(target)) return;

      suppressAutofill(inputEl);
      if (!target.id) {
        inputCounter++;
        target.id = `osk-input-${inputCounter}`;
      }
      safeSetActiveInputId(target.id);
    }

    function handleDocFocusOut(e: FocusEvent) {
      const target = e.target as HTMLElement;
      if (containerElRef.current && containerElRef.current.contains(target)) return;
      if (oskInteracting) return;
      scheduleDismiss();
    }

    document.addEventListener("focusin", handleDocFocusIn);
    document.addEventListener("focusout", handleDocFocusOut);

    return () => {
      portalObserver.disconnect();
      document.removeEventListener("focusin", handleDocFocusIn);
      document.removeEventListener("focusout", handleDocFocusOut);
    };
  }, [clearFocusTimer, scheduleDismiss, safeSetActiveInputId]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (oskInteracting) return;
      const target = e.target as HTMLElement;
      const keyboard = document.getElementById("osk-keyboard");
      if (keyboard && keyboard.contains(target)) return;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (target.closest("input") || target.closest("textarea")) return;
      safeSetActiveInputId(null);
      savedActiveInputId = null;
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [safeSetActiveInputId]);

  const closeKeyboard = useCallback(() => {
    safeSetActiveInputId(null);
    savedActiveInputId = null;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [safeSetActiveInputId]);

  return { activeInputId, closeKeyboard, containerRef };
}
