import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ArchitecturePipeline } from './components/ArchitecturePipeline';
import { BatchSimulator } from './components/BatchSimulator';
import { SingleTransactionTester } from './components/SingleTransactionTester';
import { TopologyExplorer } from './components/TopologyExplorer';
import { AlertsAndSarDesk } from './components/AlertsAndSarDesk';
import { MlopsMonitor } from './components/MlopsMonitor';
import { BenchmarkComparison } from './components/BenchmarkComparison';
import { api } from './services/api';


export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState(null);
  const [sarPrefill, setSarPrefill] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initial health ping to FastAPI backend
    api.getHealth().then((data) => setSystemStatus(data));
  }, []);

  const handleFileSarFromTester = (result) => {
    setSarPrefill(result);
    setActiveTab('alerts');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-800 flex">
      {/* Left Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        systemStatus={systemStatus}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area with Header */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-72">
        {/* Top Header */}
        <Header 
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          systemStatus={systemStatus}
        />

        {/* Page Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {activeTab === 'overview' && (
            <ArchitecturePipeline 
              onNavigateToSimulator={() => setActiveTab('simulator')} 
            />
          )}

          {activeTab === 'simulator' && (
            <BatchSimulator />
          )}

          {activeTab === 'single_test' && (
            <SingleTransactionTester 
              onFileSar={handleFileSarFromTester} 
            />
          )}

          {activeTab === 'topology' && (
            <TopologyExplorer />
          )}

          {activeTab === 'alerts' && (
            <AlertsAndSarDesk 
              prefilledAlert={sarPrefill} 
            />
          )}

          {activeTab === 'mlops' && (
            <MlopsMonitor />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkComparison />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#164E8A]"></span>
              <span className="font-semibold text-slate-700">GNN AML Financial Crime Intelligence</span>
              <span>•</span>
              <span>GraphSAGE Inductive Architecture</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <a 
                href="https://github.com/abbhasaignn-del/gnn-aml-transaction-monitoring" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                GitHub Repository
              </a>
              <span>•</span>
              <a 
                href="https://huggingface.co/spaces/abbasai-gnn/gnn-aml-transaction-monitoring" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                Hugging Face Space
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
