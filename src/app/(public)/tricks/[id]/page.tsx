"use client";

import { useTrick } from "@/hooks/useTrick";
import { TrickStatusBadge } from "@/components/tricks/TrickStatusBadge";
import { TrickProgress } from "@/components/tricks/TrickProgress";
import { ChecklistEditor } from "@/components/tricks/ChecklistEditor";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { computeProgress, updateTrick } from "@/lib/tricks";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Move } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";

type MediaSettings = { focalX: number; focalY: number; heightVh: number };
type SettingsMap = Record<string, MediaSettings>;

const DEFAULT_SETTINGS: MediaSettings = { focalX: 50, focalY: 50, heightVh: 40 };

function isVideo(url: string): boolean {
  return url.match(/\.(mp4|mov|webm|avi)/i) !== null;
}

export default function TrickDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trick, loading } = useTrick(id);
  const { isOwner } = useAuth();

  const [mediaSettings, setMediaSettings] = useState<SettingsMap>({});
  const [repositionUrl, setRepositionUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const settingsRef = useRef<SettingsMap>({});
  settingsRef.current = mediaSettings;

  useEffect(() => {
    if (!trick) return;
    const init: SettingsMap = {};
    trick.mediaUrls.forEach((url) => {
      const s = trick.mediaSettings?.[url];
      init[url] = { focalX: s?.focalX ?? 50, focalY: s?.focalY ?? 50, heightVh: s?.heightVh ?? 40 };
    });
    setMediaSettings(init);
  }, [trick?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(updated: SettingsMap) {
    await updateTrick(id, { mediaSettings: updated });
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

  if (!trick) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Trick not found.</p>
        <Button asChild variant="outline">
          <Link href="/tricks">Back to tricks</Link>
        </Button>
      </div>
    );
  }

  const progress = computeProgress(
    trick.checklist,
    trick.progressOverride ? trick.progress : undefined
  );

  const repositionSettings = repositionUrl ? (mediaSettings[repositionUrl] ?? DEFAULT_SETTINGS) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/tricks">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All tricks
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <h1 className="text-4xl font-bold">{trick.name}</h1>
        <TrickStatusBadge status={trick.status} />
      </div>

      {trick.description && (
        <p className="text-muted-foreground mb-6">{trick.description}</p>
      )}

      <div className="mb-8">
        <TrickProgress value={progress} />
      </div>

      {/* Media grid */}
      {trick.mediaUrls.length > 0 && (
        <div className="mb-8">
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
          {trick.mediaUrls.map((url) => {
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
                      alt={trick.name}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: `${s.focalX}% ${s.focalY}%` }}
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
                          [url]: { ...prev[url] ?? DEFAULT_SETTINGS, heightVh },
                        }));
                      }}
                      onPointerUp={(e) => {
                        const heightVh = Number((e.target as HTMLInputElement).value);
                        const curr = settingsRef.current;
                        save({ ...curr, [url]: { ...curr[url] ?? DEFAULT_SETTINGS, heightVh } });
                      }}
                      onTouchEnd={(e) => {
                        const heightVh = Number((e.target as HTMLInputElement).value);
                        const curr = settingsRef.current;
                        save({ ...curr, [url]: { ...curr[url] ?? DEFAULT_SETTINGS, heightVh } });
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

      {/* Checklist read-only */}
      {trick.checklist.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Training checklist</h2>
          <ChecklistEditor items={trick.checklist} onChange={() => {}} readOnly />
        </div>
      )}

      {repositionUrl && repositionSettings && (
        <ImageRepositionSheet
          open={!!repositionUrl}
          onOpenChange={(open) => { if (!open) setRepositionUrl(null); }}
          imageUrl={repositionUrl}
          heightVh={repositionSettings.heightVh}
          focalX={repositionSettings.focalX}
          focalY={repositionSettings.focalY}
          onCommit={(x, y) => {
            const curr = settingsRef.current;
            const updated = { ...curr, [repositionUrl]: { ...curr[repositionUrl] ?? DEFAULT_SETTINGS, focalX: x, focalY: y } };
            setMediaSettings(updated);
            save(updated);
            setRepositionUrl(null);
          }}
        />
      )}
    </div>
  );
}
