import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia, deleteMediaWithSafety } from "@/lib/upload";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AvailabilityManager } from "./AvailabilityManager";

interface Product {
  id: number;
  title: string;
  price: number;
  stock: number;
  status: string;
  image_url: string | null;
  content?: string;
  variants?: any[];
  brand?: string;
  category?: string;
  store_category?: string;
  product_type?: "physical" | "service" | "digital";
}

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  userId: string;
  storeCategories?: string[];
  vendorType?: "products" | "services" | "both";
}

export function ProductsTab({
  products,
  setProducts,
  userId,
  storeCategories = [],
  vendorType = "products",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [managingAvailability, setManagingAvailability] = useState<number | null>(null);
  const [form, setForm] = useState({
    id: 0,
    title: "",
    price: "",
    stock: "50",
    image_url: "",
    video_url: "",
    description: "",
    status: "draft",
    variants: [] as any[],
    brand: "",
    category: vendorType === "services" ? "Services" : "Supplements",
    store_category: "",
    product_type: (vendorType === "services" ? "service" : "physical") as
      | "physical"
      | "service"
      | "digital",
  });

  // Re-sync default product type if vendorType changes
  useEffect(() => {
    if (!editing) {
      setForm(prev => ({
        ...prev,
        product_type: (vendorType === "services" ? "service" : "physical"),
        category: vendorType === "services" ? "Services" : "Supplements"
      }));
    }
  }, [vendorType, editing]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const globalCategories = ["Supplements", "Equipment", "Food", "Books", "Digital", "Services"];

  const handleUpload = async (file: File, field: "image_url" | "video_url") => {
    setUploading(field);
    try {
      const url = await uploadMedia(file, `products/${userId}`);
      if (url) {
        setForm({ ...form, [field]: url });
        toast.success("File uploaded!");
      }
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: any = {
        title: form.title,
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        image_url: form.image_url || null,
        content: form.description,
        status: form.id ? form.status : "published",
        variants: form.variants,
        brand: form.brand || null,
        category: form.category,
        store_category: form.store_category || null,
        product_type: form.product_type,
        updated_at: new Date().toISOString(),
      };

      if (form.video_url) {
        // Simple way to append video, though ideally it should be a separate field
        if (!payload.content?.includes(form.video_url)) {
          const isMts = /\.(mts)(\?|$)/i.test(form.video_url);
          const mtsNote = isMts 
            ? `<p style="font-size: 10px; color: #666; margin-top: 4px;">Note: .MTS files may not play in all browsers. If it doesn't load, please use Chrome or convert to MP4.</p>` 
            : "";
          payload.content =
            (payload.content || "") +
            `\n<video src="${form.video_url}" controls class="w-full rounded-lg mt-4"></video>${mtsNote}`;
        }
      }

      if (form.id) {
        const { data, error } = await (supabase.from("products") as any)
          .update(payload)
          .eq("id", form.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setProducts(products.map((p) => (p.id === form.id ? (data as Product) : p)));
          toast.success("Product updated!");
        }
      } else {
        const slug =
          form.title.toLowerCase().replace(/[\s\W-]+/g, "-") +
          "-" +
          Math.floor(Math.random() * 1000);
        const { data, error } = await supabase
          .from("products")
          .insert({ ...payload, vendor_id: userId, slug } as any)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setProducts([data as Product, ...products]);
          toast.success("Product created!");
        }
      }

      setEditing(false);
      setForm({
        id: 0,
        title: "",
        price: "",
        stock: "50",
        image_url: "",
        video_url: "",
        description: "",
        status: "draft",
        variants: [],
        brand: "",
        category: vendorType === "services" ? "Services" : "Supplements",
        store_category: "",
        product_type: vendorType === "services" ? "service" : "physical",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p: Product) => {
    setForm({
      id: p.id,
      title: p.title,
      price: p.price.toString(),
      stock: p.stock.toString(),
      image_url: p.image_url || "",
      video_url: "",
      description: (p as any).content || "",
      status: p.status,
      variants: p.variants || [],
      brand: (p as any).brand || "",
      category: p.category || "Supplements",
      store_category: p.store_category || "",
      product_type: p.product_type || "physical",
    });
    setEditing(true);
  };

  const handleDelete = async (id: number) => {
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) return;

    if (!confirm(`Delete "${productToDelete.title}"?`)) return;
    
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      
      setProducts(products.filter((p) => p.id !== id));
      
      if (productToDelete.image_url) {
        deleteMediaWithSafety(productToDelete.image_url);
      }

      toast.success("Product deleted and storage cleanup initiated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleStatus = async (id: number, current: string) => {
    const s = current === "published" ? "draft" : "published";
    try {
      const { error } = await (supabase.from("products") as any).update({ status: s }).eq("id", id);
      if (error) throw error;
      setProducts(products.map((p) => (p.id === id ? { ...p, status: s } : p)));
      toast.success(`Product ${s === "published" ? "published" : "moved to draft"}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{vendorType === "services" ? "Services" : "Catalog"}</CardTitle>
          <CardDescription>
            Manage your {vendorType === "services" ? "services" : "products"}
          </CardDescription>
        </div>
        {!editing && !managingAvailability && (
          <Button
            onClick={() => {
              setForm({
                id: 0,
                title: "",
                price: "",
                stock: "50",
                image_url: "",
                video_url: "",
                description: "",
                status: "draft",
                variants: [],
                brand: "",
                category: vendorType === "services" ? "Services" : "Supplements",
                store_category: "",
                product_type: vendorType === "services" ? "service" : "physical",
              });
              setEditing(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />{" "}
            {vendorType === "services" ? "Add Service" : "Add Product"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {managingAvailability && (
          <div className="mb-8">
            <AvailabilityManager
              productId={managingAvailability}
              vendorId={userId}
              onClose={() => setManagingAvailability(null)}
            />
          </div>
        )}

        {editing && (
          <div className="mb-8 rounded-xl border border-primary/20 p-6 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-lg font-bold mb-4">
              {form.id
                ? vendorType === "both"
                  ? `Edit ${form.product_type === "service" ? "Service" : "Product"}`
                  : vendorType === "services"
                    ? "Edit Service"
                    : "Edit Product"
                : vendorType === "both"
                  ? `New ${form.product_type === "service" ? "Service" : "Product"}`
                  : vendorType === "services"
                    ? "New Service"
                    : "New Product"}
            </h3>
            {vendorType === "both" && !form.id && (
              <div className="space-y-2 sm:col-span-2 mb-2">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Listing Type
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={form.product_type === "physical" ? "default" : "outline"}
                    className="h-10"
                    onClick={() => setForm({ ...form, product_type: "physical", category: "Supplements" })}
                  >
                    Physical Product
                  </Button>
                  <Button
                    type="button"
                    variant={form.product_type === "service" ? "default" : "outline"}
                    className="h-10"
                    onClick={() => setForm({ ...form, product_type: "service", category: "Services" })}
                  >
                    Service / Booking
                  </Button>
                </div>
              </div>
            )}
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{vendorType === "both" ? (form.product_type === "service" ? "Service Name" : "Product Title") : (vendorType === "services" ? "Service Name" : "Product Title")}</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    vendorType === "services"
                      ? "e.g. 1-on-1 Consultation"
                      : "e.g. Organic Herbal Tea"
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Marketplace Category</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {globalCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Store Category (Optional)</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.store_category}
                  onChange={(e) => setForm({ ...form, store_category: e.target.value })}
                >
                  <option value="">Default (No category)</option>
                  {storeCategories.map((c) => (
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
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. Wellness Co."
                />
              </div>
              {form.product_type !== "service" && (
                <div className="space-y-2">
                  <Label>Inventory Stock</Label>
                  <Input
                    type="number"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{vendorType === "services" ? "Listing Type" : "Product Type"}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.product_type}
                  onChange={(e) => setForm({ ...form, product_type: e.target.value as any })}
                >
                  <option value="physical">Physical Product</option>
                  <option value="service">Service / Booking</option>
                  <option value="digital">Digital Download</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>{vendorType === "services" ? "Cover Image" : "Product Image"}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="URL or upload"
                    className="flex-1"
                  />
                  <label className="shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      asChild
                      disabled={uploading === "image_url"}
                    >
                      <span>
                        {uploading === "image_url" ? "..." : <ImageIcon className="h-4 w-4" />}
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] && handleUpload(e.target.files[0], "image_url")
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Full Description</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-4 sm:col-span-2 rounded-xl border border-border p-4 bg-background">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">Product Variants</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm({
                        ...form,
                        variants: [
                          ...form.variants,
                          {
                            id: crypto.randomUUID(),
                            title: "",
                            price: form.price,
                            stock: form.stock,
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="mr-2 h-3 w-3" /> Add Variant
                  </Button>
                </div>
                {form.variants.length > 0 ? (
                  <div className="space-y-3">
                    {form.variants.map((v, idx) => (
                      <div
                        key={v.id}
                        className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <div className="sm:col-span-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Option (e.g. 1L, Small, Blue)
                          </Label>
                          <Input
                            value={v.title}
                            onChange={(e) => {
                              const newVariants = [...form.variants];
                              newVariants[idx].title = e.target.value;
                              setForm({ ...form, variants: newVariants });
                            }}
                            placeholder="Variant title"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Price
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={v.price}
                            onChange={(e) => {
                              const newVariants = [...form.variants];
                              newVariants[idx].price = e.target.value;
                              setForm({ ...form, variants: newVariants });
                            }}
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                              Stock
                            </Label>
                            <Input
                              type="number"
                              value={v.stock}
                              onChange={(e) => {
                                const newVariants = [...form.variants];
                                newVariants[idx].stock = e.target.value;
                                setForm({ ...form, variants: newVariants });
                              }}
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              const newVariants = form.variants.filter((_, i) => i !== idx);
                              setForm({ ...form, variants: newVariants });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2 italic">
                    No variants added. The base price and stock will be used.
                  </p>
                )}
              </div>
              <div className="flex gap-2 sm:col-span-2 pt-2">
                <Button type="submit" disabled={submitting} className="min-w-[120px]">
                  {submitting ? "Saving..." : "Save Details"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 font-bold uppercase text-[10px] tracking-wider">
                  {vendorType === "services" ? "Service" : "Product"}
                </th>
                <th className="pb-3 font-bold uppercase text-[10px] tracking-wider">Category</th>
                <th className="pb-3 font-bold uppercase text-[10px] tracking-wider">Price</th>
                <th className="pb-3 font-bold uppercase text-[10px] tracking-wider">
                  Stock/Status
                </th>
                <th className="pb-3 font-bold uppercase text-[10px] tracking-wider">Visibility</th>
                <th className="pb-3 font-bold uppercase text-[10px] tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && !editing && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
                    No {vendorType === "services" ? "services" : "products"} yet. Click "Add{" "}
                    {vendorType === "services" ? "Service" : "Product"}" to get started.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-all group"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/30 font-bold">
                            IMG
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {p.title}
                        </p>
                        {p.brand && <p className="text-[10px] text-muted-foreground">{p.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">{p.category || "General"}</p>
                      {p.store_category && (
                        <p className="text-[10px] text-primary bg-primary/5 px-1.5 py-0.5 rounded inline-block">
                          {p.store_category}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 font-bold text-foreground">${(p.price || 0).toFixed(2)}</td>
                  <td className="py-4">
                    {p.product_type === "service" ? (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        Service
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold",
                          (p.stock || 0) <= 5
                            ? "bg-red-100 text-red-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {p.stock || 0} in stock
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.status === "published"}
                        onCheckedChange={() => toggleStatus(p.id, p.status)}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          p.status === "published" ? "text-green-600" : "text-amber-600",
                        )}
                      >
                        {p.status || "draft"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {p.product_type === "service" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary/80"
                          title="Manage Availability"
                          onClick={() => setManagingAvailability(p.id)}
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
