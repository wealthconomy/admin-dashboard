"use client";

import { useMemo, useState, type FormEvent } from "react";
import { X, Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  InterestTier,
  InterestTierPayload,
} from "@/lib/redux/features/adminApi";
import {
  TIER_PRODUCTS,
  TierProductKey,
  findOverlappingTiers,
  formatAmountRange,
  formatDurationRange,
  formatRate,
  productKeyToType,
  productTypeToKey,
  tierMaxNaira,
  tierMinNaira,
  useAllInterestTiers,
} from "./interestTierUtils";

// ─── Form state & validation ─────────────────────────────────────────────────

interface TierFormValues {
  name: string;
  product: TierProductKey;
  minAmountNaira: string;
  maxAmountNaira: string;
  minDurationDays: string;
  maxDurationDays: string;
  annualRatePct: string;
  isActive: boolean;
}

type TierFormErrors = Partial<Record<keyof TierFormValues, string>>;

const MONEY_RE = /^\d+(\.\d{1,2})?$/;
const RATE_RE = /^\d+(\.\d{1,2})?$/;
const WHOLE_RE = /^\d+$/;

/** Naira string -> integer kobo. Rounds so float noise never reaches the API. */
const nairaToKobo = (naira: string): number => Math.round(Number(naira) * 100);

const toFormValues = (
  tier: InterestTier | null,
  defaultProduct: TierProductKey,
): TierFormValues => {
  if (!tier) {
    return {
      name: "",
      product: defaultProduct,
      minAmountNaira: "0",
      maxAmountNaira: "",
      minDurationDays: "",
      maxDurationDays: "",
      annualRatePct: "",
      isActive: true,
    };
  }
  const max = tierMaxNaira(tier);
  return {
    name: tier.name ?? "",
    product: productTypeToKey(tier.portfolioType),
    minAmountNaira: String(tierMinNaira(tier)),
    maxAmountNaira: max == null ? "" : String(max),
    minDurationDays:
      tier.minDurationDays == null ? "" : String(tier.minDurationDays),
    maxDurationDays:
      tier.maxDurationDays == null ? "" : String(tier.maxDurationDays),
    annualRatePct:
      tier.annualRatePct == null ? "" : String(tier.annualRatePct),
    isActive: tier.isActive !== false,
  };
};

export function validateTierForm(v: TierFormValues): TierFormErrors {
  const errors: TierFormErrors = {};
  const min = v.minAmountNaira.trim();
  const max = v.maxAmountNaira.trim();
  const minD = v.minDurationDays.trim();
  const maxD = v.maxDurationDays.trim();
  const rate = v.annualRatePct.trim();

  if (!v.name.trim()) errors.name = "Name is required.";

  if (!rate) {
    errors.annualRatePct = "Rate is required.";
  } else if (!RATE_RE.test(rate)) {
    errors.annualRatePct =
      "Rate must be a number with at most 2 decimal places.";
  } else if (Number(rate) < 0 || Number(rate) > 50) {
    errors.annualRatePct = "Rate must be between 0 and 50.";
  }

  if (!min) {
    errors.minAmountNaira = "Min amount is required (use 0 for no minimum).";
  } else if (!MONEY_RE.test(min)) {
    errors.minAmountNaira =
      "Min amount must be 0 or more, with at most 2 decimal places.";
  }

  if (max) {
    if (!MONEY_RE.test(max)) {
      errors.maxAmountNaira =
        "Max amount must be a number with at most 2 decimal places.";
    } else if (!errors.minAmountNaira && nairaToKobo(max) <= nairaToKobo(min)) {
      errors.maxAmountNaira = "Max amount must be greater than min amount.";
    }
  }

  if (minD && !WHOLE_RE.test(minD)) {
    errors.minDurationDays = "Min duration must be a whole number of days (0 or more).";
  }
  if (maxD) {
    if (!WHOLE_RE.test(maxD)) {
      errors.maxDurationDays = "Max duration must be a whole number of days (0 or more).";
    } else if (
      minD &&
      !errors.minDurationDays &&
      Number(maxD) < Number(minD)
    ) {
      errors.maxDurationDays =
        "Max duration must be greater than or equal to min duration.";
    }
  }

  return errors;
}

