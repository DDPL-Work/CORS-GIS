import { AppProvider, useApp } from "./context/AppContext";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import { useEffect } from "react";

function AppContent() {
  const { state, dispatch } = useApp();

  // ✅ Load saved auth
  useEffect(() => {
    const saved = localStorage.getItem("rekhans_auth");
    if (saved) {
      dispatch({ type: "LOGIN", payload: JSON.parse(saved) });
    }
  }, [dispatch]);

  // ✅ Save auth on change
  useEffect(() => {
    if (state.auth.token) {
      localStorage.setItem("rekhans_auth", JSON.stringify(state.auth));
    } else {
      localStorage.removeItem("rekhans_auth");
    }
  }, [state.auth]);

  return state.auth.token ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}