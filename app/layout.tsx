import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { RhemaProvider } from "@/lib/store/rhema-context";
import { AuthProvider } from "@/lib/store/auth-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair"
});

export const metadata: Metadata = {
  title: "RhemaAI - Divine Intelligence",
  description: "The premium Christian AI ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased selection:bg-primary/20",
        inter.variable,
        playfair.variable
      )}>
        <AuthProvider>
          <RhemaProvider>
            {children}
          </RhemaProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
