"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tricks", label: "Tricks" },
  { href: "/hikes", label: "Hikes" },
  { href: "/dogsitter", label: "Hundepass" },
  { href: "/gallery", label: "Gallery" },
];

export function Navbar() {
  const { user, signOut, canEdit, isOwner } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = canEdit
    ? [
        ...publicLinks,
        { href: "/dashboard", label: "Dashboard" },
        ...(isOwner ? [{ href: "/dashboard/settings/users", label: "Users" }] : []),
      ]
    : publicLinks;

  return (
    <header className="sticky top-0 z-50 bg-cream-100/80 backdrop-blur-sm border-b border-cream-200">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Caia 🐾
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors hover:text-sage-700",
                pathname === link.href ? "text-sage-700 font-medium" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-cream-100">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <SheetDescription className="sr-only">Site navigation links</SheetDescription>
            <div className="flex flex-col gap-4 mt-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-base py-2 transition-colors",
                    pathname === link.href ? "text-sage-700 font-medium" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Button variant="ghost" className="justify-start px-0" onClick={() => { signOut(); setOpen(false); }}>
                  Sign out
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
