import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <Container className="py-12 sm:py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8c887b]">
        EST. 2026 // ARCHIVE
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#0B132B]">
        About matchd
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#475569]">
        matchd is a matchday programme for the fixtures, fight cards, and
        Grands Prix you actually watched. Rate them, write the note you would
        keep, and see what the rest of the ground made of the same night.
      </p>
    </Container>
  );
}
