import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/store/provider";

export const metadata: Metadata = {
  title: "AI Calorie Tracker",
  description: "Track meals, calories, and macros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
