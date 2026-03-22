import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import DraggablePanel from "../layout/DraggablePanel";
import { submitSupervisorSurvey, supervisorDecision } from "../../api/hierarchyApi";
import { reloadHierarchySites, summarizeSiteLocations } from "../../utils/hierarchyHelpers";

const StationActionModal = () => {
  const { state, dispatch } = useApp();
  const notification = state.notification;
  const station = notification?.station;
  const isOpen = notification?.type === "station_action" && station;
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRemarks(station?.remarks || "");
    }
  }, [isOpen, station]);

  if (!isOpen) {
    return null;
  }

  const closeModal = () => {
    if (isSubmitting) return;
    dispatch({ type: "SET_NOTIFICATION", payload: null });
  };

  const handleDecision = async (decision) => {
    if (!station?.id) return;

    try {
      setIsSubmitting(true);

      await supervisorDecision(
        state.auth.token,
        station.id,
        decision,
        remarks
      );

      await reloadHierarchySites(dispatch, state.auth.token, state.auth.role);
      dispatch({
        type: "SET_NOTIFICATION",
        payload: {
          type: "toast",
          message:
            decision === "APPROVED"
              ? "Station approved successfully"
              : "Station rejected successfully",
          color: decision === "APPROVED" ? "#10b981" : "#ef4444",
        },
      });
    } catch (error) {
      console.error("Station supervisor action failed:", error);
      dispatch({
        type: "SET_NOTIFICATION",
        payload: {
          type: "toast",
          message: "Station action failed. Please try again.",
          color: "#ef4444",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitToDirector = async () => {
    if (!station?.id) return;

    try {
      setIsSubmitting(true);
      await submitSupervisorSurvey(state.auth.token, station.id);
      await reloadHierarchySites(dispatch, state.auth.token, state.auth.role);
      dispatch({
        type: "SET_NOTIFICATION",
        payload: {
          type: "toast",
          message: "Survey successfully submitted to Director",
          color: "#10b981",
        },
      });
    } catch (error) {
      console.error("Supervisor submit-to-director failed:", error);
      dispatch({
        type: "SET_NOTIFICATION",
        payload: {
          type: "toast",
          message: "Submit to Director failed. Please try again.",
          color: "#ef4444",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = station.status || "SUBMITTED";
  const canTakeAction = state.auth.role === "SUPERVISOR" && status === "SUBMITTED";
  const canSubmitToDirector =
    state.auth.role === "SUPERVISOR" && status === "SUPERVISOR_APPROVED";

  return (
    <div style={styles.overlay} onClick={closeModal}>
      <DraggablePanel
        title="STATION ACTION"
        handleColor="#00e5ff"
        position="absolute"
        bounds="parent"
        initialAnchor="center"
        useTransformCenter
        style={styles.modal}
        bodyStyle={styles.modalBody}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.headingRow}>
          <div>
            <div style={styles.title}>{station.site_name || "Unnamed Station"}</div>
            <div style={styles.meta}>
              <span>Status: {status}</span>
              <span>Created: {station.created_at ? new Date(station.created_at).toLocaleString() : "-"}</span>
            </div>
          </div>
          <button onClick={closeModal} style={styles.closeButton}>
            x
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.label}>Locations</div>
          <div style={styles.value}>{summarizeSiteLocations(station)}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.label}>Remark</div>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={5}
            placeholder="Write station-level remark"
            style={styles.textarea}
            disabled={!canTakeAction || isSubmitting}
          />
        </div>

        <div style={styles.actions}>
          <button
            onClick={() => handleDecision("APPROVED")}
            disabled={!canTakeAction || isSubmitting}
            style={{
              ...styles.button,
              ...styles.approveButton,
              opacity: !canTakeAction || isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Processing..." : "Approve"}
          </button>
          <button
            onClick={() => handleDecision("REJECTED")}
            disabled={!canTakeAction || isSubmitting}
            style={{
              ...styles.button,
              ...styles.rejectButton,
              opacity: !canTakeAction || isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Processing..." : "Reject"}
          </button>
        </div>

        {canSubmitToDirector && (
          <button
            onClick={handleSubmitToDirector}
            disabled={isSubmitting}
            style={{
              ...styles.button,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Processing..." : "Submit to Director"}
          </button>
        )}

        {!canTakeAction && !canSubmitToDirector && (
          <div style={styles.helperText}>
            Station approval is available in SUBMITTED status, and submit-to-director becomes available after supervisor approval.
          </div>
        )}
      </DraggablePanel>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.78)",
    backdropFilter: "blur(6px)",
    zIndex: 10000,
  },
  modal: {
    width: 560,
    maxWidth: "92vw",
    minWidth: 380,
    background: "linear-gradient(145deg, #0a1929 0%, #0d2135 100%)",
    border: "1px solid rgba(0, 229, 255, 0.25)",
    borderRadius: 18,
    boxShadow: "0 25px 50px -12px rgba(0, 229, 255, 0.28)",
  },
  modalBody: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  title: {
    color: "#00e5ff",
    fontSize: 24,
    fontWeight: 700,
  },
  meta: {
    marginTop: 8,
    color: "#80deea",
    fontSize: 12,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  closeButton: {
    background: "transparent",
    border: "1px solid rgba(0, 229, 255, 0.3)",
    color: "#80deea",
    width: 34,
    height: 34,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    border: "1px solid rgba(0, 229, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  label: {
    color: "#80deea",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: {
    color: "#e0f7fa",
    fontSize: 14,
    lineHeight: 1.6,
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    padding: "12px 14px",
    background: "rgba(0, 0, 0, 0.28)",
    border: "1px solid rgba(0, 229, 255, 0.18)",
    borderRadius: 12,
    color: "#e0f7fa",
    resize: "vertical",
    boxSizing: "border-box",
  },
  actions: {
    display: "flex",
    gap: 12,
  },
  button: {
    flex: 1,
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  approveButton: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  rejectButton: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  },
  helperText: {
    color: "#80deea",
    fontSize: 12,
    lineHeight: 1.5,
  },
};

export default StationActionModal;
