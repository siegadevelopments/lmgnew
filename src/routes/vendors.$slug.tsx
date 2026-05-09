import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MuxPlayer from "@mux/mux-player-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Plus,
  Star,
  Users,
  Package,
  UserPlus,
  Clock,
  Calendar,
  Check,
  Search,
  Video,
  Play,
  Maximize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

/** Extract YouTube video ID from any known URL format */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

/** Returns true if URL points to a raw video file or Supabase storage */
function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v|mts)(\?|$)/i.test(url) || url.includes("supabase.co/storage");
}

/** Build a clean YouTube embed URL */
function buildYouTubeEmbed(ytId: string): string {
  return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`;
}

/** Build a Vimeo embed URL */
function buildVimeoEmbed(url: string): string {
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}?dnt=1`;
  return url;
}

/** Build any embed URL */
function getEmbedUrl(url: string, autoplay = false): string {
  if (!url) return "";
  const ytId = extractYouTubeId(url);
  if (ytId) {
    const base = buildYouTubeEmbed(ytId);
    return autoplay ? `${base}&autoplay=1` : base;
  }
  if (url.includes("vimeo.com")) {
    const base = buildVimeoEmbed(url);
    const sep = base.includes("?") ? "&" : "?";
    return autoplay ? `${base}${sep}autoplay=1` : base;
  }
  return url;
}

export const Route = createFileRoute("/vendors/$slug")({
  loader: async ({ context: { queryClient }, params: { slug } }) => {
    // For vendors, we are currently passing ID in place of slug
    const { data: vendor } = await supabase
      .from("vendor_profiles")
      .select(
        "id, store_name, store_description, store_logo_url, store_banner_url, website, instagram, facebook, twitter, is_approved, vendor_type, created_at, updated_at",
      )
      .eq("id", slug)
      .single();
    if (!vendor) throw notFound();
    return vendor as any;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    return {
      meta: [
        { title: `${loaderData.store_name} — Lifestyle Medicine Gateway` },
        { name: "description", content: loaderData.store_description || "Vendor profile" },
      ],
    };
  },
  component: VendorPage,
});

