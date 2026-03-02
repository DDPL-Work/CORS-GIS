import { useApp } from "../context/AppContext";
import { useEffect } from "react";

const Toast = () => {
  const { state, dispatch } = useApp();
  const notif = state.notification;

  useEffect(() => {
    if (notif?.type === "toast") {
      const timer = setTimeout(() => {
        dispatch({ type: "SET_NOTIFICATION", payload: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notif]);

  if (!notif || notif.type !== "toast") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 30,
        right: 30,
        padding: "14px 22px",
        borderRadius: 10,
        background: notif.color + "22",
        border: `1px solid ${notif.color}`,
        color: notif.color,
        fontWeight: 700,
        zIndex: 999999,
      }}
    >
      {notif.message}
    </div>
  );
};

export default Toast;