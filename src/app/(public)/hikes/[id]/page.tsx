"use client";

import { useHike } from "@/hooks/useHike";
import { updateHike } from "@/lib/hikes";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { HikeLightbox } from "@/components/hikes/HikeLightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, MapPin, Move, Route } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";

type MediaSettings = { focalX: number; focalY: number; heightVh: number };
type SettingsMap = Record<string, MediaSettings>;

const DEFAULT_SETTINGS: MediaSettings = { focalX: 50, focalY: 50, heightVh: 40 };

function isVideo(url: string): boolean {
  return /\.(mp4|mov|webm|avi)/i.test(url);
}

export default function HikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { hike, loading } = useHike(id);
  const { isOwner } = useAuth();

  const [mediaSettings, setMediaSettings] = useState<SettingsMap>({});
  const [repositionUrl, setRepositionUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Hero cover controls
  const [coverPatch, setCoverPatch] = useState<{ focalX: number; focalY: number } | null>(null);
  const [coverHeightPatch, setCoverHeightPatch] = useState<number | undefined>(undefined);
  const [repositionCover, setRepositionCover] = useState(false);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const settingsRef = useRef<SettingsMap>({});
  settingsRef.current = mediaSettings;

  useEffect(() => {
    if (!hike) return;
    const init: SettingsMap = {};
    hike.mediaUrls.forEach((url) => {
      const s = hike.mediaSettings?.[url];
      init[url] = {
        focalX: s?.focalX ?? 50,
        focalY: s?.focalY ?? 50,
        heightVh: s?.heightVh ?? 40,
      };
    });
    setMediaSettings(init);
  }, [hike?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveMediaSettings(updated: SettingsMap) {
    await updateHike(id, { mediaSettings: updated });
  }

  function openLightbox(url: string) {
    const images = (hike?.mediaUrls ?? []).filter((u) => !isVideo(u));
    const idx = images.indexOf(url);
    setLightboxImages(images);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!hike) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Hike not found.</p>
        <Button asChild variant="outline">
          <Link href="/hikes">Back to hikes</Link>
        </Button>
      </div>
    );
  }

  const coverImage = hike.coverImageUrl ?? hike.mediaUrls.find((u) => !isVideo(u));
  const coverFocalX = coverPatch?.focalX ?? hike.coverFocalX ?? 50;
  const coverFocalY = coverPatch?.focalY ?? hike.coverFocalY ?? 50;
  const coverHeight = coverHeightPatch ?? hike.coverHeightVh ?? 50;

  const repositionSettings = repositionUrl
    ? (mediaSettings[repositionUrl] ?? DEFAULT_SETTINGS)
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/hikes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All hikes
        </Link>
      </Button>

      {/* Hero */}
      {coverImage && (
        <div className="mb-8">
          <div
            className="relative rounded-3xl overflow-hidden bg-sage-100"
            style={{ height: `${coverHeight}vh` }}
          >
            <img
              src={coverImage}
              alt={hike.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: `${coverFocalX}% ${coverFocalY}%` }}
            />
            {isOwner && (
              <button
                className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors"
                onClick={() => setRepositionCover(true)}
              >
                <Move className="w-3 h-3" />
                Reposition
              </button>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 px-1 mt-2">
              <span className="text-xs text-muted-foreground shrink-0">S</span>
              <input
                type="range"
                min={20}
                max={80}
                step={5}
                value={coverHeight}
                onChange={(e) => setCoverHeightPatch(Number(e.target.value))}
                onPointerUp={(e) =>
                  updateHike(id, {
                    coverHeightVh: Number((e.target as HTMLInputElement).value),
                  })
                }
                onTouchEnd={(e) =>
                  updateHike(id, {
                    coverHeightVh: Number((e.target as HTMLInputElement).value),
                  })
                }
                className="flex-1 accent-sage-600"
              />
              <span className="text-xs text-muted-foreground shrink-0">L</span>
            </div>
          )}
        </div>
      )}

      {/* Title + meta */}
      <h1 className="text-4xl font-bold mb-2">{hike.title}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
        <time>{formatDate(hike.date)}</time>
        {hike.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {hike.location}
          </span>
        )}
        {hike.distance && (
          <span className="flex items-center gap-1">
            <Route className="h-3.5 w-3.5" />
            {hike.distance} km
          </span>
        )}
      </div>

      {/* Notes */}
      {hike.notes && (
        <blockquote className="border-l-4 border-sage-300 pl-4 text-muted-foreground italic mb-8">
          {hike.notes}
        </blockquote>
      )}

      {/* Gallery */}
      {hike.mediaUrls.length > 0 && (
        <div>
          {isOwner && (
            <div className="flex justify-end mb-3">
              <Button
                size="sm"
                variant={isEditMode ? "default" : "outline"}
                className={isEditMode ? "bg-sage-600 hover:bg-sage-700" : ""}
                onClick={() => setIsEditMode((v) => !v)}
              >
                {isEditMode ? "Done" : "Edit layout"}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hike.mediaUrls.map((url) => {
              const s = mediaSettings[url] ?? DEFAULT_SETTINGS;
              return (
                <div key={url} className="space-y-1.5">
                  <div
                    className="relative rounded-2xl overflow-hidden bg-sage-50"
                    style={{ height: `${s.heightVh}vh` }}
                  >
                    {isVideo(url) ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={hike.title}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        style={{ objectPosition: `${s.focalX}% ${s.focalY}%` }}
                        onClick={() => openLightbox(url)}
                      />
                    )}
                    {isOwner && !isVideo(url) && (
                      <button
                        className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors"
                        onClick={() => setRepositionUrl(url)}
                      >
                        <Move className="w-3 h-3" />
                        Reposition
                      </button>
                    )}
                  </div>

                  {isOwner && isEditMode && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs text-muted-foreground shrink-0">S</span>
                      <input
                        type="range"
                        min={15}
                        max={80}
                        step={5}
                        value={s.heightVh}
                        onChange={(e) => {
                          const heightVh = Number(e.target.value);
                          setMediaSettings((prev) => ({
                            ...prev,
                            [url]: { ...(prev[url] ?? DEFAULT_SETTINGS), heightVh },
                          }));
                        }}
                        onPointerUp={(e) => {
                          const heightVh = Number(
                            (e.target as HTMLInputElement).value
                          );
                          const curr = settingsRef.current;
                          saveMediaSettings({
                            ...curr,
                            [url]: { ...(curr[url] ?? DEFAULT_SETTINGS), heightVh },
                          });
                        }}
                        onTouchEnd={(e) => {
                          const heightVh = Number(
                            (e.target as HTMLInputElement).value
                          );
                          const curr = settingsRef.current;
                          saveMediaSettings({
                            ...curr,
                            [url]: { ...(curr[url] ?? DEFAULT_SETTINGS), heightVh },
                          });
                        }}
                        className="flex-1 accent-sage-600"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">L</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gallery image reposition */}
      {repositionUrl && repositionSettings && (
        <ImageRepositionSheet
          open={!!repositionUrl}
          onOpenChange={(open) => {
            if (!open) setRepositionUrl(null);
          }}
          imageUrl={repositionUrl}
          heightVh={repositionSettings.heightVh}
          focalX={repositionSettings.focalX}
          focalY={repositionSettings.focalY}
          onCommit={(x, y) => {
            const curr = settingsRef.current;
            const updated = {
              ...curr,
              [repositionUrl]: {
                ...(curr[repositionUrl] ?? DEFAULT_SETTINGS),
                focalX: x,
                focalY: y,
              },
            };
            setMediaSettings(updated);
            saveMediaSettings(updated);
            setRepositionUrl(null);
          }}
        />
      )}

      {/* Cover reposition */}
      {coverImage && (
        <ImageRepositionSheet
          open={repositionCover}
          onOpenChange={(open) => {
            if (!open) setRepositionCover(false);
          }}
          imageUrl={coverImage}
          heightVh={coverHeight}
          focalX={coverFocalX}
          focalY={coverFocalY}
          onCommit={(x, y) => {
            updateHike(id, { coverFocalX: x, coverFocalY: y });
            setCoverPatch({ focalX: x, focalY: y });
            setRepositionCover(false);
          }}
        />
      )}

      {/* Lightbox */}
      <HikeLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
