// src/BrandBadge.jsx
import LogoBitematch from "./LogoBiteMatch";

export default function BrandBadge() {
  return (
    <a
      href="/"
      className="fixed top-4 left-4 z-[1200] rounded-full bg-white/80 backdrop-blur border shadow px-3 py-2 hover:bg-white transition"
      aria-label="Bitematch home"
    >
      <LogoBitematch size={22} />
    </a>
  );
}
