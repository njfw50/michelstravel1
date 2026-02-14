import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useI18n } from "@/lib/i18n";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  language: string;
  isPublished: boolean | null;
  createdAt: Date | null;
};

export function useBlogPosts() {
  const { language } = useI18n();
  const lang = language || "pt";
  return useQuery({
    queryKey: [api.blog.list.path, "all", lang],
    queryFn: async () => {
      const res = await fetch(api.blog.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch blog posts");
      const allPosts: BlogPost[] = api.blog.list.responses[200].parse(await res.json());

      const groups = new Map<string, BlogPost[]>();
      for (const post of allPosts) {
        const key = post.coverImage || post.slug;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(post);
      }

      const result: BlogPost[] = [];
      const entries = Array.from(groups.values());
      for (const variants of entries) {
        const preferred = variants.find((p: BlogPost) => p.language === lang);
        const fallback = variants.find((p: BlogPost) => p.language === "en") || variants.find((p: BlogPost) => p.language === "pt") || variants[0];
        result.push(preferred || fallback);
      }

      result.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      return result;
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: [api.blog.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.blog.get.path, { slug });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch blog post");
      return api.blog.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}