const toPayload = (v: TierFormValues): InterestTierPayload => ({
  name: v.name.trim(),
  portfolioType: productKeyToType(v.product),
  minAmountKobo: nairaToKobo(v.minAmountNaira.trim()),
  maxAmountKobo: v.maxAmountNaira.trim()
    ? nairaToKobo(v.maxAmountNaira.trim())
    : null,
  minDurationDays: v.minDurationDays.trim()
    ? Number(v.minDurationDays.trim())
    : null,
  maxDurationDays: v.maxDurationDays.trim()
    ? Number(v.maxDurationDays.trim())
    : null,
  annualRatePct: Number(v.annualRatePct.trim()),
  isActive: v.isActive,
});

// ─── Component ───────────────────────────────────────────────────────────────

export interface TierFormSubmitSummary {
  productLabel: string;
  amountRange: string;
  durationRange: string;
  oldRate: string | null;
  newRate: string;
  statusLabel: string;
  overlaps: InterestTier[];
}

interface InterestTierFormModalProps {
  /** null = create */
  tier: InterestTier | null;
  defaultProduct: TierProductKey;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: InterestTierPayload, summary: TierFormSubmitSummary) => void;
}

/**
 * Mount only while open: it loads the selected product's tiers for the
 * overlap warning.
 */
