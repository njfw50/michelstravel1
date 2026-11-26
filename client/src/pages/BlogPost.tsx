/* ────────────────────────────────────────────────────────────────────
   BlogPost — redesign 2027 (visual revista, mesmo conteúdo).
   - Artigo em papel claro, prosa legível (não invertida), barra de
     progresso coral, CTA navy + dourado.
   - Avatar do autor: o pravatar.cc (serviço de avatar falso) foi
     REMOVIDO — no lugar, o logo oficial 3D da agência. Nada de rosto
     ou avatar inventado representando o autor.
   - "Gostou?" fixo em PT no JSX → chave blog.liked nos locales.
   ──────────────────────────────────────────────────────────────────── */
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
    restDelta: 0.001,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FBF7EF]">
        <Loader2 className="h-12 w-12 animate-spin text-[#3D4EAB]" />
        <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[#6B7594]">
          {t("blog.loading_chronicle") || "Carregando Crônica..."}
        </p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#FBF7EF] px-4 py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[32px] border border-[#101E42]/10 bg-white">
          <BookOpen className="h-10 w-10 text-[#6B7594]" />
        </div>
        <div>
          <h3 className="font-display mb-2 text-3xl font-extrabold tracking-tight text-[#101E42]">{t("blog.post_not_found")}</h3>
          <p className="mx-auto max-w-sm font-medium text-[#3D4A6B]">{t("blog.post_not_found_desc")}</p>
        </div>
        <Link href="/blog">
          <Button
            variant="outline"
            className="h-12 rounded-2xl border-[#101E42]/15 bg-white px-8 font-extrabold uppercase tracking-widest text-[#101E42] hover:bg-[#F5EDDD]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("blog.back_to_guide")}
          </Button>
        </Link>
      </div>
    );
  }

  const readTime = estimateReadTime(post.content);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBF7EF] text-[#3D4A6B] selection:bg-[#FA5F52]/20">
      <SEO
        title={post?.title || "Blog"}
        description={post?.excerpt || "Artigo do blog Michels Travel"}
        path={"/blog/" + (post?.slug || "")}
        type="article"
        image={post?.coverImage || undefined}
      />

      {/* Progress Bar */}
      <motion.div
        className="fixed left-0 right-0 top-0 z-[100] h-1.5 origin-left bg-[#FA5F52] shadow-[0_0_15px_rgba(250,95,82,0.5)]"
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <header className="relative flex h-[60vh] w-full items-end overflow-hidden bg-[#0B1B3A] md:h-[80vh]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#060D24] via-[#060D24]/40 to-transparent" />
          {post.coverImage ? (
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "linear" }}
              src={post.coverImage}
              className="h-full w-full object-cover"
              alt={post.title}
            />
          ) : (
            <div className="h-full w-full bg-[#0B1B3A]" />
          )}
        </div>

        <div className="container relative z-20 mx-auto px-4 pb-16 md:pb-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <Link href="/blog">
              <span className="mb-8 inline-flex cursor-pointer items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white">
                <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /> {t("blog.back_to_guide")}
              </span>
            </Link>

            <div className="mb-6 flex items-center gap-4">
              <Badge className="rounded-full border border-[#E8B65D]/30 bg-[#E8B65D]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#E8B65D] backdrop-blur-md">
                {t("blog.exclusive_article")}
              </Badge>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
                <Clock className="h-3 w-3" /> {t("blog.immersion_time", { count: readTime })}
              </span>
            </div>

            <h1 className="font-display mb-8 text-4xl font-extrabold leading-[0.9] tracking-tight text-white md:text-7xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-3d-2027.png"
                  alt="Michels Travel"
                  className="mt-logo h-10 w-10"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white">Michels Travel</p>
                  <p className="text-[11px] font-bold uppercase tracking-tight text-slate-400">{t("blog.experience_curator")}</p>
                </div>
              </div>
              <span className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Calendar className="h-4 w-4 text-[#E8B65D]" />
                {format(new Date(post.createdAt || new Date()), "dd MMMM, yyyy")}
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col gap-16 lg:flex-row">
          {/* Side Tools */}
          <aside className="order-2 h-fit shrink-0 lg:order-1 lg:sticky lg:top-32 lg:w-16">
            <div className="flex items-center justify-center gap-4 rounded-full border border-[#101E42]/10 bg-white p-2 shadow-sm lg:flex-col">
              <button className="flex h-12 w-12 items-center justify-center rounded-full text-[#6B7594] transition-all hover:bg-[#FBF7EF] hover:text-[#101E42]">
                <Share2 className="h-5 w-5" />
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full text-[#6B7594] transition-all hover:bg-[#FBF7EF] hover:text-[#101E42]">
                <Bookmark className="h-5 w-5" />
              </button>
              <div className="hidden h-px w-8 bg-[#101E42]/10 lg:block" />
              <button className="flex h-12 w-12 items-center justify-center rounded-full text-[#FA5F52]/60 transition-all hover:bg-[#FA5F52]/10 hover:text-[#FA5F52]">
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </aside>

          {/* Article Body */}
          <article className="order-1 max-w-3xl flex-1 lg:order-2">
            <p className="mb-12 border-l-4 border-[#E8B65D] pl-8 text-xl font-medium italic leading-relaxed tracking-tight text-[#101E42] md:text-2xl">
              {post.excerpt}
            </p>

            <div
              className="prose max-w-none prose-lg
                prose-headings:font-display prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-[#101E42]
                prose-p:font-medium prose-p:leading-relaxed prose-p:text-[#3D4A6B]
                prose-strong:font-extrabold prose-strong:text-[#101E42]
                prose-a:text-[#3D4EAB] prose-a:no-underline hover:prose-a:text-[#0B1B3A]
                prose-img:rounded-[32px] prose-img:border prose-img:border-[#101E42]/10
                prose-blockquote:border-[#E8B65D] prose-blockquote:bg-white prose-blockquote:p-6 prose-blockquote:rounded-3xl prose-blockquote:not-italic
                prose-li:text-[#3D4A6B]
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Premium CTA */}
            <div className="mt-24">
              <Card className="group relative overflow-hidden rounded-[40px] border-0 bg-gradient-to-br from-[#0B1B3A] to-[#12244D] p-8 text-center md:p-14">
                <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[#E8B65D]/20 blur-[80px] transition-transform duration-1000 group-hover:scale-150" />

                <div className="relative z-10 mx-auto max-w-xl">
                  <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/10 shadow-2xl backdrop-blur-xl">
                    <Plane className="h-8 w-8 text-[#E8B65D]" />
                  </div>
                  <h2 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                    {t("blog.cta_title")}
                  </h2>
                  <p className="mb-10 text-lg font-medium leading-relaxed text-slate-300">{t("blog.cta_desc")}</p>
                  <Link href="/">
                    <Button className="h-16 rounded-[20px] bg-white px-12 text-lg font-extrabold uppercase tracking-widest text-[#0B1B3A] shadow-2xl shadow-black/20 transition-all hover:scale-105 hover:bg-[#F5EDDD] active:scale-95">
                      <Plane className="mr-3 h-6 w-6" /> {t("blog.cta_button")}
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            <div className="mt-16 flex items-center justify-between border-t border-[#101E42]/10 pt-12">
              <Link href="/blog">
                <Button
                  variant="ghost"
                  className="gap-3 text-xs font-extrabold uppercase tracking-widest text-[#6B7594] hover:text-[#101E42]"
                >
                  <ArrowLeft className="h-4 w-4" /> {t("blog.back_to_guide")}
                </Button>
              </Link>

              <div className="flex items-center gap-4">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#6B7594]">{t("blog.liked")}</span>
                <div className="flex gap-2">
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6B7594] transition-all hover:text-[#101E42]">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* Recommended Footer Hook */}
      <footer className="border-t border-[#101E42]/10 bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h4 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.4em] text-[#E58B48]">{t("blog.next_stop")}</h4>
          <Link href="/blog">
            <h3 className="font-display cursor-pointer text-3xl font-extrabold tracking-tight text-[#101E42] transition-colors hover:text-[#3D4EAB] md:text-5xl">
              {t("blog.more_chronicles")} <ArrowRight className="ml-4 inline-block h-10 w-10 md:h-12 md:w-12" />
            </h3>
          </Link>
        </div>
      </footer>
    </div>
  );
}
