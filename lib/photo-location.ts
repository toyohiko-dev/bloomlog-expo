export type VerifiedPlaceCoordinate = { id: string; latitude: number; longitude: number; verified: boolean };
export type PhotoPosition = { latitude: number; longitude: number; accuracy: number };
export type PhotoLocationDecision = {
  status: "unavailable" | "denied" | "ambiguous" | "suggestion";
  candidates: string[];
  previousPlaceId: string | null;
};

/** Pure suggestions only. Caller must obtain explicit user intent before requesting location. */
export function suggestPhotoLocations(input: {
  position: PhotoPosition | null;
  places: VerifiedPlaceCoordinate[];
  permission: "unknown" | "granted" | "denied";
  previousPlaceId?: string | null;
}): PhotoLocationDecision {
  const previousPlaceId = input.previousPlaceId ?? null;
  const empty = (status: PhotoLocationDecision["status"]): PhotoLocationDecision => ({ status, candidates: [], previousPlaceId });
  if (input.permission === "denied") return empty("denied");
  const point = input.position;
  if (!point || input.permission !== "granted") return empty("unavailable");
  const valid = (latitude: number, longitude: number) => Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  if (!valid(point.latitude, point.longitude) || !Number.isFinite(point.accuracy) || point.accuracy < 0) return empty("unavailable");
  if (point.accuracy > 150) return empty("ambiguous");
  const radians = (value: number) => value * Math.PI / 180;
  const distance = (place: VerifiedPlaceCoordinate) => {
    const dlat = radians(place.latitude - point.latitude), dlon = radians(place.longitude - point.longitude);
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(radians(point.latitude)) * Math.cos(radians(place.latitude)) * Math.sin(dlon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  };
  const nearby = input.places.filter(place => place.verified && valid(place.latitude, place.longitude))
    .map(place => ({ id: place.id, distance: distance(place) }))
    .filter(place => place.distance <= Math.max(80, point.accuracy + 30))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
  if (!nearby.length) return empty("unavailable");
  const ambiguous = nearby.length > 1 && nearby[1].distance - nearby[0].distance <= Math.max(25, point.accuracy * 2);
  return { status: ambiguous ? "ambiguous" : "suggestion", candidates: nearby.slice(0, ambiguous ? 3 : 1).map(place => place.id), previousPlaceId };
}
