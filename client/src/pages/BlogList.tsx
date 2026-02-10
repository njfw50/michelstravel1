import { useBlogPosts } from "@/hooks/use-blog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowRight } from "lucide-react";

export default function BlogList() {
  const { data: posts, isLoading } = useBlogPosts();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Travel Guide</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">Tips, guides, and inspiration for your next adventure.</p>
      </div>

      <div className="container mx-auto px-4 -mt-10 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts?.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group">
                  <div className="h-48 overflow-hidden bg-slate-200">
                    {post.coverImage && (
                      <img 
                        src={post.coverImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    )}
                  </div>
                  <CardHeader>
                    <div className="text-xs text-primary font-bold uppercase tracking-wider mb-2">
                      {format(new Date(post.createdAt || new Date()), "MMMM d, yyyy")}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 line-clamp-3 mb-4">{post.excerpt}</p>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read Article <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
