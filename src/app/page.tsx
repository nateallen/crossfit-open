import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { getAvailableYears } from "@/lib/workout-metadata";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Gradient fade from header */}
      <div className="h-32 -mb-32 pointer-events-none header-gradient" />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex flex-col gap-2">
            <span className="whitespace-nowrap">Replay past Opens</span>
            <span className="whitespace-nowrap">Compare your performance</span>
            <span className="whitespace-nowrap">Chase the next rep</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            One More Rep lets you replay CrossFit Opens from past years and see exactly where your scores would have landed on the leaderboard. Enter your results workout by workout to view estimated rank, percentile, and how close you were to the next jump. Whether you’re analyzing a single workout or re-running an entire Open, this is a tool for athletes who love digging into the data and asking the question every CrossFitter knows well: what if I had just one more rep?
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/simulator">Start Simulator</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span> Real-Time Percentiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                See exactly where your scores rank against hundreds of thousands
                of CrossFit Open participants.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> What-If Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Experiment with different scores to see how they would affect
                your overall ranking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📈</span> Score Distributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Visualize the distribution of scores for each workout and see
                exactly where you land.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supported Years */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold mb-4">Supported Years</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            {getAvailableYears().map((year) => (
              <Link
                key={year}
                href={`/simulator?year=${year}`}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium transition-colors"
              >
                {year}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
