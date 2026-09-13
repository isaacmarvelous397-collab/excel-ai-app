import React, { useState } from 'react';
import { User, Lock, Trash2, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Crown, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export const SettingsSection: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!name.trim()) return;

    try {
      setProfileLoading(true);
      const res = await api.updateProfile(name.trim());
      await refreshUser();
      setProfileMsg({ type: 'success', text: res.message });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await api.deleteAccount();
      await logout();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal details, subscription usage, and security.
        </p>
      </div>

      {/* Plan & Usage Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Subscription & Usage</h3>
            <p className="text-xs text-slate-500">Your current billing tier and resource limits</p>
          </div>
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
              user?.plan === 'pro'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            {user?.plan === 'pro' && <Crown className="w-3.5 h-3.5" />}
            <span>{user?.plan || 'FREE'} PLAN</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-medium">Monthly Spreadsheets</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-bold text-slate-900">
                {user?.usage?.uploads_limit === Infinity ? 'Unlimited' : `${user?.usage?.uploads_this_month || 0} used`}
              </span>
              <span className="text-slate-500 text-[11px]">
                {user?.usage?.uploads_limit === Infinity ? 'Pro Tier' : `Limit: ${user?.usage?.uploads_limit || 3}`}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-medium">AI Questions Asked</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-bold text-slate-900">
                {user?.usage?.ai_questions_limit === Infinity ? 'Unlimited' : `${user?.usage?.ai_questions_used || 0} used`}
              </span>
              <span className="text-slate-500 text-[11px]">
                {user?.usage?.ai_questions_limit === Infinity ? 'Pro Tier' : `Limit: ${user?.usage?.ai_questions_limit || 10}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Personal Information</h3>
        <p className="text-xs text-slate-500 mb-4">Update your display name.</p>

        {profileMsg && (
          <div
            className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {profileMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 block mt-1">Email address cannot be changed directly.</span>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-60"
          >
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Security Form (Change Password) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Password & Security</h3>
        <p className="text-xs text-slate-500 mb-4">Ensure your account uses a strong, unique password.</p>

        {passwordMsg && (
          <div
            className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {passwordMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                id="settings-current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                id="toggle-current-password"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-700 transition-colors rounded-lg"
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                title={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                id="settings-new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                id="toggle-new-password"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-700 transition-colors rounded-lg"
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                title={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                id="settings-confirm-password"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                id="toggle-confirm-password"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-700 transition-colors rounded-lg"
                aria-label={showConfirmNewPassword ? "Hide confirm password" : "Show confirm password"}
                title={showConfirmNewPassword ? "Hide password" : "Show password"}
              >
                {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-60"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-2xs">
        <div className="flex items-center gap-2 text-red-600 mb-1">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-sm font-bold">Danger Zone</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Permanently delete your ExcelAI user account and all uploaded spreadsheets, analyses, and saved conversations.
        </p>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Account</span>
        </button>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-4 text-center sm:text-left animate-in fade-in duration-150"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="relative w-full max-w-sm my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 text-left"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900">Delete account permanently?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This action cannot be undone. All your uploaded datasets, calculated insights, formulas, and conversations will be wiped immediately.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Account Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
