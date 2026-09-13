import React, { useState } from 'react';
import { Crown, CheckCircle2, Zap, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PricingSection: React.FC = () => {
  const { user, setPlan } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handlePlanChange = async (targetPlan: 'free' | 'pro') => {
    setLoading(true);
    setNotice(null);
    try {
      await setPlan(targetPlan);
      setNotice(`Your account plan has been updated to ${targetPlan.toUpperCase()}!`);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setNotice(err.message || 'Failed to change plan.');
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = user?.plan || 'free';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Upgrade & Scale</span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Simple, Predictable Plans
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Choose the plan tailored to your spreadsheet volume and analysis needs.
        </p>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Plan comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Free Plan */}
        <div
          className={`bg-white p-8 rounded-2xl border ${
            currentPlan === 'free' ? 'border-slate-300 ring-2 ring-slate-400/20' : 'border-slate-200'
          } shadow-2xs flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Free Plan</span>
              {currentPlan === 'free' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Current Plan
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900">₦0</span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              For casual spreadsheet audits, small datasets, and testing questions.
            </p>

            <ul className="mt-6 space-y-3 text-xs text-slate-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>3 file uploads per month</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Maximum 5,000 rows per spreadsheet</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>10 AI questions per spreadsheet</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Basic data charts and previews</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Standard data quality audit</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handlePlanChange('free')}
            disabled={loading || currentPlan === 'free'}
            className="mt-8 w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentPlan === 'free' ? 'Currently Active' : 'Switch to Free'}
          </button>
        </div>

        {/* Pro Plan */}
        <div
          className={`bg-slate-900 text-white p-8 rounded-2xl border ${
            currentPlan === 'pro' ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-slate-800'
          } shadow-xl flex flex-col justify-between relative overflow-hidden`}
        >
          <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
            Recommended
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Pro Plan
              </span>
              {currentPlan === 'pro' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                  Current Plan
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">₦7,500</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              For analysts, managers, and finance teams analyzing high volume spreadsheets.
            </p>

            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited file uploads</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Large files (up to 100,000+ rows)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited AI questions & chats</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Advanced interactive charts & SVG export</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Executive AI Report Generator</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Priority processing engine</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handlePlanChange('pro')}
            disabled={loading || currentPlan === 'pro'}
            className="mt-8 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : currentPlan === 'pro' ? (
              'Currently Active'
            ) : (
              <>
                <span>Upgrade to Pro Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
