'use client'

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export function BestSellersSection() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "best-sellers", "v1"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      // Fetch published products from approved vendors, ordered by most recently created
      // In production, this should be ordered by sales count or a "best_seller" flag
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          vendor_profiles!inner(store_name, store_logo_url, is_approved, is_live)
        `)
        .eq("status", "published")
        .eq("vendor_profiles.is_approved", true)
        .eq("vendor_profiles.is_live", true)
        .eq("product_type", "product")
        .limit(50);

      if (error) throw error;
      
      let allProducts = (data || []) as any[];
      
      // Fallback dummy products if the database is empty
      if (allProducts.length === 0) {
        allProducts = Array.from({ length: 8 }).map((_, i) => ({
          id: `dummy-${i}`,
          title: `Lifestyle Premium Product ${i + 1}`,
          price: Math.floor(Math.random() * 100) + 19.99,
          slug: `dummy-product-${i}`,
          category: ["Wellness", "Nutrition", "Fitness", "Mindfulness"][Math.floor(Math.random() * 4)],
          image_url: `https://images.unsplash.com/photo-${[
            "1512621776951-a57141f2eefd", 
            "1541795795328-f073b763494e", 
            "1546069901-ba9599a7e63c", 
            "1517093157656-b9ec691cc72e",
            "1498837167922-ddd27525d352",
            "1553530979-7ee52a2670c4",
            "1547592180-85f173990554",
            "1622483767028-3f66f32aef97"
          ][i % 8]}?auto=format&fit=crop&w=400&q=80`,
          product_type: "product",
          vendor_profiles: {
            store_name: "LMG Wellness",
            store_logo_url: null,
          }
        }));
      }

      // Shuffle array using Fisher-Yates with true randomness
      for (let i = allProducts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
      }

      return allProducts.slice(0, 8);
    },
  });

  return (
    <section className="bg-background py-16 sm:py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Best Sellers
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Most popular products loved by our community
              </p>
            </div>
          </div>
          <Link
            href="/products"
            className="hidden text-sm font-medium text-primary hover:underline sm:block"
          >
            View all products →
          </Link>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col overflow-hidden bg-card border border-border/50 rounded-2xl">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Products coming soon! Check back shortly.</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all products →
          </Link>
        </div>
      </div>
    </section>
  );
}
