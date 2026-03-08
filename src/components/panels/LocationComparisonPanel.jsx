import React, { useMemo, useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { calculateDistance } from "../../utils/geoUtils";
import { createPortal } from "react-dom";
import {
  directorDecision,
  zonalDecision,
  gnrbDecision,
  sendToZonal
} from "../../api/hierarchyApi";
/* ---------------- NORMALIZE LOCATION ---------------- */
/* ---------------- NORMALIZE LOCATION ---------------- */
const normalizeLocation = (loc) => {

  const data = loc.originalData || loc;

  return {

    ...loc,

    /* LOCATION */
    latitude: data.location_details?.latitude ?? loc.latitude ?? null,
    longitude: data.location_details?.longitude ?? loc.longitude ?? null,

    address: data.location_details?.address ?? loc.address ?? null,
    city: data.location_details?.city ?? loc.city ?? null,
    district: data.location_details?.district ?? loc.district ?? null,
    state: data.location_details?.state ?? loc.state ?? null,

    /* BASIC */
    site_name: data.site_name ?? loc.site_name ?? null,
    surveyor_name: data.surveyor_name ?? null,
    supervisor_name: data.supervisor_name ?? null,
    contact_details: data.contact_details ?? null,
    rinex_file: data.rinex_file ?? null,
    status: data.status ?? loc.status ?? null,
    priority: data.priority ?? loc.priority ?? null,

    /* MONUMENT */
    monument_type: data.monument_details?.monument_type ?? null,
    building_stories: data.monument_details?.building_stories ?? null,
    site_conditions: data.monument_details?.site_conditions ?? [],

    /* POWER */
    ac_grid: data.power_details?.ac_grid ?? null,
    ac_grid_distance_meter: data.power_details?.ac_grid_distance_meter ?? null,
    solar_possible: data.power_details?.solar_possible ?? null,
    solar_exposure_hours: data.power_details?.solar_exposure_hours ?? null,

    /* CONNECTIVITY */
    gsm: data.connectivity_details?.gsm_4g ?? [],
    broadband: data.connectivity_details?.broadband ?? [],
    fiber: data.connectivity_details?.fiber ?? [],
    airfiber: data.connectivity_details?.airfiber ?? [],
    connectivity_remarks: data.connectivity_details?.remarks ?? null,

    /* SKY */
    sky_remarks: data.sky_visibility?.remarks ?? null,
    emi_sources: data.sky_visibility?.multipath_emi_source ?? [],
    polar_chart: data.sky_visibility?.polar_chart_image ?? null,

    /* PHOTOS */
    north_photo: data.photo_details?.north_photo ?? null,
    east_photo: data.photo_details?.east_photo ?? null,
    south_photo: data.photo_details?.south_photo ?? null,
    west_photo: data.photo_details?.west_photo ?? null,
    photo_captured: data.photo_details?.captured_at ?? null,

    created_at: data.created_at ?? loc.created_at ?? null,
    remarks: data.remarks ?? loc.remarks ?? null
  };
};
const LocationComparisonPanel = () => {
  const { state, dispatch } = useApp();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  /* ---------------- VIEWER STATE ---------------- */
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const viewerRef = useRef(null);
  
  /* ---------------- APPROVAL MODAL STATE ---------------- */
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [priority, setPriority] = useState(2);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
console.log("Compared Locations:", state.comparedLocations);
  const locations = (state.comparedLocations || []).map(normalizeLocation);

  const canApprove = ["DIRECTOR", "ZONAL_CHIEF", "GNRB", "ADMIN"].includes(
    state.auth?.role
  );

  /* ---------------- IMAGE VIEWER FUNCTIONS ---------------- */
  const openViewer = (images, index = 0) => {
    if (!images || !images.length) return;
    setViewerImages(images);
    setViewerIndex(index);
    setZoom(1);
    setRotation(0);
  };

  const closeViewer = () => {
    setViewerImages([]);
    setZoom(1);
    setRotation(0);
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

  /* ---------------- MOUSE WHEEL ZOOM ---------------- */
  const onWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  /* ---------------- KEYBOARD CONTROLS ---------------- */
  useEffect(() => {
    const handleKey = (e) => {
      if (!viewerImages.length) return;

      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-" || e.key === "_") zoomOut();
      if (e.key === "r" || e.key === "R") rotateRight();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerImages]);

  const handleRemove = (id) => {
    dispatch({ type: "REMOVE_COMPARE_LOCATION", payload: id });
  };

  const handleClear = () => {
    dispatch({ type: "CLEAR_COMPARE" });
  };

  /* ---------------- APPROVAL MODAL HANDLERS ---------------- */
 const openApprovalModal = (location) => {

  if (location.status === "FINAL_APPROVED") {
    dispatch({
      type: "SET_NOTIFICATION",
      payload: {
        type: "toast",
        message: "This location is already FINAL APPROVED",
        color: "#f59e0b"
      }
    });
    return;
  }

  setSelectedLocation(location);
  setRemarks(location.remarks || "");
  setPriority(location.priority || 2);
  setShowApprovalModal(true);
};

  const closeApprovalModal = () => {
    setSelectedLocation(null);
    setShowApprovalModal(false);
  };
const handleApproval = async (status) => {

  if (!selectedLocation) return;

  const token = state.auth.token;
  const role = state.auth.role;

  const decision = status === "APPROVED" ? "APPROVE" : "REJECT";

  setIsSubmitting(true);

  try {

    if (selectedLocation.status === "FINAL_APPROVED") {
      dispatch({
        type: "SET_NOTIFICATION",
        payload: {
          type: "toast",
          message: "Final approved location cannot be modified",
          color: "#ef4444"
        }
      });
      return;
    }

    if (role === "DIRECTOR") {

      await directorDecision(token, selectedLocation.id, decision, remarks);

      if (decision === "APPROVE") {
        await sendToZonal(token, selectedLocation.id);
      }

    }

    if (role === "ZONAL_CHIEF") {
      await zonalDecision(token, selectedLocation.id, decision, remarks);
    }

    if (role === "GNRB") {
      await gnrbDecision(token, selectedLocation.id, decision, remarks);
    }

    dispatch({ type: "REFETCH_HIERARCHY" });

    dispatch({
      type: "SET_NOTIFICATION",
      payload: {
        type: "toast",
        message:
          decision === "APPROVE"
            ? "Location approved successfully"
            : "Location rejected successfully",
        color: decision === "APPROVE" ? "#10b981" : "#ef4444"
      }
    });

    closeApprovalModal();

  } catch (err) {

    console.error("Approval error:", err);

    dispatch({
      type: "SET_NOTIFICATION",
      payload: {
        type: "toast",
        message: "Approval failed",
        color: "#ef4444"
      }
    });

  } finally {

    setIsSubmitting(false);

  }
};


  const buildImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path}`;
  };

  /* -------------------- DISTANCE MATRIX -------------------- */
  const distanceMatrix = useMemo(() => {
    const results = [];
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const a = locations[i];
        const b = locations[j];

        const aLat = a.latitude;
        const aLng = a.longitude;
        const bLat = b.latitude;
        const bLng = b.longitude;

        if (
          aLat && aLng && bLat && bLng &&
          !isNaN(parseFloat(aLat)) && isFinite(parseFloat(aLat)) &&
          !isNaN(parseFloat(aLng)) && isFinite(parseFloat(aLng)) &&
          !isNaN(parseFloat(bLat)) && isFinite(parseFloat(bLat)) &&
          !isNaN(parseFloat(bLng)) && isFinite(parseFloat(bLng))
        ) {
          const d = calculateDistance(
            parseFloat(aLat),
            parseFloat(aLng),
            parseFloat(bLat),
            parseFloat(bLng)
          );

          results.push({
            text: `${a.site_name || a.location} ↔ ${b.site_name || b.location} = ${d.toFixed(3)} km`,
            value: d
          });
        }
      }
    }
    return results.sort((a, b) => a.value - b.value);
  }, [locations]);

  if (locations.length === 0) return null;

  /* -------------------- CSV EXPORT -------------------- */
  const handleExportCSV = () => {
    const headers = [
      "ID", "Site Name", "Location", "Priority", "Status", "Surveyor", "Supervisor", 
      "Contact", "RINEX File", "Latitude", "Longitude", "Address", "City", "District", 
      "State", "Monument Type", "Building Stories", "Site Conditions", "AC Grid", 
      "AC Distance (m)", "Solar Possible", "Solar Exposure (hrs)", "GSM 4G", "Broadband", 
      "Fiber", "Airfiber", "Connectivity Remarks", "Sky Remarks", "EMI Sources", 
      "Polar Chart", "North Photo", "East Photo", "South Photo", "West Photo", 
      "Photo Captured At", "General Remarks", "Created At"
    ];

    const rows = locations.map((loc) => [
      loc.id,
      loc.site_name || "",
      loc.location || "",
      loc.priority || "",
      loc.status || "",
      loc.surveyor_name || "",
      loc.supervisor_name || "",
      loc.contact_details || "",
      loc.rinex_file ? "Uploaded" : "Not Uploaded",
      loc.latitude || "",
      loc.longitude || "",
      loc.address || "",
      loc.city || "",
      loc.district || "",
      loc.state || "",
      loc.monument_type || "",
      loc.building_stories || "",
      (loc.site_conditions || []).join(" | "),
      loc.ac_grid ? "Yes" : "No",
      loc.ac_grid_distance_meter || "",
      loc.solar_possible ? "Yes" : "No",
      loc.solar_exposure_hours || "",
      (loc.gsm || []).join(" | "),
      (loc.broadband || []).join(" | "),
      (loc.fiber || []).join(" | "),
      (loc.airfiber || []).join(" | "),
      loc.connectivity_remarks || "",
      loc.sky_remarks || "",
      (loc.emi_sources || [])
        .map(e => `${e.source} (${e.direction}, ${e.approx_distance_meter}m)`)
        .join(" | "),
      loc.polar_chart || "",
      loc.north_photo || "",
      loc.east_photo || "",
      loc.south_photo || "",
      loc.west_photo || "",
      loc.photo_captured || "",
      loc.remarks || "",
      loc.created_at || ""
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `location_comparison_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------- STYLES ---------------- */
  const styles = {
    panel: {
      position: "fixed",
      bottom: 10,
      left: "50%",
      transform: "translateX(-50%)",
      background: "linear-gradient(145deg, #0a1929 0%, #0d2135 100%)",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      borderRadius: 16,
      padding: 20,
      width: "75%",
      maxWidth: 1600,
      maxHeight: "60vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 25px 50px -12px rgba(0, 229, 255, 0.25)",
      backdropFilter: "blur(8px)",
      zIndex: 10000
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
      paddingBottom: 12,
      borderBottom: "1px solid rgba(0, 229, 255, 0.2)"
    },
    title: {
      color: "#00e5ff",
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.5px",
      textShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    buttonGroup: {
      display: "flex",
      gap: 8
    },
    exportBtn: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      border: "none",
      padding: "8px 16px",
      borderRadius: 8,
      color: "#fff",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      transition: "all 0.2s ease",
      boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)"
    },
    clearBtn: {
      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      border: "none",
      padding: "8px 16px",
      borderRadius: 8,
      color: "#fff",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      transition: "all 0.2s ease",
      boxShadow: "0 4px 10px rgba(245, 158, 11, 0.3)"
    },
    tableContainer: {
      overflowX: "auto",
      overflowY: "auto",
      flex: 1,
      borderRadius: 12,
      border: "1px solid rgba(0, 229, 255, 0.1)",
      scrollbarWidth: "thin",
      scrollbarColor: "#00e5ff #0a1929"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13,
      color: "#e0f7fa",
      minWidth: 1400
    },
    th: {
      background: "rgba(0, 229, 255, 0.15)",
      padding: "12px 16px",
      fontWeight: 600,
      color: "#00e5ff",
      borderBottom: "2px solid rgba(0, 229, 255, 0.3)",
      textAlign: "left",
      position: "sticky",
      top: 0,
      zIndex: 10,
      backdropFilter: "blur(4px)",
      fontSize: 13
    },
    td: {
      padding: "10px 16px",
      borderBottom: "1px solid rgba(0, 229, 255, 0.1)",
      verticalAlign: "top"
    },
    propertyCell: {
      background: "rgba(0, 229, 255, 0.08)",
      fontWeight: 600,
      color: "#80deea",
      position: "sticky",
      left: 0,
      zIndex: 5,
      borderRight: "1px solid rgba(0, 229, 255, 0.2)"
    },
    badge: {
      padding: "4px 8px",
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      display: "inline-block"
    },
    tag: {
      background: "rgba(0, 229, 255, 0.1)",
      border: "1px solid rgba(0, 229, 255, 0.3)",
      borderRadius: 16,
      padding: "2px 8px",
      fontSize: 11,
      color: "#00e5ff",
      margin: "2px",
      display: "inline-block"
    },
    photoThumb: {
      width: 50,
      height: 40,
      objectFit: "cover",
      borderRadius: 6,
      border: "1px solid rgba(0, 229, 255, 0.3)",
      cursor: "pointer",
      margin: "2px",
      transition: "transform 0.2s ease"
    },
    actionBtn: {
      background: "rgba(0, 229, 255, 0.1)",
      border: "1px solid rgba(0, 229, 255, 0.3)",
      borderRadius: 6,
      padding: "6px 12px",
      color: "#00e5ff",
      fontSize: 12,
      cursor: "pointer",
      transition: "all 0.2s ease",
      margin: "2px"
    },
    removeBtn: {
      background: "rgba(239, 68, 68, 0.1)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      borderRadius: 6,
      padding: "6px 12px",
      color: "#ef4444",
      fontSize: 12,
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    distanceMatrix: {
      marginTop: 16,
      padding: "12px 16px",
      background: "rgba(0, 0, 0, 0.3)",
      borderRadius: 8,
      border: "1px solid rgba(0, 229, 255, 0.2)",
      fontSize: 12,
      color: "#ffd700"
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      zIndex: 999999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    modal: {
      background: "linear-gradient(145deg, #0a1929 0%, #0d2135 100%)",
      border: "1px solid rgba(0, 229, 255, 0.3)",
      borderRadius: 20,
      padding: 32,
      width: 500,
      maxWidth: "90vw",
      maxHeight: "85vh",
      overflowY: "auto",
      boxShadow: "0 25px 50px -12px rgba(0, 229, 255, 0.5)"
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
      transition: "transform 0.1s ease"
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
      border: "1px solid rgba(0, 229, 255, 0.2)"
    },
    controlBtn: {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      borderRadius: "50%",
      width: 44,
      height: 44,
      color: "#00e5ff",
      fontSize: 16,
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

  // Custom scrollbar styles
  const scrollbarStyles = `
    .scrollable::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .scrollable::-webkit-scrollbar-track {
      background: #0a1929;
      border-radius: 10px;
    }
    .scrollable::-webkit-scrollbar-thumb {
      background: #00e5ff;
      border-radius: 10px;
      border: 2px solid #0a1929;
    }
    .scrollable::-webkit-scrollbar-thumb:hover {
      background: #80deea;
    }
  `;

  // Define all rows with proper mapping to normalized data
  const rows = [
    { label: "ID", render: (loc) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{loc.id?.substring(0, 8)}...</span> },
    { label: "Site Name", render: (loc) => loc.site_name || "-" },
    { label: "Location", render: (loc) => loc.location || "-" },
    { label: "Priority", render: (loc) => (
      <span style={{
        color: loc.priority === 1 ? "#ef4444" : loc.priority === 2 ? "#f59e0b" : loc.priority === 3 ? "#10b981" : "#fff",
        fontWeight: 600,
        padding: "2px 8px",
        background: loc.priority === 1 ? "rgba(239, 68, 68, 0.2)" : 
                   loc.priority === 2 ? "rgba(245, 158, 11, 0.2)" : 
                   loc.priority === 3 ? "rgba(16, 185, 129, 0.2)" : "transparent",
        borderRadius: 12
      }}>
        {loc.priority || "-"}
      </span>
    )},
    { label: "Status", render: (loc) => {
      const statusColors = {
        "FINAL_APPROVED": { bg: "rgba(16, 185, 129, 0.2)", color: "#10b981" },
        "SUPERVISOR_APPROVED": { bg: "rgba(59, 130, 246, 0.2)", color: "#3b82f6" },
        "APPROVED": { bg: "rgba(16, 185, 129, 0.2)", color: "#10b981" },
        "REJECTED": { bg: "rgba(239, 68, 68, 0.2)", color: "#ef4444" },
        "PENDING": { bg: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" },
        "SUBMITTED": { bg: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }
      };
      const status = loc.status || "PENDING";
      const colors = statusColors[status] || { bg: "rgba(255, 255, 255, 0.2)", color: "#fff" };
      
      return (
        <span style={{
          ...styles.badge,
          background: colors.bg,
          color: colors.color
        }}>
          {status}
        </span>
      );
    }},
    { label: "Surveyor", render: (loc) => loc.surveyor_name || "-" },
    { label: "Supervisor", render: (loc) => loc.supervisor_name || "-" },
    { label: "Contact", render: (loc) => loc.contact_details || "-" },
    { label: "RINEX File", render: (loc) => (
      <span style={{ color: loc.rinex_file ? "#10b981" : "#ef4444" }}>
        {loc.rinex_file ? "✅ Uploaded" : "❌ Not Uploaded"}
      </span>
    )},
    { label: "Latitude", render: (loc) => loc.latitude || "-" },
    { label: "Longitude", render: (loc) => loc.longitude || "-" },
    { label: "Address", render: (loc) => loc.address || "-" },
    { label: "City", render: (loc) => loc.city || "-" },
    { label: "District", render: (loc) => loc.district || "-" },
    { label: "State", render: (loc) => loc.state || "-" },
    { label: "Monument Type", render: (loc) => loc.monument_type || "-" },
    { label: "Building Stories", render: (loc) => loc.building_stories || "-" },
    { 
      label: "Site Conditions", 
      render: (loc) => (
        <div>
          {(loc.site_conditions || []).length > 0 ? 
            loc.site_conditions.map((cond, idx) => (
              <span key={idx} style={styles.tag}>{cond}</span>
            )) : "-"
          }
        </div>
      )
    },
    { 
      label: "AC Grid", 
      render: (loc) => (
        <span style={{ color: loc.ac_grid ? "#10b981" : "#ef4444" }}>
          {loc.ac_grid ? "Yes" : "No"}
        </span>
      )
    },
    { label: "AC Distance (m)", render: (loc) => loc.ac_grid_distance_meter ? `${loc.ac_grid_distance_meter}m` : "-" },
    { 
      label: "Solar Possible", 
      render: (loc) => (
        <span style={{ color: loc.solar_possible ? "#10b981" : "#ef4444" }}>
          {loc.solar_possible ? "Yes" : "No"}
        </span>
      )
    },
    { label: "Solar Exposure (hrs)", render: (loc) => loc.solar_exposure_hours ? `${loc.solar_exposure_hours} hrs` : "-" },
    { 
      label: "GSM 4G", 
      render: (loc) => (
        <div>
          {(loc.gsm || []).length > 0 ?
            loc.gsm.map((item, idx) => (
              <span key={idx} style={styles.tag}>{item}</span>
            )) : "-"
          }
        </div>
      )
    },
    { 
      label: "Broadband", 
      render: (loc) => (
        <div>
          {(loc.broadband || []).length > 0 ?
            loc.broadband.map((item, idx) => (
              <span key={idx} style={styles.tag}>{item}</span>
            )) : "-"
          }
        </div>
      )
    },
    { 
      label: "Fiber", 
      render: (loc) => (
        <div>
          {(loc.fiber || []).length > 0 ?
            loc.fiber.map((item, idx) => (
              <span key={idx} style={styles.tag}>{item}</span>
            )) : "-"
          }
        </div>
      )
    },
    { 
      label: "Airfiber", 
      render: (loc) => (
        <div>
          {(loc.airfiber || []).length > 0 ?
            loc.airfiber.map((item, idx) => (
              <span key={idx} style={styles.tag}>{item}</span>
            )) : "-"
          }
        </div>
      )
    },
    { label: "Connectivity Remarks", render: (loc) => loc.connectivity_remarks || "-" },
    { label: "Sky Remarks", render: (loc) => loc.sky_remarks || "-" },
    { 
      label: "EMI Sources", 
      render: (loc) => (
        <div>
          {(loc.emi_sources || []).length > 0 ?
            loc.emi_sources.map((source, idx) => (
              <div key={idx} style={{ marginBottom: 4 }}>
                <span style={styles.tag}>{source?.source || "-"}</span>
                <span style={{ ...styles.tag, background: "rgba(255, 215, 0, 0.1)", color: "#ffd700" }}>
                  {source.direction} • {source.approx_distance_meter}m
                </span>
              </div>
            )) : "-"
          }
        </div>
      )
    },
    { 
      label: "Polar Chart", 
      render: (loc) => (
        loc.polar_chart ? (
          <img
            src={buildImageUrl(loc.polar_chart)}
            alt="Polar Chart"
            style={styles.photoThumb}
            onClick={() => openViewer([{
              url: buildImageUrl(loc.polar_chart),
              direction: "Polar Chart"
            }])}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          />
        ) : "Not Available"
      )
    },
    { 
      label: "North Photo", 
      render: (loc) => (
        loc.north_photo ? (
          <img
            src={buildImageUrl(loc.north_photo)}
            alt="North"
            style={styles.photoThumb}
            onClick={() => {
              const photos = [
                { url: buildImageUrl(loc.north_photo), direction: "North" },
                { url: buildImageUrl(loc.east_photo), direction: "East" },
                { url: buildImageUrl(loc.south_photo), direction: "South" },
                { url: buildImageUrl(loc.west_photo), direction: "West" }
              ].filter(p => p.url);
              if (photos.length) openViewer(photos, 0);
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          />
        ) : "-"
      )
    },
    { 
      label: "East Photo", 
      render: (loc) => (
        loc.east_photo ? (
          <img
            src={buildImageUrl(loc.east_photo)}
            alt="East"
            style={styles.photoThumb}
            onClick={() => {
              const photos = [
                { url: buildImageUrl(loc.north_photo), direction: "North" },
                { url: buildImageUrl(loc.east_photo), direction: "East" },
                { url: buildImageUrl(loc.south_photo), direction: "South" },
                { url: buildImageUrl(loc.west_photo), direction: "West" }
              ].filter(p => p.url);
              if (photos.length) openViewer(photos, 1);
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          />
        ) : "-"
      )
    },
    { 
      label: "South Photo", 
      render: (loc) => (
        loc.south_photo ? (
          <img
            src={buildImageUrl(loc.south_photo)}
            alt="South"
            style={styles.photoThumb}
            onClick={() => {
              const photos = [
                { url: buildImageUrl(loc.north_photo), direction: "North" },
                { url: buildImageUrl(loc.east_photo), direction: "East" },
                { url: buildImageUrl(loc.south_photo), direction: "South" },
                { url: buildImageUrl(loc.west_photo), direction: "West" }
              ].filter(p => p.url);
              if (photos.length) openViewer(photos, 2);
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          />
        ) : "-"
      )
    },
    { 
      label: "West Photo", 
      render: (loc) => (
        loc.west_photo ? (
          <img
            src={buildImageUrl(loc.west_photo)}
            alt="West"
            style={styles.photoThumb}
            onClick={() => {
              const photos = [
                { url: buildImageUrl(loc.north_photo), direction: "North" },
                { url: buildImageUrl(loc.east_photo), direction: "East" },
                { url: buildImageUrl(loc.south_photo), direction: "South" },
                { url: buildImageUrl(loc.west_photo), direction: "West" }
              ].filter(p => p.url);
              if (photos.length) openViewer(photos, 3);
            }}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          />
        ) : "-"
      )
    },
    { 
      label: "Photo Captured", 
      render: (loc) => (
        loc.photo_captured ? 
          new Date(loc.photo_captured).toLocaleString() : "-"
      )
    },
    { label: "Remarks", render: (loc) => loc.remarks || "-" },
    { label: "Created At", render: (loc) => 
      loc.created_at ? new Date(loc.created_at).toLocaleString() : "-"
    },
    { 
      label: "Actions", 
      render: (loc) => (
        <div style={{ display: "flex", gap: 4, flexDirection: "column" }}>
{canApprove && loc.status !== "FINAL_APPROVED" && (            <button
              onClick={() => openApprovalModal(loc)}
              style={styles.actionBtn}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(0, 229, 255, 0.2)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(0, 229, 255, 0.1)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              ⚖️ Approve/Reject
            </button>
          )}
          <button
            onClick={() => handleRemove(loc.id)}
            style={styles.removeBtn}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.2)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.1)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            ✕ Remove
          </button>
        </div>
      )
    }
  ];

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <style>{scrollbarStyles}</style>
      
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <span>📍</span>
            Location Comparison ({locations.length})
          </div>
          <div style={styles.buttonGroup}>
            <button
              onClick={handleExportCSV}
              style={styles.exportBtn}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              <span>📊</span>
              Export CSV
            </button>
            <button
              onClick={handleClear}
              style={styles.clearBtn}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              <span>🗑️</span>
              Clear All
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="scrollable" style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Property</th>
                {locations.map((loc) => (
                  <th key={loc.id} style={styles.th}>
                    <div style={{ fontWeight: 700 }}>{loc.site_name || loc.location || "Unnamed"}</div>
                    <div style={{ fontSize: 10, marginTop: 4, opacity: 0.8 }}>
                      ID: {loc.id?.substring(0, 8)}...
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.label}>
                  <td style={{...styles.td, ...styles.propertyCell}}>
                    {row.label}
                  </td>
                  {locations.map((loc) => (
                    <td key={loc.id + row.label} style={styles.td}>
                      {row.render(loc)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Distance Matrix */}
        {distanceMatrix.length > 0 && (
          <div style={styles.distanceMatrix}>
            <strong style={{ color: "#00e5ff", display: "block", marginBottom: 8 }}>
              📏 Distances Between Locations
            </strong>
            {distanceMatrix.map((d, i) => (
              <div key={i} style={{ marginBottom: 4 }}>{d.text}</div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedLocation && createPortal(
        <div style={styles.modalOverlay} onClick={closeApprovalModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ color: "#00e5ff", fontSize: 20, fontWeight: 700 }}>
                ⚖️ {selectedLocation.site_name || selectedLocation.location}
              </div>
              <button
                onClick={closeApprovalModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "#80deea",
                  fontSize: 20,
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#80deea", display: "block", marginBottom: 8 }}>
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 229, 255, 0.2)",
                  borderRadius: 8,
                  color: "#e0f7fa",
                  fontSize: 14,
                  resize: "vertical"
                }}
                placeholder="Add your remarks here..."
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "#80deea", display: "block", marginBottom: 8 }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(0, 229, 255, 0.2)",
                  borderRadius: 8,
                  color: "#e0f7fa",
                  fontSize: 14
                }}
              >
                <option value={1}>🔴 High Priority (1)</option>
                <option value={2}>🟡 Medium Priority (2)</option>
                <option value={3}>🟢 Low Priority (3)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => handleApproval("APPROVED")}
disabled={isSubmitting || selectedLocation.status === "FINAL_APPROVED"}        
        style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  color: "#fff",
                  padding: "14px",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: "all 0.2s ease"
                }}
              >
                {isSubmitting ? "Processing..." : "✓ APPROVE"}
              </button>
              <button
                onClick={() => handleApproval("REJECTED")}
disabled={isSubmitting || selectedLocation.status === "FINAL_APPROVED"}    
            style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  border: "none",
                  color: "#fff",
                  padding: "14px",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: "all 0.2s ease"
                }}
              >
                {isSubmitting ? "Processing..." : "✕ REJECT"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image Viewer */}
      {viewerImages.length > 0 && createPortal(
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
              <button style={styles.controlBtn} onClick={prevImage}>◀</button>
              <button style={styles.controlBtn} onClick={nextImage}>▶</button>
              
              <div style={{ width: 1, height: 30, background: "rgba(0, 229, 255, 0.2)" }} />
              
              <button style={styles.controlBtn} onClick={zoomIn}>＋</button>
              <button style={styles.controlBtn} onClick={zoomOut}>－</button>
              <button style={styles.controlBtn} onClick={resetZoom}>1:1</button>
              
              <div style={{ width: 1, height: 30, background: "rgba(0, 229, 255, 0.2)" }} />
              
              <button style={styles.controlBtn} onClick={rotateLeft}>⟲</button>
              <button style={styles.controlBtn} onClick={rotateRight}>⟳</button>
              <button style={styles.controlBtn} onClick={resetRotation}>↻</button>
              
              <div style={{ width: 1, height: 30, background: "rgba(0, 229, 255, 0.2)" }} />
              
              <button 
                style={{...styles.controlBtn, color: "#ef4444"}} 
                onClick={closeViewer}
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

export default LocationComparisonPanel;