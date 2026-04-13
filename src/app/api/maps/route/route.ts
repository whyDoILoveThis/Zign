import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMapsProvider, type Coordinates } from "@/lib/maps";

// Calculate route between waypoints
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { waypoints } = body as { waypoints: { coordinates: Coordinates; label?: string }[] };

  if (!waypoints || waypoints.length < 2) {
    return NextResponse.json(
      { error: "At least 2 waypoints required" },
      { status: 400 }
    );
  }

  try {
    const maps = getMapsProvider();
    const result = await maps.calculateRoute(waypoints);

    if (!result) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    // Also generate a navigation URL
    const origin = waypoints[0].coordinates;
    const destination = waypoints[waypoints.length - 1].coordinates;
    const intermediates = waypoints.slice(1, -1).map((wp) => wp.coordinates);

    const navigationUrl = maps.getNavigationUrl(
      origin,
      destination,
      intermediates.length > 0 ? intermediates : undefined
    );

    return NextResponse.json({ ...result, navigationUrl });
  } catch (error) {
    console.error("Route calculation error:", error);
    return NextResponse.json({ error: "Route calculation failed" }, { status: 500 });
  }
}
