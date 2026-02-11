import { useBlogPosts } from "@/hooks/use-blog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowRight, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function BlogList() {
  const { data: posts, isLoading } = useBlogPosts();
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 drop-shadow-lg">{t("nav.blog")}</h1>
        <p className="text-white/50 text-lg max-w-2xl mx-auto">{t("blog.subtitle")}</p>
      </div>

      <div className="container mx-auto px-4 -mt-10 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-amber-400" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full border border-white/10 shadow-lg transition-all cursor-pointer overflow-hidden group bg-white/5 backdrop-blur-md rounded-2xl hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]" data-testid={`blog-card-${post.slug}`}>
                  <div className="h-48 overflow-hidden bg-white/5">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {!post.coverImage && (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white/20" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="gap-2">
                    <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}
                    </div>
                    <CardTitle className="text-white group-hover:text-amber-300 transition-colors">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/45 line-clamp-3 mb-4">{post.excerpt}</p>
                    <span className="text-sm font-bold text-amber-300 flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t("blog.read_article")} <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-white/10">
            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
              <BookOpen className="h-8 w-8 text-white/30" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t("blog.no_posts")}</h3>
            <p className="text-white/50">{t("blog.no_posts_desc")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
