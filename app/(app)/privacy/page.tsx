import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <Container className="py-12 sm:py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8c887b]">
        Platform
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#0B132B]">
        Privacy Policy
      </h1>
      <div className="mt-6 max-w-xl space-y-4 text-sm leading-relaxed text-[#475569]">
        <p>
          matchd stores the account details you give us — a username, email,
          and the ratings and reviews you choose to publish. Profile photos
          stay in our storage bucket and are shown next to your public writing.
        </p>
        <p>
          Fixture, fight, and race data comes from sports providers and is kept
          so the archive can be read without calling those services on every
          page. We do not sell personal information.
        </p>
      </div>
    </Container>
  );
}
