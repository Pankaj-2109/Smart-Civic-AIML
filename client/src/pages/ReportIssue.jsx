import React, { useState } from 'react';
import { complaintAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import {
  Camera,
  Upload,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';

const ReportIssue = ({ onSubmitted, onCancel }) => {
  const { user, addNotification } = useAuth();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Connaught Place Outer Circle, New Delhi',
    locationType: 'residential',
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [mlPreview, setMlPreview] = useState(null);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);

      // Simulate preliminary on-device or fast ML preview
      setMlPreview({
        category: 'Analyzing image...',
        confidence: '...',
        analyzing: true,
      });

      setTimeout(() => {
        const lowerDesc = description.toLowerCase();
        let cat = 'Garbage';
        if (file.name.includes('bin') || lowerDesc.includes('bin')) cat = 'Overflowing Bin';
        else if (file.name.includes('pothole') || lowerDesc.includes('pothole')) cat = 'Pothole';
        else if (file.name.includes('water') || lowerDesc.includes('leak')) cat = 'Water Leakage';
        
        setMlPreview({
          category: cat,
          confidence: 0.94,
          analyzing: false,
        });
      }, 700);
    }
  };

  // Browser GPS Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        
        // Reverse geocoding via OpenStreetMap Nominatim
        let address = `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            address = data.display_name;
          }
        } catch (e) {
          console.warn('Reverse geocode failed:', e);
        }

        setLocation({
          latitude: lat,
          longitude: lon,
          address,
          locationType: 'residential',
        });
        setDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingLocation(false);
        alert('Could not fetch exact GPS. Defaulting to Central District coordinates.');
      },
      { timeout: 8000 }
    );
  };

  // Map pin adjustment
  const handlePickLocation = async (coords) => {
    let address = `Coordinates: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        address = data.display_name;
      }
    } catch (e) {}

    setLocation((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
      address,
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please upload or snap a photo of the civic issue.');
      return;
    }
    if (!description.trim()) {
      alert('Please add a brief description of the issue.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('description', description);
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    formData.append('address', location.address);
    formData.append('locationType', location.locationType);
    formData.append('citizenName', user?.name || 'Rahul Sharma');
    formData.append('citizenEmail', user?.email || 'citizen@gmail.com');
    formData.append('citizenPhone', user?.phone || '+91 98222 33445');

    try {
      const res = await complaintAPI.create(formData);
      if (res.data.success) {
        setSubmissionSuccess(res.data);
        addNotification({
          title: 'Issue Submitted & Categorized',
          message: `Complaint verified as ${res.data.complaint.category} with severity ${res.data.complaint.severity}.`,
        });
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Error submitting complaint: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionSuccess) {
    const comp = submissionSuccess.complaint;
    const ml = submissionSuccess.mlAnalysis;

    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Complaint Submitted & AI Analyzed!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your grievance has been registered on the municipal portal and routed to sanitation field ops.
            </p>
          </div>

          {/* AI Analysis Cards */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Real-Time ML Inspection Results</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white border border-emerald-100">
                <span className="text-[11px] text-slate-400 font-medium block">Issue Category</span>
                <span className="text-sm font-extrabold text-slate-900">{comp.category}</span>
                <span className="text-[10px] text-emerald-600 font-semibold block">{Math.round(comp.confidence * 100)}% Confidence</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-emerald-100">
                <span className="text-[11px] text-slate-400 font-medium block">Urgency Tier</span>
                <span className={`text-sm font-extrabold block ${
                  comp.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-600'
                }`}>
                  {comp.severity} Severity
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">Priority {comp.priorityScore}/100</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-emerald-100 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 font-medium block">Current Status</span>
                <span className="text-sm font-extrabold text-blue-600">Pending Assignment</span>
                <span className="text-[10px] text-slate-500 block">SLA: 24 Hours</span>
              </div>
            </div>

            {comp.isDuplicate && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Notice: Similar report noted nearby. Linked to existing municipal ticket for consolidated cleanup.</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSubmitted}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Track in My Complaints</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSubmissionSuccess(null);
                setImageFile(null);
                setImagePreview(null);
                setDescription('');
              }}
              className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="px-6 py-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 rounded-2xl bg-white/20 backdrop-blur-md">
              <Camera className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl font-black">Report a Civic Issue</h1>
          </div>
          <p className="text-xs text-emerald-100 ml-11">
            Upload an image, confirm location, and our trained ML models will automatically categorize the defect and compute severity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* 1. Image Upload Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Upload or Snap Photo of Defect <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 hover:bg-emerald-50/40 text-center group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-emerald-300 flex items-center justify-center text-slate-600 group-hover:text-emerald-600 mb-3 shadow-sm transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 mb-1">Click to browse or drag file</span>
                <span className="text-[11px] text-slate-400">JPG, PNG, WebP up to 12MB</span>
              </label>

              {/* Preview Box */}
              <div className="border border-slate-200 rounded-2xl bg-slate-100 overflow-hidden relative min-h-[160px] flex items-center justify-center">
                {imagePreview ? (
                  <div className="w-full h-full relative">
                    <img
                      src={imagePreview}
                      alt="Upload Preview"
                      className="w-full h-48 object-cover"
                    />
                    {mlPreview && (
                      <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-md text-white p-2.5 rounded-xl text-xs flex items-center justify-between border border-white/20">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold">AI Predicted: <strong>{mlPreview.category}</strong></span>
                        </div>
                        {mlPreview.confidence && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/80 text-white">
                            {Math.round(mlPreview.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>No photo uploaded yet. Preview will appear here.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Description Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              2. Description of Issue <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Garbage accumulated near the main road. Foul smell and overflowing beyond the footpath."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick Tags:</span>
              {[
                'Garbage accumulated on roadside',
                'Dustbin overflowing in market',
                'Hazardous deep road pothole',
                'Drinking water pipe ruptured',
                'Near hospital emergency gate',
                'School route blocked',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDescription(chip)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-medium transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Location Detection & Interactive Map */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Geolocation & Interactive Pinpoint
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors self-start sm:self-auto"
              >
                <MapPin className="w-3.5 h-3.5" />
                {detectingLocation ? 'Querying GPS satellites...' : 'Detect My GPS Location'}
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📍</span>
                <span className="font-semibold text-slate-800 line-clamp-1">{location.address}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </span>
            </div>

            {/* Interactive Picker Map */}
            <MapView
              center={[location.latitude, location.longitude]}
              zoom={14}
              isPickerMode={true}
              pickedLocation={location}
              onPickLocation={handlePickLocation}
              height="280px"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !imageFile || !description.trim()}
              className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing ML Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Complaint to Municipal Portal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;

