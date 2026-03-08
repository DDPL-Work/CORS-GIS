import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  calculateDistance,
  calculateBearing,
  calculateAngle,
} from "../../utils/geoUtils";
import {
  calculateTriangleArea,
  getTriangleType,
  midpoint,
} from "../../utils/triangleUtils";
import {
  getStationsByRole,
  getLocationsByStations,
} from "../../utils/roleUtils";
import LeafletMap from "./LeafletMap";
import SelectionGuide from "./SelectionGuide";
import LocationComparisonPanel from "../panels/LocationComparisonPanel";

const GISMap = () => {
  const { state, dispatch } = useApp();
  const mapRef = useRef(null);
  const layersRef = useRef({
    stations: [],
    locations: [],
    circles: [],
    lines: [],
    toolMarkers: [],
    triangleOverlay: [],
  });

  // explicit readiness flag so effects don't run too early
  const [mapReady, setMapReady] = useState(false);
const [mapMoving, setMapMoving] = useState(false);
const visibleStations = useMemo(() => {
  const {
    viewStationsMode,
    establishedStations,
    selectedStations,
    hierarchySites,
  } = state;

  const result = [];

  // 🛰 Established CORS Stations
  if (viewStationsMode) {
    if (!Array.isArray(establishedStations)) return [];

    establishedStations.forEach(st => {
      const lat = Number(st.latitude);
      const lng = Number(st.longitude);

      if (!isFinite(lat) || !isFinite(lng)) return;

      result.push({
        id: st.id,
        name: st.name,
        code: st.code,
        lat,
        lng,
        height: st.height,
        district: st.district,
        type: "established_station",
        originalData: st
      });
    });

    return result;
  }

  // 🏗 Proposed / Surveyed Stations (Sites)
  if (Array.isArray(hierarchySites)) {

    hierarchySites.forEach(site => {

      if (!selectedStations.includes(site.id)) return;

      const lat = Number(site.latitude);
      const lng = Number(site.longitude);

      if (!isFinite(lat) || !isFinite(lng)) return;

      result.push({
        id: site.id,
        name: site.site_name,
        lat,
        lng,
        status: site.status?.toLowerCase() || "pending",
        state: site.location_details?.state,
        district: site.location_details?.district,
        type: "station",
        originalData: site
      });

    });

  }

  return result;

}, [
  state.viewStationsMode,
  state.establishedStations,
  state.selectedStations,
  state.hierarchySites
]);

const visibleLocations = useMemo(() => {

  const result = [];

  if (!Array.isArray(state.hierarchySites)) return result;

  state.hierarchySites.forEach(site => {

    if (!Array.isArray(site.subsites)) return;

    site.subsites.forEach(sub => {

      if (!state.selectedStations.includes(sub.id)) return;

      const lat = Number(sub.location_details?.latitude);
      const lng = Number(sub.location_details?.longitude);

      if (!isFinite(lat) || !isFinite(lng)) return;

      result.push({
        id: sub.id,
        name: sub.location,
        lat,
        lng,
        status: sub.status?.toLowerCase() || "pending",
        stationName: site.site_name,
        type: "location",
        originalData: sub
      });

    });

  });

  return result;

}, [state.hierarchySites, state.selectedStations]);

  const addNamedPoint = useCallback(
    (pt) => {
      if (!state.mapTool || state.mapTool === "view") return;
      if (state.mapTool === "angle" && state.toolPoints.length >= 3) return;
      const alreadyExists = state.toolPoints.some(
        (p) => p.entityId === pt.entityId
      );
      if (alreadyExists) return;
      dispatch({ type: "ADD_TOOL_POINT", payload: pt });
    },
    [state.mapTool, state.toolPoints, dispatch]
  );

const onMapReady = useCallback((map) => {
  mapRef.current = map;

  map.on("movestart zoomstart", () => {
    setMapMoving(true);
  });

  map.on("moveend zoomend", () => {
    setMapMoving(false);
  });

  setMapReady(true);
}, []);
  // Click binding/cursor
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapMoving) return;
    if (!mapRef.current.getSize()?.x) return;
    mapRef.current.off("click");
    if (
      state.mapTool &&
      state.mapTool !== "view" &&
      state.mapTool !== "viewStations"
    ) {
      if (state.mapTool === "compare") {
        // For compare, don't add click points, selection is via markers
        mapRef.current.getContainer().style.cursor = "pointer";
      } else {
        mapRef.current.on("click", (e) => {
          if (state.mapTool === "angle" && state.toolPoints.length >= 3) return;
          const point = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            label: `P${Date.now()}`,
            name: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
            entityId: `click_${Date.now()}`,
            entityType: "custom",
          };
          dispatch({ type: "ADD_TOOL_POINT", payload: point });
        });
        mapRef.current.getContainer().style.cursor = "crosshair";
      }
    } else {
      mapRef.current.getContainer().style.cursor = "";
    }
  }, [state.mapTool, state.toolPoints.length, mapReady]);

  // Stations/locations rendering
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapMoving) return;

    const established = Array.isArray(state.establishedStations)
      ? state.establishedStations
      : [];

    console.log("Established Stations:", established.length);
    console.log("Visible Stations:", visibleStations?.length || 0);

    const L = window.L;
    if (!L) return;

    try {
      [
        ...layersRef.current.stations,
        ...layersRef.current.circles,
        ...layersRef.current.locations,
      ].forEach((l) => {
        try {
          if (
            l &&
            mapRef.current &&
            typeof mapRef.current.hasLayer === "function" &&
            mapRef.current.hasLayer(l)
          ) {
            mapRef.current.removeLayer(l);
          }
        } catch (err) {
          console.warn("Error removing layer:", err);
        }
      });
      layersRef.current = {
        ...layersRef.current,
        stations: [],
        circles: [],
        locations: [],
      };
    } catch (err) {
      console.error("Error in layer cleanup:", err);
      layersRef.current = {
        stations: [],
        circles: [],
        locations: [],
        lines: [],
        toolMarkers: [],
        triangleOverlay: [],
      };
    }

    const toolActive = state.mapTool && state.mapTool !== "view";
    const selectedEntityIds = state.toolPoints.map((p) => p.entityId);

    visibleStations.forEach((station) => {
      if (!station) return;
      // const lat = station.lat ?? station.latitude;
      // const lng = station.lng ?? station.longitude;

      //2
      const lat = Number(station.lat ?? station.latitude);
      const lng = Number(station.lng ?? station.longitude);

      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        isNaN(lat) ||
        isNaN(lng)
      )
        return;
      const isSelected = selectedEntityIds.includes(station.id);
      const isViewStations = state.viewStationsMode;
      const pulseRing = isSelected
        ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid #ff9800;animation:pulse-ring 1.2s ease-out infinite;opacity:0.7"></div>`
        : isViewStations
        ? `<div style="position:absolute;inset:-4px;border-radius:50%;"></div>`
        // ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #2196f3;animation:pulse-ring 2s ease-out infinite;opacity:0.5"></div>`
        : "";
   const baseColor = isViewStations
  ? "#2196f3"
: station.type === "location"
? "#7c4dff"
  : station.status === "active"
  ? "#00e5ff"
  : "#ff6b6b";
      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:${
          isSelected ? 18 : 14
        }px;height:${isSelected ? 18 : 14}px">
          ${pulseRing}
          <div style="width:100%;height:100%;border-radius:50%;background:${
            isSelected ? "#ff9800" : baseColor
          };border:2px solid white;box-shadow:0 0 ${
          isSelected ? 14 : isViewStations ? 12 : 8
        }px ${isSelected ? "#ff9800" : baseColor};transition:all 0.2s"></div>
        </div>`,
        iconSize: [isSelected ? 18 : 14, isSelected ? 18 : 14],
        iconAnchor: [isSelected ? 9 : 7, isSelected ? 9 : 7],
      });

      try {
        const marker = L.marker([lat, lng], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        }).addTo(mapRef.current);

        const toolHint = toolActive
          ? `<br><span style="color:#ff9800;font-weight:700">▶ Click to ${
              selectedEntityIds.includes(station.id)
                ? "SELECTED ✓"
                : "select as Point " + (state.toolPoints.length + 1)
            }</span>`
          : "";
     const data = station.originalData || {};

let tooltipHTML = "";

if (station.type === "established_station") {

tooltipHTML = `
<div style="line-height:1.5">
<b>${data.name}</b><br>
<b>Code:</b> ${data.code}<br>
<b>Latitude:</b> ${data.latitude}<br>
<b>Longitude:</b> ${data.longitude}<br>
<b>Height:</b> ${data.height} m
</div>
`;

}

else if (station.type === "station") {

tooltipHTML = `
<div style="line-height:1.5">
<b>${data.site_name}</b><br>
<b>State:</b> ${data.location_details?.state || "-"}<br>
<b>District:</b> ${data.location_details?.district || "-"}<br>
<b>Status:</b> ${data.status || "-"}
</div>
`;

}

marker.bindTooltip(tooltipHTML,{
  className:"gis-tooltip",
  sticky:true
});

 if (state.mapTool === "compare") {
  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);

    if (station.originalData) {
      dispatch({
        type: "ADD_COMPARE_LOCATION",
        payload: station.originalData
      });
    }
  });
}
else if (toolActive) {
  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    addNamedPoint({
      lat,
      lng,
      label: station.name,
      name: station.name,
      entityId: station.id,
      entityType: "station",
    });
  });
} else {
  marker.on("click", () => {
  if (station.type === "location" && station.originalData) {
    dispatch({
      type: "SET_NOTIFICATION",
      payload: {
        type: "location_detail",
        location: station.originalData,
      },
    });
  }
});
}

        layersRef.current.stations.push(marker);

        // Coverage circle: 2 km, translucent (not opaque), station-level only
       // ✅ Only draw circle for real established stations
if (station.type === "station") {
  try {
    const circle = L.circle([lat, lng], {
      radius: 2000,
      color: "#ff4444",
      fillColor: "#ff4444",
      fillOpacity: 0.1,
      weight: 1.5,
      dashArray: "4 4",
    }).addTo(mapRef.current);

    layersRef.current.circles.push(circle);
  } catch (err) {
    console.warn("Circle failed for", station.id, err);
  }
}
      } catch (err) {
        console.warn(
          "Error creating station marker/circle for",
          station.id,
          err
        );
      }
    });

    visibleLocations.forEach((loc) => {
      if (!loc) return;
      if (
        typeof loc.lat !== "number" ||
        typeof loc.lng !== "number" ||
        isNaN(loc.lat) ||
        isNaN(loc.lng)
      )
        return;
      const colorMap = {
        pending: "#ffd700",
        approved: "#00e676",
        rejected: "#ff5252",
      };
      const color = colorMap[loc.status] || "#836eb5";
      const isSelected = selectedEntityIds.includes(loc.id);

      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:${
          isSelected ? 14 : 10
        }px;height:${
          isSelected ? 14 : 10
        }px;display:flex;align-items:center;justify-content:center">
          ${
            isSelected
              ? `<div style="position:absolute;inset:-5px;border:2px solid #ff9800;transform:rotate(45deg);animation:pulse-ring 1.2s ease-out infinite;opacity:0.7"></div>`
              : ""
          }
          <div style="width:${isSelected ? 14 : 10}px;height:${
          isSelected ? 14 : 10
        }px;border-radius:2px;background:${
          isSelected ? "#ff9800" : color
        };border:1.5px solid white;transform:rotate(45deg);box-shadow:0 0 ${
          isSelected ? 12 : 6
        }px ${isSelected ? "#ff9800" : color};transition:all 0.2s"></div>
        </div>`,
        iconSize: [isSelected ? 14 : 10, isSelected ? 14 : 10],
        iconAnchor: [isSelected ? 7 : 5, isSelected ? 7 : 5],
      });

      try {
        const marker = L.marker([loc.lat, loc.lng], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        }).addTo(mapRef.current);

        const toolHint = toolActive
          ? `<br><span style="color:#ff9800;font-weight:700">▶ ${
              selectedEntityIds.includes(loc.id)
                ? "SELECTED ✓"
                : "Click to select as Point " + (state.toolPoints.length + 1)
            }</span>`
          : "";
      const locData = loc.originalData || {};

