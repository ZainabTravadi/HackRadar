import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

type HackathonImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function HackathonImage({ src, alt, className, fallbackClassName }: HackathonImageProps) {
  const [hasError, setHasError] = useState(false);
  const hasSrc = typeof src === "string" && src.trim().length > 0;
  const shouldRenderFallback = !hasSrc || hasError;

  if (shouldRenderFallback) {
    return (
      <div
        role="img"
        aria-label="Hackathon image unavailable"
        className={cn(
          "flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-[1.25rem] border border-border/70 bg-secondary/60 text-muted-foreground",
          className,
          fallbackClassName,
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <ImageOff className="h-8 w-8 opacity-80" />
          <span className="text-xs font-medium uppercase tracking-[0.18em]">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src ?? undefined}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn("aspect-[16/9] w-full rounded-[1.25rem] border border-border/70 object-cover", className)}
    />
  );
}
