"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type AvatarProps = {
  src?: string;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-lg",
};

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const initials = fallback.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-primary-100 font-medium text-primary-700",
        sizes[size],
        className,
      )}
      aria-label={alt ?? fallback}
      role="img"
    >
      {src && !hasError ? (
        // biome-ignore lint/performance/noImgElement: avatars may point to arbitrary user-provided URLs
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}
