"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Layers,
  Info,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InterestTier,
  InterestTierPayload,
  useCreateInterestTierMutation,
  useUpdateInterestTierMutation,
  useDeleteInterestTierMutation,
} from "@/lib/redux/features/adminApi";
import {
  TIER_PRODUCTS,
  TierProductKey,
  formatAmountRange,
  formatDurationRange,
  formatRate,
  getApiErrorMessage,
  productLabel,
  tierMaxNaira,
  tierMinNaira,
  useAllInterestTiers,
} from "./interestTierUtils";
import {
  InterestTierFormModal,
  TierFormSubmitSummary,
} from "./InterestTierFormModal";
import {
  InterestTierConfirmModal,
  ConfirmDetail,
} from "./InterestTierConfirmModal";

const tierDetails = (t: InterestTier): ConfirmDetail[] => [
  { label: "Tier", value: t.name },
  { label: "Product", value: productLabel(t.portfolioType) },
  {
    label: "Amount range",
    value: formatAmountRange(tierMinNaira(t), tierMaxNaira(t)),
  },
  {
    label: "Duration",
    value: formatDurationRange(t.minDurationDays, t.maxDurationDays),
  },
  { label: "Rate", value: formatRate(t.annualRatePct) },
];

interface PendingSave {
  tierId: string | null;
  payload: InterestTierPayload;
  summary: TierFormSubmitSummary;
}

