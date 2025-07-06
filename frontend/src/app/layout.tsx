import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from "@/components/ui/sonner";

// Load plugins
import '@/plugins';

const inter = Inter({ subsets: ['latin'] });

import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'BucketBoard',
  description: 'A modern web application for managing AWS S3 buckets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
