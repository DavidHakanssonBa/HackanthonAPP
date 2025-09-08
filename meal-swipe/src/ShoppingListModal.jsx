// src/ShoppingListModal.jsx
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import ShoppingList from "./ShoppingList";

export default function ShoppingListModal({ open, onClose }) {
  // ESC to close + lock body scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // click backdrop to close
          aria-hidden
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-4 top-6 bottom-6 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[760px] max-h-[85vh] overflow-y-auto"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()} // don't close when clicking content
          >
            {/* Close button floating over the card */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/90 border shadow hover:bg-white"
              aria-label="Close"
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Your existing ShoppingList card drops right in */}
            <ShoppingList />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
