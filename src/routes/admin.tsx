import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminGalleriesTab } from "@/components/admin/AdminGalleriesTab";
import { AdminContentTab } from "@/components/admin/AdminContentTab";

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
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ role: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    contactMessages: 0,
    subscribers: 0,
  });

  // Check admin role
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
      return;
    }
    if (user) {
      supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data }) => {
        const d = data as any;
        setProfile(d);
        if (d?.role !== "admin") {
          navigate({ to: "/" });
        }
      });
    }
  }, [authLoading, user, navigate]);

  // Load data
  useEffect(() => {
    if (!profile || profile.role !== "admin") return;

    async function loadData() {
      setLoading(true);

      const [ordersRes, messagesRes, usersRes, subscribersRes, vendorsRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("vendor_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*, vendor:vendor_profiles(store_name)").order("created_at", { ascending: false }).limit(100),
      ]);

      const allOrders = (ordersRes.data || []) as Order[];
      const allMessages = (messagesRes.data || []) as ContactMessage[];
      const allUsers = (usersRes.data || []) as Profile[];

      setOrders(allOrders);
      setMessages(allMessages);
      setUsers(allUsers);
      setVendors(vendorsRes.data || []);
      setProducts(productsRes.data || []);

      setStats({
        totalUsers: allUsers.length,
        totalOrders: allOrders.length,
        totalRevenue: allOrders.reduce((sum, o) => sum + Number(o.total), 0),
        pendingOrders: allOrders.filter((o) => o.status === "pending").length,
        contactMessages: allMessages.filter((m) => !m.read).length,
        subscribers: subscribersRes.count || 0,
      });

      setLoading(false);
    }

    loadData();
  }, [profile]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await (supabase.from("orders") as any).update({ status: newStatus }).eq("id", orderId);
    if (error) return alert("Failed: " + error.message);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  };

  const markMessageRead = async (msgId: string) => {
    const { error } = await (supabase.from("contact_messages") as any).update({ read: true }).eq("id", msgId);
    if (error) return alert("Failed: " + error.message);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, read: true } : m)));
    setStats((prev) => ({ ...prev, contactMessages: prev.contactMessages - 1 }));
  };

  const toggleVendorApproval = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await (supabase.from("vendor_profiles") as any).update({ is_approved: !currentStatus }).eq("id", vendorId);
    if (error) return alert("Failed: " + error.message);
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, is_approved: !currentStatus } : v)));
  };

  const toggleProductStatus = async (productId: number, currentStatus: string) => {
     const newStatus = currentStatus === "published" ? "archived" : "published";
     const { error } = await (supabase.from("products") as any).update({ status: newStatus }).eq("id", productId);
     if (error) return alert("Failed: " + error.message);
     setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)));
  };

  if (authLoading || loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (profile.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform management and analytics</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Users", value: stats.totalUsers, icon: "👤" },
            { label: "Orders", value: stats.totalOrders, icon: "📦" },
            { label: "Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: "💰" },
            { label: "Pending", value: stats.pendingOrders, icon: "⏳" },
            { label: "Messages", value: stats.contactMessages, icon: "✉️" },
            { label: "Subscribers", value: stats.subscribers, icon: "📧" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">{stat.icon} {stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="mb-2">
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="galleries">Galleries (Memes/Charts)</TabsTrigger>
            <TabsTrigger value="content">Content Manager</TabsTrigger>
            <TabsTrigger value="messages">
              Messages {stats.contactMessages > 0 && <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">{stats.contactMessages}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          </TabsList>

          {/* ORDERS */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardContent className="pt-4">
                {orders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 font-medium">Order ID</th>
                          <th className="pb-3 font-medium">Customer</th>
                          <th className="pb-3 font-medium hidden sm:table-cell">Email</th>
                          <th className="pb-3 font-medium">Total</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium hidden sm:table-cell">Date</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b last:border-0">
                            <td className="py-3 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</td>
                            <td className="py-3">{order.first_name} {order.last_name}</td>
                            <td className="py-3 hidden sm:table-cell text-muted-foreground">{order.email}</td>
                            <td className="py-3 font-medium">${Number(order.total).toFixed(2)}</td>
                            <td className="py-3">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || ""}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 hidden sm:table-cell text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="py-3">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="rounded border border-border bg-background px-2 py-1 text-xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
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
          <TabsContent value="vendors" className="mt-4">
             <Card>
                <CardContent className="pt-4">
                   {vendors.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No vendors registered.</p>
                   ) : (
                      <div className="overflow-x-auto">
                         <table className="w-full text-sm">
                            <thead>
                               <tr className="border-b text-left text-muted-foreground">
                                  <th className="pb-3 font-medium">Store</th>
                                  <th className="pb-3 font-medium">Joined</th>
                                  <th className="pb-3 font-medium">Status</th>
                                  <th className="pb-3 font-medium text-right">Action</th>
                               </tr>
                            </thead>
                            <tbody>
                               {vendors.map(v => (
                                  <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30">
                                     <td className="py-3 font-medium">{v.store_name}</td>
                                     <td className="py-3 text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</td>
                                     <td className="py-3">
                                        <Badge variant={v.is_approved ? "default" : "destructive"}>
                                           {v.is_approved ? "Approved" : "Pending"}
                                        </Badge>
                                     </td>
                                     <td className="py-3 text-right">
                                        <Button size="sm" variant="outline" onClick={() => toggleVendorApproval(v.id, v.is_approved)}>
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
          <TabsContent value="products" className="mt-4">
             <Card>
                <CardContent className="pt-4">
                   {products.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No products found.</p>
                   ) : (
                      <div className="overflow-x-auto">
                         <table className="w-full text-sm">
                            <thead>
                               <tr className="border-b text-left text-muted-foreground">
                                  <th className="pb-3 font-medium">Product</th>
                                  <th className="pb-3 font-medium">Vendor</th>
                                  <th className="pb-3 font-medium">Price</th>
                                  <th className="pb-3 font-medium text-right">Action</th>
                               </tr>
                            </thead>
                            <tbody>
                               {products.map(p => (
                                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                                     <td className="py-3">{p.title}</td>
                                     <td className="py-3 text-muted-foreground">{p.vendor?.store_name || "Unknown"}</td>
                                     <td className="py-3">${p.price}</td>
                                     <td className="py-3 text-right flex items-center justify-end gap-2">
                                        <Badge variant={p.status === "published" ? "outline" : "secondary"}>{p.status}</Badge>
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
          <TabsContent value="galleries" className="mt-4">
            <AdminGalleriesTab />
          </TabsContent>

          {/* CONTENT MANAGER */}
          <TabsContent value="content" className="mt-4">
            <AdminContentTab vendors={vendors} />
          </TabsContent>

          {/* MESSAGES */}
          <TabsContent value="messages" className="mt-4 space-y-3">
            {messages.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No messages.</CardContent></Card>
            ) : (
              messages.map((msg) => (
                <Card key={msg.id} className={msg.read ? "opacity-60" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{msg.subject}</h3>
                          {!msg.read && <Badge variant="destructive" className="h-4 px-1 text-[10px]">New</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{msg.name} · {msg.email}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{msg.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                      {!msg.read && (
                        <Button variant="outline" size="sm" onClick={() => markMessageRead(msg.id)}>
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
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardContent className="pt-4">
                {users.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No users yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 font-medium">User</th>
                          <th className="pb-3 font-medium">Role</th>
                          <th className="pb-3 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b last:border-0">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                  {(u.full_name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{u.full_name || "—"}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge variant={u.role === "admin" ? "default" : u.role === "vendor" ? "secondary" : "outline"}>
                                {u.role}
                              </Badge>
                            </td>
                            <td className="py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
