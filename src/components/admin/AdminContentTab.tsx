import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Loader2,
  User,
  FileText,
  Video,
  Utensils,
  CheckCircle2,
  Sparkles,
  Eye,
  ExternalLink,
  Pencil,
  X,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { uploadMedia, deleteMediaWithSafety } from "@/lib/upload";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { RichTextEditor } from "@/components/RichTextEditor";
import { sanitizeHtml } from "@/lib/security";

export function AdminContentTab({ vendors }: { vendors: any[] }) {
  const [activeType, setActiveType] = useState<"articles" | "videos" | "recipes" | "products" | "media">(
    "articles",
  );
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string>("");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

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
    // 1. Load drafts on mount and tab switch
    const draft = localStorage.getItem(`admin_content_draft_${activeType}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.imageUrl) setImageUrl(parsed.imageUrl);
        if (parsed.embedUrl) setEmbedUrl(parsed.embedUrl);
        if (parsed.selectedVendorId) setSelectedVendorId(parsed.selectedVendorId);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.prepTime) setPrepTime(parsed.prepTime);
        if (parsed.cookTime) setCookTime(parsed.cookTime);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    } else {
      // If no draft for this type, clear the form (but don't clear other drafts)
      setTitle("");
      setContent("");
      setImageUrl("");
      setEmbedUrl("");
      setPrepTime("");
      setCookTime("");
      setCategory("General");
    }
  }, [activeType]);

  useEffect(() => {
    // 2. Save drafts on every change
    if (editingId) return; // Don't save drafts while editing existing items
    
    const draft = { 
      title, content, imageUrl, embedUrl, selectedVendorId, category, prepTime, cookTime 
    };
    localStorage.setItem(`admin_content_draft_${activeType}`, JSON.stringify(draft));
  }, [title, content, imageUrl, embedUrl, activeType, selectedVendorId, category, prepTime, cookTime, editingId]);

  // Prevent accidental navigation during uploads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadingVideo || uploadingImage || loading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploadingVideo, uploadingImage, loading]);

  const clearDraft = (type = activeType) => {
    localStorage.removeItem(`admin_content_draft_${type}`);
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadItems() {
      setLoading(true);
      setItems([]); 
      setEditingId(null); 

      try {
        let query;
        if (activeType === "media") {
          query = (supabase.from("gallery_items") as any)
            .select("*, galleries!inner(*)")
            .eq("galleries.category", "vendor_gallery");
          
          if (selectedVendorId) {
            query = query.eq("galleries.vendor_id", selectedVendorId);
          }
        } else {
          query = (supabase.from(activeType) as any)
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
        }

        const { data, error } = await query;
        if (isCancelled) return;

        if (error) {
          console.error(`Error loading ${activeType}:`, error);
          toast.error(`Failed to load ${activeType}`);
        } else {
          if (activeType === "media") {
            setItems(data.map((item: any) => ({
              ...item,
              title: item.galleries?.title || "Gallery Image",
              vendor_id: item.galleries?.vendor_id
            })) || []);
          } else {
            setItems(data || []);
          }
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
  }, [activeType, selectedVendorId]);

  const loadItems = async () => {
    setLoading(true);
    try {
      let query;
      if (activeType === "media") {
        query = (supabase.from("gallery_items") as any)
          .select("*, galleries!inner(*)")
          .eq("galleries.category", "vendor_gallery");
        
        if (selectedVendorId) {
          query = query.eq("galleries.vendor_id", selectedVendorId);
        }
      } else {
        query = (supabase.from(activeType) as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (activeType === "media") {
        setItems(data.map((item: any) => ({
          ...item,
          title: item.galleries?.title || "Gallery Image",
          vendor_id: item.galleries?.vendor_id
        })) || []);
      } else {
        setItems(data || []);
      }
    } catch (err) {
      console.error(`Error reloading ${activeType}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: any) => {
    try {
      const { error } = await (supabase.from(activeType) as any)
        .update({ status: "published" })
        .eq("id", id);

      if (error) throw error;
      toast.success(`${activeType.slice(0, -1)} published successfully!`);
      loadItems();
    } catch (err: any) {
      toast.error(`Error publishing: ${err.message}`);
    }
  };

  async function refreshAndHighlight(ids: string[]) {
    await loadItems();
    if (ids.length > 0) {
      const idSet = new Set(ids);
      setNewIds(idSet);
      setTimeout(() => setNewIds(new Set()), 4000);
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
    setEditingId(null);
    clearDraft();
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setContent(item.content || item.description || "");
    setImageUrl(item.image_url || item.thumbnail_url || (activeType === "products" ? item.price?.toString() : ""));
    setEmbedUrl(item.embed_url || (activeType === "products" ? item.image_url : ""));
    setCategory(item.category_name || "General");
    setPrepTime(item.prep_time || "");
    setCookTime(item.cook_time || "");
    setSelectedVendorId(item.author_id || item.vendor_id || "");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId && activeType !== "videos" && activeType !== "media") {
      toast.error("Please select a vendor/author first");
      return;
    }

    setLoading(true);
    try {
      if (activeType === "media") {
        let { data: gallery } = await (supabase.from("galleries") as any)
          .select("id")
          .eq("vendor_id", selectedVendorId)
          .eq("category", "vendor_gallery")
          .maybeSingle();

        if (!gallery) {
          const { data: newGallery, error: galleryError } = await (supabase.from("galleries") as any)
            .insert({
              title: "Vendor Gallery",
              category: "vendor_gallery",
              vendor_id: selectedVendorId
            })
            .select()
            .single();
          if (galleryError) throw galleryError;
          gallery = newGallery;
        }

        const { error: itemError } = await (supabase.from("gallery_items") as any)
          .insert({
            gallery_id: gallery.id,
            image_url: imageUrl
          });
        if (itemError) throw itemError;

        toast.success("Image added to vendor gallery!");
        resetForm();
        loadItems();
        return;
      }

      const commonData = {
        title,
        [activeType === "products" ? "vendor_id" : "author_id"]: selectedVendorId,
      };

      let result;
      if (editingId) {
        if (activeType === "articles") {
          result = await (supabase.from("articles") as any)
            .update({
              ...commonData,
              content,
              image_url: imageUrl,
              category_name: category,
              slug: title.toLowerCase().replace(/ /g, "-"),
            })
            .eq("id", editingId);
        } else if (activeType === "recipes") {
          result = await (supabase.from("recipes") as any)
            .update({
              ...commonData,
              content,
              image_url: imageUrl,
              prep_time: prepTime,
              cook_time: cookTime,
              slug: title.toLowerCase().replace(/ /g, "-"),
            })
            .eq("id", editingId);
        } else if (activeType === "videos") {
          result = await (supabase.from("videos") as any)
            .update({
              title,
              description: content,
              embed_url: embedUrl,
              thumbnail_url: imageUrl,
              author_id: selectedVendorId,
            })
            .eq("id", editingId);
        } else if (activeType === "products") {
          result = await (supabase.from("products") as any)
            .update({
              title,
              description: content,
              price: parseFloat(imageUrl) || 0,
              image_url: embedUrl,
              vendor_id: selectedVendorId,
              slug: title.toLowerCase().replace(/ /g, "-"),
            })
            .eq("id", editingId);
        }
      } else {
        if (activeType === "articles") {
          result = await (supabase.from("articles") as any).insert({
            ...commonData,
            content,
            image_url: imageUrl,
            slug: title.toLowerCase().replace(/ /g, "-"),
            category_name: category,
          });
        } else if (activeType === "recipes") {
          result = await (supabase.from("recipes") as any).insert({
            ...commonData,
            content,
            image_url: imageUrl,
            slug: title.toLowerCase().replace(/ /g, "-"),
            prep_time: prepTime,
            cook_time: cookTime,
          });
        } else if (activeType === "videos") {
          result = await (supabase.from("videos") as any).insert({
            title,
            description: content,
            embed_url: embedUrl,
            thumbnail_url: imageUrl,
            author_id: selectedVendorId,
            status: embedUrl.includes("video-uploads") ? "uploading" : "ready",
          });
        } else if (activeType === "products") {
          result = await (supabase.from("products") as any).insert({
            title,
            description: content,
            price: parseFloat(imageUrl) || 0,
            image_url: embedUrl,
            vendor_id: selectedVendorId,
            slug: title.toLowerCase().replace(/ /g, "-"),
            status: "published",
          });
        }
      }

      if (result?.error) throw result.error;
      toast.success(`${activeType.slice(0, -1)} ${editingId ? "updated" : "created"}!`);
      resetForm();
      loadItems();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAIThumbnail = async () => {
    if (!title) {
      toast.error("Please enter a title first to guide the AI");
      return;
    }
    setGeneratingImage(true);
    const toastId = toast.loading("AI is painting a thumbnail...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-image", {
        body: { 
          prompt: `${title} ${content || ""}`.trim(),
          author_id: selectedVendorId
        },
      });
      if (error) throw error;
      if (data?.url) {
        setImageUrl(data.url);
        toast.success("AI Thumbnail generated!", { id: toastId });
      }
    } catch (err: any) {
      console.error("AI Generation Error details:", err);
      let message = err.message || "AI Generation failed";
      toast.error(message, { id: toastId });
    } finally {
      setGeneratingImage(false);
    }
  };

  async function deleteItem(id: string) {
    const itemToDelete = items.find(i => i.id === id);
    if (!itemToDelete) return;

    if (!confirm(`Are you sure you want to delete this ${activeType.slice(0, -1)}?`)) return;
    
    // Capture URLs for cleanup
    const urlsToCleanup = [];
    if (itemToDelete.image_url) urlsToCleanup.push(itemToDelete.image_url);
    if (itemToDelete.embed_url) urlsToCleanup.push(itemToDelete.embed_url);
    if (itemToDelete.thumbnail_url) urlsToCleanup.push(itemToDelete.thumbnail_url);

    const { error } = await (supabase.from(activeType) as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      queryClient.invalidateQueries({ queryKey: ["videos", "list"] });
      loadItems();
      
      // Trigger safe cleanup
      urlsToCleanup.forEach(url => deleteMediaWithSafety(url));
      toast.success("Item deleted and storage cleanup initiated");
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await (supabase.from("videos") as any)
      .update({ is_featured: !current })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update featured status");
    } else {
      toast.success(!current ? "Video featured on global feed" : "Video removed from global feed");
      queryClient.invalidateQueries({ queryKey: ["videos", "list"] });
      setItems(items.map((item) => (item.id === id ? { ...item, is_featured: !current } : item)));
    }
  }

  return (
    <div className="space-y-6" ref={formRef}>
      <Card className={editingId ? "ring-2 ring-primary border-primary/20 bg-primary/5" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">
            {editingId ? `Edit ${activeType.slice(0, -1)}` : "Add New Content"}
          </CardTitle>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-8">
              <X className="mr-2 h-4 w-4" /> Cancel Edit
            </Button>
          )}
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
                    <Package className="mr-2 h-4 w-4" /> Product
                  </Button>
                  <Button
                    type="button"
                    variant={activeType === "media" ? "default" : "outline"}
                    onClick={() => setActiveType("media")}
                    size="sm"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" /> Media
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
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.store_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {activeType === "media" ? "Image Title (Internal)" : "Title"}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeType === "media" ? "e.g. Clinic Interior 1" : "Enter title"}
                required
              />
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
                    title={
                      !selectedVendorId ? "Select a vendor first" : "Upload multiple videos at once"
                    }
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
                      const toastId = toast.loading(
                        `Uploading ${files.length} video${files.length > 1 ? "s" : ""}...`,
                      );
                      const insertedIds: string[] = [];

                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        setVideoUploadProgress(`${i + 1}/${files.length} uploading...`);
                        try {
                          const url = await uploadMedia(file, "admin_uploads", "video-uploads");
                          if (url) {
                            const fileName = file.name.split(".").slice(0, -1).join(".");
                            const { data: inserted } = await (supabase.from("videos") as any)
                              .insert({
                                title: fileName,
                                embed_url: url,
                                author_id: selectedVendorId,
                                status: "uploading", // Ensure status is set to trigger function
                                description: `Uploaded via admin on ${new Date().toLocaleDateString()}`,
                                thumbnail_url: imageUrl || null,
                              })
                              .select("id")
                              .single();
                            if (inserted?.id) insertedIds.push(inserted.id);
                          }
                        } catch (err: any) {
                          toast.error(`${file.name}: ${err.message || "Upload failed"}`);
                        }
                      }

                      toast.success(
                        `${insertedIds.length} of ${files.length} video${files.length > 1 ? "s" : ""} saved!`,
                        { id: toastId },
                      );
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
              <label className="text-sm font-medium">
                {activeType === "products" ? "Price ($)" : "Image URL"}
              </label>
              <div className="flex gap-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={activeType === "products" ? "e.g. 29.99" : "https://..."}
                />
                {activeType !== "products" && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateAIThumbnail}
                      disabled={generatingImage}
                      className="h-10 w-10 text-primary border-primary/30 hover:bg-primary/5"
                      title="Generate Thumbnail with AI"
                    >
                      {generatingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="relative h-10 w-10 overflow-hidden"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
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
                          e.target.value = "";
                        }}
                      />
                    </Button>
                  </div>
                )}
              </div>
              {imageUrl && activeType !== "products" && (
                <div className="mt-2 relative group overflow-hidden rounded-lg border border-border aspect-[16/9] max-w-[300px]">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setImageUrl("")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {activeType === "products" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <div className="flex gap-2">
                  <Input
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <div className="shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="relative h-10 w-10 overflow-hidden"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
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
                  <Input
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="e.g. 15 mins"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cook Time</label>
                  <Input
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="e.g. 30 mins"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {activeType === "videos" ? "Description" : "Content"}
              </label>
              {(activeType === "articles" || activeType === "recipes") ? (
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Enter content here (formatting supported)"
                />
              ) : (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter description"
                  rows={5}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className={`flex-1 md:flex-none ${editingId ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
              >
                {editingId ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Update {activeType.slice(0, -1)}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Create {activeType.slice(0, -1)}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="flex-1 md:flex-none"
              >
                <Eye className="mr-2 h-4 w-4" /> Live Preview
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Live Preview: {title || "Untitled"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {activeType === "videos" && embedUrl ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden border bg-black relative">
                <video
                  src={embedUrl}
                  controls
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
                {/\.(mts)(\?|$)/i.test(embedUrl) && (
                  <div className="absolute top-4 inset-x-0 mx-auto max-w-xs bg-black/60 backdrop-blur-md p-3 rounded-lg text-[10px] text-white/80 text-center border border-white/10 z-10">
                    Note: .MTS files may not play in all browsers. <br />
                    If it doesn't load, please use Chrome or convert to MP4.
                    <a 
                      href={embedUrl} 
                      download 
                      className="block mt-2 text-primary hover:underline font-bold"
                    >
                      Download Video to View
                    </a>
                  </div>
                )}
              </div>
            ) : imageUrl && (
              <div className="aspect-video w-full rounded-xl overflow-hidden border">
                <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
              </div>
            )}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{title || "Your Title Here"}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span>{vendors.find(v => v.id === selectedVendorId)?.store_name || "Author Name"}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="prose prose-slate max-w-none dark:prose-invert">
                {content ? (
                  (activeType === "articles" || activeType === "recipes") ? (
                    <div 
                      className="rich-content"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} 
                    />
                  ) : (
                    content.split('\n').map((para, i) => (
                      <p key={i} className="mb-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                        {para}
                      </p>
                    ))
                  )
                ) : (
                  <p className="text-muted-foreground italic">No content written yet...</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div ref={listRef} className="grid gap-4 scroll-mt-6">
        <h3 className="text-lg font-bold flex items-center gap-2 capitalize">
          Recent {activeType}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </h3>
        {loading && items.length === 0 ? (
          <div className="flex py-10 justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No {activeType} found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => {
              const vendorId = item.vendor_id || item.author_id;
              const vendorName =
                vendors.find((v) => v.id === vendorId)?.store_name || "Unknown Vendor";
              const isNew = newIds.has(item.id);
              const thumbnailSrc =
                item.image_url ||
                item.thumbnail_url ||
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
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                            {activeType.slice(0, -1)}
                          </Badge>
                          {item.status === 'draft' && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold uppercase">
                              Draft
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground font-medium ml-2">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" /> {vendorName}
                        </p>
                        {item.embed_url && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5 opacity-60">
                            {item.embed_url}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeType === "videos" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(item.id, item.is_featured)}
                          title={
                            item.is_featured ? "Remove from global feed" : "Show on global feed"
                          }
                          className={
                            item.is_featured
                              ? "text-primary hover:text-primary/80"
                              : "text-muted-foreground"
                          }
                        >
                          <CheckCircle2
                            className={`h-4 w-4 ${item.is_featured ? "fill-current" : ""}`}
                          />
                        </Button>
                      )}
                      {(activeType === "articles" || activeType === "recipes") && item.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-500 hover:bg-emerald-50"
                          onClick={() => handlePublish(item.id)}
                          title="Approve & Publish"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {item.slug && activeType === "articles" && (
                        <a 
                          href={`/articles/${item.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                          title="View Published Page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(item)}
                        title="Edit Item"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {uploadingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 p-8 bg-card border border-border shadow-2xl rounded-2xl max-w-sm w-full mx-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">Bulk Uploading Videos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {videoUploadProgress || "Preparing files..."}
              </p>
              <p className="text-[10px] text-primary/70 font-medium uppercase tracking-widest mt-4">
                Please do not close or refresh this page
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
