import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../../context/AppContext";
import {
  directorDecision,
  zonalDecision,
  gnrbDecision,
  sendToZonal,
  updateSubsitePriority
} from "../../api/hierarchyApi";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const buildImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

const LocationModal = () => {
  const { state, dispatch } = useApp();
  const notif = state.notification;
  const loc = notif?.location;
  const role = state.auth.role;

  /* ---------------- ANIMATION STATE ---------------- */
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  /* ---------------- VIEWER STATE ---------------- */
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef(null);

  /* ---------------- FORM STATE ---------------- */
  const [remarks, setRemarks] = useState("");
  const [priority, setPriority] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------------- ENTRY ANIMATION ---------------- */
  useEffect(() => {
    if (loc) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [loc]);

  /* ---------------- LOCATION SYNC ---------------- */
  useEffect(() => {
    if (loc) {
      setRemarks(loc.remarks || "");
      setPriority(loc.priority || 2);
    }
  }, [loc]);

  /* ---------------- KEYBOARD CONTROLS ---------------- */
  useEffect(() => {
    const keyHandler = (e) => {
      if (!viewerImages.length) return;

      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-" || e.key === "_") zoomOut();
      if (e.key === "r" || e.key === "R") rotateRight();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [viewerImages]);

  /* ---------------- GUARD AFTER HOOKS ---------------- */
  if (!notif || notif.type !== "location_detail" || !loc) {
    return null;
  }

  /* ---------------- IMAGE LIST ---------------- */
  const photoList = [
    loc.photo_details?.north_photo && {
      url: buildImageUrl(loc.photo_details.north_photo),
      direction: "North"
    },
    loc.photo_details?.east_photo && {
      url: buildImageUrl(loc.photo_details.east_photo),
      direction: "East"
    },
    loc.photo_details?.south_photo && {
      url: buildImageUrl(loc.photo_details.south_photo),
      direction: "South"
    },
    loc.photo_details?.west_photo && {
      url: buildImageUrl(loc.photo_details.west_photo),
      direction: "West"
    }
  ].filter(Boolean);

  /* ---------------- POLAR CHART ---------------- */
  const polarChartUrl = loc.sky_visibility?.polar_chart_image 
    ? buildImageUrl(loc.sky_visibility.polar_chart_image) 
    : null;

  /* ---------------- VIEWER ACTIONS ---------------- */
  const openViewer = (index = 0) => {
    if (!photoList.length) return;
    setViewerImages(photoList);
    setViewerIndex(index);
    setZoom(1);
    setRotation(0);
    setIsFullscreen(false);
  };

  const openPolarViewer = () => {
    if (!polarChartUrl) return;
    setViewerImages([{ url: polarChartUrl, direction: "Polar Chart" }]);
    setViewerIndex(0);
    setZoom(1);
    setRotation(0);
    setIsFullscreen(false);
  };

  const closeViewer = () => {
    setViewerImages([]);
    setZoom(1);
    setRotation(0);
    setIsFullscreen(false);
  };

  const nextImage = () =>
    setViewerIndex((i) => (i + 1) % viewerImages.length);

  const prevImage = () =>
    setViewerIndex((i) =>
      i === 0 ? viewerImages.length - 1 : i - 1
    );

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));
  const resetZoom = () => setZoom(1);

  const rotateLeft = () => setRotation((r) => r - 90);
  const rotateRight = () => setRotation((r) => r + 90);
  const resetRotation = () => setRotation(0);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (viewerRef.current?.requestFullscreen) {
        viewerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  /* ---------------- MOUSE WHEEL ZOOM ---------------- */
  const onWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };
const isFinalApproved = loc.status === "FINAL_APPROVED";
  /* ---------------- ROLE RULE ---------------- */
  const canApprove =
    role !== "SUPERVISOR" &&
    ["DIRECTOR", "ZONAL_CHIEF", "GNRB", "ADMIN"].includes(role);

  /* ---------------- ACTION ---------------- */
const update = async (status) => {

  const token = state.auth.token;
  const role = state.auth.role;
const decision = status === "approved" ? "approve" : "reject";
  setIsSubmitting(true);

  try {

    if (role === "DIRECTOR") {

      await directorDecision(token, loc.id, decision, remarks);

      if (decision === "APPROVE") {
        await sendToZonal(token, loc.id);
      }

    }

    if (role === "ZONAL_CHIEF") {
      await zonalDecision(token, loc.id, decision, remarks);
    }

    if (role === "GNRB") {
      await gnrbDecision(token, loc.id, decision, remarks);
    }


    if (loc.status === "FINAL_APPROVED") {
  dispatch({
    type: "SET_NOTIFICATION",
    payload: {
      type: "toast",
      message: "This location is already finally approved. No further action allowed.",
      color: "#f59e0b"
    }
  });
  return;
}
    dispatch({ type: "REFETCH_HIERARCHY" });

    handleClose();

  } catch (err) {

  console.error("Approval error:", err);

  dispatch({
    type: "SET_NOTIFICATION",
    payload: {
      type: "toast",
      message: "Action failed. Please try again.",
      color: "#ef4444"
    }
  });

} finally {

    setIsSubmitting(false);

  }
dispatch({
  type: "SET_NOTIFICATION",
  payload: {
    type: "toast",
    message:
      status === "approved"
        ? "Location approved successfully"
        : "Location rejected successfully",
    color: status === "approved" ? "#10b981" : "#ef4444"
  }
});
};

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      dispatch({ type: "SET_NOTIFICATION", payload: null });
      setIsVisible(false);
    }, 300);
  };

  const formatBool = (v) => (v ? "Yes" : "No");

  /* ---------------- STYLES ---------------- */
  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      opacity: isExiting ? 0 : 1,
      transition: "opacity 0.3s ease-in-out"
    },
    modal: {
      background: "linear-gradient(145deg, #0a1929 0%, #0d2135 100%)",
      borderRadius: 24,
      width: 1000,
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      boxShadow: "0 25px 50px -12px rgba(0, 229, 255, 0.25), 0 0 0 1px rgba(0, 229, 255, 0.1)",
      transform: isExiting ? "scale(0.95)" : "scale(1)",
      transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      position: "relative",
      overflow: "hidden"
    },
    modalGlow: {
      position: "absolute",
      top: "-50%",
      left: "-50%",
      width: "200%",
      height: "200%",
      background: "radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.1) 0%, transparent 50%)",
      opacity: 0.5,
      pointerEvents: "none",
      zIndex: 0
    },
    modalHeader: {
      padding: "24px 32px 0 32px",
      position: "relative",
      zIndex: 1
    },
    modalContent: {
      padding: "0 32px 32px 32px",
      overflowY: "auto",
      flex: 1,
      position: "relative",
      zIndex: 1,
      scrollbarWidth: "thin",
      scrollbarColor: "#00e5ff #0a1929"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    },
    title: {
      color: "#00e5ff",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "-0.5px",
      textShadow: "0 0 20px rgba(0, 229, 255, 0.5)",
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    subTitle: {
      color: "#80deea",
      fontSize: 14,
      marginTop: 4,
      display: "flex",
      gap: 16
    },
    closeBtn: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      borderRadius: "50%",
      width: 40,
      height: 40,
      color: "#80deea",
      fontSize: 20,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
      backdropFilter: "blur(4px)"
    },
    section: {
      marginTop: 24,
      padding: "20px 24px",
      background: "rgba(255, 255, 255, 0.02)",
      borderRadius: 16,
      border: "1px solid rgba(0, 229, 255, 0.1)",
      backdropFilter: "blur(4px)",
      position: "relative",
      transition: "all 0.2s ease"
    },
    sectionTitle: {
      color: "#00e5ff",
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    sectionTitleLine: {
      flex: 1,
      height: 1,
      background: "linear-gradient(90deg, rgba(0, 229, 255, 0.5) 0%, transparent 100%)"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 12
    },
    infoCard: {
      background: "rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(0, 229, 255, 0.15)",
      borderRadius: 12,
      padding: "14px 16px",
      fontSize: 13,
      color: "#e0f7fa",
      transition: "all 0.2s ease",
      backdropFilter: "blur(4px)"
    },
    infoLabel: {
      color: "#80deea",
      fontSize: 11,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: 4,
      opacity: 0.8
    },
    infoValue: {
      fontSize: 14,
      fontWeight: 500,
      color: "#fff"
    },
    listCard: {
      background: "rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(0, 229, 255, 0.15)",
      borderRadius: 12,
      padding: "14px 16px",
      gridColumn: "span 2"
    },
    listItems: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8
    },
    listItem: {
      background: "rgba(0, 229, 255, 0.1)",
      border: "1px solid rgba(0, 229, 255, 0.3)",
      borderRadius: 20,
      padding: "4px 12px",
      fontSize: 12,
      color: "#00e5ff"
    },
    emiSource: {
      background: "rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(0, 229, 255, 0.15)",
      borderRadius: 12,
      padding: "12px 16px",
      marginBottom: 8
    },
    emiSourceText: {
      color: "#e0f7fa",
      fontSize: 13,
      display: "flex",
      gap: 16,
      flexWrap: "wrap"
    },
    emiSourceLabel: {
      color: "#80deea",
      marginRight: 4
    },
    polarChartContainer: {
      display: "flex",
      justifyContent: "center",
      marginBottom: 16
    },
    polarChart: {
      width: 200,
      height: 200,
      borderRadius: 12,
      border: "2px solid rgba(0, 229, 255, 0.3)",
      cursor: "pointer",
      transition: "transform 0.2s ease"
    },
    photoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12
    },
    photoItem: {
      position: "relative",
      borderRadius: 12,
      overflow: "hidden",
      cursor: "pointer",
      aspectRatio: "1/1",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      transition: "all 0.3s ease"
    },
    photoOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      padding: "8px",
      opacity: 0,
      transition: "opacity 0.3s ease"
    },
    photoDirection: {
      color: "#00e5ff",
      fontSize: 12,
      fontWeight: 600,
      textTransform: "uppercase"
    },
    textarea: {
      width: "100%",
      padding: "14px 16px",
      background: "rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      borderRadius: 12,
      color: "#e0f7fa",
      fontSize: 14,
      resize: "vertical",
      transition: "all 0.2s ease",
      backdropFilter: "blur(4px)",
      marginBottom: 16
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      background: "rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      borderRadius: 12,
      color: "#e0f7fa",
      fontSize: 14,
      cursor: "pointer",
      marginBottom: 20,
      backdropFilter: "blur(4px)"
    },
    buttonGroup: {
      display: "flex",
      gap: 12
    },
    approveBtn: {
      flex: 1,
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      border: "none",
      color: "#fff",
      padding: "14px 24px",
      borderRadius: 12,
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
      opacity: isSubmitting ? 0.7 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    },
    rejectBtn: {
      flex: 1,
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      border: "none",
      color: "#fff",
      padding: "14px 24px",
      borderRadius: 12,
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
      opacity: isSubmitting ? 0.7 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    },
    viewerOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.98)",
      backdropFilter: "blur(16px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      zIndex: 999999
    },
    viewerContainer: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%"
    },
    viewerImage: {
      maxWidth: "90%",
      maxHeight: "80%",
      objectFit: "contain",
      borderRadius: 12,
      boxShadow: "0 0 50px rgba(0, 229, 255, 0.3)",
      transition: "transform 0.1s ease",
      cursor: "grab"
    },
    viewerControls: {
      position: "fixed",
      bottom: 40,
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      gap: 12,
      padding: "16px 24px",
      background: "rgba(10, 25, 41, 0.8)",
      backdropFilter: "blur(12px)",
      borderRadius: 100,
      border: "1px solid rgba(0, 229, 255, 0.2)",
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)"
    },
    controlBtn: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      borderRadius: "50%",
      width: 48,
      height: 48,
      color: "#00e5ff",
      fontSize: 18,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease"
    },
    imageCounter: {
      position: "absolute",
      top: 20,
      right: 20,
      background: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      padding: "8px 16px",
      borderRadius: 100,
      color: "#00e5ff",
      fontSize: 14,
      border: "1px solid rgba(0, 229, 255, 0.2)"
    }
  };

  // Add custom scrollbar styles
  const scrollbarStyles = `
    .modal-content::-webkit-scrollbar {
      width: 8px;
    }
    .modal-content::-webkit-scrollbar-track {
      background: #0a1929;
      border-radius: 10px;
    }
    .modal-content::-webkit-scrollbar-thumb {
      background: #00e5ff;
      border-radius: 10px;
      border: 2px solid #0a1929;
    }
    .modal-content::-webkit-scrollbar-thumb:hover {
      background: #80deea;
    }
  `;

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <style>{scrollbarStyles}</style>
      
      <div style={styles.overlay} onClick={handleClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalGlow} />
          
          {/* Fixed Header */}
          <div style={styles.modalHeader}>
            <div style={styles.header}>
              <div>
                <div style={styles.title}>
                  <span>📍</span>
                  {loc.site_name || loc.location}
                </div>
                <div style={styles.subTitle}>
                  <span>ID: {loc.id}</span>
                  <span>Created: {new Date(loc.created_at).toLocaleString()}</span>
                </div>
              </div>
              <button 
                style={styles.closeBtn}
                onClick={handleClose}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(0, 229, 255, 0.1)";
                  e.target.style.borderColor = "#00e5ff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.05)";
                  e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="modal-content" style={styles.modalContent}>
            {/* Basic Information */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <span>📋</span>
                Basic Information
                <div style={styles.sectionTitleLine} />
              </div>
              <div style={styles.grid}>
                <InfoCard label="Site Name" value={loc.site_name} />
                <InfoCard label="Location" value={loc.location} />
                <InfoCard label="Status" value={loc.status} badge />
                <InfoCard label="Priority" value={loc.priority} priority />
                <InfoCard label="Surveyor" value={loc.surveyor_name} />
                <InfoCard label="Supervisor" value={loc.supervisor_name} />
                <InfoCard label="Contact" value={loc.contact_details || "Not provided"} />
                <InfoCard label="RINEX File" value={loc.rinex_file ? "Uploaded" : "Not Uploaded"} />
              </div>
            </div>

            {/* Location Details */}
            {loc.location_details && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span>📍</span>
                  Location Details
                  <div style={styles.sectionTitleLine} />
                </div>
                <div style={styles.grid}>
                  <InfoCard label="Latitude" value={loc.location_details.latitude} />
                  <InfoCard label="Longitude" value={loc.location_details.longitude} />
                  <InfoCard label="Address" value={loc.location_details.address} />
                  <InfoCard label="City" value={loc.location_details.city} />
                  <InfoCard label="District" value={loc.location_details.district} />
                  <InfoCard label="State" value={loc.location_details.state} />
                </div>
              </div>
            )}

            {/* Monument Details */}
            {loc.monument_details && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span>🏛️</span>
                  Monument Details
                  <div style={styles.sectionTitleLine} />
                </div>
                <div style={styles.grid}>
                  <InfoCard label="Monument Type" value={loc.monument_details.monument_type} />
                  <InfoCard label="Building Stories" value={loc.monument_details.building_stories || "N/A"} />
                </div>
                {loc.monument_details.site_conditions?.length > 0 && (
                  <div style={styles.listCard}>
                    <div style={styles.infoLabel}>Site Conditions</div>
                    <div style={styles.listItems}>
                      {loc.monument_details.site_conditions.map((condition, idx) => (
                        <span key={idx} style={styles.listItem}>{condition}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sky Visibility */}
            {loc.sky_visibility && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span>🌤️</span>
                  Sky Visibility
                  <div style={styles.sectionTitleLine} />
                </div>
                
                {polarChartUrl && (
                  <div style={styles.polarChartContainer}>
                    <img
                      src={polarChartUrl}
                      alt="Polar Chart"
                      style={styles.polarChart}
                      onClick={openPolarViewer}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    />
                  </div>
                )}

                {loc.sky_visibility.multipath_emi_source?.map((source, idx) => (
                  <div key={idx} style={styles.emiSource}>
                    <div style={styles.emiSourceText}>
                      <span><span style={styles.emiSourceLabel}>Source:</span> {source.source}</span>
                      <span><span style={styles.emiSourceLabel}>Direction:</span> {source.direction}</span>
                      <span><span style={styles.emiSourceLabel}>Distance:</span> {source.approx_distance_meter}m</span>
                    </div>
                  </div>
                ))}

                {loc.sky_visibility.remarks && (
                  <InfoCard label="Remarks" value={loc.sky_visibility.remarks} />
                )}
              </div>
            )}

            {/* Power Details */}
            {loc.power_details && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span>⚡</span>
                  Power Details
                  <div style={styles.sectionTitleLine} />
                </div>
                <div style={styles.grid}>
                  <InfoCard label="AC Grid" value={formatBool(loc.power_details.ac_grid)} />
                  <InfoCard label="AC Distance" value={loc.power_details.ac_grid_distance_meter ? `${loc.power_details.ac_grid_distance_meter}m` : "-"} />
                  <InfoCard label="Solar Possible" value={formatBool(loc.power_details.solar_possible)} />
                  <InfoCard label="Solar Exposure" value={loc.power_details.solar_exposure_hours ? `${loc.power_details.solar_exposure_hours} hrs` : "-"} />
                </div>
              </div>
            )}

            {/* Connectivity Details */}
            {loc.connectivity_details && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span>📡</span>
                  Connectivity Details
                  <div style={styles.sectionTitleLine} />
                </div>
                
                <div style={styles.grid}>
                  {loc.connectivity_details.gsm_4g?.length > 0 && (
                    <div style={styles.listCard}>
                      <div style={styles.infoLabel}>GSM 4G</div>
                      <div style={styles.listItems}>
                        {loc.connectivity_details.gsm_4g.map((item, idx) => (
                          <span key={idx} style={styles.listItem}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {loc.connectivity_details.broadband?.length > 0 && (
                    <div style={styles.listCard}>
                      <div style={styles.infoLabel}>Broadband</div>
                      <div style={styles.listItems}>
                        {loc.connectivity_details.broadband.map((item, idx) => (
                          <span key={idx} style={styles.listItem}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {loc.connectivity_details.fiber?.length > 0 && (
                    <div style={styles.listCard}>
                      <div style={styles.infoLabel}>Fiber</div>
                      <div style={styles.listItems}>
                        {loc.connectivity_details.fiber.map((item, idx) => (
                          <span key={idx} style={styles.listItem}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {loc.connectivity_details.airfiber?.length > 0 && (
                    <div style={styles.listCard}>
                      <div style={styles.infoLabel}>Airfiber</div>
                      <div style={styles.listItems}>
                        {loc.connectivity_details.airfiber.map((item, idx) => (
                          <span key={idx} style={styles.listItem}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {loc.connectivity_details.remarks && (
                  <InfoCard label="Remarks" value={loc.connectivity_details.remarks} />
                )}
              </div>
            )}

            {/* Photos */}
            {photoList.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span>📸</span>
                  Site Photos
                  <div style={styles.sectionTitleLine} />
                </div>
                <div style={styles.photoGrid}>
                  {photoList.map((photo, i) => (
                    <div
                      key={i}
                      style={styles.photoItem}
                      onClick={() => openViewer(i)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(0, 229, 255, 0.3)";
                        e.currentTarget.querySelector(".photo-overlay").style.opacity = 1;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.querySelector(".photo-overlay").style.opacity = 0;
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.direction}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />
                      <div className="photo-overlay" style={styles.photoOverlay}>
                        <span style={styles.photoDirection}>{photo.direction}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {loc.photo_details?.captured_at && (
                  <div style={{ marginTop: 12, color: "#80deea", fontSize: 12 }}>
                    Captured: {new Date(loc.photo_details.captured_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Approval Actions */}
{canApprove && !isFinalApproved && (
                <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  <span>⚖️</span>
                  Approval Actions
                  <div style={styles.sectionTitleLine} />
                </div>

                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add your remarks here..."
                  rows={3}
                  style={styles.textarea}
                />

                <select
                  value={priority}
                  onChange={(e) => setPriority(+e.target.value)}
                  style={styles.select}
                >
                  <option value={1}>🔴 High Priority (1)</option>
                  <option value={2}>🟡 Medium Priority (2)</option>
                  <option value={3}>🟢 Low Priority (3)</option>
                </select>

                <div style={styles.buttonGroup}>
                  <button
                    onClick={() => update("approved")}
disabled={isSubmitting || isFinalApproved}
                    style={styles.approveBtn}
                    onMouseEnter={(e) => !isSubmitting && (e.target.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => !isSubmitting && (e.target.style.transform = "translateY(0)")}
                  >
                    {isSubmitting ? (
                      "Processing..."
                    ) : (
                      <>
                        <span>✓</span>
                        APPROVE
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => update("rejected")}
disabled={isSubmitting || isFinalApproved}            
        style={styles.rejectBtn}
                    onMouseEnter={(e) => !isSubmitting && (e.target.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => !isSubmitting && (e.target.style.transform = "translateY(0)")}
                  >
                    {isSubmitting ? (
                      "Processing..."
                    ) : (
                      <>
                        <span>✕</span>
                        REJECT
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      {viewerImages.length > 0 &&
        createPortal(
          <div style={styles.viewerOverlay} onClick={closeViewer}>
            <div style={styles.viewerContainer} onClick={(e) => e.stopPropagation()}>
              <div style={styles.imageCounter}>
                {viewerIndex + 1} / {viewerImages.length} • {viewerImages[viewerIndex].direction}
              </div>
              
              <img
                ref={viewerRef}
                src={viewerImages[viewerIndex].url}
                onWheel={onWheel}
                style={{
                  ...styles.viewerImage,
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
                alt={viewerImages[viewerIndex].direction}
              />

              <div style={styles.viewerControls}>
                <button
                  style={styles.controlBtn}
                  onClick={prevImage}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0, 229, 255, 0.1)";
                    e.target.style.borderColor = "#00e5ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                  }}
                >
                  ◀
                </button>
                
                <button
                  style={styles.controlBtn}
                  onClick={nextImage}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0, 229, 255, 0.1)";
                    e.target.style.borderColor = "#00e5ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                  }}
                >
                  ▶
                </button>

                <div style={{ width: 1, height: 30, background: "rgba(0, 229, 255, 0.2)", margin: "0 8px" }} />

                <button
                  style={styles.controlBtn}
                  onClick={zoomIn}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0, 229, 255, 0.1)";
                    e.target.style.borderColor = "#00e5ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                  }}
                >
                  ＋
                </button>
                
                <button
                  style={styles.controlBtn}
                  onClick={zoomOut}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0, 229, 255, 0.1)";
                    e.target.style.borderColor = "#00e5ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                  }}
                >
                  －
                </button>

                <button
                  style={styles.controlBtn}
                  onClick={resetZoom}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0, 229, 255, 0.1)";
                    e.target.style.borderColor = "#00e5ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                  }}
                >
                  1:1
                </button>

                <div style={{ width: 1, height: 30, background: "rgba(0, 229, 255, 0.2)", margin: "0 8px" }} />

                <button
                  style={styles.controlBtn}
                  onClick={rotateLeft}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0, 229, 255, 0.1)";
                    e.target.style.borderColor = "#00e5ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                  }}
                >
                  ⟲
                </button>
                
                <button
                  style={styles.controlBtn}
                  onClick={rotateRight}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0, 229, 255, 0.1)";
                    e.target.style.borderColor = "#00e5ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                  }}
                >
                  ⟳
                </button>

                <button
                  style={styles.controlBtn}
                  onClick={resetRotation}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(0, 229, 255, 0.1)";
                    e.target.style.borderColor = "#00e5ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                  }}
                >
                  ↻
                </button>

                <div style={{ width: 1, height: 30, background: "rgba(0, 229, 255, 0.2)", margin: "0 8px" }} />

                <button
                  style={styles.controlBtn}
                  onClick={closeViewer}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(239, 68, 68, 0.2)";
                    e.target.style.borderColor = "#ef4444";
                    e.target.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.05)";
                    e.target.style.borderColor = "rgba(0, 229, 255, 0.2)";
                    e.target.style.color = "#00e5ff";
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

/* ---------------- COMPONENTS ---------------- */

const InfoCard = ({ label, value, badge, priority }) => {
  const getPriorityColor = (val) => {
    if (val === 1) return "#ef4444";
    if (val === 2) return "#f59e0b";
    if (val === 3) return "#10b981";
    if (status === "FINAL_APPROVED") return "#22c55e";
    return "#e0f7fa";
  };

  const getStatusColor = (status) => {
    if (status === "FINAL_APPROVED" || status === "approved") return "#10b981";
    if (status === "SUPERVISOR_APPROVED") return "#3b82f6";
    if (status === "rejected") return "#ef4444";
    if (status === "pending" || status === "SUBMITTED") return "#f59e0b";
    return "#e0f7fa";
  };

  const styles = {
    card: {
      background: "rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(0, 229, 255, 0.15)",
      borderRadius: 12,
      padding: "14px 16px",
      fontSize: 13,
      color: "#e0f7fa",
      transition: "all 0.2s ease",
      backdropFilter: "blur(4px)"
    },
    label: {
      color: "#80deea",
      fontSize: 11,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: 4,
      opacity: 0.8
    },
    value: {
      fontSize: 14,
      fontWeight: 500,
      color: badge ? getStatusColor(value) : priority ? getPriorityColor(value) : "#fff"
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value || "-"}</div>
    </div>
  );
};

export default LocationModal;