marker.bindTooltip(`
<div style="line-height:1.5">
<b>${locData.location}</b><br>
<b>Station:</b> ${loc.stationName || "-"}<br>
<b>State:</b> ${locData.location_details?.state || "-"}<br>
<b>District:</b> ${locData.location_details?.district || "-"}<br>
<b>Latitude:</b> ${loc.lat.toFixed(5)}<br>
<b>Longitude:</b> ${loc.lng.toFixed(5)}<br>
<b>Status:</b> ${loc.status}
</div>
`,{
  className:"gis-tooltip",
  sticky:true
});

        if (toolActive && state.mapTool !== "compare") {
          marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            addNamedPoint({
              lat: loc.lat,
              lng: loc.lng,
              label: loc.name,
              name: loc.name,
              entityId: loc.id,
              entityType: "location",
            });
          });
        } else if (state.mapTool === "compare") {
          marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
dispatch({
  type: "ADD_COMPARE_LOCATION",
  payload: loc.originalData || loc
});      });
        } else {
    marker.on("click", () => {
  dispatch({
    type: "SET_NOTIFICATION",
    payload: {
      type: "location_detail",
      location: loc.originalData || loc, // ✅ CORRECT OBJECT
    },
  });
});
        }

        layersRef.current.locations.push(marker);
      } catch (err) {
        console.warn("Error creating location marker for", loc.id, err);
      }
    });
  }, [
    visibleStations,
    visibleLocations,
    state.mapTool,
    state.toolPoints,
    mapReady,
  ]);

  // Tool layers rendering (distance/angle overlays)
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapMoving) return;
    const L = window.L;
    if (!L) return;

    try {
      [
        ...layersRef.current.toolMarkers,
        ...layersRef.current.lines,
        ...layersRef.current.triangleOverlay,
      ].forEach((l) => {
        try {
          if (
            l &&
            mapRef.current &&
            typeof mapRef.current.hasLayer === "function" &&
            mapRef.current.hasLayer(l)
          ) {
            mapRef.current.removeLayer(l);
          }
        } catch (err) {
          console.warn("Error removing tool layer:", err);
        }
      });
      layersRef.current.toolMarkers = [];
      layersRef.current.lines = [];
      layersRef.current.triangleOverlay = [];
    } catch (err) {
      console.error("Error in tool layer cleanup:", err);
      layersRef.current.toolMarkers = [];
      layersRef.current.lines = [];
      layersRef.current.triangleOverlay = [];
    }

    const pts = state.toolPoints;
