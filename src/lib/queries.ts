import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const wellnessImages = [
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1598971639058-fab354c6812c?auto=format&fit=crop&w=400&q=80"
];

export const globalMockProductsList = [
  { title: "Organic Maca Root Powder", category: "Menopause Support", price: 24.99, keywords: ["menopause", "hormone", "women"] },
  { title: "Menopause Relief Complex", category: "Menopause Support", price: 45.00, keywords: ["menopause", "hot flash"] },
  { title: "NMN Longevity Formula", category: "Healthy Ageing", price: 89.99, keywords: ["ageing", "longevity", "aging"] },
  { title: "Marine Collagen Peptides", category: "Healthy Ageing", price: 55.00, keywords: ["ageing", "collagen", "joint"] },
  { title: "Daily Probiotic 50 Billion CFU", category: "Gut Health", price: 34.99, keywords: ["gut", "probiotic", "microbiome"] },
  { title: "Prebiotic Fibre Blend", category: "Gut Health", price: 28.50, keywords: ["gut", "prebiotic", "fibre", "fiber"] },
  { title: "Magnesium Glycinate Sleep Support", category: "Sleep & Recovery", price: 22.99, keywords: ["sleep", "magnesium", "rest", "recovery"] },
  { title: "Deep Sleep Herbal Tea", category: "Sleep & Recovery", price: 18.50, keywords: ["sleep", "insomnia", "relaxation"] },
  { title: "Ashwagandha Stress Relief", category: "Stress Management", price: 29.99, keywords: ["stress", "anxiety", "adaptogen", "ashwagandha"] },
  { title: "L-Theanine Calm Mind", category: "Stress Management", price: 26.50, keywords: ["stress", "calm", "relaxation"] },
  { title: "Metabolism Booster Complex", category: "Weight Management", price: 39.99, keywords: ["weight", "metabolism", "diet"] },
  { title: "Plant-Based Meal Replacement", category: "Weight Management", price: 49.99, keywords: ["weight", "meal replacement", "protein"] },
  { title: "Omega-3 Fish Oil EPA/DHA", category: "Heart Health", price: 32.99, keywords: ["heart", "cardiovascular", "omega"] },
  { title: "CoQ10 Heart Support 200mg", category: "Heart Health", price: 42.50, keywords: ["heart", "coq10", "cardiovascular"] },
  { title: "Lion's Mane Mushroom Extract", category: "Brain Health", price: 35.00, keywords: ["brain", "cognitive", "focus", "memory"] },
  { title: "Nootropic Focus Blend", category: "Brain Health", price: 45.99, keywords: ["brain", "nootropic", "concentration", "mental"] },
  { title: "Women's Daily Multivitamin", category: "Women's Wellness", price: 28.99, keywords: ["women", "female", "iron"] },
  { title: "Prenatal Nutrient Support", category: "Women's Wellness", price: 38.50, keywords: ["women", "prenatal", "postnatal"] },
].map((m, i) => ({
  id: `mock-global-${i}`,
  title: m.title,
  price: m.price,
  slug: m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
  category: m.category,
  image_url: wellnessImages[i % wellnessImages.length],
  product_type: "product",
  vendor_profiles: {
    store_name: "LMG Wellness",
    store_logo_url: null,
    is_approved: true,
    is_live: true
  },
  excerpt: "A high-quality, evidence-based wellness product perfect for your lifestyle."
}));
// --- Products ---

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "list", "v4"],
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            vendor_id,
            title,
            slug,
            excerpt,
            price,
            image_url,
            stock,
            status,
            created_at,
            category,
            product_type,
            variants,
            vendor_profiles (store_name, store_logo_url, is_approved, is_live)
          `)
          .eq("status", "published");
          
        if (error) throw error;
        
        // Filter for approved vendors (allow products if vendor is approved, fallback gracefully if is_live is not set)
        const filtered = (data || []).filter(
          (p: any) => !p.vendor_profiles || (p.vendor_profiles.is_approved !== false && p.vendor_profiles.is_live !== false)
        );
        
        if (filtered.length === 0) {
          // Use global mock products if database is empty
          return [...globalMockProductsList].sort(() => Math.random() - 0.5);
        }
        
        // Shuffle the results for the "randomized" feel
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        
        return shuffled;
      } catch (err: any) {
        console.error("Error fetching products:", err?.message || err);
        return [...globalMockProductsList].sort(() => Math.random() - 0.5);
      }
    },
  });


export const productBySlugQueryOptionsV2 = (slug: string) =>
  queryOptions({
    queryKey: ["products", "bySlug", "v3", slug],
    staleTime: 5 * 1000, // Only cache for 5 seconds to ensure freshness on navigation
    gcTime: 60 * 1000, // Keep in memory for 1 minute
    queryFn: async () => {
      try {
        console.log("Fetching product by slug (cache-busting enabled):", slug);
        
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            vendor_profiles (
              id,
              store_name,
              store_logo_url,
              store_slug,
              is_approved,
              is_live
            )
          `)
          .eq("slug", slug)
          .eq("status", "published")
          .limit(1);

        if (error) throw error;
        
        if (!data || data.length === 0) {
          console.warn("No product found for slug:", slug);
          return [];
        }
        
        // Allow product if vendor profile is approved (is_approved !== false and is_live !== false)
        const filtered = data.filter(
          (p: any) => !p.vendor_profiles || (p.vendor_profiles.is_approved !== false && p.vendor_profiles.is_live !== false)
        );
        
        if (filtered.length === 0) {
          console.warn("Product found but vendor not approved or profile missing for slug:", slug);
          // Return raw data if product is published so direct product URLs always load
          return data;
        }
        
        return filtered;
      } catch (err: any) {
        console.error("Error fetching product by slug:", err?.message || err);
        return [];
      }
    },
  });

