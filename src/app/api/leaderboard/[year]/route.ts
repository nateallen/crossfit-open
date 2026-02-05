import { NextRequest, NextResponse } from "next/server";
import type { LeaderboardResponse } from "@/types";

const CROSSFIT_API_BASE = "https://c3po.crossfit.com/api/competitions/v2/competitions/open";

// Simple in-memory cache
const cache = new Map<string, { data: LeaderboardResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests (10 req/sec max)

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Validate year
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2015 || yearNum > 2030) {
      return NextResponse.json(
        { error: "Invalid year. Must be between 2015 and 2030." },
        { status: 400 }
      );
    }

    // Build query parameters
    const division = searchParams.get("division") || "1";
    const scaled = searchParams.get("scaled") || "0";
    const page = searchParams.get("page") || "1";
    const region = searchParams.get("region") || "0";

    // Validate division
    const divisionNum = parseInt(division, 10);
    if (isNaN(divisionNum) || divisionNum < 1 || divisionNum > 30) {
      return NextResponse.json(
        { error: "Invalid division." },
        { status: 400 }
      );
    }

    // Build cache key
    const cacheKey = `${year}-${division}-${scaled}-${page}-${region}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    // Build upstream URL
    const upstreamUrl = new URL(`${CROSSFIT_API_BASE}/${year}/leaderboards`);
    upstreamUrl.searchParams.set("view", "0");
    upstreamUrl.searchParams.set("division", division);
    upstreamUrl.searchParams.set("scaled", scaled);
    upstreamUrl.searchParams.set("page", page);
    upstreamUrl.searchParams.set("region", region);
    upstreamUrl.searchParams.set("sort", "0");

    // Fetch from upstream
    const response = await rateLimitedFetch(upstreamUrl.toString());

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as LeaderboardResponse;

    // Validate response shape
    if (!data.pagination || !data.leaderboardRows) {
      return NextResponse.json(
        { error: "Invalid response from upstream API" },
        { status: 502 }
      );
    }

    // Cache the response
    cache.set(cacheKey, { data, timestamp: Date.now() });

    // Clean old cache entries (basic cleanup)
    if (cache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key);
        }
      }
    }

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
