import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstroWithRitu | Vedic Astrology",
  description: "Thoughtful Vedic astrology consultations for clarity, reflection and better questions.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
