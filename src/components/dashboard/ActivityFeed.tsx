import type { Hike, TrainingLog, Trick } from "@/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrickStatusBadge } from "@/components/tricks/TrickStatusBadge";
import { MapPin } from "lucide-react";
import Link from "next/link";

type ActivityItem =
  | { type: "trick"; date: Date; data: Trick }
  | { type: "log"; date: Date; data: TrainingLog }
  | { type: "hike"; date: Date; data: Hike };

interface Props {
  tricks: Trick[];
  logs: TrainingLog[];
  hikes: Hike[];
  limit?: number;
}

export function ActivityFeed({ tricks, logs, hikes, limit = 10 }: Props) {
  const items: ActivityItem[] = [
    ...tricks.map((t): ActivityItem => ({ type: "trick", date: t.createdAt, data: t })),
    ...logs.map((l): ActivityItem => ({ type: "log", date: l.date, data: l })),
    ...hikes.map((h): ActivityItem => ({ type: "hike", date: h.date, data: h })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-cream-200"
        >
          <div className="mt-0.5 text-xl shrink-0">
            {item.type === "trick" ? "🐾" : item.type === "log" ? "📓" : "🥾"}
          </div>
          <div className="flex-1 min-w-0">
            {item.type === "trick" && (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/dashboard/tricks/${item.data.id}/edit`}
                    className="font-medium hover:text-sage-700 text-sm"
                  >
                    {item.data.name}
                  </Link>
                  <TrickStatusBadge status={item.data.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trick added · {formatDate(item.date)}
                </p>
              </>
            )}
            {item.type === "log" && (
              <>
                <p className="text-sm font-medium">Training session</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{item.data.notes}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {item.data.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-sage-50 text-sage-600">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
              </>
            )}
            {item.type === "hike" && (
              <>
                <p className="text-sm font-medium">{item.data.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.data.location && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {item.data.location}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
