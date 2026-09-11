import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HostelOps | Resident-first operations",
  description: "Simple, accountable operations for hostel meals, room allocation, and maintenance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
