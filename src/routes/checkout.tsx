import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Lifestyle Medicine Gateway" },
      { name: "description", content: "Complete your purchase" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // --- NEW: Redirect to signup if not logged in ---
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/signup", search: { redirect: "/checkout" } });
    }
  }, [authLoading, user, navigate]);

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
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).single().then(({ data }) => {
        if (data) {
          const names = data.full_name ? data.full_name.split(" ") : [];
          setFormData(prev => ({
            ...prev,
            firstName: prev.firstName || names[0] || "",
            lastName: prev.lastName || (names.length > 1 ? names.slice(1).join(" ") : ""),
            phone: prev.phone || data.phone || "",
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
      const { data, error: sessionError } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          items,
          customer_email: formData.email,
          success_url: `${window.location.origin}/profile`, // Redirect to orders after success
          cancel_url: window.location.href,
          shipping_details: formData,
        },
      });

      if (sessionError) throw sessionError;
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
            <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <Button onClick={() => navigate({ to: "/products" })}>Continue Shopping</Button>
            {user && (
              <Button variant="outline" onClick={() => navigate({ to: "/profile" })}>
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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-muted-foreground">
            <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some items before checking out.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/products" })}>Browse Products</Button>
        </div>
      </div>
    );
  }

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link to="/products" className="text-sm font-medium text-primary hover:underline">← Continue Shopping</Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkout-email">Email</Label>
                  <Input id="checkout-email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input id="zip" name="zip" value={formData.zip} onChange={handleChange} required />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-xl border-2 border-primary/10 bg-white p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Secure Stripe Checkout</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      Your payment is encrypted and processed securely by Stripe. We never store your card details.
                    </p>
                    
                    {/* Payment Icons */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6 object-contain" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 object-contain" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-6 object-contain" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg" alt="Discover" className="h-6 object-contain" />
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3 text-emerald-500">
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
              <CardHeader><CardTitle className="text-lg">Order Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      {item.image && <img src={item.image} alt={item.name} className="h-14 w-14 rounded-md object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        {item.variant_name && item.variant_name !== "Default Title" && (
                          <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${totalPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-medium">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-medium">${tax.toFixed(2)}</span></div>
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
                <p className="mt-3 text-center text-xs text-muted-foreground">🔒 Secure & encrypted</p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </section>
  );
}
