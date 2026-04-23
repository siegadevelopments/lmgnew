import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface WishlistItem {
  id: string;
  product_id: number;
  product_slug: string;
  product_name: string;
  product_image: string | null;
  created_at: string;
}

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as WishlistItem[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(
    async (product: { id: number; slug: string; name: string; image?: string | null }) => {
      if (!user) return { error: new Error("Must be logged in") };
      const { error } = await supabase.from("wishlists").insert({
        user_id: user.id,
        product_id: product.id,
        product_slug: product.slug,
        product_name: product.name,
        product_image: product.image || null,
      } as any);
      if (!error) fetchWishlist();
      return { error: error ? new Error(error.message) : null };
    },
    [user, fetchWishlist],
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      if (!user) return;
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    },
    [user],
  );

  const isInWishlist = useCallback(
    (productId: number) => items.some((i) => i.product_id === productId),
    [items],
  );

  return { items, loading, addToWishlist, removeFromWishlist, isInWishlist, refresh: fetchWishlist };
}
