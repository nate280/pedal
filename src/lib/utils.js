import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Floor positions are simple numbers (1–29). Render as "Position 14". */
export function formatPosition(value, fallback = "Unassigned") {
  const n = value == null ? "" : String(value).trim();
  return n ? `Position ${n}` : fallback;
}

/** Highest floor position a studio can assign. */
export const MAX_FLOOR_POSITION = 29;
