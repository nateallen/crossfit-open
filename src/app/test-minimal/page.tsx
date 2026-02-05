"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Progressively add components to find what breaks touch

export default function TestMinimalPage() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  const [year, setYear] = useState("2024");

  return (
    <div className="min-h-screen bg-background">
      {/* Same header structure as simulator */}
      <header className="border-b bg-slate-800 text-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Minimal Test with ShadCN</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-4">
        <p className="text-sm text-muted-foreground">
          Tap count: {count} | Year: {year}
        </p>

        {/* ShadCN Button */}
        <Button onClick={() => setCount(c => c + 1)}>
          ShadCN Button - Tap Me
        </Button>

        {/* ShadCN Input */}
        <Input
          type="text"
          placeholder="ShadCN Input - Tap to type"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* ShadCN Select */}
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>

        {/* ShadCN Card - this is used in simulator */}
        <Card>
          <CardHeader>
            <CardTitle>Card Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>This card contains interactive elements:</p>
            <Button variant="outline" onClick={() => setCount(c => c + 1)}>
              Button inside Card
            </Button>
            <Input placeholder="Input inside Card" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
