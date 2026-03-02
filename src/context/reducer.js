// src/context/reducer.js

import { calculateDistance, calculateAngle } from "../utils/geoUtils";
import { MOCK_USERS } from "../data/mockUsers";
import { loginUser, signupUser } from "../api/authApi";
import { MOCK_STATIONS } from "../data/mockStations";
import { MOCK_LOCATIONS } from "../data/mockLocations";
/* ✅ ADD THIS */
export const initialState = {
  auth: { user: null, token: null, role: null, zone: null },
  users: MOCK_USERS,
  stations: MOCK_STATIONS,
  locations: MOCK_LOCATIONS,
  selectedStations: [],
  selectedLocations: [],
  mapTool: null,
  toolPoints: [],
  distances: [],
  angles: [],
  notification: null,
  activeView: "map",
  filters: { state: "", district: "", surveyorId: null, status: "" },
  comparedLocations: [],
  viewStationsMode: false,
  establishedStates: [],
establishedDistricts: [],
 
selectedStateId: null,
selectedDistrictId: null,
loadingStations: false,
hierarchySites: [],
loadingHierarchy: false,
};

/* ✅ ALREADY PRESENT */
export const reducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, auth: action.payload };

    case "LOGOUT":
      return { ...initialState };

    case "SET_TOOL":
      return { ...state, mapTool: action.payload, toolPoints: [], distances: [], angles: [] };

    case "ADD_TOOL_POINT": {
      const points = [...state.toolPoints, action.payload];
      let distances = state.distances;
      let angles = state.angles;

      if (state.mapTool === "distance" && points.length >= 2) {
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        const d = calculateDistance(prev.lat, prev.lng, last.lat, last.lng);
        distances = [...state.distances, { a: prev, b: last, distance: d }];
      }

      if (state.mapTool === "angle" && points.length >= 3) {
        const [A, B, C] = points.slice(-3);
        const angle = calculateAngle(A, B, C);
        angles = [...state.angles, { A, B, C, angle }];
      }

      return { ...state, toolPoints: points, distances, angles };
    }

    case "CLEAR_TOOL_POINTS":
      return { ...state, toolPoints: [], distances: [], angles: [] };

   case "TOGGLE_STATION": {
  const exists = state.selectedStations.includes(action.payload);
  return {
    ...state,
    selectedStations: exists
      ? state.selectedStations.filter(id => id !== action.payload)
      : [...state.selectedStations, action.payload],
    toolPoints: [],        // 🔥 CLEAR TOOL POINTS
    distances: [],         // 🔥 CLEAR DISTANCES
    angles: []             // 🔥 CLEAR ANGLES
  };
}

    case "SET_ACTIVE_VIEW":
      return { ...state, activeView: action.payload };

    case "UPDATE_LOCATION":
      return {
        ...state,
        locations: state.locations.map((l) =>
          l.id === action.payload.id ? { ...l, ...action.payload } : l
        ),
      };

    case "SET_NOTIFICATION":
      return { ...state, notification: action.payload };

    case "SET_FILTER":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    // case "REGISTER_USER":
    //   return { ...state, users: [...state.users, action.payload] };

    case "SET_COMPARE_MODE":
      return { ...state, mapTool: action.payload ? "compare" : null, toolPoints: [], distances: [], angles: [] };

    case "ADD_COMPARE_LOCATION": {
  const raw = action.payload;
  if (!raw || !raw.id) return state;

  if (state.comparedLocations.some(loc => loc.id === raw.id)) {
    return state;
  }

  const normalized = {
    id: raw.id,
    location: raw.location,
    priority: raw.priority,
    created_at: raw.created_at,

    latitude: Number(raw.location_details?.latitude),
    longitude: Number(raw.location_details?.longitude),
    state: raw.location_details?.state,
    district: raw.location_details?.district,
    city: raw.location_details?.city,
    address: raw.location_details?.address,

    monument: raw.monument || {},
    sky_visibility: raw.sky_visibility || {},
    power: raw.power || {},
    connectivity: raw.connectivity || {},
    photos: raw.photos || {},

    originalData: raw
  };

  return {
    ...state,
    comparedLocations: [...state.comparedLocations, normalized]
  };
};

    case "REMOVE_COMPARE_LOCATION":
      return { ...state, comparedLocations: state.comparedLocations.filter(loc => loc.id !== action.payload) };

    case "CLEAR_COMPARE":
      return { ...state, comparedLocations: [] };

    case "SET_VIEW_STATIONS_MODE":
      return { ...state, viewStationsMode: action.payload, mapTool: action.payload ? "viewStations" : null, toolPoints: [], distances: [], angles: [] };
case "SET_ESTABLISHED_STATES":
  return { ...state, establishedStates: action.payload };

case "SET_ESTABLISHED_DISTRICTS":
  return { ...state, establishedDistricts: action.payload };

case "SET_ESTABLISHED_STATIONS":
  return { ...state, establishedStations: action.payload };

case "SET_SELECTED_STATE":
  return {
    ...state,
    selectedStateId: action.payload,
    selectedDistrictId: null,
    establishedDistricts: []
    // ❌ DO NOT reset establishedStations here
  };

case "SET_SELECTED_DISTRICT":
  return { ...state, selectedDistrictId: action.payload };

case "SET_LOADING_STATIONS":
  return { ...state, loadingStations: action.payload };
  case "SET_HIERARCHY_SITES":
  return { ...state, hierarchySites: action.payload };

case "SET_LOADING_HIERARCHY":
  return { ...state, loadingHierarchy: action.payload };
    default:
      return state;
  }
};