import type { Metadata } from "next";
import BottomNav from "@/components/layout/BottomNav";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoFlazz — Crypto as easy as GoPay",
  description:
    "GoFlazz is a self-custodial crypto wallet built for simplicity, security, and a premium experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-background pb-20 antialiased">
        <AuthProvider>
          <ProtectedRoute>
            {children}
            <BottomNav />
          </ProtectedRoute>
          <Toaster theme="dark" position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}



