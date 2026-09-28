/**
 * GeoLocationService.ts
 * DEV_D - Phase 5 Geo-Location Donor Matching
 *
 * Provides deterministic, mathematical distance calculations (Haversine formula),
 * radius filtering, and distance range categorization.
 * No external APIs or AI dependencies used.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type DistanceRangeCategory = '0-5km' | '5-10km' | '10-25km' | '25+km';

export class GeoLocationService {
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Converts degrees to radians.
   */
  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Validates if latitude and longitude values are within valid geographic bounds.
   */
  public static isValidCoordinate(latitude: number, longitude: number): boolean {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
    if (isNaN(latitude) || isNaN(longitude)) return false;
    if (latitude < -90 || latitude > 90) return false;
    if (longitude < -180 || longitude > 180) return false;
    return true;
  }

  /**
   * Calculates the great-circle distance between two geographic coordinates
   * using the Haversine formula.
   *
   * @param lat1 Latitude of point 1 in degrees
   * @param lon1 Longitude of point 1 in degrees
   * @param lat2 Latitude of point 2 in degrees
   * @param lon2 Longitude of point 2 in degrees
   * @returns Distance in kilometers (rounded to 2 decimal places)
   */
  public static calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    if (!this.isValidCoordinate(lat1, lon1) || !this.isValidCoordinate(lat2, lon2)) {
      throw new Error(`Invalid geographic coordinates provided: (${lat1}, ${lon1}) -> (${lat2}, ${lon2})`);
    }

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const radLat1 = this.toRadians(lat1);
    const radLat2 = this.toRadians(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100;
  }

  /**
   * Checks whether a target point is within the specified radius (in km) from a center point.
   */
  public static isWithinRadius(
    centerLat: number,
    centerLon: number,
    targetLat: number,
    targetLon: number,
    radiusKm: number
  ): boolean {
    if (radiusKm < 0) return false;
    const distance = this.calculateHaversineDistance(centerLat, centerLon, targetLat, targetLon);
    return distance <= radiusKm;
  }

  /**
   * Categorizes a distance in kilometers into standard distance bands.
   */
  public static categorizeDistanceRange(distanceKm: number): DistanceRangeCategory {
    if (distanceKm <= 5) return '0-5km';
    if (distanceKm <= 10) return '5-10km';
    if (distanceKm <= 25) return '10-25km';
    return '25+km';
  }
}
