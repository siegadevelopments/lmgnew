import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --- Products ---

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, vendor_profiles(store_name)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["products", "bySlug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, vendor:vendor_profiles(*)")
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1);
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

// --- Categories ---

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("type", "product");
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

// ... (other options)

export const featuredProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, vendor_profiles(store_name)")
        .eq("status", "published")
        .limit(4)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const recipesQueryOptions = () =>
  queryOptions({
    queryKey: ["recipes", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const recipeBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["recipes", "bySlug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("slug", slug)
        .limit(1);
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const articlesQueryOptions = (category?: string) =>
  queryOptions({
    queryKey: ["articles", "list", category || "all"],
    queryFn: async () => {
      let query = supabase.from("articles").select("*");
      if (category) {
        query = query.eq("category_name", category);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const articleBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["articles", "bySlug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .limit(1);
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const videosQueryOptions = () =>
  queryOptions({
    queryKey: ["videos", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const brandsQueryOptions = () =>
  queryOptions({
    queryKey: ["brands"],
    queryFn: async () => {
      // Vendors are now queried from vendor_profiles!
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("id, store_name, store_description, store_logo_url, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const randomMemeQueryOptions = () =>
  queryOptions({
    queryKey: ["galleries", "random-meme"],
    queryFn: async () => {
      // 1. Get the 'memes' gallery ID
      const { data: gallery } = await (supabase
        .from("galleries")
        .select("id")
        .eq("category", "memes")
        .limit(1)
        .single() as any);

      if (!gallery) return null;

      // 2. Get a random item from that gallery
      const { data: items } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("gallery_id", gallery.id);

      if (!items || items.length === 0) return null;
      
      return (items[Math.floor(Math.random() * items.length)]) as any;
    },
  });
