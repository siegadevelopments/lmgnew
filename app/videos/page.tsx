'use client'

import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { videosQueryOptions } from "@/lib/queries";
import { useState, useMemo, Suspense, useEffect } from "react";
import { Play, Search, Radio, Loader2, Share2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import MuxPlayer from "@mux/mux-player-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { decodeEntities } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

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
  const lowerUrl = url.toLowerCase();
  return (
    /\.(mp4|webm|ogg|mov|m4v|mts|m4a|avi|wmv|flv|m3u8)(\?|$)/i.test(url) ||
    lowerUrl.includes("supabase.co/storage") ||
    lowerUrl.includes("r2.dev") ||
    lowerUrl.includes("cloudflarestorage.com") ||
    lowerUrl.includes("lifestylemedicinegateway.com") ||
    lowerUrl.includes("blob:")
  );
}

/** Build a clean YouTube embed URL (no autoplay yet) */
function buildYouTubeEmbed(ytId: string): string {
  return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`;
}

/** Build a Vimeo embed URL */
function buildVimeoEmbed(url: string): string {
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}?dnt=1`;
  return url;
}

/**
 * Given any URL a vendor might store, returns an embeddable URL ready for an iframe.
 * Appends `autoplay=1` when `autoplay` is true.
 */
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

  // Already an embed URL or external — return as-is
  return url;
}

