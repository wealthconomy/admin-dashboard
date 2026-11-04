"use client";

import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NEW_PLANS_NOTICE =
  "Applies to new plans only. Existing plans keep their locked rate.";

export interface ConfirmDetail {
  label: string;
  value: string;
}

interface InterestTierConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  details?: ConfirmDetail[];
  /** Highlighted notice text; defaults to the "new plans only" notice. Pass null to hide. */
  notice?: string | null;
  confirmLabel?: string;
  tone?: "default" | "danger";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Mirrors the look of the App Release confirmation modal in
 * src/app/dashboard/system-config/page.tsx.
 */
export function InterestTierConfirmModal({
  open,
  title,
  description,
  details = [],
  notice = NEW_PLANS_NOTICE,
  confirmLabel = "Confirm",
  tone = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: InterestTierConfirmModalProps) {
  if (!open) return null;
  const danger = tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interest-tier-confirm-title"
    >
      <div className="bg-white rounded-[24px] w-full max-w-lg shadow-xl flex flex-col p-6 animate-in zoom-in-95 duration-200 space-y-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
              danger
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-amber-50 border-amber-200 text-amber-600"
            }`}
          >
            {danger ? (
              <Trash2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3
              id="interest-tier-confirm-title"
              className="text-lg font-bold font-outfit text-dark"
            >
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate/50">{description}</p>
            )}
          </div>
        </div>

        {details.length > 0 && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 bg-surface/40 border border-border/40 rounded-xl p-4 text-xs">
            {details.map((d) => (
              <div key={d.label} className="contents">
                <dt className="font-bold text-slate/60">{d.label}</dt>
                <dd className="font-semibold text-dark break-words">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {notice && (
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 text-xs font-semibold text-amber-900 leading-relaxed">
            {notice}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 px-5 rounded-xl border-border/50 text-xs font-bold text-slate hover:bg-surface"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`h-11 px-6 rounded-xl text-white text-xs font-bold shadow-md ${
              danger
                ? "bg-red-600 hover:bg-red-600/90 shadow-red-200"
                : "bg-[#155D5F] hover:bg-[#155D5F]/90 shadow-primary/20"
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InterestTierConfirmModal;