if (!pts || pts.length === 0) return;
    // Numbered point markers
    pts
      .filter(
        (pt) =>
          pt &&
          typeof pt.lat === "number" &&
          typeof pt.lng === "number" &&
          !isNaN(pt.lat) &&
          !isNaN(pt.lng)
      )
      .forEach((pt, i) => {
        const colors = ["#ff9800", "#e040fb", "#00e5ff"];
        const color = colors[i % colors.length];
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};color:#000;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;border:2px solid white;box-shadow:0 0 10px ${color}">${
            i + 1
          }</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        try {
          const m = L.marker([pt.lat, pt.lng], {
            icon,
            zIndexOffset: 2000,
          }).addTo(mapRef.current);
          if (m) layersRef.current.toolMarkers.push(m);
        } catch (err) {
          console.warn("Error creating tool marker at", pt.lat, pt.lng, err);
        }
      });

    // Distance tool: always draw a line between the last two selected points; keep fallback from state.distances
    if (state.mapTool === "distance") {
      const validPts = pts.filter(
        (p) =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          !isNaN(p.lat) &&
          !isNaN(p.lng)
      );
      if (validPts.length >= 2) {
        // Draw only the latest segment between the last two points so it's always visible for 2-point measures
        const lastTwo = validPts.slice(-2).map((p) => [p.lat, p.lng]);
        try {
          const line = L.polyline(lastTwo, {
            color: "#ff9800",
            weight: 3,
            dashArray: "6 4",
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(mapRef.current);
          if (line) layersRef.current.lines.push(line);
        } catch (err) {
          console.error(
            "Error creating distance polyline from toolPoints:",
            err
          );
        }
      }

      // Also render from computed distances (fallback if points were cleared)
      if (Array.isArray(state.distances) && state.distances.length > 0) {
        state.distances.forEach((d) => {
          if (!d || !d.a || !d.b) return;
          const a = d.a,
            b = d.b;
          if (
            [a.lat, a.lng, b.lat, b.lng].some(
              (v) => typeof v !== "number" || isNaN(v)
            )
          )
            return;
          try {
            const line = L.polyline(
              [
                [a.lat, a.lng],
                [b.lat, b.lng],
              ],
              {
                color: "#ff9800",
                weight: 3,
                dashArray: "6 4",
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }
            ).addTo(mapRef.current);
            if (line) layersRef.current.lines.push(line);
          } catch (err) {
            console.error(
              "Error creating distance polyline from state.distances:",
              err
            );
          }
        });
      }

      // Midpoint labels for distances (if available)
      if (Array.isArray(state.distances)) {
        state.distances.forEach((d) => {
          if (!d || !d.a || !d.b) return;
          if (
            typeof d.a.lat !== "number" ||
            typeof d.a.lng !== "number" ||
            typeof d.b.lat !== "number" ||
            typeof d.b.lng !== "number"
          )
            return;
          if (
            isNaN(d.a.lat) ||
            isNaN(d.a.lng) ||
            isNaN(d.b.lat) ||
            isNaN(d.b.lng)
          )
            return;

          const mid = midpoint(d.a, d.b);
          if (
            typeof mid.lat !== "number" ||
            typeof mid.lng !== "number" ||
            isNaN(mid.lat) ||
            isNaN(mid.lng)
          )
            return;

          const bearing = calculateBearing(d.a.lat, d.a.lng, d.b.lat, d.b.lng);
          const distLabel = L.divIcon({
            className: "",
            html: `<div style="background:rgba(13,27,42,0.92);border:1px solid #ff9800;color:#ff9800;padding:2px 7px;border-radius:10px;font-size:10px;font-family:monospace;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px #ff980055">
              ${d.distance.toFixed(3)} km | ${bearing.toFixed(1)}°
            </div>`,
            iconSize: [100, 20],
            iconAnchor: [50, 10],
          });
          try {
            const lm = L.marker([mid.lat, mid.lng], {
              icon: distLabel,
              zIndexOffset: 1500,
            }).addTo(mapRef.current);
            if (lm) layersRef.current.triangleOverlay.push(lm);
          } catch (err) {
            console.warn("Error creating distance label marker:", err);
          }
        });
      }
    }

    // Angle tool
    if (
      state.mapTool === "angle" &&
      pts.length === 3 &&
      pts.every(
        (p) =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          !isNaN(p.lat) &&
          !isNaN(p.lng)
      )
    ) {
      const [A, B, C] = pts;

      try {
        const polygon = L.polygon(
          [
            [A.lat, A.lng],
            [B.lat, B.lng],
            [C.lat, C.lng],
          ],
          {
            color: "#e040fb",
            fillColor: "#e040fb",
            fillOpacity: 0.12,
            weight: 2,
            dashArray: "0",
            opacity: 0.85,
          }
        ).addTo(mapRef.current);
        if (polygon) layersRef.current.triangleOverlay.push(polygon);
      } catch (err) {
        console.warn("Error creating triangle polygon:", err);
        return;
      }

      const sides = [
        { from: A, to: B, label: "AB" },
        { from: B, to: C, label: "BC" },
        { from: C, to: A, label: "CA" },
      ];
      sides.forEach(({ from, to, label }) => {
        if (!from || !to) return;
        if (
          typeof from.lat !== "number" ||
          typeof from.lng !== "number" ||
          typeof to.lat !== "number" ||
          typeof to.lng !== "number"
        )
          return;
        if (
          isNaN(from.lat) ||
          isNaN(from.lng) ||
          isNaN(to.lat) ||
          isNaN(to.lng)
        )
          return;

        const dist = calculateDistance(from.lat, from.lng, to.lat, to.lng);
        const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng);
        const mid = midpoint(from, to);

        if (
          typeof mid.lat !== "number" ||
          typeof mid.lng !== "number" ||
          isNaN(mid.lat) ||
          isNaN(mid.lng)
        )
          return;

        const sideIcon = L.divIcon({
          className: "",
          html: `<div style="background:rgba(13,27,42,0.93);border:1px solid #e040fb;color:#e040fb;padding:3px 8px;border-radius:10px;font-size:10px;font-family:monospace;font-weight:700;white-space:nowrap;box-shadow:0 2px 10px #e040fb55;text-align:center">
            <span style="color:#fff;font-size:9px">${label} </span>${dist.toFixed(
            3
          )} km<br>
            <span style="color:#ce93d8;font-size:9px">↗ ${bearing.toFixed(
              1
            )}°</span>
          </div>`,
          iconSize: [130, 36],
          iconAnchor: [65, 18],
        });
        try {
          const lm = L.marker([mid.lat, mid.lng], {
            icon: sideIcon,
            zIndexOffset: 1500,
          }).addTo(mapRef.current);
          if (lm) layersRef.current.triangleOverlay.push(lm);
        } catch (err) {
          console.warn("Error creating side label marker:", err);
        }
      });

      const angleA = calculateAngle(B, A, C);
      const angleB = calculateAngle(A, B, C);
      const angleC = calculateAngle(A, C, B);
      const vertexAngles = [
        {
          pt: A,
          angle: angleA,
          label: pts[0].name || "A",
          offsetLat: -0.004,
          offsetLng: -0.008,
        },
        {
          pt: B,
          angle: angleB,
          label: pts[1].name || "B",
          offsetLat: 0.004,
          offsetLng: 0,
        },
        {
          pt: C,
          angle: angleC,
          label: pts[2].name || "C",
          offsetLat: -0.004,
          offsetLng: 0.008,
        },
      ];
      vertexAngles.forEach(({ pt, angle }) => {
        if (!pt || typeof pt.lat !== "number" || typeof pt.lng !== "number")
          return;
        if (isNaN(pt.lat) || isNaN(pt.lng)) return;
        if (typeof angle !== "number" || isNaN(angle)) return;

        const angleIcon = L.divIcon({
          className: "",
          html: `<div style="background:rgba(224,64,251,0.15);border:1.5px solid #e040fb;color:#fff;padding:4px 9px;border-radius:8px;font-size:10px;font-family:monospace;font-weight:700;white-space:nowrap;box-shadow:0 2px 12px #e040fb77;backdrop-filter:blur(4px)">
            <span style="color:#e040fb;font-size:9px">∠ </span><span style="color:#ffd700">${angle.toFixed(
              2
            )}°</span>
          </div>`,
          iconSize: [100, 28],
          iconAnchor: [50, 14],
        });
        try {
          const lm = L.marker([pt.lat, pt.lng], {
            icon: angleIcon,
            zIndexOffset: 1600,
          }).addTo(mapRef.current);
          if (lm) layersRef.current.triangleOverlay.push(lm);
        } catch (err) {
          console.warn("Error creating angle label marker:", err);
        }
      });

      const centroid = {
        lat: (A.lat + B.lat + C.lat) / 3,
        lng: (A.lng + B.lng + C.lng) / 3,
      };

      if (
        typeof centroid.lat !== "number" ||
        typeof centroid.lng !== "number" ||
        isNaN(centroid.lat) ||
        isNaN(centroid.lng)
      ) {
        return;
      }

      const area = calculateTriangleArea(A, B, C);
      const triType = getTriangleType(A, B, C);

      if (typeof area !== "number" || isNaN(area)) {
        return;
      }

      const areaIcon = L.divIcon({
        className: "",
        html: `<div style="background:rgba(13,27,42,0.95);border:1.5px solid #e040fb;color:#fff;padding:6px 12px;border-radius:10px;font-size:11px;font-family:monospace;font-weight:700;white-space:nowrap;box-shadow:0 4px 20px #e040fb66;text-align:center">
          <div style="color:#e040fb;font-size:9px;letter-spacing:1px;margin-bottom:3px">▲ ${triType.toUpperCase()} TRIANGLE</div>
          <div style="color:#ffd700">Area: ${area.toFixed(4)} km²</div>
          <div style="color:#80deea;font-size:9px;margin-top:2px">∑ ${(
            angleA +
            angleB +
            angleC
          ).toFixed(2)}°</div>
        </div>`,
        iconSize: [180, 60],
        iconAnchor: [90, 30],
      });
      try {
        const lm = L.marker([centroid.lat, centroid.lng], {
          icon: areaIcon,
          zIndexOffset: 1700,
        }).addTo(mapRef.current);
        if (lm) layersRef.current.triangleOverlay.push(lm);
      } catch (err) {
        console.warn("Error creating area label marker:", err);
      }
    }

    // Angle preview (2 points)
    if (state.mapTool === "angle" && pts.length === 2) {
      const validPts = pts.filter(
        (p) =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          !isNaN(p.lat) &&
          !isNaN(p.lng)
      );
      if (validPts.length >= 2) {
        try {
          const line = L.polyline(
            validPts.map((p) => [p.lat, p.lng]),
            {
              color: "#e040fb",
              weight: 2,
              dashArray: "6 4",
              opacity: 0.7,
            }
          ).addTo(mapRef.current);
          if (line) layersRef.current.lines.push(line);
        } catch (err) {
          console.warn("Error creating angle preview line:", err);
        }

        const d = calculateDistance(
          validPts[0].lat,
          validPts[0].lng,
          validPts[1].lat,
          validPts[1].lng
        );
        const bearing = calculateBearing(
          validPts[0].lat,
          validPts[0].lng,
          validPts[1].lat,
          validPts[1].lng
        );
        const mid = midpoint(validPts[0], validPts[1]);
        if (
          typeof mid.lat === "number" &&
          typeof mid.lng === "number" &&
          !isNaN(mid.lat) &&
          !isNaN(mid.lng)
        ) {
          const lbl = L.divIcon({
            className: "",
            html: `<div style="background:rgba(13,27,42,0.9);border:1px solid #e040fb88;color:#e040fb;padding:2px 7px;border-radius:8px;font-size:10px;font-family:monospace;font-weight:700">${d.toFixed(
              3
            )} km · ${bearing.toFixed(1)}°</div>`,
            iconSize: [120, 20],
            iconAnchor: [60, 10],
          });
          try {
            const lm = L.marker([mid.lat, mid.lng], {
              icon: lbl,
              zIndexOffset: 1500,
            }).addTo(mapRef.current);
            if (lm) layersRef.current.triangleOverlay.push(lm);
          } catch (err) {
            console.warn("Error creating angle preview label:", err);
          }
        }
      }
    }
  }, [state.toolPoints, state.distances, state.mapTool, mapReady]);



