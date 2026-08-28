import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotel Review Search",
  description:
    "Search through Google Maps and TripAdvisor reviews for your favorite hotels. Find mentions, track feedback, and link directly to reviews.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
