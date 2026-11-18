"use client";

import { useState } from "react";
import {
  Coins,
  Play,
  RotateCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetInterestDisbursementsQuery,
  useTriggerManualInterestDisbursementMutation,
} from "@/lib/redux/features/adminApi";
import { format } from "date-fns";

export function InterestDisbursementManager() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [triggerDisbursement, { isLoading: isTriggering }] =
    useTriggerManualInterestDisbursementMutation();

  const {
    data: disbursementsResponse,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    refetch,
  } = useGetInterestDisbursementsQuery({ limit: 10 });

  // Safe extraction of items
  const rawData: any = disbursementsResponse?.data || disbursementsResponse;
  const logs: any[] = Array.isArray(rawData?.items)
    ? rawData.items
    : Array.isArray(rawData)
    ? rawData
    : [];

  const handleTrigger = async () => {
    try {
      const res = await triggerDisbursement().unwrap();
      toast.success(
        res?.message || "Interest disbursement triggered successfully! Portfolio balances updated."
      );
      setIsConfirmOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to trigger interest disbursement."
      );
    }
  };

  const formatNaira = (koboVal: any) => {
    if (!koboVal && koboVal !== 0) return "₦0.00";
    const num = Number(koboVal) / 100;
    return `₦${num.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="bg-surface/30 border border-border/50 rounded-[20px] p-6 lg:p-8 space-y-6">
      {/* Header & Trigger Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center font-bold">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-dark font-outfit flex items-center gap-2">
                Interest Disbursement Engine
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Automated Daily Cron Active
                </Badge>
              </h3>
              <p className="text-xs font-medium text-slate/60 mt-0.5">
                Calculates and credits daily yield to user portfolio balances based on active tiers and rates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLogsLoading || isLogsFetching}
            className="h-10 px-3.5 rounded-xl border-border/40 text-xs font-bold text-slate/70 hover:bg-white hover:text-dark transition-all gap-1.5 cursor-pointer shadow-none"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLogsFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isTriggering}
            className="h-10 px-4 rounded-xl text-xs font-bold bg-[#155D5F] hover:bg-[#155D5F]/90 text-white gap-2 cursor-pointer shadow-sm transition-all"
          >
            {isTriggering ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Disbursing...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Run Disbursement Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-border/50 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-slate/60 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-[#155D5F]" />
            Midnight Execution
          </div>
          <p className="text-xs text-dark font-medium leading-relaxed">
            The background cron runs automatically every night at 00:00 UTC to disburse interest for eligible portfolios.
          </p>
        </div>

        <div className="p-4 bg-white border border-border/50 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-slate/60 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Idempotency Guard
          </div>
          <p className="text-xs text-dark font-medium leading-relaxed">
            Every portfolio credit is constrained by unique (portfolio, year, month, day) keys. Triggering manually never double-credits.
          </p>
        </div>

        <div className="p-4 bg-white border border-border/50 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-slate/60 text-xs font-bold uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            Direct Balance Growth
          </div>
          <p className="text-xs text-dark font-medium leading-relaxed">
            Disbursed yield is credited directly to active portfolio balances and logged to user wallet transactions.
          </p>
        </div>
      </div>

      {/* Disbursement Logs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate/70">
            Recent Disbursement Logs ({logs.length})
          </h4>
          <span className="text-[11px] font-medium text-slate/50">
            Showing latest disbursement history
          </span>
        </div>

        <div className="bg-white border border-border/60 rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-surface/50">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-10">Reference</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-10">Portfolio ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-10">Cycle Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-10">Rate (% P.A.)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-10">Yield Credited</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate/60 h-10 text-right">Processed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLogsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-slate/50">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#155D5F]" />
                    Loading disbursement logs...
                  </TableCell>
                </TableRow>
              ) : logs.length > 0 ? (
                logs.map((log: any) => (
                  <TableRow key={log.id || log.reference} className="border-border/30 hover:bg-surface/30">
                    <TableCell className="font-mono text-xs font-bold text-dark">
                      {log.reference || log.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate/60">
                      {log.portfolioId}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {log.year}-{String(log.month).padStart(2, "0")}
                      {log.day ? `-${String(log.day).padStart(2, "0")}` : ""}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-primary">
                      {log.annualRatePct}%
                    </TableCell>
                    <TableCell className="text-xs font-bold text-emerald-700">
                      {formatNaira(log.amountKobo)}
                    </TableCell>
                    <TableCell className="text-xs text-slate/50 text-right font-medium">
                      {log.createdAt ? format(new Date(log.createdAt), "dd MMM yyyy, HH:mm") : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-slate/50">
                    <Coins className="w-8 h-8 text-slate/20 mx-auto mb-2" />
                    No interest disbursements recorded yet.
                    <p className="text-[11px] text-slate/40 mt-1">
                      Click "Run Disbursement Now" or await the automated midnight cron.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl border border-border/50 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#155D5F]/10 text-[#155D5F] flex items-center justify-center mx-auto">
              <Play className="w-5 h-5 fill-current" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold font-outfit text-dark">
                Trigger Interest Disbursement?
              </h3>
              <p className="text-xs text-slate/60 leading-relaxed max-w-sm mx-auto">
                This will trigger an immediate interest calculation and credit eligible portfolios for the current cycle.
                The action is safe and idempotent.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isTriggering}
                className="rounded-xl text-xs font-bold px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleTrigger}
                disabled={isTriggering}
                className="rounded-xl text-xs font-bold px-5 bg-[#155D5F] hover:bg-[#155D5F]/90 text-white gap-2 cursor-pointer shadow-sm"
              >
                {isTriggering ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirm & Run
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
