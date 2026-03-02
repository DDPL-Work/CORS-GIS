import React, { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { calculateDistance } from "../../utils/geoUtils";
import { createPortal } from "react-dom";
import { APPROVAL_ROLES } from "../../config/roleConfig";

const LocationComparisonPanel = () => {
  const { state, dispatch } = useApp();

  const canApprove = APPROVAL_ROLES.includes(state?.auth?.role);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [viewerImage, setViewerImage] = React.useState(null);
  const [rotation, setRotation] = React.useState(0);

const locations = state.comparedLocations || [];

const handleRemove = (id) => {
  dispatch({ type: "REMOVE_COMPARE_LOCATION", payload: id });
};

const handleClear = () => {
  dispatch({ type: "CLEAR_COMPARE" });
};
  const openViewer = (img) => {
    setViewerImage(img);
    setRotation(0);
  };

  const closeViewer = () => {
    setViewerImage(null);
    setRotation(0);
  };

  const rotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const rotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const buildImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") closeViewer();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  /* -------------------- DISTANCE MATRIX -------------------- */
/* Always call hooks */
const distanceMatrix = useMemo(() => {
  const results = [];
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const a = locations[i];
      const b = locations[j];

      if (
        isFinite(a.latitude) &&
        isFinite(a.longitude) &&
        isFinite(b.latitude) &&
        isFinite(b.longitude)
      ) {
        const d = calculateDistance(
          a.latitude,
          a.longitude,
          b.latitude,
          b.longitude
        );

        results.push(
          `${a.location} ↔ ${b.location} = ${d.toFixed(3)} km`
        );
      }
    }
  }

  return results;
}, [locations]);

