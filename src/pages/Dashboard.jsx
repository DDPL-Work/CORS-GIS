import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import StatusBar from '../components/layout/StatusBar';
import Toast from '../components/layout/Toast';
import GISMap from '../components/map/GISMap';
import DistancePanel from '../components/panels/DistancePanel';
import AnglePanel from '../components/panels/AnglePanel';
import LocationModal from '../components/modals/LocationModal';
import ApprovalsPage from './ApprovalsPage';
import AnalyticsPage from './AnalyticsPage';
import UsersPage from './UsersPage';
import { useApp } from '../context/AppContext';

const Dashboard = () => {
  const { state } = useApp();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a1628", overflow: "hidden" }}>
      <Header />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {state.activeView === "map" && (
          <>
            <Sidebar />
            <div style={{ flex: 1, position: "relative" }}>
              <GISMap />
              {state.mapTool === "distance" && <DistancePanel />}
              {state.mapTool === "angle" && state.toolPoints.length >= 2 && <AnglePanel />}
            </div>
          </>
        )}
        {state.activeView === "approvals" && <ApprovalsPage />}
        {state.activeView === "users" && <UsersPage />}
        {state.activeView === "analytics" && <AnalyticsPage />}
      </div>
      <StatusBar />
      <LocationModal />
      <Toast />
    </div>
  );
};

export default Dashboard;