import { useEffect, useRef, useState } from "react";

const LEGEND_ITEMS = [
  { color: "#00e5ff", label: "Active Station" },
  { color: "#ff6b6b", label: "Inactive Station" },
  { color: "#ffd700", label: "Pending Site" },
  { color: "#00e676", label: "Approved Site" },
  { color: "#ff5252", label: "Rejected Site" },
  { color: "#ff9800", label: "Selected (Tool)" },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const DraggableLegend = () => {
  const panelRef = useRef(null);
  const frameRef = useRef(null);
  const dragStateRef = useRef(null);
  const [position, setPosition] = useState({ x: 24, y: 24 });

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!dragStateRef.current || !panelRef.current) return;

      const parent = panelRef.current.offsetParent;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();

      const nextX = clamp(
        event.clientX - parentRect.left - dragStateRef.current.offsetX,
        0,
        Math.max(0, parentRect.width - panelRect.width)
      );
      const nextY = clamp(
        event.clientY - parentRect.top - dragStateRef.current.offsetY,
        0,
        Math.max(0, parentRect.height - panelRect.height)
      );

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        setPosition({ x: nextX, y: nextY });
      });
    };

    const stopDragging = () => {
      dragStateRef.current = null;
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      document.body.style.userSelect = "";
    };
  }, []);

  const startDragging = (event) => {
    if (event.button !== 0 || !panelRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();
    dragStateRef.current = {
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top,
    };

    document.body.style.userSelect = "none";
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: 210,
        background: "rgba(8, 15, 26, 0.94)",
        border: "1px solid #00e5ff33",
        borderRadius: 12,
        boxShadow: "0 12px 26px rgba(0, 0, 0, 0.35)",
        backdropFilter: "blur(10px)",
        fontFamily: "monospace",
        zIndex: 950,
      }}
    >
      <div
        onPointerDown={startDragging}
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #00e5ff22",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "grab",
          touchAction: "none",
        }}
      >
        <span style={{ color: "#4dd0e1", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>
          LEGEND
        </span>
        <span style={{ color: "#80deea", fontSize: 10 }}>DRAG</span>
      </div>

      <div style={{ padding: "10px 12px" }}>
        {LEGEND_ITEMS.map(({ color, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              color: "#b8ecf2",
              fontSize: 11,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
                boxShadow: `0 0 6px ${color}`,
              }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraggableLegend;
