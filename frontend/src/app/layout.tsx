import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ProfileMenu from './components/ProfileMenu';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Storyteller",
  description: "An AI-powered interactive storytelling platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-100 via-pink-50 to-purple-100 text-blue-900`}
      >
        <div className="absolute top-4 right-4 z-50">
          <ProfileMenu />
        </div>
        {children}
      </body>
    </html>
  );
}