"use client";

import Link from "next/link";
import {
  deleteUfcReview,
  upsertUfcReview,
} from "@/app/(app)/ufc/actions";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import type { ReviewItem } from "@/components/reviews/types";

export function UfcBoutReviews({
  fightId,
  eventId,
  title,
  reviews,
  currentUserId,
  isLoggedIn,
}: {
  fightId: string;
  eventId: string;
  title: string;
  reviews: ReviewItem[];
  currentUserId: string | null;
  isLoggedIn: boolean;
}) {
  const ownReview = reviews.find((review) => review.userId === currentUserId);

  return (
    <section className="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-[#0B132B]">{title}</h3>
      <div className="mt-4">
        {isLoggedIn ? (
          <ReviewForm
            matchId={fightId}
            existingBody={ownReview?.body ?? null}
            placeholder={
              title === "This card"
                ? "What did you make of this card?"
                : "What did you make of this fight?"
            }
            onSave={(body) => upsertUfcReview(fightId, eventId, body)}
            onDelete={() => deleteUfcReview(fightId, eventId)}
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
          matchId={fightId}
          currentUserId={currentUserId}
          onSave={(body) => upsertUfcReview(fightId, eventId, body)}
          onDelete={() => deleteUfcReview(fightId, eventId)}
        />
      </div>
    </section>
  );
}
