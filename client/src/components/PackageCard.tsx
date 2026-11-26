/* ────────────────────────────────────────────────────────────────────
   PackageCard — cartão da vitrine /pacotes.
   Hierarquia MT-VISUAL-001: destino → preço → condição → datas → CTA.
   Cân. XXII (procedência): "verificado em [data]" sempre visível.
   Cân. XXIII (fail-closed): preço expirado some; o cartão mostra
   "a reconfirmar" e o CTA vira pedido de reconfirmação.
   Checklist técnico: texto branco só sobre scrim escuro; preço medido
   em tinta real; logo intacto (não há logo neste cartão); nada
   sobreposto; margens em múltiplos de 8px.
   ──────────────────────────────────────────────────────────────────── */
import { motion } from "framer-motion";
import { BadgeCheck, BedDouble, CalendarDays, MessageCircle, Plane, RefreshCw, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import {
  buildPackageWhatsAppHref,
  formatPackageDates,
  formatPackagePrice,
  formatVerifiedDate,
  getPackageImage,
  isPriceFresh,
  type TravelPackage,
} from "@/lib/packages";
import type { ContactLanguage } from "@/lib/contact";

export function PackageCard({ pkg }: { pkg: TravelPackage }) {
  const { t, language } = useI18n();
  const fresh = isPriceFresh(pkg);
  const lang = (language || "pt") as ContactLanguage;
  const href = buildPackageWhatsAppHref(pkg, lang, { fresh });

  return (
    <motion.div whileHover={{ y: -8 }} className="h-full">
      <Card className="mt-card group flex h-full flex-col overflow-hidden rounded-[24px]">
        {/* Foto — scrim escuro embaixo p/ o texto branco; canto superior
            direito livre p/ respiro (sem logo aqui, mas sem texto trepado
            na borda). Foto genérica só quando não há foto real do destino. */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={getPackageImage(pkg)}
            alt={pkg.destination}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="mt-photo-scrim absolute inset-0" />
          <div className="absolute left-5 top-4">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
              {t("packages.badge")}
            </Badge>
          </div>
          <div className="absolute inset-x-5 bottom-4">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#E8B65D]">
              {pkg.destinationCountry}
            </p>
            <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-white">
              {pkg.destination}
            </h3>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          {/* Datas + noites */}
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-bold text-[#3D4A6B]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#3D4EAB]" />
              {formatPackageDates(pkg, language || "pt")}
            </span>
            <span className="inline-flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-[#3D4EAB]" />
              {pkg.nights} {t("packages.nights")}
            </span>
          </div>

          {/* Hotel — nome real, estrelas reais, nota real (escala 10). */}
          <div className="mb-4 rounded-2xl bg-[#FBF7EF] p-4">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-[#6B7594]">
              {t("packages.hotel")}
            </p>
            <p className="text-[15px] font-extrabold leading-snug text-[#101E42]">{pkg.hotel.name}</p>
            <p className="mt-1 flex items-center gap-2 text-[13px] font-bold text-[#3D4A6B]">
              <span className="inline-flex items-center gap-0.5 text-[#E8B65D]" aria-label={`${pkg.hotel.stars} estrelas`}>
                {Array.from({ length: pkg.hotel.stars }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              {pkg.hotel.rating.toLocaleString(language === "en" ? "en-US" : "pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              /{pkg.hotel.ratingScale}
            </p>
          </div>

          {/* O que inclui — só o verificado: voos ida e volta + hotel.
              Nada além disso é afirmado neste cartão. */}
          <ul className="mb-6 space-y-2 text-[13px] font-semibold leading-relaxed text-[#3D4A6B]">
            <li className="flex items-start gap-2">
              <Plane className="mt-0.5 h-4 w-4 shrink-0 text-[#E58B48]" />
              {t("packages.includes_flights", { count: pkg.travelers })}
            </li>
            <li className="flex items-start gap-2">
              <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-[#E58B48]" />
              {t("packages.includes_hotel", { nights: pkg.nights })}
            </li>
          </ul>

          {/* Preço OU estado "a reconfirmar" (fail-closed). */}
          <div className="mt-auto border-t border-[#101E42]/10 pt-4">
            {fresh ? (
              <>
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-[#6B7594]">
                  {t("packages.total_for_2")}
                </p>
                <p className="mt-price text-[32px]">{formatPackagePrice(pkg, language || "pt")}</p>
                <p className="mt-provenance mt-2">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#128C4A]" />
                  {t("packages.verified_on", { date: formatVerifiedDate(pkg, language || "pt") })}
                </p>
              </>
            ) : (
              <>
                <p className="mb-1 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-widest text-[#E2483D]">
                  <RefreshCw className="h-4 w-4" />
                  {t("packages.reconfirm")}
                </p>
                <p className="text-[13px] font-semibold leading-relaxed text-[#3D4A6B]">
                  {t("packages.reconfirm_desc", { date: formatVerifiedDate(pkg, language || "pt") })}
                </p>
              </>
            )}

            <Button
              asChild
              className="mt-cta-whatsapp mt-4 h-14 w-full rounded-2xl text-[13px] font-extrabold uppercase tracking-widest"
            >
              <a href={href} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                {fresh ? t("packages.cta_buy") : t("packages.cta_reconfirm")}
              </a>
            </Button>
            <p className="mt-3 text-center text-[11px] font-semibold leading-relaxed text-[#6B7594]">
              {t("packages.note")}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
