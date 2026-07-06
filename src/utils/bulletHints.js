// Lightweight writing lint for resume bullets. Returns at most one hint so
// the editor stays calm — priority: weak opener > too long > no metrics.

const WEAK_OPENERS = [
  "responsible for",
  "worked on",
  "worked with",
  "helped",
  "assisted",
  "involved in",
  "participated in",
  "was tasked",
  "tasked with",
  "duties included",
  "in charge of",
  "did ",
  "made ",
  "i ",
];

const MAX_LENGTH = 220;

export function bulletHint(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (WEAK_OPENERS.some((w) => lower.startsWith(w))) {
    return "Weak opener — start with a strong action verb (Built, Led, Reduced…)";
  }
  if (trimmed.length > MAX_LENGTH) {
    return "Long bullet — aim for one to two lines";
  }
  if (!/\d/.test(trimmed) && trimmed.length > 40) {
    return "Tip: add a number to quantify impact (%, users, time saved)";
  }
  return null;
}
