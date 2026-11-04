"use client";

import { useEffect, useMemo, useState } from "react";
import {
  InterestTier,
  InterestTierPortfolioType,
  unwrapInterestTierPage,
  useGetInterestTiersQuery,
  useLazyGetInterestTiersQuery,
} from "@/lib/redux/features/adminApi";

// ─── Products ────────────────────────────────────────────────────────────────

/** "FALLBACK" is the UI key for portfolioType === null (platform-wide). */
export type TierProductKey = InterestTierPortfolioType | "FALLBACK";

export const TIER_PRODUCTS: Array<{ key: TierProductKey; label: string }> = [
  { key: "WEALTH_FIX", label: "WealthFix" },
  { key: "WEALTH_FLEX", label: "WealthFlex" },
  { key: "WEALTH_GOAL", label: "WealthGoal" },
  { key: "WEALTH_FAM", label: "WealthFam" },
  { key: "WEALTH_FLOW", label: "WealthFlow" },
  { key: "WEALTH_GROUP", label: "WealthGroup" },
  { key: "FALLBACK", label: "All products (fallback)" },
];

export const productKeyToType = (
  key: TierProductKey,
): InterestTierPortfolioType | null => (key === "FALLBACK" ? null : key);

export const productTypeToKey = (
  type: InterestTierPortfolioType | null | undefined,
): TierProductKey => (type ? type : "FALLBACK");

export const productLabel = (
  type: InterestTierPortfolioType | null | undefined,
): string =>
  TIER_PRODUCTS.find((p) => p.key === productTypeToKey(type))?.label ??
  String(type);

// ─── Formatting ──────────────────────────────────────────────────────────────

