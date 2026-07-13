import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true"
  );
}

export function useAccessibleDialog(isOpen, onClose) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  const captureOpener = useCallback((event) => {
    openerRef.current = event?.currentTarget || document.activeElement;
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (!openerRef.current && document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement;
    }

    const focusInitialControl = () => {
      const initialControl = dialog.querySelector("[data-dialog-initial-focus]");
      const fallbackControl = getFocusableElements(dialog)[0];
      (initialControl || fallbackControl || dialog).focus();
    };
    const focusTimer = window.setTimeout(focusInitialControl, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);

      const opener = openerRef.current;
      openerRef.current = null;
      if (opener?.isConnected) {
        opener.focus();
      }
    };
  }, [isOpen, onClose]);

  return { captureOpener, dialogRef };
}
