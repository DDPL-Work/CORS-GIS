import { useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ROLE_META } from "../../config/roleConfig";
import {
  fetchAllStations,
  fetchDistricts,
  fetchStates,
  fetchStationsByDistrict,
} from "../../api/stationsApi";
import soiLogo from "../../assets/EMBLEM_27_200DPI.webp";

const TOOL_BUTTONS = [
  { id: "distance", label: "Distance Tool", hint: "Measure between selected points" },
  { id: "angle", label: "Angle Tool", hint: "Build a 3-point triangle" },
  { id: "viewStations", label: "View Stations", hint: "Browse established CORS stations" },
  { id: "compare", label: "Compare Locations", hint: "Select locations for comparison" },
  { id: "view", label: "Normal View", hint: "Return to default map mode" },
];

const toolbarButtonStyle = (active) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  minWidth: 150,
  padding: "8px 12px",
  borderRadius: 10,
  background: active ? "#00e5ff1c" : "#0d1b2a",
  border: active ? "1px solid #00e5ff66" : "1px solid #00e5ff1f",
  color: active ? "#00e5ff" : "#b8ecf2",
  fontFamily: "monospace",
  textAlign: "left",
  transition: "all 0.2s ease",
});

const filterControlStyle = {
  minWidth: 170,
  background: "#0d1b2a",
  border: "1px solid #00e5ff33",
  color: "#e0f7fa",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
  fontFamily: "monospace",
};

