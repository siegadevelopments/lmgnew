import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Image as ImageIcon, Loader2, Upload, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { deleteMediaWithSafety, uploadMedia } from "@/lib/upload";

export function AdminGalleriesTab() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryCategory, setNewGalleryCategory] = useState<"memes" | "charts" | "vendor_gallery">("memes");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<any>("memes");
  
  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [visibleCount, setVisibleCount] = useState(20);

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

  async function addImagesToGallery(galleryId: string, imageUrls: string[]) {
    const validUrls = imageUrls.filter(url => url.trim());
    if (validUrls.length === 0) return;

    const { error } = await (supabase.from("gallery_items") as any).insert(
      validUrls.map(url => ({
        gallery_id: galleryId,
        image_url: url,
      }))
    );

    if (error) {
      toast.error("Failed to add image(s)");
    } else {
      toast.success(validUrls.length === 1 ? "Image added!" : `${validUrls.length} images added!`);
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

  async function updateGallery() {
    if (!editingId || !editTitle.trim()) return;

    const { error } = await (supabase.from("galleries") as any)
      .update({ title: editTitle, category: editCategory })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update gallery");
    } else {
      toast.success("Gallery updated!");
      setEditingId(null);
      loadGalleries();
    }
  }

  const filteredGalleries = galleries.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedGalleries = filteredGalleries.slice(0, visibleCount);

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

            <div className="relative">
              <Button
                variant="default"
                className="relative overflow-hidden"
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload & Group
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0 || !newGalleryTitle.trim()) {
                      if (!newGalleryTitle.trim()) toast.error("Enter a title first");
                      return;
                    }
                    
                    setIsUploading(true);
                    const toastId = toast.loading(`Uploading 1 of ${files.length} images...`);
                    try {
                      const trimmedTitle = newGalleryTitle.trim();
                      
                      // 1. Check if gallery exists in local state first
                      let gallery = galleries.find(g => 
                        g.title.trim().toLowerCase() === trimmedTitle.toLowerCase() && 
                        g.category === newGalleryCategory
                      );
                      
                      let galleryId = gallery?.id;
                      
                      // 1b. Double check DB if not in state (prevent race conditions)
                      if (!galleryId) {
                        const { data: dbG } = await (supabase.from("galleries") as any)
                          .select("id")
                          .ilike("title", trimmedTitle)
                          .eq("category", newGalleryCategory)
                          .maybeSingle();
                        if (dbG) galleryId = dbG.id;
                      }
                      
                      // 2. Create if not exists
                      if (!galleryId) {
                        const { data: newG, error: gError } = await (supabase.from("galleries") as any)
                          .insert({ 
                            title: trimmedTitle, 
                            category: newGalleryCategory,
                            vendor_id: newGalleryCategory === "vendor_gallery" ? selectedVendorId || null : null
                          })
                          .select()
                          .single();
                        if (gError) throw gError;
                        galleryId = newG.id;
                      }
                      
                      // 3. Upload and save all files
                      const uploadedUrls: string[] = [];
                      for (let i = 0; i < files.length; i++) {
                        toast.loading(`Uploading ${i + 1} of ${files.length} images...`, { id: toastId });
                        const url = await uploadMedia(files[i], "admin_uploads");
                        if (url) {
                          uploadedUrls.push(url);
                        }
                      }

                      if (uploadedUrls.length > 0) {
                        const { error: itemsError } = await (supabase.from("gallery_items") as any).insert(
                          uploadedUrls.map(url => ({
                            gallery_id: galleryId,
                            image_url: url
                          }))
                        );
                        if (itemsError) throw itemsError;
                        toast.success(
                          uploadedUrls.length === 1 
                            ? "Image added to gallery!" 
                            : `${uploadedUrls.length} images added to gallery!`,
                          { id: toastId }
                        );
                      } else {
                        toast.error("No images were successfully uploaded", { id: toastId });
                      }
                      setNewGalleryTitle("");
                      loadGalleries();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to upload", { id: toastId });
                    } finally {
                      setIsUploading(false);
                      e.target.value = "";
                      toast.dismiss(toastId);
                    }
                  }}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Input
          placeholder="Search galleries by title or category..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(pageSize); // Reset pagination on search
          }}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex py-20 justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {displayedGalleries.map((gallery) => (
            <Card key={gallery.id}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                {editingId === gallery.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2 mr-4">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                    >
                      <option value="memes">Memes</option>
                      <option value="charts">Charts</option>
                      <option value="vendor_gallery">Vendor Gallery</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <CardTitle className="text-lg">{gallery.title}</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase">{gallery.category}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  {editingId === gallery.id ? (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={updateGallery}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setEditingId(gallery.id);
                          setEditTitle(gallery.title);
                          setEditCategory(gallery.category);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteGallery(gallery.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL (separate multiple by commas or spaces)"
                    className="flex-1 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const urls = e.currentTarget.value
                          .split(/[,\s]+/)
                          .map(url => url.trim())
                          .filter(Boolean);
                        addImagesToGallery(gallery.id, urls);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                      if (input) {
                        const urls = input.value
                          .split(/[,\s]+/)
                          .map(url => url.trim())
                          .filter(Boolean);
                        addImagesToGallery(gallery.id, urls);
                        input.value = "";
                      }
                    }}
                  >
                    Add URL
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="relative overflow-hidden"
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        setIsUploading(true);
                        const toastId = toast.loading(`Uploading 1 of ${files.length} images...`);
                        try {
                          const uploadedUrls: string[] = [];
                          for (let i = 0; i < files.length; i++) {
                            toast.loading(`Uploading ${i + 1} of ${files.length} images...`, { id: toastId });
                            const url = await uploadMedia(files[i], "admin_uploads");
                            if (url) {
                              uploadedUrls.push(url);
                            }
                          }
                          if (uploadedUrls.length > 0) {
                            toast.dismiss(toastId);
                            await addImagesToGallery(gallery.id, uploadedUrls);
                          } else {
                            toast.error("No images were successfully uploaded", { id: toastId });
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Failed to upload images", { id: toastId });
                        } finally {
                          setIsUploading(false);
                          e.target.value = "";
                          toast.dismiss(toastId);
                        }
                      }}
                    />
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

      {!loading && filteredGalleries.length > visibleCount && (
        <div className="flex justify-center py-8">
          <Button 
            variant="outline" 
            onClick={() => setVisibleCount(prev => prev + pageSize)}
            className="w-full max-w-xs"
          >
            Load More Galleries ({filteredGalleries.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
