import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --- Products ---

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "list", "v3"],
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          vendor_profiles (store_name, store_logo_url, is_approved, is_live)
        `)
        .eq("status", "published");
        
      if (error) throw new Error(error.message);
      
      // Filter for approved and live vendors manually for maximum compatibility
      const filtered = (data || []).filter((p: any) => p.vendor_profiles?.is_approved && p.vendor_profiles?.is_live);
      
      // Shuffle the results for the "randomized" shop feel
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      
      return shuffled;
    },
  });

export const productBySlugQueryOptionsV2 = (slug: string) =>
  queryOptions({
    queryKey: ["products", "bySlug", "v3", slug],
    staleTime: 5 * 1000, // Only cache for 5 seconds to ensure freshness on navigation
    gcTime: 60 * 1000, // Keep in memory for 1 minute
    queryFn: async () => {
      console.log("Fetching product by slug (cache-busting enabled):", slug);
      
      // Use a timestamp to bypass potential middleware/CDN caching if this was a recurring issue
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          vendor_profiles (
            id,
            store_name,
            store_logo_url,
            is_approved,
            is_live
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .limit(1);

      if (error) {
        console.error("Supabase error fetching product:", error);
        throw new Error(error.message);
      }
      
      if (!data || data.length === 0) {
        console.warn("No product found for slug:", slug);
        return [];
      }
      
      // Filter for approved and live vendors
      const filtered = data.filter((p: any) => p.vendor_profiles?.is_approved && p.vendor_profiles?.is_live);
      
      if (filtered.length === 0) {
        console.warn("Product found but vendor not approved/live or profile missing for slug:", slug);
      }
      
      return filtered;
    },
  });

// --- Categories ---

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories", "v3"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("type", "product");
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

// ... (other options)

export const featuredProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "featured", "v3"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          vendor_profiles!inner(store_name, store_logo_url, is_approved, is_live)
        `)
        .eq("status", "published")
        .eq("vendor_profiles.is_approved", true)
        .eq("vendor_profiles.is_live", true)
        .limit(4)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const recipesQueryOptions = () =>
  queryOptions({
    queryKey: ["recipes", "list", "v3"],
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
    queryKey: ["recipes", "bySlug", "v3", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").eq("slug", slug).limit(1);
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const articlesQueryOptions = (category?: string) =>
  queryOptions({
    queryKey: ["articles", "list", "v3", category || "all"],
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
    queryKey: ["articles", "bySlug", "v3", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*, vendor_profiles(representative_name, store_name)")
        .eq("slug", slug)
        .limit(1);
      if (error) throw new Error(error.message);
      return (data || []) as any[];
    },
  });

export const videosQueryOptions = () =>
  queryOptions({
    queryKey: ["videos", "list", "v3"],
    queryFn: async () => {
      try {
        // We show videos where the author is an admin OR the video is explicitly featured
        const { data, error } = await supabase
          .from("videos")
          .select(
            `
            *,
            profiles(role)
          `,
          )
          .eq("status", "ready")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Video fetch error:", error);
          throw error;
        }

        // Filter in JS to avoid complex cross-table OR logic issues in PostgREST
        const filtered = (data || []).filter(
          (v: any) => v.is_featured === true || v.profiles?.role === "admin",
        );

        return filtered as any[];
      } catch (err) {
        console.error("Video query error:", err);
        return [];
      }
    },
  });

export const brandsQueryOptions = () =>
  queryOptions({
    queryKey: ["brands", "v3"],
    queryFn: async () => {
      // Vendors are now queried from vendor_profiles!
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("id, store_name, store_description, store_logo_url, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(100);
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

      return items[Math.floor(Math.random() * items.length)] as any;
    },
  });
