"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
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
  usePreviewEmailTemplateMutation
} from "@/lib/redux/features/adminApi";

export default function SystemConfigPage() {
  const { data: settingsData, isLoading } = useGetSettingsQuery(undefined);
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const { data: templatesData, isLoading: isLoadingTemplates } = useGetEmailTemplatesQuery({});
  const [updateTemplate, { isLoading: isUpdatingTemplate }] = useUpdateEmailTemplateMutation();
  const [previewTemplate, { isLoading: isPreviewing }] = usePreviewEmailTemplateMutation();

  const [formState, setFormState] = useState({
    REFERRAL_ENABLED: false,
    REFERRAL_REWARD_KOBO: "",
    MAINTENANCE_MODE: false,
    ACTIVE_PAYMENT_PROVIDER: "PAGA",
  });

  const [activeTab, setActiveTab] = useState<"settings" | "email">("settings");
  
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

  const handleSave = async () => {
    try {
      // Send as strings as required by the backend
      const payload = {
        ...(settingsData?.data || {}),
        REFERRAL_ENABLED: String(formState.REFERRAL_ENABLED),
        REFERRAL_REWARD_KOBO: String(formState.REFERRAL_REWARD_KOBO),
        MAINTENANCE_MODE: String(formState.MAINTENANCE_MODE),
        ACTIVE_PAYMENT_PROVIDER: String(formState.ACTIVE_PAYMENT_PROVIDER || "PAGA").toUpperCase().trim(),
      };
      
      console.log("Sending payload:", payload);

      await updateSettings(payload).unwrap();
      toast.success("System settings updated successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update system settings");
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
            Manage system-wide parameters, referral rewards, and email templates.
          </p>
        </div>
        {activeTab === "settings" && (
          <Button 
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="bg-[#155D5F] hover:bg-[#155D5F]/90 text-white rounded-xl h-11 px-8 font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        )}
      </div>

      <div className="flex border-b border-border/50 mb-8 gap-8">
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === "settings" ? "text-[#155D5F]" : "text-slate/60 hover:text-dark"
          }`}
        >
          General Settings
          {activeTab === "settings" && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#155D5F] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === "email" ? "text-[#155D5F]" : "text-slate/60 hover:text-dark"
          }`}
        >
          Email Templates
          {activeTab === "email" && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#155D5F] rounded-t-full" />
          )}
        </button>
      </div>

      {(isLoading || isLoadingTemplates) ? (
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
    </div>
  );
}
