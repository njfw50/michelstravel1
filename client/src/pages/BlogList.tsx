import { useBlogPosts } from "@/hooks/use-blog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowRight, BookOpen, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { useDestinationHighlights } from "@/hooks/use-destinations";
import { Globe2, MapPin, Navigation2, ArrowUpRight } from "lucide-react";

function estimateReadTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

export default function BlogList() {
  const { data: posts, isLoading } = useBlogPosts();
  const { t, language } = useI18n();

  const destinations = [
    { city: "Orlando", country: "us", label: "Orlando, EUA" },
    { city: "Miami", country: "us", label: "Miami, EUA" },
    { city: "New York", country: "us", label: "Nova York, EUA" },
    { city: "Boston", country: "us", label: "Boston, EUA" },
    { city: "Rio de Janeiro", country: "br", label: "Rio de Janeiro, Brasil" },
    { city: "São Paulo", country: "br", label: "São Paulo, Brasil" },
    { city: "Salvador", country: "br", label: "Salvador, Brasil" },
    { city: "Brasília", country: "br", label: "Brasília, Brasil" },
  ];

  const primaryDest = destinations[0];
  const { data: highlights, isLoading: loadingHighlights } = useDestinationHighlights({
    city: primaryDest.city,
    country: primaryDest.country,
    lang: language || "pt",
    limit: 24,
  });

  const featuredPost = posts?.[0];
  const remainingPosts = posts?.slice(1) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Blog de Viagens" description="Dicas de viagem, guias de destinos e novidades do mundo da aviação. Tudo para você viajar melhor e mais barato." path="/blog" />

      <div className="bg-white border-b border-gray-200 py-16 md:py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">{t("nav.blog")}</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t("blog.subtitle")}</p>
      </div>

      {/* Destinos em destaque */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase flex items-center gap-2">
              <Globe2 className="h-4 w-4" /> Destinos em alta
            </p>
            <h2 className="text-2xl font-display font-bold text-gray-900">Guia rápido EUA + Brasil</h2>
            <p className="text-gray-500 text-sm">Atrações, museus e restaurantes úteis para planejar sua viagem.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {destinations.slice(0, 4).map((d) => (
              <span key={d.city} className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-100">
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {loadingHighlights ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse h-32 rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : highlights?.items?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlights.items.map((place) => (
              <Card key={place.id} className="p-4 border border-gray-200 rounded-2xl hover-elevate transition-all">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{place.name || "Ponto de interesse"}</h3>
                      {place.distance_m && (
                        <span className="text-xs text-gray-500">{Math.round(place.distance_m)} m</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {place.address || `${place.city || ""} ${place.country || ""}`}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                      {place.website && (
                        <a className="text-blue-600 font-semibold inline-flex items-center gap-1" href={place.website} target="_blank" rel="noreferrer">
                          Site <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                      {place.wikipedia && (
                        <a className="text-blue-600 font-semibold inline-flex items-center gap-1" href={`https://wikipedia.org/wiki/${place.wikipedia}`} target="_blank" rel="noreferrer">
                          Wikipedia <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">Nenhuma atração retornada. Tente outra cidade.</div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {destinations.map((d) => {
            const qs = new URLSearchParams({
              city: d.city,
              country: d.country,
              lang: language || "pt",
            }).toString();
            return (
              <Link key={d.city} href={`/blog?city=${encodeURIComponent(d.city)}&country=${d.country}`}>
                <button className="px-3 py-2 rounded-full text-sm border border-gray-200 hover:border-blue-400 hover:text-blue-700 transition">
                  {d.label}
                </button>
              </Link>
            );
          })}
          <Link href="/search">
            <button className="px-4 py-2 rounded-full text-sm bg-blue-600 text-white inline-flex items-center gap-2">
              <Navigation2 className="h-4 w-4" /> Buscar voos para estes destinos
            </button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 pb-20 max-w-6xl">
        {isLoading ? (
          <div className="flex justify-center items-center gap-2 py-20">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-10">
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`}>
                <Card
                  className="group cursor-pointer overflow-visible bg-white border border-gray-200 rounded-2xl hover-elevate"
                  data-testid={`blog-card-featured-${featuredPost.slug}`}
                >
                  <div className="flex flex-col md:flex-row overflow-hidden rounded-2xl">
                    <div className="md:w-1/2 h-56 md:h-auto min-h-[280px] overflow-hidden bg-gray-100 relative">
                      {featuredPost.coverImage ? (
                        <img
                          src={featuredPost.coverImage}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center gap-2">
                          <BookOpen className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      <Badge className="absolute top-4 left-4 bg-blue-600 text-white border-0 text-xs no-default-hover-elevate no-default-active-elevate">
                        {t("blog.featured") || "Destaque"}
                      </Badge>
                    </div>
                    <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">
                          {format(new Date(featuredPost.createdAt || new Date()), "MMMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {estimateReadTime(featuredPost.content)} min
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                        {featuredPost.title}
                      </h2>
                      <p className="text-gray-500 line-clamp-3 mb-5 text-base leading-relaxed">{featuredPost.excerpt}</p>
                      <span className="text-sm font-bold text-blue-600 flex items-center gap-1 flex-wrap" data-testid="link-read-featured">
                        {t("blog.read_article")} <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {remainingPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <Card
                      className="h-full group cursor-pointer overflow-visible bg-white border border-gray-200 rounded-2xl hover-elevate flex flex-col"
                      data-testid={`blog-card-${post.slug}`}
                    >
                      <div className="h-44 overflow-hidden bg-gray-100 shrink-0 rounded-t-2xl">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center gap-2">
                            <BookOpen className="h-10 w-10 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">
                            {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {estimateReadTime(post.content)} min
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{post.excerpt}</p>
                        <span className="text-sm font-bold text-blue-600 flex items-center gap-1 flex-wrap mt-auto" data-testid={`link-read-${post.slug}`}>
                          {t("blog.read_article")} <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("blog.no_posts")}</h3>
            <p className="text-gray-500">{t("blog.no_posts_desc")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
