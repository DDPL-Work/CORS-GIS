import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../../context/AppContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
const buildImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

const LocationModal = () => {
  const { state, dispatch } = useApp();
  const notif = state.notification;

  if (!notif || notif.type !== "location_detail") return null;
  const loc = notif.location;
  if (!loc) return null;

  /* ---------------- IMAGE VIEWER ---------------- */

  const [viewerImage, setViewerImage] = useState(null);
  const [rotation, setRotation] = useState(0);

  const openViewer = (img) => {
    setViewerImage(img);
    setRotation(0);
  };

  const closeViewer = () => {
    setViewerImage(null);
    setRotation(0);
  };

  const rotateLeft = () => setRotation((r) => r - 90);
  const rotateRight = () => setRotation((r) => r + 90);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") rotateLeft();
      if (e.key === "ArrowRight") rotateRight();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* ---------------- APPROVAL ---------------- */

  const [remarks, setRemarks] = useState(loc.remarks || "");
  const [priority, setPriority] = useState(loc.priority || 2);

  const canApprove = ["SUPERVISOR", "DIRECTOR", "GNRB", "ADMIN", "ZONAL_CHIEF"].includes(
    state.auth.role
  );

  const update = (status) => {
    dispatch({
      type: "UPDATE_LOCATION",
      payload: { id: loc.id, status, remarks, priority },
    });

    dispatch({
      type: "SET_NOTIFICATION",
      payload: {
        type: "toast",
        message: `Location ${status}!`,
        color: status === "approved" ? "#00e676" : "#ff5252",
      },
    });
  };

  const close = () =>
    dispatch({ type: "SET_NOTIFICATION", payload: null });

  const formatBool = (val) => (val ? "Yes" : "No");

  /* ---------------- RENDER ---------------- */

  return (
    <>
      {/* MAIN MODAL */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={close}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#0d1b2a",
            border: "1px solid #00e5ff44",
            borderRadius: 12,
            padding: 28,
            width: 820,
            maxHeight: "85vh",
            overflowY: "auto",
            fontFamily: "monospace",
          }}
        >
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ color: "#00e5ff", fontSize: 18, fontWeight: 700 }}>
              📍 {loc.location}
            </div>
            <button
              onClick={close}
              style={{
                background: "none",
                border: "none",
                color: "#80deea",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* POLAR CHART */}
          {loc.sky_visibility?.polar_chart_image && (
            <Section title="Polar Chart">
              <img
                src={buildImageUrl(loc.sky_visibility.polar_chart_image)}
                onClick={() =>
                  openViewer(
                    buildImageUrl(loc.sky_visibility.polar_chart_image)
                  )
                }
                style={{
                  width: 180,
                  borderRadius: 8,
                  cursor: "pointer",
                  border: "1px solid #00e5ff33",
                }}
              />
            </Section>
          )}

          {/* BASIC INFO */}
          <Section title="Basic Information">
            <Info label="Priority" value={loc.priority} />
            <Info label="Created At" value={loc.created_at} />
          </Section>

          {/* LOCATION DETAILS */}
          <Section title="Location Details">
            <Info label="Latitude" value={loc.location_details?.latitude} />
            <Info label="Longitude" value={loc.location_details?.longitude} />
            <Info label="Address" value={loc.location_details?.address} />
            <Info label="City" value={loc.location_details?.city} />
            <Info label="District" value={loc.location_details?.district} />
            <Info label="State" value={loc.location_details?.state} />
          </Section>

          {/* MONUMENT */}
          <Section title="Monument">
            <Info label="Type" value={loc.monument?.monument_type} />
            <Info label="Building Stories" value={loc.monument?.building_stories} />
            <Info
              label="Site Conditions"
              value={(loc.monument?.site_conditions || []).join(", ")}
            />
          </Section>

          {/* SKY VISIBILITY */}
          <Section title="Sky Visibility">
            <Info label="Remarks" value={loc.sky_visibility?.remarks} />
            {(loc.sky_visibility?.multipath_emi_source || []).map((m, i) => (
              <Info
                key={i}
                label={`EMI Source ${i + 1}`}
                value={`${m.source} | ${m.direction} | ${m.approx_distance_meter}m`}
              />
            ))}
          </Section>

          {/* POWER */}
          <Section title="Power">
            <Info label="AC Grid Available" value={formatBool(loc.power?.ac_grid)} />
            <Info label="AC Distance" value={loc.power?.ac_grid_distance_meter + " m"} />
            <Info label="Solar Possible" value={formatBool(loc.power?.solar_possible)} />
            <Info label="Solar Exposure" value={loc.power?.solar_exposure_hours + " hrs"} />
          </Section>

          {/* CONNECTIVITY */}
          <Section title="Connectivity">
            <Info label="GSM 4G" value={(loc.connectivity?.gsm_4g || []).join(", ")} />
            <Info label="Broadband" value={(loc.connectivity?.broadband || []).join(", ")} />
            <Info label="Fiber" value={(loc.connectivity?.fiber || []).join(", ")} />
            <Info label="Remarks" value={loc.connectivity?.remarks} />
          </Section>

          {/* PHOTOS */}
          <Section title="Photos">
            <PhotoGrid photos={loc.photos} openViewer={openViewer} />
          </Section>

          {/* APPROVAL */}
          {canApprove && (
            <Section title="Approval">
              <div style={{ marginBottom: 10 }}>
                <label style={{ color: "#80deea" }}>Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    background: "#ffffff08",
                    border: "1px solid #00e5ff33",
                    borderRadius: 6,
                    color: "#e0f7fa",
                    padding: 8,
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ color: "#80deea" }}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(+e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: 8,
                    background: "#0d1b2a",
                    border: "1px solid #00e5ff33",
                    borderRadius: 6,
                    color: "#e0f7fa",
                  }}
                >
                  <option value={1}>1 – High</option>
                  <option value={2}>2 – Medium</option>
                  <option value={3}>3 – Low</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => update("approved")}
                  style={{
                    flex: 1,
                    background: "#00e67622",
                    border: "1px solid #00e676",
                    color: "#00e676",
                    padding: 10,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ✓ APPROVE
                </button>

                <button
                  onClick={() => update("rejected")}
                  style={{
                    flex: 1,
                    background: "#ff525222",
                    border: "1px solid #ff5252",
                    color: "#ff5252",
                    padding: 10,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ✕ REJECT
                </button>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* FULLSCREEN IMAGE VIEWER */}
     {viewerImage &&
  createPortal(
    <>
      {/* BACKDROP */}
      <div
        onClick={closeViewer}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.95)",
          backdropFilter: "blur(6px)",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
      >
        {/* IMAGE WRAPPER */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 40px", // safe spacing for buttons
            boxSizing: "border-box"
          }}
        >
          <img
            src={viewerImage}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              transform: `rotate(${rotation}deg)`,
              transition: "transform 0.3s ease",
              userSelect: "none"
            }}
          />
        </div>
      </div>

      {/* CLOSE BUTTON - TOP RIGHT */}
      <button
        onClick={closeViewer}
        style={{
          position: "fixed",
          top: 25,
          right: 25,
          width: 42,
          height: 42,
          borderRadius: "50%",
          border: "none",
          background: "#111827",
          color: "#fff",
          fontSize: 20,
          cursor: "pointer",
          zIndex: 1000001,
          boxShadow: "0 0 15px rgba(0,0,0,0.6)"
        }}
      >
        ✕
      </button>

      {/* ROTATE BUTTONS - BOTTOM RIGHT */}
      <div
        style={{
          position: "fixed",
          bottom: 30,
          right: 30,
          display: "flex",
          gap: 15,
          zIndex: 1000001
        }}
      >
        <button
          onClick={rotateLeft}
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "none",
            background: "#00e5ff",
            fontSize: 20,
            cursor: "pointer",
            boxShadow: "0 0 20px #00e5ff88"
          }}
        >
          ⟲
        </button>

        <button
          onClick={rotateRight}
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "none",
            background: "#00e5ff",
            fontSize: 20,
            cursor: "pointer",
            boxShadow: "0 0 20px #00e5ff88"
          }}
        >
          ⟳
        </button>
      </div>
    </>,
    document.body
  )}
    </>
  );
};

