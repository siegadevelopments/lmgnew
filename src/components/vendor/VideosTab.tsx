import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface Video { id: string; title: string; embed_url: string; description: string | null; created_at: string | null; }

interface Props {
  videos: Video[];
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  userId: string;
}

export function VideosTab({ videos, setVideos, userId }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", embed_url: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data } = await supabase.from("videos").insert({
      title: form.title, 
      embed_url: form.embed_url, 
      description: form.description || null,
      author_id: userId
    } as any).select().single();
    if (data) setVideos([data as Video, ...videos]);
    setAdding(false);
    setForm({ title: "", embed_url: "", description: "" });
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    await supabase.from("videos").delete().eq("id", id);
    setVideos(videos.filter(v => v.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upload Videos</CardTitle>
        {!adding && <Button onClick={() => setAdding(true)}>Add Video</Button>}
      </CardHeader>
      <CardContent>
        {adding && (
          <div className="mb-8 rounded-xl border border-border p-4 bg-muted/30">
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>YouTube / Embed URL</Label>
                <Input required value={form.embed_url} onChange={e => setForm({ ...form, embed_url: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
                <p className="text-xs text-muted-foreground">Paste a YouTube embed URL or any video embed link</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description (optional)</Label>
                <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Upload Video"}</Button>
                <Button type="button" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}
        <div className="space-y-3">
          {videos.length === 0 && <p className="py-8 text-center text-muted-foreground">No videos uploaded yet.</p>}
          {videos.map(v => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground truncate">{v.embed_url}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => handleDelete(v.id)}>Delete</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
