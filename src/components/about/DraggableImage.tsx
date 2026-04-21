"use client";

import { useRef } from "react";

interface Props {
  imageUrl: string;
  heightVh: number;
  focalX: number;
  focalY: number;
  isOwner: boolean;
  onFocalChange: (x: number, y: number) => void;
  onFocalCommit: (x: number, y: number) => void;
  className?: string;
  children?: React.ReactNode;
}

export function DraggableImage({
  imageUrl,
  heightVh,
  focalX,
  focalY,
  isOwner,
  onFocalChange,
  onFocalCommit,
  className = "",
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; startFocalX: number; startFocalY: number; lastX: number; lastY: number } | null>(null);

  function clamp(v: number) {
    return Math.round(Math.min(100, Math.max(0, v)));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!isOwner) return;
    // Ignore clicks on child buttons (Change photo, etc.)
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { startX: e.clientX, startY: e.clientY, startFocalX: focalX, startFocalY: focalY, lastX: focalX, lastY: focalY };
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
    onFocalChange(newX, newY);
  }

  function handlePointerUp() {
    if (!drag.current) return;
    onFocalCommit(drag.current.lastX, drag.current.lastY);
    drag.current = null;
  }

  const isDraggable = isOwner;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-sage-100 ${className}`}
      style={{ height: `${heightVh}vh`, cursor: isDraggable ? "grab" : undefined }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={imageUrl}
        alt="Caia"
        className="w-full h-full object-cover select-none"
        style={{ objectPosition: `${focalX}% ${focalY}%`, pointerEvents: "none" }}
        draggable={false}
      />

      {/* Owner reposition hint */}
      {isOwner && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none select-none">
          Drag to reposition
        </div>
      )}

      {children}
    </div>
  );
}
