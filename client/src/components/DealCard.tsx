/* ────────────────────────────────────────────────────────────────────
   DealCard — cartão de oferta da home.
   Correções Parte 3 + Código Canônico:
   - "Voo direto" fixo REMOVIDO: as paradas exibidas são as reais
     (stops da API). Sem stops na resposta, a linha some — nunca
     afirma o que não sabe (Cân. XXIII, fail-closed).
   - Procedência visível (Cân. XXII): "Verificado em [data]" a partir
     de created_at da oferta.
   - Preço como herói (MT-VISUAL-001), texto branco só sobre scrim.
   ──────────────────────────────────────────────────────────────────── */
import { motion } from "framer-motion";
import { BadgeCheck, Calendar, MapPin, Plane, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

interface DealCardProps {
  deal: {
    id: number;
    title: string;
    description: string;
    origin: string;
    destination: string;
    origin_city: string;
    destination_city: string;
    price: string;
    airline: string;
    departure_date: string;
    imageUrl?: string;
    stops?: number;
    duration?: string;
    createdAt?: string;
  };
}

export function DealCard({ deal }: DealCardProps) {
  const [, setLocation] = useLocation();
  const { language, t } = useI18n();

  // Generic fallback image when the deal's image URL is dead.
  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=800";

  const handleBook = () => {
    // Navigate to search with these params prefilled
    const searchParams = new URLSearchParams();
    searchParams.append("origin", deal.origin);
    searchParams.append("destination", deal.destination);

    // Convert date if possible, otherwise just use today for the search to be valid
    searchParams.append("date", deal.departure_date || new Date().toISOString().split("T")[0]);
    searchParams.append("dealId", String(deal.id));
    setLocation(`/search?${searchParams.toString()}`);
  };

  /* Paradas reais, não promessa: 0 = direto; 1+ = contagem; ausente =
     linha omitida (não afirmar o que a API não disse). */
  const stopsLabel =
    deal.stops == null
      ? null
      : deal.stops === 0
        ? t("flight.direct")
        : deal.stops === 1
          ? t("home.deals.stops_one")
          : t("home.deals.stops_many", { count: deal.stops });

  const verifiedDate = deal.createdAt
    ? new Intl.DateTimeFormat(language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(deal.createdAt))
    : null;

  return (
    <motion.div whileHover={{ y: -8 }} className="h-full">
      <Card className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#101E42]/10 bg-white shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(15,23,42,0.25)]">
        {/* Image Section - Fixed Aspect Ratio */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={deal.imageUrl || FALLBACK_IMAGE}
            alt={deal.destination_city}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div className="mt-photo-scrim absolute inset-0" />

          <div className="absolute left-4 top-4">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
              {t("home.deals.badge")}
            </Badge>
          </div>

          <div className="absolute inset-x-5 bottom-4">
            <div className="mb-1 flex items-center gap-1.5 opacity-90">
              <MapPin className="h-3.5 w-3.5 text-[#E8B65D]" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/90">
                {deal.destination_city || deal.destination}
              </p>
            </div>
            <h3 className="font-display line-clamp-2 text-xl font-extrabold leading-tight tracking-tight text-white">
              {deal.title}
            </h3>
          </div>
        </div>

        {/* Content Section - Flexible but balanced */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-[#6B7594]">
                  {t("home.board.col_price")}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="mt-price text-[28px]">{deal.price}</span>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#6B7594]">
                    {t("home.board.per_person")}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-[#101E42]/10 pt-3">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-tight text-[#3D4A6B]">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#3D4EAB]" />
                <span>
                  {t("search.departure")}: {deal.departure_date}
                </span>
              </div>
              {stopsLabel && (
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-tight text-[#3D4A6B]">
                  <Plane className="h-3.5 w-3.5 shrink-0 text-[#3D4EAB]" />
                  <span>{stopsLabel}</span>
                  {deal.duration && <span className="text-[#6B7594]">· {deal.duration}</span>}
                </div>
              )}
              {verifiedDate && (
                <p className="mt-provenance pt-1">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#128C4A]" />
                  {t("home.deals.verified_on", { date: verifiedDate })}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleBook}
            className="mt-cta-coral mt-6 h-12 w-full rounded-2xl text-[12px] font-extrabold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
          >
            {t("home.board.book")}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
