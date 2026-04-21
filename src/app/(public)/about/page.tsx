"use client";

import { calculateAge, formatDate } from "@/lib/utils";
import { getAboutImageUrl, setAboutImageUrl } from "@/lib/about";
import { useAuth } from "@/contexts/AuthContext";
import { AboutImageEditor } from "@/components/about/AboutImageEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";

const BIRTH_DATE = new Date("2025-03-16");

const traits = [
  { label: "Energy", value: "Medium-High" },
  { label: "Intelligence", value: "Extremely smart" },
  { label: "Affection", value: "Loves people" },
  { label: "Playfulness", value: "Always ready" },
];

export default function AboutPage() {
  const { isOwner } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    getAboutImageUrl().then(setImageUrl);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">About Caia</h1>
      <p className="text-muted-foreground mb-10">{calculateAge()}</p>

      <Card className="rounded-3xl shadow-sm mb-8 overflow-hidden">
        <div className="relative bg-sage-100 aspect-[4/3] flex items-center justify-center group">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Caia"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sage-400 text-sm">Photo goes here</span>
          )}
          {isOwner && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-3 right-3 opacity-80 hover:opacity-100"
              onClick={() => setEditorOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {imageUrl ? "Change photo" : "Add photo"}
            </Button>
          )}
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Full name</span>
              <span className="font-medium">Caia</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Breed</span>
              <span className="font-medium">Nova Scotia Duck Tolling Retriever</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Born</span>
              <span className="font-medium">{formatDate(BIRTH_DATE)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Age</span>
              <span className="font-medium">{calculateAge()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Personality</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {traits.map((t) => (
          <div
            key={t.label}
            className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm"
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
              {t.label}
            </span>
            <Badge variant="secondary" className="bg-sage-100 text-sage-700">
              {t.value}
            </Badge>
          </div>
        ))}
      </div>

      <AboutImageEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        storagePath="about/hero.jpg"
        aspect={4 / 3}
        onSaved={async (url) => {
          await setAboutImageUrl(url);
          setImageUrl(url);
        }}
      />
    </div>
  );
}
