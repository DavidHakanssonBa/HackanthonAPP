// src/utils/parseDuration.js
export function parseFractional(str) {
  // "1 1/2" or "1½" -> 1.5
  const m = String(str).trim().match(/^(\d+)(?:\s+(\d+)\/(\d+))?$/);
  if (m) {
    const whole = parseInt(m[1], 10);
    if (m[2] && m[3]) return whole + parseInt(m[2], 10) / parseInt(m[3], 10);
    return whole;
  }
  // "1½"
  const frac = String(str).trim().replace("½", ".5").replace("¼",".25").replace("¾",".75");
  const n = parseFloat(frac);
  return isNaN(n) ? null : n;
}

// Return seconds or null
export function parseDurationToSeconds(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  // e.g., "30 to 45 seconds", "30–45 sec"
  let m = t.match(/(\d+)\s*(?:-|to|–|—)\s*(\d+)\s*(seconds?|secs?|s)\b/);
  if (m) return Math.round(((+m[1] + +m[2]) / 2) * 1); // avg seconds

  m = t.match(/(\d+(?:\s+\d+\/\d+)?|\d+[¼½¾]?)\s*(hours?|hrs?|h)\b/);
  if (m) {
    const n = parseFractional(m[1]);
    if (n != null) return Math.round(n * 3600);
  }

  m = t.match(/(\d+(?:\s+\d+\/\d+)?|\d+[¼½¾]?)\s*(minutes?|mins?|m)\b/);
  if (m) {
    const n = parseFractional(m[1]);
    if (n != null) return Math.round(n * 60);
  }

  m = t.match(/(\d+)\s*(seconds?|secs?|s)\b/);
  if (m) return parseInt(m[1], 10);

  return null;
}
