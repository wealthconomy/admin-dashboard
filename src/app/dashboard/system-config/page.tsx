"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Save, ChevronDown, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  useGetSettingsQuery, 
  useUpdateSettingsMutation,
  useGetEmailTemplatesQuery,
  useUpdateEmailTemplateMutation,
  usePreviewEmailTemplateMutation,
  useGetSystemConfigQuery,
  useUpdateSystemConfigByKeyMutation,
} from "@/lib/redux/features/adminApi";

// ─── App Release Helpers ───────────────────────────────────────────────────────

function compareVersions(v1: string, v2: string): number {
  const p1 = v1.split(".").map(Number);
  const p2 = v2.split(".").map(Number);
  const len = Math.max(p1.length, p2.length, 3);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function isoToDatetimeLocal(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

function formatLocalDateTime(val?: string): string {
  if (!val) return "";
  const date = new Date(val);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface InterestRatesForm {
  INTEREST_RATE_WEALTH_GOAL: string;
  INTEREST_RATE_WEALTH_FIX: string;
  INTEREST_RATE_WEALTH_FLEX: string;
  INTEREST_RATE_WEALTH_FAM: string;
  INTEREST_RATE_WEALTH_FLOW: string;
  INTEREST_RATE_WEALTH_GROUP: string;
  PENALTY_RATE_WEALTH_GOAL: string;
  PENALTY_RATE_WEALTH_FAM: string;
  PENALTY_RATE_WEALTH_FLOW: string;
  PENALTY_RATE_WEALTH_GROUP: string;
  EARLY_TERMINATION_PENALTY_PCT: string;
  INTEREST_DISBURSEMENT_FREQUENCY: string;
  WALLET_FEE_KOBO: string;
}

const RATE_FIELDS: Array<{
  key: keyof Pick<
    InterestRatesForm,
    | "INTEREST_RATE_WEALTH_GOAL"
    | "INTEREST_RATE_WEALTH_FIX"
    | "INTEREST_RATE_WEALTH_FLEX"
    | "INTEREST_RATE_WEALTH_FAM"
    | "INTEREST_RATE_WEALTH_FLOW"
    | "INTEREST_RATE_WEALTH_GROUP"
  >;
  label: string;
  planName: string;
  badgeColor: string;
  description: string;
}> = [
  {
    key: "INTEREST_RATE_WEALTH_GOAL",
    label: "WealthGoal Interest Rate (% P.A.)",
    planName: "WealthGoal",
    badgeColor: "bg-pink-50 text-pink-600 border-pink-200",
    description: "Annual percentage yield for goal-based milestone savings portfolios.",
  },
  {
    key: "INTEREST_RATE_WEALTH_FIX",
    label: "WealthFix Interest Rate (% P.A.)",
    planName: "WealthFix",
    badgeColor: "bg-orange-50 text-orange-600 border-orange-200",
    description: "Annual interest yield for strict fixed-term deposits locked until maturity.",
  },
  {
    key: "INTEREST_RATE_WEALTH_FLEX",
    label: "WealthFlex Interest Rate (% P.A.)",
    planName: "WealthFlex",
    badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
    description: "Annual interest yield for flexible savings with instant access and withdrawals.",
  },
  {
    key: "INTEREST_RATE_WEALTH_FAM",
    label: "WealthFam Interest Rate (% P.A.)",
    planName: "WealthFam",
    badgeColor: "bg-purple-50 text-purple-600 border-purple-200",
    description: "Annual interest yield for joint family savings and shared goals.",
  },
  {
    key: "INTEREST_RATE_WEALTH_FLOW",
    label: "WealthFlow Interest Rate (% P.A.)",
    planName: "WealthFlow",
    badgeColor: "bg-blue-50 text-blue-600 border-blue-200",
    description: "Annual interest yield for recurring automated cashflow savings plans.",
  },
  {
    key: "INTEREST_RATE_WEALTH_GROUP",
    label: "WealthGroup Interest Rate (% P.A.)",
    planName: "WealthGroup",
    badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200",
    description: "Annual interest yield for rotational and collaborative group savings plans.",
  },
];

const PENALTY_FIELDS: Array<{
  key: keyof Pick<
    InterestRatesForm,
    | "PENALTY_RATE_WEALTH_GOAL"
    | "EARLY_TERMINATION_PENALTY_PCT"
    | "PENALTY_RATE_WEALTH_FAM"
    | "PENALTY_RATE_WEALTH_FLOW"
    | "PENALTY_RATE_WEALTH_GROUP"
  >;
  label: string;
  planName: string;
  badgeColor: string;
  description: string;
}> = [
  {
    key: "PENALTY_RATE_WEALTH_GOAL",
    label: "WealthGoal Early Termination Penalty (%)",
    planName: "WealthGoal",
    badgeColor: "bg-pink-50 text-pink-600 border-pink-200",
    description: "Penalty fee percentage deducted when liquidating a goal portfolio before target date.",
  },
  {
    key: "EARLY_TERMINATION_PENALTY_PCT",
    label: "WealthFix Early Termination Penalty (%)",
    planName: "WealthFix",
    badgeColor: "bg-orange-50 text-orange-600 border-orange-200",
    description: "Penalty percentage deducted for breaking a fixed-term deposit before its official maturity date.",
  },
  {
    key: "PENALTY_RATE_WEALTH_FAM",
    label: "WealthFam Early Termination Penalty (%)",
    planName: "WealthFam",
    badgeColor: "bg-purple-50 text-purple-600 border-purple-200",
    description: "Penalty fee percentage applied when closing or withdrawing from a family savings plan prematurely.",
  },
  {
    key: "PENALTY_RATE_WEALTH_FLOW",
    label: "WealthFlow Early Termination Penalty (%)",
    planName: "WealthFlow",
    badgeColor: "bg-blue-50 text-blue-600 border-blue-200",
    description: "Penalty fee percentage applied when terminating an automated cashflow savings plan before scheduled term.",
  },
  {
    key: "PENALTY_RATE_WEALTH_GROUP",
    label: "WealthGroup Early Termination Penalty (%)",
    planName: "WealthGroup",
    badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-200",
    description: "Penalty fee percentage applied when a member exits or terminates a cooperative savings group before the target date.",
  },
];

export default function SystemConfigPage() {
  const { data: settingsData, isLoading } = useGetSettingsQuery(undefined);
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const { data: templatesData, isLoading: isLoadingTemplates } = useGetEmailTemplatesQuery({});
  const [updateTemplate, { isLoading: isUpdatingTemplate }] = useUpdateEmailTemplateMutation();
  const [previewTemplate, { isLoading: isPreviewing }] = usePreviewEmailTemplateMutation();

  // Interest Rates (GET /admin/system-config and PUT /admin/system-config/{key})
  const { data: systemConfigData, isLoading: isLoadingConfig, refetch: refetchConfig } = useGetSystemConfigQuery(undefined);
  const [updateSystemConfigByKey] = useUpdateSystemConfigByKeyMutation();

  const [formState, setFormState] = useState({
    REFERRAL_ENABLED: false,
    REFERRAL_REWARD_KOBO: "",
    MAINTENANCE_MODE: false,
    ACTIVE_PAYMENT_PROVIDER: "PAGA",
  });

  const [ratesForm, setRatesForm] = useState<InterestRatesForm>({
    INTEREST_RATE_WEALTH_GOAL: "",
    INTEREST_RATE_WEALTH_FIX: "",
    INTEREST_RATE_WEALTH_FLEX: "",
    INTEREST_RATE_WEALTH_FAM: "",
    INTEREST_RATE_WEALTH_FLOW: "",
    INTEREST_RATE_WEALTH_GROUP: "",
    PENALTY_RATE_WEALTH_GOAL: "",
    PENALTY_RATE_WEALTH_FAM: "",
    PENALTY_RATE_WEALTH_FLOW: "",
    PENALTY_RATE_WEALTH_GROUP: "",
    EARLY_TERMINATION_PENALTY_PCT: "",
    INTEREST_DISBURSEMENT_FREQUENCY: "MONTHLY",
    WALLET_FEE_KOBO: "",
  });

  const [minAppVersion, setMinAppVersion] = useState("1.0.0");
  const [originalMinAppVersion, setOriginalMinAppVersion] = useState("1.0.0");

  const [latestAppVersion, setLatestAppVersion] = useState("");
  const [originalLatestAppVersion, setOriginalLatestAppVersion] = useState("");

  const [updateDeadline, setUpdateDeadline] = useState("");
  const [originalUpdateDeadline, setOriginalUpdateDeadline] = useState("");

  const [updateMessage, setUpdateMessage] = useState("");
  const [originalUpdateMessage, setOriginalUpdateMessage] = useState("");

  const [appReleaseUpdatedAts, setAppReleaseUpdatedAts] = useState<Record<string, string>>({});
  const [appReleaseErrors, setAppReleaseErrors] = useState<{
    minVersion?: string;
    latestVersion?: string;
    deadline?: string;
    message?: string;
  }>({});

  const failedKeysRef = useRef<Set<string>>(new Set());

  // Confirmation Modal State
  const [showAppReleaseConfirmModal, setShowAppReleaseConfirmModal] = useState(false);
  const [appReleaseConfirmMessages, setAppReleaseConfirmMessages] = useState<string[]>([]);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingAppRelease, setIsSavingAppRelease] = useState(false);

  const [originalRates, setOriginalRates] = useState<Partial<InterestRatesForm>>({});
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [isSavingPenalties, setIsSavingPenalties] = useState(false);

  const [activeTab, setActiveTab] = useState<"settings" | "app-release" | "interest-rates" | "penalties" | "email">("settings");
  
  // Email Template Modal State
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateHtml, setTemplateHtml] = useState("");
  const [previewEmail, setPreviewEmail] = useState("");

  useEffect(() => {
    if (settingsData?.data) {
      setFormState({
        REFERRAL_ENABLED: settingsData.data.REFERRAL_ENABLED === "true" || settingsData.data.REFERRAL_ENABLED === true,
        REFERRAL_REWARD_KOBO: settingsData.data.REFERRAL_REWARD_KOBO || "50000",
        MAINTENANCE_MODE: settingsData.data.MAINTENANCE_MODE === "true" || settingsData.data.MAINTENANCE_MODE === true,
        ACTIVE_PAYMENT_PROVIDER: settingsData.data.ACTIVE_PAYMENT_PROVIDER || "PAGA",
      });
    }
  }, [settingsData]);

  useEffect(() => {
    const rawItems =
      systemConfigData?.data?.items ||
      systemConfigData?.items ||
      (Array.isArray(systemConfigData?.data) ? systemConfigData.data : []) ||
      (Array.isArray(systemConfigData) ? systemConfigData : []);

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const map: Record<string, string> = {};
      const updatedAts: Record<string, string> = {};
      rawItems.forEach((item: any) => {
        if (item?.key) {
          map[item.key] = String(item.value ?? "");
          if (item.updatedAt) {
            updatedAts[item.key] = String(item.updatedAt);
          }
        }
      });

      setAppReleaseUpdatedAts(updatedAts);

      if (!failedKeysRef.current.has("MIN_APP_VERSION")) {
        const loadedVersion = map["MIN_APP_VERSION"] || "1.0.0";
        setMinAppVersion(loadedVersion);
        setOriginalMinAppVersion(loadedVersion);
      }

      if (!failedKeysRef.current.has("LATEST_APP_VERSION")) {
        const loadedLatest = map["LATEST_APP_VERSION"] || "";
        setLatestAppVersion(loadedLatest);
        setOriginalLatestAppVersion(loadedLatest);
      }

      if (!failedKeysRef.current.has("UPDATE_DEADLINE")) {
        const loadedDeadlineIso = map["UPDATE_DEADLINE"] || "";
        const loadedDeadlineLocal = isoToDatetimeLocal(loadedDeadlineIso);
        setUpdateDeadline(loadedDeadlineLocal);
        setOriginalUpdateDeadline(loadedDeadlineLocal);
      }

      if (!failedKeysRef.current.has("UPDATE_MESSAGE")) {
        const loadedMessage = map["UPDATE_MESSAGE"] || "";
        setUpdateMessage(loadedMessage);
        setOriginalUpdateMessage(loadedMessage);
      }

      const loaded: InterestRatesForm = {
        INTEREST_RATE_WEALTH_GOAL: map["INTEREST_RATE_WEALTH_GOAL"] ?? "",
        INTEREST_RATE_WEALTH_FIX: map["INTEREST_RATE_WEALTH_FIX"] ?? "",
        INTEREST_RATE_WEALTH_FLEX: map["INTEREST_RATE_WEALTH_FLEX"] ?? "",
        INTEREST_RATE_WEALTH_FAM: map["INTEREST_RATE_WEALTH_FAM"] ?? "",
        INTEREST_RATE_WEALTH_FLOW: map["INTEREST_RATE_WEALTH_FLOW"] ?? "",
        INTEREST_RATE_WEALTH_GROUP: map["INTEREST_RATE_WEALTH_GROUP"] ?? "",
        PENALTY_RATE_WEALTH_GOAL: map["PENALTY_RATE_WEALTH_GOAL"] ?? "",
        PENALTY_RATE_WEALTH_FAM: map["PENALTY_RATE_WEALTH_FAM"] ?? "",
        PENALTY_RATE_WEALTH_FLOW: map["PENALTY_RATE_WEALTH_FLOW"] ?? "",
        PENALTY_RATE_WEALTH_GROUP: map["PENALTY_RATE_WEALTH_GROUP"] ?? "",
        EARLY_TERMINATION_PENALTY_PCT: map["EARLY_TERMINATION_PENALTY_PCT"] ?? "",
        INTEREST_DISBURSEMENT_FREQUENCY: map["INTEREST_DISBURSEMENT_FREQUENCY"] || "MONTHLY",
        WALLET_FEE_KOBO: map["WALLET_FEE_KOBO"] ?? "",
      };

      setRatesForm(loaded);
      setOriginalRates(loaded);
    }
  }, [systemConfigData]);

  const validateAppRelease = () => {
    const errors: {
      minVersion?: string;
      latestVersion?: string;
      deadline?: string;
      message?: string;
    } = {};

    const semverRegex = /^\d+(\.\d+){1,2}$/;
    const trimmedMin = minAppVersion.trim();
    const trimmedLatest = latestAppVersion.trim();
    const trimmedDeadline = updateDeadline.trim();
    const trimmedMsg = updateMessage.trim();

    // a) Minimum App Version
    if (!trimmedMin) {
      errors.minVersion = "Minimum App Version cannot be empty.";
    } else if (!semverRegex.test(trimmedMin)) {
      errors.minVersion = "Please enter a valid version format (e.g. 1.0.0).";
    }

    // a) Latest App Version format check (if set)
    if (trimmedLatest && !semverRegex.test(trimmedLatest)) {
      errors.latestVersion = "Please enter a valid version format (e.g. 1.0.0).";
    }

    // b) Latest App Version must not be lower than Minimum App Version
    if (!errors.minVersion && !errors.latestVersion && trimmedLatest && trimmedMin) {
      if (compareVersions(trimmedLatest, trimmedMin) < 0) {
        errors.latestVersion = "Latest App Version cannot be lower than Minimum App Version.";
      }
    }

    // c) Update Deadline
    if (trimmedDeadline) {
      if (!trimmedLatest) {
        errors.deadline = "Update Deadline requires Latest App Version to be set.";
      } else {
        const deadlineChanged = trimmedDeadline !== originalUpdateDeadline.trim();
        if (deadlineChanged) {
          const deadlineDate = new Date(trimmedDeadline);
          if (isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
            errors.deadline = "Update Deadline must be a future date and time.";
          }
        }
      }
    }

    // d) Update Message
    if (trimmedMsg.length > 200) {
      errors.message = "Update Message cannot exceed 200 characters.";
    }

    return errors;
  };

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      const payload = {
        ...(settingsData?.data || {}),
        REFERRAL_ENABLED: String(formState.REFERRAL_ENABLED),
        REFERRAL_REWARD_KOBO: String(formState.REFERRAL_REWARD_KOBO),
        MAINTENANCE_MODE: String(formState.MAINTENANCE_MODE),
        ACTIVE_PAYMENT_PROVIDER: String(formState.ACTIVE_PAYMENT_PROVIDER || "PAGA").toUpperCase().trim(),
      };

      await updateSettings(payload).unwrap();
      toast.success("General settings updated successfully");
    } catch (err: any) {
      console.error("Error saving general settings:", err);
      toast.error(err?.data?.message || "Failed to update general settings");
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const executeSaveAppRelease = async () => {
    setIsSavingAppRelease(true);

    try {
      const trimmedMin = minAppVersion.trim();
      const trimmedLatest = latestAppVersion.trim();
      const trimmedDeadline = updateDeadline.trim();
      const trimmedMessage = updateMessage.trim();

      const configUpdates: Array<{ key: string; value: string; onCommit: () => void }> = [];

      if (trimmedMin !== originalMinAppVersion.trim()) {
        configUpdates.push({
          key: "MIN_APP_VERSION",
          value: trimmedMin,
          onCommit: () => {
            failedKeysRef.current.delete("MIN_APP_VERSION");
            setOriginalMinAppVersion(trimmedMin);
          },
        });
      }

      if (trimmedLatest !== originalLatestAppVersion.trim()) {
        configUpdates.push({
          key: "LATEST_APP_VERSION",
          value: trimmedLatest,
          onCommit: () => {
            failedKeysRef.current.delete("LATEST_APP_VERSION");
            setOriginalLatestAppVersion(trimmedLatest);
          },
        });
      }

      if (trimmedDeadline !== originalUpdateDeadline.trim()) {
        // A cleared Update Deadline or Update Message is saved as an empty string "".
        // Note: The backend must treat empty as unset.
        const isoValue = trimmedDeadline ? new Date(trimmedDeadline).toISOString() : "";
        configUpdates.push({
          key: "UPDATE_DEADLINE",
          value: isoValue,
          onCommit: () => {
            failedKeysRef.current.delete("UPDATE_DEADLINE");
            setOriginalUpdateDeadline(trimmedDeadline);
          },
        });
      }

      if (trimmedMessage !== originalUpdateMessage.trim()) {
        // A cleared Update Deadline or Update Message is saved as an empty string "".
        // Note: The backend must treat empty as unset.
        configUpdates.push({
          key: "UPDATE_MESSAGE",
          value: trimmedMessage,
          onCommit: () => {
            failedKeysRef.current.delete("UPDATE_MESSAGE");
            setOriginalUpdateMessage(trimmedMessage);
          },
        });
      }

      if (configUpdates.length === 0) {
        toast.info("No app release changes to save.");
        return;
      }

      const failedKeys: { key: string; message: string }[] = [];
      for (const update of configUpdates) {
        try {
          await updateSystemConfigByKey({
            key: update.key,
            value: update.value,
          }).unwrap();
          update.onCommit();
        } catch (err: any) {
          const errorMessage =
            err?.data?.message ||
            err?.data?.error ||
            (typeof err?.data === "string" ? err.data : "") ||
            err?.message ||
            (err?.status ? `HTTP ${err.status}` : "Unknown error");
          console.error(`Failed to update ${update.key}:`, errorMessage, err?.data || err);
          failedKeysRef.current.add(update.key);
          failedKeys.push({ key: update.key, message: errorMessage });
        }
      }

      // Call refetchConfig() ONCE after ALL saves have finished
      if (configUpdates.length > 0) {
        await refetchConfig();
      }

      if (failedKeys.length > 0) {
        failedKeys.forEach(({ key, message }) => {
          toast.error(`Failed to update ${key}: ${message}`);
        });
      } else {
        toast.success("App release settings updated successfully");
      }
    } catch (err: any) {
      console.error("Error saving app release settings:", err);
      toast.error(err?.data?.message || "Failed to update app release settings");
    } finally {
      setIsSavingAppRelease(false);
    }
  };

  const handleSaveAppRelease = async () => {
    // Run validation first
    const errors = validateAppRelease();
    setAppReleaseErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const trimmedMin = minAppVersion.trim();
    const trimmedLatest = latestAppVersion.trim();
    const trimmedDeadline = updateDeadline.trim();

    const isMinRaised = compareVersions(trimmedMin, originalMinAppVersion.trim()) > 0;
    const isDeadlineSetOrChanged =
      trimmedDeadline !== "" && trimmedDeadline !== originalUpdateDeadline.trim();

    if (isMinRaised || isDeadlineSetOrChanged) {
      const messages: string[] = [];
      if (isMinRaised) {
        messages.push(
          `Users on any version below ${trimmedMin} will be blocked from using the app until they update. Make sure ${trimmedMin} is already live in BOTH the App Store and Google Play. Continue?`
        );
      }
      if (isDeadlineSetOrChanged) {
        const localFormatted = formatLocalDateTime(trimmedDeadline);
        messages.push(
          `After ${localFormatted}, users on a version older than ${trimmedLatest} will be blocked until they update. Make sure ${trimmedLatest} is live in BOTH stores. Continue?`
        );
      }
      setAppReleaseConfirmMessages(messages);
      setShowAppReleaseConfirmModal(true);
      return;
    }

    await executeSaveAppRelease();
  };

  const handleSaveInterestRates = async () => {
    const rateKeys: Array<keyof InterestRatesForm> = [
      "INTEREST_RATE_WEALTH_GOAL",
      "INTEREST_RATE_WEALTH_FIX",
      "INTEREST_RATE_WEALTH_FLEX",
      "INTEREST_RATE_WEALTH_FAM",
      "INTEREST_RATE_WEALTH_FLOW",
      "INTEREST_RATE_WEALTH_GROUP",
      "INTEREST_DISBURSEMENT_FREQUENCY",
      "WALLET_FEE_KOBO",
    ];

    const changedKeys = rateKeys.filter(
      (key) => String(ratesForm[key] ?? "").trim() !== String(originalRates[key] ?? "").trim()
    );

    if (changedKeys.length === 0) {
      toast.info("No interest rate changes to save.");
      return;
    }

    setIsSavingRates(true);
    const failedKeys: string[] = [];
    const succeededKeys: string[] = [];

    await Promise.all(
      changedKeys.map(async (key) => {
        try {
          await updateSystemConfigByKey({
            key,
            value: String(ratesForm[key] ?? "").trim(),
          }).unwrap();
          succeededKeys.push(key);
        } catch (err: any) {
          console.error(`Failed to update ${key}:`, err);
          failedKeys.push(key);
        }
      })
    );

    setIsSavingRates(false);

    if (succeededKeys.length > 0) {
      setOriginalRates((prev) => {
        const next = { ...prev };
        succeededKeys.forEach((k) => {
          next[k as keyof InterestRatesForm] = ratesForm[k as keyof InterestRatesForm];
        });
        return next;
      });
      refetchConfig();
    }

    if (failedKeys.length === 0) {
      toast.success("Interest rates and fees updated successfully");
    } else {
      toast.error(`Failed to update: ${failedKeys.join(", ")}`);
    }
  };

  const handleSavePenalties = async () => {
    const penaltyKeys: Array<keyof InterestRatesForm> = [
      "PENALTY_RATE_WEALTH_GOAL",
      "EARLY_TERMINATION_PENALTY_PCT",
      "PENALTY_RATE_WEALTH_FAM",
      "PENALTY_RATE_WEALTH_FLOW",
      "PENALTY_RATE_WEALTH_GROUP",
    ];

    const changedKeys = penaltyKeys.filter(
      (key) => String(ratesForm[key] ?? "").trim() !== String(originalRates[key] ?? "").trim()
    );

    if (changedKeys.length === 0) {
      toast.info("No penalty changes to save.");
      return;
    }

    setIsSavingPenalties(true);
    const failedKeys: string[] = [];
    const succeededKeys: string[] = [];

    await Promise.all(
      changedKeys.map(async (key) => {
        try {
          await updateSystemConfigByKey({
            key,
            value: String(ratesForm[key] ?? "").trim(),
          }).unwrap();
          succeededKeys.push(key);
        } catch (err: any) {
          console.error(`Failed to update ${key}:`, err);
          failedKeys.push(key);
        }
      })
    );

    setIsSavingPenalties(false);

    if (succeededKeys.length > 0) {
      setOriginalRates((prev) => {
        const next = { ...prev };
        succeededKeys.forEach((k) => {
          next[k as keyof InterestRatesForm] = ratesForm[k as keyof InterestRatesForm];
        });
        return next;
      });
      refetchConfig();
    }

    if (failedKeys.length === 0) {
      toast.success("Termination penalties updated successfully");
    } else {
      toast.error(`Failed to update: ${failedKeys.join(", ")}`);
    }
  };

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-10 border border-border/50 shadow-sm w-full max-w-[1137px] mx-auto flex flex-col h-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-dark tracking-tight">
            System Configuration
          </h1>
          <p className="text-slate/60 text-sm mt-1 font-medium">
            Manage system-wide parameters, interest rates, referral rewards, and email templates.
          </p>
        </div>
        {activeTab === "settings" && (
          <Button 
            onClick={handleSaveGeneral}
            disabled={isLoading || isSaving || isSavingGeneral}
            className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-8 font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer"
          >
            {isSaving || isSavingGeneral ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        )}
        {activeTab === "app-release" && (
          <Button 
            onClick={handleSaveAppRelease}
            disabled={isLoadingConfig || isSavingAppRelease}
            className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-8 font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer"
          >
            {isSavingAppRelease ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save App Release
          </Button>
        )}
        {activeTab === "interest-rates" && (
          <Button 
            onClick={handleSaveInterestRates}
            disabled={isLoadingConfig || isSavingRates}
            className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-8 font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer"
          >
            {isSavingRates ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Interest Rates
          </Button>
        )}
        {activeTab === "penalties" && (
          <Button 
            onClick={handleSavePenalties}
            disabled={isLoadingConfig || isSavingPenalties}
            className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-8 font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer"
          >
            {isSavingPenalties ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Penalties
          </Button>
        )}
      </div>

      <div className="flex border-b border-border/50 mb-8 gap-8">
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "settings" ? "text-[#155D5F]" : "text-slate/60 hover:text-dark"
          }`}
        >
          General Settings
          {activeTab === "settings" && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#155D5F] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("app-release")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "app-release" ? "text-[#155D5F]" : "text-slate/60 hover:text-dark"
          }`}
        >
          App Release
          {activeTab === "app-release" && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#155D5F] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("interest-rates")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "interest-rates" ? "text-[#155D5F]" : "text-slate/60 hover:text-dark"
          }`}
        >
          Interest Rates
          {activeTab === "interest-rates" && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#155D5F] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("penalties")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "penalties" ? "text-[#155D5F]" : "text-slate/60 hover:text-dark"
          }`}
        >
          Termination Penalties
          {activeTab === "penalties" && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#155D5F] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "email" ? "text-[#155D5F]" : "text-slate/60 hover:text-dark"
          }`}
        >
          Email Templates
          {activeTab === "email" && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#155D5F] rounded-t-full" />
          )}
        </button>
      </div>

      {((activeTab === "settings" && isLoading) ||
        (activeTab === "app-release" && isLoadingConfig) ||
        (activeTab === "email" && isLoadingTemplates) ||
        (activeTab === "interest-rates" && isLoadingConfig) ||
        (activeTab === "penalties" && isLoadingConfig)) ? (
        <div className="flex flex-col items-center justify-center py-32 flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate/40">Loading configuration...</p>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {activeTab === "settings" && (
            <>
              {/* General Platform Settings */}
              <div className="bg-surface/30 border border-border/50 rounded-[20px] p-8">
                <h3 className="text-lg font-bold text-dark font-outfit mb-6">
                  General Settings
                </h3>
                <div className="space-y-6">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between p-4 bg-white border border-border/50 rounded-xl">
                    <div>
                      <Label className="text-sm font-bold text-dark block mb-1">
                        Maintenance Mode
                      </Label>
                      <span className="text-xs font-medium text-slate/60">
                        When enabled, the application will be temporarily unavailable for all regular users.
                      </span>
                    </div>
                    <Switch 
                      checked={formState.MAINTENANCE_MODE}
                      onCheckedChange={(val) => setFormState({ ...formState, MAINTENANCE_MODE: val })}
                    />
                  </div>

                  {/* Active Payment Provider (PAGA Only) */}
                  <div className="flex items-center justify-between p-4 bg-white border border-border/50 rounded-xl">
                    <div>
                      <Label className="text-sm font-bold text-dark block mb-1">
                        Active Payment Provider
                      </Label>
                      <span className="text-xs font-medium text-slate/60">
                        Primary transaction gateway configured on the platform.
                      </span>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Paga Gateway ({formState.ACTIVE_PAYMENT_PROVIDER || "PAGA"})
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Referral Settings */}
              <div className="bg-surface/30 border border-border/50 rounded-[20px] p-8">
                <h3 className="text-lg font-bold text-dark font-outfit mb-6">
                  Referral Program
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white border border-border/50 rounded-xl">
                    <div>
                      <Label className="text-sm font-bold text-dark block mb-1">
                        Enable Referrals
                      </Label>
                      <span className="text-xs font-medium text-slate/60">
                        Toggle the referral program on or off globally.
                      </span>
                    </div>
                    <Switch 
                      checked={formState.REFERRAL_ENABLED}
                      onCheckedChange={(val) => setFormState({ ...formState, REFERRAL_ENABLED: val })}
                    />
                  </div>

                  <div className="space-y-3 p-4 bg-white border border-border/50 rounded-xl">
                    <Label className="text-sm font-bold text-dark block">
                      Referral Reward Amount
                    </Label>
                    <span className="text-xs font-medium text-slate/60 block mb-3">
                      The amount of money rewarded to users for a successful referral (in Kobo). 
                      For example, 50000 kobo = ₦500.
                    </span>
                    <div className="relative max-w-sm">
                      <Input 
                        type="number"
                        value={formState.REFERRAL_REWARD_KOBO}
                        onChange={(e) => setFormState({ ...formState, REFERRAL_REWARD_KOBO: e.target.value })}
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none pl-12"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate/40">
                        ₦
                      </span>
                      {formState.REFERRAL_REWARD_KOBO && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#155D5F]">
                          = ₦{(parseInt(formState.REFERRAL_REWARD_KOBO) / 100).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "app-release" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* App Release & Versioning */}
              <div className="bg-surface/30 border border-border/50 rounded-[20px] p-8">
                <h3 className="text-lg font-bold text-dark font-outfit mb-6">
                  App Release
                </h3>
                
                <div className="space-y-6">
                  {/* Minimum App Version */}
                  <div className="space-y-3 p-4 bg-white border border-border/50 rounded-xl">
                    <Label className="text-sm font-bold text-dark block">
                      Minimum App Version
                    </Label>
                    <span className="text-xs font-medium text-slate/60 block mb-3">
                      Users on an app version below this are blocked until they update.
                    </span>
                    <div className="relative max-w-sm">
                      <Input 
                        type="text"
                        placeholder="1.0.0"
                        value={minAppVersion}
                        onChange={(e) => {
                          setMinAppVersion(e.target.value);
                          failedKeysRef.current.delete("MIN_APP_VERSION");
                          if (appReleaseErrors.minVersion) {
                            setAppReleaseErrors((prev) => ({ ...prev, minVersion: undefined }));
                          }
                        }}
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                      />
                    </div>
                    {appReleaseErrors.minVersion && (
                      <span className="text-xs text-red-500 font-medium block mt-1.5">
                        {appReleaseErrors.minVersion}
                      </span>
                    )}
                    {appReleaseUpdatedAts["MIN_APP_VERSION"] && (
                      <span className="text-[11px] text-slate/40 block mt-1">
                        Last updated: {formatLocalDateTime(appReleaseUpdatedAts["MIN_APP_VERSION"])}
                      </span>
                    )}
                  </div>

                  {/* Latest App Version */}
                  <div className="space-y-3 p-4 bg-white border border-border/50 rounded-xl">
                    <Label className="text-sm font-bold text-dark block">
                      Latest App Version
                    </Label>
                    <span className="text-xs font-medium text-slate/60 block mb-3">
                      The newest version in the app stores. Users on an older version are asked to update.
                    </span>
                    <div className="relative max-w-sm">
                      <Input 
                        type="text"
                        placeholder="1.0.1"
                        value={latestAppVersion}
                        onChange={(e) => {
                          setLatestAppVersion(e.target.value);
                          failedKeysRef.current.delete("LATEST_APP_VERSION");
                          if (appReleaseErrors.latestVersion) {
                            setAppReleaseErrors((prev) => ({ ...prev, latestVersion: undefined }));
                          }
                        }}
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                      />
                    </div>
                    {appReleaseErrors.latestVersion && (
                      <span className="text-xs text-red-500 font-medium block mt-1.5">
                        {appReleaseErrors.latestVersion}
                      </span>
                    )}
                    {appReleaseUpdatedAts["LATEST_APP_VERSION"] && (
                      <span className="text-[11px] text-slate/40 block mt-1">
                        Last updated: {formatLocalDateTime(appReleaseUpdatedAts["LATEST_APP_VERSION"])}
                      </span>
                    )}
                  </div>

                  {/* Update Deadline */}
                  <div className="space-y-3 p-4 bg-white border border-border/50 rounded-xl">
                    <Label className="text-sm font-bold text-dark block">
                      Update Deadline
                    </Label>
                    <span className="text-xs font-medium text-slate/60 block mb-3">
                      Optional. After this time, users on a version older than the latest must update before they can use the app. Shown in your computer's local time; saved in UTC.
                    </span>
                    <div className="flex items-center gap-2 max-w-sm">
                      <Input 
                        type="datetime-local"
                        value={updateDeadline}
                        onChange={(e) => {
                          setUpdateDeadline(e.target.value);
                          failedKeysRef.current.delete("UPDATE_DEADLINE");
                          if (appReleaseErrors.deadline) {
                            setAppReleaseErrors((prev) => ({ ...prev, deadline: undefined }));
                          }
                        }}
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-medium focus-visible:ring-primary/20 transition-all border shadow-none"
                      />
                      {updateDeadline && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUpdateDeadline("");
                            failedKeysRef.current.delete("UPDATE_DEADLINE");
                            if (appReleaseErrors.deadline) {
                              setAppReleaseErrors((prev) => ({ ...prev, deadline: undefined }));
                            }
                          }}
                          className="h-12 px-3 rounded-xl border-border/50 text-xs font-semibold text-slate hover:text-dark hover:bg-surface"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {appReleaseErrors.deadline && (
                      <span className="text-xs text-red-500 font-medium block mt-1.5">
                        {appReleaseErrors.deadline}
                      </span>
                    )}
                    {appReleaseUpdatedAts["UPDATE_DEADLINE"] && (
                      <span className="text-[11px] text-slate/40 block mt-1">
                        Last updated: {formatLocalDateTime(appReleaseUpdatedAts["UPDATE_DEADLINE"])}
                      </span>
                    )}
                  </div>

                  {/* Update Message */}
                  <div className="space-y-3 p-4 bg-white border border-border/50 rounded-xl">
                    <Label className="text-sm font-bold text-dark block">
                      Update Message
                    </Label>
                    <span className="text-xs font-medium text-slate/60 block mb-3">
                      Optional. Shown on the update screen.
                    </span>
                    <div className="max-w-md space-y-1">
                      <textarea
                        value={updateMessage}
                        onChange={(e) => {
                          if (e.target.value.length <= 200) {
                            setUpdateMessage(e.target.value);
                            failedKeysRef.current.delete("UPDATE_MESSAGE");
                            if (appReleaseErrors.message) {
                              setAppReleaseErrors((prev) => ({ ...prev, message: undefined }));
                            }
                          }
                        }}
                        maxLength={200}
                        rows={3}
                        placeholder="Optional update message shown to users..."
                        className="w-full rounded-xl bg-surface/50 border border-border/30 p-4 text-sm font-medium text-dark placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      />
                      <div className="flex justify-end">
                        <span className="text-[11px] font-semibold text-slate/40">
                          {updateMessage.length}/200
                        </span>
                      </div>
                    </div>
                    {appReleaseErrors.message && (
                      <span className="text-xs text-red-500 font-medium block mt-1.5">
                        {appReleaseErrors.message}
                      </span>
                    )}
                    {appReleaseUpdatedAts["UPDATE_MESSAGE"] && (
                      <span className="text-[11px] text-slate/40 block mt-1">
                        Last updated: {formatLocalDateTime(appReleaseUpdatedAts["UPDATE_MESSAGE"])}
                      </span>
                    )}
                  </div>

                  {/* Read-only Live Preview Box */}
                  <div className="p-4 bg-white border border-border/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-[#155D5F]" />
                      <span className="text-xs font-bold text-dark uppercase tracking-wider">
                        What users will see
                      </span>
                    </div>
                    <div className="text-xs text-slate/70 space-y-1 font-medium pl-6">
                      <p>Versions below {minAppVersion.trim() || "1.0.0"}: blocked until they update.</p>
                      {latestAppVersion.trim() ? (
                        <>
                          <p>
                            Versions from {minAppVersion.trim() || "1.0.0"} up to below {latestAppVersion.trim()}: asked to update
                            {updateDeadline.trim() ? ` by ${formatLocalDateTime(updateDeadline.trim())}; after the deadline they are blocked.` : "."}
                          </p>
                          <p>Version {latestAppVersion.trim()} and newer: no prompt.</p>
                        </>
                      ) : (
                        <p>No update prompt is scheduled.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "interest-rates" && (
            <div className="space-y-8">
              {/* Portfolio Savings Plans Interest Rates */}
              <div className="bg-surface/30 border border-border/50 rounded-[20px] p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-dark font-outfit">
                    Portfolio Savings Interest Rates
                  </h3>
                  <p className="text-xs font-medium text-slate/60 mt-1">
                    Annual percentage yield (% Per Annum) applied to savings portfolios. Enter numeric percentages (e.g. 12 for 12% P.A.).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RATE_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className="p-5 bg-white border border-border/50 rounded-xl space-y-2 hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-dark">
                          {field.label}
                        </Label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${field.badgeColor}`}>
                          {field.planName}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate/50 block min-h-[32px] leading-relaxed">
                        {field.description}
                      </span>
                      <div className="relative max-w-sm mt-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 12"
                          value={ratesForm[field.key]}
                          onChange={(e) =>
                            setRatesForm({
                              ...ratesForm,
                              [field.key]: e.target.value,
                            })
                          }
                          className="h-12 bg-surface/50 border-border/30 rounded-xl px-4 pr-10 text-sm font-semibold focus-visible:ring-primary/20 transition-all border shadow-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate/40 pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disbursement & Transaction Fees */}
              <div className="bg-surface/30 border border-border/50 rounded-[20px] p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-dark font-outfit">
                    Disbursement & Wallet Fees
                  </h3>
                  <p className="text-xs font-medium text-slate/60 mt-1">
                    Configure interest calculation cadence and flat transaction charges on primary wallets.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Disbursement Frequency */}
                  <div className="p-5 bg-white border border-border/50 rounded-xl space-y-2">
                    <Label className="text-sm font-bold text-dark block">
                      Interest Disbursement Frequency
                    </Label>
                    <span className="text-xs font-medium text-slate/50 block min-h-[32px] leading-relaxed">
                      Frequency at which accumulated interest earnings are calculated and disbursed to user balances.
                    </span>
                    <div className="relative max-w-sm mt-2">
                      <select
                        value={ratesForm.INTEREST_DISBURSEMENT_FREQUENCY}
                        onChange={(e) =>
                          setRatesForm({
                            ...ratesForm,
                            INTEREST_DISBURSEMENT_FREQUENCY: e.target.value,
                          })
                        }
                        className="h-12 w-full appearance-none rounded-xl bg-surface/50 border border-border/30 px-4 pr-10 text-sm font-bold text-dark focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                      >
                        <option value="DAILY">DAILY</option>
                        <option value="WEEKLY">WEEKLY</option>
                        <option value="MONTHLY">MONTHLY</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate/40 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Wallet Fee Kobo */}
                  <div className="p-5 bg-white border border-border/50 rounded-xl space-y-2">
                    <Label className="text-sm font-bold text-dark block">
                      Wallet Transaction Fee (Kobo)
                    </Label>
                    <span className="text-xs font-medium text-slate/50 block min-h-[32px] leading-relaxed">
                      Flat transaction fee charged on wallet operations in kobo (e.g. 10000 kobo = ₦100.00).
                    </span>
                    <div className="relative max-w-sm mt-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 10000"
                        value={ratesForm.WALLET_FEE_KOBO}
                        onChange={(e) =>
                          setRatesForm({
                            ...ratesForm,
                            WALLET_FEE_KOBO: e.target.value,
                          })
                        }
                        className="h-12 bg-surface/50 border-border/30 rounded-xl px-5 text-sm font-semibold focus-visible:ring-primary/20 transition-all border shadow-none pl-12"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate/40 pointer-events-none">
                        ₦
                      </span>
                      {ratesForm.WALLET_FEE_KOBO && !isNaN(Number(ratesForm.WALLET_FEE_KOBO)) && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#155D5F] pointer-events-none">
                          = ₦{(Number(ratesForm.WALLET_FEE_KOBO) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "penalties" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-surface/30 border border-border/50 rounded-[20px] p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-dark font-outfit">
                        Early Termination Penalties
                      </h3>
                      <p className="text-xs font-medium text-slate/60 mt-1">
                        Penalty percentage deducted when liquidating or breaking a savings plan before its scheduled maturity date.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate/50 bg-slate/10 px-3 py-1.5 rounded-full border border-border/40">
                      WealthFlex exempt (anytime withdrawals)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PENALTY_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className="p-5 bg-white border border-border/50 rounded-xl space-y-2 hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-dark">
                          {field.label}
                        </Label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${field.badgeColor}`}>
                          {field.planName}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate/50 block min-h-[32px] leading-relaxed">
                        {field.description}
                      </span>
                      <div className="relative max-w-sm mt-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 5"
                          value={ratesForm[field.key]}
                          onChange={(e) =>
                            setRatesForm({
                              ...ratesForm,
                              [field.key]: e.target.value,
                            })
                          }
                          className="h-12 bg-surface/50 border-border/30 rounded-xl px-4 pr-10 text-sm font-semibold focus-visible:ring-primary/20 transition-all border shadow-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate/40 pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="bg-surface/30 border border-border/50 rounded-[20px] p-8">
              <h3 className="text-lg font-bold text-dark font-outfit mb-6">
                Email Templates
              </h3>
              
              <div className="space-y-4">
                {(templatesData?.data || templatesData?.items)?.length > 0 ? (
                  (templatesData.data || templatesData.items).map((tpl: any) => (
                    <div key={tpl.id} className="flex items-center justify-between p-4 bg-white border border-border/50 rounded-xl">
                      <div>
                        <Label className="text-sm font-bold text-dark block mb-1">
                          {tpl.name || tpl.key}
                        </Label>
                        <span className="text-xs font-medium text-slate/60 block">
                          Subject: {tpl.subject || "N/A"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setTemplateHtml(tpl.htmlBody || tpl.htmlContent || "");
                        }}
                      >
                        Edit Template
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate/60 p-4 text-center">No email templates found.</p>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Editing Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold font-outfit text-dark">
                  Edit Template: {editingTemplate.name || editingTemplate.key}
                </h3>
                <p className="text-sm text-slate/60 mt-1">Make changes to the raw HTML structure.</p>
              </div>
              <button 
                onClick={() => setEditingTemplate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface text-slate/40 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <Label className="text-sm font-bold text-dark block mb-2">Subject Line</Label>
                <Input 
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm font-bold text-dark block mb-2">HTML Content</Label>
                <textarea
                  className="w-full h-[300px] p-4 text-sm font-mono bg-slate-900 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={templateHtml}
                  onChange={(e) => setTemplateHtml(e.target.value)}
                  placeholder="<html>...</html>"
                />
              </div>

              <div className="p-4 bg-surface/50 rounded-xl border border-border/50">
                <Label className="text-sm font-bold text-dark block mb-2">Send Preview</Label>
                <div className="flex gap-4">
                  <Input 
                    placeholder="Enter email to send preview..." 
                    value={previewEmail}
                    onChange={(e) => setPreviewEmail(e.target.value)}
                  />
                  <Button 
                    variant="outline"
                    disabled={!previewEmail || isPreviewing}
                    onClick={async () => {
                      try {
                        const dummyVariables = (editingTemplate.variables || []).reduce((acc: any, v: string) => ({ ...acc, [v]: `Test ${v}` }), { dummy: "value" });
                        await previewTemplate({ email: previewEmail, key: editingTemplate.key, variables: dummyVariables }).unwrap();
                        toast.success("Preview email sent successfully!");
                      } catch (err: any) {
                        toast.error(err?.data?.message || "Failed to send preview");
                      }
                    }}
                  >
                    {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Preview"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/50 flex justify-end gap-3 bg-surface/20 rounded-b-[24px]">
              <Button
                variant="outline"
                className="rounded-xl h-11 px-6 font-bold"
                onClick={() => setEditingTemplate(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={isUpdatingTemplate}
                onClick={async () => {
                  try {
                    await updateTemplate({
                      id: editingTemplate.id,
                      subject: editingTemplate.subject,
                      htmlContent: templateHtml,
                      htmlBody: templateHtml
                    }).unwrap();
                    toast.success("Template updated successfully!");
                    setEditingTemplate(null);
                  } catch (err: any) {
                    toast.error(err?.data?.message || "Failed to update template");
                  }
                }}
                className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/10"
              >
                {isUpdatingTemplate && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* App Release Confirmation Modal */}
      {showAppReleaseConfirmModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-xl flex flex-col p-6 animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit text-dark">
                  Confirm App Version Update
                </h3>
                <p className="text-xs text-slate/50">
                  Please review the impact on active users before saving.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 text-xs font-medium text-amber-900 leading-relaxed">
              {appReleaseConfirmMessages.map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAppReleaseConfirmModal(false)}
                className="h-11 px-5 rounded-xl border-border/50 text-xs font-bold text-slate hover:bg-surface"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowAppReleaseConfirmModal(false);
                  executeSaveAppRelease();
                }}
                className="h-11 px-6 rounded-xl bg-[#155D5F] hover:bg-[#155D5F]/90 text-white text-xs font-bold shadow-md shadow-primary/20"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
