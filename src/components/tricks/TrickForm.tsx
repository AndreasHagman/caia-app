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