/* ---------- Reusable Components ---------- */

const Section = ({ title, children }) => (
  <div style={{ marginTop: 24 }}>
    <div style={{ color: "#00e5ff", fontWeight: 700, marginBottom: 8 }}>
      {title}
    </div>
    <div style={{ display: "grid", gap: 6 }}>{children}</div>
  </div>
);

const Info = ({ label, value }) => (
  <div
    style={{
      background: "#ffffff08",
      border: "1px solid #00e5ff22",
      borderRadius: 6,
      padding: "8px 12px",
      fontSize: 12,
      color: "#e0f7fa",
    }}
  >
    <span style={{ color: "#80deea" }}>{label}:</span> {value || "-"}
  </div>
);

const PhotoGrid = ({ photos, openViewer }) => {
  if (!photos) return <div style={{ color: "#80deea" }}>No photos</div>;

  const photoList = [
    photos.north_photo,
    photos.east_photo,
    photos.south_photo,
    photos.west_photo,
  ].filter(Boolean);

  if (photoList.length === 0)
    return <div style={{ color: "#80deea" }}>No photos uploaded</div>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 10,
      }}
    >
      {photoList.map((p, i) => {
        const img = buildImageUrl(p);
        return (
          <img
            key={i}
            src={img}
            onClick={() => openViewer(img)}
            style={{
              width: "100%",
              height: 120,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid #00e5ff22",
              cursor: "pointer",
            }}
          />
        );
      })}
    </div>
  );
};

export default LocationModal;