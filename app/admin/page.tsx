'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminGalleriesTab } from "@/components/admin/AdminGalleriesTab";
import { AdminContentTab } from "@/components/admin/AdminContentTab";
import { AdminSubscribersTab } from "@/components/admin/AdminSubscribersTab";
import { AdminPopupsTab } from "@/components/admin/AdminPopupsTab";
import { AffiliatesTab } from "@/components/admin/AffiliatesTab";
import { VendorEditDialog } from "@/components/admin/VendorEditDialog";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import { sendBrandedResetEmail } from "@/lib/admin-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductsTab } from "@/components/vendor/ProductsTab";
import { AdminPayoutsTab } from "@/components/admin/AdminPayoutsTab";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadMedia, deleteMediaWithSafety } from "@/lib/upload";
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
  Radio,
  Megaphone,
  Link as LinkIcon,
  MessageSquare,
  Sparkles,
  Trash2,
  DollarSign,
  Loader2,
  Plus,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-200",
  shipped: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

const getStatusColor = (status: string) =>
  statusColors[status?.toLowerCase()] || "bg-slate-500/10 text-slate-600 border-slate-200";

export default function AdminPage() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
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
  const [bulkResetProgress, setBulkResetProgress] = useState({
    total: 0,
    current: 0,
    active: false,
  });
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [editingVendorProducts, setEditingVendorProducts] = useState<any>(null);

  // Product management states inside admin products tab
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    title: "",
    price: "",
    stock: "50",
    image_url: "",
    description: "",
    status: "published",
    brand: "",
    category: "Supplements",
    product_type: "physical" as "physical" | "service" | "digital",
    vendor_id: "",
  });
  const [generatingProductDesc, setGeneratingProductDesc] = useState(false);
  const [generatingProductImg, setGeneratingProductImg] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingProductImg, setUploadingProductImg] = useState(false);

  // Check admin role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (role && role !== "admin") {
        router.push("/");
      }
    }
  }, [authLoading, user, role, router]);

  // Load data
  useEffect(() => {
    if (role !== "admin") return;

    async function loadData() {
      try {
        setLoading(true);

        const [ordersRes, messagesRes, usersRes, subscribersRes, vendorsRes, productsRes] =
          await Promise.all([
            supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
            supabase
              .from("contact_messages")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(50),
            supabase
              .from("profiles")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(100),
            supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
            supabase
              .from("vendor_profiles")
              .select(
                "id, store_name, representative_name, vendor_type, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, created_at, updated_at, ai_enabled, ai_instructions, commission_rate",
              )
              .order("created_at", { ascending: false }),
            supabase
              .from("products")
              .select("*, vendor_profiles(store_name)")
              .order("created_at", { ascending: false })
              .limit(500),
          ]);

        if (ordersRes.error) console.error("Orders error:", ordersRes.error);
        if (productsRes.error) console.error("Products error:", productsRes.error);

        const allOrders = (ordersRes.data || []) as Order[];
        const allMessages = (messagesRes.data || []) as ContactMessage[];
        const allUsers = (usersRes.data || []) as any[];
        const { data: streamsData } = await supabase.from("vendor_streams").select("*");
        const allStreams = streamsData || [];

        // Get users with emails from secure RPC
        let usersWithEmails: any[] = [];
        try {
          const { data: rpcUsers, error: rpcError } = await (supabase as any).rpc(
            "get_admin_users",
          );

          if (!rpcError && rpcUsers) {
            usersWithEmails = rpcUsers;
          } else if (rpcError) {
            console.warn("RPC Error fetching users:", rpcError);
          }
        } catch (e) {
          console.warn("Could not fetch users via RPC, falling back to profiles only.", e);
        }

        const vendorProfiles = (vendorsRes.data || []) as any[];
        const vendorsWithEmails = vendorProfiles
          .filter((vp) => vp && vp.id)
          .map((vp) => {
            const userList = usersWithEmails.length > 0 ? usersWithEmails : allUsers;
            const user = (userList as any[]).find((u) => u && u.id === vp.id);
            return {
              ...vp,
              email: user?.email || "",
            };
          });

        setOrders(allOrders);
        setMessages(allMessages);
        setUsers(usersWithEmails.length > 0 ? usersWithEmails : allUsers);

        const vendorsWithStreams = vendorsWithEmails.map((v) => ({
          ...v,
          stream: allStreams.find((s: any) => s.vendor_id === v.id),
        }));
        setVendors(vendorsWithStreams);

        const productsData = (productsRes.data || []).map((p: any) => ({
          ...p,
          vendor: p.vendor_profiles || null,
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
    const { error } = await (supabase.from("orders") as any)
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) return alert("Failed: " + error.message);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    toast.success("Order status updated");
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error: itemsError } = await (supabase.from("order_items") as any)
        .delete()
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      const { error: orderError } = await (supabase.from("orders") as any)
        .delete()
        .eq("id", orderId);

      if (orderError) throw orderError;

      const deletedOrder = orders.find((o) => o.id === orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));

      setStats((prev) => ({
        ...prev,
        totalOrders: prev.totalOrders - 1,
        totalRevenue: prev.totalRevenue - Number(deletedOrder?.total || 0),
        pendingOrders:
          deletedOrder?.status === "pending" ? prev.pendingOrders - 1 : prev.pendingOrders,
      }));

      toast.success("Order deleted successfully");
    } catch (error: any) {
      console.error("Delete order error:", error);
      toast.error("Failed to delete order: " + error.message);
    }
  };

  const markMessageRead = async (msgId: string) => {
    const { error } = await (supabase.from("contact_messages") as any)
      .update({ read: true })
      .eq("id", msgId);
    if (error) return alert("Failed: " + error.message);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, read: true } : m)));
    setStats((prev) => ({ ...prev, contactMessages: prev.contactMessages - 1 }));
    toast.success("Message marked as read");
  };

  const deleteMessage = async (msgId: string) => {
    try {
      const { error } = await (supabase.from("contact_messages") as any).delete().eq("id", msgId);

      if (error) throw error;

      const deletedMsg = messages.find((m) => m.id === msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));

      if (deletedMsg && !deletedMsg.read) {
        setStats((prev) => ({
          ...prev,
          contactMessages: prev.contactMessages - 1,
        }));
      }

      toast.success("Message deleted successfully");
    } catch (error: any) {
      console.error("Delete message error:", error);
      toast.error("Failed to delete message: " + error.message);
    }
  };

  const toggleVendorApproval = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await (supabase.from("vendor_profiles") as any)
      .update({ is_approved: !currentStatus })
      .eq("id", vendorId);
    if (error) return alert("Failed: " + error.message);
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, is_approved: !currentStatus } : v)),
    );
    toast.success(currentStatus ? "Vendor revoked" : "Vendor approved");
  };

  const toggleProductStatus = async (productId: number, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "archived" : "published";
    const { error } = await (supabase.from("products") as any)
      .update({ status: newStatus })
      .eq("id", productId);
    if (error) return alert("Failed: " + error.message);
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p)));
    toast.success(`Product ${newStatus}`);
  };

  const generateProductDescriptionAI = async () => {
    if (!productForm.title) {
      toast.error("Please enter a product title first to guide the AI");
      return;
    }
    setGeneratingProductDesc(true);
    const toastId = toast.loading("AI is writing your product description...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-content", {
        body: { title: productForm.title, type: "product" },
      });

      if (error) {
        if (error.context) {
          try {
            const body = await error.context.json();
            if (body?.error) {
              throw new Error(body.error);
            }
          } catch (e) {}
        }
        throw error;
      }

      if (data?.content) {
        setProductForm((prev) => ({ ...prev, description: data.content }));
        toast.success("AI Product description generated!", { id: toastId });
      } else {
        throw new Error("No description returned from AI service");
      }
    } catch (err: any) {
      console.error("AI Description Error:", err);
      toast.error(err.message || "Failed to generate description", { id: toastId });
    } finally {
      setGeneratingProductDesc(false);
    }
  };

  const generateProductImageAI = async () => {
    if (!productForm.title) {
      toast.error("Please enter a product title first to guide the AI");
      return;
    }
    if (!productForm.vendor_id) {
      toast.error("Please select a vendor first to associate with the generated image");
      return;
    }
    setGeneratingProductImg(true);
    const toastId = toast.loading("AI is designing a product image...");
    try {
      const cleanDesc = productForm.description.replace(/<[^>]*>/g, ' ').substring(0, 1000);
      const { data, error } = await supabase.functions.invoke("generate-ai-image", {
        body: {
          prompt: `${productForm.title} ${cleanDesc}`.trim(),
          author_id: productForm.vendor_id
        },
      });

      if (error) {
        let errMsg = "AI image generation failed";
        try {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            if (body?.error) {
              errMsg = body.error;
            }
          } else if (error.message) {
            errMsg = error.message;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        setProductForm((prev) => ({ ...prev, image_url: data.url }));
        toast.success("AI Product image generated!", { id: toastId });
      } else {
        throw new Error("No image URL returned from AI service");
      }
    } catch (err: any) {
      console.error("AI Image Error:", err);
      toast.error(err.message || "Failed to generate image", { id: toastId });
    } finally {
      setGeneratingProductImg(false);
    }
  };

  const handleProductUpload = async (file: File) => {
    if (!productForm.vendor_id) {
      toast.error("Please select a vendor first to associate with the uploaded image");
      return;
    }
    setUploadingProductImg(true);
    try {
      const url = await uploadMedia(file, `products/${productForm.vendor_id}`);
      if (url) {
        setProductForm((prev) => ({ ...prev, image_url: url }));
        toast.success("Product image uploaded successfully!");
      }
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploadingProductImg(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.vendor_id) {
      toast.error("Please select a vendor");
      return;
    }
    setSavingProduct(true);
    const toastId = toast.loading("Saving product...");

    try {
      const payload: any = {
        title: productForm.title,
        price: parseFloat(productForm.price) || 0,
        stock: productForm.product_type === "service" ? 0 : (parseInt(productForm.stock) || 0),
        image_url: productForm.image_url || null,
        content: productForm.description,
        status: productForm.status,
        brand: productForm.brand || null,
        category: productForm.category,
        product_type: productForm.product_type,
        vendor_id: productForm.vendor_id,
        updated_at: new Date().toISOString(),
      };

      if (editingProductId) {
        const { data, error } = await (supabase.from("products") as any)
          .update(payload)
          .eq("id", editingProductId)
          .select()
          .single();

        if (error) throw error;
        const updatedData = data as any;
        if (updatedData) {
          const updated = {
            ...updatedData,
            vendor: vendors.find((v) => v.id === updatedData.vendor_id),
          };
          setProducts((prev) => prev.map((p) => (p.id === editingProductId ? updated : p)));
          toast.success("Product updated successfully!", { id: toastId });
        }
      } else {
        const slug =
          productForm.title.toLowerCase().replace(/[\s\W-]+/g, "-") +
          "-" +
          Math.floor(Math.random() * 1000);
        
        const { data, error } = await supabase
          .from("products")
          .insert({ ...payload, slug } as any)
          .select()
          .single();

        if (error) throw error;
        const createdData = data as any;
        if (createdData) {
          const created = {
            ...createdData,
            vendor: vendors.find((v) => v.id === createdData.vendor_id),
          };
          setProducts((prev) => [created, ...prev]);
          toast.success("Product created successfully!", { id: toastId });
        }
      }

      setShowProductForm(false);
      setEditingProductId(null);
      setProductForm({
        title: "",
        price: "",
        stock: "50",
        image_url: "",
        description: "",
        status: "published",
        brand: "",
        category: "Supplements",
        product_type: "physical",
        vendor_id: "",
      });
    } catch (err: any) {
      console.error("Save Product Error:", err);
      toast.error(err.message || "Failed to save product", { id: toastId });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditProduct = (p: any) => {
    setProductForm({
      title: p.title || "",
      price: (p.price || 0).toString(),
      stock: (p.stock || 0).toString(),
      image_url: p.image_url || "",
      description: p.content || "",
      status: p.status || "published",
      brand: p.brand || "",
      category: p.category || "Supplements",
      product_type: p.product_type || "physical",
      vendor_id: p.vendor_id || "",
    });
    setEditingProductId(p.id);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    const productToDelete = products.find((p) => p.id === id);
    if (!productToDelete) return;

    if (!confirm(`Are you sure you want to delete "${productToDelete.title}"?`)) return;

    const toastId = toast.loading("Deleting product...");
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== id));
      
      if (productToDelete.image_url) {
        deleteMediaWithSafety(productToDelete.image_url);
      }

      toast.success("Product deleted successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Delete Product Error:", err);
      toast.error(err.message || "Failed to delete product", { id: toastId });
    }
  };

  const handleBulkResetPasswords = async () => {
    if (!users || users.length === 0) return;
    if (!confirm(`Are you sure you want to send password reset links to ALL ${users.length} users? This will allow them to access the new platform.`)) {
      return;
    }

    setBulkResetProgress({ total: users.length, current: 0, active: true });

    let successCount = 0;
    let failCount = 0;
    let current = 0;

    const resetUrl = `${window.location.origin}/login?type=recovery`;
    
    for (const user of users) {
      if (!user.email) {
        failCount++;
      } else {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: resetUrl,
          });
          if (error) throw error;
          successCount++;
        } catch (err) {
          console.error(`Failed to send reset to ${user.email}:`, err);
          failCount++;
        }
      }
      
      current++;
      setBulkResetProgress(prev => ({ ...prev, current }));
    }

    setBulkResetProgress((prev) => ({ ...prev, active: false }));
    toast.success(`Bulk reset complete!`, {
      description: `Successfully sent ${successCount} emails. ${failCount > 0 ? `${failCount} failed.` : ""}`,
      duration: 6000,
    });
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
    { id: "payouts", label: "Payouts", icon: DollarSign },
    { id: "streams", label: "Live Streams", icon: Radio },
    { id: "products", label: `Products (${products.length})`, icon: Package },
    { id: "content", label: "Content Manager", icon: FileText },
    { id: "galleries", label: "Galleries", icon: ImageIcon },
    { id: "affiliates", label: "Affiliates", icon: LinkIcon },
    { id: "popups", label: "Popups", icon: Sparkles },
    { id: "subscribers", label: `Subscribers (${stats.subscribers})`, icon: Mail },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: stats.contactMessages },
    { id: "users", label: `Users (${users.length})`, icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-border bg-card lg:block shrink-0">
        <div className="sticky top-0 flex h-full flex-col p-6">
          <div className="mb-8 px-2">
            <h2 className="text-2xl font-bold tracking-tight">LMG Admin</h2>
            <p className="text-sm text-muted-foreground mt-1">Platform Control Center</p>
          </div>

          <nav className="flex-1 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold transition-all hover:bg-accent",
                  activeTab === item.id ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs font-bold">
                    {item.badge}
                  </Badge>
                )}
                {activeTab === item.id && <ChevronRight className="ml-auto h-5 w-5" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-base font-semibold text-muted-foreground hover:text-destructive py-2.5"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-5 w-5" />
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
                <h2 className="text-2xl font-bold">Admin Menu</h2>
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
                      "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-lg font-semibold transition-all",
                      activeTab === item.id
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-6 mt-0 border-0 p-0">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Dashboard Overview
                </h1>
                <p className="text-muted-foreground">Quick snapshot of platform activity.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: "Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
                  {
                    label: "Orders",
                    value: stats.totalOrders,
                    icon: ShoppingBag,
                    color: "text-emerald-500",
                  },
                  {
                    label: "Revenue",
                    value: `$${stats.totalRevenue.toLocaleString()}`,
                    icon: LayoutDashboard,
                    color: "text-amber-500",
                  },
                  {
                    label: "Pending",
                    value: stats.pendingOrders,
                    icon: ChevronRight,
                    color: "text-red-500",
                  },
                  {
                    label: "Messages",
                    value: stats.contactMessages,
                    icon: Mail,
                    color: "text-indigo-500",
                  },
                  {
                    label: "Subscribers",
                    value: stats.subscribers,
                    icon: Users,
                    color: "text-pink-500",
                  },
                ].map((stat) => (
                  <Card key={stat.label} className="overflow-hidden border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {stat.label}
                          </p>
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
                        <div
                          key={order.id}
                          className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {order.first_name} {order.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">${Number(order.total).toFixed(2)}</p>
                            <Badge
                              variant="outline"
                              className={cn("mt-1 text-[10px]", getStatusColor(order.status))}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={() => setActiveTab("orders")}
                      >
                        View all orders
                      </Button>
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
                        <div
                          key={msg.id}
                          className="flex items-start gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{msg.subject}</p>
                            <p className="text-xs text-muted-foreground truncate">{msg.name}</p>
                          </div>
                          {!msg.read && (
                            <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" />
                          )}
                        </div>
                      ))}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={() => setActiveTab("messages")}
                      >
                        View all messages
                      </Button>
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
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      No orders found.
                    </p>
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
                            <tr
                              key={order.id}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                            >
                              <td className="py-4 font-mono text-xs">
                                {order.id.slice(0, 8).toUpperCase()}
                              </td>
                              <td className="py-4 font-medium">
                                {order.first_name} {order.last_name}
                              </td>
                              <td className="py-4 hidden sm:table-cell text-muted-foreground">
                                {order.email}
                              </td>
                              <td className="py-4 font-bold text-primary">
                                ${Number(order.total).toFixed(2)}
                              </td>
                              <td className="py-4">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                    getStatusColor(order.status),
                                  )}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-4 hidden lg:table-cell text-muted-foreground text-xs">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-4 text-right flex items-center justify-end gap-2">
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

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete
                                        the order for {order.first_name} {order.last_name} and all
                                        associated items.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteOrder(order.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      No vendors registered.
                    </p>
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
                          {vendors.map((v) => (
                            <tr
                              key={v.id}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                            >
                              <td className="py-4 font-medium">{v.store_name}</td>
                              <td className="py-4 hidden sm:table-cell text-muted-foreground text-xs">
                                {new Date(v.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-4">
                                <Badge
                                  variant={v.is_approved ? "default" : "destructive"}
                                  className="text-[10px] font-bold uppercase tracking-tight"
                                >
                                  {v.is_approved ? "Approved" : "Pending"}
                                </Badge>
                              </td>
                              <td className="py-4 text-right flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingVendorProducts(v);
                                  }}
                                >
                                  <Package className="h-4 w-4 mr-1 text-muted-foreground" />{" "}
                                  Products
                                </Button>
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

            {/* PAYOUTS */}
            <TabsContent value="payouts" className="mt-0 border-0 p-0">
              {activeTab === "payouts" && <AdminPayoutsTab />}
            </TabsContent>

            {/* PRODUCTS */}
            <TabsContent value="products" className="mt-0 border-0 p-0">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
                  <p className="text-muted-foreground">Monitor and manage products across all vendors.</p>
                </div>
                {!showProductForm && (
                  <Button
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({
                        title: "",
                        price: "",
                        stock: "50",
                        image_url: "",
                        description: "",
                        status: "published",
                        brand: "",
                        category: "Supplements",
                        product_type: "physical",
                        vendor_id: "",
                      });
                      setShowProductForm(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                )}
              </div>

              {showProductForm ? (
                <Card className="border-border/50 animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>
                        {editingProductId ? "Edit Product" : "Create New Product"}
                      </CardTitle>
                      <CardDescription>
                        Fill in product details and select which vendor sells it.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setShowProductForm(false)}
                      className="text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Cancel
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveProduct} className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Select Vendor</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={productForm.vendor_id}
                          onChange={(e) => setProductForm({ ...productForm, vendor_id: e.target.value })}
                          required
                        >
                          <option value="">Select a vendor...</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.store_name || "Unknown"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label>Product Title / Name</Label>
                        <Input
                          required
                          value={productForm.title}
                          onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                          placeholder="e.g. Organic Hemp Seed Oil"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Marketplace Category</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        >
                          {["Supplements", "Equipment", "Food", "Books", "Digital", "Services"].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          placeholder="e.g. 29.99"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Brand</Label>
                        <Input
                          value={productForm.brand}
                          onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                          placeholder="e.g. Wellness Co."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Product Type</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={productForm.product_type}
                          onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value as any })}
                        >
                          <option value="physical">Physical Product</option>
                          <option value="service">Service / Booking</option>
                          <option value="digital">Digital Download</option>
                        </select>
                      </div>

                      {productForm.product_type !== "service" && (
                        <div className="space-y-2">
                          <Label>Inventory Stock</Label>
                          <Input
                            type="number"
                            required
                            value={productForm.stock}
                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={productForm.status}
                          onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label>Product Cover Image URL</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={productForm.image_url}
                            onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                            placeholder="https://..."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateProductImageAI}
                            disabled={generatingProductImg}
                            className="h-10 text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold gap-1.5 shrink-0"
                            title="Generate Image with AI"
                          >
                            {generatingProductImg ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            Generate Image
                          </Button>
                          <label className="shrink-0">
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-10"
                              asChild
                              disabled={uploadingProductImg}
                            >
                              <span>
                                {uploadingProductImg ? "..." : <ImageIcon className="h-4 w-4" />}
                              </span>
                            </Button>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) =>
                                e.target.files?.[0] && handleProductUpload(e.target.files[0])
                              }
                            />
                          </label>
                        </div>
                        {productForm.image_url && (
                          <div className="mt-2 h-32 w-32 rounded-lg overflow-hidden border border-border bg-muted">
                            <img src={productForm.image_url} className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>Product Description</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateProductDescriptionAI}
                            disabled={generatingProductDesc}
                            className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 font-semibold gap-1.5"
                          >
                            {generatingProductDesc ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            Write with AI
                          </Button>
                        </div>
                        <Textarea
                          rows={6}
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          placeholder="Tell customers about the product..."
                        />
                      </div>

                      <div className="flex gap-2 sm:col-span-2 pt-2">
                        <Button type="submit" disabled={savingProduct} className="min-w-[120px]">
                          {savingProduct ? "Saving..." : "Save Details"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowProductForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    {products.length === 0 ? (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        No products found.
                      </p>
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
                            {products.map((p) => (
                              <tr
                                key={p.id}
                                className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                              >
                                <td className="py-4 font-medium flex items-center gap-3">
                                  <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                                    {p.image_url ? (
                                      <img src={p.image_url} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/40 font-bold">
                                        IMG
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold">{p.title}</p>
                                    {p.brand && <p className="text-[10px] text-muted-foreground">{p.brand}</p>}
                                  </div>
                                </td>
                                <td className="py-4 text-muted-foreground text-xs">
                                  {p.vendor?.store_name || "Unknown"}
                                </td>
                                <td className="py-4 font-bold text-primary">${(p.price || 0).toFixed(2)}</td>
                                <td className="py-4">
                                  <Badge
                                    variant={p.status === "published" ? "outline" : "secondary"}
                                    className="text-[10px] font-bold uppercase tracking-tight"
                                  >
                                    {p.status}
                                  </Badge>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditProduct(p)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => toggleProductStatus(p.id, p.status)}
                                    >
                                      {p.status === "published" ? "Take Down" : "Restore"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive hover:bg-destructive/5"
                                      onClick={() => handleDeleteProduct(p.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* GALLERIES */}
            <TabsContent value="galleries" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Gallery Manager</h1>
                <p className="text-muted-foreground">Manage Memes and Charts collections.</p>
              </div>
              {activeTab === "galleries" && <AdminGalleriesTab />}
            </TabsContent>

            {/* CONTENT MANAGER */}
            <TabsContent value="content" forceMount className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Content Manager</h1>
                <p className="text-muted-foreground">Approve articles, recipes, and videos.</p>
              </div>
              <AdminContentTab vendors={vendors} userId={user?.id} />
            </TabsContent>

            {/* MESSAGES */}
            <TabsContent value="messages" className="mt-0 border-0 p-0 space-y-4">
              <div className="mb-6 flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Contact Messages</h1>
                <p className="text-muted-foreground">Respond to user inquiries and support.</p>
              </div>
              {messages.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    No messages found.
                  </CardContent>
                </Card>
              ) : (
                messages.map((msg) => (
                  <Card
                    key={msg.id}
                    className={cn(
                      "border-border/50",
                      msg.read
                        ? "opacity-60 grayscale-[0.5]"
                        : "border-primary/20 bg-primary/5 shadow-sm",
                    )}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-foreground">{msg.subject}</h3>
                            {!msg.read && (
                              <Badge
                                variant="destructive"
                                className="h-5 px-1.5 text-[10px] font-black uppercase tracking-wider"
                              >
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-medium text-primary">
                            {msg.name}{" "}
                            <span className="text-muted-foreground font-normal">({msg.email})</span>
                          </p>
                          <Separator className="my-3 opacity-20" />
                          <p className="text-sm text-foreground/80 leading-relaxed bg-background/50 p-3 rounded-md border border-border/30">
                            {msg.message}
                          </p>
                          <p className="mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                          {!msg.read && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => markMessageRead(msg.id)}
                              className="shadow-lg h-9"
                            >
                              Mark Read
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 h-9"
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete message?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove the message from {msg.name}. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMessage(msg.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* USERS */}
            <TabsContent value="users" className="mt-0 border-0 p-0">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold tracking-tight">User Directory</h1>
                  <p className="text-muted-foreground">Monitor all registered platform users.</p>
                </div>
                <div className="flex items-center gap-2">
                  {bulkResetProgress.active && (
                    <div className="flex items-center gap-2 mr-4">
                      <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{
                            width: `${(bulkResetProgress.current / bulkResetProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {bulkResetProgress.current}/{bulkResetProgress.total}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleBulkResetPasswords}
                    disabled={bulkResetProgress.active || users.length === 0}
                  >
                    {bulkResetProgress.active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Bulk Password Reset
                  </Button>
                </div>
              </div>
              <Card>
                <CardContent className="pt-6">
                  {users.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      No users registered.
                    </p>
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
                            <tr
                              key={u.id}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                            >
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary shadow-inner">
                                    {(u.full_name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold">{u.full_name || "Guest User"}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {u.email || (u.id ? u.id.slice(0, 8) : "---")}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <Badge
                                  variant={
                                    u.role === "admin"
                                      ? "default"
                                      : u.role === "vendor"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className="text-[10px] font-bold uppercase tracking-tight"
                                >
                                  {u.role}
                                </Badge>
                              </td>
                              <td className="py-4 text-muted-foreground text-xs">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : "---"}
                              </td>
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
                  <CardDescription>
                    Manage Mux credentials and live status for all vendors.
                  </CardDescription>
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
                          <tr
                            key={v.id}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                          >
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
                                <Badge variant="destructive" className="animate-pulse">
                                  LIVE
                                </Badge>
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

            {/* MARKETING AUTOMATION */}
            <TabsContent value="affiliates" className="mt-0 border-0 p-0">
              {activeTab === "affiliates" && <AffiliatesTab />}
            </TabsContent>


            {/* SUBSCRIBERS */}
            <TabsContent value="subscribers" className="space-y-6 mt-0 border-0 p-0">
              {activeTab === "subscribers" && <AdminSubscribersTab />}
            </TabsContent>

            {/* POPUPS */}
            <TabsContent value="popups" className="space-y-6 mt-0 border-0 p-0">
              {activeTab === "popups" && <AdminPopupsTab />}
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
            supabase
              .from("vendor_profiles")
              .select(
                "id, store_name, representative_name, vendor_type, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, created_at, updated_at, ai_enabled, ai_instructions, commission_rate",
              )
              .order("created_at", { ascending: false })
              .then(({ data }) => {
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
            supabase
              .from("profiles")
              .select("*")
              .order("created_at", { ascending: false })
              .then(({ data }) => {
                if (data) setUsers(data);
              });
          }}
        />
      )}

      {editingVendorProducts && (
        <Dialog
          open={!!editingVendorProducts}
          onOpenChange={(open) => !open && setEditingVendorProducts(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Products for {editingVendorProducts.store_name}</DialogTitle>
            </DialogHeader>
            <ProductsTab
              products={products.filter((p) => p.vendor_id === editingVendorProducts.id)}
              setProducts={(action) => {
                setProducts((prev) => {
                  const vendorProducts = prev.filter(
                    (p) => p.vendor_id === editingVendorProducts.id,
                  );
                  const updatedVendorProducts =
                    typeof action === "function" ? action(vendorProducts) : action;
                  const otherProducts = prev.filter(
                    (p) => p.vendor_id !== editingVendorProducts.id,
                  );
                  return [...otherProducts, ...updatedVendorProducts];
                });
              }}
              userId={editingVendorProducts.id}
              storeCategories={editingVendorProducts.store_categories || []}
              vendorType={editingVendorProducts.vendor_type}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
