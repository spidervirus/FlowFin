import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";
import QuickActionsPanel from "@/components/quick-actions-panel";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowFin - Modern Accounting Software for Businesses",
  description:
    "Simplify your financial management with our intuitive accounting platform. Track expenses, create invoices, and generate reports with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <QuickActionsPanel />
            <Toaster position="top-right" closeButton richColors />
          </AuthProvider>
        </ThemeProvider>
        <TempoInit />
      </body>
    </html>
  );
}
