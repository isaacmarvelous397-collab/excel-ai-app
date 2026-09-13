import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Crown,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { PaymentHistoryItem } from '../types';
import { PaystackPaymentModal } from './PaystackPaymentModal';

interface BillingDashboardProps {
  onNavigatePricing?: () => void;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ onNavigatePricing }) => {
  const { user, refreshUser } = useAuth();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [modalTargetPlan, setModalTargetPlan] = useState<'pro' | 'business' | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPaymentHistory();
      setPayments(res.payments || []);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const plan = user?.plan || 'free';
  const usage = user?.usage;
  const analysesUsed = usage?.analyses_this_month ?? usage?.uploads_this_month ?? 0;
  const analysesLimit = plan === 'free' ? 5 : Infinity;
  const remaining = analysesLimit === Infinity ? Infinity : Math.max(0, 5 - analysesUsed);
  const isLimitReached = plan === 'free' && analysesUsed >= 5;

  const renewalDate = user?.subscription?.end_date
    ? new Date(user.subscription.end_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Account Management</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Subscription & Usage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor your monthly spreadsheet quotas, active subscription, and Paystack billing history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {plan === 'free' ? (
            <button
              onClick={() => setModalTargetPlan('pro')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Upgrade to Pro (₦5,000)</span>
            </button>
          ) : plan === 'pro' ? (
            <button
              onClick={() => setModalTargetPlan('business')}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-700/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Upgrade to Business (₦15,000)</span>
            </button>
          ) : (
            <div className="px-3.5 py-1.5 bg-purple-100 text-purple-900 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Enterprise VIP Tier</span>
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Plan Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                plan === 'business'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : plan === 'pro'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {plan.toUpperCase()}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {plan === 'business' ? '₦15,000' : plan === 'pro' ? '₦5,000' : '₦0'}
              </span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {plan === 'free'
                ? 'Standard personal account'
                : renewalDate
                ? `Renews on ${renewalDate}`
                : 'Active subscription'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Billing Currency</span>
            <strong className="text-slate-800 font-bold">NGN (₦)</strong>
          </div>
        </div>

        {/* 2. Monthly Analyses Quota */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Analyses</span>
            <span className="text-xs font-semibold text-slate-600">
              {plan === 'free' ? `${analysesUsed} / 5 used` : 'Unlimited'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-black text-slate-900">
                {plan === 'free' ? `${remaining} Left` : 'Active'}
              </span>
              {plan === 'free' && (
                <span className="text-xs text-slate-500 font-medium">
                  {Math.round((analysesUsed / 5) * 100)}% used
                </span>
              )}
            </div>

            {plan === 'free' ? (
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isLimitReached ? 'bg-red-500' : analysesUsed >= 4 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, (analysesUsed / 5) * 100)}%` }}
                />
              </div>
            ) : (
              <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 w-full" />
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cycle Reset</span>
            <span className="font-semibold text-slate-700">1st of next month</span>
          </div>
        </div>

        {/* 3. Row Limit & Compute */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Max File Size / Rows</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900">
              {plan === 'business' ? '500,000 Rows' : plan === 'pro' ? '100,000 Rows' : '5,000 Rows'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {plan === 'free' ? 'Upgrade to Pro for 100k rows' : 'High volume processing enabled'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">AI Questions Quota</span>
            <strong className="text-slate-800 font-bold">
              {plan === 'free' ? '10 per file' : 'Unlimited'}
            </strong>
          </div>
        </div>
      </div>

      {/* Free Plan Limit Notice */}
      {isLimitReached && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">You've reached your free monthly limit (5/5 analyses used)</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Upgrade to ExcelAI Pro for ₦5,000/month to unlock unlimited spreadsheet uploads, deep insights, and 100,000 rows.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalTargetPlan('pro')}
            className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Payment History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Payment & Transaction History</h3>
          </div>
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Payment History Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When you upgrade to Pro or Business with Paystack, your official payment receipts and references will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map(p => {
                  const dateStr = new Date(p.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-900">{dateStr}</td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold uppercase text-xs">
                          {p.plan === 'business' ? 'ExcelAI Business' : 'ExcelAI Pro'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-900">
                        ₦{Number(p.amount).toLocaleString()} {p.currency}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span>{p.reference}</span>
                          <button
                            onClick={() => handleCopyRef(p.reference)}
                            title="Copy reference"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            {copiedRef === p.reference ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Processed securely by Paystack (Payment Card Industry Data Security Standard compliant)</span>
          </div>
          {onNavigatePricing && (
            <button
              onClick={onNavigatePricing}
              className="font-bold text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              <span>View All Plans</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Paystack Modal */}
      {modalTargetPlan && (
        <PaystackPaymentModal
          isOpen={!!modalTargetPlan}
          targetPlan={modalTargetPlan}
          onClose={() => setModalTargetPlan(null)}
          onSuccess={async () => {
            setModalTargetPlan(null);
            await fetchPayments();
            await refreshUser();
          }}
        />
      )}
    </div>
  );
};
