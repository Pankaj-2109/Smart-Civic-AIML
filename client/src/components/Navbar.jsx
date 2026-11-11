import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { Shield, User, Bell, ChevronDown, CheckCircle2, AlertTriangle, Layers, Navigation } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, onOpenRouteOptimizer }) => {
  const { user, switchRole, notifications, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-[800] bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">SmartCivic</span>
              <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded">AI+</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Municipal Civic Issue Intelligence</p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {user?.role === 'citizen' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                My Complaints & Tracking
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'report'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/20'
                    : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70'
                }`}
              >
                + Report New Issue
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'map'
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Civic Issues Map
              </button>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('admin_dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'admin_dashboard'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Command Center & Complaints
              </button>
              <button
                onClick={() => setActiveTab('hotspots')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'hotspots'
                    ? 'bg-rose-50 text-rose-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                🔥 Hotspot Intelligence
              </button>
              <button
                onClick={onOpenRouteOptimizer}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                Route Optimizer
              </button>
            </>
          )}

          {user?.role === 'worker' && (
            <button
              onClick={() => setActiveTab('worker_dashboard')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-sm"
            >
              👷 Worker Dispatch & Tasks
            </button>
          )}
        </nav>

        {/* Right Section: Role Switcher & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Notifications</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">{unreadNotifs} New</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] mb-0.5">
                        <span>{n.title}</span>
                        <span className="text-slate-400 font-normal">{n.time}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-tight">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800 transition-all shadow-sm"
            >
              <span className={`w-2 h-2 rounded-full ${
                user?.role === 'admin' ? 'bg-indigo-500' : (user?.role === 'worker' ? 'bg-amber-500' : 'bg-emerald-500')
              }`}></span>
              <span className="capitalize">{user?.role || 'Citizen'} View</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Switch Active Portal
                </div>
                <button
                  onClick={() => {
                    switchRole('citizen');
                    setActiveTab('dashboard');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                    user?.role === 'citizen' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p>Citizen Dashboard</p>
                    <p className="text-[10px] text-slate-400">Rahul Sharma (Resident)</p>
                  </div>
                  {user?.role === 'citizen' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  onClick={() => {
                    switchRole('admin');
                    setActiveTab('admin_dashboard');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                    user?.role === 'admin' ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p>Municipal Admin</p>
                    <p className="text-[10px] text-slate-400">Commissioner Vikram Rao</p>
                  </div>
                  {user?.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </button>

                <button
                  onClick={() => {
                    switchRole('worker');
                    setActiveTab('worker_dashboard');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                    user?.role === 'worker' ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p>Sanitation Worker</p>
                    <p className="text-[10px] text-slate-400">Ramesh Kumar (Field Lead)</p>
                  </div>
                  {user?.role === 'worker' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

