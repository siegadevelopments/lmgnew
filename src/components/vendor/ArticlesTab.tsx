import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Article { 
  id: number; 
  title: string; 
  slug: string; 
  excerpt: string | null; 
  image_url: string | null; 
  created_at: string;
  content?: string;
}

interface Props {
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  userId: string;
}

export function ArticlesTab({ articles, setArticles, userId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: 0, title: "", content: "", excerpt: "", image_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload: any = {
        title: form.title, 
        content: form.content, 
        excerpt: form.excerpt || null,
        image_url: form.image_url || null, 
        author_id: userId,
        category_name: "Articles",
        updated_at: new Date().toISOString()
      };

      if (form.id) {
        // Update existing
        const { data, error } = await (supabase
          .from("articles") as any)
          .update(payload as any)
          .eq("id", form.id)
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          setArticles(articles.map(a => a.id === form.id ? (data as Article) : a));
          toast.success("Article updated successfully!");
        }
      } else {
        // Create new
        const slug = form.title.toLowerCase().replace(/[\s\W-]+/g, "-") + "-" + Math.floor(Math.random() * 1000);
        const { data, error } = await supabase
          .from("articles")
          .insert({ ...payload, slug })
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          setArticles([data as Article, ...articles]);
          toast.success("Article published successfully!");
        }
      }
      
      setIsEditing(false);
      setForm({ id: 0, title: "", content: "", excerpt: "", image_url: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save article");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (a: Article) => {
    setForm({
      id: a.id,
      title: a.title,
      content: a.content || "",
      excerpt: a.excerpt || "",
      image_url: a.image_url || ""
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this article?")) return;
    try {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
      setArticles(articles.filter(a => a.id !== id));
      toast.success("Article deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Articles & Blog</CardTitle>
        {!isEditing && (
          <Button onClick={() => { setForm({ id: 0, title: "", content: "", excerpt: "", image_url: "" }); setIsEditing(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Write Article
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing && (
          <div className="mb-8 rounded-xl border border-primary/20 p-6 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-lg font-bold mb-4">{form.id ? "Edit Article" : "Write New Article"}</h3>
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
              <div className="space-y-2"><Label>Content</Label><Textarea rows={12} required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your article content here... HTML is supported." className="font-mono text-sm" /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : form.id ? "Update Article" : "Publish Article"}</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}
        <div className="space-y-3">
          {articles.length === 0 && !isEditing && (
            <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              <p>No articles published yet.</p>
            </div>
          )}
          {articles.map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-muted/30 transition-all group">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                  {a.image_url ? (
                    <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 font-bold text-xs">IMG</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{a.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    {new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    {a.excerpt ? "Has excerpt" : "No excerpt"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(a)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(a.id)}>
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
