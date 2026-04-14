import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Sparkles, AlertCircle } from "lucide-react";

import { useI18n } from "@/lib/i18n";

export type SeniorNameCoachMode = "suggest" | "confirm";
export type SeniorNameCoachReason = "characters" | "spacing" | "case";

interface SeniorNameCoachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SeniorNameCoachMode;
  fieldLabel?: string;
  typedValue?: string;
  suggestedValue?: string;
  fullName: string;
  reason?: SeniorNameCoachReason;
  onPrimary: () => void;
  onSecondary: () => void;
}

function getReasonText(t: any, reason?: SeniorNameCoachReason) {
  if (reason === "characters") return t("name_coach_dialog.reason_characters");
  if (reason === "spacing") return t("name_coach_dialog.reason_spacing");
  return t("name_coach_dialog.reason_case");
}

function TeacherBoardScene({
  t,
  mode,
  fieldLabel,
  typedValue,
  suggestedValue,
  fullName,
}: {
  t: any;
  mode: SeniorNameCoachMode;
  fieldLabel?: string;
  typedValue?: string;
  suggestedValue?: string;
  fullName: string;
}) {
  return (
    <div className="grid gap-6 rounded-[40px] border border-white/10 bg-slate-900/60 p-6 md:grid-cols-[180px_minmax(0,1fr)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
      
      <div className="relative mx-auto flex h-[180px] w-[150px] items-end justify-center z-10">
        {/* Simple Abstract Teacher Avatar */}
        <div className="absolute bottom-0 h-24 w-24 rounded-[32px] bg-blue-600 shadow-lg shadow-blue-500/20" />
        <div className="absolute bottom-20 h-16 w-16 rounded-full border-4 border-slate-950 bg-[#ffd7b8]" />
        <div className="absolute bottom-[114px] left-[58px] h-3 w-3 rounded-full bg-slate-950" />
        <div className="absolute bottom-[102px] left-[48px] h-8 w-20 rounded-b-[32px] rounded-t-lg bg-slate-950" />
        <div className="absolute bottom-[70px] left-[20px] h-5 w-16 origin-right rotate-[18deg] rounded-full bg-[#ffd7b8]" />
        <div className="absolute bottom-[80px] left-[74px] h-3 w-14 rounded-full bg-[#ffd7b8]" />
        <div className="absolute bottom-[84px] left-[126px] h-5 w-5 rounded-full border-2 border-blue-400 bg-white" />
        <div className="absolute bottom-8 left-[98px] h-12 w-5 rotate-[10deg] rounded-full bg-slate-950" />
        <div className="absolute bottom-6 left-[120px] h-14 w-5 rotate-[-6deg] rounded-full bg-slate-950" />
      </div>

      <div className="rounded-[32px] border-[6px] border-slate-950 bg-slate-800/40 p-6 shadow-2xl relative z-10 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/80">{t("name_coach_dialog.board_title")}</p>
          <Sparkles className="h-4 w-4 text-coral-500" />
        </div>

        <div className="space-y-4 text-left">
          {mode === "suggest" ? (
            <>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t("name_coach_dialog.field_label")}</p>
                <p className="mt-1 text-sm font-black text-white">{fieldLabel}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{t("name_coach_dialog.wrote_label")}</p>
                  <p className="text-base font-black text-slate-400 line-through opacity-70 break-words">{typedValue || "-"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">{t("name_coach_dialog.suggest_label")}</p>
                  <p className="text-base font-black text-white break-words">{suggestedValue || "-"}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">{t("name_coach_dialog.full_name_label")}</p>
              <p className="text-xl font-black text-white break-words">{fullName || "-"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SeniorNameCoachDialog({
  open,
  onOpenChange,
  mode,
  fieldLabel,
  typedValue,
  suggestedValue,
  fullName,
  reason,
  onPrimary,
  onSecondary,
}: SeniorNameCoachDialogProps) {
  const { t } = useI18n();
  const isSuggest = mode === "suggest";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-[48px] border border-white/10 bg-slate-950 p-0 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.25)_0%,rgba(2,6,23,0)_70%)] pointer-events-none" />
        
        <div className="p-8 md:p-12 relative z-10">
          <DialogHeader className="space-y-6 text-left">
            <Badge className="w-fit rounded-full border-blue-500/20 bg-blue-500/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
              {t("name_coach_dialog.badge")}
            </Badge>
            <div>
              <DialogTitle className="text-3xl font-black text-white tracking-tight uppercase">
                {isSuggest ? t("name_coach_dialog.title_suggest") : t("name_coach_dialog.title_confirm")}
              </DialogTitle>
              <DialogDescription className="mt-4 max-w-2xl text-lg font-medium text-slate-400 leading-relaxed">
                {isSuggest ? t("name_coach_dialog.desc_suggest") : t("name_coach_dialog.desc_confirm")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-10">
            <TeacherBoardScene
              t={t}
              mode={mode}
              fieldLabel={fieldLabel}
              typedValue={typedValue}
              suggestedValue={suggestedValue}
              fullName={fullName}
            />
          </div>

          <div className="mt-10 flex items-start gap-4 p-6 rounded-3xl bg-white/5 border border-white/5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              {isSuggest && (
                <p className="text-sm font-bold text-slate-300 mb-2">
                  {getReasonText(t, reason)}
                </p>
              )}
              <p className="text-base font-black text-white uppercase tracking-tight">
                {isSuggest ? t("name_coach_dialog.question_suggest") : t("name_coach_dialog.question_confirm")}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{t("name_coach_dialog.note")}</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onSecondary}
              className="h-14 rounded-2xl bg-white/5 px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              {isSuggest ? t("name_coach_dialog.secondary_suggest") : t("name_coach_dialog.secondary_confirm")}
            </Button>
            <Button
              type="button"
              onClick={onPrimary}
              className="h-14 rounded-2xl bg-blue-600 px-10 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all"
            >
              {isSuggest ? t("name_coach_dialog.primary_suggest") : t("name_coach_dialog.primary_confirm")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
