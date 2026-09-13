import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { AskAiSection } from './components/AskAiSection';
import { FormulaGeneratorSection } from './components/FormulaGeneratorSection';
import { ChartGeneratorSection } from './components/ChartGeneratorSection';
import { ReportGeneratorSection } from './components/ReportGeneratorSection';
import { MyFilesSection } from './components/MyFilesSection';
import { PricingSection } from './components/PricingSection';
import { SettingsSection } from './components/SettingsSection';
import { api } from './lib/api';
import { SpreadsheetFile, SpreadsheetAnalysis } from './types';
import { Menu, FileSpreadsheet, AlertCircle } from 'lucide-react';

function AppContent() {
  const { user, isLoading, loginWithGoogle } = useAuth();

  // App navigation state
  const [currentView, setCurrentView] = useState<string>('landing');
  const [activeFile, setActiveFile] = useState<SpreadsheetFile | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<SpreadsheetAnalysis | null>(null);
  const [files, setFiles] = useState<SpreadsheetFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Mobile drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync initial view when user logs in/out
  useEffect(() => {
    if (user && currentView === 'landing') {
      setCurrentView('dashboard');
    } else if (!user && currentView !== 'landing') {
      setCurrentView('landing');
      setActiveFile(null);
      setActiveAnalysis(null);
    }
  }, [user]);

  // Load user files whenever authenticated
  const loadFiles = async () => {
    if (!user) return;
    try {
      setLoadingFiles(true);
      const res = await api.getFiles();
      setFiles(res.files);

      // If activeFile is not set but files exist, select the most recent one
      if (!activeFile && res.files.length > 0) {
        handleSelectFile(res.files[0]);
      }
    } catch (err) {
      console.error('Failed to load user files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  // Select file and fetch its full analysis
  const handleSelectFile = async (file: SpreadsheetFile, initialAnalysis?: SpreadsheetAnalysis) => {
    setActiveFile(file);
    if (initialAnalysis) {
      setActiveAnalysis(initialAnalysis);
      setCurrentView('analyze');
      return;
    }

    try {
      const res = await api.getFile(file.id);
      setActiveFile(res.file);
      setActiveAnalysis(res.analysis);
      setCurrentView('analyze');
    } catch (err) {
      console.error('Failed to fetch file analysis:', err);
    }
  };

  // Switch sheet
  const handleSwitchSheet = async (sheetName: string) => {
    if (!activeFile) return;
    try {
      const res = await api.switchSheet(activeFile.id, sheetName);
      setActiveFile(res.file);
      setActiveAnalysis(res.analysis);
    } catch (err) {
      console.error('Failed to switch sheet:', err);
    }
  };

  // Try Sample Data flow
  const handleTrySample = async () => {
    if (!user) {
      // Create seamless trial session
      try {
        await loginWithGoogle('Analyst Demo', 'analyst.demo@excelai.app');
      } catch {
        setAuthModalMode('signup');
        setAuthModalOpen(true);
        return;
      }
    }

    try {
      const res = await api.loadSampleData();
      await loadFiles();
      handleSelectFile(res.file, res.analysis);
    } catch (err) {
      console.error('Sample data load error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading ExcelAI Workspace...</p>
      </div>
    );
  }

  // Landing Page view for unauthenticated users
  if (!user || currentView === 'landing') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Navbar
          onOpenAuth={mode => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />

        <LandingPage
          onStart={() => {
            if (user) {
              setCurrentView('dashboard');
            } else {
              setAuthModalMode('signup');
              setAuthModalOpen(true);
            }
          }}
          onTrySample={handleTrySample}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => {
            setCurrentView('dashboard');
          }}
        />
      </div>
    );
  }

  // Authenticated Application Workspace
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={mode => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeFileName={activeFile?.filename}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          activeFile={activeFile}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0">
          {/* Mobile sub-header bar */}
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>

            {activeFile && (
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate max-w-[200px]">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{activeFile.filename}</span>
              </div>
            )}
          </div>

          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {currentView === 'dashboard' && (
              <DashboardView
                files={files}
                onFileSelected={handleSelectFile}
                onRefreshFiles={loadFiles}
                onUpgradeClick={() => setCurrentView('pricing')}
              />
            )}

            {currentView === 'files' && (
              <MyFilesSection
                files={files}
                onFileSelected={handleSelectFile}
                onRefreshFiles={loadFiles}
                onNewUpload={() => setCurrentView('dashboard')}
              />
            )}

            {currentView === 'analyze' && activeFile && activeAnalysis && (
              <AnalysisDashboard
                file={activeFile}
                analysis={activeAnalysis}
                onNavigateTab={tab => setCurrentView(tab)}
                onSwitchSheet={handleSwitchSheet}
              />
            )}

            {currentView === 'assistant' && activeFile && (
              <AskAiSection
                file={activeFile}
                onUpgradeClick={() => setCurrentView('pricing')}
              />
            )}

            {currentView === 'formulas' && <FormulaGeneratorSection />}

            {currentView === 'charts' && activeFile && activeAnalysis && (
              <ChartGeneratorSection file={activeFile} analysis={activeAnalysis} />
            )}

            {currentView === 'reports' && activeFile && (
              <ReportGeneratorSection file={activeFile} />
            )}

            {currentView === 'pricing' && <PricingSection />}

            {currentView === 'settings' && <SettingsSection />}
          </div>
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
