import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { videosQueryOptions } from "@/lib/queries";
import { useState } from "react";
import { Play, Maximize2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Videos — Lifestyle Medicine Gateway" },
      { name: "description", content: "Watch our exclusive educational and lifestyle videos." },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(videosQueryOptions()),
  component: VideosPage,
});

/** Decode HTML entities like &#8211; &amp; etc. */
function decodeEntities(str: string): string {
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  }
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // youtube.com/embed/ID
  let match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  // youtube.com/watch?v=ID
  match = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  // youtu.be/ID
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  // youtube.com/v/ID
  match = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];
  return null;
}

/** Build a proper embeddable YouTube URL with controls */
function getEmbedUrl(url: string): string {
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  // Already an embed URL or unknown — return as-is
  return url;
}

/** Get a thumbnail for the video */
function getThumbnail(video: { thumbnail_url: string | null; embed_url: string }): string | null {
  if (video.thumbnail_url) return video.thumbnail_url;
  const ytId = extractYouTubeId(video.embed_url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

function VideosPage() {
  const { data: videos } = useSuspenseQuery(videosQueryOptions());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-wellness-muted py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Educational Videos
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Explore our curated selection of video content to support your wellness journey.
          </p>
          <p className="mx-auto mt-2 text-sm text-muted-foreground/70">
            {videos.length} video{videos.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {videos.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Play className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-foreground">No videos yet</h2>
            <p className="mt-2 text-muted-foreground">Check back soon for educational video content.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => {
            const isPlaying = playingId === video.id;
            const embedUrl = getEmbedUrl(video.embed_url);
            const thumbnail = getThumbnail(video);
            const title = decodeEntities(video.title);
            const ytId = extractYouTubeId(video.embed_url);
            const hasValidEmbed = !!ytId || video.embed_url?.includes("vimeo.com");

            return (
              <div
                key={video.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm border border-border transition-all hover:shadow-md"
              >
                {/* Video area */}
                <div className="relative aspect-video overflow-hidden bg-black">
                  {isPlaying && hasValidEmbed ? (
                    /* Active player — YouTube/Vimeo iframe with full controls */
                    <>
                      <iframe
                        src={`${embedUrl}&autoplay=1`}
                        className="absolute inset-0 w-full h-full outline-none border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      {/* Fullscreen + Close buttons */}
                      <div className="absolute top-3 right-3 flex gap-2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenVideo(embedUrl);
                          }}
                          className="rounded-full bg-black/60 p-2 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/80"
                          title="Fullscreen"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingId(null);
                          }}
                          className="rounded-full bg-black/60 p-2 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/80"
                          title="Close player"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Thumbnail + Play button overlay */
                    <div
                      className="w-full h-full cursor-pointer group relative"
                      onClick={() => hasValidEmbed && setPlayingId(video.id)}
                    >
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-wellness/10">
                          <Play className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Dark overlay + play button */}
                      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-primary/90 p-4 text-white shadow-lg transition-all group-hover:scale-110 group-hover:bg-primary">
                          <Play className="h-8 w-8 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      {/* Duration badge (visual flair) */}
                      {!hasValidEmbed && (
                        <div className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-0.5 text-xs text-white/80">
                          External video
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 leading-snug">
                    {title}
                  </h3>
                  {video.description && (
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {decodeEntities(video.description.replace(/<\/?[^>]+(>|$)/g, ""))}
                    </p>
                  )}
                  {!isPlaying && hasValidEmbed && (
                    <button
                      onClick={() => setPlayingId(video.id)}
                      className="mt-auto pt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 self-start"
                    >
                      <Play className="h-4 w-4" /> Watch Now
                    </button>
                  )}
                  {!hasValidEmbed && video.embed_url && (
                    <a
                      href={video.embed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto pt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 self-start"
                    >
                      <Play className="h-4 w-4" /> Watch on external site →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen modal */}
      <Dialog open={!!fullscreenVideo} onOpenChange={(open) => !open && setFullscreenVideo(null)}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none shadow-2xl overflow-hidden rounded-xl">
          {fullscreenVideo && (
            <div className="relative w-full aspect-video">
              <iframe
                src={`${fullscreenVideo}&autoplay=1`}
                className="absolute inset-0 w-full h-full outline-none border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
