"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  images: string[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

export function HikeLightbox({
  images,
  currentIndex,
  open,
  onOpenChange,
  onIndexChange,
}: Props) {
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        onIndexChange((currentIndex - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight") {
        onIndexChange((currentIndex + 1) % images.length);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, currentIndex, images.length, onIndexChange]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
              diff > 0
                ? onIndexChange((currentIndex + 1) % images.length)
                : onIndexChange((currentIndex - 1 + images.length) % images.length);
            }
            touchStartX.current = null;
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            Photo {currentIndex + 1} of {images.length}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Browse hike photos
          </DialogPrimitive.Description>

          {/* Counter */}
          <div className="absolute top-4 right-14 text-white/80 text-sm font-medium z-10">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Close */}
          <DialogPrimitive.Close className="absolute top-4 right-4 text-white/80 hover:text-white z-10 transition-colors">
            <X className="w-6 h-6" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Image */}
          {images[currentIndex] && (
            <img
              src={images[currentIndex]}
              alt={`Photo ${currentIndex + 1} of ${images.length}`}
              className="max-w-full max-h-screen object-contain px-16"
            />
          )}

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors z-10"
              onClick={() =>
                onIndexChange((currentIndex - 1 + images.length) % images.length)
              }
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="sr-only">Previous photo</span>
            </button>
          )}

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition-colors z-10"
              onClick={() =>
                onIndexChange((currentIndex + 1) % images.length)
              }
            >
              <ChevronRight className="w-6 h-6" />
              <span className="sr-only">Next photo</span>
            </button>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
