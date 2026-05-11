'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- NEW: Redirect to signup if not logged in ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signup?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  // --- NEW: Auto-populate profile data ---
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            const profileData = data as any;
            const names = profileData.full_name ? profileData.full_name.split(" ") : [];
            setFormData((prev) => ({
              ...prev,
              email: prev.email || user.email || "",
              firstName: prev.firstName || names[0] || "",
              lastName: prev.lastName || (names.length > 1 ? names.slice(1).join(" ") : ""),
              phone: prev.phone || profileData.phone || "",
            }));
          }
        });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const shipping = totalPrice > 50 ? 0 : 5.99;
  const tax = totalPrice * 0.08;
  const grandTotal = totalPrice + shipping + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: sessionError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            items,
            customer_email: formData.email,
            success_url: `${window.location.origin}/profile`, // Redirect to orders after success
            cancel_url: window.location.href,
            shipping_details: formData,
          },
        },
      );

      if (sessionError) throw sessionError;

      // If the function returns a 200 but contains an error payload
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err: any) {
      console.error("Checkout error:", err, err.context);

      let errorMessage = "Failed to initiate checkout. Please try again.";
      if (err.context && err.context.error) {
        errorMessage = `Server Error: ${err.context.error}`;
      } else if (err.context && err.context.message) {
        errorMessage = `Server Error: ${err.context.message}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-10 w-10 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Order Placed!</h1>
          <p className="mt-3 text-muted-foreground">
            Thank you for your purchase. You'll receive a confirmation email shortly.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Order ID: <span className="font-mono font-semibold text-foreground">LMG-{orderId}</span>
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
            {user && (
              <Button variant="outline" onClick={() => router.push("/profile")}>
                View Orders
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto text-muted-foreground"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some items before checking out.</p>
          <Button className="mt-6" onClick={() => router.push("/products")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/products" className="text-sm font-medium text-primary hover:underline">
          ← Continue Shopping
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </span>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout-email">Email</Label>
                  <Input
                    id="checkout-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </span>
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    3
                  </span>
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-xl border-2 border-primary/10 bg-white p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <svg
                        className="h-8 w-8 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Secure Stripe Checkout</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      Your payment is encrypted and processed securely by Stripe. We never store
                      your card details.
                    </p>

                    {/* Payment Icons */}
                    <div className="mt-6 flex flex-row items-center justify-center gap-2 opacity-90 hover:opacity-100 transition-all duration-300">
                      <div className="flex h-8 w-12 items-center justify-center rounded border border-border bg-white shadow-sm px-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="29" height="10" viewBox="0 0 29 10" fill="none" className="w-full h-full object-contain">
                          <path d="M18.6619 0.544922C16.7093 0.544922 14.9643 1.557 14.9643 3.42689C14.9643 5.57128 18.059 5.71938 18.059 6.79667C18.059 7.25027 17.5392 7.65633 16.6514 7.65633C15.3914 7.65633 14.4496 7.08896 14.4496 7.08896L14.0467 8.97589C14.0467 8.97589 15.1315 9.45514 16.5719 9.45514C18.7067 9.45514 20.3865 8.39335 20.3865 6.49153C20.3865 4.22557 17.2789 4.08185 17.2789 3.08197C17.2789 2.72659 17.7056 2.33727 18.591 2.33727C19.5898 2.33727 20.4048 2.7499 20.4048 2.7499L20.7992 0.927472C20.7992 0.927472 19.9124 0.544922 18.6619 0.544922ZM0.797414 0.682477L0.750122 0.95756C0.750122 0.95756 1.5716 1.10789 2.31146 1.4078C3.26407 1.75167 3.33196 1.95188 3.49239 2.57367L5.24066 9.31329H7.5843L11.1948 0.682477H8.85657L6.5366 6.5506L5.58993 1.57649C5.50311 1.00722 5.06333 0.682477 4.52503 0.682477H0.797414ZM12.135 0.682477L10.3008 9.31326H12.5305L14.3583 0.682449H12.135V0.682477ZM24.5708 0.682477C24.0332 0.682477 23.7483 0.970332 23.5393 1.47334L20.2726 9.31326H22.6109L23.0632 8.00659H25.9119L26.187 9.31326H28.2501L26.4502 0.682477H24.5708ZM24.8749 3.01425L25.568 6.25295H23.7112L24.8749 3.01425Z" fill="#1A1F71"/>
                        </svg>
                      </div>
                      <div className="flex h-8 w-12 items-center justify-center rounded border border-border bg-white shadow-sm px-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="29" height="18" viewBox="0 0 29 18" fill="none" className="w-full h-full object-contain">
                          <path d="M18.2204 2.31921H10.7865V15.6765H18.2204V2.31921Z" fill="#FF5F00"></path>
                          <path d="M11.258 8.998C11.258 6.40206 12.4616 3.92412 14.4911 2.31936C10.8096 -0.583365 5.45241 0.0538194 2.54964 3.75893C-0.329541 7.44044 0.307654 12.7739 4.01283 15.6766C7.1044 18.1074 11.4232 18.1074 14.5147 15.6766C12.4616 14.0719 11.258 11.5939 11.258 8.998Z" fill="#EB001B"></path>
                          <path d="M28.2497 8.99788C28.2497 13.6942 24.4502 17.4937 19.7538 17.4937C17.8422 17.4937 16.0014 16.8565 14.5146 15.6765C18.1962 12.7738 18.8334 7.44032 15.9306 3.73521C15.5058 3.21602 15.0338 2.72043 14.5146 2.31924C18.1962 -0.583487 23.5534 0.0536972 26.4326 3.75881C27.6125 5.24557 28.2497 7.08633 28.2497 8.99788Z" fill="#F79E1B"></path>
                        </svg>
                      </div>
                      <div className="flex h-8 w-12 items-center justify-center rounded border border-border bg-white shadow-sm px-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="27" height="18" viewBox="0 0 27 18" fill="none" className="w-full h-full object-contain">
                          <path d="M24.1076 15.3702L22.9772 14.1092L21.8032 15.3702H19.4989H14.5423V9.50001H12.2379L15.1075 2.9341H17.8901L18.8902 5.19521V2.9341H22.3685L22.9772 4.62993L23.5859 2.9341H26.2381V1.934C26.2381 1.32524 25.7598 0.846924 25.1511 0.846924H1.84649C1.23779 0.846924 0.759521 1.32524 0.759521 1.934V16.0659C0.759521 16.6747 1.23779 17.153 1.84649 17.153H25.1511C25.7598 17.153 26.2381 16.6747 26.2381 16.0659V15.3702H24.1076Z" fill="#0071CE"></path>
                          <path d="M24.4148 14.6744H26.2409L23.8496 12.1089L26.2409 9.58691H24.4583L22.9365 11.2393L21.4582 9.58691H19.6321L22.067 12.1524L19.6321 14.6744H21.4148L22.9365 13.0221L24.4148 14.6744Z" fill="white"></path>
                          <path d="M16.7174 13.5004V12.7177H19.587V11.5436H16.7174V10.7609H19.6305V9.58691H15.3261V14.6744H19.6305V13.5004H16.7174Z" fill="white"></path>
                          <path d="M24.8931 8.84765H26.1974V3.71667L24.1105 3.76016L22.98 6.93441L21.8061 3.76016H19.6321V8.84765H21.0235V5.28206L22.3278 8.84765H23.5452L24.8931 5.28206V8.84765Z" fill="white"></path>
                          <path d="M17.414 3.76013H15.6314L13.3705 8.84763H14.8922L15.327 7.84752H17.6749L18.1097 8.84763H19.6749L17.414 3.76013ZM15.8053 6.67348L16.501 5.02113L17.1966 6.67348H15.8053Z" fill="white"></path>
                          <path d="M24.9782 11.9785L26.2391 13.3699V10.587L24.9782 11.9785Z" fill="white"></path>
                        </svg>
                      </div>
                      <div className="flex h-8 w-12 items-center justify-center rounded border border-border bg-white shadow-sm px-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="6" viewBox="0 0 30 6" fill="none" className="w-full h-full object-contain">
                          <path d="M1.70642 0.58728C3.15199 0.587371 4.4281 1.08378 4.4281 2.99255C4.42796 4.90199 3.15191 5.39871 1.70642 5.3988H0.415405V0.58728H1.70642ZM1.36267 4.64001H1.88904C2.67938 4.64001 3.4426 4.04012 3.44275 2.99255C3.44275 1.94479 2.67946 1.34509 1.88904 1.34509H1.36267V4.64001Z" fill="#F47721"></path>
                          <path d="M4.80695 0.586991H5.75269V5.39843H4.80695V0.586991ZM8.80131 1.85717C8.47596 1.65406 8.12578 1.43899 7.75539 1.39211C7.41624 1.34892 7.05504 1.45094 7.05504 1.93162C7.05504 2.76616 9.12208 2.41414 9.12208 4.02715C9.12208 5.08135 8.29857 5.58776 7.35191 5.48207C6.83906 5.42417 6.54219 5.26884 6.13319 4.99311V4.01704C6.45763 4.19626 6.9328 4.52805 7.2986 4.59423C7.70024 4.66592 8.13589 4.53724 8.13589 4.10251C8.13589 3.18526 6.06886 3.56485 6.06886 1.97298C6.06886 0.897643 6.88685 0.504272 7.71679 0.504272C8.12211 0.504272 8.48515 0.659599 8.80131 0.935326V1.85717ZM17.7027 0.586991H18.7155L19.7661 3.1292L20.7467 0.586991H21.7283L19.8819 5.39843H19.5391L17.7027 0.586991ZM21.9746 0.586991H24.7576V1.34524H22.9204V2.53087H24.6023V3.28912H22.9204V4.64018H24.7714V5.39843H21.9746V0.586991ZM25.0233 0.586991H26.0435C27.0572 0.586991 28.2658 0.552065 28.2658 1.88934C28.2658 2.45458 27.8945 2.92332 27.2925 3.00604V3.01982C27.5489 3.04004 27.6978 3.3029 27.7925 3.51613L28.5489 5.39751H27.4956L26.9285 3.89572C26.7934 3.53727 26.6721 3.39941 26.2732 3.39941H25.969V5.39843H25.0233V0.586991Z" fill="#F47721"></path>
                        </svg>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="h-3 w-3 text-emerald-500"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      SSL Encrypted Payment
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        {item.variant_name && item.variant_name !== "Default Title" && (
                          <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">${grandTotal.toFixed(2)}</span>
                </div>
                {shipping === 0 && <p className="mt-2 text-xs text-primary">🎉 Free shipping!</p>}
                <Button type="submit" className="mt-6 w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting to Stripe...
                    </span>
                  ) : (
                    `Pay & Place Order — $${grandTotal.toFixed(2)}`
                  )}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  🔒 Secure & encrypted
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </section>
  );
}
