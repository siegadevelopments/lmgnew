import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AnalyticsTab } from "@/components/vendor/AnalyticsTab";
import { ProductsTab } from "@/components/vendor/ProductsTab";
import { VideosTab } from "@/components/vendor/VideosTab";
import { ArticlesTab } from "@/components/vendor/ArticlesTab";
import { WithdrawTab } from "@/components/vendor/WithdrawTab";
import { SettingsTab } from "@/components/vendor/SettingsTab";

export const Route = createFileRoute("/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor Dashboard — Lifestyle Medicine Gateway" },
      { name: "description", content: "Manage your store" },
    ],
  }),
  component: VendorDashboardPage,
});

interface VendorProfile {
  id: string; store_name: string; store_description: string | null;
  store_logo_url: string | null; website: string | null; is_approved: boolean;
}
interface Product { id: number; title: string; price: number; stock: number; status: string; image_url: string | null; }
interface OrderItem { id: string; order_id: string; product_id: number; product_name: string; price: number; quantity: number; created_at: string; }
interface Video { id: string; title: string; embed_url: string; description: string | null; created_at: string | null; }
interface Article { id: number; title: string; slug: string; excerpt: string | null; image_url: string | null; created_at: string; }

function VendorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate({ to: "/login" }); return; }
    if (user) loadVendorData();
  }, [user, authLoading, navigate]);

  async function loadVendorData() {
    if (!user) return;
    setLoading(true);
    const { data: vendorData } = await supabase.from("vendor_profiles").select("*").eq("id", user.id).single();
    if (vendorData) {
      setProfile(vendorData as VendorProfile);
      const [prodRes, vidRes, artRes] = await Promise.all([
        supabase.from("products").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }),
        supabase.from("videos").select("*").order("created_at", { ascending: false }),
        supabase.from("articles").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (prodRes.data) setProducts(prodRes.data);
      if (vidRes.data) setVideos(vidRes.data as Video[]);
      if (artRes.data) setArticles(artRes.data as Article[]);
      if (prodRes.data && prodRes.data.length > 0) {
        const ids = (prodRes.data as any[]).map(p => p.id);
        const { data: items } = await supabase.from("order_items").select("*").in("product_id", ids).order("created_at", { ascending: false });
        if (items) setOrderItems(items as any);
      }
    }
    setLoading(false);
  }

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    const storeName = (e.target as HTMLFormElement).store_name.value;
    await (supabase.from("profiles") as any).update({ role: "vendor" }).eq("id", user.id);
    const { data } = await supabase.from("vendor_profiles").insert({ id: user.id, store_name: storeName, is_approved: false } as any).select().single();
    if (data) { setProfile(data as VendorProfile); navigate({ to: "/vendor" }); }
    setIsSubmitting(false);
  };

  if (authLoading || loading) {
    return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Become a Vendor</CardTitle><CardDescription>Set up your store to start selling</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="store_name">Store Name</Label><Input id="store_name" name="store_name" placeholder="Your brand name" required /></div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Store"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSales = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.store_name} Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Status: {profile.is_approved ? <span className="text-green-600 font-medium">Approved</span> : <span className="text-amber-600 font-medium">Pending Approval</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsTab totalSales={totalSales} productCount={products.length} orderCount={orderItems.length} articleCount={articles.length} videoCount={videos.length} />
          </TabsContent>
          <TabsContent value="products">
            <ProductsTab products={products} setProducts={setProducts} userId={user!.id} />
          </TabsContent>
          <TabsContent value="videos">
            <VideosTab videos={videos} setVideos={setVideos} />
          </TabsContent>
          <TabsContent value="articles">
            <ArticlesTab articles={articles} setArticles={setArticles} userId={user!.id} />
          </TabsContent>
          <TabsContent value="withdraw">
            <WithdrawTab totalSales={totalSales} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab profile={profile} setProfile={setProfile} userId={user!.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}