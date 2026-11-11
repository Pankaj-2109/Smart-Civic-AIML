import React, { useState, useEffect } from 'react';
import { complaintAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import BeforeAfterModal from '../components/BeforeAfterModal';
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Eye,
  RefreshCw,
} from 'lucide-react';

const CitizenDashboard = ({ onOpenReport, onSelectComplaint }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'map'
  const [selectedForModal, setSelectedForModal] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintAPI.getAll();
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const pendingCount = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              Resident Civic Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || 'Citizen'}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Report civic problems, watch AI classify defects in real-time, track municipal cleanup progress, and verify resolution evidence.
            </p>
          </div>

          <button
            onClick={onOpenReport}
            className="self-start md:self-auto px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-2xl text-xs shadow-lg shadow-black/10 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Report Civic Issue Now</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Reported</span>
          <div className="text-2xl font-black text-slate-900">{complaints.length}</div>
          <span className="text-[10px] text-slate-400 font-medium">In your municipal ward</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 block mb-1">Pending AI Review</span>
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
          <span className="text-[10px] text-slate-400 font-medium">Awaiting crew assignment</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 block mb-1">In Progress</span>
          <div className="text-2xl font-black text-blue-600">{inProgressCount}</div>
          <span className="text-[10px] text-slate-400 font-medium">Workers actively on-site</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 block mb-1">Cleaned & Resolved</span>
          <div className="text-2xl font-black text-emerald-600">{resolvedCount}</div>
          <span className="text-[10px] text-slate-400 font-medium">Verified with After-photo</span>
        </div>
      </div>

      {/* Main Section: Toggle between My Complaints List and Live Map */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Complaints Tracker ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🗺️ Nearby Civic Issues Map
            </button>
          </div>

          <button
            onClick={fetchComplaints}
            className="self-end sm:self-auto p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {activeTab === 'map' ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              Live OpenStreetMap displaying reported civic defects around your neighborhood. Click any pin to inspect the issue and before/after verification.
            </p>
            <MapView
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedForModal(c)}
              height="500px"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.length === 0 && !loading && (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No complaints reported yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Notice overflowing bins or broken roads? Submit a report and our AI will immediately route it to field sanitation workers.
                </p>
                <button
                  onClick={onOpenReport}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  Report First Issue
                </button>
              </div>
            )}

            {complaints.map((comp) => {
              const isResolved = comp.status === 'RESOLVED';
              const isInProgress = comp.status === 'IN_PROGRESS';

              return (
                <div
                  key={comp._id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                      <img
                        src={comp.image}
                        alt={comp.category}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/uploads/garbage_main_road.jpg'; }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900">{comp.category}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          comp.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {comp.severity} Priority
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          AI: {Math.round((comp.confidence || 0.94) * 100)}% Conf.
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 line-clamp-1 max-w-xl font-medium">
                        {comp.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="line-clamp-1">{comp.location?.address || 'Metro Sector Zone'}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(comp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Tracker & Action */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-stretch md:self-auto justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                    {/* Status Pill */}
                    <div className="text-left md:text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : (isInProgress ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        {comp.status.replace('_', ' ')}
                      </span>
                      {comp.assignedTo?.workerName && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Assigned: <strong>{comp.assignedTo.workerName}</strong>
                        </p>
                      )}
                    </div>

                    {/* View Details / Before After Button */}
                    <button
                      onClick={() => setSelectedForModal(comp)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                        isResolved
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          <span>Inspect Before/After</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Before / After Modal */}
      <BeforeAfterModal
        complaint={selectedForModal}
        isOpen={!!selectedForModal}
        onClose={() => setSelectedForModal(null)}
      />
    </div>
  );
};

export default CitizenDashboard;

