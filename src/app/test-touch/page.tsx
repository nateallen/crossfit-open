"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestTouchPage() {
  const [log, setLog] = useState<string[]>([]);
  const [count, setCount] = useState(0);

  const addLog = (msg: string) => {
    setLog((prev) => [...prev.slice(-20), `${new Date().toISOString().slice(11, 23)} ${msg}`]);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Touch Diagnostic Test</h1>
      <p className="text-sm text-muted-foreground">
        Tap each element once. Check which events fire.
      </p>

      <div className="space-y-4">
        {/* Test 1: Plain HTML button */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">1. Plain HTML Button</h2>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => addLog("Plain button: onClick")}
            onTouchStart={() => addLog("Plain button: onTouchStart")}
            onTouchEnd={() => addLog("Plain button: onTouchEnd")}
            onPointerDown={() => addLog("Plain button: onPointerDown")}
            onPointerUp={() => addLog("Plain button: onPointerUp")}
          >
            Tap Me (Plain)
          </button>
        </div>

        {/* Test 2: ShadCN Button */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">2. ShadCN Button</h2>
          <Button
            onClick={() => addLog("ShadCN button: onClick")}
            onTouchStart={() => addLog("ShadCN button: onTouchStart")}
            onTouchEnd={() => addLog("ShadCN button: onTouchEnd")}
            onPointerDown={() => addLog("ShadCN button: onPointerDown")}
            onPointerUp={() => addLog("ShadCN button: onPointerUp")}
          >
            Tap Me (ShadCN)
          </Button>
        </div>

        {/* Test 3: Plain input */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">3. Plain HTML Input</h2>
          <input
            type="text"
            className="border px-3 py-2 rounded w-full"
            placeholder="Tap to focus"
            onFocus={() => addLog("Plain input: onFocus")}
            onClick={() => addLog("Plain input: onClick")}
            onTouchStart={() => addLog("Plain input: onTouchStart")}
          />
        </div>

        {/* Test 4: Counter to verify clicks register */}
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">4. Counter Test</h2>
          <p className="mb-2">Count: {count}</p>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded"
            onClick={() => {
              setCount((c) => c + 1);
              addLog("Counter: clicked");
            }}
          >
            Increment
          </button>
        </div>
      </div>

      {/* Event Log */}
      <div className="mt-6 p-4 bg-muted rounded">
        <h2 className="font-semibold mb-2">Event Log:</h2>
        <div className="text-xs font-mono space-y-1 max-h-60 overflow-auto">
          {log.length === 0 ? (
            <p className="text-muted-foreground">No events yet. Tap elements above.</p>
          ) : (
            log.map((entry, i) => <div key={i}>{entry}</div>)
          )}
        </div>
        <button
          className="mt-2 text-xs underline"
          onClick={() => setLog([])}
        >
          Clear log
        </button>
      </div>

      {/* Device info */}
      <div className="mt-4 p-4 bg-muted rounded text-xs">
        <h2 className="font-semibold mb-2">Device Info:</h2>
        <p>User Agent: {typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}</p>
        <p>Touch Support: {typeof navigator !== "undefined" && "ontouchstart" in window ? "Yes" : "No"}</p>
      </div>
    </div>
  );
}
