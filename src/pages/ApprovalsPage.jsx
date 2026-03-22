import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  getActorLabelForRole,
  getSitePriority,
  summarizeSiteLocations,
} from "../utils/hierarchyHelpers";
import {
  canRoleSubmitToNextLevel,
  canRoleTakeSubsiteAction,
  getStatusStyleForRole,
  normalizeWorkflowStatus,
} from "../utils/workflowStatus";

const priorityMap = {
  1: "HIGH",
  2: "MEDIUM",
  3: "LOW",
};

const ApprovalsPage = () => {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState("ALL");
  const role = state.auth.role;
  const actorLabel = getActorLabelForRole(role);
  const isSupervisor = role === "SUPERVISOR";

  const rows = useMemo(() => {
    if (isSupervisor) {
      return (state.hierarchySites || []).map((site) => ({
        id: site.id,
        station: site.site_name || "-",
        location: summarizeSiteLocations(site),
        actor: site.surveyor_name || "-",
        priority: getSitePriority(site),
        createdAt:
          site.created_at ||
          site.subsites?.[0]?.created_at ||
          null,
        rawStatus: site.status || "SUBMITTED",
        status: normalizeWorkflowStatus(site.status || "SUBMITTED"),
        remarks: site.remarks || "-",
        originalSite: site,
        originalSubsite: null,
      }));
    }

    return (state.hierarchySites || []).flatMap((site) =>
      (site.subsites || []).map((subsite) => ({
        id: subsite.id,
        station: site.site_name || "-",
        location: subsite.location || "-",
        actor:
          site.supervisor_name ||
          site.director_name ||
          site.surveyor_name ||
          "-",
        priority: subsite.priority ?? null,
        createdAt: subsite.created_at || null,
        rawStatus: subsite.status || "SUBMITTED",
        status: normalizeWorkflowStatus(subsite.status || "SUBMITTED"),
        remarks: subsite.remarks || site.remarks || "-",
        originalSite: site,
        originalSubsite: subsite,
      }))
    );
  }, [isSupervisor, state.hierarchySites]);

  const availableTabs = useMemo(() => {
    const statuses = rows
      .map((row) => row.status)
      .filter(Boolean);

    return ["ALL", ...new Set(statuses)];
  }, [rows]);

  const filteredRows =
    tab === "ALL" ? rows : rows.filter((row) => row.status === tab);

  const openRoleAction = (row) => {
    if (role === "SUPERVISOR") {
      if (!row.originalSite) return;

      dispatch({
        type: "SET_NOTIFICATION",
        payload: {
          type: "station_action",
          station: row.originalSite,
        },
      });
      return;
    }

    if (!row.originalSubsite) return;
    dispatch({
      type: "SET_NOTIFICATION",
      payload: {
        type: "location_detail",
        location: row.originalSubsite,
      },
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>Station Approvals</div>

      <div style={styles.tabs}>
        {availableTabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            style={styles.tab(tab === item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Station</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>{actorLabel}</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Status</th>
              {/* <th style={styles.th}>Action</th> */}
              {/* <th style={styles.th}>Remarks</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const statusStyle = getStatusStyleForRole(row.rawStatus, role);
              const canTakeAction =
                role === "SUPERVISOR"
                  ? ["SUBMITTED", "SUPERVISOR_APPROVED"].includes(row.status)
                  : canRoleTakeSubsiteAction(role, row.rawStatus);
              const canSubmitToNext = canRoleSubmitToNextLevel(role, row.rawStatus);
              const actionEnabled = canTakeAction || canSubmitToNext;
              const actionLabel =
                role === "DIRECTOR" && canSubmitToNext && !canTakeAction
                  ? "Submit to Zonal"
                  : "Take Action";

              return (
                <tr key={row.id} style={styles.row}>
                  <td style={styles.cell}>{row.station}</td>
                  <td style={{ ...styles.cell, ...styles.locationCell }}>{row.location}</td>
                  <td style={styles.cell}>{row.actor}</td>
                  <td style={styles.cell}>{priorityMap[row.priority] || "-"}</td>
                  <td style={styles.cell}>
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                  </td>
                  <td style={styles.cell}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: statusStyle.background,
                        color: statusStyle.color,
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  {/* <td style={styles.cell}>
                    <button
                      onClick={() => openRoleAction(row)}
                      disabled={!actionEnabled}
                      style={{
                        ...styles.actionButton,
                        opacity: actionEnabled ? 1 : 0.55,
                        cursor: actionEnabled ? "pointer" : "not-allowed",
                      }}
                    >
                      {actionLabel}
                    </button>
                  </td> */}
                  {/* <td style={{ ...styles.cell, ...styles.remarksCell }}>{row.remarks}</td> */}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredRows.length === 0 && (
          <div style={styles.emptyState}>No approval rows found for this filter.</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 28,
    background: "#0a1628",
    fontFamily: "monospace",
    overflow: "auto",
  },
  title: {
    color: "#00e5ff",
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 18,
  },
  tabs: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  tab: (active) => ({
    padding: "7px 14px",
    borderRadius: 8,
    background: active ? "#00e5ff22" : "transparent",
    border: "1px solid #00e5ff33",
    color: active ? "#00e5ff" : "#80deea",
    cursor: "pointer",
    fontSize: 11,
  }),
 tableWrap: {
  border: "1px solid rgba(0, 229, 255, 0.14)",
  borderRadius: 14,
  background: "rgba(255, 255, 255, 0.02)",

  maxHeight: "65vh",     // 🔥 controls scroll height
  overflowY: "auto",     // 🔥 vertical scroll
  overflowX: "auto",     // optional horizontal scroll
},
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  th: {
  textAlign: "left",
  padding: "12px 14px",
  color: "#4dd0e1",
  background: "rgba(0, 229, 255, 0.08)",
  borderBottom: "1px solid rgba(0, 229, 255, 0.14)",

  position: "sticky",   // 🔥 key
  top: 0,               // 🔥 stick to top
  zIndex: 2,
},
  row: {
    borderBottom: "1px solid rgba(0, 229, 255, 0.08)",
  },
  cell: {
    padding: "12px 14px",
    color: "#e0f7fa",
    verticalAlign: "top",
  },
  locationCell: {
    minWidth: 220,
    lineHeight: 1.6,
  },
  remarksCell: {
    maxWidth: 260,
    lineHeight: 1.6,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
  },
  actionButton: {
    background: "#00e5ff22",
    border: "1px solid #00e5ff66",
    color: "#00e5ff",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 11,
  },
  emptyState: {
    padding: 24,
    color: "#80deea",
    textAlign: "center",
  },
};

export default ApprovalsPage;
