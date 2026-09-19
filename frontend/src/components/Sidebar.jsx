import React, { useState } from 'react';
import { api } from '../services/api';

export function Sidebar({ activeTab, setActiveTab, systemStatus, isOpen, setIsOpen }) {
  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());
  const [savedMsg, setSavedMsg] = useState(false);

  const navItems = [
    { 
      id: 'overview', 
      num: '01', 
      label: '8-Stage Pipeline', 
      desc: 'Architecture & Stream Lifecycle'
    },
    { 
      id: 'simulator', 
      num: '02', 
      label: 'Batch AML Simulator', 
      desc: 'Live Multi-Rail Stream Sim'
    },
    { 
      id: 'single_test', 
      num: '03', 
      label: 'Single Transaction Tester', 
      desc: 'Isolated Forensics & Presets'
    },
    { 
      id: 'topology', 
      num: '04', 
      label: 'Network Graph Topology', 
      desc: 'Multi-Hop Crime Ring Explorer'
    },
    { 
      id: 'alerts', 
      num: '05', 
      label: 'Alerts & SAR Desk', 
      desc: 'FIU-IND Compliance Triage'
    },
    { 
      id: 'mlops', 
      num: '06', 
      label: 'MLOps & Drift Monitor', 
      desc: 'KS Tests & PSI Governance'
    },
    { 
      id: 'benchmark', 
      num: '07', 
      label: 'Benchmark Comparison', 
      desc: 'Existing AML vs Our Project'
    }
  ];

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

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Main Left Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 fintech-sidebar flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Brand Logo */}
        <div>
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">GNN AML</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  v1.0.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight">Financial Crime Intelligence</p>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              CLOSE
            </button>
          </div>

          {/* Clean Minimal Navigation Links (No Icons) */}
          <div className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Navigation Modules
            </div>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-mono font-bold ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                      {item.num}
                    </span>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-none">{item.desc}</div>
                    </div>
                  </div>
                  {isActive && <span className="text-xs text-blue-600 font-bold">→</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Telemetry, API Settings & User Profile */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 space-y-3">
          {/* Status Badge */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemStatus?.mode ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${systemStatus?.mode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-700">
                {systemStatus?.mode ? 'Resilient Simulator' : 'FastAPI REST Live'}
              </span>
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              title="API Configuration"
              className="text-[10px] font-bold text-slate-500 hover:text-blue-700 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 transition-colors"
            >
              CONFIG
            </button>
          </div>

          {/* External Links */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
            <a
              href="https://huggingface.co/spaces/abbasai-gnn/gnn-aml-transaction-monitoring"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-2xs"
            >
              <span>HF Space ↗</span>
            </a>

            <a
              href="https://github.com/abbhasaignn-del/gnn-aml-transaction-monitoring"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-2xs"
            >
              <span>GitHub ↗</span>
            </a>
          </div>

          {/* User Profile */}
          <div className="pt-2 border-t border-slate-200 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
              CO
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">Compliance Officer</div>
              <div className="text-[10px] text-slate-500 truncate">Tier-1 FIU Clearance</div>
            </div>
          </div>
        </div>

        {/* API Settings Modal */}
        {showConfig && (
          <div className="absolute bottom-20 left-4 right-4 z-50 p-4 rounded-xl bg-white border border-slate-300 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                Backend REST Target URL
              </h4>
              <button
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveConfig} className="space-y-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="https://abbasai-gnn-gnn-aml-transaction-monitoring.hf.space/api/v1"
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Points to Hugging Face or local <code className="text-blue-600">http://localhost:7860/api/v1</code>.
              </p>
              {savedMsg && (
                <p className="text-[11px] text-emerald-600 font-semibold">Settings saved!</p>
              )}
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="text-[11px] text-slate-500 hover:underline"
                >
                  Reset Default
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded bg-[#164E8A] hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Save URL
                </button>
              </div>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}
