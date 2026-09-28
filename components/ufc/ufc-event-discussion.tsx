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
    <section className="mt-4 border-t border-slate-100 pt-5">
      <h3 className="text-xs uppercase tracking-[0.18em] text-[#475569]">
        Event Discussion & Reviews
      </h3>
      <div className="mt-4">
        {isLoggedIn ? (
          <ReviewForm
            matchId={eventId}
            existingBody={ownReview?.body ?? null}
            placeholder="What did you make of this card?"
            onSave={(body) => upsertUfcReview(eventId, body)}
            onDelete={() => deleteUfcReview(eventId)}
          />
        ) : (
          <p className="text-sm text-[#475569]">
            <Link
              href="/login"
              className="text-[#0F172A] underline decoration-border hover:decoration-[#9A3412]"
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
        />
      </div>
    </section>
  );
}
