import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">
            See Where You Stack Up
          </h2>
          <p className="text-xl text-muted-foreground">
            Enter your CrossFit Open scores and instantly see your estimated
            percentile and rank against all competitors worldwide.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/simulator">Start Simulator</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/leaderboard">Browse Leaderboard</Link>
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
            {[2024, 2023].map((year) => (
              <span
                key={year}
                className="px-4 py-2 bg-muted rounded-full text-sm font-medium"
              >
                {year}
              </span>
            ))}
            <span className="px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
              More coming soon...
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
