import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detects amounts in kobo or raw integer numbers in activity/transaction descriptions
 * and formats them into clean Naira values (e.g. ₦200000 -> ₦2,000.00, 200000 kobo -> ₦2,000.00).
 */
export function formatCurrencyInText(text?: string | null): string {
  if (!text) return "-";

  let formatted = String(text);

  // 1. Handle "₦200000" or "₦ 200000" (raw integer after ₦ without commas or decimals)
  formatted = formatted.replace(/₦\s*(\d{3,})\b(?!\s*[\.,]\d)/g, (_, rawKoboStr) => {
    const kobo = parseFloat(rawKoboStr);
    if (isNaN(kobo)) return `₦${rawKoboStr}`;
    const naira = kobo / 100;
    return `₦${naira.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  });

  // 2. Handle explicit kobo e.g. "200000 kobo" or "200000 kobos" -> "₦2,000.00"
  formatted = formatted.replace(/\b(\d+(?:\.\d+)?)\s*kobos?\b/gi, (_, koboStr) => {
    const kobo = parseFloat(koboStr);
    if (isNaN(kobo)) return `${koboStr} kobo`;
    const naira = kobo / 100;
    return `₦${naira.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  });

  // 3. Handle bare 4+ digit integers not preceded by ₦ or $ and not followed by % or time colon
  formatted = formatted.replace(/(?<![₦$\d,])\b(\d{4,})\b(?!\s*%|\s*:\s*\d)/g, (_, bareNumStr) => {
    const kobo = parseFloat(bareNumStr);
    if (isNaN(kobo)) return bareNumStr;
    const naira = kobo / 100;
    return `₦${naira.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  });

  return formatted;
}

