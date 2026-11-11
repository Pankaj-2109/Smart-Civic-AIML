import React, { useState, useEffect } from 'react';
import { complaintAPI, workerAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import BeforeAfterModal from '../components/BeforeAfterModal';
import {
  Wrench,
  Navigation,
  CheckCircle2,
  Upload,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [allOpenTasks, setAllOpenTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState('assigned'); // 'assigned' | 'open'
  
  // Resolution Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [afterImagePreview, setAfterImagePreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [inspectModal, setInspectModal] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await complaintAPI.getAll();
      if (res.data.success) {
        const all = res.data.complaints || [];
        // Assigned tasks for this worker (by worker name or demo ID)
        const myTasks = all.filter(
          (c) =>
            c.assignedTo?.workerName?.toLowerCase().includes('ramesh') ||
            c.assignedTo?.workerName === user?.name ||
            c.status === 'IN_PROGRESS'
        );
        const unassigned = all.filter((c) => c.status === 'PENDING');
        setTasks(myTasks);
        setAllOpenTasks(unassigned);
      }
    } catch (err) {
      console.error('Error fetching worker tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  // Handle Mark In Progress
  const handleStartTask = async (id) => {
    try {
      const res = await complaintAPI.updateStatus(id, 'IN_PROGRESS');
      if (res.data.success) {
        fetchTasks();
      }
    } catch (err) {
      alert('Error updating task: ' + err.message);
    }
  };

  // Handle Claim Unassigned Task
  const handleClaimTask = async (complaint) => {
    try {
      const res = await complaintAPI.assignWorker(complaint._id, {
        workerId: user?.id || 'demo-worker-id',
        workerName: user?.name || 'Ramesh Kumar',
        department: user?.department || 'Sanitation',
      });
      if (res.data.success) {
        fetchTasks();
        setViewTab('assigned');
      }
    } catch (err) {
      alert('Claim failed: ' + err.message);
    }
  };

  // Handle resolution after-image change
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAfterImageFile(file);
      setAfterImagePreview(URL.createObjectURL(file));
    }
  };

  // Submit Resolution with After Image
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!afterImageFile) {
      alert('Please upload an after-cleaning photo to verify resolution.');
      return;
    }

    setIsSubmittingResolution(true);
    const formData = new FormData();
    formData.append('afterImage', afterImageFile);
    formData.append('notes', notes || 'Debris cleared and area sanitized.');

    try {
      const res = await complaintAPI.resolve(resolvingComplaint._id, formData);
      if (res.data.success) {
        setResolvingComplaint(null);
        setAfterImageFile(null);
        setAfterImagePreview(null);
        setNotes('');
        fetchTasks();
      }
    } catch (err) {
      alert('Error resolving complaint: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const displayList = viewTab === 'assigned' ? tasks : allOpenTasks;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Worker Profile Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black shadow-inner">
            👷
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Municipal Field Crew Dashboard
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                Active On Duty
              </span>
            </div>
            <h1 className="text-2xl font-black mt-0.5">{user?.name || 'Ramesh Kumar'}</h1>
            <p className="text-xs text-amber-100 font-medium">Department: {user?.department || 'Sanitation & Solid Waste'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/20">
            <span className="text-2xl font-black block">{tasks.filter((t) => t.status === 'IN_PROGRESS').length}</span>
            <span className="text-[10px] uppercase font-bold text-amber-200">In Progress</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/20">
            <span className="text-2xl font-black block">{tasks.filter((t) => t.status === 'RESOLVED').length}</span>
            <span className="text-[10px] uppercase font-bold text-amber-200">Completed</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('assigned')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewTab === 'assigned'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Assigned Work Orders ({tasks.length})
            </button>
            <button
              onClick={() => setViewTab('open')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewTab === 'open'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Claim Open Pending Issues ({allOpenTasks.length})
            </button>
          </div>

          <button
            onClick={fetchTasks}
            className="self-end sm:self-auto p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Tasks</span>
          </button>
        </div>

        {/* Task Cards Grid */}
        <div className="space-y-4">
          {displayList.map((comp) => {
            const isResolved = comp.status === 'RESOLVED';
            const isInProgress = comp.status === 'IN_PROGRESS';
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${comp.location?.latitude},${comp.location?.longitude}`;

            return (
              <div
                key={comp._id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Left side */}
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={comp.image}
                      alt=""
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
                        {comp.severity} Urgency
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Priority: {comp.priorityScore}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium max-w-xl">
                      {comp.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{comp.location?.address || 'Metro Sector Zone'}</span>
                    </div>
                  </div>
                </div>

                {/* Right side Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-stretch md:self-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                  {/* Navigation link */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>Open in Maps</span>
                  </a>

                  {viewTab === 'open' ? (
                    <button
                      onClick={() => handleClaimTask(comp)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
                    >
                      Claim & Start
                    </button>
                  ) : isResolved ? (
                    <button
                      onClick={() => setInspectModal(comp)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cleaned & Verified</span>
                    </button>
                  ) : isInProgress ? (
                    <button
                      onClick={() => setResolvingComplaint(comp)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Cleaned Photo & Resolve</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTask(comp._id)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Start Task (In Progress)
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {displayList.length === 0 && !loading && (
            <div className="py-16 text-center text-slate-400 text-xs">
              No tasks currently in this queue. Great job keeping the city clean!
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal: Upload After-Cleaning Photo */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Submit Resolution Photo</h3>
              </div>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  1. Upload After-Cleaning Photograph <span className="text-rose-500">*</span>
                </label>
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {afterImagePreview ? (
                    <img
                      src={afterImagePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700">Click to upload resolved site photo</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Automated AI will inspect cleanliness</span>
                    </>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  2. Sanitation Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Garbage cleared, bleach powder sprayed, waste dispatched to landfill."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution || !afterImageFile}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  {isSubmittingResolution ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Submit & Verify Cleanliness</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Before / After Viewer */}
      <BeforeAfterModal
        complaint={inspectModal}
        isOpen={!!inspectModal}
        onClose={() => setInspectModal(null)}
      />
    </div>
  );
};

export default WorkerDashboard;

