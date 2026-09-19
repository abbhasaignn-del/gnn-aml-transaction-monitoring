import React, { useState } from 'react';
import { api } from '../services/api';

export function Navbar({ activeTab, setActiveTab, systemStatus }) {
  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    api.setBaseUrl(apiUrl);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleResetConfig = () => {
    api.resetBaseUrl();
    setApiUrl(api.getBaseUrl());
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const navItems = [
    { id: 'overview', label: '1. Pipeline Flow' },
    { id: 'simulator', label: '2. Batch Sim' },
    { id: 'single_test', label: '3. Pattern Test' },
    { id: 'topology', label: '4. Graph View' },
    { id: 'alerts', label: '5. Alerts & SAR' },
    { id: 'mlops', label: '6. MLOps' },
  ];

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#164E8A] flex items-center justify-center text-white font-black text-sm shadow-xs">
              GNN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">GNN AML MONITOR</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  v1.0.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Real-Time GraphSAGE Inductive Engine</p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemStatus?.mode ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${systemStatus?.mode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-[11px] font-medium text-slate-700">
                {systemStatus?.mode ? 'Resilient Simulator' : 'FastAPI REST Live'}
              </span>
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] font-bold text-slate-600 hover:text-blue-700 px-2 py-1 rounded-md bg-slate-100 border border-slate-200"
            >
              CONFIG
            </button>
          </div>
        </div>
      </div>

      {/* Config Drawer */}
      {showConfig && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto">
              <h4 className="text-xs font-bold text-slate-800">Backend API URL Target</h4>
              <p className="text-[11px] text-slate-500">Configure Hugging Face Space endpoint or local FastAPI server.</p>
            </div>
            <form onSubmit={handleSaveConfig} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono w-full sm:w-80"
                placeholder="https://abbasai-gnn-gnn-aml-transaction-monitoring.hf.space/api/v1"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-[#164E8A] hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleResetConfig}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap"
              >
                Reset
              </button>
            </form>
          </div>
          {savedMsg && (
            <div className="max-w-7xl mx-auto mt-2 text-right">
              <span className="text-[11px] text-emerald-600 font-semibold">Settings saved successfully!</span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
