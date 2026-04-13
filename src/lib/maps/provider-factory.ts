import type { MapsProvider, MapsProviderType } from "./types";
import { TomTomProvider } from "./providers/tomtom";

let cachedProvider: MapsProvider | null = null;

/**
 * Factory function to get the configured maps provider.
 * Only call this server-side (API routes) to keep keys secret.
 * 
 * To add a new provider:
 * 1. Create a new class implementing MapsProvider in ./providers/
 * 2. Add a case here
 * 3. Add the env var for its API key
 */
export function getMapsProvider(): MapsProvider {
  if (cachedProvider) return cachedProvider;

  const providerType = (process.env.MAPS_PROVIDER || "tomtom") as MapsProviderType;

  switch (providerType) {
    case "tomtom": {
      const apiKey = process.env.TOMTOM_API_KEY;
      if (!apiKey) throw new Error("TOMTOM_API_KEY is not set");
      cachedProvider = new TomTomProvider(apiKey);
      break;
    }
    case "google": {
      // Future: GoogleMapsProvider
      throw new Error("Google Maps provider not yet implemented. Set MAPS_PROVIDER=tomtom");
    }
    case "mapbox": {
      // Future: MapboxProvider
      throw new Error("Mapbox provider not yet implemented. Set MAPS_PROVIDER=tomtom");
    }
    default:
      throw new Error(`Unknown maps provider: ${providerType}`);
  }

  return cachedProvider;
}
