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

export type SeniorNameCoachMode = "suggest" | "confirm";
export type SeniorNameCoachReason = "characters" | "spacing" | "case";

type CoachLanguage = "pt" | "en" | "es";

interface SeniorNameCoachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: string;
  mode: SeniorNameCoachMode;
  fieldLabel?: string;
  typedValue?: string;
  suggestedValue?: string;
  fullName: string;
  reason?: SeniorNameCoachReason;
  onPrimary: () => void;
  onSecondary: () => void;
}

type CoachCopy = {
  badge: string;
  titleSuggest: string;
  titleConfirm: string;
  descSuggest: string;
  descConfirm: string;
  boardTitle: string;
  wroteLabel: string;
  suggestLabel: string;
  fullNameLabel: string;
  fieldLabel: string;
  questionSuggest: string;
  questionConfirm: string;
  primarySuggest: string;
  secondarySuggest: string;
  primaryConfirm: string;
  secondaryConfirm: string;
  reasonCharacters: string;
  reasonSpacing: string;
  reasonCase: string;
  note: string;
};

const COPY: Record<CoachLanguage, CoachCopy> = {
  pt: {
    badge: "Ajuda devagar com o nome",
    titleSuggest: "Vamos conferir este campo com calma",
    titleConfirm: "Vamos conferir o nome completo",
    descSuggest: "Eu parei antes de mudar qualquer coisa. Primeiro quero confirmar com você, devagar.",
    descConfirm: "Leia com calma e veja se este nome está igual ao documento do passageiro.",
    boardTitle: "Quadro de conferência",
    wroteLabel: "Você escreveu",
    suggestLabel: "Posso ajustar para",
    fullNameLabel: "Nome completo",
    fieldLabel: "Campo",
    questionSuggest: "Posso fazer esse ajuste para você?",
    questionConfirm: "Este nome está igual ao documento?",
    primarySuggest: "Sim, ajustar",
    secondarySuggest: "Não, vou revisar",
    primaryConfirm: "Sim, está certo",
    secondaryConfirm: "Não, quero revisar",
    reasonCharacters: "Vi números ou símbolos misturados ao nome.",
    reasonSpacing: "Vi espaços sobrando e posso organizar melhor.",
    reasonCase: "Posso deixar a leitura mais clara sem trocar o nome.",
    note: "Eu só mudo depois da sua resposta.",
  },
  en: {
    badge: "Slow name help",
    titleSuggest: "Let us check this field calmly",
    titleConfirm: "Let us confirm the full name",
    descSuggest: "I stopped before changing anything. First I want to confirm it with you, slowly.",
    descConfirm: "Read it calmly and check whether this name matches the travel document.",
    boardTitle: "Review board",
    wroteLabel: "You wrote",
    suggestLabel: "I can adjust it to",
    fullNameLabel: "Full name",
    fieldLabel: "Field",
    questionSuggest: "Would you like me to make this adjustment?",
    questionConfirm: "Is this name exactly like the document?",
    primarySuggest: "Yes, adjust it",
    secondarySuggest: "No, I will review it",
    primaryConfirm: "Yes, it is correct",
    secondaryConfirm: "No, let me review it",
    reasonCharacters: "I saw numbers or symbols mixed into the name.",
    reasonSpacing: "I saw extra spaces and can organize it better.",
    reasonCase: "I can make it easier to read without changing the name.",
    note: "I only change it after your answer.",
  },
  es: {
    badge: "Ayuda lenta con el nombre",
    titleSuggest: "Vamos a revisar este campo con calma",
    titleConfirm: "Vamos a confirmar el nombre completo",
    descSuggest: "Me detuve antes de cambiar nada. Primero quiero confirmarlo con usted, despacio.",
    descConfirm: "Léalo con calma y vea si este nombre está igual al documento del pasajero.",
    boardTitle: "Pizarra de revisión",
    wroteLabel: "Usted escribió",
    suggestLabel: "Puedo ajustarlo a",
    fullNameLabel: "Nombre completo",
    fieldLabel: "Campo",
    questionSuggest: "¿Quiere que haga este ajuste por usted?",
    questionConfirm: "¿Este nombre está igual al documento?",
    primarySuggest: "Sí, ajustar",
    secondarySuggest: "No, voy a revisarlo",
    primaryConfirm: "Sí, está correcto",
    secondaryConfirm: "No, quiero revisarlo",
    reasonCharacters: "Vi números o símbolos mezclados en el nombre.",
    reasonSpacing: "Vi espacios sobrando y puedo ordenarlo mejor.",
    reasonCase: "Puedo dejar la lectura más clara sin cambiar el nombre.",
    note: "Solo cambio algo después de su respuesta.",
  },
};

function getLanguage(language?: string): CoachLanguage {
  if (language === "en" || language === "es") return language;
  return "pt";
}

function getReasonText(copy: CoachCopy, reason?: SeniorNameCoachReason) {
  if (reason === "characters") return copy.reasonCharacters;
  if (reason === "spacing") return copy.reasonSpacing;
  return copy.reasonCase;
}

function TeacherBoardScene({
  copy,
  mode,
  fieldLabel,
  typedValue,
  suggestedValue,
  fullName,
}: {
  copy: CoachCopy;
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
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/80">{copy.boardTitle}</p>
          <Sparkles className="h-4 w-4 text-coral-500" />
        </div>

        <div className="space-y-4 text-left">
          {mode === "suggest" ? (
            <>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{copy.fieldLabel}</p>
                <p className="mt-1 text-sm font-black text-white">{fieldLabel}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{copy.wroteLabel}</p>
                  <p className="text-base font-black text-slate-400 line-through opacity-70 break-words">{typedValue || "-"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">{copy.suggestLabel}</p>
                  <p className="text-base font-black text-white break-words">{suggestedValue || "-"}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">{copy.fullNameLabel}</p>
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
  language,
  mode,
  fieldLabel,
  typedValue,
  suggestedValue,
  fullName,
  reason,
  onPrimary,
  onSecondary,
}: SeniorNameCoachDialogProps) {
  const copy = COPY[getLanguage(language)];
  const isSuggest = mode === "suggest";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-[48px] border border-white/10 bg-slate-950 p-0 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.25)_0%,rgba(2,6,23,0)_70%)] pointer-events-none" />
        
        <div className="p-8 md:p-12 relative z-10">
          <DialogHeader className="space-y-6 text-left">
            <Badge className="w-fit rounded-full border-blue-500/20 bg-blue-500/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
              {copy.badge}
            </Badge>
            <div>
              <DialogTitle className="text-3xl font-black text-white tracking-tight uppercase">
                {isSuggest ? copy.titleSuggest : copy.titleConfirm}
              </DialogTitle>
              <DialogDescription className="mt-4 max-w-2xl text-lg font-medium text-slate-400 leading-relaxed">
                {isSuggest ? copy.descSuggest : copy.descConfirm}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-10">
            <TeacherBoardScene
              copy={copy}
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
                  {getReasonText(copy, reason)}
                </p>
              )}
              <p className="text-base font-black text-white uppercase tracking-tight">
                {isSuggest ? copy.questionSuggest : copy.questionConfirm}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{copy.note}</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onSecondary}
              className="h-14 rounded-2xl bg-white/5 px-8 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              {isSuggest ? copy.secondarySuggest : copy.secondaryConfirm}
            </Button>
            <Button
              type="button"
              onClick={onPrimary}
              className="h-14 rounded-2xl bg-blue-600 px-10 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all"
            >
              {isSuggest ? copy.primarySuggest : copy.primaryConfirm}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
