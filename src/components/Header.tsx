"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="border-b bg-slate-800 dark:bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Spacer for balance */}
        <div className="w-10" />

        {/* Centered logo */}
        <Link href="/" className="hover:opacity-90">
          <Image
            src="/logo.svg"
            alt="One More Rep"
            width={140}
            height={70}
            priority
          />
        </Link>

        {/* Theme toggle on right */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
