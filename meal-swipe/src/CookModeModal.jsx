// src/CookModeModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { parseDurationToSeconds } from "./utils/parseDuration";

export default function CookModeModal({ open, onClose, meal }) {
  // Steps from instructions
  const steps = useMemo(() => {
    const raw = meal?.strInstructions || "";
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [meal]);

  const [idx, setIdx] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [timerSecLeft, setTimerSecLeft] = useState(null);
  const [sending, setSending] = useState(false); // reserved if you want to “share step” later

  const stepText = steps[idx] || "";
  const suggested = parseDurationToSeconds(stepText);

  // ----- Speech synthesis -----
  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }
  function stopSpeak() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  // ----- Voice recognition (if supported) -----
  const recRef = useRef(null);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!open || !SR) return;
    if (!micOn) return;

    const rec = new SR();
    rec.lang = "en-US"; // change if you want SV
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .toLowerCase();
      if (/next|nästa/.test(transcript)) next();
      else if (/back|previous|föregående|tillbaka/.test(transcript)) prev();
      else if (/repeat|again|upprepa/.test(transcript)) repeat();
      else if (/start.*timer/.test(transcript)) startTimer(suggested || 60);
      else if (/stop.*timer|cancel timer/.test(transcript)) stopTimer();
      else if (/pause/.test(transcript)) stopSpeak();
      else if (/read|play|go/.test(transcript)) speak(stepText);
    };
    rec.onerror = () => {};
    rec.onend = () => {
      // auto-restart while mic is on
      if (micOn) rec.start();
    };
    rec.start();
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
  }, [open, micOn, idx, suggested, stepText]);

  // ----- Timers -----
  useEffect(() => {
    if (timerSecLeft == null) return;
    const id = setInterval(() => {
      setTimerSecLeft((s) => {
        if (s == null) return null;
        if (s <= 1) {
          clearInterval(id);
          if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
          speak("Timer done!");
          return null;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerSecLeft]);

  function startTimer(sec) {
    if (!sec || sec <= 0) return;
    setTimerSecLeft(sec);
  }
  function stopTimer() {
    setTimerSecLeft(null);
  }

  // ----- Step nav -----
  function next() { stopTimer(); stopSpeak(); setIdx((i) => Math.min(i + 1, steps.length - 1)); }
  function prev() { stopTimer(); stopSpeak(); setIdx((i) => Math.max(i - 1, 0)); }
  function repeat() { stopTimer(); speak(stepText); }

  // Lock body scroll + ESC close
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

  useEffect(() => {
    // reset when meal changes
    setIdx(0);
    setTimerSecLeft(null);
    stopSpeak();
  }, [meal]);

  if (!open || typeof document === "undefined") return null;

  const img = meal?.strMealThumb;
  const total = steps.length;
  const pct = total ? Math.round(((idx + 1) / total) * 100) : 0;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1200] bg-black/50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog" aria-modal="true"
            className="absolute inset-x-4 top-6 bottom-6 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[820px] max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border bg-white"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background image blur */}
            {img && (
              <div
                className="absolute inset-0 -z-10"
                style={{
                  backgroundImage: `url(${img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(16px)",
                  transform: "scale(1.08)",
                  opacity: 0.25,
                }}
              />
            )}

            {/* Header */}
            <div className="px-5 py-3 bg-white/80 backdrop-blur border-b flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Cook Mode</div>
                <h3 className="text-lg font-semibold truncate">{meal?.strMeal || "Meal"}</h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Progress */}
                <div className="text-xs text-gray-600">{idx + 1}/{total} · {pct}%</div>

                {/* Mic toggle */}
                <button
                  onClick={() => setMicOn((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${micOn ? "bg-green-600 text-white" : "bg-white hover:bg-gray-50"}`}
                  title="Hands-free voice commands"
                >
                  {micOn ? "🎙️ On" : "🎙️ Off"}
                </button>

                {/* Close */}
                <button
                  onClick={() => { stopSpeak(); onClose?.(); }}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full border bg-white hover:bg-gray-50"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-56px)]">
              {/* Step text */}
              <div className="rounded-xl border bg-white/90 backdrop-blur p-4 shadow">
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {stepText || "No instructions."}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => speak(stepText)}
                    className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    🔊 Read step
                  </button>
                  <button
                    onClick={stopSpeak}
                    className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
                  >
                    ⏹ Stop
                  </button>

                  {suggested && (
                    <button
                      onClick={() => startTimer(suggested)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                      title={`Start ${Math.round(suggested/60) || suggested}s timer`}
                    >
                      ⏱️ Start {suggested >= 60 ? `${Math.round(suggested/60)} min` : `${suggested} s`} timer
                    </button>
                  )}

                  {timerSecLeft != null && (
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm">Time left: {formatTime(timerSecLeft)}</span>
                      <button
                        onClick={stopTimer}
                        className="px-2 py-1 rounded border text-xs bg-white hover:bg-gray-50"
                      >
                        Stop timer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Nav */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={idx === 0}
                  className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={repeat}
                    className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
                  >
                    Repeat
                  </button>
                  <button
                    onClick={next}
                    disabled={idx >= steps.length - 1}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white hover:brightness-110 disabled:opacity-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}
