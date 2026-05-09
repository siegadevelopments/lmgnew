import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Plus,
  Video as VideoIcon,
  Upload,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { uploadMedia } from "@/lib/upload";
import { useQueryClient } from "@tanstack/react-query";

interface Video {
  id: string;
  title: string;
  embed_url: string;
  thumbnail_url: string | null;
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
  const [form, setForm] = useState({
    id: "",
    title: "",
    embed_url: "",
    thumbnail_url: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadProgress(0);

    try {
      let finalEmbedUrl = form.embed_url;
      let initialStatus = "ready";

      if (uploadMode === "file" && selectedFile && !form.id && !finalEmbedUrl) {
        initialStatus = "uploading";
        const url = await uploadMedia(selectedFile, `videos/${userId}`, "video-uploads");
        if (!url) throw new Error("Failed to upload video file.");
        finalEmbedUrl = url;
      }

      const payload: any = {
        title: form.title,
        embed_url: finalEmbedUrl,
        thumbnail_url: form.thumbnail_url || null,
        description: form.description || null,
        author_id: userId,
        status: initialStatus,
        updated_at: new Date().toISOString(),
      };

      if (form.id) {
        // Update existing
        const { data, error } = await (supabase.from("videos") as any)
          .update(payload as any)
          .eq("id", form.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setVideos(videos.map((v) => (v.id === form.id ? (data as Video) : v)));
          toast.success("Video updated successfully!");
        }
      } else {
        // Create new
        const { data, error } = await supabase.from("videos").insert(payload).select().single();

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
      // Invalidate the public videos page cache
      queryClient.invalidateQueries({ queryKey: ["videos", "list"] });
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save video");
    } finally {
      setSubmitting(false);
    }
  };

  const generateAIThumbnail = async () => {
    if (!form.title) {
      toast.error("Please enter a title first to guide the AI");
      return;
    }
    setGeneratingImage(true);
    const toastId = toast.loading("AI is painting a thumbnail...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-image", {
        body: { 
          prompt: `${form.title} ${form.description || ""}`.trim(),
          author_id: userId
        },
      });
      if (error) throw error;
      if (data?.url) {
        setForm((prev) => ({ ...prev, thumbnail_url: data.url }));
        toast.success("AI Thumbnail generated!", { id: toastId });
      }
    } catch (err: any) {
      console.error("AI Generation Error details:", err);
      let message = err.message || "AI Generation failed";

      // Try to extract the actual error message from the response body
      if (err.context && typeof err.context.json === 'function') {
        try {
          const errorBody = await err.context.json();
          if (errorBody.error) message = errorBody.error;
        } catch (e) {
          try {
            const text = await err.context.text();
            if (text) message = text;
          } catch (e2) {}
        }
      }

      if (message.includes("Failed to fetch") || message.includes("Failed to send a request")) {
        message =
          "Cannot reach AI service. Please ensure the 'generate-ai-image' function is deployed and your project is active.";
      }
      toast.error(message, { id: toastId });
    } finally {
      setGeneratingImage(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setForm({ id: "", title: "", embed_url: "", thumbnail_url: "", description: "" });
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadMode("url");
  };

  const handleEdit = (v: Video) => {
    setForm({
      id: v.id,
      title: v.title,
      embed_url: v.embed_url,
      thumbnail_url: v.thumbnail_url || "",
      description: v.description || "",
    });
    setUploadMode("url"); // Edit only supports URL for now
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      const { error } = await (supabase.from("videos") as any).delete().eq("id", id);
      if (error) throw error;
      setVideos(videos.filter((v) => v.id !== id));
      // Invalidate the public videos page cache
      queryClient.invalidateQueries({ queryKey: ["videos", "list"] });
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
          <div className="flex gap-2">
            <label
              htmlFor="video-bulk-upload"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer ${
                submitting ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Bulk Upload
            </label>
            <input
              id="video-bulk-upload"
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              disabled={submitting}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                
                setSubmitting(true);
                const toastId = toast.loading(`Uploading ${files.length} videos...`);
                const newVideos: Video[] = [];

                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  try {
                    const url = await uploadMedia(file, `videos/${userId}`, "video-uploads");
                    if (url) {
                      const fileName = file.name.split(".").slice(0, -1).join(".");
                      const { data: inserted, error } = await supabase
                        .from("videos")
                        .insert({
                          title: fileName,
                          embed_url: url,
                          author_id: userId,
                          thumbnail_url: form.thumbnail_url || null,
                          status: "uploading",
                          description: `Bulk uploaded on ${new Date().toLocaleDateString()}`,
                        })
                        .select()
                        .single();

                      if (error) throw error;
                      if (inserted) newVideos.push(inserted as Video);
                    }
                  } catch (err: any) {
                    toast.error(`Error uploading ${file.name}: ${err.message}`);
                  }
                }

                if (newVideos.length > 0) {
                  setVideos((prev) => [...newVideos, ...prev]);
                  toast.success(`Successfully uploaded ${newVideos.length} videos!`, { id: toastId });
                  queryClient.invalidateQueries({ queryKey: ["videos", "list"] });
                } else {
                  toast.dismiss(toastId);
                }
                setSubmitting(false);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => {
                setForm({ id: "", title: "", embed_url: "", thumbnail_url: "", description: "" });
                setIsEditing(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Single
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isEditing && (
          <div className="mb-8 rounded-xl border border-primary/20 p-6 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-lg font-bold mb-4">{form.id ? "Edit Video" : "Add New Video"}</h3>

            {!form.id && (
              <div className="mb-6">
                <Label className="mb-2 block">Upload Method</Label>
                <Tabs
                  value={uploadMode}
                  onValueChange={(v: any) => setUploadMode(v)}
                  className="w-full"
                >
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
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter video title"
                />
              </div>

              {uploadMode === "url" || form.id ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>YouTube / Embed URL</Label>
                  <Input
                    required
                    value={form.embed_url}
                    onChange={(e) => setForm({ ...form, embed_url: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Paste a YouTube embed URL or any video embed link.
                  </p>
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
                        const url = await uploadMedia(file, `videos/${userId}`, "video-uploads");
                        if (url) {
                          setForm((prev) => ({ ...prev, embed_url: url }));
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
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Click to select video</p>
                        <p className="text-xs text-muted-foreground">
                          MP4, MOV, or WEBM (Max 100MB recommended)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label>Thumbnail URL (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    placeholder="https://... (or use AI)"
                    className="flex-1"
                  />
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
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSubmitting(true);
                        const url = await uploadMedia(file, `videos/${userId}`);
                        if (url) setForm((prev) => ({ ...prev, thumbnail_url: url }));
                        setSubmitting(false);
                        e.target.value = "";
                      }}
                    />
                  </Button>
                </div>
                {form.thumbnail_url && (
                  <div className="mt-2 relative group overflow-hidden rounded-lg border border-border aspect-[16/9] max-w-[240px]">
                    <img 
                      src={form.thumbnail_url} 
                      alt="Thumbnail Preview" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setForm({ ...form, thumbnail_url: "" })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  If left empty, AI will automatically generate a thumbnail after processing.
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Description (optional)</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Briefly describe this video"
                />
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
                <Button
                  type="submit"
                  disabled={submitting || (uploadMode === "file" && !selectedFile && !form.id)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadMode === "file" ? "Uploading..." : "Saving..."}
                    </>
                  ) : form.id ? (
                    "Update Video"
                  ) : (
                    "Upload & Save"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
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
          {videos.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {v.status === "uploading" ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <VideoIcon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {v.title}
                    </p>
                    {v.status === "uploading" && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Processing
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-md">
                    {v.status === "uploading" ? "Uploading to YouTube..." : v.embed_url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => handleEdit(v)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(v.id)}
                >
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
