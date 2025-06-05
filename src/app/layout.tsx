import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";
import QuickActionsPanel from "@/components/quick-actions-panel";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from '@/lib/supabase/supabase-provider';
import Navbar from '@/components/navbar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowFin",
  description: "Financial planning and analysis platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      
      {/* Tawk.to Live Chat Script */}
      <Script
        id="tawk-to-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/6840ed75a46165190e5859c7/1isupv5bv';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
            })();
          `
        }}
      />
      
      <body className={inter.className}>
        <SupabaseProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {/* <Navbar /> */}
              {children}
              <QuickActionsPanel />
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </SupabaseProvider>
        <TempoInit />
      </body>
    </html>
  );
}
