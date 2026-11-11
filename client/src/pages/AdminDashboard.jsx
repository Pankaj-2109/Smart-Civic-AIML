import React, { useState, useEffect } from 'react';
import { complaintAPI, workerAPI, adminAPI } from '../api/api';
import MapView from '../components/MapView';
import HotspotMap from '../components/HotspotMap';
import BeforeAfterModal from '../components/BeforeAfterModal';
import RouteOptimizerModal from '../components/RouteOptimizerModal';
import {
  ShieldAlert,
  Users,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Truck,
  Search,
  UserPlus,
  RefreshCw,
  Eye,
  Sparkles,
  MapPin,
  X,
} from 'lucide-react';

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [inspectComplaint, setInspectComplaint] = useState(null);
  const [showHotspotView, setShowHotspotView] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, workerRes, adminRes] = await Promise.all([
        complaintAPI.getAll(),
        workerAPI.getAll(),
        adminAPI.getAnalytics(),
      ]);

      if (compRes.data.success) setComplaints(compRes.data.complaints || []);
      if (workerRes.data.success) setWorkers(workerRes.data.workers || []);
      if (adminRes.data.success) setAnalytics(adminRes.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter complaints
  const filteredComplaints = complaints.filter((comp) => {
    if (selectedCategory !== 'All' && comp.category !== selectedCategory) return false;
    if (selectedSeverity !== 'All' && comp.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'All' && comp.status !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = comp.description?.toLowerCase().includes(q);
      const matchAddr = comp.location?.address?.toLowerCase().includes(q);
      const matchName = comp.citizenName?.toLowerCase().includes(q);
      if (!matchDesc && !matchAddr && !matchName) return false;
    }
    return true;
  });

  // Assign worker handler
  const handleAssignWorker = async () => {
    if (!assigningComplaint || !selectedWorkerId) return;
    const worker = workers.find((w) => w._id === selectedWorkerId);
    if (!worker) return;

    try {
      const res = await complaintAPI.assignWorker(assigningComplaint._id, {
        workerId: worker._id,
        workerName: worker.name,
        department: worker.department,
      });

      if (res.data.success) {
        setAssigningComplaint(null);
        setSelectedWorkerId('');
        fetchData();
      }
    } catch (err) {
      alert('Error assigning worker: ' + err.message);
    }
  };

  // Quick status update
  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      const res = await complaintAPI.updateStatus(complaintId, newStatus);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const totalCount = analytics?.stats?.total || complaints.length;
  const pendingCount = analytics?.stats?.pending || complaints.filter((c) => c.status === 'PENDING').length;
  const resolvedCount = analytics?.stats?.resolved || complaints.filter((c) => c.status === 'RESOLVED').length;
  const highPriorityCount = analytics?.stats?.highPriority || complaints.filter((c) => c.severity === 'HIGH').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header and Quick Tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase">
              Municipal Operations
            </span>
            <span className="text-xs text-slate-400">• Control Room Live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Municipal Command & Analytics Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowHotspotView(!showHotspotView)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
              showHotspotView
                ? 'bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-500" />
            <span>{showHotspotView ? 'Hide Hotspots' : 'Waste Hotspot Clusters'}</span>
          </button>

          <button
            onClick={() => setShowRouteModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Optimize Collection Routes</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-colors shadow-sm"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Complaints</div>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">Logged across all municipal sectors</div>
          <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            📊
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Pending Complaints</div>
          <div className="text-3xl sm:text-4xl font-black text-amber-500 tracking-tight">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">Require assignment or in queue</div>
          <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            ⏳
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Resolved Complaints</div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">{resolvedCount}</div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">After-cleaning verified with AI</div>
          <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            ✅
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">High Priority Alerts</div>
          <div className="text-3xl sm:text-4xl font-black text-rose-600 tracking-tight">{highPriorityCount}</div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">Near hospitals, schools, or arterial roads</div>
          <div className="absolute right-4 bottom-4 w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            🚨
          </div>
        </div>
      </div>

      {/* Standout Feature 1: Hotspot Clustering View */}
      {showHotspotView && (
        <HotspotMap onSelectComplaint={(c) => setInspectComplaint(c)} />
      )}

      {/* Interactive Map View of All Complaints */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">City-Wide Civic Issues Map</h3>
            <p className="text-xs text-slate-500">Real-time status pins across municipal zones. Click a marker to inspect details.</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> High Severity</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Resolved</span>
          </div>
        </div>

        <MapView
          complaints={filteredComplaints}
          onSelectComplaint={(c) => setInspectComplaint(c)}
          height="420px"
        />
      </div>

      {/* Filterable Complaints Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Master Grievances & Work Orders</h3>
            <p className="text-xs text-slate-500">Filter, inspect ML confidence, and assign field sanitation crews</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Pills Strip */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 px-2">Category:</span>
            {['All', 'Garbage', 'Overflowing Bin', 'Pothole', 'Water Leakage', 'Illegal Dumping'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 px-2">Severity:</span>
            {['All', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedSeverity === sev
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 px-2">Status:</span>
            {['All', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedStatus === st
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Defect & Image</th>
                <th className="py-3 px-4">ML Category</th>
                <th className="py-3 px-4">Severity / Urgency</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Field Crew Assignment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.map((comp) => {
                const isResolved = comp.status === 'RESOLVED';
                return (
                  <tr key={comp._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Thumbnail & Description */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                          <img
                            src={comp.image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/uploads/garbage_main_road.jpg'; }}
                          />
                        </div>
                        <div className="max-w-xs">
                          <p className="font-bold text-slate-900 line-clamp-1">{comp.description}</p>
                          <p className="text-[10px] text-slate-400">By {comp.citizenName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category with ML confidence */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-800">{comp.category}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          {Math.round((comp.confidence || 0.94) * 100)}% Conf.
                        </span>
                      </div>
                    </td>

                    {/* Severity Badge */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          comp.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-700'
                            : (comp.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')
                        }`}>
                          {comp.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          Priority {comp.priorityScore || 50}/100
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <p className="line-clamp-1 text-slate-700 font-medium">{comp.location?.address || 'Metro Road'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {comp.location?.latitude?.toFixed(3)}, {comp.location?.longitude?.toFixed(3)}
                      </p>
                    </td>

                    {/* Status with Quick Select */}
                    <td className="py-3.5 px-4">
                      <select
                        value={comp.status}
                        onChange={(e) => handleUpdateStatus(comp._id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          isResolved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : (comp.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200')
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>

                    {/* Assigned Worker */}
                    <td className="py-3.5 px-4">
                      {comp.assignedTo?.workerName ? (
                        <div>
                          <p className="font-bold text-slate-800">{comp.assignedTo.workerName}</p>
                          <p className="text-[10px] text-slate-400">{comp.assignedTo.department}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssigningComplaint(comp)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Assign Worker</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setInspectComplaint(comp)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                      >
                        {isResolved ? 'Inspect After' : 'Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredComplaints.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No complaints match the selected filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* Assign Worker Modal */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Dispatch Sanitation Worker</h3>
              <button
                onClick={() => setAssigningComplaint(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900">{assigningComplaint.category}</span>
              <p className="text-slate-600 line-clamp-2">{assigningComplaint.description}</p>
              <p className="text-[10px] text-slate-400 font-medium">📍 {assigningComplaint.location?.address}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Select Available Field Worker
              </label>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Choose a worker --</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.department}) — {w.activeTasksCount} active task(s)
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedWorkerId}
                onClick={handleAssignWorker}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Before / After Inspection Modal */}
      <BeforeAfterModal
        complaint={inspectComplaint}
        isOpen={!!inspectComplaint}
        onClose={() => setInspectComplaint(null)}
      />

      {/* Collection Route Optimizer Modal */}
      <RouteOptimizerModal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;