const Header = ({ sidebarOpen, onToggleSidebar }) => {
  const { state, dispatch } = useApp();
  const { user, role, zone } = state.auth;

  const roleData = ROLE_META[role] || {};
  const roleColor = roleData.color || "#00e5ff";
  const isMapView = state.activeView === "map";

  useEffect(() => {
    if (!state.viewStationsMode) return;

    const loadInitialStations = async () => {
      try {
        dispatch({ type: "SET_LOADING_STATIONS", payload: true });

        const states = await fetchStates();
        dispatch({ type: "SET_ESTABLISHED_STATES", payload: states });

        const stations = await fetchAllStations();
        dispatch({
          type: "SET_ESTABLISHED_STATIONS",
          payload: Array.isArray(stations) ? stations : [],
        });

        dispatch({ type: "SET_SELECTED_STATE", payload: "ALL_INDIA" });
      } catch (err) {
        console.error("Initial station load failed:", err);
      } finally {
        dispatch({ type: "SET_LOADING_STATIONS", payload: false });
      }
    };

    loadInitialStations();
  }, [state.viewStationsMode, dispatch]);

  const clearCompareData = () => {
    if (state.comparedLocations.length > 0) {
      dispatch({ type: "CLEAR_COMPARE" });
    }
  };

  const handleToolSelect = (toolId) => {
    if (toolId === "viewStations") {
      clearCompareData();
      dispatch({
        type: "SET_VIEW_STATIONS_MODE",
        payload: !state.viewStationsMode,
      });
      return;
    }

    if (toolId === "compare") {
      if (state.viewStationsMode) {
        dispatch({ type: "SET_VIEW_STATIONS_MODE", payload: false });
      }

      const willEnableCompare = state.mapTool !== "compare";
      if (!willEnableCompare) {
        clearCompareData();
      }

      dispatch({ type: "SET_COMPARE_MODE", payload: willEnableCompare });
      return;
    }

    if (toolId === "view") {
      if (state.viewStationsMode) {
        dispatch({ type: "SET_VIEW_STATIONS_MODE", payload: false });
      }

      if (state.mapTool === "compare") {
        dispatch({ type: "SET_COMPARE_MODE", payload: false });
      } else {
        dispatch({ type: "SET_TOOL", payload: null });
      }

      clearCompareData();
      return;
    }

    if (state.viewStationsMode) {
      dispatch({ type: "SET_VIEW_STATIONS_MODE", payload: false });
    }

    if (state.mapTool === "compare") {
      dispatch({ type: "SET_COMPARE_MODE", payload: false });
      clearCompareData();
    }

    dispatch({
      type: "SET_TOOL",
      payload: state.mapTool === toolId ? null : toolId,
    });
  };

  const isToolActive = (toolId) => {
    if (toolId === "viewStations") return state.viewStationsMode;
    if (toolId === "compare") return state.mapTool === "compare";
    if (toolId === "view") {
      return !state.viewStationsMode && (state.mapTool === null || state.mapTool === "view");
    }
    return state.mapTool === toolId;
  };

  const handleShowAllStations = async () => {
    if (state.selectedStateId === "ALL_INDIA") {
      dispatch({ type: "SET_SELECTED_STATE", payload: null });
      dispatch({ type: "SET_ESTABLISHED_STATIONS", payload: [] });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING_STATIONS", payload: true });

      if (!Array.isArray(state.establishedStations) || state.establishedStations.length === 0) {
        const stations = await fetchAllStations();
        dispatch({
          type: "SET_ESTABLISHED_STATIONS",
          payload: Array.isArray(stations) ? stations : [],
        });
      }

      dispatch({ type: "SET_SELECTED_STATE", payload: "ALL_INDIA" });
      dispatch({ type: "SET_SELECTED_DISTRICT", payload: null });
    } catch (err) {
      console.error("Fetch all stations error:", err);
    } finally {
      dispatch({ type: "SET_LOADING_STATIONS", payload: false });
    }
  };

  const handleStateChange = async (event) => {
    const stateId = event.target.value || null;
    dispatch({ type: "SET_SELECTED_STATE", payload: stateId });

    if (!stateId) {
      dispatch({ type: "SET_ESTABLISHED_STATIONS", payload: [] });
      return;
    }

    if (stateId === "ALL_INDIA") {
      await handleShowAllStations();
      return;
    }

    try {
      dispatch({ type: "SET_LOADING_STATIONS", payload: true });
      const districts = await fetchDistricts(stateId);
      dispatch({ type: "SET_ESTABLISHED_DISTRICTS", payload: districts });
      dispatch({ type: "SET_ESTABLISHED_STATIONS", payload: [] });
    } catch (err) {
      console.error("District load failed:", err);
    } finally {
      dispatch({ type: "SET_LOADING_STATIONS", payload: false });
    }
  };

  const handleDistrictChange = async (event) => {
    const districtId = event.target.value || null;
    dispatch({ type: "SET_SELECTED_DISTRICT", payload: districtId });

    if (!districtId) {
      dispatch({ type: "SET_ESTABLISHED_STATIONS", payload: [] });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING_STATIONS", payload: true });
      const stations = await fetchStationsByDistrict(districtId);
      dispatch({ type: "SET_ESTABLISHED_STATIONS", payload: stations });
    } catch (err) {
      console.error("Station load failed:", err);
    } finally {
      dispatch({ type: "SET_LOADING_STATIONS", payload: false });
    }
  };

  return (
    <div
      style={{
        background: "transparent",
        borderBottom: "1px solid #00e5ff33",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        zIndex: 100,
        minHeight: 72,
        padding: "0 20px",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 250, flexShrink: 0 }}>
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: sidebarOpen ? "#00e5ff1c" : "#0d1b2a",
            border: "1px solid #00e5ff33",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: 0,
          }}
        >
          {[0, 1, 2].map((bar) => (
            <span
              key={bar}
              style={{
                width: 18,
                height: 2,
                background: sidebarOpen ? "#00e5ff" : "#80deea",
                borderRadius: 999,
              }}
            />
          ))}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={soiLogo} alt="ReKHAnS Logo" style={{ width: 32, height: 32 }} />
          <div>
            <div
              style={{
                color: "#00e5ff",
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 2,
                fontFamily: "monospace",
              }}
            >
              ReKHAnS
            </div>
            <div
              style={{
                color: "#4dd0e1",
                fontSize: 8,
                letterSpacing: 1,
                fontFamily: "monospace",
              }}
            >
              SURVEY OF INDIA - CORS MONITORING
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflowX: "auto",
          padding: "10px 0",
          scrollbarWidth: "thin",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            color: "#80deea",
            fontSize: 11,
            fontFamily: "monospace",
            paddingRight: 4,
          }}
        >
          {isMapView ? "MAP WORKSPACE" : `${state.activeView?.toUpperCase()} WORKSPACE`}
        </div>

        {isMapView && (
          <>
          {TOOL_BUTTONS.map((tool) => {
            const active = isToolActive(tool.id);

            return (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                style={toolbarButtonStyle(active)}
              >
                <span style={{ fontSize: 12, fontWeight: 700 }}>{tool.label}</span>
                <span style={{ fontSize: 10, color: active ? "#9bf4ff" : "#4dd0e1" }}>
                  {tool.hint}
                </span>
              </button>
            );
          })}

          {state.viewStationsMode && (
            <>
              <button
                onClick={handleShowAllStations}
                style={{
                  ...filterControlStyle,
                  minWidth: 190,
                  background: state.selectedStateId === "ALL_INDIA" ? "#00e5ff" : "#00e5ff18",
                  color: state.selectedStateId === "ALL_INDIA" ? "#02111f" : "#00e5ff",
                  border: "1px solid #00e5ff66",
                  fontWeight: 700,
                }}
              >
                Show All Stations
              </button>

              <select
                value={state.selectedStateId || ""}
                onChange={handleStateChange}
                style={filterControlStyle}
              >
                <option value="">Select State</option>
                <option value="ALL_INDIA">All India</option>
                {Array.isArray(state.establishedStates) &&
                  state.establishedStates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>

              <select
                value={state.selectedDistrictId || ""}
                onChange={handleDistrictChange}
                disabled={!state.selectedStateId || state.selectedStateId === "ALL_INDIA"}
                style={{
                  ...filterControlStyle,
                  opacity:
                    !state.selectedStateId || state.selectedStateId === "ALL_INDIA" ? 0.55 : 1,
                }}
              >
                <option value="">Select District</option>
                {Array.isArray(state.establishedDistricts) &&
                  state.establishedDistricts.map((district) => (
                    <option key={district.district_id} value={district.district_id}>
                      {district.district_name}
                    </option>
                  ))}
              </select>
            </>
          )}

          {state.loadingStations && (
            <span
              style={{
                color: "#4dd0e1",
                fontSize: 11,
                fontFamily: "monospace",
                flexShrink: 0,
              }}
            >
              Loading station data...
            </span>
          )}
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `${roleColor}22`,
              border: `1px solid ${roleColor}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: roleColor,
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "monospace",
            }}
          >
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>

          <div>
            <div style={{ color: "#e0f7fa", fontSize: 12, fontFamily: "monospace" }}>
              {user?.username}
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <span
                style={{
                  background: `${roleColor}22`,
                  color: roleColor,
                  fontSize: 9,
                  fontFamily: "monospace",
                  padding: "1px 6px",
                  borderRadius: 3,
                  border: `1px solid ${roleColor}44`,
                }}
              >
                {role}
              </span>

              {zone && (
                <span
                  style={{
                    background: "#ffffff11",
                    color: "#80deea",
                    fontSize: 9,
                    fontFamily: "monospace",
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                >
                  {zone}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => dispatch({ type: "LOGOUT" })}
          style={{
            background: "#ff444422",
            border: "1px solid #ff444444",
            color: "#ff6b6b",
            borderRadius: 6,
            padding: "5px 12px",
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "monospace",
          }}
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default Header;
