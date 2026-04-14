import { useRoute } from "wouter";
import { useBlogPost } from "@/hooks/use-blog";
import { Loader2, Calendar, ArrowLeft, BookOpen, Plane, Clock, Share2, Bookmark, Heart, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { motion, useScroll, useSpring } from "framer-motion";
import { Badge } from "@/components/ui/badge";

function estimateReadTime(content: string | null | undefined): number {
  if (!content) return 3;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

export default function BlogPost() {
  const [match, params] = useRoute("/blog/:slug");
  const { data: post, isLoading } = useBlogPost(params?.slug || "");
  const { t } = useI18n();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#020617] gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">{t("blog.loading_chronicle") || "Carregando Crônica..."}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-[#020617] gap-6 text-center px-4">
        <div className="h-20 w-20 bg-white/5 rounded-[32px] flex items-center justify-center mb-4 border border-white/10">
          <BookOpen className="h-10 w-10 text-slate-500" />
        </div>
        <div>
           <h3 className="text-3xl font-black font-display text-white mb-2 tracking-tighter">{t("blog.post_not_found")}</h3>
           <p className="text-slate-400 max-w-sm mx-auto font-medium">{t("blog.post_not_found_desc")}</p>
        </div>
        <Link href="/blog">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-2xl h-12 px-8 font-black uppercase tracking-widest">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("blog.back_to_guide")}
          </Button>
        </Link>
      </div>
    );
  }

  const readTime = estimateReadTime(post.content);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 selection:bg-indigo-500/30 overflow-x-hidden">
      <SEO
        title={post?.title || "Blog"}
        description={post?.excerpt || "Artigo do blog Michels Travel"}
        path={"/blog/" + (post?.slug || "")}
        type="article"
        image={post?.coverImage || undefined}
      />

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-indigo-600 origin-left z-[100] shadow-[0_0_15px_rgba(79,70,229,0.5)]"
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <header className="relative w-full h-[60vh] md:h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent z-10" />
          {post.coverImage ? (
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "linear" }}
              src={post.coverImage} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-slate-900" />
          )}
        </div>

        <div className="container relative z-20 mx-auto px-4 pb-16 md:pb-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <Link href="/blog">
              <span className="inline-flex items-center gap-2 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8 cursor-pointer transition-colors group">
                <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> {t("blog.back_to_guide")}
              </span>
            </Link>
            
            <div className="flex items-center gap-4 mb-6">
               <Badge className="bg-indigo-600/20 text-indigo-400 border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  {t("blog.exclusive_article")}
               </Badge>
               <span className="h-1 w-1 rounded-full bg-white/20" />
               <span className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-3 w-3" /> {t("blog.immersion_time", { count: readTime })}
               </span>
            </div>

            <h1 className="text-4xl md:text-7xl font-black font-display text-white mb-8 tracking-tighter leading-[0.9]">
               {post.title}
            </h1>

            <div className="flex items-center gap-6 flex-wrap">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border border-white/10 p-0.5">
                     <img src="https://i.pravatar.cc/100?u=michel" className="w-full h-full rounded-full" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">Michels Travel</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">{t("blog.experience_curator")}</p>
                  </div>
               </div>
               <span className="h-8 w-px bg-white/10" />
               <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  {format(new Date(post.createdAt || new Date()), "dd MMMM, yyyy")}
               </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Side Tools */}
          <aside className="lg:w-16 shrink-0 lg:sticky lg:top-32 h-fit order-2 lg:order-1">
             <div className="flex lg:flex-col gap-4 items-center justify-center p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
                <button className="h-12 w-12 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                   <Share2 className="h-5 w-5" />
                </button>
                <button className="h-12 w-12 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                   <Bookmark className="h-5 w-5" />
                </button>
                <div className="h-px w-8 bg-white/10 hidden lg:block" />
                <button className="h-12 w-12 rounded-full flex items-center justify-center text-rose-500/60 hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                   <Heart className="h-5 w-5" />
                </button>
             </div>
          </aside>

          {/* Article Body */}
          <article className="max-w-3xl flex-1 order-1 lg:order-2">
            <p className="text-xl md:text-2xl text-white font-medium mb-12 leading-relaxed tracking-tight italic border-l-4 border-indigo-600 pl-8">
               {post.excerpt}
            </p>
            
            <div
              className="prose prose-invert prose-lg max-w-none 
                prose-headings:font-display prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-white
                prose-p:text-slate-400 prose-p:leading-relaxed prose-p:font-medium
                prose-strong:text-white prose-strong:font-black
                prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300 transition-colors
                prose-img:rounded-[32px] prose-img:border prose-img:border-white/10
                prose-blockquote:border-indigo-600 prose-blockquote:bg-white/5 prose-blockquote:p-6 prose-blockquote:rounded-3xl prose-blockquote:not-italic
                prose-li:text-slate-400
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Premium CTA */}
            <div className="mt-24">
              <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-900 border-0 rounded-[40px] p-8 md:p-14 text-center group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="relative z-10 max-w-xl mx-auto">
                   <div className="h-16 w-16 bg-white/20 backdrop-blur-xl rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                      <Plane className="h-8 w-8 text-white" />
                   </div>
                   <h2 className="text-3xl md:text-4xl font-black font-display text-white mb-4 tracking-tighter">
                      {t("blog.cta_title")}
                   </h2>
                   <p className="text-indigo-100/70 text-lg font-medium mb-10 leading-relaxed">
                      {t("blog.cta_desc")}
                   </p>
                   <Link href="/">
                     <Button className="bg-white text-indigo-900 hover:bg-slate-100 rounded-[20px] h-16 px-12 font-black uppercase tracking-widest text-lg shadow-2xl shadow-black/20 transition-all hover:scale-105 active:scale-95">
                        <Plane className="mr-3 h-6 w-6" /> {t("blog.cta_button")}
                     </Button>
                   </Link>
                </div>
              </Card>
            </div>

            <div className="mt-16 flex items-center justify-between border-t border-white/5 pt-12">
               <Link href="/blog">
                 <Button variant="ghost" className="text-slate-500 hover:text-white font-black uppercase tracking-widest text-xs gap-3">
                   <ArrowLeft className="h-4 w-4" /> {t("blog.back_to_guide")}
                 </Button>
               </Link>
               
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Gostou?</span>
                  <div className="flex gap-2">
                     <button className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <Share2 className="h-4 w-4" />
                     </button>
                  </div>
               </div>
            </div>
          </article>
        </div>
      </main>

      {/* Recommended Footer Hook */}
      <footer className="bg-slate-900/40 border-t border-white/5 py-20">
         <div className="container mx-auto px-4 text-center">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">{t("blog.next_stop")}</h4>
            <Link href="/blog">
               <h3 className="text-3xl md:text-5xl font-black font-display text-white hover:text-indigo-400 transition-colors cursor-pointer tracking-tighter">
                  {t("blog.more_chronicles")} <ArrowRight className="inline-block ml-4 h-10 w-10 md:h-12 md:w-12" />
               </h3>
            </Link>
         </div>
      </footer>
    </div>
  );
}
