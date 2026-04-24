import { createFileRoute, Link, useRouter, useNavigate, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productBySlugQueryOptions } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context: { queryClient }, params: { slug } }) => {
    const products = await queryClient.ensureQueryData(productBySlugQueryOptions(slug));
    if (!products || products.length === 0) throw notFound();
    return products[0];
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return {
      meta: [
        { title: `${loaderData.title} — Lifestyle Medicine Gateway` },
        { name: "description", content: loaderData.excerpt || "Wellness product" },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.excerpt || "" },
        ...(loaderData.image_url ? [{ property: "og:image", content: loaderData.image_url }] : []),
        { property: "og:type", content: "product" },
      ],
    };
  },
  component: ProductPage,
  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Failed to load product</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <button onClick={() => router.invalidate()} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Retry</button>
      </div>
    );
  },
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productBySlugQueryOptions(slug));
  const product = products[0];
  const navigate = useNavigate();
  const { user } = useAuth();

  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? (selectedVariant.available ? product.stock : 0) : product.stock;

  const handleAddToCart = () => {
    if (!user) {
      navigate({ to: "/signup", search: { redirect: window.location.pathname } });
      return;
    }
    addItem({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      product_id: product.id,
      variant_id: selectedVariant?.id,
      name: product.title,
      variant_name: selectedVariant?.title,
      price: currentPrice,
      quantity,
      image: product.image_url || undefined,
      slug: product.slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", product.id],
    queryFn: async () => {
       const { data } = await supabase.from("reviews")
         .select("id, rating, title, content, created_at, user:profiles(full_name)")
         .eq("product_id", product.id)
         .order("created_at", { ascending: false });
       return (data as any[]) || [];
    }
  });
  
  const { data: relatedProducts } = useQuery({
    queryKey: ["products", "related", product.category, product.id],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, vendor_profiles(store_name)")
        .eq("status", "published")
        .neq("id", product.id)
        .limit(6);
      
      if (product.category) {
        query = query.eq("category", product.category);
      }
      
      const { data } = await query;
      return (data as any[]) || [];
    },
    enabled: !!product.id
  });

  const averageRating = reviews && reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
     setIsSubmitting(true);
     await supabase.from("reviews").insert({
        user_id: user.id,
        product_id: product.id,
        product_slug: product.slug,
        rating,
        title: reviewTitle,
        content: reviewContent
     } as any);
     setReviewTitle("");
     setReviewContent("");
     setRating(5);
     refetchReviews();
     setIsSubmitting(false);
  };

  return (
    <article className="py-10 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link to="/products" className="text-sm font-medium text-primary hover:underline">← Back to products</Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {product.image_url && (
            <div className="overflow-hidden rounded-xl border border-border">
              <img src={product.image_url} alt={product.title} className="w-full object-cover" />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{product.title}</h1>
            
            {product.vendor && (
              <div className="mt-3 flex items-center gap-3">
                {product.vendor.store_logo_url ? (
                  <img src={product.vendor.store_logo_url} className="h-8 w-8 rounded-full object-cover border border-border" alt={product.vendor.store_name} />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {product.vendor.store_name.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  Sold by <Link to="/vendors/$slug" params={{ slug: product.vendor.id }} className="font-semibold text-primary hover:underline">{product.vendor.store_name}</Link>
                </span>
                {product.brand && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm font-medium text-muted-foreground">Brand: <span className="text-foreground">{product.brand}</span></span>
                  </>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <div className="flex text-amber-500">
                {"★".repeat(Math.round(Number(averageRating)))}{"☆".repeat(5-Math.round(Number(averageRating)))}
              </div>
              <span className="text-sm font-medium">{Number(averageRating) > 0 ? averageRating : "No ratings"}</span>
              {reviews && reviews.length > 0 && <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>}
            </div>

            <p className="mt-4 text-3xl font-bold text-primary">${currentPrice}</p>
            
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6 space-y-3">
                <Label className="text-base font-semibold">Choose Your Size:</Label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        selectedVariant?.id === v.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStock > 0 ? (
              <Badge variant="outline" className="mt-4 text-green-600 bg-green-500/10 border-green-200">
                In Stock {currentStock < 50 ? `(${currentStock})` : ""}
              </Badge>
            ) : (
              <Badge variant="destructive" className="mt-4">Out of Stock</Badge>
            )}

            {product.excerpt && (
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: product.excerpt }} />
            )}

            {/* Add to Cart */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-9 w-9 rounded-md border border-border text-lg"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-9 w-9 rounded-md border border-border text-lg"
                >
                  +
                </button>
              </div>
              <Button onClick={handleAddToCart} className="flex-1" size="lg" disabled={currentStock <= 0}>
                {added ? "Added to Cart!" : currentStock <= 0 ? "Unavailable" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </div>

        {product.content && (
          <div
            className="wp-content prose prose-green mt-12 max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: product.content }}
          />
        )}

        <Separator className="my-12" />

        {/* Reviews Section */}
        <div className="grid gap-12 md:grid-cols-2">
          {/* List Reviews */}
          <div>
            <h2 className="text-2xl font-bold">Customer Reviews</h2>
            <div className="mt-8 space-y-8">
               {reviews && reviews.length > 0 ? reviews.map(r => (
                  <div key={r.id}>
                     <div className="flex items-center gap-3">
                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {(r.user?.full_name || "?").charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p className="font-semibold">{r.user?.full_name || "Anonymous User"}</p>
                            <div className="flex items-center gap-2">
                               <div className="flex text-amber-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div>
                               <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                            </div>
                         </div>
                     </div>
                     <h4 className="mt-3 font-semibold text-foreground">{r.title}</h4>
                     <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.content}</p>
                  </div>
               )) : (
                  <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
               )}
            </div>
          </div>

          {/* Write Review */}
          <div>
            <div className="rounded-xl border border-border bg-card p-6">
               <h3 className="text-lg font-bold">Write a Review</h3>
               {user ? (
                 <form onSubmit={handleSubmitReview} className="mt-6 space-y-4">
                    <div className="space-y-2">
                       <Label>Rating (1-5)</Label>
                       <div className="flex gap-2 text-2xl text-amber-500">
                          {[1,2,3,4,5].map(star => (
                             <button type="button" key={star} onClick={() => setRating(star)} className={star <= rating ? "text-amber-500" : "text-muted"}>
                               ★
                             </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label>Review Title</Label>
                       <Input required placeholder="Summary of your experience" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <Label>Your Review</Label>
                       <Textarea required placeholder="What did you like or dislike?" rows={4} value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                       {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                 </form>
               ) : (
                 <div className="mt-6 rounded-lg bg-muted/50 p-6 text-center">
                    <p className="text-sm text-muted-foreground">You must be logged in to leave a review.</p>
                    <Button asChild variant="outline" className="mt-4">
                       <Link to="/login" search={{ redirect: `/products/${product.slug}` }}>Log In</Link>
                    </Button>
                 </div>
               )}
            </div>
          </div>
        </div>
        
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">You May Also Like</h2>
            <p className="mt-2 text-sm text-muted-foreground">Related products based on this item</p>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
