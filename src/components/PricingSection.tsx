import React, { useState } from 'react';
import { Crown, CheckCircle2, Zap, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PaystackPaymentModal } from './PaystackPaymentModal';
import { PlanType } from '../types';

export const PricingSection: React.FC = () => {
  const { user, setPlan } = useAuth();
  const [modalTargetPlan, setModalTargetPlan] = useState<'pro' | 'business' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currentPlan = user?.plan || 'free';

  const handleDowngradeFree = async () => {
    try {
      await setPlan('free');
      setNotice('Your account plan has been updated to Free.');
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setNotice(err.message || 'Failed to change plan.');
    }
  };

  const handleUpgradeSuccess = (plan: PlanType) => {
    setModalTargetPlan(null);
    setNotice(`Congratulations! Your account is now upgraded to ${plan.toUpperCase()}.`);
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Plans & Subscriptions</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
          Simple, Transparent Pricing in NGN
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Start for free with 5 analyses each month, or scale up to Pro and Business for high-volume automated insights.
        </p>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 text-center flex items-center justify-center gap-2 max-w-xl mx-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Plan comparison 3 cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* 1. Free Plan */}
        <div
          className={`bg-white p-7 sm:p-8 rounded-2xl border ${
            currentPlan === 'free' ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200'
          } shadow-xs flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Free Tier</span>
              {currentPlan === 'free' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Current Plan
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">₦0</span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 min-h-[34px]">
              Perfect for students, freelancers, and small audits testing spreadsheets.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Included features:</h4>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>5 AI spreadsheet analyses</strong> / month</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to 5,000 rows per spreadsheet</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>10 AI questions per session</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated column profiles & statistics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Interactive charts & CSV exports</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleDowngradeFree}
            disabled={currentPlan === 'free'}
            className="mt-8 w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {currentPlan === 'free' ? 'Currently Active' : 'Switch to Free'}
          </button>
        </div>

        {/* 2. Pro Plan (Recommended) */}
        <div
          className={`bg-slate-900 text-white p-7 sm:p-8 rounded-2xl border ${
            currentPlan === 'pro' ? 'border-emerald-400 ring-2 ring-emerald-500/50' : 'border-slate-800'
          } shadow-xl flex flex-col justify-between relative overflow-hidden`}
        >
          <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
            Most Popular
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
              <span className="text-3xl sm:text-4xl font-black text-white">₦5,000</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 min-h-[34px]">
              For financial analysts, operators, and managers analyzing frequent datasets.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">All Free features, plus:</h4>
              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited spreadsheet analyses</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 100,000 rows per spreadsheet</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited AI questions & chats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI Formula Generator & Assistant</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Executive AI Report Builder & PDF export</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority analysis queue</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setModalTargetPlan('pro')}
            disabled={currentPlan === 'pro'}
            className="mt-8 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {currentPlan === 'pro' ? (
              'Currently Active'
            ) : (
              <>
                <span>Upgrade to Pro (₦5,000)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* 3. Business Plan */}
        <div
          className={`bg-white p-7 sm:p-8 rounded-2xl border ${
            currentPlan === 'business' ? 'border-purple-600 ring-2 ring-purple-500/20' : 'border-slate-200'
          } shadow-xs flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Business Plan
              </span>
              {currentPlan === 'business' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Current Plan
                </span>
              )}
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">₦15,000</span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 min-h-[34px]">
              For growing businesses and finance departments with massive data volume.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">All Pro features, plus:</h4>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>Up to 500,000 rows</strong> per spreadsheet</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Multi-sheet cross-correlation audits</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>High-priority dedicated AI compute</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Custom calculation rules & formulas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Team collaboration and shared workspaces</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setModalTargetPlan('business')}
            disabled={currentPlan === 'business'}
            className="mt-8 w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {currentPlan === 'business' ? (
              'Currently Active'
            ) : (
              <>
                <span>Upgrade to Business (₦15,000)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Paystack security badge */}
      <div className="pt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Payments secured with Paystack 256-bit encryption. Supports Nigerian cards, bank transfer & USSD.</span>
        </div>
      </div>

      {/* Paystack Checkout Modal */}
      {modalTargetPlan && (
        <PaystackPaymentModal
          isOpen={!!modalTargetPlan}
          targetPlan={modalTargetPlan}
          onClose={() => setModalTargetPlan(null)}
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </div>
  );
};
