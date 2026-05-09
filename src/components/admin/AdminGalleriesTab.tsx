import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMediaWithSafety } from "@/lib/upload";

export function AdminGalleriesTab() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryCategory, setNewGalleryCategory] = useState<"memes" | "charts" | "vendor_gallery">("memes");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    loadGalleries();
    loadVendors();
  }, []);

  async function loadVendors() {
    const { data } = await supabase.from("vendor_profiles").select("id, store_name");
    setVendors(data || []);
  }

  async function loadGalleries() {
    setLoading(true);
    const { data, error } = await (supabase.from("galleries") as any)
      .select("*, gallery_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load galleries");
    } else {
      setGalleries(data || []);
    }
    setLoading(false);
  }

  async function createGallery() {
    if (!newGalleryTitle.trim()) return;

    const { data, error } = await (supabase.from("galleries") as any)
      .insert({ 
        title: newGalleryTitle, 
        category: newGalleryCategory,
        vendor_id: newGalleryCategory === "vendor_gallery" ? selectedVendorId || null : null
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create gallery");
    } else {
      toast.success("Gallery created!");
      setNewGalleryTitle("");
      loadGalleries();
    }
  }

  async function deleteGallery(id: string) {
    const gallery = galleries.find(g => g.id === id);
    if (!gallery) return;

    if (!confirm(`Are you sure? This will delete "${gallery.title}" and all its items.`)) return;

    // Capture all URLs in this gallery for cleanup
    const urlsToCleanup = (gallery.gallery_items || []).map((item: any) => item.image_url);

    const { error } = await (supabase.from("galleries") as any).delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete gallery");
    } else {
      toast.success("Gallery deleted and storage cleanup initiated");
      loadGalleries();
      
      // Safe cleanup of all items
      urlsToCleanup.forEach((url: string) => deleteMediaWithSafety(url));
    }
  }

  async function addImageToGallery(galleryId: string, imageUrl: string) {
    if (!imageUrl.trim()) return;

    const { error } = await (supabase.from("gallery_items") as any).insert({
      gallery_id: galleryId,
      image_url: imageUrl,
    });

    if (error) {
      toast.error("Failed to add image");
    } else {
      toast.success("Image added!");
      loadGalleries();
    }
  }

  async function deleteImage(itemId: string) {
    // Find the item to get its URL before deletion
    let imageUrl = "";
    for (const g of galleries) {
      const item = (g.gallery_items || []).find((i: any) => i.id === itemId);
      if (item) {
        imageUrl = item.image_url;
        break;
      }
    }

    const { error } = await (supabase.from("gallery_items") as any).delete().eq("id", itemId);
    if (error) {
      toast.error("Failed to delete image");
    } else {
      loadGalleries();
      if (imageUrl) {
        deleteMediaWithSafety(imageUrl);
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Gallery Title (e.g. Daily Motivation)"
              value={newGalleryTitle}
              onChange={(e) => setNewGalleryTitle(e.target.value)}
              className="flex-1"
            />
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={newGalleryCategory}
              onChange={(e) => setNewGalleryCategory(e.target.value as any)}
            >
              <option value="memes">Memes</option>
              <option value="charts">Charts</option>
              <option value="vendor_gallery">Vendor Gallery</option>
            </select>

            {newGalleryCategory === "vendor_gallery" && (
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.store_name}
                  </option>
                ))}
              </select>
            )}

            <Button onClick={createGallery}>
              <Plus className="mr-2 h-4 w-4" /> Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex py-20 justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {galleries.map((gallery) => (
            <Card key={gallery.id}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-lg">{gallery.title}</CardTitle>
                  <p className="text-xs text-muted-foreground uppercase">{gallery.category}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteGallery(gallery.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL"
                    className="flex-1 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addImageToGallery(gallery.id, e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addImageToGallery(gallery.id, input.value);
                      input.value = "";
                    }}
                  >
                    Add Image
                  </Button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {(gallery.gallery_items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="group relative aspect-square rounded-md overflow-hidden border border-border"
                    >
                      <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => deleteImage(item.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
