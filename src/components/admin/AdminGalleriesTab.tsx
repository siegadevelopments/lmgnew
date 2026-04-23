import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AdminGalleriesTab() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGalleryTitle, setNewGalleryTitle] = useState("");
  const [newGalleryCategory, setNewGalleryCategory] = useState<"memes" | "charts">("memes");

  useEffect(() => {
    loadGalleries();
  }, []);

  async function loadGalleries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("galleries")
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
    
    const { data, error } = await supabase
      .from("galleries")
      .insert({ title: newGalleryTitle, category: newGalleryCategory })
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
    if (!confirm("Are you sure? This will delete all items in this gallery.")) return;
    
    const { error } = await supabase.from("galleries").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete gallery");
    } else {
      toast.success("Gallery deleted");
      loadGalleries();
    }
  }

  async function addImageToGallery(galleryId: string, imageUrl: string) {
    if (!imageUrl.trim()) return;

    const { error } = await supabase.from("gallery_items").insert({
      gallery_id: galleryId,
      image_url: imageUrl
    });

    if (error) {
      toast.error("Failed to add image");
    } else {
      toast.success("Image added!");
      loadGalleries();
    }
  }

  async function deleteImage(itemId: string) {
    const { error } = await supabase.from("gallery_items").delete().eq("id", itemId);
    if (error) {
      toast.error("Failed to delete image");
    } else {
      loadGalleries();
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
            </select>
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
          {galleries.map(gallery => (
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
                  <Button size="sm" variant="secondary" onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addImageToGallery(gallery.id, input.value);
                    input.value = "";
                  }}>Add Image</Button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {gallery.gallery_items.map((item: any) => (
                    <div key={item.id} className="group relative aspect-square rounded-md overflow-hidden border border-border">
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
