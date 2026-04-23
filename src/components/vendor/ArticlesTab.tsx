import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";

interface Article { id: number; title: string; slug: string; excerpt: string | null; image_url: string | null; created_at: string; }

interface Props {
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  userId: string;
}

export function ArticlesTab({ articles, setArticles, userId }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", image_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const slug = form.title.toLowerCase().replace(/[\s\W-]+/g, "-") + "-" + Math.floor(Math.random() * 1000);
    const { data } = await supabase.from("articles").insert({
      title: form.title, slug, content: form.content, excerpt: form.excerpt || null,
      image_url: form.image_url || null, author_id: userId, category_name: "Articles",
    } as any).select().single();
    if (data) setArticles([data as Article, ...articles]);
    setAdding(false);
    setForm({ title: "", content: "", excerpt: "", image_url: "" });
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this article?")) return;
    await supabase.from("articles").delete().eq("id", id);
    setArticles(articles.filter(a => a.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Articles & Blog</CardTitle>
        {!adding && <Button onClick={() => setAdding(true)}>Write Article</Button>}
      </CardHeader>
      <CardContent>
        {adding && (
          <div className="mb-8 rounded-xl border border-border p-4 bg-muted/30">
            <form onSubmit={handleSave} className="grid gap-4">
              <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Short Excerpt</Label><Input value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Brief summary..." /></div>
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-2">
                  <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="URL or upload" className="flex-1" />
                  <label className="shrink-0">
                    <Button type="button" variant="secondary" size="sm" asChild disabled={uploading}><span>{uploading ? "..." : "Upload"}</span></Button>
                    <input type="file" className="hidden" accept="image/*" onChange={async e => {
                      if (e.target.files?.[0]) { setUploading(true); const url = await uploadMedia(e.target.files[0], `articles/${userId}`); if (url) setForm({ ...form, image_url: url }); setUploading(false); }
                    }} />
                  </label>
                </div>
              </div>
              <div className="space-y-2"><Label>Content</Label><Textarea rows={8} required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your article content here... HTML is supported." /></div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Publishing..." : "Publish Article"}</Button>
                <Button type="button" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}
        <div className="space-y-3">
          {articles.length === 0 && <p className="py-8 text-center text-muted-foreground">No articles published yet.</p>}
          {articles.map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {a.image_url && <img src={a.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />}
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => handleDelete(a.id)}>Delete</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
