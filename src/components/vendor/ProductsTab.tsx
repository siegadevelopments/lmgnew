import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";

interface Product {
  id: number; title: string; price: number; stock: number; status: string; image_url: string | null;
  content?: string;
}

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  userId: string;
}

export function ProductsTab({ products, setProducts, userId }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ id: 0, title: "", price: "", stock: "50", image_url: "", video_url: "", description: "", status: "draft" });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (file: File, field: "image_url" | "video_url") => {
    setUploading(field);
    const url = await uploadMedia(file, `products/${userId}`);
    if (url) setForm({ ...form, [field]: url });
    setUploading(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload: any = {
      title: form.title, price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0,
      image_url: form.image_url || null, content: form.description, status: form.id ? form.status : "published",
    };
    if (form.video_url) payload.content = (payload.content || "") + `\n<video src="${form.video_url}" controls class="w-full rounded-lg mt-4"></video>`;

    if (form.id) {
      const { data } = await (supabase.from("products") as any).update(payload).eq("id", form.id).select().single();
      if (data) setProducts(products.map(p => p.id === form.id ? data : p));
    } else {
      const slug = form.title.toLowerCase().replace(/[\s\W-]+/g, "-") + "-" + Math.floor(Math.random() * 1000);
      const { data } = await supabase.from("products").insert({ ...payload, vendor_id: userId, slug } as any).select().single();
      if (data) setProducts([data, ...products]);
    }
    setEditing(false);
    setForm({ id: 0, title: "", price: "", stock: "50", image_url: "", video_url: "", description: "", status: "draft" });
    setSubmitting(false);
  };

  const handleEdit = (p: Product) => {
    setForm({ id: p.id, title: p.title, price: p.price.toString(), stock: p.stock.toString(), image_url: p.image_url || "", video_url: "", description: (p as any).content || "", status: p.status });
    setEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter(p => p.id !== id));
  };

  const toggleStatus = async (id: number, current: string) => {
    const s = current === "published" ? "draft" : "published";
    await (supabase.from("products") as any).update({ status: s }).eq("id", id);
    setProducts(products.map(p => p.id === id ? { ...p, status: s } : p));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Catalog</CardTitle><CardDescription>Manage your products</CardDescription></div>
        {!editing && <Button onClick={() => { setForm({ id: 0, title: "", price: "", stock: "50", image_url: "", video_url: "", description: "", status: "draft" }); setEditing(true); }}>Add Product</Button>}
      </CardHeader>
      <CardContent>
        {editing && (
          <div className="mb-8 rounded-xl border border-border p-4 bg-muted/30">
            <h3 className="mb-4 font-bold">{form.id ? "Edit Product" : "New Product"}</h3>
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div className="space-y-2"><Label>Stock</Label><Input type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="flex items-center gap-2">
                  <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="URL or upload" className="flex-1" />
                  <label className="shrink-0">
                    <Button type="button" variant="secondary" size="sm" asChild disabled={uploading === "image_url"}><span>{uploading === "image_url" ? "..." : "Upload"}</span></Button>
                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "image_url")} />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Product Video (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="URL or upload" className="flex-1" />
                  <label className="shrink-0">
                    <Button type="button" variant="secondary" size="sm" asChild disabled={uploading === "video_url"}><span>{uploading === "video_url" ? "..." : "Upload"}</span></Button>
                    <input type="file" className="hidden" accept="video/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], "video_url")} />
                  </label>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 font-medium">Product</th><th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium">Stock</th><th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody>
              {products.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No products yet. Click "Add Product" to get started.</td></tr>}
              {products.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-medium flex items-center gap-2">
                    {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />}{p.title}
                  </td>
                  <td className="py-3">${p.price}</td><td className="py-3">{p.stock}</td>
                  <td className="py-3 flex items-center gap-2"><Switch checked={p.status === "published"} onCheckedChange={() => toggleStatus(p.id, p.status)} /><span className="text-xs">{p.status}</span></td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
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
