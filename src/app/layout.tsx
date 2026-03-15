import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gold Tracker — Live XAU/USD Prices",
  description:
    "Track live gold spot prices with a real-time 24-hour chart. Sign up for email alerts when gold moves more than 1% per hour.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-black">
        {children}
      </body>
    </html>
  );
}