useEffect(() => {
  if (!mapReady || !mapRef.current) return;

  const L = window.L;
  if (!L) return;

  const map = mapRef.current;
  const coords = [];

  const collect = (lat, lng) => {
    const la = Number(lat);
    const ln = Number(lng);

    if (isFinite(la) && isFinite(ln)) {
      coords.push([la, ln]);
    }
  };

  visibleStations?.forEach(s =>
    collect(s.lat ?? s.latitude, s.lng ?? s.longitude)
  );

  visibleLocations?.forEach(l =>
    collect(l.lat, l.lng)
  );

  state.toolPoints?.forEach(p =>
    collect(p.lat, p.lng)
  );

  if (coords.length === 0) return;

  const timeout = setTimeout(() => {
    try {

      // 🔥 Remove duplicate coordinates
      const uniqueCoords = coords.filter(
        (c, index, self) =>
          index ===
          self.findIndex(
            t => t[0] === c[0] && t[1] === c[1]
          )
      );

      // 🔥 Single point
      if (uniqueCoords.length === 1) {
        map.setView(uniqueCoords[0], 14, {
          animate: true,
        });
        return;
      }

      // 🔥 Need at least 2 distinct points
      if (uniqueCoords.length < 2) return;

      // 🔥 Manual bounds calculation (bulletproof)
      let south = Infinity;
      let north = -Infinity;
      let west = Infinity;
      let east = -Infinity;

      uniqueCoords.forEach(([lat, lng]) => {
        south = Math.min(south, lat);
        north = Math.max(north, lat);
        west = Math.min(west, lng);
        east = Math.max(east, lng);
      });

      // 🔥 Prevent zero-area bounds
      if (south === north && west === east) {
        map.setView([south, west], 14);
        return;
      }

      const bounds = L.latLngBounds(
        [south, west],
        [north, east]
      );

      if (!bounds.isValid()) return;

      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
        animate: true,
      });

    } catch (err) {
      console.warn("Auto zoom prevented crash:", err);
    }
  }, 150);

  return () => clearTimeout(timeout);

}, [
  visibleStations,
  visibleLocations,
  state.toolPoints,
  mapReady,
]);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <style>{`
        .gis-tooltip { background: rgba(13,27,42,0.95); color: #e0f7fa; border: 1px solid #00e5ff44; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace; padding: 6px 10px; }
        .leaflet-tooltip-left:before { border-left-color: #00e5ff44; }
        .leaflet-tooltip-right:before { border-right-color: #00e5ff44; }
        @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
      `}</style>
      <LeafletMap onMapReady={onMapReady} />
      {state.mapTool &&
        state.mapTool !== "view" &&
        state.mapTool !== "viewStations" && <SelectionGuide />}
      <LocationComparisonPanel />
    </div>
  );
};

export default GISMap;
