import { Card, CardContent } from "@/components/ui/card";
import type { Trick } from "@/types";
import { computeProgress } from "@/lib/tricks";
import { TrickStatusBadge } from "./TrickStatusBadge";
import { TrickProgress } from "./TrickProgress";
import Link from "next/link";
import Image from "next/image";

interface Props {
  trick: Trick;
  href: string;
}

export function TrickCard({ trick, href }: Props) {
  const progress = computeProgress(
    trick.checklist,
    trick.progressOverride ? trick.progress : undefined
  );
  const thumbnail =
    trick.coverImageUrl ??
    trick.mediaUrls.find((u) => u.match(/\.(jpg|jpeg|png|webp|gif)/i));
  const focalX = trick.coverFocalX ?? 50;
  const focalY = trick.coverFocalY ?? 50;

  return (
    <Link href={href}>
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
        {thumbnail ? (
          <div className="relative aspect-video bg-sage-100 overflow-hidden">
            <Image
              src={thumbnail}
              alt={trick.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              style={{ objectPosition: `${focalX}% ${focalY}%` }}
            />
          </div>
        ) : (
          <div className="aspect-video bg-sage-50 flex items-center justify-center">
            <span className="text-4xl">🐾</span>
          </div>
        )}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{trick.name}</h3>
            <TrickStatusBadge status={trick.status} />
          </div>
          {trick.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{trick.description}</p>
          )}
          <TrickProgress value={progress} />
        </CardContent>
      </Card>
    </Link>
  );
}