/* AFTER hooks */
if (locations.length === 0) return null;
  /* -------------------- CSV EXPORT -------------------- */
  const handleExportCSV = () => {
    const headers = [
      "Location",
      "Latitude",
      "Longitude",
      "State",
      "District",
      "Monument Type",
      "AC Grid",
      "Solar",
      "Solar Exposure Hours",
      "GSM",
      "Broadband",
      "Fiber",
      "Priority",
      "Created At"
    ];

    const rows = locations.map((loc) => [
      loc.location,
      loc.latitude,
      loc.longitude,
      loc.state,
      loc.district,
      loc.monument_type,
      loc.ac_grid ? "Yes" : "No",
      loc.solar_possible ? "Yes" : "No",
      loc.solar_exposure_hours,
      (loc.gsm || []).join(" | "),
      (loc.broadband || []).join(" | "),
      (loc.fiber || []).join(" | "),
      loc.priority,
      loc.created_at
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell ?? ""}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "location_comparison.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(13,27,42,0.97)",
        border: "1px solid #00e5ff44",
        borderRadius: 10,
        padding: 16,
        width: "95%",
        maxWidth: 1400,
        maxHeight: "55vh",
        overflowY: "auto",
        zIndex: 10000
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12
        }}
      >
        <h3 style={{ color: "#00e5ff", margin: 0 }}>
          Location Comparison ({locations.length})
        </h3>

        <div>
          <button
            onClick={handleExportCSV}
            style={{
              marginRight: 8,
              background: "#00e676",
              border: "none",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Export CSV
          </button>

          <button
            onClick={handleClear}
            style={{
              background: "#ff9800",
              border: "none",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* TABLE */}
   <table
  style={{
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 13,
    color: "#e0f7fa",
    overflow: "hidden",
    borderRadius: 8
  }}
>
  <thead>
    <tr
      style={{
        background: "linear-gradient(90deg, #00e5ff22, #00e5ff11)",
        backdropFilter: "blur(6px)",
        position: "sticky",
        top: 0,
        zIndex: 5
      }}
    >
      <th
        style={{
          textAlign: "left",
          padding: "10px 12px",
          fontWeight: 700,
          color: "#00e5ff",
          borderBottom: "2px solid #00e5ff55"
        }}
      >
        Property
      </th>

      {locations.map((loc) => (
        <th
          key={loc.id}
          style={{
            padding: "10px 12px",
            fontWeight: 700,
            color: "#00e5ff",
            borderBottom: "2px solid #00e5ff55",
            textAlign: "center"
          }}
        >
          {loc.location}
        </th>
      ))}
    </tr>
  </thead>

  <tbody>
    {[
      { label: "Latitude", render: (loc) => loc.latitude },
      { label: "Longitude", render: (loc) => loc.longitude },
      {
        label: "Address",
        render: (loc) =>
          `${loc.address || ""}, ${loc.city || ""}, ${loc.district || ""}, ${loc.state || ""}`
      },
      {
        label: "Monument Type",
        render: (loc) => loc.monument?.monument_type || "-"
      },
      {
        label: "Building Stories",
        render: (loc) => loc.monument?.building_stories || "-"
      },
      {
        label: "AC Grid",
        render: (loc) => (loc.power?.ac_grid ? "Yes" : "No")
      },
      {
        label: "AC Grid Distance (m)",
        render: (loc) => loc.power?.ac_grid_distance_meter || "-"
      },
      {
        label: "Solar Possible",
        render: (loc) => (loc.power?.solar_possible ? "Yes" : "No")
      },
      {
        label: "Solar Exposure (hrs)",
        render: (loc) => loc.power?.solar_exposure_hours || "-"
      },
      {
        label: "GSM",
        render: (loc) =>
          (loc.connectivity?.gsm_4g || []).join(", ") || "-"
      },
      {
        label: "Broadband",
        render: (loc) =>
          (loc.connectivity?.broadband || []).join(", ") || "-"
      },
      {
        label: "Fiber",
        render: (loc) =>
          (loc.connectivity?.fiber || []).join(", ") || "-"
      },
      {
        label: "Sky Remarks",
        render: (loc) => loc.sky_visibility?.remarks || "-"
      },
     {
  label: "Polar Chart",
  render: (loc) =>
    loc.sky_visibility?.polar_chart_image ? (
      <img
      
        src={`${BASE_URL}${loc.sky_visibility.polar_chart_image}`}
        alt="polar"
        onClick={() =>
          openViewer(`${BASE_URL}${loc.sky_visibility.polar_chart_image}`)
        }
        style={{
          width: 90,
          borderRadius: 6,
          boxShadow: "0 0 8px #00e5ff55",
          cursor: "pointer"
        }}
      />
    ) : "-"
},
      {
        label: "Photos",
        render: (loc) => (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["north_photo", "east_photo", "south_photo", "west_photo"].map(
              (dir) =>
                loc.photos?.[dir] ? (
                 <img
  key={dir}
  src={`${BASE_URL}${loc.photos[dir]}`}
  alt={dir}
  onClick={() =>
    openViewer(`${BASE_URL}${loc.photos[dir]}`)
  }
  style={{
    width: 55,
    height: 45,
    objectFit: "cover",
    borderRadius: 4,
    border: "1px solid #00e5ff33",
    cursor: "pointer"
  }}
/>
                ) : null
            )}
          </div>
        )
      },
      {
        label: "Priority",
        render: (loc) => loc.priority
      },
      {
        label: "Remove",
        render: (loc) => (
          <button
            onClick={() => handleRemove(loc.id)}
            style={{
              background: "#ff5252",
              border: "none",
              padding: "4px 10px",
              borderRadius: 4,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            ✕
          </button>
        )
      }
    ].map((row, rowIndex) => (
      <tr
        key={row.label}
        style={{
          background:
            rowIndex % 2 === 0
              ? "rgba(255,255,255,0.02)"
              : "rgba(255,255,255,0.01)",
          transition: "background 0.2s"
        }}
      >
        <td
          style={{
            padding: "8px 12px",
            fontWeight: 600,
            color: "#80deea",
            borderBottom: "1px solid #ffffff10"
          }}
        >
          {row.label}
        </td>

        {locations.map((loc) => (
          <td
            key={loc.id + row.label}
            style={{
              padding: "8px 12px",
              textAlign: "center",
              borderBottom: "1px solid #ffffff10"
            }}
          >
            {row.render(loc)}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>

      {/* DISTANCE MATRIX */}
      {distanceMatrix.length > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 10,
            background: "#00e5ff11",
            borderRadius: 6,
            fontSize: 11,
            color: "#ffd700"
          }}
        >
          <strong>Distances Between Selected Locations:</strong>
          {distanceMatrix.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
      )}
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
    </div>
  );
};

export default LocationComparisonPanel;