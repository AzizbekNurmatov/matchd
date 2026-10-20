import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <Container className="py-12 sm:py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8c887b]">
        Platform
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#0B132B]">
        Terms of Service
      </h1>
      <div className="mt-6 max-w-xl space-y-4 text-sm leading-relaxed text-[#475569]">
        <p>
          By using matchd you agree to keep one account of your own, to rate
          and review in good faith, and not to post anything you do not have
          the right to share.
        </p>
        <p>
          Scores, cards, and race results are imported for the archive. Your
          ratings and reviews are yours. We may remove writing that breaks
          these terms.
        </p>
      </div>
    </Container>
  );
}
