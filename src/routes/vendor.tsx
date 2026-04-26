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
import { VendorLiveStream } from "@/components/vendor/VendorLiveStream";
import { ChatTab } from "@/components/vendor/ChatTab";
import { BulkImportTab } from "@/components/vendor/BulkImportTab";
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
  Upload
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

interface VendorProfile {
  id: string; store_name: string; store_description: string | null;
  store_logo_url: string | null; website: string | null; is_approved: boolean;
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
  orders?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    address: string;
    city: string;
    state: string;
    zip: string;
  }
}
interface VideoData { id: string; title: string; embed_url: string; description: string | null; created_at: string | null; }
interface Article { id: number; title: string; slug: string; excerpt: string | null; image_url: string | null; created_at: string; }

function VendorDashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { 
      const search = window.location.search;
      navigate({ to: "/login", search: { redirect: `/vendor${search}` } }); 
      return; 
    }
    if (user) loadVendorData();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // --- Handle deep-linking and scrolling ---
    if (loading || orderItems.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const orderIdParam = params.get('orderId');

    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }

    if (orderIdParam) {
      setTimeout(() => {
        const element = document.getElementById(`order-${orderIdParam}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [loading, orderItems.length, activeTab]);

  async function loadVendorData() {
    if (!user) return;
    setLoading(true);
    try {
      const { data: vendorData } = await supabase.from("vendor_profiles").select("id, store_name, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, created_at, updated_at").eq("id", user.id).single();
      if (vendorData) {
        setProfile(vendorData as VendorProfile);
        const [prodRes, vidRes, artRes, orderRes] = await Promise.all([
          (supabase.from("products") as any).select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }),
          (supabase.from("videos") as any).select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
          (supabase.from("articles") as any).select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
          (supabase.from("order_items") as any).select("*, orders(*)").eq("vendor_id", user.id).order("created_at", { ascending: false }),
        ]);
        if (prodRes.data) setProducts(prodRes.data);
        if (vidRes.data) setVideos(vidRes.data as VideoData[]);
        if (artRes.data) setArticles(artRes.data as Article[]);
        if (orderRes.data) setOrderItems(orderRes.data as any);
      }
    } catch (err) {
      console.error("Error loading vendor data:", err);
    } finally {
      setLoading(false);
    }
  }

  const updateOrderItem = async (id: string, payload: any) => {
    const { error } = await (supabase
      .from("order_items") as any)
      .update(payload)
      .eq("id", id);
    
    if (error) {
      console.error("Error updating order item:", error);
      alert("Failed to update: " + error.message);
    } else {
      loadVendorData();
      alert("Status updated successfully!");
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    const storeName = (e.target as HTMLFormElement).store_name.value;
    await (supabase.from("profiles") as any).update({ role: "vendor" }).eq("id", user.id);
    const { data } = await (supabase.from("vendor_profiles") as any).insert({ id: user.id, store_name: storeName, is_approved: false } as any).select().single();
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
                  <ChevronRight className="h-5 w-5 rotate-180" />
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
              <AnalyticsTab totalSales={totalSales} productCount={products.length} orderCount={orderItems.length} articleCount={articles.length} videoCount={videos.length} />
            </TabsContent>

            <TabsContent value="products" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
                <p className="text-muted-foreground">Add and manage the products you sell.</p>
              </div>
              <ProductsTab products={products} setProducts={setProducts} userId={user!.id} />
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
              <div className="space-y-4">
                {orderItems.length === 0 ? (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">No orders yet.</CardContent></Card>
                ) : (
                  orderItems.map(item => {
                    const params = new URLSearchParams(window.location.search);
                    const isHighlighted = params.get('orderId') === item.order_id;
                    
                    return (
                    <Card key={item.id} id={`order-${item.order_id}`} className={cn(
                      "overflow-hidden border-border/50 transition-all duration-500",
                      isHighlighted ? "border-primary ring-1 ring-primary shadow-lg scale-[1.02]" : ""
                    )}>
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Order ID: {item.order_id.slice(0,8)}</span>
                            <span className={cn(
                              "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                              item.status === 'shipped' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {item.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold mb-1">{item.product_name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">Quantity: {item.quantity} • Price: ${(item.price * item.quantity).toFixed(2)}</p>
                          
                          <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg bg-muted/30 border border-border/50">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Customer</p>
                              <p className="text-sm font-medium">{item.orders?.first_name} {item.orders?.last_name}</p>
                              <p className="text-xs text-muted-foreground">{item.orders?.email}</p>
                              <p className="text-xs text-muted-foreground">{item.orders?.phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Shipping Address</p>
                              <p className="text-xs leading-relaxed">
                                {item.orders?.address}<br />
                                {item.orders?.city}, {item.orders?.state} {item.orders?.zip}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-72 bg-muted/10 border-t md:border-t-0 md:border-l border-border/50 p-6 flex flex-col justify-center gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Tracking Number</Label>
                            <Input 
                              placeholder="Add tracking #" 
                              defaultValue={item.tracking_number || ""}
                              onBlur={(e) => {
                                if (e.target.value !== item.tracking_number) {
                                  updateOrderItem(item.id, { tracking_number: e.target.value });
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            {item.status !== 'delivered' && (
                              <Button 
                                className="w-full" 
                                variant={item.status === 'shipped' ? "outline" : "default"}
                                onClick={() => {
                                  const nextStatus = item.status === 'shipped' ? 'delivered' : 'shipped';
                                  console.log("Updating item", item.id, "to", nextStatus);
                                  updateOrderItem(item.id, { status: nextStatus });
                                }}
                              >
                                {item.status === 'shipped' ? "Mark as Delivered" : "Mark as Shipped"}
                              </Button>
                            )}
                            
                            {item.status === 'delivered' && (
                              <Button className="w-full" variant="secondary" disabled>
                                Order Delivered ✅
                              </Button>
                            )}
                            
                            {(item.status === 'shipped' || item.status === 'delivered') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full text-xs text-muted-foreground"
                                onClick={() => updateOrderItem(item.id, { status: 'pending' })}
                              >
                                Reset to Pending
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                    );
                  })
                )}
              </div>
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
              <WithdrawTab totalSales={totalSales} />
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