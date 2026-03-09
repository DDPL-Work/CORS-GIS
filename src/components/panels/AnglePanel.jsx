
// AnglePanel.jsx

import { useApp } from '../../context/AppContext';
import { calculateDistance, calculateBearing, calculateAngle } from '../../utils/geoUtils';
import { 
  calculateTriangleArea, 
  getTriangleType,
  calculateStrengthOfFigure
} from '../../utils/triangleUtils';
const AnglePanel = () => {
  const { state, dispatch } = useApp();
  const { toolPoints } = state;
  const hasTriangle = toolPoints.length === 3;
  if (toolPoints.length < 2) return null;

  const [A, B, C] = toolPoints;
  if (!A || !B) return null;
  const angleA = hasTriangle ? calculateAngle(B, A, C) : null;
  const angleB = hasTriangle ? calculateAngle(A, B, C) : null;
  const angleC = hasTriangle ? calculateAngle(A, C, B) : null;
  const area = hasTriangle ? calculateTriangleArea(A, B, C) : 0;
  const triangleType = hasTriangle ? getTriangleType(A, B, C) : "";
const sof = hasTriangle ? calculateStrengthOfFigure(angleA, angleB, angleC) : 0;
  const sides = hasTriangle ? [
    { label: "AB", from: A, to: B },
    { label: "BC", from: B, to: C },
    { label: "CA", from: C, to: A },
  ] : [];

  return (
    <div style={{ position: "absolute", bottom: 20, right: 20, background: "rgba(13,27,42,0.97)", border: "1px solid #e040fb44", borderRadius: 8, padding: "12px 16px", minWidth: 360, zIndex: 900, fontFamily: "monospace" }}>
      <div style={{ color: "#e040fb", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>📐 TRIANGLE ANALYSIS</div>

      <div style={{ marginBottom: 10, fontSize: 11 }}>
        <div style={{ color: "#80deea", marginBottom: 5, fontSize: 10, letterSpacing: 1 }}>VERTICES</div>
        {toolPoints.filter(Boolean).map((pt, i) => {
          const colors = ["#ff9800", "#e040fb", "#00e5ff"];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: colors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#000", flexShrink: 0 }}>{i + 1}</div>
              <span style={{ color: "#e0f7fa", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pt.name || pt.label}</span>
              <span style={{ color: "#4dd0e1", fontSize: 9, marginLeft: "auto" }}>{
                typeof pt.lat === "number" && typeof pt.lng === "number"
                  ? `${pt.lat.toFixed(4)}, ${pt.lng.toFixed(4)}`
                  : "N/A"
              }</span>
            </div>
          );
        })}
      </div>

      {hasTriangle ? (
        <>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "#80deea", marginBottom: 5, fontSize: 10, letterSpacing: 1 }}>SIDES (km · bearing)</div>
            {sides.map(({ label, from, to }) => {
              const dist = calculateDistance(from.lat, from.lng, to.lat, to.lng);
              const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng);
              return (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #ffffff08", fontSize: 11 }}>
                  <span style={{ color: "#ce93d8", fontWeight: 700 }}>{label}</span>
                  <span style={{ color: "#e040fb", fontWeight: 700 }}>{dist.toFixed(4)} km</span>
                  <span style={{ color: "#ffd700" }}>↗ {bearing.toFixed(1)}°</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "#80deea", marginBottom: 5, fontSize: 10, letterSpacing: 1 }}>INTERIOR ANGLES</div>
            {[["∠A (pt 1)", angleA], ["∠B (pt 2)", angleB], ["∠C (pt 3)", angleC]].map(([label, angle]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, borderBottom: "1px solid #ffffff08" }}>
                <span style={{ color: "#ce93d8" }}>{label}</span>
                <span style={{ color: "#ffd700", fontWeight: 700 }}>{angle.toFixed(4)}°</span>
              </div>
            ))}
          </div>

          <div style={{ padding: 10, background: "#e040fb11", borderRadius: 6, border: "1px solid #e040fb33", fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#80deea" }}>Type</span>
              <span style={{ color: "#e040fb", fontWeight: 700 }}>{triangleType}</span>
            </div>
            {/* <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#80deea" }}>Area</span>
              <span style={{ color: "#ff9800", fontWeight: 700 }}>{area.toFixed(4)} km²</span>
            </div> */}


<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
  <span style={{ color: "#80deea" }}>Strength of Figure</span>
  <span style={{ color: "#00e5ff", fontWeight: 700 }}>
    {sof.toFixed(4)}
  </span>
</div>


            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#80deea" }}>∑ Angles</span>
              <span style={{ color: "#00e676", fontWeight: 700 }}>{(angleA + angleB + angleC).toFixed(2)}°</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: "#e040fb88", fontSize: 11, textAlign: "center", padding: "10px 0" }}>
          Select {3 - toolPoints.length} more point{3 - toolPoints.length > 1 ? "s" : ""} to complete triangle
        </div>
      )}

      <button onClick={() => dispatch({ type: "CLEAR_TOOL_POINTS" })} style={{ marginTop: 10, background: "#ff444433", color: "#ff6b6b", border: "1px solid #ff444444", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>Clear</button>
    </div>
  );
};

export default AnglePanel;