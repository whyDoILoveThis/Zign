/** 
 * Maps Provider Abstraction Layer
 * 
 * All map operations go through this interface. To swap providers
 * (TomTom → Google Maps → Mapbox), implement the MapsProvider interface
 * and update the factory in provider-factory.ts.
 * 
 * API keys are ONLY used server-side via Next.js API routes.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  address: string;
  coordinates: Coordinates;
  formattedAddress: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  polyline: Coordinates[];
}

export interface RouteWaypoint {
  coordinates: Coordinates;
  label?: string;
}

export interface MapsProvider {
  /** Geocode an address string to coordinates */
  geocode(address: string): Promise<GeocodingResult[]>;

  /** Reverse geocode coordinates to an address */
  reverseGeocode(coordinates: Coordinates): Promise<GeocodingResult | null>;

  /** Calculate a route between waypoints */
  calculateRoute(waypoints: RouteWaypoint[]): Promise<RouteResult | null>;

  /** Generate a navigation URL that opens in the provider's app or web */
  getNavigationUrl(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): string;
}

export type MapsProviderType = "tomtom" | "google" | "mapbox";
