// src/utils/roleUtils.js
import { calculateDistance } from './geoUtils';

/**
 * Get stations visible to a user based on their role and hierarchy
 * @param {string} role - User's role
 * @param {object} user - User object with id, zone, etc.
 * @param {Array} stations - All stations
 * @param {object} filters - Additional filters (state, district, status)
 * @returns {Array} Filtered stations
 */
export const getStationsByRole = (role, user, stations, filters = {}) => {
  if (!user || !role || !stations || !Array.isArray(stations)) return [];

  let filteredStations = stations;

  // Apply role-based filtering
  switch (role) {
    case 'SURVEYOR':
      filteredStations = stations.filter(st => st.surveyorId === user.id);
      break;
    case 'SUPERVISOR':
      filteredStations = stations.filter(st => st.supervisorId === user.id);
      break;
    case 'DIRECTOR':
      filteredStations = stations.filter(st => st.directorId === user.id);
      break;
    case 'ZONAL_CHIEF':
      filteredStations = stations.filter(st => st.zone === user.zone);
      break;
    case 'GNRB':
      // GNRB sees all stations
      filteredStations = stations;
      break;
    default:
      filteredStations = [];
  }

  // Apply additional filters
  if (filters.state) {
    filteredStations = filteredStations.filter(st => st.state === filters.state);
  }
  if (filters.district) {
    filteredStations = filteredStations.filter(st => st.district === filters.district);
  }
  if (filters.status) {
    filteredStations = filteredStations.filter(st => st.status === filters.status);
  }

  return filteredStations;
};

/**
 * Get locations visible to a user based on visible stations
 * @param {Array} locations - All locations
 * @param {Array} visibleStations - Stations the user can see
 * @param {object} filters - Additional filters
 * @returns {Array} Filtered locations
 */
export const getLocationsByStations = (locations, visibleStations, filters = {}) => {
  if (!locations || !Array.isArray(locations) || !visibleStations || !Array.isArray(visibleStations)) return [];
  
  return locations.filter(loc => {
    // Validate location coordinates
    if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number' || isNaN(loc.lat) || isNaN(loc.lng)) return false;
    
    const station = visibleStations.find(s => s.id === loc.stationId);
    if (!station) return false;

    // Validate station coordinates
    if (typeof station.lat !== 'number' || typeof station.lng !== 'number' || isNaN(station.lat) || isNaN(station.lng)) return false;

    // Check if location is within 2km of station
    try {
      const dist = calculateDistance(loc.lat, loc.lng, station.lat, station.lng);
      const inCircle = dist <= 2;

      // Apply status filter
      const statusOk = !filters.status || loc.status === filters.status;

      return inCircle && statusOk;
    } catch (e) {
      console.error('Error calculating distance:', e);
      return false;
    }
  });
};