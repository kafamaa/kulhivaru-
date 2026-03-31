import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 py-4">
        <div className="mx-auto max-w-7xl px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-50 hover:text-slate-100">
            <Image
              src="/kulhivaru-logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-contain"
            />
            Kulhivaru+
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
