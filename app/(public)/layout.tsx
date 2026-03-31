import type { ReactNode } from "react";
import { getSessionUser } from "@/src/lib/auth/session";
import { Navbar } from "@/src/components/public/navbar";
import { Footer } from "@/src/components/public/footer";

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
