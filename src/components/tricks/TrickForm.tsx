"use client";

import type { ChecklistItem, Trick, TrickStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ChecklistEditor } from "./ChecklistEditor";
import { MediaUploader } from "./MediaUploader";
import { computeProgress } from "@/lib/tricks";
import { TrickProgress } from "./TrickProgress";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const STATUS_OPTIONS: { value: TrickStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "learning", label: "Learning" },
  { value: "almost", label: "Almost" },
  { value: "mastered", label: "Mastered" },
];

interface Props {
  trick?: Trick;
  onSubmit: (data: Partial<Trick>) => Promise<void>;
  submitLabel?: string;
}

export function TrickForm({ trick, onSubmit, submitLabel = "Save" }: Props) {
  const [name, setName] = useState(trick?.name ?? "");
  const [description, setDescription] = useState(trick?.description ?? "");
  const [status, setStatus] = useState<TrickStatus>(trick?.status ?? "not_started");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(trick?.checklist ?? []);
  const [mediaUrls, setMediaUrls] = useState<string[]>(trick?.mediaUrls ?? []);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(trick?.coverImageUrl ?? null);
  const [coverFocalX, setCoverFocalX] = useState(trick?.coverFocalX ?? 50);
  const [coverFocalY, setCoverFocalY] = useState(trick?.coverFocalY ?? 50);
  const [repositionOpen, setRepositionOpen] = useState(false);
  const [progressOverride, setProgressOverride] = useState(trick?.progressOverride ?? false);
  const [manualProgress, setManualProgress] = useState(trick?.progress ?? 0);
  const [saving, setSaving] = useState(false);

  const displayProgress = progressOverride
    ? manualProgress
    : computeProgress(checklist);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      name,
      description,
      status,
      checklist,
      mediaUrls,
      coverImageUrl,
      coverFocalX,
      coverFocalY,
      progressOverride,
      progress: progressOverride ? manualProgress : computeProgress(checklist),
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Trick name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sit, Roll over, Shake…"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="How the trick works, notes on training it…"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as TrickStatus)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Progress</Label>
        <TrickProgress value={displayProgress} />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="override"
            checked={progressOverride}
            onChange={(e) => setProgressOverride(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="override" className="text-sm text-muted-foreground cursor-pointer">
            Override progress manually
          </label>
        </div>
        {progressOverride && (
          <Input
            type="number"
            min={0}
            max={100}
            value={manualProgress}
            onChange={(e) => setManualProgress(Number(e.target.value))}
            className="w-24"
          />
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Checklist</Label>
        <ChecklistEditor items={checklist} onChange={setChecklist} />
      </div>

      {trick?.id && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label>Media</Label>
            <MediaUploader
              trickId={trick.id}
              mediaUrls={mediaUrls}
              onUrlsChange={setMediaUrls}
            />
          </div>

          <Separator />
          <CoverImageSection
            mediaUrls={mediaUrls}
            coverImageUrl={coverImageUrl}
            coverFocalX={coverFocalX}
            coverFocalY={coverFocalY}
            repositionOpen={repositionOpen}
            onSelectCover={(url) => { setCoverImageUrl(url); setCoverFocalX(50); setCoverFocalY(50); }}
            onOpenReposition={() => setRepositionOpen(true)}
            onRepositionChange={setRepositionOpen}
            onCommitFocal={(x, y) => { setCoverFocalX(x); setCoverFocalY(y); }}
          />
        </>
      )}

      <Button
        type="submit"
        className="w-full bg-sage-600 hover:bg-sage-700"
        disabled={saving}
      >
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

interface CoverImageSectionProps {
  mediaUrls: string[];
  coverImageUrl: string | null;
  coverFocalX: number;
  coverFocalY: number;
  repositionOpen: boolean;
  onSelectCover: (url: string) => void;
  onOpenReposition: () => void;
  onRepositionChange: (open: boolean) => void;
  onCommitFocal: (x: number, y: number) => void;
}

function CoverImageSection({
  mediaUrls,
  coverImageUrl,
  coverFocalX,
  coverFocalY,
  repositionOpen,
  onSelectCover,
  onOpenReposition,
  onRepositionChange,
  onCommitFocal,
}: CoverImageSectionProps) {
  const imageUrls = mediaUrls.filter((u) => u.match(/\.(jpg|jpeg|png|webp|gif)/i));

  return (
    <div className="space-y-3">
      <Label>Cover image</Label>
      {imageUrls.length === 0 ? (
        <p className="text-sm text-muted-foreground">Upload images above to select a cover.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {imageUrls.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => onSelectCover(url)}
              className={cn(
                "relative aspect-video overflow-hidden rounded-md ring-2 transition-all",
                coverImageUrl === url ? "ring-sage-600" : "ring-transparent hover:ring-sage-300"
              )}
            >
              <Image src={url} alt="" fill className="object-cover" />
              {coverImageUrl === url && (
                <div className="absolute inset-0 bg-sage-600/20 flex items-center justify-center">
                  <Check className="text-white w-5 h-5 drop-shadow" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      {coverImageUrl && (
        <>
          <Button type="button" variant="outline" size="sm" onClick={onOpenReposition}>
            Reposition
          </Button>
          <ImageRepositionSheet
            open={repositionOpen}
            onOpenChange={onRepositionChange}
            imageUrl={coverImageUrl}
            heightVh={25}
            focalX={coverFocalX}
            focalY={coverFocalY}
            onCommit={onCommitFocal}
          />
        </>
      )}
    </div>
  );
}
