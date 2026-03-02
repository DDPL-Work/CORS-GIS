import { useApp } from '../../context/AppContext';

const StatusBar = () => {
  const { state } = useApp();
  const pending = state.locations.filter(l => l.status === "pending").length;
  const active = state.stations.filter(s => s.status === "active").length;
  const toolHints = {
    distance: "Click stations/sites on map to measure distances",
    angle: `Click stations/sites to build triangle (${state.toolPoints.length}/3 selected)`,
    view: "Viewing stations",
  };
  return (
    <div style={{ height: 28, background: "#050c19", borderTop: "1px solid #00e5ff22", display: "flex", alignItems: "center", padding: "0 16px", gap: 20, flexShrink: 0 }}>
      <span style={{ color: "#1e5f74", fontSize: 10, fontFamily: "monospace" }}>ReKHAnS v1.1 · Survey of India</span>
      <span style={{ color: "#00e5ff33", fontSize: 10 }}>|</span>
      <span style={{ color: "#00e676", fontSize: 10, fontFamily: "monospace" }}>● {active} Active Stations</span>
      <span style={{ color: "#ffd700", fontSize: 10, fontFamily: "monospace" }}>● {pending} Pending Reviews</span>
      {state.mapTool && <span style={{ color: "#ff9800", fontSize: 10, fontFamily: "monospace" }}>⚡ {state.mapTool.toUpperCase()} TOOL — {toolHints[state.mapTool]}</span>}
      {state.toolPoints.length > 0 && <span style={{ color: "#ce93d8", fontSize: 10, fontFamily: "monospace" }}>{state.toolPoints.length} point(s) selected</span>}
      <span style={{ marginLeft: "auto", color: "#1e5f74", fontSize: 10, fontFamily: "monospace" }}>{new Date().toUTCString().slice(0, 25)} UTC</span>
    </div>
  );
};

export default StatusBar;