// --- Categories ---

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories", "v3"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("categories").select("*").eq("type", "product");
        if (error) throw error;
        return (data || []) as any[];
      } catch (err: any) {
        console.error("Error fetching categories:", err?.message || err);
        return [];
      }
    },
  });

export const featuredProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "featured", "v3"],
    queryFn: async () => {
      try {
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
        if (error) throw error;
        return (data || []) as any[];
      } catch (err: any) {
        console.error("Error fetching featured products:", err?.message || err);
        return [];
      }
    },
  });

export const recipesQueryOptions = () =>
  queryOptions({
    queryKey: ["recipes", "list", "v3"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("id, title, slug, image_url, prep_time, cook_time, excerpt, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as any[];
      } catch (err: any) {
        console.error("Error fetching recipes:", err?.message || err);
        return [];
      }
    },
  });

export const recipeBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["recipes", "bySlug", "v4", slug],
    queryFn: async () => {
      try {
        const decodedSlug = decodeURIComponent(slug);
        
        // 1. Try exact match with decoded slug first
        const { data: exactMatch } = await supabase
          .from("recipes")
          .select("*")
          .eq("slug", decodedSlug)
          .maybeSingle();

        if (exactMatch) return [exactMatch];

        // 2. Try exact match with original slug (in case database has encoded chars)
        const { data: origMatch } = await supabase
          .from("recipes")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (origMatch) return [origMatch];

        // 3. Fallback 1: match by replacing dash variants and HTML entity codes
        const sanitizedSlug = decodedSlug
          .replace(/&#8211;/g, "%")
          .replace(/[—–-]/g, "%");
          
        const { data: fallbackMatch } = await supabase
          .from("recipes")
          .select("*")
          .ilike("slug", sanitizedSlug)
          .limit(1);

        if (fallbackMatch && fallbackMatch.length > 0) return fallbackMatch;

        // 4. Fallback 2: Robust match ignoring punctuation differences and trailing characters
        const cleanString = (str: string) => 
          str.toLowerCase()
            .replace(/&#8211;/g, "")
            .replace(/&amp;/g, "")
            .replace(/[^a-z0-9]/g, "");
            
        const cleanRequested = cleanString(decodedSlug);
        
        const firstWord = decodedSlug.split(/[^a-zA-Z0-9]/)[0] || "";
        const searchPattern = firstWord.length >= 3 ? `${firstWord}%` : `${decodedSlug.substring(0, 10).replace(/[^a-zA-Z0-9]/g, "%")}%`;
        
        const { data: candidates, error } = await supabase
          .from("recipes")
          .select("*")
          .ilike("slug", searchPattern)
          .limit(30);

        if (error) throw error;

        const match = candidates?.find((c: any) => cleanString(c.slug) === cleanRequested);
        if (match) return [match];

        return [];
      } catch (err: any) {
        console.error("Error fetching recipe by slug:", err?.message || err);
        return [];
      }
    },
  });

