/* ────────────────────────────────────────────────────────────────────
   /pacotes — vitrine de pacotes (voo + hotel) da Michel's Travel.
   Preços vêm de client/src/data/packages.json, cada um com data de
   verificação no TAAP. Fail-closed (Cân. XXIII): pacote com preço
   velho NÃO exibe valor — mostra "a reconfirmar". Ver
   docs/packages-daily-refresh.md (rotina diária de recheck).
   ──────────────────────────────────────────────────────────────────── */
import { Link } from "wouter";
import { ArrowLeft, BadgeCheck, Package as PackageIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { PackageCard } from "@/components/PackageCard";
import { getPackages } from "@/lib/packages";

export default function Packages() {
  const { t } = useI18n();
  const packages = getPackages();

  return (
    <div className="min-h-screen bg-[#FBF7EF] text-[#101E42]">
      <SEO
        title={t("packages.seo_title")}
        description={t("packages.seo_desc")}
        path="/pacotes"
      />

      {/* Hero editorial — foto quente local, título grande, preço como
          herói fica para os cartões abaixo; aqui a promessa é clara e
          plana. */}
      <section className="relative overflow-hidden bg-[#0B1B3A] pb-6 pt-6 md:pb-24 md:pt-20">
        <div className="absolute inset-0">
          <img
            src="/images/hero-jet-sunset.jpg"
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
          <div className="mt-hero-scrim absolute inset-0" />
        </div>
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <Link
            href="/"
            className="mb-8 flex w-fit items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {t("packages.back_home")}
          </Link>
          <span className="mt-eyebrow mt-eyebrow--gold">
            <PackageIcon className="h-4 w-4" />
            {t("packages.badge")}
          </span>
          <h1 className="font-display mt-6 max-w-3xl text-[2rem] font-extrabold leading-[1.1] tracking-tight text-white md:text-7xl md:leading-[0.95]">
            {t("packages.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-snug text-white mt-hero-subtitle md:mt-6 md:text-xl md:leading-relaxed">
            {t("packages.subtitle")}
          </p>
          <p className="mt-provenance mt-8 !text-slate-400">
            <BadgeCheck className="h-4 w-4 text-[#E8B65D]" />
            {t("packages.provenance_line")}
          </p>
        </div>
      </section>

      {/* Grade de pacotes */}
      <section className="mt-section container mx-auto max-w-6xl px-4">
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-dashed border-[#101E42]/15 bg-white/60 py-24 text-center">
            <p className="text-[12px] font-extrabold uppercase tracking-widest text-[#6B7594]">
              {t("packages.empty")}
            </p>
          </div>
        )}

        <p className="mx-auto mt-12 max-w-2xl text-center text-[13px] font-medium leading-relaxed text-[#6B7594]">
          {t("packages.footer_note")}
        </p>
      </section>
    </div>
  );
}
