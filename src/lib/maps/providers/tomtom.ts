import type {
  MapsProvider,
  Coordinates,
  GeocodingResult,
  RouteResult,
  RouteWaypoint,
} from "../types";

export class TomTomProvider implements MapsProvider {
  private apiKey: string;
  private baseUrl = "https://api.tomtom.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocode(address: string): Promise<GeocodingResult[]> {
    const encoded = encodeURIComponent(address);
    const url = `${this.baseUrl}/search/2/geocode/${encoded}.json?key=${this.apiKey}&limit=5`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TomTom geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    return (data.results || []).map((result: Record<string, unknown>) => {
      const addr = result.address as Record<string, string>;
      const pos = result.position as { lat: number; lon: number };
      return {
        address: addr?.freeformAddress || address,
        coordinates: { lat: pos.lat, lng: pos.lon },
        formattedAddress: addr?.freeformAddress || address,
        city: addr?.municipality,
        state: addr?.countrySubdivision,
        postalCode: addr?.postalCode,
        country: addr?.country,
      };
    });
  }

  async reverseGeocode(
    coordinates: Coordinates
  ): Promise<GeocodingResult | null> {
    const url = `${this.baseUrl}/search/2/reverseGeocode/${coordinates.lat},${coordinates.lng}.json?key=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const result = data.addresses?.[0];
    if (!result) return null;

    const addr = result.address;
    return {
      address: addr.freeformAddress,
      coordinates,
      formattedAddress: addr.freeformAddress,
      city: addr.municipality,
      state: addr.countrySubdivision,
      postalCode: addr.postalCode,
      country: addr.country,
    };
  }

  async calculateRoute(
    waypoints: RouteWaypoint[]
  ): Promise<RouteResult | null> {
    if (waypoints.length < 2) return null;

    const locations = waypoints
      .map((wp) => `${wp.coordinates.lat},${wp.coordinates.lng}`)
      .join(":");

    const url = `${this.baseUrl}/routing/1/calculateRoute/${locations}/json?key=${this.apiKey}&travelMode=car`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) return null;

    const summary = route.summary;
    const distanceKm = summary.lengthInMeters / 1000;
    const durationMin = Math.round(summary.travelTimeInSeconds / 60);

    const polyline: Coordinates[] = [];
    for (const leg of route.legs || []) {
      for (const point of leg.points || []) {
        polyline.push({ lat: point.latitude, lng: point.longitude });
      }
    }

    return {
      distanceMeters: summary.lengthInMeters,
      durationSeconds: summary.travelTimeInSeconds,
      distanceText: `${distanceKm.toFixed(1)} km`,
      durationText:
        durationMin >= 60
          ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
          : `${durationMin} min`,
      polyline,
    };
  }

  getNavigationUrl(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): string {
    // Falls back to Google Maps navigation URL since TomTom doesn't have
    // a universal web navigation link. This ensures any device can open it.
    let url = `https://www.google.com/maps/dir/${origin.lat},${origin.lng}`;

    if (waypoints) {
      for (const wp of waypoints) {
        url += `/${wp.lat},${wp.lng}`;
      }
    }

    url += `/${destination.lat},${destination.lng}`;
    return url;
  }
}
