import type { Metadata } from "next";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import BottomNav from "@/components/layout/BottomNav";
import { AuthProvider } from "@/hooks/useAuth";
import { WalletSecurityProvider } from "@/context/WalletSecurityContext";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-background pb-20 antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <WalletSecurityProvider>
              <ProtectedRoute>
                {children}
                <BottomNav />
              </ProtectedRoute>
            </WalletSecurityProvider>
            <Toaster theme="dark" position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
