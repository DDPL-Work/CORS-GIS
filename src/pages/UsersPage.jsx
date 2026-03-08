import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  getAllUsers,
  getPendingSupervisors,
  getPendingSurveyors,
  approveSupervisor,
  approveSurveyor
} from "../api/userApi";
const API = "https://survey.drdesigntech.com/api";

const roleColors = {
  ADMIN: "#ff6b6b",
  DIRECTOR: "#ffd700",
  SUPERVISOR: "#00e5ff",
  SURVEYOR: "#00e676",
  GNRB: "#ce93d8",
};

const UsersPage = () => {
  const { state } = useApp();

  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);

  const token = state.auth.token;
  const role = state.auth.role;

  /* ---------------- FETCH USERS ---------------- */

  const loadUsers = async () => {
  try {
    const data = await getAllUsers(token);
    setUsers(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    setUsers([]);
  }
};

  /* ---------------- FETCH PENDING ---------------- */

const loadPending = async () => {
  try {

    let data = [];

    if (role === "DIRECTOR") {
      data = await getPendingSupervisors(token);
    }

    if (role === "SUPERVISOR") {
      data = await getPendingSurveyors(token);
    }

    setPending(Array.isArray(data) ? data : []);

  } catch (err) {
    console.error(err);
    setPending([]);
  }
};

  useEffect(() => {
    loadUsers();
    loadPending();
  }, []);

  /* ---------------- APPROVE USER ---------------- */

const approveUser = async (id) => {

  try {

    if (role === "DIRECTOR") {
      await approveSupervisor(token, id);
    }

    if (role === "SUPERVISOR") {
      await approveSurveyor(token, id);
    }

    loadPending();
    loadUsers();

  } catch (err) {
    console.error(err);
  }
};

  return (
    <div style={container}>
      <div style={title}>👥 User Management</div>

      {/* ---------------- PENDING APPROVALS ---------------- */}

      {pending.length > 0 && (
        <>
          <div style={sectionTitle}>⏳ Pending Approvals</div>

          <table style={table}>
            <thead>
              <tr>
                {["Name", "Username", "Email", "Action"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pending.map((u) => (
                <tr key={u.id}>
                  <td style={cell}>{u.name}</td>
                  <td style={cell}>{u.username}</td>
                  <td style={cell}>{u.email}</td>

                  <td style={cell}>
                    <button
                      style={approveBtn}
                      onClick={() => approveUser(u.id)}
                    >
                      ✓ Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ---------------- ALL USERS ---------------- */}

      <div style={sectionTitle}>📋 All Users</div>

      <table style={table}>
        <thead>
          <tr>
            {["Name", "Username", "Email", "Role", "Zone", "Created"].map(
              (h) => (
                <th key={h} style={th}>{h}</th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={cell}>{u.name}</td>
              <td style={cell}>{u.username}</td>
              <td style={cell}>{u.email}</td>

              <td style={cell}>
                <span
                  style={{
                    background: `${roleColors[u.role]}22`,
                    color: roleColors[u.role],
                    padding: "3px 10px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {u.role}
                </span>
              </td>

              <td style={cell}>{u.zone}</td>

              <td style={cell}>
                {new Date(u.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const container = {
  flex: 1,
  overflowY: "auto",
  padding: 28,
  background: "#0a1628",
  fontFamily: "monospace",
};

const title = {
  color: "#00e5ff",
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 20,
};

const sectionTitle = {
  color: "#ffd54f",
  marginTop: 30,
  marginBottom: 10,
  fontSize: 14,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const th = {
  textAlign: "left",
  padding: "8px 12px",
  color: "#4dd0e1",
};

const cell = {
  padding: "10px 12px",
  color: "#e0f7fa",
};

const approveBtn = {
  background: "#00e67622",
  border: "1px solid #00e676",
  color: "#00e676",
  padding: "4px 10px",
  borderRadius: 4,
  cursor: "pointer",
};

export default UsersPage;