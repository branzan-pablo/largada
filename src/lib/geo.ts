import { REGION_CITIES } from "@/lib/constants";

const EARTH_RADIUS_KM = 6371;
const MAX_RADIUS_KM = 200;
const BASE_CITIES = REGION_CITIES.slice(0, 3);

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function isWithinRegion(lat: number, lng: number): boolean {
  return BASE_CITIES.some(
    (city) => haversineDistance(lat, lng, city.lat, city.lng) <= MAX_RADIUS_KM
  );
}
