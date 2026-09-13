import React from 'react';
import {
  LayoutDashboard,
  FolderArchive,
  BarChart3,
  BotMessageSquare,
  Binary,
  FileText,
  Crown,
  Settings,
  LogOut,
  X,
  ChevronRight,
  FileSpreadsheet,
  Zap,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SpreadsheetFile } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  activeFile: SpreadsheetFile | null;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  activeFile,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'My Files', icon: FolderArchive },
    { id: 'analyze', label: 'Analyze Data', icon: BarChart3, requiresFile: true },
    { id: 'assistant', label: 'AI Assistant', icon: BotMessageSquare, requiresFile: true },
    { id: 'formulas', label: 'Formula Generator', icon: Binary },
    { id: 'reports', label: 'Reports', icon: FileText, requiresFile: true },
    { id: 'pricing', label: 'Pricing Plans', icon: Crown },
    { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string, requiresFile?: boolean) => {
    if (requiresFile && !activeFile) {
      setCurrentView('dashboard');
    } else {
      setCurrentView(id);
    }
    setMobileOpen(false);
  };

  const plan = user?.plan || 'free';
  const analysesUsed = user?.usage?.analyses_this_month ?? user?.usage?.uploads_this_month ?? 0;
  const analysesQuota = plan === 'free' ? `${analysesUsed} / 5 used` : 'Unlimited';
  const remaining = plan === 'free' ? Math.max(0, 5 - analysesUsed) : null;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex flex-col gap-5 overflow-y-auto">
          {/* Mobile close button */}
          <div className="flex lg:hidden items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Navigation</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active File Banner */}
          {activeFile ? (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-emerald-950 truncate">{activeFile.filename}</p>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    {activeFile.row_count} rows • {activeFile.column_count} cols
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
              <p className="text-xs font-medium text-slate-600">No active spreadsheet</p>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="mt-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Upload or select file →
              </button>
            </div>
          )}

          {/* Nav list */}
          <nav className="flex flex-col gap-1">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isDisabled = item.requiresFile && !activeFile;

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id, item.requiresFile)}
                  disabled={isDisabled}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : isDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDisabled ? 'text-slate-300' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isDisabled && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                      Need File
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom quota & logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col gap-3">
          {/* Usage widget */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="capitalize">{plan} Plan</span>
              </span>
              {plan === 'free' ? (
                <button
                  onClick={() => setCurrentView('pricing')}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  Upgrade
                </button>
              ) : (
                <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-[10px] text-slate-600">
              <div className="flex justify-between">
                <span>Monthly Analyses:</span>
                <span className="font-semibold text-slate-800">{analysesQuota}</span>
              </div>
              {remaining !== null && (
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className={`font-semibold ${remaining === 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {remaining} left
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            id="sidebar-logout-button"
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/70 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
