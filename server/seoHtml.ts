import type { Request } from "express";

const KNOWN_SITE_ORIGINS = [
  "https://buyflights.net",
  "https://www.michelstravel.agency",
];

const DEFAULT_TITLE = "Michels Travel | Agência de viagens em Newark, NJ";
const DEFAULT_DESCRIPTION =
  "Atendimento em português para passagens aéreas em Newark, NJ, com foco em voos para o Brasil, suporte humano e ajuda clara para clientes de Ironbound e região.";
const DEFAULT_OG_DESCRIPTION =
  "Atendimento em português para passagens aéreas em Newark, NJ, com foco em voos para o Brasil e suporte humano.";
const DEFAULT_IMAGE_PATH = "/images/og-share-card.png";
const DEFAULT_IMAGE_ALT =
  "Michels Travel: voos para o Brasil com atendimento em portugues saindo de Newark.";
const DEFAULT_IMAGE_WIDTH = "1200";
const DEFAULT_IMAGE_HEIGHT = "630";
const DEFAULT_IMAGE_TYPE = "image/png";

const NOINDEX_PREFIXES = [
  "/search",
  "/book",
  "/checkout",
  "/admin",
  "/atendimento",
  "/profile",
  "/my-trips",
  "/messages",
  "/live",
];

type SeoConfig = {
  path: string;
  title: string;
  description: string;
  ogDescription?: string;
  indexable: boolean;
  structuredData?: Record<string, unknown>[];
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizePath(urlOrPath: string): string {
  const pathOnly = urlOrPath.split("?")[0]?.split("#")[0] || "/";
  if (pathOnly.length > 1 && pathOnly.endsWith("/")) {
    return pathOnly.slice(0, -1);
  }
  return pathOnly || "/";
}

function isNoindexPath(path: string): boolean {
  return NOINDEX_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function getPreferredOrigin(req: Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || req.hostname;
  return `${protocol}://${host}`.replace(/\/$/, "");
}

function injectDynamicOrigin(html: string, origin: string): string {
  return KNOWN_SITE_ORIGINS.reduce((updatedHtml, siteOrigin) => {
    return updatedHtml.replace(new RegExp(escapeRegExp(siteOrigin), "g"), origin);
  }, html);
}

function buildIronboundStructuredData(origin: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Agência de Viagens em Ironbound, Newark | Michels Travel",
      url: `${origin}/agencia-de-viagens-ironbound-newark`,
      description:
        "Página local da Michels Travel para clientes de Ironbound e Newark que buscam passagens aéreas, voos para o Brasil e atendimento humano em português.",
      about: {
        "@type": "Service",
        name: "Atendimento de agência de viagens para Ironbound e Newark",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Agência de viagens e passagens aéreas em Ironbound, Newark",
      name: "Michels Travel | Atendimento local para Ironbound, Newark",
      url: `${origin}/agencia-de-viagens-ironbound-newark`,
      areaServed: [
        { "@type": "Place", name: "Ironbound, Newark, NJ" },
        { "@type": "City", name: "Newark" },
        { "@type": "Place", name: "New Jersey" },
      ],
      provider: {
        "@type": "TravelAgency",
        name: "Michels Travel",
        url: origin,
        telephone: "+1-862-350-1161",
        email: "contact@michelstravel.agency",
        availableLanguage: ["Portuguese", "English", "Spanish"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${origin}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Agência de viagens em Ironbound, Newark",
          item: `${origin}/agencia-de-viagens-ironbound-newark`,
        },
      ],
    },
  ];
}

function buildBrazilStructuredData(origin: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Passagens para o Brasil saindo de Newark | Michels Travel",
      url: `${origin}/passagens-para-o-brasil-saindo-de-newark`,
      description:
        "Página dedicada a brasileiros em Newark que buscam passagens para o Brasil, atendimento em português e ofertas dinâmicas de voos saindo de Newark.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Passagens para o Brasil saindo de Newark",
      serviceType: "Pesquisa e reserva de voos Newark Brasil com atendimento em português",
      areaServed: [
        { "@type": "Place", name: "Ironbound, Newark, NJ" },
        { "@type": "City", name: "Newark" },
        { "@type": "Country", name: "Brazil" },
      ],
      provider: {
        "@type": "TravelAgency",
        name: "Michels Travel",
        url: origin,
        telephone: "+1-862-350-1161",
        email: "contact@michelstravel.agency",
        availableLanguage: ["Portuguese", "English", "Spanish"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${origin}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Passagens para o Brasil saindo de Newark",
          item: `${origin}/passagens-para-o-brasil-saindo-de-newark`,
        },
      ],
    },
  ];
}

function buildSeniorStructuredData(origin: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Atendimento Senior | Michels Travel",
      url: `${origin}/senior`,
      description:
        "Fluxo simplificado da Michels Travel para idosos e clientes que preferem comprar com mais calma, ajuda humana visível e letras maiores.",
    },
  ];
}

