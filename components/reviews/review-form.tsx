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

type ReviewFormProps = {
  matchId: string;
  existingBody?: string | null;
  onCancel?: () => void;
};

export function ReviewForm({
  matchId,
  existingBody = null,
  onCancel,
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
      const result = await upsertReview(matchId, body);
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
      const result = await deleteReview(matchId);
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
        className="w-full rounded-md border border-border bg-[#F4F6F8] px-4 py-3 text-left text-sm text-[#475569] transition-colors hover:border-[#94A3B8] hover:text-[#0F172A]"
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
        placeholder="What did you make of this match?"
        className={cn(
          "w-full resize-y rounded-md border border-border bg-[#F4F6F8] px-3 py-3 text-sm leading-relaxed text-[#0F172A]",
          "outline-none placeholder:text-[#475569] focus:border-[#9A3412]",
          "disabled:opacity-70",
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#475569]">
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
              className="text-sm text-[#475569] hover:text-[#0F172A] disabled:opacity-70"
            >
              Cancel
            </button>
          ) : null}
          {isEditing ? (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="text-sm text-[#475569] hover:text-red-700 disabled:opacity-70"
            >
              {pendingAction === "delete" ? "Deleting..." : "Delete"}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-md bg-[#0F172A] px-4 text-sm font-medium text-[#F8FAFC] hover:bg-[#1E293B] disabled:opacity-70"
          >
            {pendingAction === "save"
              ? "Saving..."
              : isEditing
                ? "Update Review"
                : "Post"}
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
