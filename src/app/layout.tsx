import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusConnect — Placement, connected",
  description: "A placement management platform being built for colleges and their students.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}</body></html>;
}
