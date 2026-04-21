"use client";

interface Props {
  imageUrl: string;
  heightVh: number;
  focalX: number;
  focalY: number;
  className?: string;
  children?: React.ReactNode;
}

export function DraggableImage({
  imageUrl,
  heightVh,
  focalX,
  focalY,
  className = "",
  children,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden bg-sage-100 ${className}`}
      style={{ height: `${heightVh}vh` }}
    >
      <img
        src={imageUrl}
        alt="Caia"
        className="w-full h-full object-cover select-none"
        style={{ objectPosition: `${focalX}% ${focalY}%`, pointerEvents: "none" }}
        draggable={false}
      />

      {children}
    </div>
  );
}
