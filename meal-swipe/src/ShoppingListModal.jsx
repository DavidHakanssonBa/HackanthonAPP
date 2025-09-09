// src/ShoppingListModal.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import ShoppingList from "./ShoppingList";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { useShoppingListText } from "./useShoppingList";

const functions = getFunctions(undefined, "europe-west1");
// Koppla bara till emulator i dev:
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export async function sendCustomSms(to, message) {
  // Klient-sida validering för tydligare fel
  const toOk = typeof to === "string" && /^\+\d{7,15}$/.test(to);
  const bodyOk = typeof message === "string" && message.trim().length > 0;
  if (!toOk || !bodyOk) {
    throw new Error("Invalid input: 'to' must be E.164 (+46...) and 'message' cannot be empty.");
  }

  const fn = httpsCallable(functions, "sendSms");
  const { data } = await fn({ to, body: message.trim() });
  return data; // { sid, status }
}

export default function ShoppingListModal({ open, onClose }) {
  const { text, loading } = useShoppingListText(100);
  console.log(text)
  const [sending, setSending] = useState(false);
  const toNumber = "+46727134252"; // testnummer

  async function handleSendClick() {
    try {
      if (loading) return;                     // vänta tills texten är klar
      if (!text?.trim()) {
        alert("Shoppinglistan är inte klar ännu."); 
        return;
      }
      setSending(true);
      // Snabb sanity-logg
      // console.log({ toNumber, len: text.length, preview: text.slice(0, 40) });
      const msg = String(text ?? "").trim();
      if (!msg) {
        alert("Message is empty");
        return;
      }
      const limmsg = Array.from(msg).slice(0, 100).join("");
      const res = await sendCustomSms(toNumber, limmsg);
      // valfritt: visa feedback
      alert("SMS skickat! SID: " + res.sid);
    } catch (e) {
      console.error(e);
      alert(e.message || "Kunde inte skicka SMS.");
    } finally {
      setSending(false);
    }
  }

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
          onClick={onClose}
          aria-hidden
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-4 top-6 bottom-6 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[760px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
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

            <header className="px-5 py-4 border-b bg-gray-50 flex items-center gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Shopping List</h3>
                <p className="text-xs text-gray-500">
                  Combined ingredients from the 5 most recently liked meals
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendClick}
                aria-busy={sending}
                className={`ml-[35px] px-4 py-2 rounded-lg text-white font-medium transition
                  ${loading || sending || !text?.trim()
                    ? "bg-pink-400 cursor-not-allowed"
                    : "bg-pink-600 hover:bg-pink-700"}`}
              >
                {sending ? "Skickar…" : "Send shopping list"}
              </button>
            </header>

            <ShoppingList hideHeader />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
