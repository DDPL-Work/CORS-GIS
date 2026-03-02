//stationApi.js

const BASE = "https://survey.drdesigntech.com/api";

const getAuthHeader = () => {
  try {
    const saved = localStorage.getItem("rekhans_auth");
    if (!saved) return {};

    const { token } = JSON.parse(saved);
    return token ? { Authorization: `Token ${token}` } : {};
  } catch (err) {
    console.error("Auth parse error:", err);
    return {};
  }
};

const handleResponse = async (res, errorMessage) => {
  if (res.status === 401) {
    console.error("Unauthorized – check token");
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(errorMessage);
  }

  try {
    return await res.json();
  } catch (err) {
    throw new Error("Invalid JSON response");
  }
};

// ✅ Fetch States
export const fetchStates = async () => {
  const res = await fetch(`${BASE}/statesdb/`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  const data = await handleResponse(res, "Failed to fetch states");
  return Array.isArray(data) ? data : [];
};

// ✅ Fetch Districts
export const fetchDistricts = async (stateId) => {
  if (!stateId) return [];

  const res = await fetch(`${BASE}/statesdb/${stateId}/districtsdb/`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  const data = await handleResponse(res, "Failed to fetch districts");
  return data?.districts || [];
};

// ✅ Fetch Stations by District
export const fetchStationsByDistrict = async (districtId) => {
  if (!districtId) return [];

  const res = await fetch(`${BASE}/districtsdb/${districtId}/stationdb/`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  const data = await handleResponse(res, "Failed to fetch stations");

  // 🔥 NORMALIZE STRUCTURE
  if (!data?.station || !Array.isArray(data.station)) return [];

  return data.station.map((s) => ({
    id: s.station_id,
    name: s.station_name,
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
    lat: Number(s.latitude),
    lng: Number(s.longitude),
    state: data.state_name,
    district: data.district_name,
    status: "active", // established station default
    type: "established"
  }));
};

// ✅ 🔥 Fetch ALL Stations (India)
export const fetchAllStations = async () => {
  const res = await fetch(`${BASE}/stationsdb/`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  const data = await handleResponse(res, "Failed to fetch all stations");

  if (!Array.isArray(data)) return [];

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
    lat: Number(s.latitude),
    lng: Number(s.longitude),
    height: s.height,
    state: "India",
    district: "",
    status: "active",
    type: "established"
  }));
};