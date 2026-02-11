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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">{t("nav.blog")}</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t("blog.subtitle")}</p>
      </div>

      <div className="container mx-auto px-4 py-12 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full border border-gray-200 shadow-sm transition-all cursor-pointer overflow-hidden group bg-white rounded-2xl hover:shadow-lg hover:border-blue-200" data-testid={`blog-card-${post.slug}`}>
                  <div className="h-48 overflow-hidden bg-gray-100">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {!post.coverImage && (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="gap-2">
                    <div className="text-xs text-blue-500 font-bold uppercase tracking-wider">
                      {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}
                    </div>
                    <CardTitle className="text-gray-900 group-hover:text-blue-600 transition-colors">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 line-clamp-3 mb-4">{post.excerpt}</p>
                    <span className="text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t("blog.read_article")} <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
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