export const formatNaira = (naira: number): string =>
  `₦${naira.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

/** Prefer the Naira fields from the API; fall back to kobo / 100. */
export const tierMinNaira = (t: InterestTier): number =>
  t.minAmountNaira != null
    ? Number(t.minAmountNaira)
    : Number(t.minAmountKobo ?? 0) / 100;

export const tierMaxNaira = (t: InterestTier): number | null => {
  if (t.maxAmountNaira != null) return Number(t.maxAmountNaira);
  if (t.maxAmountKobo != null) return Number(t.maxAmountKobo) / 100;
  return null;
};

export const formatAmountRange = (min: number, max: number | null): string =>
  `${formatNaira(min)} – ${max == null ? "No limit" : formatNaira(max)}`;

export const formatDurationRange = (
  min: number | null,
  max: number | null,
): string => {
  if (min == null && max == null) return "Flexible";
  const lo = min == null ? "0" : String(min);
  const hi = max == null ? "No limit" : `${max} days`;
  return `${lo} – ${hi}`;
};

export const formatRate = (rate: number | null | undefined): string =>
  rate == null || isNaN(Number(rate)) ? "—" : `${Number(rate)}% P.A.`;

/** Extract a human-readable message from an RTK Query error. */
export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as
    | { data?: { message?: string | string[]; error?: string }; error?: string }
    | undefined;
  const msg = e?.data?.message ?? e?.data?.error ?? e?.error;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string" && msg.trim()) return msg;
  return fallback;
};

export const sortTiers = (tiers: InterestTier[]): InterestTier[] =>
  [...tiers].sort((a, b) => {
    const am = tierMinNaira(a);
    const bm = tierMinNaira(b);
    if (am !== bm) return am - bm;
    const ad = a.minDurationDays ?? -1;
    const bd = b.minDurationDays ?? -1;
    return ad - bd;
  });

// ─── Overlap detection ───────────────────────────────────────────────────────

export interface TierRange {
  minKobo: number;
  maxKobo: number | null;
  minDays: number | null;
  maxDays: number | null;
}

/**
 * Two ranges overlap when they share any interior point. Null max = infinity,
 * null min duration = 0. Touching boundaries (e.g. 0–500k and 500k–2M) are
 * NOT flagged, because the backend's inclusive/exclusive edge rule is not
 * documented in the guide.
 */
const rangesOverlap = (
  aMin: number,
  aMax: number | null,
  bMin: number,
  bMax: number | null,
): boolean => {
  const aHi = aMax == null ? Infinity : aMax;
  const bHi = bMax == null ? Infinity : bMax;
  return aMin < bHi && bMin < aHi;
};

export const findOverlappingTiers = (
  candidate: TierRange,
  candidateType: InterestTierPortfolioType | null,
  tiers: InterestTier[],
  excludeId?: string,
): InterestTier[] =>
  tiers.filter((t) => {
    if (!t.isActive) return false;
    if (excludeId && t.id === excludeId) return false;
    if ((t.portfolioType ?? null) !== (candidateType ?? null)) return false;
    const amount = rangesOverlap(
      candidate.minKobo,
      candidate.maxKobo,
      Number(t.minAmountKobo ?? 0),
      t.maxAmountKobo == null ? null : Number(t.maxAmountKobo),
    );
    const duration = rangesOverlap(
      candidate.minDays ?? 0,
      candidate.maxDays,
      t.minDurationDays ?? 0,
      t.maxDurationDays,
    );
    return amount && duration;
  });

// ─── Data hook: load every page for one product ──────────────────────────────

const PAGE_LIMIT = 50;
const MAX_PAGES = 100; // safety cap against a misbehaving pageCount

/**
 * Loads all tiers for a product (limit 50, follows pageCount). For the
 * fallback product the guide has no "portfolioType is null" filter, so all
 * tiers are loaded and filtered client-side.
 */
export function useAllInterestTiers(product: TierProductKey) {
  const baseParams = useMemo(
    () => (product === "FALLBACK" ? {} : { portfolioType: product }),
    [product],
  );

  const first = useGetInterestTiersQuery({
    ...baseParams,
    page: 1,
    limit: PAGE_LIMIT,
  });
  const [fetchPage] = useLazyGetInterestTiersQuery();

  const [extraItems, setExtraItems] = useState<InterestTier[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<unknown>(null);

  useEffect(() => {
    if (!first.data) return;
    const firstPage = unwrapInterestTierPage(first.data);
    const pageCount = Math.min(firstPage.pageCount, MAX_PAGES);
    let cancelled = false;

    (async () => {
      if (pageCount <= 1) {
        setExtraItems([]);
        setMoreError(null);
        return;
      }
      setIsLoadingMore(true);
      setMoreError(null);
      try {
        const acc: InterestTier[] = [];
        for (let page = 2; page <= pageCount; page++) {
          const res = await fetchPage({
            ...baseParams,
            page,
            limit: PAGE_LIMIT,
          }).unwrap();
          acc.push(...unwrapInterestTierPage(res).items);
        }
        if (!cancelled) setExtraItems(acc);
      } catch (err) {
        if (!cancelled) setMoreError(err);
      } finally {
        if (!cancelled) setIsLoadingMore(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [first.data, baseParams, fetchPage]);

  const isStaleProduct = Boolean(
    first.originalArgs &&
      (first.originalArgs.portfolioType ?? null) !==
        (productKeyToType(product) ?? null),
  );

  const isBusyLoading =
    first.isLoading || first.isFetching || isLoadingMore || isStaleProduct;

  const tiers = useMemo(() => {
    if (isStaleProduct) return [];
    const firstItems = first.data
      ? unwrapInterestTierPage(first.data).items
      : [];
    const all = [...firstItems, ...extraItems];
    // De-duplicate by id in case pages shift between requests.
    const byId = new Map<string, InterestTier>();
    all.forEach((t) => byId.set(t.id, t));
    const wantedType = productKeyToType(product);
    return sortTiers(
      Array.from(byId.values()).filter(
        (t) => (t.portfolioType ?? null) === wantedType,
      ),
    );
  }, [first.data, extraItems, product, isStaleProduct]);

  return {
    tiers,
    isLoading: isBusyLoading,
    isFetching: isBusyLoading,
    error: first.error ?? moreError,
    refetch: first.refetch,
  };
}
