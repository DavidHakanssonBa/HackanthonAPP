// src/LogoBitematch.jsx
export default function LogoBitematch({
  size = 28,           // flame icon size in px
  showWordmark = true, // toggle the "bitematch" text
  className = "",
}) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        aria-hidden="true"
        role="img"
      >
        <defs>
          <linearGradient id="bmGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff7ab8" />
            <stop offset="100%" stopColor="#ff3d6e" />
          </linearGradient>
        </defs>
        {/* Soft shadow */}
        <ellipse cx="32" cy="52" rx="14" ry="6" fill="rgba(0,0,0,.06)" />
        {/* Outer flame */}
        <path
          d="
            M32 6
            C26 16, 44 20, 38 34
            C36 28, 24 30, 24 44
            C24 54, 31 58, 38 58
            C50 58, 58 50, 58 40
            C58 28, 50 20, 44 16
            C44 24, 40 28, 40 28
            C44 22, 42 14, 32 6
            Z
          "
          fill="url(#bmGrad)"
        />
        {/* Inner flame/ember */}
        <path
          d="
            M40 34
            C37 29, 30 30, 28 36
            C26 41, 29 48, 36 48
            C42 48, 47 44, 47 38
            C47 33, 43 31, 40 34
            Z
          "
          fill="#fff"
          fillOpacity="0.28"
        />
      </svg>

      {showWordmark && (
        <span className="font-semibold tracking-tight"
              style={{
                background: "linear-gradient(90deg,#ff7ab8,#ff3d6e)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent"
              }}>
          bitematch
        </span>
      )}
    </div>
  );
}
