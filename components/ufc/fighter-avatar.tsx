"use client";

import { useState } from "react";

export function fighterInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function FighterAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  if (!showImage) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
        {fighterInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={imageUrl ?? undefined}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full bg-slate-200 object-cover"
      onError={() => setFailed(true)}
    />
  );
}
