import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/charts")({
  head: () => ({
    meta: [
      { title: "Charts & References — Lifestyle Medicine Gateway" },
      { name: "description", content: "Explore our collection of helpful charts, protocols, and wellness references." },
    ],
  }),
  component: ChartsPage,
});

function ChartsPage() {
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: galleries, isLoading } = useQuery({
    queryKey: ["galleries", "charts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("*, gallery_items(*)")
        .eq("category", "charts")
        .order("title", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });

  const filteredGalleries = useMemo(() => {
    if (!galleries) return [];
    return galleries.filter(g => 
      g.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [galleries, searchQuery]);

  const selectedGallery = useMemo(() => {
    return galleries?.find(g => g.id === selectedGalleryId);
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
            Charts & References
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Educational charts, wellness protocols, and healthy living references.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search charts (e.g. Parasites, Smoothies, Gardening)..."
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
            
            <div>
              <h2 className="text-3xl font-bold text-foreground">{selectedGallery?.title}</h2>
              <p className="mt-2 text-muted-foreground">
                {selectedGallery?.gallery_items.length} charts found in this category
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedGallery?.gallery_items.map((item: any) => (
                <div 
                  key={item.id} 
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md cursor-pointer group"
                  onClick={() => setSelectedImage(item.image_url)}
                >
                  <div className="relative aspect-auto bg-muted">
                    <img
                      src={item.image_url}
                      alt="Chart"
                      loading="lazy"
                      className="w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
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
                      <img
                        src={coverImage}
                        alt={gallery.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BarChart3 className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                      <h3 className="text-lg font-bold text-white">{gallery.title}</h3>
                      <p className="text-white/80 text-xs font-medium">
                        {gallery.gallery_items.length} charts
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
            {filteredGalleries.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-muted-foreground">No chart categories found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-1 bg-black/90 border-none shadow-none flex items-center justify-center">
          {selectedImage && (
            <img src={selectedImage} alt="Chart" className="max-h-[90vh] w-auto rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
