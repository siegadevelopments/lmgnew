import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminGalleriesTab } from "@/components/admin/AdminGalleriesTab";
import { AdminContentTab } from "@/components/admin/AdminContentTab";
import { VendorEditDialog } from "@/components/admin/VendorEditDialog";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import { toast } from "sonner";
import { 
  Edit, 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Store, 
  Package, 
  Image as ImageIcon, 
  FileText, 
  Mail, 
  Settings,
  ChevronRight,
  Menu,
  LogOut,
  Key,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Lifestyle Medicine Gateway" },
      { name: "description", content: "Platform administration" },
    ],
  }),
  component: AdminPage,
});

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  contactMessages: number;
  subscribers: number;
}

interface Order {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total: number;
  status: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-200",
  shipped: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

const getStatusColor = (status: string) => statusColors[status?.toLowerCase()] || "bg-slate-500/10 text-slate-600 border-slate-200";

function AdminPage() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    contactMessages: 0,
    subscribers: 0,
  });
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);

  // Check admin role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (role && role !== "admin") {
        navigate({ to: "/" });
      }
    }
  }, [authLoading, user, role, navigate]);

  // Load data
  useEffect(() => {
    if (role !== "admin") return;

    async function loadData() {
      try {
        setLoading(true);

        const [ordersRes, messagesRes, usersRes, subscribersRes, vendorsRes, productsRes] = await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
          supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
          supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
          supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
          supabase.from("vendor_profiles").select("id, store_name, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, created_at, updated_at, ai_enabled, ai_instructions").order("created_at", { ascending: false }),
          supabase.from("products").select("*, vendor_profiles(store_name)").order("created_at", { ascending: false }).limit(100),
        ]);

        if (ordersRes.error) console.error("Orders error:", ordersRes.error);
        if (productsRes.error) console.error("Products error:", productsRes.error);

        const allOrders = (ordersRes.data || []) as Order[];
        const allMessages = (messagesRes.data || []) as ContactMessage[];
        const allUsers = (usersRes.data || []) as any[];
        const { data: streamsData } = await supabase.from("vendor_streams").select("*");
        const allStreams = streamsData || [];

        // 2. Get users with emails from secure RPC
        let usersWithEmails: any[] = [];
        try {
          const { data: rpcUsers, error: rpcError } = await (supabase as any).rpc("get_admin_users");
          
          if (!rpcError && rpcUsers) {
            usersWithEmails = rpcUsers;
          } else if (rpcError) {
            console.warn("RPC Error fetching users:", rpcError);
          }
        } catch (e) {
          console.warn("Could not fetch users via RPC, falling back to profiles only.", e);
        }

        const vendorProfiles = (vendorsRes.data || []) as any[];
        const vendorsWithEmails = vendorProfiles.filter(vp => vp && vp.id).map(vp => {
          const userList = usersWithEmails.length > 0 ? usersWithEmails : allUsers;
          const user = (userList as any[]).find(u => u && u.id === vp.id);
          return {
            ...vp,
            email: user?.email || ""
          };
        });

        setOrders(allOrders);
        setMessages(allMessages);
        setUsers(usersWithEmails.length > 0 ? usersWithEmails : allUsers);
        
        const vendorsWithStreams = vendorsWithEmails.map(v => ({
          ...v,
          stream: allStreams.find((s: any) => s.vendor_id === v.id)
        }));
        setVendors(vendorsWithStreams);
        
        const productsData = (productsRes.data || []).map((p: any) => ({
          ...p,
          vendor: p.vendor_profiles
        }));
        setProducts(productsData);

        setStats({
          totalUsers: allUsers.length,
          totalOrders: allOrders.length,
          totalRevenue: allOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
          pendingOrders: allOrders.filter((o) => o.status === "pending").length,
          contactMessages: allMessages.filter((m) => !m.read).length,
          subscribers: subscribersRes.count || 0,
        });
      } catch (err) {
        console.error("Critical dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [role]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await (supabase.from("orders") as any).update({ status: newStatus }).eq("id", orderId);
    if (error) return alert("Failed: " + error.message);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    toast.success("Order status updated");
  };

  const markMessageRead = async (msgId: string) => {
    const { error } = await (supabase.from("contact_messages") as any).update({ read: true }).eq("id", msgId);
    if (error) return alert("Failed: " + error.message);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, read: true } : m)));
    setStats((prev) => ({ ...prev, contactMessages: prev.contactMessages - 1 }));
    toast.success("Message marked as read");
  };

  const toggleVendorApproval = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await (supabase.from("vendor_profiles") as any).update({ is_approved: !currentStatus }).eq("id", vendorId);
    if (error) return alert("Failed: " + error.message);
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, is_approved: !currentStatus } : v)));
    toast.success(currentStatus ? "Vendor revoked" : "Vendor approved");
  };

  const toggleProductStatus = async (productId: number, currentStatus: string) => {
     const newStatus = currentStatus === "published" ? "archived" : "published";
     const { error } = await (supabase.from("products") as any).update({ status: newStatus }).eq("id", productId);
     if (error) return alert("Failed: " + error.message);
     setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)));
     toast.success(`Product ${newStatus}`);
  };

  if (authLoading || loading || !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (role !== "admin") return null;

  const sidebarItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: `Orders (${orders.length})`, icon: ShoppingBag },
    { id: "vendors", label: "Vendors", icon: Store },
    { id: "streams", label: "Live Streams", icon: Radio },
    { id: "products", label: `Products (${products.length})`, icon: Package },
    { id: "content", label: "Content Manager", icon: FileText },
    { id: "galleries", label: "Galleries", icon: ImageIcon },
    { id: "messages", label: "Messages", icon: Mail, badge: stats.contactMessages },
    { id: "users", label: `Users (${users.length})`, icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-border bg-card lg:block shrink-0">
        <div className="sticky top-0 flex h-full flex-col p-6">
          <div className="mb-8 px-2">
            <h2 className="text-xl font-bold tracking-tight">LMG Admin</h2>
            <p className="text-xs text-muted-foreground mt-1">Platform Control Center</p>
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
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
                {activeTab === item.id && <ChevronRight className="ml-auto h-4 w-4" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
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
          <h2 className="text-lg font-bold">LMG Admin</h2>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background lg:hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Admin Menu</h2>
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
            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-6 mt-0 border-0 p-0">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
                <p className="text-muted-foreground">Quick snapshot of platform activity.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: "Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
                  { label: "Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-emerald-500" },
                  { label: "Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: LayoutDashboard, color: "text-amber-500" },
                  { label: "Pending", value: stats.pendingOrders, icon: ChevronRight, color: "text-red-500" },
                  { label: "Messages", value: stats.contactMessages, icon: Mail, color: "text-indigo-500" },
                  { label: "Subscribers", value: stats.subscribers, icon: Users, color: "text-pink-500" },
                ].map((stat) => (
                  <Card key={stat.label} className="overflow-hidden border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                          <p className="mt-2 text-3xl font-bold tracking-tight">{stat.value}</p>
                        </div>
                        <stat.icon className={cn("h-8 w-8 opacity-20", stat.color)} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-medium">{order.first_name} {order.last_name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">${Number(order.total).toFixed(2)}</p>
                            <Badge variant="outline" className={cn("mt-1 text-[10px]", getStatusColor(order.status))}>{order.status}</Badge>
                          </div>
                        </div>
                      ))}
                      <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setActiveTab("orders")}>View all orders</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {messages.slice(0, 5).map((msg) => (
                        <div key={msg.id} className="flex items-start gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{msg.subject}</p>
                            <p className="text-xs text-muted-foreground truncate">{msg.name}</p>
                          </div>
                          {!msg.read && <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" />}
                        </div>
                      ))}
                      <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setActiveTab("messages")}>View all messages</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ORDERS */}
            <TabsContent value="orders" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
                <p className="text-muted-foreground">Manage and track platform sales.</p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  {orders.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No orders found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-left text-muted-foreground">
                            <th className="pb-3 font-medium">Order ID</th>
                            <th className="pb-3 font-medium">Customer</th>
                            <th className="pb-3 font-medium hidden sm:table-cell">Email</th>
                            <th className="pb-3 font-medium">Total</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium hidden lg:table-cell">Date</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                              <td className="py-4 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</td>
                              <td className="py-4 font-medium">{order.first_name} {order.last_name}</td>
                              <td className="py-4 hidden sm:table-cell text-muted-foreground">{order.email}</td>
                              <td className="py-4 font-bold text-primary">${Number(order.total).toFixed(2)}</td>
                              <td className="py-4">
                                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase", getStatusColor(order.status))}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-4 hidden lg:table-cell text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                              <td className="py-4 text-right">
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className="rounded border border-border bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* VENDORS */}
            <TabsContent value="vendors" className="mt-0 border-0 p-0">
               <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Vendor Management</h1>
                <p className="text-muted-foreground">Approve and manage partner stores.</p>
              </div>
               <Card>
                  <CardContent className="pt-6">
                     {vendors.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">No vendors registered.</p>
                     ) : (
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm">
                              <thead>
                                 <tr className="border-b border-border/50 text-left text-muted-foreground">
                                    <th className="pb-3 font-medium">Store</th>
                                    <th className="pb-3 font-medium hidden sm:table-cell">Joined</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {vendors.map(v => (
                                    <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                                       <td className="py-4 font-medium">{v.store_name}</td>
                                       <td className="py-4 hidden sm:table-cell text-muted-foreground text-xs">{new Date(v.created_at).toLocaleDateString()}</td>
                                       <td className="py-4">
                                          <Badge variant={v.is_approved ? "default" : "destructive"} className="text-[10px] font-bold uppercase tracking-tight">
                                             {v.is_approved ? "Approved" : "Pending"}
                                          </Badge>
                                       </td>
                                       <td className="py-4 text-right flex items-center justify-end gap-2">
                                          <Button 
                                             size="sm" 
                                             variant="ghost" 
                                             onClick={() => {
                                                setEditingVendor(v);
                                                setIsEditOpen(true);
                                             }}
                                          >
                                             <Edit className="h-4 w-4 mr-1 text-muted-foreground" /> Edit
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant={v.is_approved ? "outline" : "default"} 
                                            onClick={() => toggleVendorApproval(v.id, v.is_approved)}
                                          >
                                             {v.is_approved ? "Revoke" : "Approve"}
                                          </Button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </CardContent>
               </Card>
            </TabsContent>

            {/* PRODUCTS */}
            <TabsContent value="products" className="mt-0 border-0 p-0">
               <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
                <p className="text-muted-foreground">Monitor products across all vendors.</p>
              </div>
               <Card>
                  <CardContent className="pt-6">
                     {products.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>
                     ) : (
                        <div className="overflow-x-auto">
                           <table className="w-full text-sm">
                              <thead>
                                 <tr className="border-b border-border/50 text-left text-muted-foreground">
                                    <th className="pb-3 font-medium">Product</th>
                                    <th className="pb-3 font-medium">Vendor</th>
                                    <th className="pb-3 font-medium">Price</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {products.map(p => (
                                    <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                                       <td className="py-4 font-medium">{p.title}</td>
                                       <td className="py-4 text-muted-foreground text-xs">{p.vendor?.store_name || "Unknown"}</td>
                                       <td className="py-4 font-bold text-primary">${p.price}</td>
                                       <td className="py-4">
                                          <Badge variant={p.status === "published" ? "outline" : "secondary"} className="text-[10px] font-bold uppercase tracking-tight">
                                            {p.status}
                                          </Badge>
                                       </td>
                                       <td className="py-4 text-right">
                                          <Button size="sm" variant="outline" onClick={() => toggleProductStatus(p.id, p.status)}>
                                             {p.status === "published" ? "Take Down" : "Restore"}
                                          </Button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </CardContent>
               </Card>
            </TabsContent>

            {/* GALLERIES */}
            <TabsContent value="galleries" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Gallery Manager</h1>
                <p className="text-muted-foreground">Manage Memes and Charts collections.</p>
              </div>
              <AdminGalleriesTab />
            </TabsContent>

            {/* CONTENT MANAGER */}
            <TabsContent value="content" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Content Manager</h1>
                <p className="text-muted-foreground">Approve articles, recipes, and videos.</p>
              </div>
              <AdminContentTab vendors={vendors} />
            </TabsContent>

            {/* MESSAGES */}
            <TabsContent value="messages" className="mt-0 border-0 p-0 space-y-4">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Contact Messages</h1>
                <p className="text-muted-foreground">Respond to user inquiries and support.</p>
              </div>
              {messages.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No messages found.</CardContent></Card>
              ) : (
                messages.map((msg) => (
                  <Card key={msg.id} className={cn("border-border/50", msg.read ? "opacity-60 grayscale-[0.5]" : "border-primary/20 bg-primary/5 shadow-sm")}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-foreground">{msg.subject}</h3>
                            {!msg.read && <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-black uppercase tracking-wider">New</Badge>}
                          </div>
                          <p className="mt-1 text-sm font-medium text-primary">{msg.name} <span className="text-muted-foreground font-normal">({msg.email})</span></p>
                          <Separator className="my-3 opacity-20" />
                          <p className="text-sm text-foreground/80 leading-relaxed bg-background/50 p-3 rounded-md border border-border/30">{msg.message}</p>
                          <p className="mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(msg.created_at).toLocaleString()}</p>
                        </div>
                        {!msg.read && (
                          <Button variant="default" size="sm" onClick={() => markMessageRead(msg.id)} className="shadow-lg">
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* USERS */}
            <TabsContent value="users" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">User Directory</h1>
                <p className="text-muted-foreground">Monitor all registered platform users.</p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  {users.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">No users registered.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-left text-muted-foreground">
                            <th className="pb-3 font-medium">User</th>
                            <th className="pb-3 font-medium">Role</th>
                            <th className="pb-3 font-medium">Joined</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary shadow-inner">
                                    {(u.full_name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold">{u.full_name || "Guest User"}</p>
                                    <p className="text-[10px] text-muted-foreground">{u.email || (u.id ? u.id.slice(0, 8) : "---")}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <Badge variant={u.role === "admin" ? "default" : u.role === "vendor" ? "secondary" : "outline"} className="text-[10px] font-bold uppercase tracking-tight">
                                  {u.role}
                                </Badge>
                              </td>
                              <td className="py-4 text-muted-foreground text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "---"}</td>
                              <td className="py-4 text-right">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setEditingUser(u);
                                    setIsUserEditOpen(true);
                                  }}
                                >
                                  <Key className="h-4 w-4 mr-1 text-muted-foreground" /> Manage
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="streams" className="mt-0 border-0 p-0">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Vendor Live Streams</CardTitle>
                  <CardDescription>Manage Mux credentials and live status for all vendors.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-muted-foreground">
                          <th className="pb-3 font-medium">Vendor</th>
                          <th className="pb-3 font-medium">Stream Key</th>
                          <th className="pb-3 font-medium">Playback ID</th>
                          <th className="pb-3 font-medium text-right">Status</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((v) => (
                          <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                            <td className="py-4">
                              <p className="font-bold">{v.store_name}</p>
                              <p className="text-[10px] text-muted-foreground">{v.email}</p>
                            </td>
                            <td className="py-4">
                              <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                                {v.stream?.mux_stream_key ? "••••••••••••" : "None"}
                              </code>
                            </td>
                            <td className="py-4 font-mono text-[10px]">
                              {v.stream?.mux_playback_id || "None"}
                            </td>
                            <td className="py-4 text-right">
                              {v.stream?.is_live ? (
                                <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                              ) : (
                                <Badge variant="secondary">OFFLINE</Badge>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingVendor(v);
                                  setIsEditOpen(true);
                                }}
                              >
                                Edit Keys
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {editingVendor && (
        <VendorEditDialog
          vendor={editingVendor}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingVendor(null);
          }}
          onSuccess={() => {
            supabase.from("vendor_profiles").select("id, store_name, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, created_at, updated_at, ai_enabled, ai_instructions").order("created_at", { ascending: false }).then(({ data }) => {
               if (data) setVendors(data);
            });
          }}
        />
      )}

      {editingUser && (
        <UserEditDialog
          user={editingUser}
          isOpen={isUserEditOpen}
          onClose={() => {
            setIsUserEditOpen(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            // Re-fetch users
            supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => {
               if (data) setUsers(data);
            });
          }}
        />
      )}
    </div>
  );
}
