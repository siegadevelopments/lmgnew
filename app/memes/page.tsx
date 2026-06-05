'use client'

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, Image as ImageIcon, Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { uploadMedia } from "@/lib/upload";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

export default function MemesPage() {
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const { data: galleries, isLoading } = useQuery({
    queryKey: ["galleries", "memes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("*, gallery_items(*)")
        .eq("category", "memes")
        .order("title", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });

  const filteredGalleries = useMemo(() => {
    if (!galleries) return [];
    return galleries.filter((g) => g.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [galleries, searchQuery]);

  const selectedGallery = useMemo(() => {
    return galleries?.find((g) => g.id === selectedGalleryId);
  }, [galleries, selectedGalleryId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero / Header */}
      <div className="bg-wellness-muted py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Memes & Inspiration
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A collection of uplifting imagery to start your day right.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search categories (e.g. Positivity, Gratitude)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {selectedGalleryId ? (
          /* Detailed View for a specific Gallery */
          <div className="space-y-8">
            <Button
              variant="ghost"
              onClick={() => setSelectedGalleryId(null)}
              className="flex items-center gap-2 -ml-2"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Categories
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{selectedGallery?.title}</h2>
                <p className="mt-2 text-muted-foreground">
                  {selectedGallery?.gallery_items.length} items found
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="relative"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {uploadingImage ? "Uploading..." : "Add Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !selectedGalleryId) return;
                        setUploadingImage(true);
                        const toastId = toast.loading("Uploading meme...");
                        try {
                          const url = await uploadMedia(file, "admin_uploads");
                          if (url) {
                            const { error } = await (supabase
                              .from("gallery_items") as any)
                              .insert({
                                gallery_id: selectedGalleryId,
                                image_url: url
                              });
                            if (error) throw error;
                            toast.success("Meme added successfully!", { id: toastId });
                            queryClient.invalidateQueries({ queryKey: ["galleries", "memes"] });
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Failed to upload", { id: toastId });
                        } finally {
                          setUploadingImage(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </Button>
                </div>
              )}
            </div>

            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {selectedGallery?.gallery_items.map((item: any) => (
                <div
                  key={item.id}
                  className="break-inside-avoid overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md cursor-pointer group"
                  onClick={() => setSelectedImage(item.image_url)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <Image
                      src={item.image_url}
                      alt="Meme"
                      fill
                      loading="lazy"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                    {isAdmin && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!confirm("Are you sure you want to delete this meme?")) return;
                          supabase
                            .from("gallery_items")
                            .delete()
                            .eq("id", item.id)
                            .then(({ error }) => {
                              if (error) toast.error("Failed to delete");
                              else {
                                toast.success("Meme deleted");
                                queryClient.invalidateQueries({ queryKey: ["galleries", "memes"] });
                              }
                            });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Grid of Categories */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGalleries.map((gallery) => {
              const coverImage = gallery.gallery_items[0]?.image_url;
              return (
                <Card
                  key={gallery.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-md border-border hover:border-primary/20"
                  onClick={() => setSelectedGalleryId(gallery.id)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={gallery.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                      <h3 className="text-lg font-bold text-white">{gallery.title}</h3>
                      <p className="text-white/80 text-xs font-medium">
                        {gallery.gallery_items.length} items
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
            {filteredGalleries.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-muted-foreground">
                  No categories found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-black/90 border-none shadow-none flex items-center justify-center">
          {selectedImage && (
            <img src={selectedImage} alt="Meme" className="max-h-[90vh] w-auto rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
