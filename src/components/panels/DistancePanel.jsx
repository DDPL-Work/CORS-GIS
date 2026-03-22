import { useApp } from "../../context/AppContext";
import { calculateBearing } from "../../utils/geoUtils";
import DraggablePanel from "../layout/DraggablePanel";

const DistancePanel = () => {
  const { state, dispatch } = useApp();
  const { distances, toolPoints } = state;

  if (!distances.length && toolPoints.length < 2) return null;

  return (
    <DraggablePanel
      title="DISTANCE TOOL"
      handleColor="#ff9800"
      position="absolute"
      bounds="parent"
      initialAnchor="bottom-left"
      offsetX={20}
      offsetY={20}
      resizable
      style={{
        background: "rgba(13,27,42,0.97)",
        border: "1px solid #ff980044",
        borderRadius: 8,
        minWidth: 340,
        minHeight: 180,
        zIndex: 900,
        fontFamily: "monospace",
        overflow: "hidden",
      }}
      bodyStyle={{ padding: "12px 16px", overflowY: "auto" }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, color: "#e0f7fa" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ff980033" }}>
            <th style={{ textAlign: "left", padding: "3px 6px", color: "#ffcc80" }}>From</th>
            <th style={{ textAlign: "left", padding: "3px 6px", color: "#ffcc80" }}>To</th>
            <th style={{ textAlign: "right", padding: "3px 6px", color: "#ffcc80" }}>Dist (km)</th>
            <th style={{ textAlign: "right", padding: "3px 6px", color: "#ffcc80" }}>Bearing</th>
          </tr>
        </thead>
        <tbody>
          {distances.map((distance, index) => {
            if (!distance.a || !distance.b) return null;

            const bearing = calculateBearing(
              distance.a.lat,
              distance.a.lng,
              distance.b.lat,
              distance.b.lng
            );

            return (
              <tr key={index} style={{ borderBottom: "1px solid #ffffff11" }}>
                <td
                  style={{
                    padding: "4px 6px",
                    maxWidth: 100,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {distance.a.name || `${distance.a.lat.toFixed(4)}, ${distance.a.lng.toFixed(4)}`}
                </td>
                <td
                  style={{
                    padding: "4px 6px",
                    maxWidth: 100,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {distance.b.name || `${distance.b.lat.toFixed(4)}, ${distance.b.lng.toFixed(4)}`}
                </td>
                <td style={{ padding: "4px 6px", textAlign: "right", color: "#ff9800", fontWeight: 700 }}>
                  {distance.distance.toFixed(4)}
                </td>
                <td style={{ padding: "4px 6px", textAlign: "right", color: "#ffd700" }}>
                  {bearing.toFixed(1)} deg
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {toolPoints.length >= 2 && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: "#ffffff08",
            borderRadius: 4,
            fontSize: 11,
            color: "#80deea",
          }}
        >
          Total:{" "}
          <span style={{ color: "#ff9800", fontWeight: 700 }}>
            {distances.reduce((sum, distance) => sum + distance.distance, 0).toFixed(4)} km
          </span>
          <span style={{ marginLeft: 12 }}>{toolPoints.length} points selected</span>
        </div>
      )}

      <button
        onClick={() => dispatch({ type: "CLEAR_TOOL_POINTS" })}
        style={{
          marginTop: 8,
          background: "#ff444433",
          color: "#ff6b6b",
          border: "1px solid #ff444444",
          borderRadius: 4,
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 11,
        }}
      >
        Clear
      </button>
    </DraggablePanel>
  );
};

export default DistancePanel;
