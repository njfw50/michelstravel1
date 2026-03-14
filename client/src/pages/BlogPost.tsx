import { useRoute } from "wouter";
import { useBlogPost } from "@/hooks/use-blog";
import { Loader2, Calendar, ArrowLeft, BookOpen, Plane, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";

function estimateReadTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

export default function BlogPost() {
  const [match, params] = useRoute("/blog/:slug");
  const { data: post, isLoading } = useBlogPost(params?.slug || "");
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center gap-2 py-20">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh] gap-2">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{t("blog.post_not_found")}</h3>
        <p className="text-gray-500 mb-6">{t("blog.post_not_found_desc")}</p>
        <Link href="/blog">
          <Button variant="outline" data-testid="button-back-blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("blog.back_to_guide")}
          </Button>
        </Link>
      </div>
    );
  }

  const readTime = estimateReadTime(post.content);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={post?.title || "Blog"}
        description={post?.excerpt || "Artigo do blog Michels Travel"}
        path={"/blog/" + (post?.slug || "")}
        type="article"
        image={post?.coverImage || undefined}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post?.title,
          "description": post?.excerpt,
          "image": post?.coverImage || "https://www.michelstravel.agency/images/og-share-card.png",
          "author": { "@type": "Organization", "name": "Michels Travel" },
          "publisher": {
            "@type": "Organization",
            "name": "Michels Travel",
            "logo": { "@type": "ImageObject", "url": "https://www.michelstravel.agency/favicon.png" },
          },
          "datePublished": post?.createdAt,
          "mainEntityOfPage": `https://www.michelstravel.agency/blog/${post?.slug}`,
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.michelstravel.agency/" },
              { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.michelstravel.agency/blog" },
              { "@type": "ListItem", "position": 3, "name": post?.title, "item": `https://www.michelstravel.agency/blog/${post?.slug}` },
            ],
          },
        }}
      />

      {post.coverImage ? (
        <div className="h-[300px] md:h-[450px] w-full relative overflow-hidden">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 container mx-auto">
            <div className="max-w-3xl">
              <Link href="/blog">
                <span className="inline-flex items-center gap-1.5 text-white/80 text-sm mb-4 cursor-pointer" data-testid="link-back-from-post">
                  <ArrowLeft className="h-3.5 w-3.5" /> {t("blog.back_to_guide")}
                </span>
              </Link>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 leading-tight" data-testid="text-blog-title">{post.title}</h1>
              <div className="flex items-center text-white/70 gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-4 w-4" />
                  {readTime} min
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-blue-50 to-white border-b border-gray-100 py-12 md:py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <Link href="/blog">
              <span className="inline-flex items-center gap-1.5 text-blue-600 text-sm mb-4 cursor-pointer" data-testid="link-back-from-post">
                <ArrowLeft className="h-3.5 w-3.5" /> {t("blog.back_to_guide")}
              </span>
            </Link>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-4 leading-tight" data-testid="text-blog-title">{post.title}</h1>
            <div className="flex items-center text-gray-500 gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                {readTime} min
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed font-medium border-l-4 border-blue-500 pl-5">{post.excerpt}</p>
          <div
            className="prose prose-lg prose-headings:font-display prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-gray-900 prose-blockquote:text-gray-500 prose-blockquote:border-blue-400 prose-li:text-gray-600 prose-ul:space-y-1 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        <div className="max-w-3xl mx-auto mt-14">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 md:p-10 text-center">
            <Plane className="h-10 w-10 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">{t("blog.cta_title")}</h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">{t("blog.cta_desc")}</p>
            <Link href="/">
              <Button className="bg-blue-600 text-white" data-testid="button-blog-search-flights">
                <Plane className="mr-2 h-4 w-4" /> {t("blog.cta_button")}
              </Button>
            </Link>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto mt-8 pt-8 border-t border-gray-200 flex flex-wrap items-center gap-4">
          <Link href="/blog">
            <Button variant="outline" data-testid="button-back-blog">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("blog.back_to_guide")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