/** Get thumbnail — YouTube gets hqdefault, others return null */
function getThumbnail(video: { thumbnail_url?: string | null; embed_url: string }): string | null {
  if (video.thumbnail_url) return video.thumbnail_url;
  const ytId = extractYouTubeId(video.embed_url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

/** Can we play this URL inline? */
function canEmbed(url: string): boolean {
  if (!url) return false;
  if (extractYouTubeId(url)) return true;
  if (url.includes("vimeo.com")) return true;
  if (isDirectVideoUrl(url)) return true;
  return false;
}

function VideosContent() {
  const { data: videos } = useSuspenseQuery(videosQueryOptions());
  const [fullscreenVideo, setFullscreenVideo] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && videos && videos.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const videoId = params.get("v") || params.get("video");
      if (videoId) {
        const matchedVideo = videos.find((v) => v.id === videoId);
        if (matchedVideo && canEmbed(matchedVideo.embed_url)) {
          setFullscreenVideo(matchedVideo);
        }
      }
    }
  }, [videos]);

  const handleShare = async (video: any) => {
    const shareData = {
      title: decodeEntities(video.title || "Educational Video"),
      text: decodeEntities(video.description || "").replace(/<\/?[^>]+(>|$)/g, ""),
      url: `${window.location.origin}/videos?v=${video.id}`,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link:", err);
      const textArea = document.createElement("textarea");
      textArea.value = shareData.url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("Link copied to clipboard!");
      } catch (e) {
        toast.error("Failed to copy link");
      }
      document.body.removeChild(textArea);
    }
  };

  const filteredVideos = useMemo(() => {
    return (videos || []).filter(
      (video) =>
        ((video.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
          (video.description?.toLowerCase() || "").includes(search.toLowerCase())),
    );
  }, [videos, search]);

  const { data: liveStreams } = useQuery({
    queryKey: ["live_streams"],
    queryFn: async () => {
      const { data } = await (supabase.from("vendor_streams") as any)
        .select("*, vendor_profiles(store_name, store_logo_url)")
        .eq("is_live", true);
      return (data as any[]) || [];
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  return (
    <>
      <div className="bg-background min-h-screen">
        {/* Hero */}
        <div className="bg-wellness-muted py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Educational Videos
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Explore our curated selection of video content to support your wellness journey.
            </p>
            <div className="mx-auto mt-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Streams Section */}
        {liveStreams && liveStreams.length > 0 && (
          <div className="bg-destructive/5 border-y border-destructive/10 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 mb-8">
                <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                <h2 className="text-2xl font-bold tracking-tight">Live Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {liveStreams.map((stream) => (
                  <div
                    key={stream.vendor_id}
                    className="group relative overflow-hidden rounded-2xl bg-black shadow-elevated border border-destructive/20 aspect-video"
                  >
                    <MuxPlayer
                      playbackId={stream.mux_playback_id}
                      streamType="live"
                      autoPlay={false}
                      className="w-full h-full"
                    />
                    <div className="absolute top-4 left-4 z-10">
                      <Badge variant="destructive" className="animate-pulse gap-1.5 px-3 py-1">
                        <Radio className="h-3 w-3" /> LIVE
                      </Badge>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                      <div className="flex items-center gap-3">
                        {stream.vendor_profiles?.store_logo_url && (
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                            <Image
                              src={stream.vendor_profiles.store_logo_url}
                              alt="Vendor Logo"
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-bold">
                            {stream.vendor_profiles?.store_name || "Vendor"}
                          </p>
                          <p className="text-white/70 text-sm line-clamp-1">
                            {stream.stream_title || "Lifestyle Medicine Live Session"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {filteredVideos.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border">
              <p className="text-muted-foreground text-lg">No videos matched your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredVideos.map((video) => {
                const thumbnail = getThumbnail(video);
                const title = decodeEntities(video.title || "");
                const embeddable = canEmbed(video.embed_url);

                return (
                  <div
                    key={video.id}
                    className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm border border-border transition-all hover:shadow-md cursor-pointer group"
                    onClick={() => embeddable && setFullscreenVideo(video)}
                  >
                    {/* Video area */}
                    <div className="relative aspect-video overflow-hidden bg-black">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={title}
                          fill
                          loading="lazy"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-wellness/10" />
                      )}
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
                      {/* Play circle / Status indicator */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {video.status === "uploading" && !embeddable ? (
                          <div className="rounded-full bg-primary/20 p-4 text-white shadow-xl backdrop-blur-sm flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Processing</span>
                          </div>
                        ) : (
                          <div className="rounded-full bg-primary/90 p-4 text-white shadow-xl ring-4 ring-white/20 transition-all group-hover:scale-110 group-hover:bg-primary group-hover:ring-white/40">
                            <Play className="h-8 w-8 ml-0.5" fill="currentColor" />
                          </div>
                        )}
                      </div>
                      
                      {/* "External" badge for non-embeddable URLs */}
                      {!embeddable && video.embed_url && (
                        <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-0.5 text-xs text-white/80 backdrop-blur-sm">
                          Opens externally
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                      {video.description && (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {decodeEntities(video.description.replace(/<\/?[^>]+(>|$)/g, ""))}
                        </p>
                      )}
                      
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                        {embeddable ? (
                          <div className="text-sm font-medium text-primary flex items-center gap-1.5">
                            <Play className="h-4 w-4" /> Watch Now
                          </div>
                        ) : video.embed_url ? (
                          <a
                            href={video.embed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                          >
                            <Play className="h-4 w-4" /> Watch on external site →
                          </a>
                        ) : (
                          <div />
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(video);
                          }}
                          className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all p-2 rounded-full border border-transparent hover:border-primary/10 flex items-center justify-center"
                          title="Share Video"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      <Dialog open={!!fullscreenVideo} onOpenChange={(open) => !open && setFullscreenVideo(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none shadow-2xl overflow-hidden rounded-xl">
          {fullscreenVideo && (
            <div className="relative w-full aspect-video flex flex-col items-center justify-center">
              {isDirectVideoUrl(fullscreenVideo.embed_url) ? (
                <>
                  <video
                    key={fullscreenVideo.embed_url}
                    src={fullscreenVideo.embed_url}
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain bg-black"
                    onError={(e) => {
                      console.error("Video play error:", e);
                      // Fallback or show error message
                      const target = e.target as HTMLVideoElement;
                      const errorMsg = target.error ? ` (Error: ${target.error.code} - ${target.error.message})` : "";
                      alert(`The video could not be played.${errorMsg} Please check your connection or try another browser.`);
                    }}
                  />
                  {/\.(mts)(\?|$)/i.test(fullscreenVideo.embed_url) && (
                    <div className="absolute top-4 inset-x-0 mx-auto max-w-xs bg-black/60 backdrop-blur-md p-3 rounded-lg text-[10px] text-white/80 text-center border border-white/10">
                      Note: .MTS files may not play in all browsers. <br />
                      If it doesn't load, please use Chrome or convert to MP4.
                      <a 
                        href={fullscreenVideo.embed_url} 
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
                  src={getEmbedUrl(fullscreenVideo.embed_url, true)}
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
    </>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <VideosContent />
    </Suspense>
  );
}
