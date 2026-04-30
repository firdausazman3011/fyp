"use client";

import { useEffect, useState } from "react";

type AppImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
};

export function AppImage({
  src,
  alt,
  className,
  fallbackSrc = "/uploads/default-activity.svg",
}: AppImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src && src.trim() ? src : fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src && src.trim() ? src : fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
