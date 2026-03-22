import { useEffect, useRef, useState } from "react";

const LeafletMap = ({ onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (mapInstanceRef.current) return;

      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [22.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // 🔥 CRITICAL FIX: ensure correct initial sizing
      setTimeout(() => {
        map.invalidateSize();
      }, 0);

      if (onMapReady) {
        onMapReady(map);
      }

      setReady(true);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ✅ AUTO FIX: Detect container resize (sidebar toggle, layout change)
  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    observer.observe(mapRef.current);

    return () => observer.disconnect();
  }, []);

  // ✅ EXTRA SAFETY: window resize
  useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden", // 🔥 prevents visual gaps
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          background: "#1a2332",
        }}
      />

      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d1b2a",
            color: "#4dd0e1",
            fontSize: 14,
            fontFamily: "monospace",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛰</div>
            <div>Initializing GIS Engine...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;