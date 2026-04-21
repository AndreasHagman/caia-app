"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import Link from "next/link";

const dashboardLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tricks", label: "Tricks" },
  { href: "/dashboard/logs", label: "Logs" },
  { href: "/dashboard/hikes", label: "Hikes" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <nav className="border-b border-cream-200 bg-white/40 backdrop-blur-sm sticky top-14 z-40">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {dashboardLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap shrink-0",
                isActive(link.href)
                  ? "border-sage-600 text-sage-700 font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">{children}</main>
      <Footer />
    </div>
  );
}
