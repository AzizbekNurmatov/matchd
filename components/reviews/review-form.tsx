"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteReview,
  upsertReview,
} from "@/app/(app)/matches/[id]/actions";
import {
  REVIEW_MAX_LENGTH,
  validateReviewContent,
} from "@/lib/reviews";
import { cn } from "@/lib/utils";

type ReviewActionResult = { ok: true } | { ok: false; error: string };

type ReviewFormProps = {
  matchId: string;
  existingBody?: string | null;
  onCancel?: () => void;
  placeholder?: string;
  onSave?: (body: string) => Promise<ReviewActionResult>;
  onDelete?: () => Promise<ReviewActionResult>;
  tone?: "light" | "dark";
};

export function ReviewForm({
  matchId,
  existingBody = null,
  onCancel,
  placeholder = "What did you make of this match?",
  onSave,
  onDelete,
  tone = "light",
}: ReviewFormProps) {
  const router = useRouter();
  const [body, setBody] = useState(existingBody ?? "");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(Boolean(existingBody) || Boolean(onCancel));
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"save" | "delete" | null>(
    null,
  );
  const isEditing = Boolean(existingBody);
  const dark = tone === "dark";

  useEffect(() => {
    setBody(existingBody ?? "");
    if (existingBody) {
      setOpen(true);
    }
  }, [existingBody]);

  function submit() {
    const message = validateReviewContent(body);
    if (message) {
      setError(message);
      return;
    }

    setError(null);
    setPendingAction("save");
    startTransition(async () => {
      const result = onSave ? await onSave(body) : await upsertReview(matchId, body);
      setPendingAction(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onCancel?.();
    });
  }

  function remove() {
    if (!isEditing) {
      return;
    }

    const confirmed = window.confirm("Delete your review?");
    if (!confirmed) {
      return;
    }

    setError(null);
    setPendingAction("delete");
    startTransition(async () => {
      const result = onDelete
        ? await onDelete()
        : await deleteReview(matchId);
      setPendingAction(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBody("");
      setOpen(false);
      router.refresh();
      onCancel?.();
    });
  }

  if (!open && !isEditing) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full rounded-md border px-4 py-3 text-left text-sm transition-colors",
          dark
            ? "border-slate-700 bg-slate-950/70 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            : "border-border bg-[#F4F6F8] text-[#475569] hover:border-[#94A3B8] hover:text-[#0F172A]",
        )}
      >
        Write a review...
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <textarea
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          if (error) {
            setError(null);
          }
        }}
        maxLength={REVIEW_MAX_LENGTH}
        disabled={isPending}
        rows={6}
        placeholder={placeholder}
        className={cn(
          "w-full resize-y rounded-md border px-3 py-3 text-sm leading-relaxed outline-none disabled:opacity-70",
          dark
            ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
            : "border-border bg-[#F4F6F8] text-[#0F172A] placeholder:text-[#475569] focus:border-[#9A3412]",
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-xs", dark ? "text-slate-500" : "text-[#475569]")}>
          {body.length}/{REVIEW_MAX_LENGTH}
        </p>
        <div className="flex items-center gap-3">
          {onCancel || !isEditing ? (
            <button
              type="button"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                  return;
                }
                setOpen(false);
                setBody(existingBody ?? "");
                setError(null);
              }}
              disabled={isPending}
              className={cn(
                "text-sm disabled:opacity-70",
                dark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-[#475569] hover:text-[#0F172A]",
              )}
            >
              Cancel
            </button>
          ) : null}
          {isEditing ? (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className={cn(
                "text-sm disabled:opacity-70",
                dark
                  ? "text-slate-400 hover:text-red-300"
                  : "text-[#475569] hover:text-red-700",
              )}
            >
              {pendingAction === "delete" ? "Deleting..." : "Delete"}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "h-9 rounded-md px-4 text-sm font-medium disabled:opacity-70",
              dark
                ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                : "bg-[#0F172A] text-[#F8FAFC] hover:bg-[#1E293B]",
            )}
          >
            {pendingAction === "save"
              ? "Saving..."
              : isEditing
                ? "Update Review"
                : "Post"}
          </button>
        </div>
      </div>
      {error ? (
        <p className={cn("text-sm", dark ? "text-red-300" : "text-red-700")}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