function buildSeniorAppStructuredData(origin: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Baixar App Android Michels Travel Senior",
      url: `${origin}/apps/michels-travel-senior`,
      description:
        "Pagina oficial da Michels Travel para instalar o app Android senior, continuar a viagem com mais calma e escanear documentos direto do celular.",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Michels Travel Senior",
      operatingSystem: "Android",
      applicationCategory: "TravelApplication",
      url: `${origin}/apps/michels-travel-senior`,
      downloadUrl: `${origin}/apps/michels-travel-senior`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ];
}

function getSeoConfig(path: string, origin: string): SeoConfig {
  const normalizedPath = normalizePath(path);
  const fallback: SeoConfig = {
    path: normalizedPath,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogDescription: DEFAULT_OG_DESCRIPTION,
    indexable: !isNoindexPath(normalizedPath),
  };

  if (normalizedPath === "/agencia-de-viagens-ironbound-newark") {
    return {
      ...fallback,
      title: "Agência de Viagens em Ironbound, Newark | Michels Travel",
      description:
        "Atendimento em português para clientes de Ironbound e Newark que buscam passagens aéreas, voos para o Brasil e suporte humano antes e depois da reserva.",
      ogDescription:
        "Página local da Michels Travel para Ironbound e Newark, com foco em atendimento em português e voos para o Brasil.",
      structuredData: buildIronboundStructuredData(origin),
    };
  }

  if (normalizedPath === "/passagens-para-o-brasil-saindo-de-newark") {
    return {
      ...fallback,
      title: "Passagens para o Brasil saindo de Newark | Michels Travel",
      description:
        "Página em português para brasileiros em Newark que buscam passagens para o Brasil, atendimento humano e ofertas dinâmicas de voos saindo de Newark.",
      ogDescription:
        "Voos para o Brasil saindo de Newark com atendimento em português e foco no público brasileiro da região.",
      structuredData: buildBrazilStructuredData(origin),
    };
  }

  if (normalizedPath === "/senior") {
    return {
      ...fallback,
      title: "Atendimento Senior | Michels Travel",
      description:
        "Fluxo simplificado da Michels Travel para idosos e clientes que preferem comprar com mais calma, letras maiores e ajuda humana visível.",
      ogDescription:
        "Caminho simplificado da Michels Travel para clientes que preferem comprar com mais calma e apoio humano.",
      structuredData: buildSeniorStructuredData(origin),
    };
  }

  if (normalizedPath === "/apps/michels-travel-senior") {
    return {
      ...fallback,
      title: "Baixar App Android Michels Travel Senior",
      description:
        "Pagina oficial da Michels Travel para instalar o app Android senior, continuar a viagem com mais calma e escanear documentos direto do celular.",
      ogDescription:
        "Instale o app Android senior da Michels Travel e continue sua viagem com mais calma direto do celular.",
      structuredData: buildSeniorAppStructuredData(origin),
    };
  }

  return fallback;
}

function replaceTag(html: string, pattern: RegExp, replacement: string): string {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function injectStructuredData(html: string, structuredData: Record<string, unknown>[] | undefined): string {
  if (!structuredData || structuredData.length === 0) {
    return html;
  }

  const scripts = structuredData
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join("\n");

  return html.replace("</head>", `${scripts}\n</head>`);
}

export function renderSeoHtml(template: string, req: Request): string {
  const origin = getPreferredOrigin(req);
  const seo = getSeoConfig(req.originalUrl || req.path, origin);
  const canonicalUrl = `${origin}${seo.path === "/" ? "/" : seo.path}`;
  const ogDescription = seo.ogDescription || seo.description;
  const defaultImageUrl = `${origin}${DEFAULT_IMAGE_PATH}`;
  const robots = seo.indexable
    ? "index, follow"
    : "noindex, nofollow, noarchive, nosnippet";
  const googlebot = seo.indexable
    ? "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1"
    : "noindex, nofollow, noarchive, nosnippet";

  let html = injectDynamicOrigin(template, origin);

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  html = replaceTag(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
  );
  html = replaceTag(
    html,
    /<meta name="robots" content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${robots}" />`,
  );
  html = replaceTag(
    html,
    /<meta name="googlebot" content="[^"]*"\s*\/?>/i,
    `<meta name="googlebot" content="${googlebot}" />`,
  );
  html = replaceTag(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:image" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapeHtml(defaultImageUrl)}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:image:secure_url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:secure_url" content="${escapeHtml(defaultImageUrl)}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:image:width" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:width" content="${DEFAULT_IMAGE_WIDTH}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:image:height" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:height" content="${DEFAULT_IMAGE_HEIGHT}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:image:type" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:type" content="${DEFAULT_IMAGE_TYPE}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:image:alt" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${escapeHtml(DEFAULT_IMAGE_ALT)}" />`,
  );
  html = replaceTag(
    html,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
  );
  html = replaceTag(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`,
  );
  html = replaceTag(
    html,
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapeHtml(defaultImageUrl)}" />`,
  );
  html = replaceTag(
    html,
    /<meta name="twitter:image:alt" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${escapeHtml(DEFAULT_IMAGE_ALT)}" />`,
  );

  return injectStructuredData(html, seo.structuredData);
}
