import { useEffect, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getBoundsRange = (containerSize, panelSize) => ({
  min: Math.min(0, containerSize - panelSize),
  max: Math.max(0, containerSize - panelSize),
});

const getContainerRect = (bounds, panel) => {
  if (!panel) return null;

  if (bounds === "viewport") {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  return panel.offsetParent?.getBoundingClientRect() || null;
};

const getAnchoredPosition = (anchor, containerRect, panelRect, offsetX, offsetY) => {
  const rangeX = getBoundsRange(containerRect.width, panelRect.width);
  const rangeY = getBoundsRange(containerRect.height, panelRect.height);

  let x = offsetX;
  let y = offsetY;

  if (anchor === "top-right") {
    x = rangeX.max - offsetX;
  } else if (anchor === "bottom-left") {
    y = rangeY.max - offsetY;
  } else if (anchor === "bottom-right") {
    x = rangeX.max - offsetX;
    y = rangeY.max - offsetY;
  } else if (anchor === "center") {
    x = (containerRect.width - panelRect.width) / 2 + offsetX;
    y = (containerRect.height - panelRect.height) / 2 + offsetY;
  } else if (anchor === "center-bottom") {
    x = (containerRect.width - panelRect.width) / 2 + offsetX;
    y = rangeY.max - offsetY;
  }

  return {
    x: clamp(x, rangeX.min, rangeX.max),
    y: clamp(y, rangeY.min, rangeY.max),
  };
};

const DraggablePanel = ({
  children,
  style,
  bodyStyle,
  title = "Panel",
  handleLabel = "DRAG",
  handleColor = "#00e5ff",
  position = "absolute",
  bounds = "parent",
  initialAnchor = "top-left",
  offsetX = 20,
  offsetY = 20,
  resizable = false,
  resizeAxis = "both",
  useTransformCenter = false,
  onClick,
}) => {
  const panelRef = useRef(null);
  const frameRef = useRef(null);
  const dragStateRef = useRef(null);
  const hasUserMovedRef = useRef(false);
  const [panelPosition, setPanelPosition] = useState({ x: offsetX, y: offsetY });
  const [centered, setCentered] = useState(useTransformCenter);

  useEffect(() => {
    const syncInitialPosition = () => {
      if (!panelRef.current || centered) return;

      const containerRect = getContainerRect(bounds, panelRef.current);
      if (!containerRect) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      setPanelPosition(
        getAnchoredPosition(initialAnchor, containerRect, panelRect, offsetX, offsetY)
      );
    };

    syncInitialPosition();
    window.addEventListener("resize", syncInitialPosition);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (!hasUserMovedRef.current && !centered) {
              syncInitialPosition();
            }
          })
        : null;

    if (resizeObserver && panelRef.current) {
      resizeObserver.observe(panelRef.current);
    }

    return () => {
      window.removeEventListener("resize", syncInitialPosition);
      resizeObserver?.disconnect();
    };
  }, [bounds, initialAnchor, offsetX, offsetY, centered]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!dragStateRef.current || !panelRef.current) return;

      const containerRect = getContainerRect(bounds, panelRef.current);
      if (!containerRect) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      const rangeX = getBoundsRange(containerRect.width, panelRect.width);
      const rangeY = getBoundsRange(containerRect.height, panelRect.height);
      const nextX = clamp(
        event.clientX - containerRect.left - dragStateRef.current.offsetX,
        rangeX.min,
        rangeX.max
      );
      const nextY = clamp(
        event.clientY - containerRect.top - dragStateRef.current.offsetY,
        rangeY.min,
        rangeY.max
      );

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        setPanelPosition({ x: nextX, y: nextY });
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
  }, [bounds]);

  const startDragging = (event) => {
    if (event.button !== 0 || !panelRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();

    if (centered) {
      setPanelPosition({ x: panelRect.left, y: panelRect.top });
      setCentered(false);
    }

    dragStateRef.current = {
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top,
    };
    hasUserMovedRef.current = true;

    document.body.style.userSelect = "none";
  };

  return (
    <div
      ref={panelRef}
      onClick={onClick}
      style={{
        position,
        left: centered ? "50%" : panelPosition.x,
        top: centered ? "50%" : panelPosition.y,
        transform: centered ? "translate(-50%, -50%)" : undefined,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        resize: resizable ? resizeAxis : "none",
        ...style,
      }}
    >
      <div
        onPointerDown={startDragging}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "8px 12px",
          borderBottom: `1px solid ${handleColor}33`,
          cursor: "grab",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <span style={{ color: handleColor, fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>
          {title}
        </span>
        <span style={{ color: "#80deea", fontSize: 10 }}>{handleLabel}</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default DraggablePanel;
