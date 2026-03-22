import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { NAV_CONFIG } from "../../config/roleConfig";
import { reloadHierarchySites } from "../../utils/hierarchyHelpers";
import { getStatusDotColorForRole } from "../../utils/workflowStatus";

const navLabelMap = {
  map: "Map View",
  approvals: "Approvals",
  users: "Users",
  admin: "Admin Panel",
};

const getSubordinateName = (role, site) => {
  if (role === "SUPERVISOR") {
    return site.surveyor_name || site.surveyor_username || "Unknown Surveyor";
  }

  if (role === "DIRECTOR") {
    return site.supervisor_name || site.surveyor_name || "Unknown Supervisor";
  }

  if (role === "ZONAL_CHIEF") {
    return site.director_name || site.supervisor_name || "Unknown Director";
  }

  if (role === "GNRB") {
    return site.zonal_chief_name || site.director_name || "Unknown Zonal Chief";
  }

  return site.surveyor_name || "Unknown";
};

const sectionTitleStyle = {
  color: "#4dd0e1",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 2,
  marginBottom: 10,
  fontFamily: "monospace",
};

const Sidebar = ({ isOpen }) => {
  const { state, dispatch } = useApp();
  const [expandedSubordinates, setExpandedSubordinates] = useState({});
  const role = state.auth.role;
  const allowedNavIds = ["map", "approvals", "users", "admin"];

  const visibleNavItems = NAV_CONFIG.filter((item) => {
    if (item.roles === "ALL") return allowedNavIds.includes(item.id);
    return allowedNavIds.includes(item.id) && item.roles.includes(role);
  });

  const subordinateLabel =
    role === "SUPERVISOR"
      ? "SURVEYORS"
      : role === "DIRECTOR"
      ? "SUPERVISORS"
      : role === "ZONAL_CHIEF"
      ? "DIRECTORS"
      : role === "GNRB"
      ? "ZONAL CHIEFS"
      : "SUBORDINATES";

  const toggleStation = (id) => dispatch({ type: "TOGGLE_STATION", payload: id });
  const toggleSubordinate = (id) =>
    setExpandedSubordinates((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const loadHierarchy = async () => {
      if (!state.auth.token) return;
      if (!["SUPERVISOR", "DIRECTOR", "ZONAL_CHIEF", "GNRB"].includes(state.auth.role)) {
        dispatch({ type: "SET_HIERARCHY_SITES", payload: [] });
        return;
      }

      try {
        await reloadHierarchySites(dispatch, state.auth.token, state.auth.role);
      } catch (err) {
        console.error("Hierarchy fetch failed:", err);
      }
    };

    loadHierarchy();
  }, [state.auth.token, state.auth.role, dispatch]);

  return (
    <div
      style={{
        width: isOpen ? 300 : 0,
        background: "#080f1a",
        borderRight: isOpen ? "1px solid #00e5ff22" : "1px solid transparent",
        overflow: "hidden",
        flexShrink: 0,
        transition: "width 0.25s ease, border-color 0.25s ease",
      }}
    >
      <div
        style={{
          width: 300,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
      >
        <div style={{ padding: "14px", borderBottom: "1px solid #00e5ff22" }}>
          <div style={sectionTitleStyle}>NAVIGATION</div>
          {visibleNavItems.map((item) => {
            const active = state.activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: "SET_ACTIVE_VIEW", payload: item.id })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginBottom: 8,
                  borderRadius: 8,
                  background: active ? "#00e5ff1a" : "#0d1b2a",
                  border: active ? "1px solid #00e5ff66" : "1px solid #00e5ff1f",
                  color: active ? "#00e5ff" : "#b8ecf2",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "monospace",
                  textAlign: "left",
                }}
              >
                {navLabelMap[item.id] || item.label}
              </button>
            );
          })}
        </div>

        {["SUPERVISOR", "DIRECTOR", "ZONAL_CHIEF", "GNRB"].includes(role) &&
          Array.isArray(state.hierarchySites) &&
          state.hierarchySites.length > 0 && (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              <div style={sectionTitleStyle}>{subordinateLabel}</div>

              {Object.entries(
                state.hierarchySites.reduce((acc, site) => {
                  const key = getSubordinateName(role, site);
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(site);
                  return acc;
                }, {})
              ).map(([surveyorName, sites]) => {
                const isExpanded = expandedSubordinates[surveyorName];
                const totalStations = sites.length;

                return (
                  <div key={surveyorName} style={{ marginBottom: 6 }}>
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
                        textAlign: "left",
                      }}
                    >
                      <span style={{ color: "#00e5ff" }}>{isExpanded ? "v" : ">"}</span>
                      <span>{surveyorName}</span>
                      <span
                        style={{
                          marginLeft: "auto",
                          background: "#00e5ff22",
                          color: "#4dd0e1",
                          borderRadius: 3,
                          padding: "1px 5px",
                          fontSize: 9,
                        }}
                      >
                        {totalStations}
                      </span>
                    </button>

                    {isExpanded && (
                      <div style={{ marginLeft: 14, marginTop: 4 }}>
                        {sites.map((site) => {
                          const stationSelected = state.selectedStations.includes(site.id);
                          const subsites = site.subsites || [];
                          const siteName = site.site_name || site.station || "-";

                          return (
                            <div key={site.id} style={{ marginBottom: 4 }}>
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "5px 8px",
                                  cursor: "pointer",
                                  borderRadius: 4,
                                  fontSize: 11,
                                  color: stationSelected ? "#00e5ff" : "#80deea",
                                  fontFamily: "monospace",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={stationSelected}
                                  onChange={() => toggleStation(site.id)}
                                  style={{ accentColor: "#00e5ff" }}
                                />

                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: getStatusDotColorForRole(site.status, role),
                                    flexShrink: 0,
                                  }}
                                />

                                <span style={{ fontWeight: 600 }}>{siteName}</span>

                                <span
                                  style={{
                                    marginLeft: "auto",
                                    background: "#00e5ff22",
                                    color: "#4dd0e1",
                                    borderRadius: 3,
                                    padding: "1px 5px",
                                    fontSize: 9,
                                  }}
                                >
                                  {subsites.length}
                                </span>
                              </label>

                              {stationSelected && (
                                <div style={{ marginLeft: 18 }}>
                                  {subsites.map((sub) => {
                                    const locationSelected = state.selectedStations.includes(sub.id);

                                    return (
                                      <label
                                        key={sub.id}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                          padding: "4px 6px",
                                          cursor: "pointer",
                                          fontSize: 10,
                                          color: locationSelected ? "#00e5ff" : "#90caf9",
                                          fontFamily: "monospace",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={locationSelected}
                                          onChange={() => toggleStation(sub.id)}
                                          style={{ accentColor: "#7c4dff" }}
                                        />

                                        <span
                                          style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: "50%",
                                            background: getStatusDotColorForRole(sub.status, role),
                                          }}
                                        />

                                        {sub.location}
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
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
};

export default Sidebar;
