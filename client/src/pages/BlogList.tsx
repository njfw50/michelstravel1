import { Layout } from "@/components/Layout";
import { useBlogPosts } from "@/hooks/use-blog";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogList() {
  const { data: posts, isLoading } = useBlogPosts();

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl font-bold mb-4 font-display">Travel Guide & Tips</h1>
            <p className="text-lg text-slate-500">
              Discover hidden gems, expert travel advice, and inspiration for your next journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : posts?.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No blog posts found. Check back later!
              </div>
            ) : (
              posts?.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-none shadow-sm overflow-hidden">
                    <div className="h-48 bg-slate-200 overflow-hidden relative">
                      {post.coverImage ? (
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-300">
                          No Image
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="group-hover:text-primary transition-colors">{post.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-slate-400 font-medium">
                        Read More →
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
