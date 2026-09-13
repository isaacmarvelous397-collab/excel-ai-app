import React, { useState } from 'react';
import { ShieldCheck, Lock, ExternalLink, CheckCircle2, AlertCircle, ArrowRight, X, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PlanType } from '../types';

interface PaystackPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: 'pro' | 'business';
  onSuccess: (plan: PlanType) => void;
}

export const PaystackPaymentModal: React.FC<PaystackPaymentModalProps> = ({
  isOpen,
  onClose,
  targetPlan,
  onSuccess,
}) => {
  const { user, refreshUser, updateUserState } = useAuth();

  const [step, setStep] = useState<'review' | 'initializing' | 'waiting' | 'success' | 'error'>('review');
  const [initData, setInitData] = useState<{
    authorization_url: string;
    reference: string;
    access_code: string;
    is_simulation?: boolean;
    amount: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const planInfo = targetPlan === 'pro'
    ? {
        name: 'ExcelAI Pro',
        price: '₦5,000',
        amount: 5000,
        period: '/ month',
        description: 'Unlimited spreadsheet analyses, high-volume files up to 100k rows, and executive reports.',
        features: [
          'Unlimited spreadsheet AI analyses per month',
          'High volume files up to 100,000 rows',
          'Unlimited AI questions & custom formulas',
          'Executive PDF/Markdown reports export',
          'Data quality audit & anomaly detection',
        ],
      }
    : {
        name: 'ExcelAI Business',
        price: '₦15,000',
        amount: 15000,
        period: '/ month',
        description: 'Enterprise data volume up to 500k rows, business-grade priority processing, and multi-sheet audit.',
        features: [
          'Everything in Pro included',
          'Enterprise datasets up to 500,000 rows',
          'Priority AI computation & dedicated capacity',
          'Multi-sheet cross-correlation audits',
          'Team & collaborative sharing ready',
        ],
      };

  const handleStartPayment = async () => {
    setStep('initializing');
    setErrorMessage(null);
    try {
      const res = await api.initializePayment(targetPlan, window.location.href);
      setInitData({
        authorization_url: res.authorization_url,
        reference: res.reference,
        access_code: res.access_code,
        is_simulation: res.is_simulation,
        amount: res.amount,
      });

      // If it's a real Paystack authorization URL, open in popup or new tab
      if (!res.is_simulation && res.authorization_url) {
        window.open(res.authorization_url, '_blank', 'noopener,noreferrer');
      }

      setStep('waiting');
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setErrorMessage(err.message || 'Failed to initialize Paystack payment.');
      setStep('error');
    }
  };

  const handleVerify = async (ref?: string) => {
    const reference = ref || initData?.reference;
    if (!reference) return;

    setVerifying(true);
    setErrorMessage(null);
    try {
      const res = await api.verifyPayment(reference, targetPlan);
      if (res.user) {
        updateUserState(res.user);
      } else {
        await refreshUser();
      }

      // Trigger celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }

      setStep('success');
      setTimeout(() => {
        onSuccess(targetPlan);
      }, 1500);
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(err.message || 'Payment verification could not be completed.');
      setStep('error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-4 text-center sm:text-left animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Paystack Secure Checkout</h3>
              <p className="text-[11px] text-slate-500">Official Nigerian Payment Gateway (NGN)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content based on step */}
        <div className="p-6">
          {step === 'review' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Selected Plan</span>
                  <h4 className="text-lg font-extrabold text-slate-900">{planInfo.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{planInfo.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-slate-900">{planInfo.price}</span>
                  <span className="text-xs text-slate-500 block">{planInfo.period}</span>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">Included in this plan:</h5>
                <ul className="space-y-2 text-xs text-slate-600">
                  {planInfo.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Payments are encrypted and processed securely via Paystack. Your card credentials never touch our servers.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartPayment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Pay {planInfo.price}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 'initializing' && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-800">Initializing Paystack Gateway...</p>
              <p className="text-xs text-slate-500">Generating secure transaction token and reference...</p>
            </div>
          )}

          {step === 'waiting' && initData && (
            <div className="space-y-5">
              {initData.is_simulation ? (
                /* Demo Simulation Helper Card */
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-950">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Paystack Simulation Mode Active</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    No live Paystack Secret Key is configured in the workspace environment yet. You can simulate the complete payment flow right now to test subscription activation, usage limit resets, and invoice generation.
                  </p>
                  <div className="pt-1 font-mono text-[10px] text-blue-700 bg-white/70 p-2 rounded border border-blue-100 truncate">
                    Reference: {initData.reference}
                  </div>
                </div>
              ) : (
                /* Live Paystack Waiting Card */
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Paystack Checkout Window Launched</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    A secure Paystack payment window has opened. Complete your card, bank transfer, or USSD payment, then click the button below to verify.
                  </p>
                  <a
                    href={initData.authorization_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    <span>Re-open Paystack Checkout Window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Amount: <strong className="text-slate-800">₦{initData.amount.toLocaleString()} NGN</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVerify()}
                    disabled={verifying}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{initData.is_simulation ? 'Complete Demo Payment' : 'I Have Paid — Verify Now'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Upgrade Successful!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your account has been upgraded to <strong>{planInfo.name}</strong>. Unlimited AI analyses and high-volume features are now active!
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Payment Error</h5>
                  <p className="text-[11px] mt-0.5">{errorMessage || 'Payment could not be confirmed.'}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => setStep('review')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