function InterestTiersTableSkeleton() {
  const skeletonRows = [
    { nameW: "w-32", amountW: "w-44", durationW: "w-24", rateW: "w-12" },
    { nameW: "w-24", amountW: "w-36", durationW: "w-20", rateW: "w-10" },
    { nameW: "w-36", amountW: "w-48", durationW: "w-28", rateW: "w-14" },
    { nameW: "w-28", amountW: "w-40", durationW: "w-20", rateW: "w-12" },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-surface/70 hover:bg-surface/70">
          <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider px-5">
            Name
          </TableHead>
          <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider">
            Amount range
          </TableHead>
          <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider">
            Duration (days)
          </TableHead>
          <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider text-right">
            Rate % P.A.
          </TableHead>
          <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider text-center">
            Active
          </TableHead>
          <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider text-right px-5">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skeletonRows.map((row, idx) => (
          <TableRow key={idx} className="hover:bg-transparent border-b border-border/30">
            <TableCell className="px-5 py-4">
              <Skeleton className={`h-4 ${row.nameW} bg-slate-200/70 rounded-md`} />
            </TableCell>
            <TableCell className="py-4">
              <Skeleton className={`h-4 ${row.amountW} bg-slate-200/70 rounded-md`} />
            </TableCell>
            <TableCell className="py-4">
              <Skeleton className={`h-4 ${row.durationW} bg-slate-200/70 rounded-md`} />
            </TableCell>
            <TableCell className="py-4 text-right">
              <Skeleton className={`h-4 ${row.rateW} ml-auto bg-slate-200/70 rounded-md`} />
            </TableCell>
            <TableCell className="py-4 text-center">
              <Skeleton className="h-5 w-9 mx-auto rounded-full bg-slate-200/70" />
            </TableCell>
            <TableCell className="px-5 py-4 text-right">
              <div className="inline-flex items-center gap-1.5 justify-end">
                <Skeleton className="h-7 w-7 rounded-lg bg-slate-200/70" />
                <Skeleton className="h-7 w-7 rounded-lg bg-slate-200/70" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function InterestRateTiersManager() {
  const [product, setProduct] = useState<TierProductKey>("WEALTH_FIX");
  const { tiers, isLoading, isFetching, error, refetch } =
    useAllInterestTiers(product);

  // Modal state
  const [formTier, setFormTier] = useState<InterestTier | null | undefined>(
    undefined,
  ); // undefined = closed, null = create
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InterestTier | null>(null);
  const [pendingToggle, setPendingToggle] = useState<InterestTier | null>(null);

  const [createTier, { isLoading: isCreating }] =
    useCreateInterestTierMutation();
  const [updateTier, { isLoading: isUpdating }] =
    useUpdateInterestTierMutation();
  const [deleteTier, { isLoading: isDeleting }] =
    useDeleteInterestTierMutation();

  const isSaving = isCreating || isUpdating;
  const isBusy = isSaving || isDeleting;
  const isTableLoading = isLoading || isFetching;
  const selectedLabel =
    TIER_PRODUCTS.find((p) => p.key === product)?.label ?? product;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleConfirmSave = async () => {
    if (!pendingSave) return;
    const { tierId, payload } = pendingSave;
    try {
      if (tierId) {
        await updateTier({ id: tierId, ...payload }).unwrap();
        toast.success("Rate tier updated");
      } else {
        await createTier(payload).unwrap();
        toast.success("Rate tier created");
      }
      setPendingSave(null);
      setFormTier(undefined);
    } catch (err) {
      // Keep the form open so the admin can correct and retry.
      setPendingSave(null);
      toast.error(getApiErrorMessage(err, "Failed to save rate tier"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTier(pendingDelete.id).unwrap();
      toast.success("Rate tier deleted");
      setPendingDelete(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete rate tier"));
    }
  };

  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;
    const next = !pendingToggle.isActive;
    try {
      await updateTier({ id: pendingToggle.id, isActive: next }).unwrap();
      toast.success(next ? "Rate tier activated" : "Rate tier deactivated");
      setPendingToggle(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update rate tier"));
    }
  };

  // ─── Confirm content ───────────────────────────────────────────────────────

  const saveDetails: ConfirmDetail[] = pendingSave
    ? [
        { label: "Product", value: pendingSave.summary.productLabel },
        { label: "Amount range", value: pendingSave.summary.amountRange },
        { label: "Duration", value: pendingSave.summary.durationRange },
        ...(pendingSave.summary.oldRate
          ? [{ label: "Old rate", value: pendingSave.summary.oldRate }]
          : []),
        { label: "New rate", value: pendingSave.summary.newRate },
        { label: "Status", value: pendingSave.summary.statusLabel },
        ...(pendingSave.summary.overlaps.length > 0
          ? [
              {
                label: "Overlaps",
                value: pendingSave.summary.overlaps
                  .map((o) => o.name)
                  .join(", "),
              },
            ]
          : []),
      ]
    : [];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      aria-labelledby="interest-tiers-heading"
      className="bg-surface/30 border border-border/50 rounded-[20px] p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="max-w-2xl">
          <h3
            id="interest-tiers-heading"
            className="text-lg font-bold text-dark font-outfit flex items-center gap-2"
          >
            <Layers className="h-5 w-5 text-[#155D5F]" />
            Rates by amount and duration
          </h3>
          <p className="text-xs font-medium text-slate/60 mt-1 leading-relaxed">
            Tiers decide the interest rate for new plans by deposit amount and
            lock duration. If no product-specific tier matches, the platform
            fallback tier applies. Changes apply to new plans only; existing
            plans keep their rate.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            id="interest-tiers-add-btn"
            type="button"
            onClick={() => setFormTier(null)}
            disabled={isBusy}
            className="h-10 rounded-xl px-4 bg-[#155D5F] hover:bg-[#155D5F]/90 text-white text-xs font-bold shadow-md shadow-primary/10 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add tier
          </Button>
        </div>
      </div>

      {/* Product pills */}
      <div
        role="tablist"
        aria-label="Product"
        className="flex flex-wrap items-center gap-2 p-1 bg-white rounded-2xl border border-border/40 w-fit mb-5"
      >
        {TIER_PRODUCTS.map((p) => (
          <button
            key={p.key}
            id={`interest-tiers-product-${p.key.toLowerCase()}`}
            type="button"
            role="tab"
            aria-selected={product === p.key}
            onClick={() => setProduct(p.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              product === p.key
                ? "bg-[#155D5F] text-white shadow-sm"
                : "text-slate/60 hover:text-dark hover:bg-surface"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Table / states */}
      <div className="bg-white border border-border/50 rounded-xl overflow-hidden">
        {isTableLoading ? (
          <InterestTiersTableSkeleton />
        ) : error ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
            <AlertCircle className="h-7 w-7 text-red-400" />
            <p className="text-sm font-bold text-dark">Could not load tiers</p>
            <p className="text-xs text-slate/60">
              {getApiErrorMessage(error, "The server did not respond.")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              className="h-9 rounded-xl px-4 text-xs font-bold cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        ) : tiers.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-6 max-w-lg mx-auto">
            <Layers className="h-8 w-8 text-slate/20" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-dark font-outfit">
                {product === "FALLBACK"
                  ? "No platform fallback tiers configured yet"
                  : `No tiers yet for ${selectedLabel}`}
              </p>
              <p className="text-xs text-slate/60 leading-relaxed">
                {product === "FALLBACK"
                  ? "Add a fallback tier to set the baseline rate when a savings plan does not match any product tier."
                  : `Add a tier to set ${selectedLabel} rates by amount and duration. If none match, the platform fallback tier applies.`}
              </p>
            </div>

            {product === "FALLBACK" && (
              <div className="mt-2 p-3.5 bg-surface/70 rounded-xl border border-border/50 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-dark">
                  <Info className="w-3.5 h-3.5 text-[#155D5F]" />
                  <span>When to use Platform Fallback:</span>
                </div>
                <p className="text-[11px] text-slate/70 leading-relaxed font-medium">
                  Fallback tiers act as a catch-all safety net across the entire platform. Since all your active savings portfolios (WealthFix, WealthFlex, WealthGoal, WealthFam, WealthFlow) now have comprehensive amount (₦1k+) and duration (30d+) coverage, configuring a fallback tier is currently optional.
                </p>
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-surface/70 hover:bg-surface/70">
                <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider px-5">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider">
                  Amount range
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider">
                  Duration (days)
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider text-right">
                  Rate % P.A.
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider text-center">
                  Active
                </TableHead>
                <TableHead className="text-[11px] font-bold text-slate/50 uppercase tracking-wider text-right px-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((t) => (
                <TableRow
                  key={t.id}
                  className={t.isActive ? "" : "opacity-60"}
                >
                  <TableCell className="px-5 py-3 text-[13px] font-bold text-dark">
                    {t.name}
                  </TableCell>
                  <TableCell className="py-3 text-[12px] font-semibold text-dark whitespace-nowrap">
                    {formatAmountRange(tierMinNaira(t), tierMaxNaira(t))}
                  </TableCell>
                  <TableCell className="py-3 text-[12px] font-semibold text-dark whitespace-nowrap">
                    {formatDurationRange(t.minDurationDays, t.maxDurationDays)}
                  </TableCell>
                  <TableCell className="py-3 text-right text-[13px] font-black text-[#155D5F] font-outfit">
                    {Number(t.annualRatePct)}%
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Switch
                      checked={!!t.isActive}
                      disabled={isBusy}
                      onCheckedChange={() => setPendingToggle(t)}
                      aria-label={`${t.isActive ? "Deactivate" : "Activate"} ${t.name}`}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormTier(t)}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg bg-white hover:bg-surface border border-border/40 text-slate/60 hover:text-[#155D5F] transition-all cursor-pointer disabled:opacity-50"
                        title="Edit tier"
                        aria-label={`Edit ${t.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(t)}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg bg-white hover:bg-surface border border-border/40 text-slate/60 hover:text-red-500 transition-all cursor-pointer disabled:opacity-50"
                        title="Delete tier"
                        aria-label={`Delete ${t.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && !error && isFetching && tiers.length > 0 && (
          <div className="px-5 py-2 border-t border-border/30 text-[11px] font-semibold text-slate/50 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Refreshing…
          </div>
        )}
      </div>

      {/* Add / edit form (mounted only while open) */}
      {formTier !== undefined && (
        <InterestTierFormModal
          key={formTier?.id ?? "new"}
          tier={formTier}
          defaultProduct={product}
          isSaving={isSaving}
          onCancel={() => setFormTier(undefined)}
          onSubmit={(payload, summary) =>
            setPendingSave({ tierId: formTier?.id ?? null, payload, summary })
          }
        />
      )}

      <InterestTierConfirmModal
        open={!!pendingSave}
        title={pendingSave?.tierId ? "Confirm tier update" : "Confirm new tier"}
        description="Review the tier before saving."
        details={saveDetails}
        confirmLabel={pendingSave?.tierId ? "Save changes" : "Create tier"}
        isLoading={isSaving}
        onConfirm={handleConfirmSave}
        onCancel={() => setPendingSave(null)}
      />

      <InterestTierConfirmModal
        open={!!pendingDelete}
        title="Delete rate tier?"
        description="This cannot be undone."
        details={pendingDelete ? tierDetails(pendingDelete) : []}
        confirmLabel="Delete tier"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <InterestTierConfirmModal
        open={!!pendingToggle}
        title={
          pendingToggle?.isActive ? "Deactivate rate tier?" : "Activate rate tier?"
        }
        details={pendingToggle ? tierDetails(pendingToggle) : []}
        confirmLabel={pendingToggle?.isActive ? "Deactivate" : "Activate"}
        isLoading={isUpdating}
        onConfirm={handleConfirmToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </section>
  );
}

export default InterestRateTiersManager;
