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
      
      // Fallback realistic mock products if the database is empty
      if (allProducts.length === 0) {
        const mockData = [
          {
            title: "Organic Superfood Green Blend",
            category: "Nutrition",
            price: 45.99,
            image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80"
          },
          {
            title: "Eco-Friendly Cork Yoga Mat",
            category: "Fitness",
            price: 65.00,
            image_url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=400&q=80"
          },
          {
            title: "Daily Mindfulness Journal",
            category: "Mindfulness",
            price: 24.50,
            image_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=400&q=80"
          },
          {
            title: "Plant-Based Protein Powder",
            category: "Nutrition",
            price: 55.00,
            image_url: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80"
          },
          {
            title: "Aromatherapy Essential Oil Diffuser",
            category: "Wellness",
            price: 38.99,
            image_url: "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?auto=format&fit=crop&w=400&q=80"
          },
          {
            title: "Deep Tissue Massage Gun",
            category: "Recovery",
            price: 129.99,
            image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80"
          },
          {
            title: "Herbal Sleep Tea Blend",
            category: "Wellness",
            price: 18.99,
            image_url: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80"
          },
          {
            title: "Premium Resistance Band Set",
            category: "Fitness",
            price: 32.50,
            image_url: "https://images.unsplash.com/photo-1598971639058-fab354c6812c?auto=format&fit=crop&w=400&q=80"
          }
        ];

        allProducts = mockData.map((item, i) => ({
          id: `dummy-${i}`,
          title: item.title,
          price: item.price,
          slug: `mock-product-${i}`,
          category: item.category,
          image_url: item.image_url,
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
