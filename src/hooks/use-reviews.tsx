import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Review {
  id: string;
  user_id: string;
  product_id: number;
  product_slug: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  profile?: { full_name: string | null; avatar_url: string | null };
}

export function useReviews(productId: number) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*, profile:profiles(full_name, avatar_url)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    const items = (data || []) as unknown as Review[];
    setReviews(items);
    if (items.length > 0) {
      const avg = items.reduce((sum, r) => sum + r.rating, 0) / items.length;
      setAverageRating(Math.round(avg * 10) / 10);
    } else {
      setAverageRating(0);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(
    async (review: { rating: number; title: string; content: string; productSlug: string }) => {
      if (!user) return { error: new Error("Must be logged in") };
      const { error } = await supabase.from("reviews").upsert(
        {
          user_id: user.id,
          product_id: productId,
          product_slug: review.productSlug,
          rating: review.rating,
          title: review.title,
          content: review.content,
        } as any,
        { onConflict: "user_id,product_id" },
      );
      if (!error) fetchReviews();
      return { error: error ? new Error(error.message) : null };
    },
    [user, productId, fetchReviews],
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      if (!user) return;
      await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);
      fetchReviews();
    },
    [user, fetchReviews],
  );

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  return { reviews, loading, averageRating, submitReview, deleteReview, userReview, refresh: fetchReviews };
}
