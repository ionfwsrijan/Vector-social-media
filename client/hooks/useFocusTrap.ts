import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useFocusTrap(active: boolean) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Save the element that was focused before modal opened
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!active) return;

        // Save current focus so we can restore it on close
        previouslyFocusedRef.current = document.activeElement as HTMLElement;

        // Move focus to the first focusable element inside the modal
        const container = containerRef.current;
        if (container) {
            const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
            firstFocusable?.focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!containerRef.current) return;

            const focusableElements = Array.from(
                containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
            );

            if (focusableElements.length === 0) return;

            const firstEl = focusableElements[0];
            const lastEl = focusableElements[focusableElements.length - 1];

            // Trap Tab / Shift+Tab inside the modal
            if (e.key === "Tab") {
                if (e.shiftKey) {
                    // Shift+Tab: if focus is on first element, wrap to last
                    if (document.activeElement === firstEl) {
                        e.preventDefault();
                        lastEl.focus();
                    }
                } else {
                    // Tab: if focus is on last element, wrap to first
                    if (document.activeElement === lastEl) {
                        e.preventDefault();
                        firstEl.focus();
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            // Restore focus to the previously focused element on unmount
            previouslyFocusedRef.current?.focus();
        };
    }, [active]);

    return containerRef;
}