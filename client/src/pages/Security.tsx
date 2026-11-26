/* ────────────────────────────────────────────────────────────────────
   /seguranca — página de segurança da compra (decisão do dono,
   26/nov/2026: página separada, não seção na home).
   Conteúdo: SecuritySection — SÓ FATOS VERIFICÁVEIS (ordem do dono,
   16/nov/2026): agência registrada em NJ desde 2023 · Cruise Brothers
   com credenciamento IATA · emissão via Expedia (TAAP) e direto com a
   companhia · código da reserva conferível no site da companhia ·
   pagamento no cartão com recibo · avaliações no Google.
   NADA de selo de governo (esse link não existe).
   ──────────────────────────────────────────────────────────────────── */
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { SecuritySection } from "@/components/SecuritySection";

export default function Security() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#0B1B3A] text-white">
      <SEO title={t("security.title")} description={t("security.desc")} path="/seguranca" />

      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-slate-300 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> {t("packages.back_home")}
        </Link>
      </div>

      <SecuritySection />
    </div>
  );
}
