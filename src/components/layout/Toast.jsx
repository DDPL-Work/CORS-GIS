import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const Toast = () => {
  const { state, dispatch } = useApp();
  useEffect(() => {
    if (state.notification?.type === "toast") {
      const t = setTimeout(() => dispatch({ type: "SET_NOTIFICATION", payload: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [state.notification]);
  if (!state.notification || state.notification.type !== "toast") return null;
  return (
    <div style={{ position: "fixed", top: 70, right: 20, background: "#080f1a", border: `1px solid ${state.notification.color}`, color: state.notification.color, borderRadius: 8, padding: "10px 16px", zIndex: 99999, fontFamily: "monospace", fontSize: 13, fontWeight: 700, boxShadow: `0 4px 20px ${state.notification.color}44` }}>
      {state.notification.message}
    </div>
  );
};

export default Toast;