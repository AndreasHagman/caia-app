"use client";

import { useRef, useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  heightVh: number;
  focalX: number;
  focalY: number;
  onCommit: (x: number, y: number) => void;
}

export function ImageRepositionSheet({ open, onOpenChange, imageUrl, heightVh, focalX, focalY, onCommit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; startFocalX: number; startFocalY: number; lastX: number; lastY: number } | null>(null);
  const [tempX, setTempX] = useState(focalX);
  const [tempY, setTempY] = useState(focalY);

  useEffect(() => {
    if (open) {
      setTempX(focalX);
      setTempY(focalY);
    }
  }, [open, focalX, focalY]);

  function clamp(v: number) {
    return Math.round(Math.min(100, Math.max(0, v)));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = { startX: e.clientX, startY: e.clientY, startFocalX: tempX, startFocalY: tempY, lastX: tempX, lastY: tempY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const container = containerRef.current;
    if (!container) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const newX = clamp(drag.current.startFocalX - (dx / container.clientWidth) * 100);
    const newY = clamp(drag.current.startFocalY - (dy / container.clientHeight) * 100);
    drag.current.lastX = newX;
    drag.current.lastY = newY;
    setTempX(newX);
    setTempY(newY);
  }

  function handlePointerUp() {
    drag.current = null;
  }

  function handleDone() {
    onCommit(tempX, tempY);
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleCancel}>
      <SheetContent side="bottom" className="h-[90dvh] flex flex-col p-0" aria-describedby={undefined}>
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle>Reposition photo</SheetTitle>
        </SheetHeader>

        {/* Dark surround — area outside the actual image box */}
        <div className="flex-1 flex flex-col items-center justify-center bg-neutral-900 overflow-hidden px-4 py-4">
          {/* Image box — same height as on the page so the crop boundary is clear */}
          <div
            ref={containerRef}
            className="w-full overflow-hidden relative cursor-grab active:cursor-grabbing select-none ring-2 ring-white/70 rounded-sm"
            style={{ height: `${heightVh}vh`, touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              src={imageUrl}
              alt="Reposition"
              className="w-full h-full object-cover"
              style={{ objectPosition: `${tempX}% ${tempY}%`, pointerEvents: "none" }}
              draggable={false}
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
              Drag to reposition
            </div>
          </div>
        </div>

        <div className="px-4 pb-6 pt-3 flex gap-3 shrink-0 bg-white border-t border-cream-200">
          <Button variant="outline" className="flex-1" onClick={handleCancel}>
            Cancel
          </Button>
          <Button className="flex-1 bg-sage-600 hover:bg-sage-700" onClick={handleDone}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
