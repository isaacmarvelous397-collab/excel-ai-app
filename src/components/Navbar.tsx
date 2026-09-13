import React from 'react';
import { FileSpreadsheet, Sparkles, LogOut, User, Crown, ChevronDown, CreditCard, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  activeFileName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  currentView,
  setCurrentView,
  activeFileName,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          id="navbar-brand-logo"
          onClick={() => setCurrentView(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">ExcelAI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                MVP
              </span>
            </div>
          </div>
        </div>

        {/* Active file indicator if in app */}
        {user && activeFileName && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200/80">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="max-w-[200px] truncate">{activeFileName}</span>
          </div>
        )}

        {/* Navigation links for Landing Page */}
        {!user && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => {
                setCurrentView('landing');
                setTimeout(() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => {
                setCurrentView('landing');
                setTimeout(() => document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className="hover:text-slate-900 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                setCurrentView('landing');
                setTimeout(() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
              }}
              className="hover:text-slate-900 transition-colors"
            >
              Pricing
            </button>
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                id="user-profile-menu-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center border border-emerald-300">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    {user.plan === 'business' ? (
                      <span className="text-purple-700 font-bold flex items-center gap-0.5">
                        <Building2 className="w-2.5 h-2.5" /> BIZ
                      </span>
                    ) : user.plan === 'pro' ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> PRO
                      </span>
                    ) : (
                      'Free Plan'
                    )}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-500">Plan:</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          user.plan === 'business'
                            ? 'bg-purple-100 text-purple-800'
                            : user.plan === 'pro'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.plan.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentView('dashboard');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('billing');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Billing & Quotas
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('pricing');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    Pricing Plans
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('settings');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Settings
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                id="navbar-login-button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
              >
                Log In
              </button>
              <button
                id="navbar-get-started-button"
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
