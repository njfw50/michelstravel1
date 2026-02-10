import { Layout } from "@/components/Layout";
import { useBlogPost } from "@/hooks/use-blog";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar } from "lucide-react";

export default function BlogPost() {
  const [_, params] = useRoute("/blog/:slug");
  const { data: post, isLoading } = useBlogPost(params?.slug || "");

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <Skeleton className="h-8 w-24 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-12" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Post not found</h1>
          <Link href="/blog" className="text-primary hover:underline">Return to Blog</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="min-h-screen pb-20">
        {/* Header Image */}
        <div className="h-[40vh] w-full bg-slate-900 relative overflow-hidden">
          {post.coverImage && (
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="container mx-auto max-w-4xl">
              <Link href="/blog" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Guides
              </Link>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
                {post.title}
              </h1>
              {post.createdAt && (
                <div className="flex items-center text-slate-300 text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 max-w-4xl -mt-10 relative z-10">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-slate-100">
            <div 
              className="prose prose-lg prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>
        </div>
      </article>
    </Layout>
  );
}
