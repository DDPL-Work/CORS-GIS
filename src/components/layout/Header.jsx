import { useApp } from "../../context/AppContext";
import { ROLE_META, NAV_CONFIG } from "../../config/roleConfig";
import soiLogo from "../../assets/EMBLEM_27_200DPI.webp";

const Header = () => {
  const { state, dispatch } = useApp();
  const { user, role, zone } = state.auth;

  const roleData = ROLE_META[role] || {};
  const roleColor = roleData.color || "#00e5ff";

  const visibleNavItems = NAV_CONFIG.filter((item) => {
    if (item.roles === "ALL") return true;
    return item.roles.includes(role);
  });

  return (
    <div style={{
      height: 56,
      background: "#080f1a",
      borderBottom: "1px solid #00e5ff33",
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      gap: 20,
      flexShrink: 0,
      zIndex: 100
    }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
        <img src={soiLogo} alt="ReKHAnS Logo" style={{ width: 32, height: 32 }} />
        <div>
          <div style={{ color: "#00e5ff", fontWeight: 900, fontSize: 14, letterSpacing: 2, fontFamily: "monospace" }}>
            ReKHAnS
          </div>
          <div style={{ color: "#4dd0e1", fontSize: 8, letterSpacing: 1, fontFamily: "monospace" }}>
            SURVEY OF INDIA – CORS MONITORING
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, display: "flex", gap: 6 }}>
        {visibleNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch({ type: "SET_ACTIVE_VIEW", payload: item.id })}
            style={{
              padding: "5px 14px",
              borderRadius: 6,
              background: state.activeView === item.id ? "#00e5ff22" : "transparent",
              border: state.activeView === item.id ? "1px solid #00e5ff" : "1px solid transparent",
              color: state.activeView === item.id ? "#00e5ff" : "#80deea",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "monospace"
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* User Section */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
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
            fontFamily: "monospace"
          }}>
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>

          <div>
            <div style={{ color: "#e0f7fa", fontSize: 12, fontFamily: "monospace" }}>
              {user?.username}
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <span style={{
                background: `${roleColor}22`,
                color: roleColor,
                fontSize: 9,
                fontFamily: "monospace",
                padding: "1px 6px",
                borderRadius: 3,
                border: `1px solid ${roleColor}44`
              }}>
                {role}
              </span>

              {zone && (
                <span style={{
                  background: "#ffffff11",
                  color: "#80deea",
                  fontSize: 9,
                  fontFamily: "monospace",
                  padding: "1px 6px",
                  borderRadius: 3
                }}>
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
            fontFamily: "monospace"
          }}
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
};

export default Header;