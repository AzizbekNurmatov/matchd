"use client";

import Link from "next/link";
import { deleteUfcReview, upsertUfcReview } from "@/app/(app)/ufc/actions";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import type { ReviewItem } from "@/components/reviews/types";

export function UfcEventDiscussion({
  eventId,
  reviews,
  currentUserId,
  isLoggedIn,
}: {
  eventId: string;
  reviews: ReviewItem[];
  currentUserId: string | null;
  isLoggedIn: boolean;
}) {
  const ownReview = reviews.find((review) => review.userId === currentUserId);

  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Event discussion
      </h3>
      <div className="mt-4">
        {isLoggedIn ? (
          <ReviewForm
            matchId={eventId}
            existingBody={ownReview?.body ?? null}
            placeholder="What did you make of this card?"
            onSave={(body) => upsertUfcReview(eventId, body)}
            onDelete={() => deleteUfcReview(eventId)}
            tone="dark"
          />
        ) : (
          <p className="text-sm text-slate-400">
            <Link
              href="/login"
              className="text-white underline decoration-slate-600 hover:decoration-amber-400"
            >
              Log in
            </Link>{" "}
            to write a review.
          </p>
        )}
      </div>
      <div className="mt-8">
        <ReviewList
          reviews={reviews}
          matchId={eventId}
          currentUserId={currentUserId}
          onSave={(body) => upsertUfcReview(eventId, body)}
          onDelete={() => deleteUfcReview(eventId)}
          tone="dark"
        />
      </div>
    </section>
  );
}
