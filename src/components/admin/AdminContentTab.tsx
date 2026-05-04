import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, User, FileText, Video, Utensils, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/upload";

export function AdminContentTab({ vendors }: { vendors: any[] }) {
  const [activeType, setActiveType] = useState<"articles" | "videos" | "recipes" | "products">("articles");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string>("");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState(""); // For videos
  const [category, setCategory] = useState("General");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");

  // --- Auto-Save Draft Logic ---
  useEffect(() => {
    // 1. Load drafts on mount
    const draft = localStorage.getItem("admin_content_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.imageUrl) setImageUrl(parsed.imageUrl);
        if (parsed.embedUrl) setEmbedUrl(parsed.embedUrl);
        if (parsed.activeType) setActiveType(parsed.activeType);
        if (parsed.selectedVendorId) setSelectedVendorId(parsed.selectedVendorId);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  useEffect(() => {
    // 2. Save drafts on every change
    const draft = { title, content, imageUrl, embedUrl, activeType, selectedVendorId };
    localStorage.setItem("admin_content_draft", JSON.stringify(draft));
  }, [title, content, imageUrl, embedUrl, activeType, selectedVendorId]);

  const clearDraft = () => {
    localStorage.removeItem("admin_content_draft");
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadItems() {
      setLoading(true);
      setItems([]); // Clear previous items to avoid "ghost content"
      
      try {
        const { data, error } = await (supabase
          .from(activeType) as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (isCancelled) return;

        if (error) {
          console.error(`Error loading ${activeType}:`, error);
          toast.error(`Failed to load ${activeType}`);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error(`Unexpected error loading ${activeType}:`, err);
        toast.error(`Failed to load ${activeType}`);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      isCancelled = true;
    };
  }, [activeType]);

  const loadItems = async () => {
    // This is now a manual trigger function if needed, 
    // but the effect handles the main loading logic.
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from(activeType) as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error(`Error reloading ${activeType}:`, err);
    } finally {
      setLoading(false);
    }
  };

  /** Reload list, highlight new IDs, scroll to list */
  async function refreshAndHighlight(ids: string[]) {
    await loadItems();
    if (ids.length > 0) {
      const idSet = new Set(ids);
      setNewIds(idSet);
      // Clear highlights after 4s
      setTimeout(() => setNewIds(new Set()), 4000);
      // Scroll to list
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageUrl("");
    setEmbedUrl("");
    setPrepTime("");
    setCookTime("");
    setCategory("General");
    clearDraft(); // Clear draft when manually resetting
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !selectedVendorId) {
      toast.error("Please provide a title and select a vendor");
      return;
    }

    const commonData = {
      title,
      author_id: selectedVendorId,
    };

    let result;
    if (activeType === "articles") {
      result = await (supabase.from("articles") as any).insert({
        ...commonData,
        content,
        image_url: imageUrl,
        slug: title.toLowerCase().replace(/ /g, "-"),
        category_name: category
      });
    } else if (activeType === "recipes") {
      result = await (supabase.from("recipes") as any).insert({
        ...commonData,
        content,
        image_url: imageUrl,
        slug: title.toLowerCase().replace(/ /g, "-"),
        prep_time: prepTime,
        cook_time: cookTime
      });
    } else if (activeType === "videos") {
      result = await (supabase.from("videos") as any).insert({
        title,
        description: content,
        embed_url: embedUrl,
        thumbnail_url: imageUrl,
        author_id: selectedVendorId,
        status: embedUrl.includes('video-uploads') ? 'uploading' : 'ready'
      });
    } else if (activeType === "products") {
      result = await (supabase.from("products") as any).insert({
        title,
        description: content,
        price: parseFloat(imageUrl) || 0,
        image_url: embedUrl, // Reusing embedUrl for product image in the UI form
        vendor_id: selectedVendorId,
        status: "published",
        slug: title.toLowerCase().replace(/ /g, "-")
      });
    }

    if (result?.error) {
      toast.error("Failed to save item: " + result.error.message);
    } else {
      const inserted = result as any;
      const newId = inserted?.data?.[0]?.id || inserted?.data?.id;
      toast.success("Item saved!");
      resetForm();
      clearDraft(); // Ensure draft is cleared after successful save
      await refreshAndHighlight(newId ? [newId] : []);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Are you sure?")) return;
    const { error } = await (supabase.from(activeType) as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else loadItems();
  }
  
  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await (supabase.from("videos") as any)
      .update({ is_featured: !current })
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to update featured status");
    } else {
      toast.success(!current ? "Video featured on global feed" : "Video removed from global feed");
      setItems(items.map(item => item.id === id ? { ...item, is_featured: !current } : item));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Add New Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant={activeType === "articles" ? "default" : "outline"}
                    onClick={() => setActiveType("articles")}
                    size="sm"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Article
                  </Button>
                  <Button 
                    type="button" 
                    variant={activeType === "videos" ? "default" : "outline"}
                    onClick={() => setActiveType("videos")}
                    size="sm"
                  >
                    <Video className="mr-2 h-4 w-4" /> Video
                  </Button>
                  <Button 
                    type="button" 
                    variant={activeType === "recipes" ? "default" : "outline"}
                    onClick={() => setActiveType("recipes")}
                    size="sm"
                  >
                    <Utensils className="mr-2 h-4 w-4" /> Recipe
                  </Button>
                  <Button 
                    type="button" 
                    variant={activeType === "products" ? "default" : "outline"}
                    onClick={() => setActiveType("products")}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Product
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Vendor</label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.store_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" required />
            </div>

            {activeType === "videos" ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">Video URL or Upload</label>
                {/* URL input */}
                <Input
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or paste a .mp4 URL"
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or upload a file</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {/* Single-file upload — uses label trick to avoid nested interactive elements */}
                <div className="flex gap-2">
                  <label
                    htmlFor="admin-video-single"
                    className={`flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                      uploadingVideo ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    {uploadingVideo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                    {videoUploadProgress || "Upload single video"}
                  </label>
                  <input
                    id="admin-video-single"
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    disabled={uploadingVideo}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingVideo(true);
                      setVideoUploadProgress("Uploading...");
                      try {
                        const url = await uploadMedia(file, "admin_uploads", "video-uploads");
                        if (url) {
                          setEmbedUrl(url);
                          setVideoUploadProgress("Uploaded ✓");
                          toast.success("Video uploaded — click 'Create video' to save");
                        }
                      } catch (err: any) {
                        toast.error(err.message || "Upload failed");
                        setVideoUploadProgress("");
                      }
                      setUploadingVideo(false);
                      e.target.value = "";
                    }}
                  />

                  {/* Bulk upload — multiple files, saves immediately */}
                  <label
                    htmlFor="admin-video-bulk"
                    className={`flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                      uploadingVideo || !selectedVendorId ? "pointer-events-none opacity-50" : ""
                    }`}
                    title={!selectedVendorId ? "Select a vendor first" : "Upload multiple videos at once"}
                  >
                    {uploadingVideo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Bulk upload
                  </label>
                  <input
                    id="admin-video-bulk"
                    type="file"
                    accept="video/*"
                    multiple
                    className="sr-only"
                    disabled={uploadingVideo || !selectedVendorId}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      if (!selectedVendorId) {
                        toast.error("Select a vendor first");
                        return;
                      }
                      setUploadingVideo(true);
                      const toastId = toast.loading(`Uploading ${files.length} video${files.length > 1 ? "s" : ""}...`);
                      const insertedIds: string[] = [];

                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        setVideoUploadProgress(`${i + 1}/${files.length} uploading...`);
                        try {
                          const url = await uploadMedia(file, "admin_uploads", "video-uploads");
                          if (url) {
                            const fileName = file.name.split(".").slice(0, -1).join(".");
                            const { data: inserted } = await (supabase.from("videos") as any).insert({
                              title: fileName,
                              embed_url: url,
                              author_id: selectedVendorId,
                              status: 'uploading', // Ensure status is set to trigger function
                              description: `Uploaded via admin on ${new Date().toLocaleDateString()}`,
                            }).select("id").single();
                            if (inserted?.id) insertedIds.push(inserted.id);
                          }
                        } catch (err: any) {
                          toast.error(`${file.name}: ${err.message || "Upload failed"}`);
                        }
                      }

                      toast.success(`${insertedIds.length} of ${files.length} video${files.length > 1 ? "s" : ""} saved!`, { id: toastId });
                      setVideoUploadProgress("");
                      setUploadingVideo(false);
                      await refreshAndHighlight(insertedIds);
                      e.target.value = "";
                    }}
                  />
                </div>
                {embedUrl && (
                  <p className="text-xs text-muted-foreground truncate">URL: {embedUrl}</p>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">{activeType === "products" ? "Price ($)" : "Image URL"}</label>
              <div className="flex gap-2">
                <Input 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder={activeType === "products" ? "e.g. 29.99" : "https://..."} 
                />
                {activeType !== "products" && (
                  <div className="shrink-0">
                    <Button type="button" variant="outline" size="icon" className="relative h-10 w-10 overflow-hidden" disabled={uploadingImage}>
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImage(true);
                          const url = await uploadMedia(file, "admin_uploads");
                          if (url) setImageUrl(url);
                          setUploadingImage(false);
                        }}
                      />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {activeType === "products" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <div className="flex gap-2">
                  <Input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
                  <div className="shrink-0">
                    <Button type="button" variant="outline" size="icon" className="relative h-10 w-10 overflow-hidden" disabled={uploadingImage}>
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImage(true);
                          const url = await uploadMedia(file, "admin_uploads");
                          if (url) setEmbedUrl(url);
                          setUploadingImage(false);
                        }}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeType === "recipes" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prep Time</label>
                  <Input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="e.g. 15 mins" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cook Time</label>
                  <Input value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder="e.g. 30 mins" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{activeType === "videos" ? "Description" : "Content"}</label>
              <Textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Enter content/description" 
                rows={5}
              />
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Create {activeType.slice(0, -1)}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div ref={listRef} className="grid gap-4 scroll-mt-6">
        <h3 className="text-lg font-bold flex items-center gap-2 capitalize">
          Recent {activeType}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </h3>
        {loading && items.length === 0 ? (
          <div className="flex py-10 justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No {activeType} found.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {items.map(item => {
              const vendorId = item.vendor_id || item.author_id;
              const vendorName = vendors.find(v => v.id === vendorId)?.store_name || "Unknown Vendor";
              const isNew = newIds.has(item.id);
              const thumbnailSrc = item.image_url || item.thumbnail_url ||
                (item.embed_url?.includes("youtube.com") || item.embed_url?.includes("youtu.be")
                  ? `https://img.youtube.com/vi/${item.embed_url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]}/default.jpg`
                  : null);
              return (
                <Card
                  key={item.id}
                  className={`transition-all duration-500 ${
                    isNew ? "ring-2 ring-green-500 shadow-md shadow-green-500/10" : ""
                  }`}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-16 rounded bg-muted overflow-hidden shrink-0">
                        {thumbnailSrc ? (
                          <img src={thumbnailSrc} className="h-full w-full object-cover" />
                        ) : item.embed_url ? (
                          <div className="h-full w-full flex items-center justify-center bg-muted">
                            <Video className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate max-w-xs">{item.title}</p>
                          {isNew && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                              <CheckCircle2 className="h-3 w-3" /> New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" /> {vendorName}
                        </p>
                        {item.embed_url && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5 opacity-60">{item.embed_url}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeType === "videos" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleFeatured(item.id, item.is_featured)}
                          title={item.is_featured ? "Remove from global feed" : "Show on global feed"}
                          className={item.is_featured ? "text-primary hover:text-primary/80" : "text-muted-foreground"}
                        >
                          <CheckCircle2 className={`h-4 w-4 ${item.is_featured ? "fill-current" : ""}`} />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
