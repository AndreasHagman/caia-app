"use client";

import type { Hike } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/tricks/MediaUploader";
import { useState } from "react";
import { format } from "date-fns";

interface Props {
  hike?: Hike;
  onSubmit: (data: Partial<Hike>) => Promise<void>;
  submitLabel?: string;
  hikeId?: string;
}

export function HikeForm({ hike, onSubmit, submitLabel = "Save", hikeId }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [title, setTitle] = useState(hike?.title ?? "");
  const [location, setLocation] = useState(hike?.location ?? "");
  const [distance, setDistance] = useState<string>(
    hike?.distance !== undefined ? String(hike.distance) : ""
  );
  const [date, setDate] = useState(hike ? format(hike.date, "yyyy-MM-dd") : today);
  const [notes, setNotes] = useState(hike?.notes ?? "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(hike?.mediaUrls ?? []);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      title,
      location,
      distance: distance ? parseFloat(distance) : undefined,
      date: new Date(date),
      notes,
      mediaUrls,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning walk at Nordmarka"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Nordmarka"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distance">Distance (km)</Label>
          <Input
            id="distance"
            type="number"
            step="0.1"
            min="0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="5.2"
          />
        </div>
      </div>

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
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was it? Any highlights?"
          rows={3}
        />
      </div>

      {hikeId && (
        <div className="space-y-2">
          <Label>Photos &amp; videos</Label>
          <MediaUploader
            trickId={`hike-${hikeId}`}
            mediaUrls={mediaUrls}
            onUrlsChange={setMediaUrls}
          />
        </div>
      )}

      <Button type="submit" className="w-full bg-sage-600 hover:bg-sage-700" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
