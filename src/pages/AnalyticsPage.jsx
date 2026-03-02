import { useApp } from '../context/AppContext';

const AnalyticsPage = () => {
  const { state } = useApp();
  const stats = {
    totalStations: state.stations.length,
    activeStations: state.stations.filter(s => s.status === "active").length,
    totalSites: state.locations.length,
    pending: state.locations.filter(l => l.status === "pending").length,
    approved: state.locations.filter(l => l.status === "approved").length,
    rejected: state.locations.filter(l => l.status === "rejected").length,
    avgAccuracy: (state.locations.reduce((s, l) => s + l.accuracy, 0) / state.locations.length).toFixed(1),
    surveyors: state.users.filter(u => u.role === "SURVEYOR").length,
  };
  const cards = [
    { label: "CORS Stations", value: stats.totalStations, sub: `${stats.activeStations} active`, color: "#00e5ff" },
    { label: "Total Subsites", value: stats.totalSites, sub: `${stats.pending} pending review`, color: "#ff9800" },
    { label: "Approved Sites", value: stats.approved, sub: `${((stats.approved / stats.totalSites) * 100).toFixed(0)}% acceptance`, color: "#00e676" },
    { label: "Rejected Sites", value: stats.rejected, sub: `${((stats.rejected / stats.totalSites) * 100).toFixed(0)}% rejection`, color: "#ff5252" },
    { label: "Avg Accuracy", value: `${stats.avgAccuracy}%`, sub: "across all sites", color: "#ce93d8" },
    { label: "Surveyors", value: stats.surveyors, sub: "field personnel", color: "#ffd700" },
  ];
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 28, background: "#0a1628", fontFamily: "monospace" }}>
      <div style={{ color: "#00e5ff", fontSize: 20, fontWeight: 900, marginBottom: 24 }}>📊 System Analytics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: "#080f1a", border: `1px solid ${card.color}33`, borderRadius: 10, padding: 20 }}>
            <div style={{ color: card.color, fontSize: 28, fontWeight: 900, marginBottom: 4 }}>{card.value}</div>
            <div style={{ color: "#e0f7fa", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{card.label}</div>
            <div style={{ color: "#4dd0e1", fontSize: 11 }}>{card.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#080f1a", border: "1px solid #00e5ff22", borderRadius: 10, padding: 20 }}>
        <div style={{ color: "#00e5ff", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Site Status Distribution</div>
        {[
          { label: "Pending", val: stats.pending, color: "#ffd700" },
          { label: "Approved", val: stats.approved, color: "#00e676" },
          { label: "Rejected", val: stats.rejected, color: "#ff5252" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#80deea" }}>
              <span>{label}</span><span style={{ color }}>{val} / {stats.totalSites}</span>
            </div>
            <div style={{ background: "#ffffff11", borderRadius: 4, height: 8 }}>
              <div style={{ background: color, borderRadius: 4, height: "100%", width: `${(val / stats.totalSites) * 100}%`, boxShadow: `0 0 6px ${color}`, transition: "width 0.5s" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsPage;