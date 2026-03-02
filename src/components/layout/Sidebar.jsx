
//sidebar.jsx

import { useState, useEffect } from 'react';
import { 
  fetchStates, 
  fetchDistricts, 
  fetchStationsByDistrict,
  fetchAllStations 
} from '../../api/stationsApi';import { useApp } from '../../context/AppContext';
import { fetchHierarchySites } from "../../api/hierarchyApi";
const Sidebar = () => {
  const { state, dispatch } = useApp();
  const [expandedSubordinates, setExpandedSubordinates] = useState({});
  const role = state.auth.role;
  const user = state.auth.user;

  // Get subordinates based on role
 
  const subordinateLabel = role === 'SUPERVISOR' ? 'SURVEYORS' : 
                          role === 'DIRECTOR' ? 'SUPERVISORS' : 
                          role === 'ZONAL_CHIEF' ? 'DIRECTORS' : 
                          role === 'GNRB' ? 'ZONAL CHIEFS' : 'SUBORDINATES';

  const toggleStation = (id) => dispatch({ type: "TOGGLE_STATION", payload: id });
  const toggleSubordinate = (id) => setExpandedSubordinates(prev => ({ ...prev, [id]: !prev[id] }));

  const tools = [
    { id: "distance", icon: "📏", label: "Distance Tool", hint: "Click stations/sites" },
    { id: "angle", icon: "📐", label: "Angle Tool", hint: "Select 3 stations/sites" },
    { id: "viewStations", icon: "🏛️", label: "View Stations", hint: "View all established CORS stations" },
    { id: "compare", icon: "📊", label: "Compare Locations", hint: "Select multiple locations to compare" },
    { id: "view", icon: "🔍", label: "Normal View" },
  ];
  //1
useEffect(() => {
   console.log("🔥 viewStationsMode changed:", state.viewStationsMode);
  if (!state.viewStationsMode) return;

  const loadInitialStations = async () => {
    try {
      dispatch({ type: "SET_LOADING_STATIONS", payload: true });

      // 1️⃣ Load states
      const states = await fetchStates();
      dispatch({ type: "SET_ESTABLISHED_STATES", payload: states });

      // 2️⃣ Automatically load ALL stations
      const stations = await fetchAllStations();

      dispatch({
        type: "SET_ESTABLISHED_STATIONS",
        payload: Array.isArray(stations) ? stations : [],
      });

      dispatch({ type: "SET_SELECTED_STATE", payload: "ALL_INDIA" });
      dispatch({ type: "SET_LOADING_STATIONS", payload: false });

    } catch (err) {
      console.error("Initial station load failed:", err);
      dispatch({ type: "SET_LOADING_STATIONS", payload: false });
    }
  };

  loadInitialStations();

}, [state.viewStationsMode]);


useEffect(() => {
  const loadHierarchy = async () => {
    if (!state.auth.token) return;

    try {
      dispatch({ type: "SET_LOADING_HIERARCHY", payload: true });

      const data = await fetchHierarchySites(state.auth.token);

      dispatch({
        type: "SET_HIERARCHY_SITES",
        payload: Array.isArray(data) ? data : [],
      });

      dispatch({ type: "SET_LOADING_HIERARCHY", payload: false });
    } catch (err) {
      console.error("Hierarchy fetch failed:", err);
      dispatch({ type: "SET_LOADING_HIERARCHY", payload: false });
    }
  };

  loadHierarchy();
}, [state.auth.token]);


  return (
    <div style={{ width: 260, background: "#080f1a", borderRight: "1px solid #00e5ff22", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
      {/* GIS Tools */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #00e5ff22" }}>
        <div style={{ color: "#4dd0e1", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 8, fontFamily: "monospace" }}>GIS TOOLS</div>
        {tools.map(t => (
          <div key={t.id}>
            <button onClick={() => {
              if (t.id === "viewStations") {
                console.log("🔥 View Stations Clicked");
                dispatch({ type: "SET_VIEW_STATIONS_MODE", payload: !state.viewStationsMode });
              } else if (t.id === "compare") {
                dispatch({ type: "SET_COMPARE_MODE", payload: state.mapTool !== "compare" });
              } else {
                dispatch({ type: "SET_TOOL", payload: state.mapTool === t.id ? null : t.id });
              }
            }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", marginBottom: t.hint ? 0 : 4, borderRadius: t.hint && ((t.id === "viewStations" ? state.viewStationsMode : state.mapTool === t.id)) ? "6px 6px 0 0" : 6, background: (t.id === "viewStations" ? state.viewStationsMode : state.mapTool === t.id) ? "#00e5ff22" : "transparent", border: (t.id === "viewStations" ? state.viewStationsMode : state.mapTool === t.id) ? "1px solid #00e5ff" : "1px solid transparent", color: (t.id === "viewStations" ? state.viewStationsMode : state.mapTool === t.id) ? "#00e5ff" : "#80deea", cursor: "pointer", fontSize: 12, fontFamily: "monospace", textAlign: "left", transition: "all 0.2s" }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {((t.id === "viewStations" && state.viewStationsMode) || (t.id !== "viewStations" && state.mapTool === t.id)) && <span style={{ marginLeft: "auto", background: "#00e5ff", color: "#000", borderRadius: 3, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>ON</span>}
            </button>
            {t.hint && ((t.id === "viewStations" && state.viewStationsMode) || (t.id !== "viewStations" && state.mapTool === t.id)) && (
              <div style={{ background: "#00e5ff11", border: "1px solid #00e5ff22", borderTop: "none", borderRadius: "0 0 6px 6px", padding: "4px 10px 6px", marginBottom: 4, fontSize: 10, color: "#4dd0e1", fontFamily: "monospace" }}>
                💡 {t.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #00e5ff22" }}>
        <div style={{ color: "#4dd0e1", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 8, fontFamily: "monospace" }}>FILTERS</div>
        <select value={state.filters.status} onChange={e => dispatch({ type: "SET_FILTER", payload: { status: e.target.value } })}
          style={{ width: "100%", background: "#0d1b2a", border: "1px solid #00e5ff33", color: "#e0f7fa", borderRadius: 6, padding: "5px 8px", fontSize: 11, marginBottom: 6, fontFamily: "monospace" }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={state.filters.state} onChange={e => dispatch({ type: "SET_FILTER", payload: { state: e.target.value } })}
          style={{ width: "100%", background: "#0d1b2a", border: "1px solid #00e5ff33", color: "#e0f7fa", borderRadius: 6, padding: "5px 8px", fontSize: 11, fontFamily: "monospace" }}>
          <option value="">All States</option>
          <option value="Delhi">Delhi</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
          <option value="Haryana">Haryana</option>
          <option value="Chandigarh">Chandigarh</option>
        </select>
      </div>


{/* ESTABLISHED STATIONS FILTER (ONLY WHEN TOOL ACTIVE) */}
{state.viewStationsMode && (
  <div style={{ padding: "12px 14px", borderBottom: "1px solid #00e5ff22" }}>

    {/* Show All Stations Button */}
<button
  onClick={async () => {
    // 🔴 IF ALREADY ACTIVE → TURN OFF
    if (state.selectedStateId === "ALL_INDIA") {
      dispatch({ type: "SET_SELECTED_STATE", payload: null });
      dispatch({ type: "SET_ESTABLISHED_STATIONS", payload: [] });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING_STATIONS", payload: true });

      // 🟢 Only fetch if not already loaded
     if (!Array.isArray(state.establishedStations) || state.establishedStations.length === 0){
        const stations = await fetchAllStations();
        dispatch({
          type: "SET_ESTABLISHED_STATIONS",
          payload: Array.isArray(stations) ? stations : [],
        });
      }

      dispatch({ type: "SET_SELECTED_STATE", payload: "ALL_INDIA" });
      dispatch({ type: "SET_SELECTED_DISTRICT", payload: null });

      dispatch({ type: "SET_LOADING_STATIONS", payload: false });

    } catch (err) {
      console.error("Fetch all stations error:", err);
      dispatch({ type: "SET_LOADING_STATIONS", payload: false });
    }
  }}
  style={{
    width: "100%",
    background:
      state.selectedStateId === "ALL_INDIA"
        ? "#00e5ff"
        : "#00e5ff22",
    border: "1px solid #00e5ff",
    color:
      state.selectedStateId === "ALL_INDIA"
        ? "#000"
        : "#00e5ff",
    borderRadius: 6,
    padding: "6px 8px",
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 8,
    cursor: "pointer",
    transition: "all 0.2s"
  }}
>
  🌍 Show All Stations (India)
  {state.selectedStateId === "ALL_INDIA" && (
    <span
      style={{
        marginLeft: "auto",
        background: "#000",
        color: "#00e5ff",
        borderRadius: 3,
        padding: "1px 5px",
        fontSize: 9,
        fontWeight: 700,
        float: "right"
      }}
    >
      ON
    </span>
  )}
</button>
    <div style={{ color: "#4dd0e1", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
      EXISTING STATIONS
    </div>

    {/* State Select */}
    <select
      value={state.selectedStateId || ""}
      onChange={async e => {
        const stateId = e.target.value;
        dispatch({ type: "SET_SELECTED_STATE", payload: stateId });

        if (!stateId) return;

        dispatch({ type: "SET_LOADING_STATIONS", payload: true });

        const districts = await fetchDistricts(stateId);
        dispatch({ type: "SET_ESTABLISHED_DISTRICTS", payload: districts });

        dispatch({ type: "SET_LOADING_STATIONS", payload: false });
      }}
      style={{
        width: "100%",
        background: "#0d1b2a",
        border: "1px solid #00e5ff33",
        color: "#e0f7fa",
        borderRadius: 6,
        padding: "5px 8px",
        fontSize: 11,
        fontFamily: "monospace",
        marginBottom: 6
      }}
    >

      
      <option value="">Select State</option>
{Array.isArray(state.establishedStates) &&
 state.establishedStates.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>

    {/* District Select */}
    {state.selectedStateId && (
      <select
        value={state.selectedDistrictId || ""}
        onChange={async e => {
          const districtId = e.target.value;
          dispatch({ type: "SET_SELECTED_DISTRICT", payload: districtId });

          if (!districtId) return;

          dispatch({ type: "SET_LOADING_STATIONS", payload: true });

          const stations = await fetchStationsByDistrict(districtId);
          dispatch({ type: "SET_ESTABLISHED_STATIONS", payload: stations });

          dispatch({ type: "SET_LOADING_STATIONS", payload: false });
        }}
        style={{
          width: "100%",
          background: "#0d1b2a",
          border: "1px solid #00e5ff33",
          color: "#e0f7fa",
          borderRadius: 6,
          padding: "5px 8px",
          fontSize: 11,
          fontFamily: "monospace"
        }}
      >
        <option value="">Select District</option>
        {state.establishedDistricts.map(d => (
          <option key={d.district_id} value={d.district_id}>
            {d.district_name}
          </option>
        ))}
      </select>
    )}
  </div>
)}


      {/* Subordinates */}
     {/* Subordinates */}
{["SUPERVISOR", "DIRECTOR", "ZONAL_CHIEF", "GNRB"].includes(role) &&
  Array.isArray(state.hierarchySites) &&
  state.hierarchySites.length > 0 && (

  <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

    {/* GROUP SITES BY SURVEYOR */}
    {Object.entries(
      state.hierarchySites.reduce((acc, site) => {
        const key = site.surveyor_name || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(site);
        return acc;
      }, {})
    ).map(([surveyorName, sites]) => {

      const isExpanded = expandedSubordinates[surveyorName];
      const totalStations = sites.length;

      return (
        <div key={surveyorName} style={{ marginBottom: 6 }}>

          {/* SURVEYOR HEADER */}
          <button
            onClick={() => toggleSubordinate(surveyorName)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: "7px 10px",
              borderRadius: 6,
              background: isExpanded ? "#00e5ff11" : "transparent",
              border: "1px solid #00e5ff22",
              color: "#e0f7fa",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "monospace",
              textAlign: "left"
            }}
          >
            <span style={{ color: "#00e5ff" }}>
              {isExpanded ? "▼" : "▶"}
            </span>

            <span>{surveyorName}</span>

            <span style={{
              marginLeft: "auto",
              background: "#00e5ff22",
              color: "#4dd0e1",
              borderRadius: 3,
              padding: "1px 5px",
              fontSize: 9
            }}>
              {totalStations}
            </span>
          </button>

          {/* STATIONS */}
          {isExpanded && (
            <div style={{ marginLeft: 16, marginTop: 4 }}>

              {sites.map(site => {

                const isSelected = state.selectedStations.includes(site.id);

                return (
                  <label
                    key={site.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 8px",
                      cursor: "pointer",
                      borderRadius: 4,
                      fontSize: 11,
                      color: isSelected ? "#00e5ff" : "#80deea",
                      fontFamily: "monospace"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStation(site.id)}
                      style={{ accentColor: "#00e5ff" }}
                    />

                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        site.status === "APPROVED" ? "#00e676" :
                        site.status === "REJECTED" ? "#ff5252" :
                        "#ffd700",
                      flexShrink: 0
                    }} />

                    {site.station}
                  </label>
                );
              })}

            </div>
          )}
        </div>
      );
    })}

  </div>
)}

      {/* Legend */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid #00e5ff22", fontSize: 10, fontFamily: "monospace" }}>
        <div style={{ color: "#4dd0e1", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>LEGEND</div>
        {[
          { color: "#00e5ff", label: "Active Station" },
          { color: "#ff6b6b", label: "Inactive Station" },
          { color: "#ffd700", label: "Pending Site" },
          { color: "#00e676", label: "Approved Site" },
          { color: "#ff5252", label: "Rejected Site" },
          { color: "#ff9800", label: "Selected (Tool)" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, color: "#80deea" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", boxShadow: `0 0 4px ${color}` }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;