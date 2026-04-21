import { Progress } from "@/components/ui/progress";

interface Props {
  value: number;
  showLabel?: boolean;
}

export function TrickProgress({ value, showLabel = true }: Props) {
  return (
    <div className="space-y-1">
      <Progress value={value} className="h-2 bg-sage-100 [&>div]:bg-sage-500" />
      {showLabel && (
        <p className="text-xs text-muted-foreground text-right">{value}%</p>
      )}
    </div>
  );
}
