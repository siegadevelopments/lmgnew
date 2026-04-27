import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
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
import { VendorLiveStream } from "@/components/vendor/VendorLiveStream";
import { ChatTab } from "@/components/vendor/ChatTab";
import { BulkImportTab } from "@/components/vendor/BulkImportTab";
import { OrdersTab } from "@/components/vendor/OrdersTab";
import { 
  LayoutDashboard, 
  Package, 
  Video, 
  FileText, 
  ShoppingBag, 
  Wallet, 
  Settings, 
  Radio,
  ChevronRight,
  Menu,
  LogOut,
  Store,
  Upload,
  MessageCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor Dashboard — Lifestyle Medicine Gateway" },
      { name: "description", content: "Manage your store" },
    ],
  }),
  component: VendorDashboardPage,
});

export interface VendorProfile {
  id: string; 
  store_name: string; 
  store_description: string | null;
  store_logo_url: string | null; 
  store_banner_url: string | null; 
  website: string | null; 
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  is_approved: boolean;
  ai_enabled?: boolean;
  ai_instructions?: string;
  store_categories?: string[];
}
interface Product { id: number; title: string; price: number; stock: number; status: string; image_url: string | null; }
interface OrderItem { 
  id: string; 
  order_id: string; 
  product_id: number; 
  product_name: string; 
  price: number; 
  quantity: number; 
  created_at: string;
  status: string;
  tracking_number: string | null;
}
interface VideoData { id: string; title: string; embed_url: string; description: string | null; created_at: string | null; }
interface Article { id: number; title: string; slug: string; excerpt: string | null; image_url: string | null; created_at: string; content?: string; }

function VendorDashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const searchParams = Route.useSearch() as any;
  const activeTabParam = searchParams.tab;
  const orderIdParam = searchParams.orderId;

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(activeTabParam || "analytics");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalSales = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  }, [orderItems]);

  useEffect(() => {
    if (!authLoading && !user) { 
      const search = window.location.search;
      navigate({ to: "/login", search: { redirect: `/vendor${search}` } }); 
      return; 
    }
    if (user) loadVendorData();
  }, [user, authLoading]);

  useEffect(() => {
    if (activeTabParam && activeTabParam !== activeTab) {
      setActiveTab(activeTabParam);
    }

    if (orderIdParam) {
      setActiveTab("orders");
      setTimeout(() => {
        const element = document.getElementById(`order-${orderIdParam}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [orderIdParam, activeTabParam]);

  async function loadVendorData() {
    if (!user) return;
    setLoading(true);
    try {
      console.log("Loading vendor data for user:", user.id);
      const { data: vendorData, error: vError } = await (supabase.from("vendor_profiles") as any).select("id, store_name, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, created_at, updated_at, ai_enabled, ai_instructions, store_categories").eq("id", user.id).single();
      
      if (vError && vError.code !== 'PGRST116') {
        console.error("Vendor profile fetch error:", vError);
      }

      if (vendorData) {
        console.log("Vendor profile found:", vendorData.store_name);
        setProfile(vendorData as VendorProfile);
        const [prodRes, vidRes, artRes, orderRes] = await Promise.all([
          (supabase.from("products") as any).select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }),
          (supabase.from("videos") as any).select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
          (supabase.from("articles") as any).select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
          (supabase.from("order_items") as any).select("*, orders(*)").eq("vendor_id", user.id).order("created_at", { ascending: false }),
        ]);
        
        if (prodRes.error) console.error("Products error:", prodRes.error);
        if (vidRes.error) console.error("Videos error:", vidRes.error);
        if (artRes.error) console.error("Articles error:", artRes.error);
        if (orderRes.error) console.error("Orders error:", orderRes.error);

        if (prodRes.data) setProducts(prodRes.data);
        if (vidRes.data) setVideos(vidRes.data as VideoData[]);
        if (artRes.data) setArticles(artRes.data as Article[]);
        if (orderRes.data) setOrderItems(orderRes.data as any);
      } else {
        console.log("No vendor profile found for this user.");
      }
    } catch (err) {
      console.error("Critical error in loadVendorData:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const storeName = (e.target as HTMLFormElement).store_name.value;
      await (supabase.from("profiles") as any).update({ role: "vendor" }).eq("id", user.id);
      const { data, error } = await (supabase.from("vendor_profiles") as any).insert({ id: user.id, store_name: storeName, is_approved: false } as any).select().single();
      if (error) throw error;
      if (data) { 
        setProfile(data as VendorProfile); 
        loadVendorData();
      }
    } catch (err) {
      console.error("Error creating store:", err);
    } finally {
      setIsSubmitting(false);
    }
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

  const sidebarItems = [
    { id: "analytics", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "My Products", icon: Package },
    { id: "live", label: "Live Stream", icon: Radio },
    { id: "videos", label: "Videos", icon: Video },
    { id: "orders", label: `Orders (${orderItems.length})`, icon: ShoppingBag },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "articles", label: "Articles", icon: FileText },
    { id: "withdraw", label: "Withdrawals", icon: Wallet },
    { id: "import", label: "Bulk Import", icon: Upload },
    { id: "settings", label: "Store Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-border bg-card lg:block shrink-0">
        <div className="sticky top-0 flex h-full flex-col p-6">
          <div className="mb-8 px-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight truncate max-w-[140px]">{profile.store_name}</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Vendor Hub</p>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                  activeTab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {activeTab === item.id && <ChevronRight className="ml-auto h-4 w-4" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
            <div className="mb-4 px-3 py-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn("h-2 w-2 rounded-full", profile.is_approved ? "bg-green-500" : "bg-amber-500")} />
                <p className="text-xs font-medium">{profile.is_approved ? "Approved" : "Pending"}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold truncate max-w-[150px]">{profile.store_name}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background lg:hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Store Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all",
                      activeTab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="analytics" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Sales Analytics</h1>
                <p className="text-muted-foreground">Track your store's performance and growth.</p>
              </div>
              <AnalyticsTab totalSales={totalSales} productCount={products.length} orderCount={orderItems.length} articleCount={articles.length} videoCount={videos.length} orderItems={orderItems} />
            </TabsContent>

            <TabsContent value="products" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
                <p className="text-muted-foreground">Add and manage the products you sell.</p>
              </div>
              <ProductsTab products={products} setProducts={setProducts} userId={user!.id} storeCategories={profile?.store_categories || []} />
            </TabsContent>

            <TabsContent value="live" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Go Live</h1>
                <p className="text-muted-foreground">Engage with your customers in real-time.</p>
              </div>
              <VendorLiveStream vendorId={profile.id} />
            </TabsContent>

            <TabsContent value="videos" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Video Content</h1>
                <p className="text-muted-foreground">Manage your educational or promotional videos.</p>
              </div>
              <VideosTab videos={videos} setVideos={setVideos} userId={user!.id} />
            </TabsContent>

            <TabsContent value="orders" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Recent Orders</h1>
                <p className="text-muted-foreground">Fulfill and track customer purchases.</p>
              </div>
              <OrdersTab orderItems={orderItems} onUpdate={loadVendorData} />
            </TabsContent>

            <TabsContent value="messages" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Customer Messages</h1>
                <p className="text-muted-foreground">Chat with your customers and answer their questions.</p>
              </div>
              <ChatTab vendorId={profile.id} />
            </TabsContent>

            <TabsContent value="articles" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Your Articles</h1>
                <p className="text-muted-foreground">Publish wellness tips and store news.</p>
              </div>
              <ArticlesTab articles={articles} setArticles={setArticles} userId={user!.id} />
            </TabsContent>

            <TabsContent value="withdraw" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Payouts & Withdrawals</h1>
                <p className="text-muted-foreground">Manage your earnings and transfer funds.</p>
              </div>
              <WithdrawTab totalSales={totalSales} vendorId={user?.id} />
            </TabsContent>

            <TabsContent value="import" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Bulk Import</h1>
                <p className="text-muted-foreground">Import products from Shopify or WooCommerce.</p>
              </div>
              <BulkImportTab userId={user!.id} onSuccess={loadVendorData} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
                <p className="text-muted-foreground">Configure your profile and store appearance.</p>
              </div>
              <SettingsTab profile={profile} setProfile={setProfile} userId={user!.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}