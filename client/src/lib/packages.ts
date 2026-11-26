/* ────────────────────────────────────────────────────────────────────
   PACOTES — camada de dados da vitrine /pacotes.
   Código Canônico: Cân. XXII (procedência — todo preço tem fonte e
   data de verificação) · Cân. XXIII (fail-closed — preço sem
   verificação fresca NUNCA é exibido como atual) · Cân. XIX
   (integridade das referências) · Cân. I (auditoria: a data de
   verificação fica visível na página, não escondida no código).

   REGRA DE FRESCOR (documentada em docs/packages-daily-refresh.md):
   um preço só é exibido quando foi verificado no TAAP há no máximo
   MAX_FRESH_DAYS dias corridos. Fora disso o cartão mostra "Preço a
   reconfirmar" SEM o valor — nunca preço velho como se fosse atual.
   A rotina diária (recheck TAAP → atualizar packages.json →
   republicar) mantém a vitrine fresca; sem ela, a vitrine esvazia
   sozinha. Isso é proposital: é melhor não vender do que vender
   com preço mentiroso.
   ──────────────────────────────────────────────────────────────────── */
import packagesData from "@/data/packages.json";
import { buildWhatsAppHref, buildWhatsAppMessage } from "@/lib/contact";
import type { ContactLanguage } from "@/lib/contact";

export interface PackageHotel {
  name: string;
  stars: number;
  rating: number;
  ratingScale: number;
}

export interface TravelPackage {
  id: string;
  destination: string;
  destinationCode: string;
  destinationCountry: string;
  dates: { start: string; end: string }; // ISO yyyy-MM-dd
  nights: number;
  travelers: number;
  hotel: PackageHotel;
  price: { amount: number; currency: string };
  verifiedAt: string; // ISO yyyy-MM-dd — data da verificação no TAAP
  verifiedSource: string;
  image: string;
  imageNote?: string;
  nightsNote?: string;
}

/** Janela de frescor do preço, em dias corridos. Apertar para 1 deixa
 *  a regra "verificado no dia"; afrouxar exige decisão do dono. */
export const MAX_FRESH_DAYS = 2;

/* Intenção: a idade do preço é contada em DIAS CORRIDOS (data de hoje
   menos data de verificação), não em horas — porque o JSON registra a
   data, não a hora, da verificação. Um pacote verificado ontem tem 1
   dia; verificado há 3 dias já é velho demais para exibir preço. */
export function daysSinceVerified(pkg: TravelPackage, now: Date = new Date()): number {
  const verified = new Date(`${pkg.verifiedAt}T12:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return Math.floor((today.getTime() - verified.getTime()) / 86_400_000);
}

/* Intenção: fail-closed. Só há preço exibível quando a verificação é
   fresca. Qualquer dúvida (data ausente, inválida ou velha) devolve
   falso — o cartão cai para o estado "a reconfirmar". */
export function isPriceFresh(pkg: TravelPackage, now: Date = new Date()): boolean {
  if (!pkg.verifiedAt || Number.isNaN(Date.parse(pkg.verifiedAt))) return false;
  const age = daysSinceVerified(pkg, now);
  return age >= 0 && age <= MAX_FRESH_DAYS;
}

export function getPackages(): TravelPackage[] {
  return (packagesData as { packages: TravelPackage[] }).packages;
}

/* Intenção: formatar dinheiro como o cliente lê — US$ 2.130,40 em PT,
   $2,130.40 em EN — sem nunca arredondar ou "a partir de" inventado.
   O valor exibido é o total para 2 pessoas, como verificado. */
export function formatPackagePrice(pkg: TravelPackage, language: string): string {
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: pkg.price.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pkg.price.amount);
}

/* Intenção: datas legíveis no idioma do cliente ("10–17 jan 2027"),
   sempre a partir das datas ISO do JSON — nunca texto digitado. */
export function formatPackageDates(pkg: TravelPackage, language: string): string {
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const start = new Date(`${pkg.dates.start}T12:00:00`);
  const end = new Date(`${pkg.dates.end}T12:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const dayMonth = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const full = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  if (sameMonth) {
    const startDay = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(start);
    return `${startDay}–${dayMonth.format(end)} ${start.getFullYear()}`;
  }
  return `${full.format(start)} – ${full.format(end)}`;
}

export function formatVerifiedDate(pkg: TravelPackage, language: string): string {
  const locale = language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${pkg.verifiedAt}T12:00:00`),
  );
}

/* Intenção: fotos SÓ das fontes já verificadas no repo (Unsplash /
   Pexels usados na Home). Destino sem foto real verificada usa a foto
   genérica de asa ao pôr do sol — nunca a foto de outro destino
   passada como se fosse aquele lugar (FACT_LOCK). */
const PACKAGE_IMAGES: Record<string, string> = {
  lisboa:
    "https://images.unsplash.com/photo-1525207934214-58e69a8f8a3e?q=80&w=1200&auto=format&fit=crop",
  orlando:
    "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=1200&auto=format&fit=crop",
  "generic-sunset-wing":
    "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?q=80&w=1200&auto=format&fit=crop",
};

export function getPackageImage(pkg: TravelPackage): string {
  return PACKAGE_IMAGES[pkg.image] || PACKAGE_IMAGES["generic-sunset-wing"];
}

/* Intenção: o botão "Quero comprar" abre o WhatsApp com a mensagem
   pré-preenchida daquele pacote — destino, datas, hotel e o total
   verificado (ou o pedido de reconfirmação, quando o preço expirou).
   Usa os helpers oficiais @/lib/contact; nada de wa.me montado à mão. */
export function buildPackageWhatsAppHref(
  pkg: TravelPackage,
  language: ContactLanguage,
  opts: { fresh: boolean },
): string {
  const topic =
    language === "en"
      ? `Package ${pkg.destination} — ${formatPackageDates(pkg, language)}`
      : language === "es"
        ? `Paquete ${pkg.destination} — ${formatPackageDates(pkg, language)}`
        : `Pacote ${pkg.destination} — ${formatPackageDates(pkg, language)}`;
  const details = opts.fresh
    ? [
        language === "en"
          ? `Total for 2 travelers: ${formatPackagePrice(pkg, language)} (verified on ${formatVerifiedDate(pkg, language)})`
          : language === "es"
            ? `Total para 2 personas: ${formatPackagePrice(pkg, language)} (verificado el ${formatVerifiedDate(pkg, language)})`
            : `Total para 2 pessoas: ${formatPackagePrice(pkg, language)} (verificado em ${formatVerifiedDate(pkg, language)})`,
        `${pkg.hotel.name} — ${pkg.nights} ${language === "en" ? "nights" : language === "es" ? "noches" : "noites"}`,
      ]
    : [
        language === "en"
          ? `Please reconfirm the price (last verified on ${formatVerifiedDate(pkg, language)})`
          : language === "es"
            ? `Por favor, reconfirmar el precio (última verificación: ${formatVerifiedDate(pkg, language)})`
            : `Por favor, reconfirmar o preço (última verificação: ${formatVerifiedDate(pkg, language)})`,
        `${pkg.hotel.name} — ${pkg.nights} ${language === "en" ? "nights" : language === "es" ? "noches" : "noites"}`,
      ];
  return buildWhatsAppHref(buildWhatsAppMessage({ language, topic, details }));
}
