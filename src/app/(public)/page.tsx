"use client";

import { calculateAge } from "@/lib/utils";
import { getHomeSettings, setHomeImageUrl, setHomeHeightVh, setHomeFocal } from "@/lib/about";
import { useTricks } from "@/hooks/useTricks";
import { AboutImageEditor } from "@/components/about/AboutImageEditor";
import { DraggableImage } from "@/components/about/DraggableImage";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar, Pencil, Move } from "lucide-react";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const age = calculateAge();
  const { tricks, loading } = useTricks();
  const { isOwner } = useAuth();
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [heightVh, setHeightVh] = useState(40);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(50);
  const [editorOpen, setEditorOpen] = useState(false);
  const [repositionOpen, setRepositionOpen] = useState(false);

  useEffect(() => {
    getHomeSettings().then((s) => {
      setHeroUrl(s.imageUrl);
      setHeightVh(s.heightVh);
      setFocalX(s.focalX);
      setFocalY(s.focalY);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero */}
      <section className="py-16 md:py-24 text-center">
        <Badge variant="secondary" className="mb-4 bg-sage-100 text-sage-700">
          Nova Scotia Duck Tolling Retriever
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">Caia</h1>
        <p className="text-xl text-muted-foreground mb-2">{age}</p>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Follow along on the training journey — tricks, adventures, and memories.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg" className="bg-sage-600 hover:bg-sage-700">
            <Link href="/tricks">
              See tricks <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">About Caia</Link>
          </Button>
        </div>
      </section>

      {/* Hero image */}
      {heroUrl ? (
        <DraggableImage
          imageUrl={heroUrl}
          heightVh={heightVh}
          focalX={focalX}
          focalY={focalY}
          className="rounded-3xl mb-2"
        >
          {isOwner && (
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="opacity-80 hover:opacity-100"
                onClick={() => setEditorOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Change photo
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="opacity-80 hover:opacity-100"
                onClick={() => setRepositionOpen(true)}
              >
                <Move className="h-3.5 w-3.5 mr-1.5" />
                Reposition
              </Button>
            </div>
          )}
        </DraggableImage>
      ) : (
        <section
          className="relative rounded-3xl overflow-hidden bg-sage-100 mb-2 flex items-center justify-center"
          style={{ height: `${heightVh}vh` }}
        >
          <p className="text-sage-500 text-sm">Hero image goes here</p>
          {isOwner && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-3 right-3 opacity-80 hover:opacity-100"
              onClick={() => setEditorOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Add photo
            </Button>
          )}
        </section>
      )}

      {/* Owner controls */}
      {isOwner && (
        <div className="flex items-center gap-3 mb-14 px-1">
          <span className="text-xs text-muted-foreground shrink-0">Shorter</span>
          <input
            type="range"
            min={15}
            max={80}
            step={5}
            value={heightVh}
            onChange={(e) => setHeightVh(Number(e.target.value))}
            onPointerUp={(e) => setHomeHeightVh(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => setHomeHeightVh(Number((e.target as HTMLInputElement).value))}
            className="flex-1 accent-sage-600"
          />
          <span className="text-xs text-muted-foreground shrink-0">Taller</span>
          <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{heightVh}vh</span>
        </div>
      )}

      {!isOwner && <div className="mb-16" />}

      <AboutImageEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        storagePath="home/hero.jpg"
        onSaved={async (url) => {
          await setHomeImageUrl(url);
          setHeroUrl(url);
        }}
      />
      {heroUrl && (
        <ImageRepositionSheet
          open={repositionOpen}
          onOpenChange={setRepositionOpen}
          imageUrl={heroUrl}
          focalX={focalX}
          focalY={focalY}
          onCommit={(x, y) => { setFocalX(x); setFocalY(y); setHomeFocal(x, y); }}
        />
      )}

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { icon: <Calendar className="h-5 w-5" />, label: "Born", value: "March 16, 2025" },
          { icon: <MapPin className="h-5 w-5" />, label: "Breed", value: "Toller" },
          { label: "Tricks", value: loading ? "…" : String(tricks.length) },
          { label: "Status", value: "In training" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200 flex flex-col gap-1">
            {stat.icon && <span className="text-sage-600">{stat.icon}</span>}
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            <span className="font-semibold">{stat.value}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
