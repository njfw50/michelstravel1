import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  type?: string;
  image?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const BASE_URL = "https://www.michelstravel.agency";
const SITE_NAME = "Michels Travel";
const DEFAULT_IMAGE = `${BASE_URL}/images/og-cover.png`;

export function SEO({
  title,
  description = "Compare tarifas aéreas, reserve com pagamento seguro e conte com suporte humano da Michels Travel para viajar com mais clareza.",
  path = "/",
  type = "website",
  image = DEFAULT_IMAGE,
  noindex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Passagens aéreas com suporte profissional`;
  const url = `${BASE_URL}${path}`;
  const schemaItems = Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}


      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemaItems.map((item, index) => (
        <script key={`${type}-schema-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
