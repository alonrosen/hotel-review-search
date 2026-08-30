import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { VercelToolbar } from '@vercel/toolbar/next';
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotel Review Search",
  description:
    "Search through Google Maps and TripAdvisor reviews for your favorite hotels. Find mentions, track feedback, and link directly to reviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shouldInjectToolbar = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        {shouldInjectToolbar && <VercelToolbar />}
      </body>
    </html>
  );
}
