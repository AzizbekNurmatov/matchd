import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[#252b33] bg-[#181c22]/95 px-6 py-4 backdrop-blur-md">
        <Link href="/" className="inline-block">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#d4973b]">
            EST. 2026 // ARCHIVE
          </p>
          <span className="mt-0.5 block font-serif text-2xl tracking-tight text-[#f3efe6]">
            matchd
          </span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
