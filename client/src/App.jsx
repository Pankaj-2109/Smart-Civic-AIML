import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportIssue from './pages/ReportIssue';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import HotspotMap from './components/HotspotMap';
import MapView from './components/MapView';
import AICivicAssistant from './components/AICivicAssistant';
import RouteOptimizerModal from './components/RouteOptimizerModal';

const MainContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === 'admin') return 'admin_dashboard';
    if (user?.role === 'worker') return 'worker_dashboard';
    return 'dashboard';
  });
  const [showRouteModal, setShowRouteModal] = useState(false);

  // Sync tab with role changes
  React.useEffect(() => {
    if (user?.role === 'admin' && !['admin_dashboard', 'hotspots'].includes(activeTab)) {
      setActiveTab('admin_dashboard');
    } else if (user?.role === 'worker') {
      setActiveTab('worker_dashboard');
    } else if (user?.role === 'citizen' && !['dashboard', 'report', 'map'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [user?.role]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRouteOptimizer={() => setShowRouteModal(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {user?.role === 'admin' ? (
          activeTab === 'hotspots' ? (
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <HotspotMap />
            </div>
          ) : (
            <AdminDashboard />
          )
        ) : user?.role === 'worker' ? (
          <WorkerDashboard />
        ) : (
          // Citizen Views
          activeTab === 'report' ? (
            <ReportIssue
              onSubmitted={() => setActiveTab('dashboard')}
              onCancel={() => setActiveTab('dashboard')}
            />
          ) : activeTab === 'map' ? (
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-1">Live Municipal Issues Map</h2>
                <p className="text-xs text-slate-500 mb-4">Explore geo-tagged civic grievances and resolved sites around the city.</p>
                <MapView height="550px" />
              </div>
            </div>
          ) : (
            <CitizenDashboard
              onOpenReport={() => setActiveTab('report')}
            />
          )
        )}
      </main>

      {/* Standout Feature 4: AI Civic Assistant (Floating Widget) */}
      <AICivicAssistant />

      {/* Route Optimizer Modal */}
      <RouteOptimizerModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">SmartCivic+ Municipal Civic Management System</p>
        <p className="text-[11px] text-slate-400 mt-1">
          MERN Stack (React + Node + Express + MongoDB) • Python FastAPI ML Services • Leaflet OpenStreetMap
        </p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;

