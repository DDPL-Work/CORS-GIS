import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context/AppContext";
import { approveSurvey, fetchHierarchySites } from "../api/hierarchyApi";

const rolesFlow = [
  "SUBMITTED",
  "SUPERVISOR_APPROVED",
  "DIRECTOR_APPROVED",
  "ZONAL_CHIEF_APPROVED",
  "GNRB_APPROVED",
];

const ApprovalsPage = () => {
  const { state, dispatch } = useApp();

  const [tab, setTab] = useState("ALL");
  const [actionModal, setActionModal] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const canAction = [
    "SUPERVISOR",
    "DIRECTOR",
    "ZONAL_CHIEF",
    "GNRB",
    "ADMIN",
  ].includes(state.auth.role);

  /* ---------------- FLATTEN DATA ---------------- */

  const rows = useMemo(() => {
    return state.hierarchySites.flatMap((site) =>
      site.subsites.map((sub) => ({
        siteId: site.id, // Survey ID
        station: site.station,
        state: site.state,
        district: site.district,
        surveyor: site.surveyor_name,
        siteStatus: site.status,
        locationId: sub.id,
        location: sub.location,
        priority: sub.priority,
        created_at: sub.created_at,
        remarks: site.remarks,
      }))
    );
  }, [state.hierarchySites]);

  const filteredRows =
    tab === "ALL"
      ? rows
      : rows.filter((r) => r.siteStatus === tab);

  /* ---------------- ACTION MODAL ---------------- */

  const openActionModal = (row) => {
    setActionModal(row);
    setRemarks("");
  };

  const closeModal = () => {
    setActionModal(null);
    setRemarks("");
  };

  /* ---------------- APPROVE / REJECT ---------------- */

  const handleDecision = async (decision) => {
    try {
      setLoading(true);

      await approveSurvey(
        state.auth.token,
        actionModal.siteId, // ✅ Survey ID
        decision,
        remarks
      );

      // 🔥 Auto Refresh
      const freshData = await fetchHierarchySites(state.auth.token);

      dispatch({
        type: "SET_HIERARCHY_SITES",
        payload: freshData,
      });

      dispatch({
        type: "SET_NOTIFICATION",
        payload: {
          type: "toast",
          message: `Successfully ${decision}`,
          color: decision === "APPROVED" ? "#00e676" : "#ff5252",
        },
      });

      closeModal();
    } catch (err) {
      dispatch({
        type: "SET_NOTIFICATION",
        payload: {
          type: "toast",
          message: "Action failed",
          color: "#ff5252",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>📋 Station Submissions</div>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["ALL", ...rolesFlow].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tabStyle(tab === t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <table style={tableStyle}>
        <thead>
          <tr>
            {[
              "Station",
              "State",
              "District",
              "Location",
              "Surveyor",
              "Priority",
              "Created",
              "Status",
              "Remarks",
              canAction && "Action",
            ]
              .filter(Boolean)
              .map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
          </tr>
        </thead>

        <tbody>
          {filteredRows.map((row) => (
            <tr key={row.locationId}>
              <td style={cell}>{row.station}</td>
              <td style={cell}>{row.state}</td>
              <td style={cell}>{row.district}</td>
              <td style={cell}>{row.location}</td>
              <td style={cell}>{row.surveyor}</td>
              <td style={cell}>{["", "HIGH", "MEDIUM", "LOW"][row.priority]}</td>
              <td style={cell}>
                {new Date(row.created_at).toLocaleString()}
              </td>

              {/* STATUS + TIMELINE */}
              <td style={cell}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={statusStyle(row.siteStatus)}>
                    {row.siteStatus}
                  </span>
                  <ApprovalTimeline status={row.siteStatus} />
                </div>
              </td>

              <td style={cell}>{row.remarks || "—"}</td>

              {canAction && (
                <td style={cell}>
                  {row.siteStatus?.includes(state.auth.role) ? (
                    <span style={{ color: "#00e676", fontSize: 11 }}>
                      Approved by You ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => openActionModal(row)}
                      style={actionBtn}
                    >
                      Take Action
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ACTION MODAL */}
      {actionModal &&
        createPortal(
          <div style={modalBackdrop} onClick={closeModal}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: "#00e5ff" }}>
                Action on {actionModal.location}
              </h3>

              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks..."
                rows={4}
                style={textareaStyle}
              />

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button
                  onClick={() => handleDecision("APPROVED")}
                  disabled={loading}
                  style={approveBtn}
                >
                  ✓ Approve
                </button>

                <button
                  onClick={() => handleDecision("REJECTED")}
                  disabled={loading}
                  style={rejectBtn}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

/* ---------------- TIMELINE COMPONENT ---------------- */

const ApprovalTimeline = ({ status }) => {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {rolesFlow.map((step) => {
        const completed =
          rolesFlow.indexOf(status) >= rolesFlow.indexOf(step);

        return (
          <div
            key={step}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: completed ? "#00e676" : "#444",
            }}
            title={step}
          />
        );
      })}
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const containerStyle = {
  flex: 1,
  padding: 28,
  background: "#0a1628",
  fontFamily: "monospace",
  overflowY: "auto",
};

const titleStyle = {
  color: "#00e5ff",
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 20,
};

const tabStyle = (active) => ({
  padding: "6px 14px",
  borderRadius: 6,
  background: active ? "#00e5ff22" : "transparent",
  border: "1px solid #00e5ff33",
  color: active ? "#00e5ff" : "#80deea",
  cursor: "pointer",
  fontSize: 11,
});

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  color: "#4dd0e1",
};

const cell = {
  padding: "10px 12px",
  color: "#e0f7fa",
};

const statusStyle = (status) => ({
  background:
    status?.includes("APPROVED")
      ? "#00e67622"
      : status?.includes("REJECTED")
      ? "#ff525222"
      : "#ffd70022",
  color:
    status?.includes("APPROVED")
      ? "#00e676"
      : status?.includes("REJECTED")
      ? "#ff5252"
      : "#ffd700",
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 700,
});

const actionBtn = {
  background: "#00e5ff22",
  border: "1px solid #00e5ff",
  color: "#00e5ff",
  borderRadius: 4,
  padding: "4px 10px",
  cursor: "pointer",
  fontSize: 10,
};

const modalBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
};

const modalBox = {
  background: "#0d1b2a",
  padding: 30,
  borderRadius: 12,
  width: 400,
};

const textareaStyle = {
  width: "100%",
  marginTop: 12,
  padding: 10,
  background: "#ffffff08",
  border: "1px solid #00e5ff33",
  borderRadius: 6,
  color: "#e0f7fa",
};

const approveBtn = {
  flex: 1,
  background: "#00e67622",
  border: "1px solid #00e676",
  color: "#00e676",
  padding: 10,
  borderRadius: 6,
  cursor: "pointer",
};

const rejectBtn = {
  flex: 1,
  background: "#ff525222",
  border: "1px solid #ff5252",
  color: "#ff5252",
  padding: 10,
  borderRadius: 6,
  cursor: "pointer",
};

export default ApprovalsPage;