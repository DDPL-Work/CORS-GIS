import { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import StatusBar from "../components/layout/StatusBar";
import Toast from "../components/layout/Toast";
import GISMap from "../components/map/GISMap";
import DraggableLegend from "../components/map/DraggableLegend";
import DistancePanel from "../components/panels/DistancePanel";
import AnglePanel from "../components/panels/AnglePanel";
import LocationModal from "../components/modals/LocationModal";
import StationActionModal from "../components/modals/StationActionModal";
import ApprovalsPage from "./ApprovalsPage";
import AnalyticsPage from "./AnalyticsPage";
import UsersPage from "./UsersPage";
import AdminPanelPage from "./AdminPanelPage";
import { useApp } from "../context/AppContext";

const Dashboard = () => {
  const { state } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0a1628",
        overflow: "hidden",
      }}
    >
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
      />

      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <Sidebar isOpen={sidebarOpen} />

        <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>
          {state.activeView === "map" && (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <GISMap />
              <DraggableLegend />
              {state.mapTool === "distance" && <DistancePanel />}
              {state.mapTool === "angle" && state.toolPoints.length >= 2 && <AnglePanel />}
            </div>
          )}
          {state.activeView === "approvals" && <ApprovalsPage />}
          {state.activeView === "users" && <UsersPage />}
          {state.activeView === "admin" && <AdminPanelPage />}
          {state.activeView === "analytics" && <AnalyticsPage />}
        </div>
      </div>

      <StatusBar />
      <LocationModal />
      <StationActionModal />
      <Toast />
    </div>
  );
};

export default Dashboard;
