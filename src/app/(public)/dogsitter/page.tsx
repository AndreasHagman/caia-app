"use client";

import { useEffect, useState } from "react";
import { getDogSitterSettings, DogSitterSettings, SectionKey } from "@/lib/dogsitter";
import { SectionCard } from "@/components/dogsitter/SectionCard";
import { SectionEditor } from "@/components/dogsitter/SectionEditor";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const SECTION_ORDER: SectionKey[] = [
  "feeding",
  "walks",
  "treats",
  "training",
  "behavior",
  "health",
  "emergency",
];

export default function DogSitterPage() {
  const { isOwner } = useAuth();
  const [settings, setSettings] = useState<DogSitterSettings | null>(null);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDogSitterSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load dog sitter settings:", err);
      setError("Failed to load information. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave() {
    await loadSettings();
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-cream-100 border border-sage-200 rounded-lg p-4">
          <p className="text-sage-700">{error}</p>
          <Button
            onClick={loadSettings}
            variant="ghost"
            size="sm"
            className="mt-2 text-sage-600 hover:text-sage-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Dog Sitter Guide</h1>
      <p className="text-muted-foreground mb-10">
        Everything you need to know to care for Caia
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTION_ORDER.map((sectionKey) => (
          <SectionCard
            key={sectionKey}
            sectionKey={sectionKey}
            data={settings[sectionKey]}
            onEdit={() => setEditingSection(sectionKey)}
            isOwner={isOwner}
          />
        ))}
      </div>

      {editingSection && (
        <SectionEditor
          open={true}
          onOpenChange={(open) => !open && setEditingSection(null)}
          sectionKey={editingSection}
          initialData={settings[editingSection]}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