export const articlesQueryOptions = (category?: string) =>
  queryOptions({
    queryKey: ["articles", "list", "v3", category || "all"],
    queryFn: async () => {
      try {
        let query = supabase.from("articles").select("id, title, slug, image_url, excerpt, created_at, category_name");
        if (category) {
          query = query.eq("category_name", category);
        }
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as any[];
      } catch (err: any) {
        console.error("Error fetching articles:", err?.message || err);
        return [];
      }
    },
  });

export const articleBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["articles", "bySlug", "v4", slug],
    queryFn: async () => {
      try {
        const decodedSlug = decodeURIComponent(slug);
        
        // Try exact match first
        const { data: exactMatch } = await supabase
          .from("articles")
          .select("*, vendor_profiles(representative_name, store_name)")
          .eq("slug", decodedSlug)
          .maybeSingle();

        if (exactMatch) return [exactMatch];

        // Fallback 1: search for slugs that look similar (handling em-dash and other variants)
        const sanitizedSlug = decodedSlug.replace(/[—–-]/g, '%');
        const { data: fallbackMatch } = await supabase
          .from("articles")
          .select("*, vendor_profiles(representative_name, store_name)")
          .ilike("slug", sanitizedSlug)
          .limit(1);

        if (fallbackMatch && fallbackMatch.length > 0) return fallbackMatch;

        // Fallback 2: Robust match ignoring punctuation differences and trailing characters
        const cleanString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanRequested = cleanString(decodedSlug);
        
        const firstWord = decodedSlug.split(/[^a-zA-Z0-9]/)[0] || "";
        const searchPattern = firstWord.length >= 3 ? `${firstWord}%` : `${decodedSlug.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '%')}%`;
        
        const { data: candidates, error } = await supabase
          .from("articles")
          .select("*, vendor_profiles(representative_name, store_name)")
          .ilike("slug", searchPattern)
          .limit(30);

        if (error) throw error;

        const match = candidates?.find((c: any) => cleanString(c.slug) === cleanRequested);
        if (match) return [match];
        
        return [];
      } catch (err: any) {
        console.error("Error fetching article by slug:", err?.message || err);
        return [];
      }
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
          .in("status", ["ready", "uploading"])
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Filter in JS to avoid complex cross-table OR logic issues in PostgREST
        const filtered = (data || []).filter(
          (v: any) => v.is_featured === true || v.profiles?.role === "admin",
        );

        return filtered as any[];
      } catch (err: any) {
        console.error("Video query error:", err?.message || err);
        return [];
      }
    },
  });

export const brandsQueryOptions = () =>
  queryOptions({
    queryKey: ["brands", "v3"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("vendor_profiles")
          .select("id, store_name, store_description, store_logo_url, store_slug, created_at")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return (data || []) as any[];
      } catch (err: any) {
        console.error("Error fetching brands:", err?.message || err);
        return [];
      }
    },
  });

export const randomMemeQueryOptions = () => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  return queryOptions({
    queryKey: ["galleries", "random-meme", todayStr],
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    queryFn: async () => {
      try {
        // 1. Get all 'memes' gallery IDs
        const { data: galleries } = await (supabase
          .from("galleries")
          .select("id")
          .eq("category", "memes") as any);

        if (!galleries || galleries.length === 0) return null;
        const galleryIds = galleries.map((g: any) => g.id);

        // 2. Get all items from those galleries
        const { data: items } = await supabase
          .from("gallery_items")
          .select("*")
          .in("gallery_id", galleryIds);

        if (!items || items.length === 0) return null;

        // 3. Deterministically pick an item based on the date
        const dateNum = parseInt(todayStr.replace(/-/g, ''));
        const seededRandom = (s: number) => {
          const x = Math.sin(s) * 10000;
          return x - Math.floor(x);
        };
        
        const index = Math.floor(seededRandom(dateNum) * items.length);
        return items[index] as any;
      } catch (err: any) {
        console.error("Error fetching random meme:", err?.message || err);
        return null;
      }
    },
  });
};
