import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, User, FileText, Video, Utensils } from "lucide-react";
import { toast } from "sonner";

export function AdminContentTab({ vendors }: { vendors: any[] }) {
  const [activeType, setActiveType] = useState<"articles" | "videos" | "recipes" | "products">("articles");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState(""); // For videos
  const [category, setCategory] = useState("General");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");

  useEffect(() => {
    loadItems();
  }, [activeType]);

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from(activeType)
      .select("*, author:profiles(full_name)") // Profiles relationship is usually named after the column or table
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error(`Failed to load ${activeType}`);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageUrl("");
    setEmbedUrl("");
    setPrepTime("");
    setCookTime("");
    setCategory("General");
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
      result = await supabase.from("articles").insert({
        ...commonData,
        content,
        image_url: imageUrl,
        slug: title.toLowerCase().replace(/ /g, "-"),
        category_name: category
      });
    } else if (activeType === "recipes") {
      result = await supabase.from("recipes").insert({
        ...commonData,
        content,
        image_url: imageUrl,
        slug: title.toLowerCase().replace(/ /g, "-"),
        prep_time: prepTime,
        cook_time: cookTime
      });
    } else if (activeType === "videos") {
      result = await supabase.from("videos").insert({
        title,
        description: content,
        embed_url: embedUrl,
        thumbnail_url: imageUrl,
        // @ts-ignore - assuming author_id added as per previous step
        author_id: selectedVendorId 
      });
    } else if (activeType === "products") {
      result = await supabase.from("products").insert({
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
      toast.success("Item saved!");
      resetForm();
      loadItems();
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from(activeType).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else loadItems();
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Embed URL (YouTube/Vimeo)</label>
                <Input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">{activeType === "products" ? "Price ($)" : "Image URL"}</label>
              <Input 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                placeholder={activeType === "products" ? "e.g. 29.99" : "https://..."} 
              />
            </div>

            {activeType === "products" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder="https://..." />
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

      <div className="grid gap-4">
        <h3 className="text-lg font-bold flex items-center gap-2 capitalize">
          Recent {activeType}
        </h3>
        {loading ? (
          <div className="flex py-10 justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No {activeType} found.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {items.map(item => (
              <Card key={item.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-muted overflow-hidden">
                      <img src={item.image_url || item.thumbnail_url} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> {item.vendor?.full_name || "Unknown Vendor"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