function VendorPage() {
  const vendor = Route.useLoaderData();
  const { slug } = Route.useParams();

  const { data: vendorProducts } = useQuery({
    queryKey: ["products", "vendor", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", slug)
        .eq("status", "published");
      return (data as any[]) || [];
    },
  });

  const { data: vendorVideos } = useQuery({
    queryKey: ["videos", "vendor", vendor.id],
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("*").eq("author_id", vendor.id);
      return (data as any[]) || [];
    },
  });

  const { data: vendorGallery } = useQuery({
    queryKey: ["vendor_gallery", vendor.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_items")
        .select("*, galleries!inner(*)")
        .eq("galleries.vendor_id", vendor.id)
        .eq("galleries.category", "vendor_gallery");
      return (data as any[]) || [];
    },
  });

  const { data: streamInfo } = useQuery({
    queryKey: ["vendor_stream", vendor.id],
    queryFn: async () => {
      const { data } = await (supabase.from("vendor_streams") as any)
        .select("*")
        .eq("vendor_id", vendor.id)
        .maybeSingle();
      return data;
    },
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const joinedDate = new Date(vendor.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const productCount = vendorProducts?.length || 0;
  const [activeCategory, setActiveCategory] = useState("home");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Check if current user is following this vendor
  const { data: isFollowing } = useQuery({
    queryKey: ["vendor_follow", user?.id, slug],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("vendor_follows" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("vendor_id", slug)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Get total followers count
  const { data: followerCount = 5900 } = useQuery({
    queryKey: ["vendor_followers_count", slug],
    queryFn: async () => {
      const { count } = await supabase
        .from("vendor_follows" as any)
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", slug);
      return (count || 0) + 5900; // Adding dummy base for "WOW" effect as requested in design guidelines
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please login to follow vendors");
      if (isFollowing) {
        await supabase
          .from("vendor_follows" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("vendor_id", slug);
      } else {
        await (supabase.from("vendor_follows" as any) as any).insert({
          user_id: user.id,
          vendor_id: slug,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor_follow", user?.id, slug] });
      queryClient.invalidateQueries({ queryKey: ["vendor_followers_count", slug] });
      toast.success(isFollowing ? "Unfollowed vendor" : "Following vendor");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const filteredProducts = vendorProducts?.filter((p) => {
    const matchesCategory =
      activeCategory === "home" ||
      activeCategory === "all" ||
      activeCategory === "about" ||
      p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      {/* Shopee-style Vendor Header */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Store Profile Card */}
            <div className="relative overflow-hidden rounded-md bg-[#2d2d44] p-5 text-white shadow-lg lg:col-span-1">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {vendor.store_logo_url ? (
                    <img
                      src={vendor.store_logo_url}
                      className="h-16 w-16 rounded-full border-2 border-white/20 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold border-2 border-white/20">
                      {(vendor.store_name || "V").charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary px-2 py-0.5 text-[8px] font-bold rounded-sm shadow-sm whitespace-nowrap">
                    Preferred
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold truncate max-w-[180px]">
                    {vendor.store_name || "Vendor"}
                  </h1>
                  <p className="text-[10px] text-white/60">Active 37 minutes ago</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFollow.mutate()}
                  className={cn(
                    "flex-1 bg-transparent border-white/30 text-white hover:bg-white/10 h-8 text-xs gap-1",
                    isFollowing && "bg-white/20 border-white/50",
                  )}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-3 w-3" /> Following
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" /> Follow
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!user) {
                      toast.error("Please login to chat with vendors");
                      return;
                    }
                    setIsChatOpen(true);
                  }}
                  className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10 h-8 text-xs gap-1"
                >
                  <MessageCircle className="h-3 w-3" /> Chat
                </Button>
              </div>
            </div>

            {/* Store Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8 lg:col-span-2 py-2">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Products:</span>{" "}
                  <span className="text-primary font-bold">{productCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Following:</span>{" "}
                  <span className="text-primary font-bold">17</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Chat Performance:</span>{" "}
                  <span className="text-primary font-bold">95%</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Followers:</span>{" "}
                  <span className="text-primary font-bold">
                    {(followerCount / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Rating:</span>{" "}
                  <span className="text-primary font-bold">4.8 (7K Rating)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Joined:</span>{" "}
                  <span className="text-primary font-bold">{joinedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs
              value={activeCategory}
              onValueChange={setActiveCategory}
              className="w-full md:w-auto"
            >
              <TabsList className="bg-transparent border-b-0 h-12 gap-4 sm:gap-8 p-0 overflow-x-auto overflow-y-hidden no-scrollbar">
                <TabsTrigger
                  value="home"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-2 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  Home
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-2 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  {vendor.vendor_type === "service" ? "All Services" : "All Products"}
                </TabsTrigger>
                <TabsTrigger
                  value="videos"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-2 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  Videos
                </TabsTrigger>
                <TabsTrigger
                  value="gallery"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-2 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  Gallery
                </TabsTrigger>
                {(vendor.store_categories || []).map((cat: string) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-2 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
                <TabsTrigger
                  value="about"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-2 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  Profile
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-64 mb-3 md:mb-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search in this shop"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value && activeCategory === "home") {
                    setActiveCategory("all");
                  }
                }}
                className="w-full bg-muted/50 border border-border/50 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
        {/* Live Stream Section (If active) */}
        {streamInfo?.is_live && streamInfo?.mux_playback_id && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse px-3 py-1">
                LIVE NOW
              </Badge>
              <h2 className="text-xl font-bold">
                {streamInfo.stream_title || "Vendor Live Stream"}
              </h2>
            </div>
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-elevated border border-border">
              <MuxPlayer
                playbackId={streamInfo.mux_playback_id}
                streamType="live"
                autoPlay
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Home Content */}
        <div className="space-y-12">
          {activeCategory === "home" && (
            <>
              {/* Section: Recommended */}
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Recommended For You
                  </h2>
                  <button
                    onClick={() => setActiveCategory("all")}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    See All <span className="text-[10px]">›</span>
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {vendorProducts &&
                    vendorProducts
                      .slice(0, 6)
                      .map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </section>

              {/* Section: Top Products */}
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Top Products
                  </h2>
                  <button
                    onClick={() => setActiveCategory("all")}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    See All <span className="text-[10px]">›</span>
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {vendorProducts &&
                    vendorProducts.slice(6, 12).map((product, idx) => (
                      <div key={product.id} className="relative">
                        <ProductCard product={product} />
                        <div className="absolute top-0 left-0 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-md shadow-sm">
                          TOP {idx + 1}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            </>
          )}

          {(activeCategory === "all" ||
            (activeCategory !== "home" &&
              activeCategory !== "about" &&
              activeCategory !== "videos")) && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {activeCategory === "all"
                    ? vendor.vendor_type === "service"
                      ? "All Services"
                      : "All Products"
                    : activeCategory}
                </h2>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredProducts?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
                {filteredProducts?.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground bg-white rounded-xl border border-dashed">
                    No products found in this category.
                  </div>
                )}
              </div>
            </section>
          )}

          {activeCategory === "videos" && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Videos from {vendor.store_name}
                </h2>
              </div>
              {vendorVideos && vendorVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendorVideos.map((video) => {
                    const isDirectVideo =
                      !!video.embed_url?.match(/\.(mp4|webm|ogg|mov)$/i) ||
                      video.embed_url?.includes("supabase.co");
                    const ytId = video.embed_url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1];
                    const thumbnail =
                      video.thumbnail_url ||
                      (ytId
                        ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
                        : "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800");

                    return (
                      <div
                        key={video.id}
                        className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-border group transition-all hover:shadow-md cursor-pointer"
                        onClick={() => setPlayingId(video.embed_url)}
                      >
                        <div className="relative aspect-video bg-black overflow-hidden">
                          <img
                            src={thumbnail}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt={video.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                              <Play className="h-6 w-6 fill-current" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground bg-white rounded-xl border border-dashed">
                  This vendor hasn't uploaded any videos yet.
                </div>
              )}
            </section>
          )}

          {activeCategory === "gallery" && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Media Gallery
                </h2>
              </div>
              {vendorGallery && vendorGallery.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {vendorGallery.map((item: any) => (
                    <Dialog key={item.id}>
                      <DialogTrigger asChild>
                        <div className="group relative aspect-square rounded-2xl overflow-hidden bg-muted cursor-pointer ring-1 ring-border/50 hover:ring-primary/50 transition-all">
                          <img
                            src={item.image_url}
                            alt="Gallery item"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-transparent border-none">
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                          <img
                            src={item.image_url}
                            alt="Gallery item large"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground bg-white rounded-xl border border-dashed">
                  This vendor hasn't uploaded any gallery images yet.
                </div>
              )}
            </section>
          )}

          {activeCategory === "about" && (
            <section className="bg-white rounded-xl p-8 border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-4">About {vendor.store_name}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {vendor.store_description || "No description provided."}
              </p>
              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block text-primary font-bold hover:underline"
                >
                  Visit Official Website ↗
                </a>
              )}
            </section>
          )}

          {/* Full Catalog link if many products and on Home */}
          {activeCategory === "home" && productCount > 12 && (
            <div className="text-center pt-8">
              <Button variant="outline" className="px-12" onClick={() => setActiveCategory("all")}>
                View Full Catalog ({productCount})
              </Button>
            </div>
          )}

          {productCount === 0 && (
            <div className="rounded-xl border border-dashed border-border py-12 text-center bg-white">
              <p className="text-muted-foreground">
                This vendor hasn't published any products yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <ChatDialog
        vendorId={slug}
        vendorName={vendor.store_name}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
      />

      <Dialog open={!!playingId} onOpenChange={(open) => !open && setPlayingId(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none shadow-2xl overflow-hidden rounded-xl">
          {playingId && (
            <div className="relative w-full aspect-video flex items-center justify-center">
              {isDirectVideoUrl(playingId) ? (
                <>
                  <video
                    src={playingId}
                    controls
                    autoPlay
                    playsInline
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain bg-black"
                  />
                  {/\.(mts)(\?|$)/i.test(playingId) && (
                    <div className="absolute top-4 inset-x-0 mx-auto max-w-xs bg-black/60 backdrop-blur-md p-3 rounded-lg text-[10px] text-white/80 text-center border border-white/10 z-20">
                      Note: .MTS files may not play in all browsers. <br />
                      If it doesn't load, please use Chrome or convert to MP4.
                      <a 
                        href={playingId} 
                        download 
                        className="block mt-2 text-primary hover:underline font-bold"
                      >
                        Download Video to View
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <iframe
                  src={getEmbedUrl(playingId, true)}
                  className="absolute inset-0 w-full h-full outline-none border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
