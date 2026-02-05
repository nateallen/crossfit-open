"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="border-b text-white" style={{ backgroundColor: "#12222a" }}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Spacer for balance */}
        <div className="w-10" />

        {/* Centered logo */}
        <Link href="/" className="hover:opacity-90">
          <Image
            src="/logo.svg"
            alt="One More Rep"
            width={150}
            height={120}
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
