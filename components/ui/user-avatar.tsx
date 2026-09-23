"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 72,
  xl: 96,
} as const;

const INITIALS_TEXT = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-base",
  xl: "text-lg",
} as const;

type UserAvatarProps = {
  src?: string | null;
  username: string;
  size?: keyof typeof SIZE_PX;
  className?: string;
};

function initials(username: string): string {
  const letters = username.trim().slice(0, 2).toUpperCase();
  return letters || "?";
}

export function UserAvatar({
  src,
  username,
  size = "md",
  className,
}: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const url = src?.trim() || null;
  const px = SIZE_PX[size];
  const showImage = Boolean(url) && failedSrc !== url;

  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden rounded-md", className)}
      style={{ width: px, height: px }}
    >
      {showImage && url ? (
        <Image
          src={url}
          alt={username}
          fill
          sizes="(max-width: 768px) 100vw, 80px"
          className="object-cover rounded-md"
          onError={() => setFailedSrc(url)}
        />
      ) : (
        <span
          role="img"
          aria-label={username}
          className={cn(
            "flex h-full w-full items-center justify-center rounded-md border border-[#2e2d2b] bg-[#1c1b1a] font-mono font-bold text-[#f3efe6]",
            INITIALS_TEXT[size],
          )}
        >
          {initials(username)}
        </span>
      )}
    </span>
  );
}
