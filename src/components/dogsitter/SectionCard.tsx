"use client";

import { SectionData, SectionKey } from "@/lib/dogsitter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface Props {
  sectionKey: SectionKey;
  data: SectionData;
  onEdit: () => void;
  isOwner: boolean;
}

export function SectionCard({ sectionKey, data, onEdit, isOwner }: Props) {
  const hasContent = data.content.trim().length > 0;

  return (
    <Card className="rounded-3xl shadow-sm overflow-hidden relative">
      {data.images.length > 0 && (
        <div className={data.images.length === 1 ? "relative w-full h-48 bg-sage-100" : "grid grid-cols-2 gap-2 h-48"}>
          {data.images.map((img, index) => (
            <div key={index} className="relative h-full overflow-hidden bg-sage-100">
              <img
                src={img.url}
                alt={`${data.title} ${index + 1}`}
                className="w-full h-full object-cover"
                style={{ objectPosition: `${img.focalX}% ${img.focalY}%` }}
              />
            </div>
          ))}
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold">{data.title}</h3>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="shrink-0"
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        {hasContent ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {data.content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Click edit to add information
          </p>
        )}
      </CardContent>
    </Card>
  );
}
