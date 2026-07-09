import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import StoreProvider from "@/lib/redux/StoreProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wealthconomy Admin Dashboard",
  description: "Administrative dashboard for Wealthconomy app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans min-h-full flex flex-col`}
        suppressHydrationWarning
      >
        <StoreProvider>
          {children}
        </StoreProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "white",
              color: "#1C1C1C",
              border: "1px solid rgba(21, 93, 95, 0.1)",
              borderRadius: "16px",
            },
            className: "font-sans font-medium",
          }}
        />
      </body>
    </html>
  );
}

