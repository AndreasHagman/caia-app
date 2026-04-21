"use client";

import type { TrainingLog, Trick } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { useTricks } from "@/hooks/useTricks";
import { format } from "date-fns";

interface Props {
  log?: TrainingLog;
  onSubmit: (data: Partial<TrainingLog>) => Promise<void>;
  submitLabel?: string;
}

export function LogForm({ log, onSubmit, submitLabel = "Save" }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(
    log ? format(log.date, "yyyy-MM-dd") : today
  );
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [tags, setTags] = useState<string[]>(log?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [relatedTricks, setRelatedTricks] = useState<string[]>(log?.relatedTricks ?? []);
  const [saving, setSaving] = useState(false);
  const { tricks } = useTricks();

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function toggleTrick(id: string) {
    setRelatedTricks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      date: new Date(date),
      notes,
      tags,
      relatedTricks,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Session notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you work on? How did it go?"
          rows={4}
          required
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 bg-sage-100 text-sage-700">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. obedience, agility…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="text-sm"
          />
          <Button type="button" variant="outline" size="icon" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Related tricks */}
      {tricks.length > 0 && (
        <div className="space-y-2">
          <Label>Related tricks</Label>
          <div className="flex flex-wrap gap-2">
            {tricks.map((trick) => (
              <button
                key={trick.id}
                type="button"
                onClick={() => toggleTrick(trick.id)}
              >
                <Badge
                  variant={relatedTricks.includes(trick.id) ? "default" : "outline"}
                  className={
                    relatedTricks.includes(trick.id)
                      ? "bg-sage-600 hover:bg-sage-700 cursor-pointer"
                      : "cursor-pointer"
                  }
                >
                  {trick.name}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" className="w-full bg-sage-600 hover:bg-sage-700" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
