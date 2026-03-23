import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  approveAdminUser,
  assignDirectorToSurveyor,
  changeAdminUserRole,
  getAdminDistricts,
  getAdminStations,
  getAdminSurveys,
  getAdminUsers,
} from "../api/adminApi";
import { getStatusStyleForRole, normalizeWorkflowStatus } from "../utils/workflowStatus";

const ROLE_OPTIONS = ["SURVEYOR", "SUPERVISOR", "DIRECTOR", "ZONAL_CHIEF", "GNRB", "ADMIN"];

const pickCollection = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeAdminUser = (item) => {
  const isApproved =
    typeof item?.is_approved === "boolean"
      ? item.is_approved
      : typeof item?.approved === "boolean"
      ? item.approved
      : Boolean(item?.approved);

  return { ...item, is_approved: isApproved };
};

const normalizeAdminSurvey = (item) => ({
  ...item,
  state: item?.state_name || item?.state,
  district: item?.district_name || item?.district,
  subdistrict: item?.subdistrict_name || item?.subdistrict,
  station: item?.station_name || item?.station,
  surveyor_name:
    item?.surveyor_name ||
    item?.created_by_name ||
    item?.assigned_to_name ||
    item?.username ||
    "-",
});

const AdminPanelPage = () => {
  const { state, dispatch } = useApp();
  const token = state.auth.token;
  const role = state.auth.role;

  const [tab, setTab] = useState("USERS");
  const [loading, setLoading] = useState({
    users: false,
    surveys: false,
    masters: false,
  });
  const [busyUserAction, setBusyUserAction] = useState({});

  const [users, setUsers] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [stations, setStations] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [surveySearch, setSurveySearch] = useState("");
  const [roleDraftByUser, setRoleDraftByUser] = useState({});
  const [directorDraftBySurveyor, setDirectorDraftBySurveyor] = useState({});

  const notify = (message, color = "#10b981") => {
    dispatch({
      type: "SET_NOTIFICATION",
      payload: { type: "toast", message, color },
    });
  };

  const markBusy = (userId, isBusy) => {
    setBusyUserAction((prev) => ({ ...prev, [userId]: isBusy }));
  };

  const loadUsers = async () => {
    if (!token) return;
    setLoading((prev) => ({ ...prev, users: true }));
    try {
      const data = await getAdminUsers(token);
      const rows = pickCollection(data, ["users", "data"]).map(normalizeAdminUser);
      setUsers(rows);
      setRoleDraftByUser(
        rows.reduce((acc, item) => {
          acc[item.id] = item.role;
          return acc;
        }, {})
      );
    } catch (err) {
      console.error("Admin users fetch failed:", err);
      notify(err.message || "Failed to load users", "#ef4444");
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };

  const loadSurveys = async () => {
    if (!token) return;
    setLoading((prev) => ({ ...prev, surveys: true }));
    try {
      const data = await getAdminSurveys(token);
      setSurveys(pickCollection(data, ["surveys", "sites", "data"]).map(normalizeAdminSurvey));
    } catch (err) {
      console.error("Admin surveys fetch failed:", err);
      notify(err.message || "Failed to load surveys", "#ef4444");
    } finally {
      setLoading((prev) => ({ ...prev, surveys: false }));
    }
  };

  const loadMasterData = async () => {
    if (!token) return;
    setLoading((prev) => ({ ...prev, masters: true }));
    try {
      const [districtsResult, stationsResult] = await Promise.all([
        getAdminDistricts(token),
        getAdminStations(token),
      ]);
      setDistricts(pickCollection(districtsResult, ["districts", "data"]));
      setStations(pickCollection(stationsResult, ["stations", "data"]));
    } catch (err) {
      console.error("Admin master data fetch failed:", err);
      notify(err.message || "Failed to load master data", "#ef4444");
    } finally {
      setLoading((prev) => ({ ...prev, masters: false }));
    }
  };

  const reloadAll = async () => {
    await Promise.allSettled([loadUsers(), loadSurveys(), loadMasterData()]);
  };

  useEffect(() => {
    if (!token || role !== "ADMIN") return;
    reloadAll();
  }, [token, role]);

  const directors = useMemo(
    () => users.filter((item) => item.role === "DIRECTOR" && item.is_approved),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((item) =>
      [item.name, item.username, item.email, item.role, item.zone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [users, userSearch]);

  const filteredSurveys = useMemo(() => {
    const term = surveySearch.trim().toLowerCase();
    if (!term) return surveys;
    return surveys.filter((item) =>
      [item.state, item.district, item.subdistrict, item.station, item.status, item.surveyor_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [surveys, surveySearch]);

  const handleUserApprovalAction = async (userId, action) => {
    const normalizedAction = action === "REJECT" ? "REJECT" : "APPROVE";
    markBusy(userId, true);
    try {
      await approveAdminUser(token, userId, normalizedAction);
      notify(
        normalizedAction === "REJECT" ? "User rejected successfully" : "User approved successfully",
        normalizedAction === "REJECT" ? "#f59e0b" : "#10b981"
      );
      await loadUsers();
    } catch (err) {
      console.error("Admin approve failed:", err);
      notify(
        err.message || (normalizedAction === "REJECT" ? "User rejection failed" : "User approval failed"),
        "#ef4444"
      );
    } finally {
      markBusy(userId, false);
    }
  };

  const handleRoleChange = async (userId) => {
    const nextRole = roleDraftByUser[userId];
    if (!nextRole) return;

    markBusy(userId, true);
    try {
      await changeAdminUserRole(token, userId, nextRole);
      notify("User role changed successfully");
      await loadUsers();
    } catch (err) {
      console.error("Admin role change failed:", err);
      notify(err.message || "Role change failed", "#ef4444");
    } finally {
      markBusy(userId, false);
    }
  };

  const handleDirectorAssign = async (userId) => {
    const directorId = directorDraftBySurveyor[userId];
    if (!directorId) {
      notify("Please select a director first", "#f59e0b");
      return;
    }

    markBusy(userId, true);
    try {
      await assignDirectorToSurveyor(token, userId, directorId);
      notify("Director assigned successfully");
      await loadUsers();
    } catch (err) {
      console.error("Director assign failed:", err);
      notify(err.message || "Director assignment failed", "#ef4444");
    } finally {
      markBusy(userId, false);
    }
  };

  if (role !== "ADMIN") {
    return (
      <div style={styles.container}>
        <div style={styles.title}>Admin Panel</div>
        <div style={styles.empty}>You do not have access to the admin panel.</div>
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    pendingUsers: users.filter((item) => !item.is_approved).length,
    directors: users.filter((item) => item.role === "DIRECTOR").length,
    totalSurveys: surveys.length,
    districts: districts.length,
    stations: stations.length,
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div style={styles.title}>Admin Panel</div>
        <button onClick={reloadAll} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      <div style={styles.cardGrid}>
        <StatCard label="Users" value={stats.totalUsers} color="#00e5ff" />
        <StatCard label="Pending Approval" value={stats.pendingUsers} color="#f59e0b" />
        <StatCard label="Directors" value={stats.directors} color="#ffd700" />
        <StatCard label="Surveys" value={stats.totalSurveys} color="#10b981" />
        <StatCard label="Districts" value={stats.districts} color="#4dd0e1" />
        <StatCard label="Stations" value={stats.stations} color="#ce93d8" />
      </div>

      <div style={styles.tabs}>
        {["USERS", "SURVEYS", "MASTER_DATA"].map((item) => (
          <button key={item} style={styles.tab(tab === item)} onClick={() => setTab(item)}>
            {item.replace("_", " ")}
          </button>
        ))}
      </div>

      {tab === "USERS" && (
        <section style={styles.section}>
          <div style={styles.sectionTop}>
            <div style={styles.sectionTitle}>User Management</div>
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search users..."
              style={styles.searchInput}
            />
          </div>
          <TableWrap loading={loading.users} empty={filteredUsers.length === 0} emptyText="No users found">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Zone</th>
                  <th style={styles.th}>Approved</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => {
                  const isBusy = Boolean(busyUserAction[item.id]);
                  return (
                    <tr key={item.id} style={styles.row}>
                      <td style={styles.cell}>{item.name || "-"}</td>
                      <td style={styles.cell}>{item.username || "-"}</td>
                      <td style={styles.cell}>{item.email || "-"}</td>
                      <td style={styles.cell}>
                        <select
                          value={roleDraftByUser[item.id] || item.role}
                          onChange={(event) =>
                            setRoleDraftByUser((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          style={styles.inlineSelect}
                          disabled={isBusy}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.cell}>{item.zone || "-"}</td>
                      <td style={styles.cell}>
                        <span style={styles.badge(item.is_approved ? "#10b981" : "#f59e0b")}>
                          {item.is_approved ? "YES" : "NO"}
                        </span>
                      </td>
                      <td style={styles.cell}>
                        <div style={styles.actionGroup}>
                          {!item.is_approved && (
                            <>
                              <button
                                onClick={() => handleUserApprovalAction(item.id, "APPROVE")}
                                disabled={isBusy}
                                style={styles.actionBtn("#10b981")}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUserApprovalAction(item.id, "REJECT")}
                                disabled={isBusy}
                                style={styles.actionBtn("#ef4444")}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleRoleChange(item.id)}
                            disabled={isBusy}
                            style={styles.actionBtn("#00e5ff")}
                          >
                            Change Role
                          </button>
                          {item.role === "SURVEYOR" && (
                            <div style={styles.assignRow}>
                              <select
                                value={directorDraftBySurveyor[item.id] || ""}
                                onChange={(event) =>
                                  setDirectorDraftBySurveyor((prev) => ({
                                    ...prev,
                                    [item.id]: event.target.value,
                                  }))
                                }
                                style={styles.inlineSelect}
                                disabled={isBusy}
                              >
                                <option value="">Select Director</option>
                                {directors.map((director) => (
                                  <option key={director.id} value={director.id}>
                                    {director.name || director.username}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleDirectorAssign(item.id)}
                                disabled={isBusy}
                                style={styles.actionBtn("#ffd700")}
                              >
                                Assign
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </section>
      )}

      {tab === "SURVEYS" && (
        <section style={styles.section}>
          <div style={styles.sectionTop}>
            <div style={styles.sectionTitle}>Survey Monitoring</div>
            <input
              value={surveySearch}
              onChange={(event) => setSurveySearch(event.target.value)}
              placeholder="Search surveys..."
              style={styles.searchInput}
            />
          </div>
          <TableWrap loading={loading.surveys} empty={filteredSurveys.length === 0} emptyText="No surveys found">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>State</th>
                  <th style={styles.th}>District</th>
                  <th style={styles.th}>Subdistrict</th>
                  <th style={styles.th}>Station</th>
                  <th style={styles.th}>Surveyor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map((item) => {
                  const normalized = normalizeWorkflowStatus(item.status || "PENDING");
                  const statusStyle = getStatusStyleForRole(normalized, "ADMIN");
                  return (
                    <tr key={item.id} style={styles.row}>
                      <td style={styles.cell}>{item.state || "-"}</td>
                      <td style={styles.cell}>{item.district || "-"}</td>
                      <td style={styles.cell}>{item.subdistrict || "-"}</td>
                      <td style={styles.cell}>{item.station || "-"}</td>
                      <td style={styles.cell}>{item.surveyor_name || "-"}</td>
                      <td style={styles.cell}>
                        <span
                          style={{
                            ...styles.badge(statusStyle.color),
                            background: statusStyle.background,
                            borderColor: `${statusStyle.color}55`,
                          }}
                        >
                          {normalized}
                        </span>
                      </td>
                      <td style={styles.cell}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </section>
      )}

      {tab === "MASTER_DATA" && (
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Districts & Stations</div>
          <div style={styles.masterGrid}>
            <div style={styles.masterPanel}>
              <div style={styles.masterTitle}>Districts</div>
              <TableWrap loading={loading.masters} empty={districts.length === 0} emptyText="No districts found">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districts.map((item) => (
                      <tr key={item.id} style={styles.row}>
                        <td style={styles.cell}>{item.id}</td>
                        <td style={styles.cell}>{item.name || "-"}</td>
                        <td style={styles.cell}>{item.state || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
            <div style={styles.masterPanel}>
              <div style={styles.masterTitle}>Stations</div>
              <TableWrap loading={loading.masters} empty={stations.length === 0} emptyText="No stations found">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Code</th>
                      <th style={styles.th}>District</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((item) => (
                      <tr key={item.id} style={styles.row}>
                        <td style={styles.cell}>{item.id}</td>
                        <td style={styles.cell}>{item.name || "-"}</td>
                        <td style={styles.cell}>{item.code || "-"}</td>
                        <td style={styles.cell}>{item.district || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const TableWrap = ({ loading, empty, emptyText, children }) => {
  if (loading) return <div style={styles.empty}>Loading...</div>;
  if (empty) return <div style={styles.empty}>{emptyText}</div>;
  return <div style={styles.tableWrap}>{children}</div>;
};

const StatCard = ({ label, value, color }) => (
  <div style={styles.statCard(color)}>
    <div style={{ color, fontSize: 26, fontWeight: 900 }}>{value}</div>
    <div style={{ color: "#e0f7fa", fontSize: 12 }}>{label}</div>
  </div>
);

const styles = {
  container: {
    flex: 1,
    padding: 28,
    overflow: "auto",
    background: "#0a1628",
    fontFamily: "monospace",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    color: "#00e5ff",
    fontSize: 22,
    fontWeight: 900,
  },
  refreshBtn: {
    background: "#00e5ff22",
    border: "1px solid #00e5ff66",
    color: "#00e5ff",
    borderRadius: 8,
    padding: "7px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "monospace",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 10,
    marginBottom: 16,
  },
  statCard: (color) => ({
    background: "#080f1a",
    border: `1px solid ${color}33`,
    borderRadius: 10,
    padding: 14,
  }),
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  tab: (active) => ({
    background: active ? "#00e5ff22" : "transparent",
    border: "1px solid #00e5ff33",
    color: active ? "#00e5ff" : "#80deea",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "monospace",
  }),
  section: {
    border: "1px solid #00e5ff22",
    borderRadius: 12,
    background: "#080f1a",
    padding: 14,
  },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
    flexWrap: "wrap",
  },
  sectionTitle: {
    color: "#ffd54f",
    fontSize: 13,
    fontWeight: 700,
  },
  searchInput: {
    background: "#0d1b2a",
    border: "1px solid #00e5ff33",
    color: "#e0f7fa",
    borderRadius: 8,
    padding: "8px 10px",
    minWidth: 220,
    fontFamily: "monospace",
    fontSize: 12,
    outline: "none",
  },
  tableWrap: {
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "58vh",
    borderRadius: 10,
    border: "1px solid rgba(0, 229, 255, 0.16)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  th: {
    textAlign: "left",
    color: "#4dd0e1",
    padding: "10px 12px",
    background: "rgba(0, 229, 255, 0.08)",
    borderBottom: "1px solid rgba(0, 229, 255, 0.14)",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  row: {
    borderBottom: "1px solid rgba(0, 229, 255, 0.08)",
  },
  cell: {
    color: "#e0f7fa",
    padding: "9px 12px",
    verticalAlign: "top",
  },
  empty: {
    color: "#80deea",
    textAlign: "center",
    padding: 22,
    border: "1px dashed rgba(0, 229, 255, 0.24)",
    borderRadius: 10,
    fontSize: 12,
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 999,
    border: `1px solid ${color}44`,
    background: `${color}22`,
    color,
    fontSize: 10,
    fontWeight: 700,
  }),
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  actionBtn: (color) => ({
    background: `${color}22`,
    border: `1px solid ${color}66`,
    color,
    borderRadius: 6,
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "monospace",
    textAlign: "left",
  }),
  inlineSelect: {
    background: "#0d1b2a",
    border: "1px solid #00e5ff33",
    color: "#e0f7fa",
    borderRadius: 6,
    padding: "5px 8px",
    fontFamily: "monospace",
    fontSize: 11,
    minWidth: 140,
  },
  assignRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  masterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 12,
  },
  masterPanel: {
    border: "1px solid rgba(0, 229, 255, 0.14)",
    borderRadius: 10,
    padding: 10,
    background: "#0a1220",
  },
  masterTitle: {
    color: "#4dd0e1",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 700,
  },
};

export default AdminPanelPage;
