import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Sparkles } from "lucide-react";

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
    <div className="grid gap-4 rounded-[30px] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-4 md:grid-cols-[160px_minmax(0,1fr)]">
      <div className="relative mx-auto flex h-[180px] w-[150px] items-end justify-center">
        <div className="absolute bottom-0 h-24 w-24 rounded-[28px] bg-blue-600" />
        <div className="absolute bottom-20 h-16 w-16 rounded-full border-4 border-slate-900 bg-[#ffd7b8]" />
        <div className="absolute bottom-[114px] left-[58px] h-4 w-4 rounded-full bg-slate-900" />
        <div className="absolute bottom-[102px] left-[48px] h-8 w-20 rounded-b-[32px] rounded-t-lg bg-slate-900" />
        <div className="absolute bottom-[70px] left-[20px] h-5 w-16 origin-right rotate-[18deg] rounded-full bg-[#ffd7b8]" />
        <div className="absolute bottom-[80px] left-[74px] h-3 w-14 rounded-full bg-[#ffd7b8]" />
        <div className="absolute bottom-[84px] left-[126px] h-4 w-4 rounded-full border-2 border-blue-900 bg-white" />
        <div className="absolute bottom-8 left-[98px] h-12 w-5 rotate-[10deg] rounded-full bg-slate-900" />
        <div className="absolute bottom-6 left-[120px] h-14 w-5 rotate-[-6deg] rounded-full bg-slate-900" />
      </div>

      <div className="rounded-[26px] border-[5px] border-slate-900 bg-[#f4f7f0] p-5 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-700">{copy.boardTitle}</p>
          <Sparkles className="h-4 w-4 text-amber-500" />
        </div>

        <div className="mt-4 space-y-3 text-left text-slate-900">
          {mode === "suggest" ? (
            <>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{copy.fieldLabel}</p>
                <p className="mt-1 text-sm font-semibold">{fieldLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{copy.wroteLabel}</p>
                <p className="mt-1 rounded-2xl bg-white/80 px-3 py-2 text-base font-bold break-words">{typedValue || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{copy.suggestLabel}</p>
                <p className="mt-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-base font-bold text-emerald-900 break-words">{suggestedValue || "-"}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{copy.fullNameLabel}</p>
              <p className="mt-2 rounded-2xl border border-blue-200 bg-white/80 px-4 py-3 text-lg font-bold text-slate-950 break-words">{fullName || "-"}</p>
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
      <DialogContent className="max-w-3xl overflow-hidden rounded-[32px] border-0 bg-white p-0 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.5)]">
        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 md:p-8">
          <DialogHeader className="space-y-4 text-left">
            <Badge className="w-fit rounded-full border-blue-200 bg-blue-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
              {copy.badge}
            </Badge>
            <div>
              <DialogTitle className="text-2xl font-display font-extrabold text-slate-950">
                {isSuggest ? copy.titleSuggest : copy.titleConfirm}
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
                {isSuggest ? copy.descSuggest : copy.descConfirm}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-6">
            <TeacherBoardScene
              copy={copy}
              mode={mode}
              fieldLabel={fieldLabel}
              typedValue={typedValue}
              suggestedValue={suggestedValue}
              fullName={fullName}
            />
          </div>

          <div className="mt-6 space-y-3 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                {isSuggest && (
                  <p className="text-sm font-semibold leading-relaxed text-slate-700">
                    {getReasonText(copy, reason)}
                  </p>
                )}
                <p className="mt-1 text-sm font-bold leading-relaxed text-slate-950">
                  {isSuggest ? copy.questionSuggest : copy.questionConfirm}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{copy.note}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onSecondary}
              className="min-h-12 rounded-2xl border-slate-300 bg-white px-5 text-sm font-bold text-slate-800"
              data-testid="button-name-coach-secondary"
            >
              {isSuggest ? copy.secondarySuggest : copy.secondaryConfirm}
            </Button>
            <Button
              type="button"
              onClick={onPrimary}
              className="min-h-12 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
              data-testid="button-name-coach-primary"
            >
              {isSuggest ? copy.primarySuggest : copy.primaryConfirm}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
