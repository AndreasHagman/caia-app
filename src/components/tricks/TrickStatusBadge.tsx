import { Badge } from "@/components/ui/badge";
import type { TrickStatus } from "@/types";

const config: Record<TrickStatus, { label: string; className: string }> = {
  not_started: { label: "Not started", className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
  learning: { label: "Learning", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  almost: { label: "Almost", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  mastered: { label: "Mastered ✓", className: "bg-sage-100 text-sage-700 hover:bg-sage-100" },
};

export function TrickStatusBadge({ status }: { status: TrickStatus }) {
  const { label, className } = config[status];
  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
}
