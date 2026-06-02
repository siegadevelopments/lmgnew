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
  Megaphone,
  Facebook,
  Instagram,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { uploadMedia, deleteMediaWithSafety } from "@/lib/upload";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { RichTextEditor } from "../RichTextEditor";
import { sanitizeHtml } from "@/lib/security";
import { decodeEntities } from "@/lib/utils";

const parseTimeString = (val: any): number | null => {
  if (val === undefined || val === null) return null;
  const strVal = String(val).trim();
  if (!strVal) return null;
  const match = strVal.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return isNaN(num) ? null : num;
  }
  return null;
};

const CURATED_FOOD_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    description: "Mediterranean Salad Bowl",
    photographer: "Anna Pelzer",
    profile: "https://unsplash.com/@annapelzer"
  },
  {
    url: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&w=800&q=80",
    description: "Berry Smoothie Bowl",
    photographer: "Alexander Mils",
    profile: "https://unsplash.com/@alexandermils"
  },
  {
    url: "https://images.unsplash.com/photo-1541795795328-f073b763494e?auto=format&fit=crop&w=800&q=80",
    description: "Avocado Chocolate Dessert",
    photographer: "Jocelyn Morales",
    profile: "https://unsplash.com/@jocelynmorales"
  },
  {
    url: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    description: "Rustic Vegetable Soup",
    photographer: "Caroline Attwood",
    profile: "https://unsplash.com/@carolineattwood"
  },
  {
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    description: "Salmon Quinoa Protein Bowl",
    photographer: "Ella Olsson",
    profile: "https://unsplash.com/@ellaolsson"
  },
  {
    url: "https://images.unsplash.com/photo-1517093157656-b9ec691cc72e?auto=format&fit=crop&w=800&q=80",
    description: "Oatmeal Berry Bowl",
    photographer: "Dilyara Garifullina",
    profile: "https://unsplash.com/@dilyaragarifullina"
  },
  {
    url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
    description: "Cold-Pressed Green Juice",
    photographer: "Charlotte shares",
    profile: "https://unsplash.com/@charlottesharestravels"
  },
  {
    url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80",
    description: "Healthy Fruit Assortment",
    photographer: "Brooke Lark",
    profile: "https://unsplash.com/@brookelark"
  }
];

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
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string>("");
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkRecipes, setBulkRecipes] = useState<any[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [currentBulkIndex, setCurrentBulkIndex] = useState(-1);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [enhancedCount, setEnhancedCount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningAuthor, setAssigningAuthor] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const resumingRef = useRef(false);
  const bulkCancelledRef = useRef(false);

  const eTrainingVendor = vendors?.find((v: any) => 
    v.store_name?.toLowerCase().replace(/[^a-z0-9]/g, "").includes("etraining")
  );

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState(""); // For videos
  const [category, setCategory] = useState("General");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [galleryCategory, setGalleryCategory] = useState<"vendor_gallery" | "charts" | "memes">("vendor_gallery");

  // Unsplash Stock Image Search states
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockImages, setStockImages] = useState<any[]>(CURATED_FOOD_IMAGES);
  const [searchingStock, setSearchingStock] = useState(false);
  const [unsplashKey, setUnsplashKey] = useState("");

  // Show/Hide Add New Content Form State
  const [showAddForm, setShowAddForm] = useState(false);

  // Share Modal States
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingItem, setSharingItem] = useState<any | null>(null);
  const [shareForm, setShareForm] = useState({
    title: "",
    caption: "",
    hashtags: "",
    imageUrl: "",
    scheduledAt: "",
    status: "approved",
    platforms: ["facebook"] as string[],
  });
  const [generatingShareCaption, setGeneratingShareCaption] = useState(false);
  const [generatingShareImage, setGeneratingShareImage] = useState(false);
  const [generatingShareHashtags, setGeneratingShareHashtags] = useState(false);
  const [savingSharePost, setSavingSharePost] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [generatingExcerpt, setGeneratingExcerpt] = useState(false);
  const [generatingArticleContent, setGeneratingArticleContent] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("unsplash_access_key") || "";
    setUnsplashKey(key);
    loadScheduledPosts();
  }, []);

  const searchStockPhotos = async (queryStr: string) => {
    if (!queryStr.trim()) {
      setStockImages(CURATED_FOOD_IMAGES);
      return;
    }
    
    setSearchingStock(true);
    let accessKey = localStorage.getItem("unsplash_access_key") || "";
    
    if (!accessKey) {
      // Curated/Filter Mode
      const filtered = CURATED_FOOD_IMAGES.filter(img => 
        img.description.toLowerCase().includes(queryStr.toLowerCase())
      );
      setStockImages(filtered.length > 0 ? filtered : CURATED_FOOD_IMAGES);
      setSearchingStock(false);
      return;
    }
    
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(queryStr)}&per_page=12&client_id=${accessKey}`
      );
      if (!res.ok) throw new Error("Failed to search Unsplash");
      const data = await res.json();
      
      const formatted = (data.results || []).map((photo: any) => ({
        url: photo.urls.regular,
        description: photo.alt_description || photo.description || "Food photography",
        photographer: photo.user.name,
        profile: photo.user.links.html
      }));
      
      setStockImages(formatted);
    } catch (e: any) {
      console.error(e);
      toast.error("Could not fetch Unsplash results. Verify your access key.");
    } finally {
      setSearchingStock(false);
    }
  };

  useEffect(() => {
    console.log("stockSearchOpen useEffect triggered! Open state:", stockSearchOpen);
    if (stockSearchOpen) {
      const activeKey = localStorage.getItem("unsplash_access_key") || "";
      setUnsplashKey(activeKey);
      searchStockPhotos(stockSearchQuery || title || "");
    }
  }, [stockSearchOpen]);

  // --- Auto-Save Draft Logic ---
  useEffect(() => {
    // 1. Load drafts on mount and tab switch
    const draft = localStorage.getItem(`admin_content_draft_${activeType}`);
    
    // Exit editing mode when switching tabs to prevent data mismatch,
    // but keep the form open if they were editing or had it open.
    setEditingId(null);

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
        if (parsed.excerpt) setExcerpt(parsed.excerpt);
        if (parsed.galleryCategory) setGalleryCategory(parsed.galleryCategory);
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
      setExcerpt("");
      setCategory("General");
      setGalleryCategory("vendor_gallery");
    }
  }, [activeType]);

  useEffect(() => {
    // 2. Save drafts on every change
    if (editingId) return; // Don't save drafts while editing existing items
    
    const draft = { 
      title, content, imageUrl, embedUrl, selectedVendorId, category, prepTime, cookTime, excerpt,
      galleryCategory,
    };
    localStorage.setItem(`admin_content_draft_${activeType}`, JSON.stringify(draft));
  }, [title, content, imageUrl, embedUrl, activeType, selectedVendorId, category, prepTime, cookTime, excerpt, galleryCategory, editingId]);

  // Resume Bulk Recipe Enhancement on mount if interrupted
  useEffect(() => {
    const saved = localStorage.getItem("gourmet_enhancer_bulk_state");
    if (saved && !resumingRef.current) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.bulkLoading && parsed.bulkRecipes?.length > 0) {
          resumingRef.current = true;
          setBulkRecipes(parsed.bulkRecipes);
          setCurrentBulkIndex(parsed.currentBulkIndex);
          setEnhancedCount(parsed.enhancedCount);
          setBulkStatus(parsed.bulkStatus || "");
          setBulkDialogOpen(true);
          setBulkLoading(true);
          setActiveType("recipes");
          
          setTimeout(() => {
            resumeBulkEnhancement(parsed.bulkRecipes, parsed.currentBulkIndex, parsed.enhancedCount);
          }, 1000);
        }
      } catch (e) {
        console.error("Failed to restore bulk enhancer state:", e);
      }
    }
  }, []);

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
          .in("galleries.category", ["vendor_gallery", "charts", "memes"]);
        
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

  useEffect(() => {
    if (bulkDialogOpen && activeType === "recipes") {
      fetchRecipesForBulk();
    }
  }, [bulkDialogOpen, activeType]);

  const fetchRecipesForBulk = async () => {
    setBulkLoading(true);
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("title", { ascending: true });
        
      if (error) throw error;
      
      const filtered = (data || []).map((recipe: any) => {
        // Only regenerate content if it is completely missing or invalid
        const needsContent = !recipe.content || recipe.content.length < 100 || recipe.content.includes("```");
        
        let needsImage = !recipe.image_url || 
                         recipe.image_url.includes("recipes/") || 
                         recipe.image_url.includes("placeholder");
                         
        if (recipe.image_url && recipe.image_url.includes("ai-thumbnails/")) {
          const match = recipe.image_url.match(/ai-thumbnails\/(\d+)\.jpeg/);
          if (match) {
            const ts = parseInt(match[1], 10);
            // Any image generated before May 29, 2026 is legacy/distorted
            if (ts < 1779926400000) {
              needsImage = true;
            }
          } else {
            needsImage = true;
          }
        }
        
        return {
          ...recipe,
          needsContent,
          needsImage,
          status: "pending"
        };
      }).filter(r => r.needsContent || r.needsImage);
      
      setBulkRecipes(filtered);
    } catch (e: any) {
      toast.error("Failed to load recipes: " + e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const resumeBulkEnhancement = async (recipesList: any[], startIndex: number, initialCount: number) => {
    setBulkLoading(true);
    setEnhancedCount(initialCount);
    setCurrentBulkIndex(startIndex);
    
    for (let i = startIndex; i < recipesList.length; i++) {
      if (bulkCancelledRef.current) {
        setBulkLoading(false);
        setBulkStatus("Enhancement process stopped.");
        localStorage.setItem("gourmet_enhancer_bulk_state", JSON.stringify({
          bulkRecipes: recipesList.map((r, idx) => idx === i ? { ...r, status: "pending" } : r),
          bulkLoading: false,
          currentBulkIndex: i,
          bulkStatus: "Stopped.",
          enhancedCount: initialCount + (i - startIndex)
        }));
        setBulkRecipes(prev => prev.map((r, idx) => idx === i ? { ...r, status: "pending" } : r));
        toast.info("Gourmet enhancement stopped.");
        return;
      }

      // Add delay between iterations to prevent AI rate limiting
      if (i > startIndex) {
        setBulkStatus("Resting AI to prevent rate limits...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      const recipe = recipesList[i];
      setCurrentBulkIndex(i);
      
      // Update local storage on every step!
      localStorage.setItem("gourmet_enhancer_bulk_state", JSON.stringify({
        bulkRecipes: recipesList.map((r, idx) => idx === i ? { ...r, status: "processing" } : r),
        bulkLoading: true,
        currentBulkIndex: i,
        bulkStatus: `Processing recipe ${i + 1} of ${recipesList.length}...`,
        enhancedCount: initialCount + (i - startIndex)
      }));

      setBulkRecipes(prev => prev.map((r, idx) => idx === i ? { ...r, status: "processing" } : r));
      
      try {
        let updatedFields: any = {};
        
        if (recipe.needsContent) {
          setBulkStatus(`Chef AI: Generating gourmet healthy recipe details...`);
          const { data: contentData, error: contentError } = await supabase.functions.invoke("generate-ai-content", {
            body: { title: recipe.title, type: "recipe" },
          });
          
          if (contentError) {
            if (contentError.context) {
              const body = await contentError.context.json().catch(() => null);
              if (body?.error) throw new Error(body.error);
            }
            throw contentError;
          }
          
          if (contentData?.content) {
            updatedFields.content = contentData.content;
            updatedFields.prep_time = parseInt(contentData.prep_time) || 15;
            updatedFields.cook_time = parseInt(contentData.cook_time) || 15;
          }
        }
        
        if (recipe.needsImage) {
          setBulkStatus(`Artist AI: Painting gorgeous premium wellness photo...`);
          const promptContent = updatedFields.content || recipe.content || "";
          const cleanPromptContent = promptContent.replace(/<[^>]*>/g, ' ').substring(0, 1000);
          
          try {
            const { data: imageData, error: imageError } = await supabase.functions.invoke("generate-ai-image", {
              body: { 
                prompt: `${recipe.title} ${cleanPromptContent}`.trim(),
                author_id: recipe.author_id
              },
            });
            
            if (imageError) {
              let errMsg = "Image generation failed";
              if (imageError.context) {
                const body = await imageError.context.json().catch(() => null);
                if (body?.error) errMsg = body.error;
              }
              console.warn(`Image generation skipped for "${recipe.title}":`, errMsg);
              toast.warning(`Could not generate image for "${recipe.title}". Proceeding with content only.`, {
                description: errMsg.substring(0, 80)
              });
            } else if (imageData?.error) {
              console.warn(`Image generation skipped for "${recipe.title}":`, imageData.error);
              toast.warning(`Could not generate image for "${recipe.title}". Proceeding with content only.`, {
                description: String(imageData.error).substring(0, 80)
              });
            } else if (imageData?.url) {
              updatedFields.image_url = imageData.url;
            }
          } catch (imgErr: any) {
            console.warn(`Image generation exception for "${recipe.title}":`, imgErr.message);
          }
        }
        
        if (Object.keys(updatedFields).length > 0) {
          setBulkStatus(`Saving enhanced recipe to database...`);
          const { data: dbData, error: dbError } = await supabase.functions.invoke("save-enhanced-recipe", {
            body: { id: recipe.id, updatedFields }
          });
            
          if (dbError) {
            if (dbError.context) {
              const body = await dbError.context.json().catch(() => null);
              if (body?.error) throw new Error(body.error);
            }
            throw dbError;
          }
        }
        
        const updatedRecipes = recipesList.map((r, idx) => {
          if (idx === i) return { ...r, status: "completed" };
          if (idx < i) return { ...r, status: r.status === "processing" || r.status === "completed" ? "completed" : r.status };
          return r;
        });
        
        // Update recipesList so the next iteration uses the accumulated state!
        recipesList = updatedRecipes;
        
        setBulkRecipes(updatedRecipes);
        setEnhancedCount(prev => prev + 1);
        
        localStorage.setItem("gourmet_enhancer_bulk_state", JSON.stringify({
          bulkRecipes: updatedRecipes,
          bulkLoading: true,
          currentBulkIndex: i + 1,
          bulkStatus: "Saving...",
          enhancedCount: initialCount + (i - startIndex) + 1
        }));
        
      } catch (err: any) {
        console.error(`Failed to enhance recipe "${recipe.title}":`, err);
        const updatedRecipes = recipesList.map((r, idx) => idx === i ? { ...r, status: "failed", errorMsg: err.message } : r);
        setBulkRecipes(updatedRecipes);
        
        localStorage.setItem("gourmet_enhancer_bulk_state", JSON.stringify({
          bulkRecipes: updatedRecipes,
          bulkLoading: true,
          currentBulkIndex: i + 1,
          bulkStatus: `Failed: ${err.message}`,
          enhancedCount: initialCount + (i - startIndex)
        }));
      }
    }
    
    localStorage.removeItem("gourmet_enhancer_bulk_state");
    setCurrentBulkIndex(-1);
    setBulkStatus("Enhancement process completed!");
    setBulkLoading(false);
    loadItems();
  };

  const startBulkEnhancement = async () => {
    bulkCancelledRef.current = false;
    
    // Reset all failed recipes back to pending so they can be retried!
    const resetFailedRecipes = bulkRecipes.map(r => 
      r.status === "failed" ? { ...r, status: "pending", errorMsg: undefined } : r
    );
    
    // Find the first non-completed recipe index to start from
    const firstNonCompletedIndex = resetFailedRecipes.findIndex(r => r.status !== "completed");
    const startIndex = firstNonCompletedIndex >= 0 ? firstNonCompletedIndex : 0;
    
    // Count how many are completed so far
    const completedCount = resetFailedRecipes.filter(r => r.status === "completed").length;
    
    setBulkRecipes(resetFailedRecipes);
    setCurrentBulkIndex(startIndex);
    setEnhancedCount(completedCount);

    localStorage.setItem("gourmet_enhancer_bulk_state", JSON.stringify({
      bulkRecipes: resetFailedRecipes,
      bulkLoading: true,
      currentBulkIndex: startIndex,
      bulkStatus: startIndex > 0 ? "Resuming..." : "Starting...",
      enhancedCount: completedCount
    }));
    await resumeBulkEnhancement(resetFailedRecipes, startIndex, completedCount);
  };

  const assignAllToETraining = async () => {
    if (!eTrainingVendor) {
      toast.error("E-Training Group vendor profile not found.");
      return;
    }
    
    setAssigningAuthor(true);
    const toastId = toast.loading("Assigning all recipes to E-Training Group...");
    
    try {
      const { error } = await (supabase.from("recipes") as any)
        .update({ author_id: eTrainingVendor.id })
        .gt("id", 0);
        
      if (error) throw error;
      
      toast.success("Successfully assigned all recipes to E-Training Group!", { id: toastId });
      loadItems();
      fetchRecipesForBulk();
    } catch (err: any) {
      console.error("Failed to assign author:", err);
      toast.error("Failed to assign author: " + err.message, { id: toastId });
    } finally {
      setAssigningAuthor(false);
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
    setExcerpt("");
    setCategory("General");
    setGalleryCategory("vendor_gallery");
    setEditingId(null);
    setShowAddForm(false);
    clearDraft();
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setContent(item.content || item.description || "");
    setImageUrl(item.image_url || item.thumbnail_url || (activeType === "products" ? item.price?.toString() : ""));
    setEmbedUrl(item.embed_url || (activeType === "products" ? item.image_url : ""));
    setCategory(item.category_name || "General");
    setPrepTime(item.prep_time !== null && item.prep_time !== undefined ? item.prep_time.toString() : "");
    setCookTime(item.cook_time !== null && item.cook_time !== undefined ? item.cook_time.toString() : "");
    setExcerpt(item.excerpt || "");
    setSelectedVendorId(item.author_id || item.vendor_id || "");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePreviewItem = (item: any) => {
    setTitle(item.title || "");
    setContent(item.content || item.description || "");
    setImageUrl(item.image_url || item.thumbnail_url || (activeType === "products" ? item.price?.toString() : ""));
    setEmbedUrl(item.embed_url || (activeType === "products" ? item.image_url : ""));
    setCategory(item.category_name || "General");
    setPrepTime(item.prep_time !== null && item.prep_time !== undefined ? item.prep_time.toString() : "");
    setCookTime(item.cook_time !== null && item.cook_time !== undefined ? item.cook_time.toString() : "");
    setExcerpt(item.excerpt || "");
    setSelectedVendorId(item.author_id || item.vendor_id || "");
    setPreviewOpen(true);
  };

  const handleOpenShare = (item: any) => {
    setSharingItem(item);
    
    // Get current time in Melbourne
    const nowMelbourneStr = new Date().toLocaleString("en-US", { timeZone: "Australia/Melbourne" });
    const nowMelbourne = new Date(nowMelbourneStr);
    
    // Set default scheduled time to tomorrow at 9:00 AM Melbourne time
    const tomorrowMelbourne = new Date(nowMelbourne);
    tomorrowMelbourne.setDate(tomorrowMelbourne.getDate() + 1);
    tomorrowMelbourne.setHours(9, 0, 0, 0); // Default to 9:00 AM
    
    // Formatting for datetime-local input: YYYY-MM-DDThh:mm (representing Melbourne time components)
    const year = tomorrowMelbourne.getFullYear();
    const month = String(tomorrowMelbourne.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrowMelbourne.getDate()).padStart(2, '0');
    const hours = String(tomorrowMelbourne.getHours()).padStart(2, '0');
    const minutes = String(tomorrowMelbourne.getMinutes()).padStart(2, '0');
    const defaultDatetime = `${year}-${month}-${day}T${hours}:${minutes}`;

    // Clean html tags out of preview caption content
    const cleanContent = item.content?.replace(/<[^>]*>/g, ' ').substring(0, 200).trim() || "";

    setShareForm({
      title: item.title || "",
      caption: item.excerpt || cleanContent,
      hashtags: "",
      imageUrl: item.image_url || item.thumbnail_url || "",
      scheduledAt: defaultDatetime,
      status: "approved",
      platforms: ["facebook"],
    });
    setShareDialogOpen(true);
  };

  const generateShareCaption = async () => {
    if (!sharingItem) return;
    setGeneratingShareCaption(true);
    const toastId = toast.loading("AI is crafting a viral caption...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const cleanContent = sharingItem.content?.replace(/<[^>]*>/g, ' ').substring(0, 1000) || "";
      const itemUrl = `https://lifestylemedicinegateway.com.au/${activeType}/${sharingItem.slug}`;
      const contextText = `Article Title: ${sharingItem.title}\nLink/URL: ${itemUrl}\nExcerpt: ${sharingItem.excerpt || ""}\nContent: ${cleanContent}`;
      
      const response = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          field: "caption",
          value: shareForm.caption || sharingItem.title,
          context: contextText,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.suggestion || data.error || "AI caption generation failed");

      setShareForm((prev) => ({ ...prev, caption: data.result }));
      toast.success("AI Caption generated!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate caption", { id: toastId });
    } finally {
      setGeneratingShareCaption(false);
    }
  };

  const generateShareImage = async () => {
    if (!sharingItem) return;
    setGeneratingShareImage(true);
    const toastId = toast.loading("AI is painting a viral image...");
    try {
      const promptText = `Social media post about: ${shareForm.title || sharingItem.title}. ${shareForm.caption || sharingItem.excerpt || ""}`;
      const authorId = sharingItem.vendor_id || sharingItem.author_id || eTrainingVendor?.id || null;
      
      const { data, error } = await supabase.functions.invoke("generate-ai-image", {
        body: { 
          prompt: promptText.substring(0, 1000),
          author_id: authorId
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
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        setShareForm((prev) => ({ ...prev, imageUrl: data.url }));
        toast.success("AI Image generated!", { id: toastId });
      } else {
        throw new Error("No image URL returned from AI service");
      }
    } catch (err: any) {
      console.error("AI Share Image Generation Error:", err);
      toast.error(err.message || "Failed to generate image", { id: toastId });
    } finally {
      setGeneratingShareImage(false);
    }
  };

  const generateShareHashtags = async () => {
    if (!sharingItem) return;
    setGeneratingShareHashtags(true);
    const toastId = toast.loading("AI is brainstorming hashtags...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          field: "hashtags",
          value: shareForm.hashtags,
          context: `${shareForm.title || sharingItem.title}\n${shareForm.caption || ""}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.suggestion || data.error || "AI hashtags generation failed");

      setShareForm((prev) => ({ ...prev, hashtags: data.result }));
      toast.success("AI Hashtags generated!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate hashtags", { id: toastId });
    } finally {
      setGeneratingShareHashtags(false);
    }
  };

  const generateAIExcerpt = async () => {
    if (!title) {
      toast.error("Please enter a title first to guide the AI");
      return;
    }
    setGeneratingExcerpt(true);
    const toastId = toast.loading("AI is summarizing an excerpt...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const cleanContent = content.replace(/<[^>]*>/g, ' ').substring(0, 1500);
      const contextText = `Title: ${title}\nContent: ${cleanContent}`;

      const response = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          field: "excerpt",
          value: excerpt,
          context: contextText,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.suggestion || data.error || "AI excerpt generation failed");

      setExcerpt(data.result);
      toast.success("AI Excerpt generated!", { id: toastId });
    } catch (err: any) {
      console.error("AI Excerpt Error:", err);
      toast.error(err.message || "Failed to generate excerpt", { id: toastId });
    } finally {
      setGeneratingExcerpt(false);
    }
  };

  const generateAIArticleContent = async () => {
    if (!title) {
      toast.error("Please enter a title first to guide the AI");
      return;
    }
    setGeneratingArticleContent(true);
    const toastId = toast.loading("AI is writing your article...");
    try {
      const { data: contentData, error: contentError } = await supabase.functions.invoke("generate-ai-content", {
        body: { title, type: "article" },
      });
      
      if (contentError) {
        if (contentError.context) {
          try {
            const body = await contentError.context.json();
            if (body?.error) {
              throw new Error(body.error);
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
        throw contentError;
      }
      
      if (contentData?.content) {
        setContent(contentData.content);
        toast.success("AI Article content generated!", { id: toastId });
      } else {
        throw new Error("No content returned from AI service");
      }
    } catch (err: any) {
      console.error("AI Article Content Error:", err);
      toast.error(err.message || "Failed to generate article content", { id: toastId });
    } finally {
      setGeneratingArticleContent(false);
    }
  };

  const handleSaveSharePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingItem) return;
    if (!shareForm.scheduledAt) {
      toast.error("Please select a scheduled date and time");
      return;
    }
    
    setSavingSharePost(true);
    const toastId = toast.loading("Scheduling post...");
    try {
      const sourceUrl = `/${activeType}/${sharingItem.slug}`;
      
      // Convert Melbourne time components (YYYY-MM-DDThh:mm) to UTC ISO string
      const parseMelbourneTimeToUTC = (datetimeStr: string): string => {
        const [datePart, timePart] = datetimeStr.split("T");
        const [yr, mo, dy] = datePart.split("-").map(Number);
        const [hr, min] = timePart.split(":").map(Number);
        
        // Create UTC Date representing these components
        const utcDate = new Date(Date.UTC(yr, mo - 1, dy, hr, min));
        
        // Find what time that UTC date represents in Melbourne
        const melbourneStr = utcDate.toLocaleString("en-US", { timeZone: "Australia/Melbourne" });
        const parsedMelbourne = new Date(melbourneStr);
        
        // Time difference in ms between Melbourne and UTC for this date
        const diff = parsedMelbourne.getTime() - utcDate.getTime();
        
        // Shift by the difference
        const finalDate = new Date(utcDate.getTime() - diff);
        return finalDate.toISOString();
      };

      const scheduledAtUTC = parseMelbourneTimeToUTC(shareForm.scheduledAt);

      const { error } = await (supabase.from("scheduled_posts") as any).insert({
        title: shareForm.title,
        caption: shareForm.caption,
        hashtags: shareForm.hashtags
          .split(",")
          .map((h: string) => h.trim())
          .filter(Boolean),
        image_url: shareForm.imageUrl || null,
        source_type: activeType === "articles" ? "article" : "recipe",
        source_id: String(sharingItem.id),
        source_url: sourceUrl,
        platforms: shareForm.platforms,
        scheduled_at: scheduledAtUTC,
        status: shareForm.status,
      });

      if (error) throw error;
      
      toast.success("Viral post scheduled successfully!", { id: toastId });
      setShareDialogOpen(false);
      setSharingItem(null);
      loadScheduledPosts(); // Refresh the list
    } catch (err: any) {
      console.error("Save Share Post Error:", err);
      toast.error(err.message || "Failed to schedule post", { id: toastId });
    } finally {
      setSavingSharePost(false);
    }
  };

  const loadScheduledPosts = async () => {
    setLoadingScheduled(true);
    try {
      const { data, error } = await (supabase.from("scheduled_posts") as any)
        .select("*")
        .neq("status", "published")
        .order("scheduled_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      setScheduledPosts(data || []);
    } catch (err) {
      console.error("Error loading scheduled posts:", err);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const handleDeleteScheduledPost = async (postId: string) => {
    if (!confirm("Are you sure you want to cancel and delete this scheduled post?")) return;
    try {
      const { error } = await (supabase.from("scheduled_posts") as any)
        .delete()
        .eq("id", postId);
      if (error) throw error;
      toast.success("Scheduled post deleted successfully");
      loadScheduledPosts(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Failed to delete scheduled post");
    }
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
        let query = (supabase.from("galleries") as any)
          .select("id")
          .eq("category", galleryCategory);
        
        if (galleryCategory === "vendor_gallery") {
          query = query.eq("vendor_id", selectedVendorId);
        } else {
          // For charts/memes, check if title already exists (case-insensitive)
          query = query.ilike("title", title);
        }

        let { data: gallery } = await query.maybeSingle();

        if (!gallery) {
          const { data: newGallery, error: galleryError } = await (supabase.from("galleries") as any)
            .insert({
              title: galleryCategory === "vendor_gallery" ? "Vendor Gallery" : title,
              category: galleryCategory,
              vendor_id: selectedVendorId || null
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
              excerpt,
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
              prep_time: parseTimeString(prepTime),
              cook_time: parseTimeString(cookTime),
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
            excerpt,
            slug: title.toLowerCase().replace(/ /g, "-"),
            category_name: category,
          });
        } else if (activeType === "recipes") {
          result = await (supabase.from("recipes") as any).insert({
            ...commonData,
            content,
            image_url: imageUrl,
            slug: title.toLowerCase().replace(/ /g, "-"),
            prep_time: parseTimeString(prepTime),
            cook_time: parseTimeString(cookTime),
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
      // Strip HTML tags for the AI prompt to keep it clean and within size limits
      const cleanContent = content.replace(/<[^>]*>/g, ' ').substring(0, 1000);
      const { data, error } = await supabase.functions.invoke("generate-ai-image", {
        body: { 
          prompt: `${title} ${cleanContent}`.trim(),
          author_id: selectedVendorId
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
      
      // Handle the case where the function returns a 200 but contains an error object
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        setImageUrl(data.url);
        toast.success("AI Thumbnail generated!", { id: toastId });
      } else {
        throw new Error("No image URL returned from AI service");
      }
    } catch (err: any) {
      console.error("AI Generation Error details:", err);
      // Try to parse error message if it's a stringified JSON from Supabase
      let message = err.message || "AI Generation failed";
      
      if (message.includes("GEMINI_API_KEY") || message.includes("OPENAI_API_KEY")) {
        message = "AI Keys missing or invalid in Supabase settings.";
      }
      
      toast.error(message, { id: toastId });
    } finally {
      setGeneratingImage(false);
    }
  };

  const generateAIRecipe = async () => {
    if (!title) {
      toast.error("Enter a recipe title first");
      return;
    }
    setGeneratingRecipe(true);
    const toastId = toast.loading("Health chef is writing your recipe...");
    try {
      // 1. Generate Content
      const { data: contentData, error: contentError } = await supabase.functions.invoke("generate-ai-content", {
        body: { title, type: "recipe" },
      });
      if (contentError) {
        if (contentError.context) {
          try {
            const body = await contentError.context.json();
            if (body?.error) {
              throw new Error(body.error);
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
        throw contentError;
      }
      if (contentData?.content) {
        setContent(contentData.content);
        if (contentData.prep_time) setPrepTime(contentData.prep_time.toString());
        if (contentData.cook_time) setCookTime(contentData.cook_time.toString());
        
        toast.success("Recipe content generated!", { id: toastId });
        
        // 2. Generate Image sequentially
        await generateAIThumbnail();
      }
    } catch (err: any) {
      toast.error(err.message || "AI Chef failed", { id: toastId });
    } finally {
      setGeneratingRecipe(false);
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
      {!showAddForm && !editingId ? (
        <div className="flex justify-start">
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/10"
          >
            <Plus className="h-4 w-4" />
            Add New Content
          </Button>
        </div>
      ) : (
        <Card className={editingId ? "ring-2 ring-primary border-primary/20 bg-primary/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xl">
              {editingId ? `Edit ${activeType.slice(0, -1)}` : "Add New Content"}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (editingId) {
                  resetForm();
                } else {
                  setShowAddForm(false);
                }
              }} 
              className="h-8 text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-4 w-4" /> Cancel {editingId ? "Edit" : ""}
            </Button>
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

              {activeType === "media" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gallery Category</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={galleryCategory}
                    onChange={(e) => setGalleryCategory(e.target.value as any)}
                  >
                    <option value="vendor_gallery">Vendor Profile Gallery</option>
                    <option value="charts">Charts & References</option>
                    <option value="memes">Memes & Inspiration</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {activeType === "media" 
                  ? (galleryCategory === "vendor_gallery" ? "Image Title (Internal)" : "Gallery Title (e.g. Parasites)") 
                  : "Title"}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeType === "media" 
                  ? (galleryCategory === "vendor_gallery" ? "e.g. Clinic Interior 1" : "e.g. Smoothie Protocols") 
                  : "Enter title"}
                required
              />
              {activeType === "recipes" && (
                <Button
                  type="button"
                  onClick={generateAIRecipe}
                  disabled={generatingRecipe}
                  className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                >
                  {generatingRecipe ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Full Recipe with AI Chef
                </Button>
              )}
            </div>

            {activeType === "articles" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Excerpt (Short summary for Anecdotes page)</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAIExcerpt}
                    disabled={generatingExcerpt}
                    className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 font-semibold gap-1.5"
                  >
                    {generatingExcerpt ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Write with AI
                  </Button>
                </div>
                <Textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Enter a short summary or quote..."
                  rows={2}
                />
              </div>
            )}

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
                      onClick={() => {
                        console.log("Stock search button clicked! Title:", title);
                        setStockSearchQuery(title || "");
                        setStockSearchOpen(true);
                      }}
                      className="h-10 w-10 text-violet-600 border-violet-200 hover:bg-violet-50/50"
                      title="Search Stock Photos"
                    >
                      <ImageIcon className="h-4 w-4" />
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
                    {activeType === "media" && (
                      <label
                        htmlFor="admin-media-bulk"
                        className={`flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                          uploadingImage ? "pointer-events-none opacity-50" : ""
                        }`}
                        title="Upload multiple images at once"
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Bulk
                      </label>
                    )}
                    {activeType === "media" && (
                      <input
                        id="admin-media-bulk"
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={uploadingImage}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          if (galleryCategory !== "vendor_gallery" && !title) {
                            toast.error("Enter a gallery title first");
                            return;
                          }
                          setUploadingImage(true);
                          const toastId = toast.loading(`Uploading ${files.length} images...`);
                          let successCount = 0;
                          
                          try {
                            // Find or create gallery first (same logic as handleSubmit)
                            let galleryId;
                            let query = (supabase.from("galleries") as any)
                              .select("id")
                              .eq("category", galleryCategory);
                            
                            if (galleryCategory === "vendor_gallery") {
                              query = query.eq("vendor_id", selectedVendorId);
                            } else {
                              query = query.ilike("title", title);
                            }

                            const { data: existing } = await query.maybeSingle();
                            if (existing) {
                              galleryId = existing.id;
                            } else {
                              const { data: created, error: createError } = await (supabase.from("galleries") as any)
                                .insert({
                                  title: galleryCategory === "vendor_gallery" ? "Vendor Gallery" : title,
                                  category: galleryCategory,
                                  vendor_id: selectedVendorId || null
                                })
                                .select()
                                .single();
                              if (createError) throw createError;
                              galleryId = created.id;
                            }

                            // Upload and insert items
                            for (const file of files) {
                              const url = await uploadMedia(file, "admin_uploads");
                              if (url) {
                                await (supabase.from("gallery_items") as any).insert({
                                  gallery_id: galleryId,
                                  image_url: url
                                });
                                successCount++;
                              }
                            }
                            toast.success(`Successfully uploaded ${successCount} images!`, { id: toastId });
                            loadItems();
                          } catch (err: any) {
                            toast.error(err.message, { id: toastId });
                          } finally {
                            setUploadingImage(false);
                            e.target.value = "";
                          }
                        }}
                      />
                    )}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">
                    {activeType === "videos" ? "Description" : "Content"}
                  </label>
                  {activeType === "articles" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateAIArticleContent}
                      disabled={generatingArticleContent}
                      className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 font-semibold gap-1.5"
                    >
                      {generatingArticleContent ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Write with AI
                    </Button>
                  )}
                </div>
                {(activeType === "articles" || activeType === "recipes") && (
                  <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                    Rich Text Editor Active
                  </Badge>
                )}
              </div>
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
      )}

      {/* Unsplash Stock Photo Search Dialog */}
      <Dialog open={stockSearchOpen} onOpenChange={setStockSearchOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden bg-white/95 backdrop-blur-md border border-slate-100 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-violet-600" />
              Stock Photo Library
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Search and select a stunning cover photo from Unsplash. Pre-filled with active categories for free, keyless use, or connect your developer account for live search.
            </DialogDescription>
          </DialogHeader>

          {/* Search Inputs */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-2">
              <Input
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                placeholder="Search premium food, salads, bowls..."
                className="h-11 rounded-xl border-slate-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchStockPhotos(stockSearchQuery);
                }}
              />
              <Button
                onClick={() => searchStockPhotos(stockSearchQuery)}
                disabled={searchingStock}
                className="bg-violet-600 hover:bg-violet-700 h-11 px-6 rounded-xl font-semibold transition-all shadow-md shadow-violet-100"
              >
                {searchingStock ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {/* API Key Setup */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700">
                  {unsplashKey ? "✓ Live Unsplash Search Connected" : "ℹ️ Using Curated Fallbacks (Search Limited)"}
                </span>
                <Button
                  variant="link"
                  className="text-xs text-violet-600 h-auto p-0 font-bold hover:underline"
                  onClick={() => {
                    const key = prompt("Enter your Unsplash Access Key:", unsplashKey);
                    if (key !== null) {
                      localStorage.setItem("unsplash_access_key", key.trim());
                      setUnsplashKey(key.trim());
                      toast.success(key ? "Unsplash Access Key saved!" : "Using fallback mode.");
                      searchStockPhotos(stockSearchQuery);
                    }
                  }}
                >
                  {unsplashKey ? "Change Key" : "Connect Unsplash Key (Free)"}
                </Button>
              </div>
              {!unsplashKey && (
                <p className="text-[10px] text-slate-500 leading-normal">
                  To search millions of live photos, click the link above and paste a free Access Key from <a href="https://unsplash.com/developers" target="_blank" rel="noreferrer" className="text-violet-600 underline">unsplash.com/developers</a>. Otherwise, we filter from our gourmet curated collection.
                </p>
              )}
            </div>
          </div>

          {/* Grid display */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[300px]">
            {searchingStock ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                <span className="text-sm font-medium">Sourcing high-resolution stock photos...</span>
              </div>
            ) : stockImages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="text-sm">No photos found matching your search. Try "salad", "oats", or "soup".</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stockImages.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setImageUrl(img.url);
                      setStockSearchOpen(false);
                      toast.success("Cover image selected successfully!");
                    }}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.description}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 text-white transition-opacity duration-300">
                      <p className="text-[11px] font-semibold truncate">{img.description}</p>
                      <p className="text-[9px] text-slate-300 mt-0.5 truncate">
                        By <a href={img.profile} target="_blank" rel="noreferrer" className="underline hover:text-white" onClick={(e) => e.stopPropagation()}>{img.photographer}</a> on Unsplash
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setStockSearchOpen(false)} className="rounded-xl font-medium">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Live Preview: {decodeEntities(title) || "Untitled"}</DialogTitle>
            <DialogDescription>
              Preview how your {activeType.slice(0, -1)} will appear on the website once published.
            </DialogDescription>
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
              <h1 className="text-3xl font-bold">{decodeEntities(title) || "Your Title Here"}</h1>
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

      <Dialog open={bulkDialogOpen} onOpenChange={(open) => {
        if (!bulkLoading) setBulkDialogOpen(open);
      }}>
        <DialogContent 
          className={`max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-2xl border bg-background/95 backdrop-blur-md shadow-2xl ${bulkLoading ? "[&>button]:hidden" : ""}`}
          onPointerDownOutside={(e) => { if (bulkLoading) e.preventDefault(); }}
          onInteractOutside={(e) => { if (bulkLoading) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (bulkLoading) e.preventDefault(); }}
        >
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              Gourmet Recipe Enhancer
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Automatically generate healthy recipe details (ingredients, instructions, wellness tips) and high-quality cover photos for all recipes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {!bulkLoading && eTrainingVendor && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary" />
                    Assign Author: E-Training Group
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Bulk update the author of all recipes in the database to "E-Training Group".
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={assignAllToETraining}
                  disabled={assigningAuthor}
                  className="bg-primary hover:bg-primary/90 text-white font-bold transition-all duration-300 shadow-sm shrink-0"
                >
                  {assigningAuthor ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Author"
                  )}
                </Button>
              </div>
            )}

            {bulkRecipes.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 border border-dashed rounded-xl space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">All Recipes Are Gourmet!</h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Every recipe in your library already has robust content and high-quality AI images.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bulkLoading && currentBulkIndex !== -1 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs font-bold text-primary">
                      <span>Overall Progress</span>
                      <span>
                        {currentBulkIndex + 1} of {bulkRecipes.length}
                      </span>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-500 rounded-full"
                        style={{ width: `${((currentBulkIndex) / bulkRecipes.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm pb-2 border-b border-border">
                    <span className="font-bold text-foreground">
                      {bulkLoading ? "Enhancing Recipes..." : `Recipes needing enhancement (${bulkRecipes.length})`}
                    </span>
                    <span className="text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {bulkLoading ? "Processing" : "Attention Required"}
                    </span>
                  </div>
                  
                  <div className="grid gap-2 max-h-[45vh] overflow-y-auto pr-1">
                    {bulkRecipes.map((recipe, idx) => (
                      <div 
                        key={recipe.id}
                        ref={(el) => {
                          if (idx === currentBulkIndex && el) {
                            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                          idx === currentBulkIndex 
                            ? "bg-primary/5 border-primary ring-1 ring-primary" 
                            : recipe.status === "completed"
                            ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30"
                            : recipe.status === "failed"
                            ? "bg-destructive/5 border-destructive/20"
                            : "bg-card border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                            {recipe.image_url && !recipe.needsImage ? (
                              <img src={recipe.image_url} className="h-full w-full object-cover" />
                            ) : (
                              <Utensils className="h-5 w-5 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm truncate text-foreground">
                              {decodeEntities(recipe.title || "")}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {recipe.needsContent && (
                                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                  Needs Recipe Content
                                </span>
                              )}
                              {recipe.needsImage && (
                                <span className="text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                  Blurry / Legacy Image
                                </span>
                              )}
                              {idx === currentBulkIndex && (
                                <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded animate-pulse">
                                  {bulkStatus}
                                </span>
                              )}
                              {recipe.status === "failed" && recipe.errorMsg && (
                                <span className="text-[9px] font-bold bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded block mt-1 w-fit max-w-[320px] truncate" title={recipe.errorMsg}>
                                  Error: {recipe.errorMsg}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          {recipe.status === "pending" && (
                            <span className="text-xs text-muted-foreground font-semibold">Pending</span>
                          )}
                          {recipe.status === "processing" && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {recipe.status === "completed" && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50 dark:fill-none" />
                          )}
                          {recipe.status === "failed" && (
                            <span 
                              className="text-xs text-destructive font-bold cursor-help underline decoration-dotted" 
                              title={recipe.errorMsg || "Unknown error"}
                            >
                              Failed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-between gap-4 mt-auto">
            {!bulkLoading && bulkRecipes.length > 0 && (
              <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                Will execute sequentially using Gemini & Imagen 3.
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto flex-wrap justify-end">
              {bulkLoading && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    bulkCancelledRef.current = true;
                    setBulkStatus("Stopping process... please wait");
                  }}
                  className="w-full sm:w-auto font-bold flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Stop
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setBulkDialogOpen(false)}
                disabled={bulkLoading}
                className="w-full sm:w-auto"
              >
                {enhancedCount > 0 ? "Close & Refresh" : "Cancel"}
              </Button>
              {bulkRecipes.length > 0 && (
                <Button
                  onClick={startBulkEnhancement}
                  disabled={bulkLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {currentBulkIndex > 0 ? `Resume Enhancing (${bulkRecipes.length - currentBulkIndex} left)` : `Start Enhancing (${bulkRecipes.length})`}
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
              <Megaphone className="h-5 w-5 text-indigo-500 animate-bounce" />
              Create Viral Social Post
            </DialogTitle>
            <DialogDescription>
              Schedule this {activeType.slice(0, -1)} to Facebook and Instagram. Use AI to generate engaging copy and visuals.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSharePost} className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
            {/* Form Fields Column */}
            <div className="lg:col-span-7 space-y-4">
              {/* Title field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Post Title</label>
                <Input
                  value={shareForm.title}
                  onChange={(e) => setShareForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title..."
                  className="bg-muted/30 focus-visible:ring-indigo-500/50"
                  required
                />
              </div>

              {/* Caption field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Caption</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateShareCaption}
                    disabled={generatingShareCaption}
                    className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 font-semibold gap-1.5"
                  >
                    {generatingShareCaption ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Write with AI
                  </Button>
                </div>
                <Textarea
                  value={shareForm.caption}
                  onChange={(e) => setShareForm((prev) => ({ ...prev, caption: e.target.value }))}
                  placeholder="Draft your caption or let AI write one..."
                  rows={6}
                  className="bg-muted/30 focus-visible:ring-indigo-500/50 resize-y"
                  required
                />
              </div>

              {/* Hashtags field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hashtags</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateShareHashtags}
                    disabled={generatingShareHashtags}
                    className="h-7 text-xs bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700 font-semibold gap-1.5"
                  >
                    {generatingShareHashtags ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Suggest Hashtags
                  </Button>
                </div>
                <Input
                  value={shareForm.hashtags}
                  onChange={(e) => setShareForm((prev) => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="Comma-separated e.g. wellness, menopause, health"
                  className="bg-muted/30 focus-visible:ring-indigo-500/50"
                />
              </div>

              {/* Image URL & AI Generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Image URL</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateShareImage}
                    disabled={generatingShareImage}
                    className="h-7 text-xs bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 font-semibold gap-1.5"
                  >
                    {generatingShareImage ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                    Paint with AI (Imagen)
                  </Button>
                </div>
                <Input
                  value={shareForm.imageUrl}
                  onChange={(e) => setShareForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Paste image URL or generate one..."
                  className="bg-muted/30 focus-visible:ring-indigo-500/50"
                />
              </div>

              {/* Date, Status, Platforms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scheduled Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={shareForm.scheduledAt}
                    onChange={(e) => setShareForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                    className="bg-muted/30 focus-visible:ring-indigo-500/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                  <select
                    value={shareForm.status}
                    onChange={(e) => setShareForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="approved">Approved (Queue automatically)</option>
                    <option value="draft">Draft (Save only)</option>
                  </select>
                </div>
              </div>

              {/* Target Platforms */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Target Platforms</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={shareForm.platforms.includes("facebook")}
                      onChange={(e) => {
                        const platforms = e.target.checked
                          ? [...shareForm.platforms, "facebook"]
                          : shareForm.platforms.filter((p) => p !== "facebook");
                        setShareForm((prev) => ({ ...prev, platforms }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={shareForm.platforms.includes("instagram")}
                      onChange={(e) => {
                        const platforms = e.target.checked
                          ? [...shareForm.platforms, "instagram"]
                          : shareForm.platforms.filter((p) => p !== "instagram");
                        setShareForm((prev) => ({ ...prev, platforms }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Instagram className="h-4 w-4 text-pink-600" /> Instagram
                  </label>
                </div>
              </div>
            </div>

            {/* Social Feed Preview Column */}
            <div className="lg:col-span-5 flex flex-col justify-start">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Live Post Preview</label>
              
              <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-lg overflow-hidden flex-1 flex flex-col min-h-[300px]">
                {/* Header (Australian Wellness Gateway style) */}
                <div className="p-3 border-b border-border/60 bg-muted/20 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs">
                    LM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Lifestyle Medicine Gateway</h4>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      Sponsored • <Megaphone className="h-2.5 w-2.5 inline" />
                    </p>
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-3 text-xs space-y-1.5 flex-1 overflow-y-auto max-h-[180px]">
                  <p className="font-bold text-foreground/90">{shareForm.title || "Untitled Post"}</p>
                  <p className="whitespace-pre-line text-muted-foreground">
                    {shareForm.caption || "Draft your copy..."}
                  </p>
                  {shareForm.hashtags && (
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {shareForm.hashtags.split(",").map(h => h.trim().startsWith("#") ? h.trim() : `#${h.trim()}`).join(" ")}
                    </p>
                  )}
                </div>

                {/* Media Preview */}
                <div className="relative aspect-video bg-muted flex items-center justify-center border-t border-border/40 overflow-hidden">
                  {shareForm.imageUrl ? (
                    <img
                      src={shareForm.imageUrl}
                      alt="Social media share media"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="text-center p-4 text-muted-foreground space-y-2">
                      <ImageIcon className="h-8 w-8 mx-auto opacity-40" />
                      <p className="text-[10px]">No image selected</p>
                    </div>
                  )}
                  {generatingShareImage && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-[10px] font-semibold text-primary">Generating AI Masterpiece...</span>
                    </div>
                  )}
                </div>

                {/* Footer Engagement (Fake Likes/Comments) */}
                <div className="p-2.5 border-t border-border/40 bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <div className="flex items-center gap-3">
                    <span>👍 Like</span>
                    <span>💬 Comment</span>
                    <span>🔄 Share</span>
                  </div>
                  <span>Preview Only</span>
                </div>
              </div>
            </div>

            <DialogFooter className="col-span-12 pt-4 border-t border-border flex sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
                disabled={savingSharePost}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingSharePost}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                {savingSharePost ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Schedule Viral Post
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div ref={listRef} className="grid gap-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <h3 className="text-lg font-bold flex items-center gap-2 capitalize">
            Recent {activeType}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h3>
          {activeType === "recipes" && items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDialogOpen(true)}
              className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold flex items-center gap-2 transition-all duration-300 shadow-sm self-start sm:self-auto"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              Bulk Enhance Recipes
            </Button>
          )}
        </div>
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
                          <p className="font-medium text-sm truncate max-w-xs">{decodeEntities(item.title || "")}</p>
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
                          {activeType === "media" && item.galleries?.category && (
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5">
                              {item.galleries.category.replace("_", " ")}
                            </Badge>
                          )}
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
                      {activeType === "media" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/5"
                          onClick={() => {
                            setGalleryCategory(item.galleries?.category || "vendor_gallery");
                            setTitle(item.galleries?.title || "");
                            setSelectedVendorId(item.galleries?.vendor_id || "");
                            formRef.current?.scrollIntoView({ behavior: "smooth" });
                            toast.info(`Ready to add more to "${item.galleries?.title}"`);
                          }}
                          title="Add more to this gallery"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
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
                      {item.slug && (activeType === "articles" || activeType === "recipes") && (
                        <a 
                          href={`/${activeType}/${item.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                          title="View Published Page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {item.slug && (activeType === "articles" || activeType === "recipes") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50"
                          onClick={() => handleOpenShare(item)}
                          title="Share / Create Viral Post"
                        >
                          <Megaphone className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handlePreviewItem(item)}
                        title="Live Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

      {/* Pending Scheduled Posts Section */}
      <div className="mt-8 pt-6 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-500" />
            Pending Scheduled Social Posts
            {loadingScheduled && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h3>
        </div>

        {scheduledPosts.length === 0 ? (
          <Card className="bg-muted/10 border-dashed border-2">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40 text-indigo-500" />
              No pending scheduled posts. Click the share button <Megaphone className="h-3 w-3 inline text-indigo-600 mx-0.5" /> on any article or recipe above to schedule one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {scheduledPosts.map((post) => {
              const scheduledDate = new Date(post.scheduled_at);
              const isPast = scheduledDate < new Date();
              return (
                <Card key={post.id} className="bg-card/50 hover:bg-card transition-colors duration-300 border-border/80">
                  <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Image Thumbnail */}
                      <div className="h-10 w-14 rounded bg-muted overflow-hidden shrink-0 border border-border/40">
                        {post.image_url ? (
                          <img src={post.image_url} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-muted">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                          </div>
                        )}
                      </div>

                      {/* Post details */}
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground/90 truncate max-w-md">{post.title}</p>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {/* Platforms */}
                          <div className="flex gap-1 items-center">
                            {post.platforms?.includes("facebook") && (
                              <Facebook className="h-3 w-3 text-blue-600" />
                            )}
                            {post.platforms?.includes("instagram") && (
                              <Instagram className="h-3 w-3 text-pink-600" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          {/* Scheduled time */}
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${isPast ? 'text-rose-600 font-bold' : 'text-muted-foreground'}`}>
                            <Calendar className="h-2.5 w-2.5" />
                            {scheduledDate.toLocaleString("en-AU", {
                              timeZone: "Australia/Melbourne",
                              dateStyle: "medium",
                              timeStyle: "short"
                            })} AEST/AEDT {isPast && '(Overdue)'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          {/* Status */}
                          <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${
                            post.status === 'approved' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400' 
                              : post.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {post.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => handleDeleteScheduledPost(post.id)}
                        title="Cancel & Delete Post"
                      >
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
