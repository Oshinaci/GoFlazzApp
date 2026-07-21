import Link from "next/link";
import Logo from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <Logo size="lg" />
      <p className="text-lg font-medium">Page not found</p>
      <Link href="/" className="text-sm text-primary hover:underline">
        Back to home
      </Link>
    </main>
  );
}
