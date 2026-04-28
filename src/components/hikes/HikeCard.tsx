import type { Hike } from "@/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Route, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface Props {
  hike: Hike;
  href?: string;
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

export function HikeCard({ hike, href, showActions = false, onDelete }: Props) {
  const thumbnail =
    hike.coverImageUrl ??
    hike.mediaUrls.find((u) => u.match(/\.(jpg|jpeg|png|webp|gif)/i));
  const focalX = hike.coverFocalX ?? 50;
  const focalY = hike.coverFocalY ?? 50;

  const card = (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">
      {thumbnail && (
        <div
          className={cn(
            "relative bg-sage-50 overflow-hidden",
            !hike.coverHeightVh && "aspect-video"
          )}
          style={hike.coverHeightVh ? { height: `${hike.coverHeightVh}vh` } : undefined}
        >
          <img
            src={thumbnail}
            alt={hike.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold leading-tight">{hike.title}</h3>
          {showActions && (
            <div className="flex gap-1 shrink-0">
              <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                <Link href={`/dashboard/hikes/${hike.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(hike.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
        <time className="text-xs text-muted-foreground">{formatDate(hike.date)}</time>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
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
        {hike.notes && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{hike.notes}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:shadow-md transition-shadow rounded-2xl">
        {card}
      </Link>
    );
  }
  return card;
}
