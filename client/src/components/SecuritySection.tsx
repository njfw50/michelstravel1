/* ────────────────────────────────────────────────────────────────────
   SecuritySection — "Como você compra com segurança".
   SÓ FATOS VERIFICÁVEIS (ordem do dono, 16/nov/2026):
   agência registrada em NJ desde 2023 · Cruise Brothers com
   credenciamento IATA · emissão via Expedia (TAAP) e direto com a
   companhia · código da reserva conferível no site da companhia ·
   pagamento no cartão com recibo · avaliações no Google.
   NADA de selo de governo (esse link não existe). Nenhum selo
   desenhado como certificação — são linhas de texto com ícone.
   Cân. XVI (linguagem plana e precisa) e XVIII (sem dark pattern:
   nenhuma urgência, nenhum "garantido" que não se pode provar).
   ──────────────────────────────────────────────────────────────────── */
import { motion } from "framer-motion";
import { BadgeCheck, Building2, CreditCard, MessageCircle, Plane, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import type { ContactLanguage } from "@/lib/contact";

const ITEMS = [
  { icon: Building2, key: "security.i1" },
  { icon: BadgeCheck, key: "security.i2" },
  { icon: Plane, key: "security.i3" },
  { icon: ShieldCheck, key: "security.i4" },
  { icon: CreditCard, key: "security.i5" },
  { icon: Star, key: "security.i6" },
] as const;

export function SecuritySection() {
  const { t, language } = useI18n();
  const href = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: (language || "pt") as ContactLanguage,
      topic: t("security.whatsapp_topic"),
      details: [t("security.whatsapp_details")],
    }),
  );

  return (
    <section className="relative z-10 bg-[#0B1B3A] py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mt-eyebrow mt-eyebrow--gold justify-center">
            <ShieldCheck className="h-4 w-4" />
            {t("security.badge")}
          </span>
          <h2 className="font-display mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
            {t("security.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-300 md:text-lg">
            {t("security.desc")}
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.05 }}
              className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8B65D]/15 text-[#E8B65D]">
                <item.icon className="h-6 w-6" />
              </div>
              <p className="text-[15px] font-semibold leading-relaxed text-slate-200">{t(item.key)}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="mx-auto mb-8 max-w-xl text-[13px] font-medium leading-relaxed text-slate-400">
            {t("security.note")}
          </p>
          <Button
            asChild
            className="mt-cta-whatsapp h-16 rounded-[20px] px-10 text-[13px] font-extrabold uppercase tracking-widest"
          >
            <a href={href} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-3 h-5 w-5" />
              {t("security.cta")}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
