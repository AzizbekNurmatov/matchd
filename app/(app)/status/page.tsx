import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "System Status",
};

export default function StatusPage() {
  return (
    <Container className="py-12 sm:py-14">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8c887b]">
        Platform
      </p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#0B132B]">
        System Status
      </h1>
      <p className="mt-6 inline-flex items-center gap-2 text-sm text-[#475569]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        All systems operational
      </p>
    </Container>
  );
}
