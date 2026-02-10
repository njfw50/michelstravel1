import { useRoute } from "wouter";
import { useBlogPost } from "@/hooks/use-blog";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function BlogPost() {
  const [match, params] = useRoute("/blog/:slug");
  const { data: post, isLoading } = useBlogPost(params?.slug || "");

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!post) return <div className="text-center py-20">Post not found</div>;

  return (
    <div className="min-h-screen bg-white">
      {post.coverImage && (
        <div className="h-[400px] w-full relative">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 container mx-auto">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">{post.title}</h1>
              <div className="flex items-center text-white/80 gap-4">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-lg prose-slate prose-headings:font-display prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80">
          <p className="lead text-xl text-slate-600 mb-8">{post.excerpt}</p>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        <div className="max-w-3xl mx-auto mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
            <Button variant="outline" onClick={() => window.history.back()}>Back to Guide</Button>
        </div>
      </div>
    </div>
  );
}
