import { useBlogPosts } from "@/hooks/use-blog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowRight, BookOpen, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";

function estimateReadTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

export default function BlogList() {
  const { data: posts, isLoading } = useBlogPosts();
  const { t } = useI18n();

  const featuredPost = posts?.[0];
  const remainingPosts = posts?.slice(1) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Blog de Viagens" description="Dicas de viagem, guias de destinos e novidades do mundo da aviação. Tudo para você viajar melhor e mais barato." path="/blog" />

      <div className="bg-white border-b border-gray-200 py-16 md:py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">{t("nav.blog")}</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t("blog.subtitle")}</p>
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
