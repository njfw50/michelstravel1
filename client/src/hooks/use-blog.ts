import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useBlogPosts() {
  return useQuery({
    queryKey: [api.blog.list.path],
    queryFn: async () => {
      const res = await fetch(api.blog.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch blog posts");
      return api.blog.list.responses[200].parse(await res.json());
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
