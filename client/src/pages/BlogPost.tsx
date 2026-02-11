import { useRoute } from "wouter";
import { useBlogPost } from "@/hooks/use-blog";
import { Loader2, Calendar, ArrowLeft, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";

export default function BlogPost() {
  const [match, params] = useRoute("/blog/:slug");
  const { data: post, isLoading } = useBlogPost(params?.slug || "");
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{t("blog.post_not_found")}</h3>
        <p className="text-gray-500 mb-6">{t("blog.post_not_found_desc")}</p>
        <Link href="/blog">
          <Button variant="outline" className="border-gray-200 text-gray-700" data-testid="button-back-blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("blog.back_to_guide")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {post.coverImage && (
        <div className="h-[400px] w-full relative overflow-hidden">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-black/20" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 container mx-auto">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4" data-testid="text-blog-title">{post.title}</h1>
              <div className="flex items-center text-gray-600 gap-4">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!post.coverImage && (
        <div className="bg-gray-50 border-b border-gray-200 py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4" data-testid="text-blog-title">{post.title}</h1>
            <div className="flex items-center text-gray-600 gap-4">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-xl text-gray-500 mb-8 leading-relaxed font-medium">{post.excerpt}</p>
          <div
            className="prose prose-lg prose-headings:font-display prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-strong:text-gray-900 prose-blockquote:text-gray-500 prose-blockquote:border-blue-400 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        <div className="max-w-3xl mx-auto mt-16 pt-8 border-t border-gray-200 flex justify-between items-center">
          <Link href="/blog">
            <Button variant="outline" className="border-gray-200 text-gray-700" data-testid="button-back-blog">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("blog.back_to_guide")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
