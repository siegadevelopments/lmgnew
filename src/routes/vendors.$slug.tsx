import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MuxPlayer from "@mux/mux-player-react";
import { Badge } from "@/components/ui/badge";

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
      const { data } = await supabase
        .from("vendor_streams")
        .select("*")
        .eq("vendor_id", slug)
        .single();
      return data;
    },
  });

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/vendors" className="text-sm font-medium text-primary hover:underline">← Back to vendors</Link>
        
        <div className="mt-8 flex flex-col md:flex-row gap-8 items-start">
          {/* Vendor profile info */}
          <div className="w-full md:w-1/3 shrink-0 rounded-2xl border border-border bg-card p-6 shadow-sm">
            {vendor.store_logo_url ? (
              <img src={vendor.store_logo_url} className="h-32 w-32 rounded-full object-cover mx-auto" />
            ) : (
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-wellness-muted text-4xl font-bold text-primary">
                {vendor.store_name.charAt(0)}
              </div>
            )}
            <h1 className="mt-6 text-2xl font-bold text-center text-foreground">{vendor.store_name}</h1>
            {vendor.store_description && (
              <p className="mt-4 text-sm text-muted-foreground">{vendor.store_description}</p>
            )}
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="mt-4 block text-sm text-primary hover:underline">
                Visit Website ↗
              </a>
            )}
          </div>

            )}
          </div>

          {/* Vendor Content */}
          <div className="w-full md:w-2/3 space-y-8">
            {streamInfo?.is_live && streamInfo?.mux_playback_id && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="animate-pulse px-3 py-1">LIVE NOW</Badge>
                  <h2 className="text-xl font-bold">{streamInfo.stream_title || "Vendor Live Stream"}</h2>
                </div>
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-elevated border border-border">
                  <MuxPlayer
                    playbackId={streamInfo.mux_playback_id}
                    streamType="live"
                    autoPlay
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-foreground">Products by {vendor.store_name}</h2>
            {vendorProducts && vendorProducts.length > 0 ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {vendorProducts.map((product) => (
                  <Link
                    key={product.id}
                    to="/products/$slug"
                    params={{ slug: product.slug }}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-card"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground bg-muted/50">No Image</div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <div className="mt-auto pt-3">
                        <p className="text-base font-bold text-primary">${product.price}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-border py-12 text-center">
                <p className="text-muted-foreground">This vendor hasn't published any products yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
