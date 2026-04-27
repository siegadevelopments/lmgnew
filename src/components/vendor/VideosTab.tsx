import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Video as VideoIcon } from "lucide-react";

interface Video { id: string; title: string; embed_url: string; description: string | null; created_at: string | null; }

interface Props {
  videos: Video[];
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  userId: string;
}

export function VideosTab({ videos, setVideos, userId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: "", title: "", embed_url: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload: any = {
        title: form.title, 
        embed_url: form.embed_url, 
        description: form.description || null,
        author_id: userId,
        updated_at: new Date().toISOString()
      };

      if (form.id) {
        // Update existing
        const { data, error } = await (supabase
          .from("videos") as any)
          .update(payload as any)
          .eq("id", form.id)
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          setVideos(videos.map(v => v.id === form.id ? (data as Video) : v));
          toast.success("Video updated successfully!");
        }
      } else {
        // Create new
        const { data, error } = await supabase
          .from("videos")
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          setVideos([data as Video, ...videos]);
          toast.success("Video added successfully!");
        }
      }
      
      setIsEditing(false);
      setForm({ id: "", title: "", embed_url: "", description: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (v: Video) => {
    setForm({
      id: v.id,
      title: v.title,
      embed_url: v.embed_url,
      description: v.description || ""
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
      setVideos(videos.filter(v => v.id !== id));
      toast.success("Video deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Video Content</CardTitle>
        {!isEditing && (
          <Button onClick={() => { setForm({ id: "", title: "", embed_url: "", description: "" }); setIsEditing(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Video
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing && (
          <div className="mb-8 rounded-xl border border-primary/20 p-6 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-lg font-bold mb-4">{form.id ? "Edit Video" : "Add New Video"}</h3>
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter video title" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>YouTube / Embed URL</Label>
                <Input required value={form.embed_url} onChange={e => setForm({ ...form, embed_url: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
                <p className="text-[10px] text-muted-foreground mt-1">Paste a YouTube embed URL or any video embed link.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description (optional)</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe this video" />
              </div>
              <div className="flex gap-2 sm:col-span-2 pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : form.id ? "Update Video" : "Upload Video"}</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}
        <div className="space-y-3">
          {videos.length === 0 && !isEditing && (
            <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              <p>No videos uploaded yet.</p>
            </div>
          )}
          {videos.map(v => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-muted/30 transition-all group">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <VideoIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{v.title}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{v.embed_url}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(v)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(v.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
