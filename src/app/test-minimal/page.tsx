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
import { Header } from "@/components/Header";

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
      {/* Actual Header component from simulator */}
      <Header />

      {/* Year/Division Selectors - same as simulator */}
      <div className="container mx-auto px-4 py-4 flex gap-4">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024 Open</SelectItem>
            <SelectItem value="2023">2023 Open</SelectItem>
            <SelectItem value="2022">2022 Open</SelectItem>
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">Men (RX)</SelectItem>
            <SelectItem value="2023">Women (RX)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content - same grid layout as simulator */}
      <main className="container mx-auto px-4 pb-8">
        <p className="text-sm text-muted-foreground mb-4">
          Tap count: {count} | Year: {year}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - matches simulator WorkoutCards area */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Workout Scores</h2>

            {/* Card 1 with Collapsible - matches WorkoutCard structure */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">24.1</CardTitle>
                </div>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <div className="flex items-start gap-1 mt-1">
                    <p className="text-xs text-muted-foreground flex-1">
                      21-15-9 dumbbell snatches and burpees over dumbbell
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
                      <p className="text-xs">Full workout description...</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="e.g., 9:02 or 9m02s" />
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">24.2</CardTitle>
                <p className="text-xs text-muted-foreground">
                  For time: rowing, double-unders, and thrusters
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCount(c => c + 1)}
                    className="flex-1"
                  >
                    Finished
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCount(c => c + 1)}
                    className="flex-1"
                  >
                    Hit Cap
                  </Button>
                </div>
                <Input placeholder="Enter score..." />
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">24.3</CardTitle>
                <p className="text-xs text-muted-foreground">
                  AMRAP in 15 minutes
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="e.g., 7+12" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - matches simulator ResultsPanel + Chart */}
          <div className="space-y-4">
            {/* Results Panel placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Results Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Enter scores to see results</p>
                <Button className="w-full mt-4" onClick={() => setCount(c => c + 1)}>
                  Calculate
                </Button>
              </CardContent>
            </Card>

            {/* Distribution Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Score Distribution</CardTitle>
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
          </div>
        </div>
      </main>
    </div>
  );
}
