// src/BrandOverCard.jsx
import LogoBitematch from "./LogoBiteMatch";

export default function BrandOverCard() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50">
      {/* Optional soft container so text stays readable on photos */}
      <div className="w-full px-3 pt-3">
        <div className="rounded-xl border shadow bg-white/70 backdrop-blur flex items-center justify-center py-2">
          <LogoBitematch size={22} />
        </div>
      </div>
    </div>
  );
}
