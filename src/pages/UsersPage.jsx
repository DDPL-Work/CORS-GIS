import { useApp } from '../context/AppContext';

const UsersPage = () => {
  const { state } = useApp();
  const roleColors = { ADMIN: "#ff6b6b", DIRECTOR: "#ffd700", SUPERVISOR: "#00e5ff", SURVEYOR: "#00e676", GNRB: "#ce93d8" };
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 28, background: "#0a1628", fontFamily: "monospace" }}>
      <div style={{ color: "#00e5ff", fontSize: 20, fontWeight: 900, marginBottom: 20 }}>👥 User Management</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #00e5ff33" }}>
            {["Name", "Username", "Email", "Role", "Zone"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#4dd0e1", fontSize: 10, letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.users.map(u => (
            <tr key={u.id} style={{ borderBottom: "1px solid #ffffff08" }}>
              <td style={{ padding: "10px 12px", color: "#e0f7fa" }}>{u.name}</td>
              <td style={{ padding: "10px 12px", color: "#80deea" }}>{u.username}</td>
              <td style={{ padding: "10px 12px", color: "#80deea" }}>{u.email}</td>
              <td style={{ padding: "10px 12px" }}><span style={{ background: `${roleColors[u.role]}22`, color: roleColors[u.role], padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, border: `1px solid ${roleColors[u.role]}44` }}>{u.role}</span></td>
              <td style={{ padding: "10px 12px", color: "#4dd0e1" }}>{u.zone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;