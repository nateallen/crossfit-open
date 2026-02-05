"use client";

import { useState } from "react";

// Progressively add components to find what breaks touch
// Start with the absolute minimum

export default function TestMinimalPage() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Test 1: Simple structure matching simulator */}
      <header className="border-b bg-slate-800 text-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Minimal Test</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-4">
        <p className="text-sm text-muted-foreground">
          Tap count: {count}
        </p>

        {/* Plain button */}
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => setCount(c => c + 1)}
        >
          Plain Button - Tap Me
        </button>

        {/* Plain input */}
        <input
          type="text"
          className="border px-3 py-2 rounded w-full"
          placeholder="Tap to type"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Plain select */}
        <select
          className="border px-3 py-2 rounded"
          onChange={(e) => setCount(Number(e.target.value))}
        >
          <option value="0">Select a number</option>
          <option value="1">One</option>
          <option value="2">Two</option>
          <option value="3">Three</option>
        </select>
      </main>
    </div>
  );
}
