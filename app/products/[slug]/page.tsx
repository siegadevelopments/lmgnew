'use client'

import { useParams, useRouter } from "next/navigation";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { productBySlugQueryOptions } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useState, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/ProductCard";
import { BookingCalendar } from "@/components/BookingCalendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CreditCard, Store } from "lucide-react";
import Link from "next/link";

function ProductContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { data: products } = useSuspenseQuery(productBySlugQueryOptions(slug));
  const product = products?.[0];
  const { user } = useAuth();

  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product?.variants && product.variants.length > 0 ? product.variants[0] : null,
  );
  const [booking, setBooking] = useState<{ start_time: string; end_time: string } | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");

  if (!product) return <div className="p-20 text-center">Product not found</div>;

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant
    ? selectedVariant.available
      ? product.stock
      : 0
    : product.stock;

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/signup?redirect=/products/${slug}`);
      return;
    }

    if (product.product_type === "service" && booking) {
      // Fetch user profile phone if not set
      if (!customerPhone) {
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("phone")
          .eq("id", user.id)
          .single();
        if (profile?.phone) setCustomerPhone(profile.phone);
      }
      setIsPaymentDialogOpen(true);
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
      vendor_id: product.vendor_id,
      booking: booking || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handlePayNow = () => {
    setIsPaymentDialogOpen(false);
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
      vendor_id: product.vendor_id,
      booking: booking || undefined,
    });
    router.push("/checkout");
  };

  const handleConfirmBooking = async () => {
    if (!booking) return;
    setIsBookingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-booking", {
        body: {
          booking,
          customer_email: user?.email,
          customer_phone: customerPhone,
          product_id: product.id,
          vendor_id: product.vendor_id,
          product_title: product.title,
          vendor_name: product.vendor?.store_name,
          payment_method: "store",
        },
      });

      if (error) throw error;

      toast.success("Booking confirmed! Check your email and SMS for details.");
      setIsPaymentDialogOpen(false);
      router.push("/profile?tab=bookings");
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error("Failed to confirm booking: " + err.message);
    } finally {
      setIsBookingLoading(false);
    }
  };

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", product.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, title, content, created_at, user:profiles(full_name)")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
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
    enabled: !!product.id,
  });

  const averageRating =
    reviews && reviews.length > 0
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
      content: reviewContent,
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
        {product.vendor ? (
          <Link
            href={`/vendors/${product.vendor.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to {product.vendor.store_name}
          </Link>
        ) : (
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">
            ← Back to products
          </Link>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          {product.image_url && (
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border">
              <Image 
                src={product.image_url} 
                alt={product.title} 
                fill
                className="object-cover" 
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {product.title}
            </h1>

            {product.vendor && (
            <div className="mt-3 flex items-center gap-3">
                {product.vendor.store_logo_url ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-border">
                    <Image
                      src={product.vendor.store_logo_url}
                      alt={product.vendor.store_name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {product.vendor.store_name.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  Sold by{" "}
                  <Link
                    href={`/vendors/${product.vendor.id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {product.vendor.store_name}
                  </Link>
                </span>
                {product.brand && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      Brand: <span className="text-foreground">{product.brand}</span>
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <div className="flex text-amber-500">
                {"★".repeat(Math.round(Number(averageRating)))}
                {"☆".repeat(5 - Math.round(Number(averageRating)))}
              </div>
              <span className="text-sm font-medium">
                {Number(averageRating) > 0 ? averageRating : "No ratings"}
              </span>
              {reviews && reviews.length > 0 && (
                <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
              )}
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

            {product.product_type !== "service" &&
              (currentStock > 0 ? (
                <Badge
                  variant="outline"
                  className="mt-4 text-green-600 bg-green-500/10 border-green-200"
                >
                  In Stock {currentStock < 50 ? `(${currentStock})` : ""}
                </Badge>
              ) : (
                <Badge variant="destructive" className="mt-4">
                  Out of Stock
                </Badge>
              ))}

            {product.excerpt && (
              <p
                className="mt-6 text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.excerpt }}
              />
            )}

            {/* Add to Cart (Physical Products Only) */}
            {product.product_type !== "service" && (
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
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  size="lg"
                  disabled={currentStock <= 0}
                >
                  {added ? "Added to Cart!" : currentStock <= 0 ? "Unavailable" : "Add to Cart"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Booking Calendar for Services (Full Width) */}
        {product.product_type === "service" && (
          <div className="mt-16 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Schedule Your Appointment</h2>
            <BookingCalendar
              productId={product.id}
              vendorId={product.vendor_id}
              onSelect={setBooking}
            />

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-6 p-6 bg-card rounded-2xl border border-border/50 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Sessions:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12 rounded-xl border-2 border-border text-lg font-bold hover:border-primary/50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-xl">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-12 w-12 rounded-xl border-2 border-border text-lg font-bold hover:border-primary/50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <Button
                onClick={handleAddToCart}
                className="flex-1 w-full h-14 text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                disabled={!booking}
              >
                {added
                  ? "Booking Added to Cart!"
                  : booking
                    ? "Confirm & Book Now"
                    : "Select a time slot above to book"}
              </Button>
            </div>
          </div>
        )}

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
              {reviews && reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {(r.user?.full_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{r.user?.full_name || "Anonymous User"}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-500 text-sm">
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <h4 className="mt-3 font-semibold text-foreground">{r.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {r.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to share your experience!
                </p>
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
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className={star <= rating ? "text-amber-500" : "text-muted"}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Review Title</Label>
                    <Input
                      required
                      placeholder="Summary of your experience"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Review</Label>
                    <Textarea
                      required
                      placeholder="What did you like or dislike?"
                      rows={4}
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              ) : (
                <div className="mt-6 rounded-lg bg-muted/50 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    You must be logged in to leave a review.
                  </p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href={`/login?redirect=/products/${product.slug}`}>
                      Log In
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">You May Also Like</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Related products based on this item
            </p>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </div>
        )}

        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="h-2 bg-gradient-to-r from-primary via-wellness-green to-primary" />
            <div className="p-8">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-2xl font-black tracking-tight text-center">
                  Confirm Your Booking
                </DialogTitle>
                <DialogDescription className="text-center text-base">
                  How would you like to pay for your session?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 text-center">
                    Booking Summary
                  </p>
                  <p className="font-bold text-center text-lg">{product.title}</p>
                  <p className="text-center text-sm text-primary font-semibold">
                    {booking &&
                      `${new Date(booking.start_time).toLocaleDateString()} at ${new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>

                <div className="grid gap-4">
                  <button
                    onClick={handlePayNow}
                    className="flex items-center gap-4 w-full p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all text-left group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Pay Now Online</p>
                      <p className="text-xs text-muted-foreground">Secure payment via Stripe</p>
                    </div>
                  </button>

                  <button
                    onClick={handleConfirmBooking}
                    disabled={isBookingLoading}
                    className="flex items-center gap-4 w-full p-4 rounded-2xl border-2 border-border/50 hover:border-wellness/50 hover:bg-wellness/5 transition-all text-left group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-wellness flex items-center justify-center text-white shadow-lg shadow-wellness/20 group-hover:scale-110 transition-transform">
                      <Store className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">Pay on Store / Clinic</p>
                      <p className="text-xs text-muted-foreground">
                        Confirm booking and pay in person
                      </p>
                    </div>
                    {isBookingLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-border/50">
                  <Label
                    htmlFor="customer-phone"
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block"
                  >
                    Confirm your phone number for SMS
                  </Label>
                  <Input
                    id="customer-phone"
                    placeholder="+1234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="rounded-xl h-12 shadow-inner"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    You will receive a confirmation email and SMS once booked.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </article>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ProductContent />
    </Suspense>
  );
}
