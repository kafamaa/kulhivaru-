import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Kulhivaru+",
  description: "Tournament operating system and public sports destination",
  icons: {
    icon: "/kulhivaru-logo.png",
    shortcut: "/kulhivaru-logo.png",
    apple: "/kulhivaru-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}

