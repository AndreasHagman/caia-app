"use client";

import { useTricks } from "@/hooks/useTricks";
import { useHikes } from "@/hooks/useHikes";
import { Skeleton } from "@/components/ui/skeleton";

type MediaItem = {
  url: string;
  isVideo: boolean;
  source: string;
};

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi)/i.test(url);
}

export default function GalleryPage() {
  const { tricks, loading: tricksLoading } = useTricks();
  const { hikes, loading: hikesLoading } = useHikes();

  const loading = tricksLoading || hikesLoading;

  const items: MediaItem[] = [
    ...tricks.flatMap((t) =>
      t.mediaUrls.map((url) => ({
        url,
        isVideo: isVideoUrl(url),
        source: t.name,
      }))
    ),
    ...hikes.flatMap((h) =>
      h.mediaUrls.map((url) => ({
        url,
        isVideo: isVideoUrl(url),
        source: h.title,
      }))
    ),
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Gallery</h1>
      <p className="text-muted-foreground mb-10">Photos and videos from training and adventures.</p>

      {loading ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="rounded-2xl mb-3 w-full"
              style={{ height: `${140 + (i % 3) * 60}px` }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">No photos yet.</p>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          {items.map((item, i) => (
            <div key={i} className="mb-3 break-inside-avoid group relative rounded-2xl overflow-hidden bg-sage-50">
              {item.isVideo ? (
                <video
                  src={item.url}
                  controls
                  preload="metadata"
                  className="w-full h-auto block"
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.source}
                  className="w-full h-auto block"
                />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium truncate">{item.source}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
