import { useApp } from '../../context/AppContext';

const SelectionGuide = () => {
  const { state, dispatch } = useApp();
  const pts = state.toolPoints;
  const maxPts = state.mapTool === "angle" ? 3 : null;
  const colors = ["#ff9800", "#e040fb", "#00e5ff"];
  const toolColor = state.mapTool === "angle" ? "#e040fb" : "#ff9800";

  return (
    <div style={{
      position: "absolute",
      top: 14,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 900,
      background: "rgba(13,27,42,0.96)",
      border: `1px solid ${toolColor}66`,
      borderRadius: 10,
      padding: "8px 16px",
      fontFamily: "monospace",
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: `0 4px 20px ${toolColor}33`,
      pointerEvents: "none",
      maxWidth: 600,
    }}>
      <span style={{ fontSize: 14 }}>{state.mapTool === "angle" ? "📐" : "📏"}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {[0, 1, 2].slice(0, maxPts || 99).map(i => {
          if (!maxPts && i > pts.length) return null;
          const pt = pts[i];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: pt ? colors[i] : `${colors[i]}33`,
                border: `2px solid ${colors[i]}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 900, color: pt ? "#000" : colors[i],
              }}>
                {i + 1}
              </div>
              <span style={{
                color: pt ? "#e0f7fa" : `${colors[i]}66`,
                fontSize: 10,
                maxWidth: 100,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {pt ? (pt.name || pt.label) : (state.mapTool === "angle" ? `Select point ${i + 1}` : "Click map")}
              </span>
              {i < (maxPts || pts.length) - 1 && pt && (
                <span style={{ color: `${toolColor}66`, fontSize: 12 }}>→</span>
              )}
            </div>
          );
        })}
      </div>
      {pts.length > 0 && (
        <div
          style={{ pointerEvents: "all", cursor: "pointer", color: "#ff6b6b", fontSize: 10, border: "1px solid #ff444444", borderRadius: 4, padding: "2px 8px", marginLeft: 4, background: "#ff444411" }}
          onClick={() => dispatch({ type: "CLEAR_TOOL_POINTS" })}
        >
          ✕ Clear
        </div>
      )}
    </div>
  );
};

export default SelectionGuide;