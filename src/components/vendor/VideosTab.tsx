import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Video as VideoIcon, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { uploadMedia } from "@/lib/upload";

interface Video { 
  id: string; 
  title: string; 
  embed_url: string; 
  description: string | null; 
  created_at: string | null;
  status?: string;
}

interface Props {
  videos: Video[];
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  userId: string;
}

export function VideosTab({ videos, setVideos, userId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [form, setForm] = useState({ id: "", title: "", embed_url: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadProgress(0);
    
    try {
      let finalEmbedUrl = form.embed_url;
      let initialStatus = "ready";

      if (uploadMode === "file" && selectedFile && !form.id && !finalEmbedUrl) {
        initialStatus = "ready";
        const url = await uploadMedia(selectedFile, `videos/${userId}`);
        if (!url) throw new Error("Failed to upload video file.");
        finalEmbedUrl = url;
      }

      const payload: any = {
        title: form.title, 
        embed_url: finalEmbedUrl, 
        description: form.description || null,
        author_id: userId,
        status: initialStatus,
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
          
          if (uploadMode === "file") {
            toast.success("Video uploaded and added successfully!");
          } else {
            toast.success("Video added successfully!");
          }
        }
      }
      
      resetForm();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save video");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setForm({ id: "", title: "", embed_url: "", description: "" });
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadMode("url");
  };

  const handleEdit = (v: Video) => {
    setForm({
      id: v.id,
      title: v.title,
      embed_url: v.embed_url,
      description: v.description || ""
    });
    setUploadMode("url"); // Edit only supports URL for now
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
            
            {!form.id && (
              <div className="mb-6">
                <Label className="mb-2 block">Upload Method</Label>
                <Tabs value={uploadMode} onValueChange={(v: any) => setUploadMode(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" /> Paste Link
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" /> Upload File
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter video title" />
              </div>
              
              {uploadMode === "url" || form.id ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>YouTube / Embed URL</Label>
                  <Input required value={form.embed_url} onChange={e => setForm({ ...form, embed_url: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
                  <p className="text-[10px] text-muted-foreground mt-1">Paste a YouTube embed URL or any video embed link.</p>
                </div>
              ) : (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Video File</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-lg p-8 bg-background cursor-pointer hover:bg-accent/50 transition-all"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="video/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSelectedFile(file);
                        
                        // Start upload immediately for better UX
                        setSubmitting(true);
                        const loadingToast = toast.loading("Uploading video...");
                        const url = await uploadMedia(file, `videos/${userId}`);
                        if (url) {
                          setForm(prev => ({ ...prev, embed_url: url }));
                          toast.success("Video uploaded!", { id: loadingToast });
                        } else {
                          toast.error("Failed to upload video", { id: loadingToast });
                        }
                        setSubmitting(false);
                      }}
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <VideoIcon className="h-10 w-10 text-primary mb-2" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Click to select video</p>
                        <p className="text-xs text-muted-foreground">MP4, MOV, or WEBM (Max 100MB recommended)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label>Description (optional)</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe this video" />
              </div>

              {submitting && uploadProgress > 0 && (
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex justify-between text-xs">
                    <span>Uploading to storage...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              <div className="flex gap-2 sm:col-span-2 pt-2">
                <Button type="submit" disabled={submitting || (uploadMode === "file" && !selectedFile && !form.id)}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadMode === "file" ? "Uploading..." : "Saving..."}
                    </>
                  ) : form.id ? "Update Video" : "Upload & Save"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
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
                  {v.status === 'uploading' ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <VideoIcon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{v.title}</p>
                    {v.status === 'uploading' && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Processing</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {v.status === 'uploading' ? "Uploading to YouTube..." : v.embed_url}
                  </p>
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
