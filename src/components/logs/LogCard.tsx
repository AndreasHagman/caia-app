import type { TrainingLog, Trick } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface Props {
  log: TrainingLog;
  tricks?: Trick[];
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

export function LogCard({ log, tricks = [], showActions = false, onDelete }: Props) {
  const relatedTrickNames = log.relatedTricks
    .map((id) => tricks.find((t) => t.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <time className="text-sm font-medium">{formatDate(log.date)}</time>
        {showActions && (
          <div className="flex gap-1 shrink-0">
            <Button asChild variant="ghost" size="icon" className="h-7 w-7">
              <Link href={`/dashboard/logs/${log.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(log.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{log.notes}</p>
      <div className="flex flex-wrap gap-1.5">
        {log.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs bg-sage-50 text-sage-600">
            {tag}
          </Badge>
        ))}
        {relatedTrickNames.map((name) => (
          <Badge key={name} variant="outline" className="text-xs">
            {name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
