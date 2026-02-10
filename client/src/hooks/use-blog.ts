import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertBlogPost } from "@shared/routes";

export function useBlogPosts() {
  return useQuery({
    queryKey: [api.blog.list.path],
    queryFn: async () => {
      const res = await fetch(api.blog.list.path);
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
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch blog post");
      return api.blog.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBlogPost) => {
      const res = await fetch(api.blog.create.path, {
        method: api.blog.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create post");
      return api.blog.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.blog.list.path] });
    },
  });
}
