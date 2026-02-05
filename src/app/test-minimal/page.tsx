"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Progressively add components to find what breaks touch

// Sample chart data
const chartData = [
  { name: "1-5%", value: 500 },
  { name: "6-10%", value: 800 },
  { name: "11-20%", value: 1200 },
  { name: "21-30%", value: 1800 },
  { name: "31-50%", value: 2500 },
  { name: "51-75%", value: 2000 },
  { name: "76-100%", value: 1000 },
];

export default function TestMinimalPage() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  const [year, setYear] = useState("2024");
  const [isOpen, setIsOpen] = useState(false);

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

        {/* ShadCN Card with Collapsible - matches WorkoutCard structure */}
        <Card>
          <CardHeader>
            <CardTitle>Card with Collapsible</CardTitle>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <div className="flex items-start gap-1 mt-1">
                <p className="text-xs text-muted-foreground flex-1">
                  Short description here
                </p>
                <CollapsibleTrigger asChild>
                  <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 shrink-0">
                    <span className="underline">{isOpen ? "Less" : "More"}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isOpen && "rotate-180"}`} />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                  <p className="text-xs">Detailed description here...</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>This card contains interactive elements:</p>
            <Button variant="outline" onClick={() => setCount(c => c + 1)}>
              Button inside Card
            </Button>
            <Input placeholder="Input inside Card" />
          </CardContent>
        </Card>

        {/* Recharts - animated chart component from simulator */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Chart (Recharts)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#3b82f6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* More buttons/inputs after the chart to test if chart affects them */}
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">Elements after chart:</p>
          <Button onClick={() => setCount(c => c + 1)}>
            Button After Chart
          </Button>
          <Input placeholder="Input After Chart" />
        </div>
      </main>
    </div>
  );
}
