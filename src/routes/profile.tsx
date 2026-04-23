import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist, type WishlistItem } from "@/hooks/use-wishlist";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Account — Lifestyle Medicine Gateway" },
      { name: "description", content: "Manage your account, orders, and wishlist" },
    ],
  }),
  component: ProfilePage,
});

interface Order {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
  order_items?: { 
    id: string; 
    product_name: string; 
    product_image: string | null; 
    price: number; 
    quantity: number; 
    product_slug: string | null;
    status: string;
    tracking_number: string | null;
  }[];
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200",
  confirmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200",
  shipped: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200",
};

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile>({ full_name: null, phone: null, avatar_url: null });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch profile
    supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });

    // Fetch orders with items
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as unknown as Order[]) || []);
        setLoadingOrders(false);
      });
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMessage("");
    const { error } = await (supabase.from("profiles") as any).update({
      full_name: profile.full_name,
      phone: profile.phone,
    }).eq("id", user.id);
    setSaving(false);
    setSaveMessage(error ? "Failed to save" : "Saved!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <label className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground overflow-hidden group border border-border">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              (profile.full_name || user.email || "U").charAt(0).toUpperCase()
            )}
            <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center transition-colors">
              {uploadingAvatar ? (
                 <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                 <span className="text-[10px] text-white">Upload</span>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              disabled={uploadingAvatar}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadingAvatar(true);
                  const url = await uploadMedia(e.target.files[0], `avatars/${user.id}`);
                  if (url) {
                    await (supabase.from("profiles") as any).update({ avatar_url: url }).eq("id", user.id);
                    setProfile({ ...profile, avatar_url: url });
                  }
                  setUploadingAvatar(false);
                }
              }}
            />
          </label>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.full_name || "My Account"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </div>

      <Tabs defaultValue="orders" className="mt-8">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist ({wishlistItems.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ORDERS */}
        <TabsContent value="orders" className="mt-4 space-y-4">
          {loadingOrders ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Start shopping to see your orders here.</p>
                <Button className="mt-4" asChild><Link to="/products">Browse Products</Link></Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm font-medium">LMG-{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                        <Badge variant="outline" className={statusColors[order.status] || ""}>
                          {order.status}
                        </Badge>
                      </div>
                      <Button variant="link" className="h-auto p-0 text-xs mt-1" onClick={() => setSelectedOrder(order)}>View Details</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name} className="h-12 w-12 rounded-md object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          {item.product_slug ? (
                            <Link to="/products/$slug" params={{ slug: item.product_slug }} className="text-sm font-medium hover:text-primary">
                              {item.product_name}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium">{item.product_name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-bold">${Number(order.total).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* WISHLIST */}
        <TabsContent value="wishlist" className="mt-4">
          {wishlistItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold">Wishlist is empty</h3>
                <p className="mt-1 text-sm text-muted-foreground">Save products to find them later.</p>
                <Button className="mt-4" asChild><Link to="/products">Browse Products</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {item.product_image && (
                      <img src={item.product_image} alt={item.product_name} className="h-20 w-20 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link to="/products/$slug" params={{ slug: item.product_slug }} className="text-sm font-semibold hover:text-primary line-clamp-2">
                        {item.product_name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Saved {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => removeFromWishlist(item.product_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input id="profile-email" value={user.email || ""} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  {saveMessage && <span className="text-sm text-primary">{saveMessage}</span>}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order #LMG-{selectedOrder?.id.slice(0, 8).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-sm bg-muted/30 p-3 rounded-lg border border-border">
                <p className="font-semibold mb-1 text-foreground">Shipping Address</p>
                <p className="text-muted-foreground">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                <p className="text-muted-foreground">{selectedOrder.address}</p>
                <p className="text-muted-foreground">{selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip}</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <p className="font-semibold text-sm">Order Items</p>
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity}x {item.product_name}</span>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <span className={cn(
                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                        item.status === 'shipped' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {item.status}
                      </span>
                      {item.tracking_number && (
                        <span className="text-[10px] font-mono text-muted-foreground">Tracking: {item.tracking_number}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>${Number(selectedOrder.shipping).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>${Number(selectedOrder.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-2">
                  <span>Total</span>
                  <span>${Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
