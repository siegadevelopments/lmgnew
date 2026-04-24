import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MuxPlayer from "@mux/mux-player-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Plus, Star, Users, Package, UserPlus, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendors/$slug")({
  loader: async ({ context: { queryClient }, params: { slug } }) => {
    // For vendors, we are currently passing ID in place of slug
    const { data: vendor } = await supabase
      .from("vendor_profiles")
      .select("*")
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

  const { data: streamInfo } = useQuery({
    queryKey: ["vendor_stream", slug],
    queryFn: async () => {
      const { data } = await (supabase
        .from("vendor_streams") as any)
        .select("*")
        .eq("vendor_id", slug)
        .single();
      return data;
    },
  });

  const joinedDate = new Date(vendor.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const productCount = vendorProducts?.length || 0;

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
                    <img src={vendor.store_logo_url} className="h-16 w-16 rounded-full border-2 border-white/20 object-cover" />
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
                  <h1 className="text-lg font-bold truncate max-w-[180px]">{vendor.store_name || "Vendor"}</h1>
                  <p className="text-[10px] text-white/60">Active 37 minutes ago</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10 h-8 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Follow
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/10 h-8 text-xs gap-1">
                  <MessageCircle className="h-3 w-3" /> Chat
                </Button>
              </div>
            </div>

            {/* Store Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8 lg:col-span-2 py-2">
               <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">Products:</span> <span className="text-primary font-bold">{productCount}</span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">Following:</span> <span className="text-primary font-bold">17</span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">Chat Performance:</span> <span className="text-primary font-bold">95%</span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">Followers:</span> <span className="text-primary font-bold">5.9K</span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">Rating:</span> <span className="text-primary font-bold">4.8 (7K Rating)</span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs">
                    <span className="text-muted-foreground">Joined:</span> <span className="text-primary font-bold">{joinedDate}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <Tabs defaultValue="home" className="w-full">
              <TabsList className="bg-transparent border-b-0 h-12 gap-8 p-0">
                 <TabsTrigger value="home" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-4 text-sm font-medium">Home</TabsTrigger>
                 <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-4 text-sm font-medium">All Products</TabsTrigger>
                 <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-4 text-sm font-medium">Profile</TabsTrigger>
              </TabsList>
           </Tabs>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
        {/* Live Stream Section (If active) */}
        {streamInfo?.is_live && streamInfo?.mux_playback_id && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse px-3 py-1">LIVE NOW</Badge>
              <h2 className="text-xl font-bold">{streamInfo.stream_title || "Vendor Live Stream"}</h2>
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
           {/* Section: Recommended */}
           <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recommended For You</h2>
                <Link to="/products" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">See All <span className="text-[10px]">›</span></Link>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {vendorProducts && vendorProducts.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
           </section>

           {/* Section: Top Products */}
           <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Top Products</h2>
                <Link to="/products" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">See All <span className="text-[10px]">›</span></Link>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {vendorProducts && vendorProducts.slice(6, 12).map((product, idx) => (
                  <div key={product.id} className="relative">
                    <ProductCard product={product} />
                    <div className="absolute top-0 left-0 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-md shadow-sm">
                      TOP {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
           </section>

           {/* Full Catalog link if many products */}
           {productCount > 12 && (
             <div className="text-center pt-8">
               <Button variant="outline" className="px-12" asChild>
                 <Link to="/products">View Full Catalog ({productCount})</Link>
               </Button>
             </div>
           )}

           {productCount === 0 && (
             <div className="rounded-xl border border-dashed border-border py-12 text-center bg-white">
               <p className="text-muted-foreground">This vendor hasn't published any products yet.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