export function InterestTierFormModal({
  tier,
  defaultProduct,
  isSaving,
  onCancel,
  onSubmit,
}: InterestTierFormModalProps) {
  const isEdit = !!tier;
  const [values, setValues] = useState<TierFormValues>(() =>
    toFormValues(tier, defaultProduct),
  );
  const [showErrors, setShowErrors] = useState(false);

  const { tiers: productTiers } = useAllInterestTiers(values.product);

  const errors = useMemo(() => validateTierForm(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;

  const overlaps = useMemo(() => {
    if (hasErrors) return [];
    const p = toPayload(values);
    return findOverlappingTiers(
      {
        minKobo: p.minAmountKobo,
        maxKobo: p.maxAmountKobo,
        minDays: p.minDurationDays,
        maxDays: p.maxDurationDays,
      },
      p.portfolioType,
      productTiers,
      tier?.id,
    );
  }, [values, hasErrors, productTiers, tier?.id]);

  const set = <K extends keyof TierFormValues>(k: K, val: TierFormValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: val }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (hasErrors) return;
    const payload = toPayload(values);
    const minN = payload.minAmountKobo / 100;
    const maxN =
      payload.maxAmountKobo == null ? null : payload.maxAmountKobo / 100;
    onSubmit(payload, {
      productLabel:
        TIER_PRODUCTS.find((p) => p.key === values.product)?.label ??
        values.product,
      amountRange: formatAmountRange(minN, maxN),
      durationRange: formatDurationRange(
        payload.minDurationDays,
        payload.maxDurationDays,
      ),
      oldRate: isEdit ? formatRate(tier!.annualRatePct) : null,
      newRate: formatRate(payload.annualRatePct),
      statusLabel: payload.isActive ? "Active" : "Inactive",
      overlaps,
    });
  };

  const fieldError = (k: keyof TierFormValues) =>
    showErrors && errors[k] ? (
      <p className="text-[11px] font-semibold text-red-600 mt-1" role="alert">
        {errors[k]}
      </p>
    ) : null;

  const inputCls = (k: keyof TierFormValues) =>
    `h-11 bg-surface/50 rounded-xl px-4 text-sm font-semibold shadow-none border focus-visible:ring-primary/20 ${
      showErrors && errors[k] ? "border-red-300" : "border-border/30"
    }`;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interest-tier-form-title"
    >
      <div
        className="absolute inset-0"
        onClick={() => !isSaving && onCancel()}
      />
      <div className="relative bg-white rounded-[24px] w-full max-w-[620px] max-h-[90vh] shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-4 border-b border-border/30 flex items-center justify-between bg-surface/30">
          <div>
            <h2
              id="interest-tier-form-title"
              className="text-lg font-bold text-dark font-outfit"
            >
              {isEdit ? "Edit rate tier" : "Add rate tier"}
            </h2>
            <p className="text-xs text-slate/50 font-medium">
              Enter amounts in Naira. Leave a max empty for no limit.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="text-slate/40 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          id="interest-tier-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <div>
            <Label htmlFor="tier-name" className="text-xs font-bold text-dark">
              Name
            </Label>
            <Input
              id="tier-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. WealthFix ₦0–₦500k, 90–180 days"
              className={`${inputCls("name")} mt-1.5`}
            />
            {fieldError("name")}
          </div>

          <div>
            <Label htmlFor="tier-product" className="text-xs font-bold text-dark">
              Product
            </Label>
            <div className="relative mt-1.5">
              <select
                id="tier-product"
                value={values.product}
                onChange={(e) => set("product", e.target.value as TierProductKey)}
                className="h-11 w-full appearance-none rounded-xl bg-surface/50 border border-border/30 px-4 pr-10 text-sm font-bold text-dark focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer"
              >
                {TIER_PRODUCTS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.key === "FALLBACK" ? "All products" : p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tier-min-amount" className="text-xs font-bold text-dark">
                Min amount (₦)
              </Label>
              <Input
                id="tier-min-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={values.minAmountNaira}
                onChange={(e) => set("minAmountNaira", e.target.value)}
                className={`${inputCls("minAmountNaira")} mt-1.5`}
              />
              {fieldError("minAmountNaira")}
            </div>
            <div>
              <Label htmlFor="tier-max-amount" className="text-xs font-bold text-dark">
                Max amount (₦, optional)
              </Label>
              <Input
                id="tier-max-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="No limit"
                value={values.maxAmountNaira}
                onChange={(e) => set("maxAmountNaira", e.target.value)}
                className={`${inputCls("maxAmountNaira")} mt-1.5`}
              />
              {fieldError("maxAmountNaira")}
            </div>
            <div>
              <Label htmlFor="tier-min-days" className="text-xs font-bold text-dark">
                Min duration (days, optional)
              </Label>
              <Input
                id="tier-min-days"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Flexible"
                value={values.minDurationDays}
                onChange={(e) => set("minDurationDays", e.target.value)}
                className={`${inputCls("minDurationDays")} mt-1.5`}
              />
              {fieldError("minDurationDays")}
            </div>
            <div>
              <Label htmlFor="tier-max-days" className="text-xs font-bold text-dark">
                Max duration (days, optional)
              </Label>
              <Input
                id="tier-max-days"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="No limit"
                value={values.maxDurationDays}
                onChange={(e) => set("maxDurationDays", e.target.value)}
                className={`${inputCls("maxDurationDays")} mt-1.5`}
              />
              {fieldError("maxDurationDays")}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <Label htmlFor="tier-rate" className="text-xs font-bold text-dark">
                Rate (% P.A.)
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="tier-rate"
                  type="number"
                  min="0"
                  max="50"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 12.5"
                  value={values.annualRatePct}
                  onChange={(e) => set("annualRatePct", e.target.value)}
                  className={`${inputCls("annualRatePct")} pr-10`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate/40 pointer-events-none">
                  %
                </span>
              </div>
              {fieldError("annualRatePct")}
            </div>
            <div className="flex items-center justify-between gap-3 h-11 mt-6 px-4 rounded-xl bg-surface/50 border border-border/30">
              <Label htmlFor="tier-active" className="text-xs font-bold text-dark">
                Active
              </Label>
              <Switch
                id="tier-active"
                checked={values.isActive}
                onCheckedChange={(c) => set("isActive", !!c)}
              />
            </div>
          </div>

          {overlaps.length > 0 && (
            <div className="flex gap-3 bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-bold">
                  This tier overlaps {overlaps.length === 1 ? "an active tier" : `${overlaps.length} active tiers`} of the same product in both amount and duration:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 font-medium">
                  {overlaps.map((o) => (
                    <li key={o.id}>
                      {o.name} ({formatAmountRange(tierMinNaira(o), tierMaxNaira(o))},{" "}
                      {formatDurationRange(o.minDurationDays, o.maxDurationDays)},{" "}
                      {formatRate(o.annualRatePct)})
                    </li>
                  ))}
                </ul>
                <p className="text-amber-800/80">You can still save; check which rate should win.</p>
              </div>
            </div>
          )}
        </form>

        <div className="p-4 px-6 border-t border-border/30 flex items-center justify-end gap-3 bg-surface/20">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-xl text-xs font-bold text-slate cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="interest-tier-form"
            disabled={isSaving}
            className="rounded-xl bg-[#155D5F] hover:bg-[#0F4A4C] text-white text-xs font-bold px-6 h-11 shadow-md cursor-pointer"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? "Review changes" : "Review tier"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InterestTierFormModal;
