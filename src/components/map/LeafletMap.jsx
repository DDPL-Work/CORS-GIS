import { useEffect, useRef, useState } from 'react';

const LeafletMap = ({ children, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (mapInstanceRef.current) return;
      const map = window.L.map(mapRef.current, { center: [28.6, 77.2], zoom: 10, zoomControl: true });
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors | Survey of India – ReKHAnS",
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      onMapReady(map);
      setReady(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#1a2332" }} />
      {!ready && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1b2a", color: "#4dd0e1", fontSize: 14, fontFamily: "monospace" }}>
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