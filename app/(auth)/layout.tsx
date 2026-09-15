import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="px-5 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          matchd
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
