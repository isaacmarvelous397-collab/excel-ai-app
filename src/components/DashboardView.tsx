import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  TableProperties,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SpreadsheetFile, SpreadsheetAnalysis } from '../types';

interface DashboardViewProps {
  files: SpreadsheetFile[];
  onFileSelected: (file: SpreadsheetFile, analysis?: SpreadsheetAnalysis) => void;
  onRefreshFiles: () => void;
  onUpgradeClick: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  files,
  onFileSelected,
  onRefreshFiles,
  onUpgradeClick,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<SpreadsheetFile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check monthly analyses limit (5 for free plan)
  const analysesUsed = user?.usage?.analyses_this_month ?? user?.usage?.uploads_this_month ?? 0;
  const isUploadLimitReached = user?.plan === 'free' && analysesUsed >= 5;
  const remainingAnalyses = user?.plan === 'free' ? Math.max(0, 5 - analysesUsed) : Infinity;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      await processSelectedFile(droppedFiles[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected && selected.length > 0) {
      await processSelectedFile(selected[0]);
    }
    // reset input so same file can be re-uploaded if desired
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processSelectedFile = async (file: File) => {
    setUploadError(null);

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
      setUploadError("This file type isn't supported. Please upload an XLSX, XLS, or CSV file.");
      return;
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('This file is too large. Please upload a file smaller than 10 MB.');
      return;
    }

    if (isUploadLimitReached) {
      setUploadError("You've reached your free-plan limit. Upgrade to Pro to continue.");
      return;
    }

    setUploadLoading(true);

    try {
      setLoadingStep('Reading file...');
      await new Promise(r => setTimeout(r, 250));

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // strip "data:*/*;base64,"
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      setLoadingStep('Detecting columns and data types...');
      await new Promise(r => setTimeout(r, 300));

      setLoadingStep('Checking data quality & generating initial insights...');
      const res = await api.uploadFile(file.name, base64);

      setLoadingStep('Complete!');
      await onRefreshFiles();
      onFileSelected(res.file, res.analysis);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || "We couldn't read this spreadsheet. Please check the file and try again.");
    } finally {
      setUploadLoading(false);
      setLoadingStep('');
    }
  };

  const handleLoadSample = async () => {
    setUploadError(null);
    setUploadLoading(true);
    setLoadingStep('Loading Enterprise Sales sample dataset...');
    try {
      const res = await api.loadSampleData();
      await onRefreshFiles();
      onFileSelected(res.file, res.analysis);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to load sample dataset.');
    } finally {
      setUploadLoading(false);
      setLoadingStep('');
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      setDeleteLoading(true);
      await api.deleteFile(fileToDelete.id);
      setFileToDelete(null);
      await onRefreshFiles();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to delete file.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome to ExcelAI{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload your spreadsheet. Ask questions. Get verified answers and reports.
          </p>
        </div>

        <button
          id="dashboard-sample-btn"
          onClick={handleLoadSample}
          disabled={uploadLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all shadow-2xs self-start sm:self-auto"
        >
          <TableProperties className="w-4 h-4 text-emerald-600" />
          <span>Try Sample Data</span>
        </button>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between gap-3 text-xs text-red-800">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{uploadError}</p>
              {uploadError.includes('free-plan limit') && (
                <button
                  onClick={onUpgradeClick}
                  className="mt-1.5 font-bold text-red-700 underline hover:text-red-900 block"
                >
                  Upgrade to Pro for unlimited uploads →
                </button>
              )}
            </div>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Plan Status & Monthly Analysis Quota Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              user?.plan === 'business'
                ? 'bg-purple-100 text-purple-800'
                : user?.plan === 'pro'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {user?.plan === 'business' ? 'BIZ' : user?.plan === 'pro' ? 'PRO' : 'FREE'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
              <span className="text-xs font-black text-slate-800 capitalize">{user?.plan || 'free'} Tier</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.plan === 'free' ? (
                <>
                  Monthly analyses: <strong className="text-slate-800">{analysesUsed} of 5 used</strong> ({remainingAnalyses} remaining this month)
                </>
              ) : (
                <>
                  <strong className="text-emerald-700">Unlimited spreadsheet analyses</strong> active (Up to {user?.plan === 'business' ? '500,000' : '100,000'} rows)
                </>
              )}
            </p>
          </div>
        </div>

        {user?.plan === 'free' ? (
          <button
            onClick={onUpgradeClick}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Upgrade to Pro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shrink-0">
            ✓ Full Access Enabled
          </span>
        )}
      </div>

      {/* Limit Reached Warning banner if applicable */}
      {isUploadLimitReached && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-amber-900">Monthly Limit Reached (5 / 5 analyses used)</p>
              <p className="text-amber-700">You've reached your free monthly limit of 5 spreadsheet analyses. Upgrade to Pro for unlimited analyses and 100k rows.</p>
            </div>
          </div>
          <button
            onClick={onUpgradeClick}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm shrink-0"
          >
            Upgrade to Pro (₦5,000)
          </button>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div
        id="spreadsheet-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploadLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/50 bg-white'
        } ${uploadLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploadLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-base font-bold text-slate-900">Analyzing your spreadsheet...</p>
            <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loadingStep || 'Processing...'}</span>
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
              <span>Reading</span> • <span>Detecting schema</span> • <span>Checking quality</span> • <span>Insights</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Drag and drop your spreadsheet here
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
              or browse from your computer. We support <strong className="text-slate-700">.xlsx</strong>, <strong className="text-slate-700">.xls</strong>, and <strong className="text-slate-700">.csv</strong> files.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload File</span>
              </button>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              Maximum file size: 10 MB. Free plan: Up to 5,000 rows.
            </p>
          </div>
        )}
      </div>

      {/* Recent Files Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Spreadsheets</h2>
            <p className="text-xs text-slate-500">Your uploaded and analyzed workbooks</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">{files.length} file{files.length === 1 ? '' : 's'}</span>
        </div>

        {files.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No spreadsheets yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Upload your first Excel or CSV file to start analyzing your data, generating charts, and asking questions.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              Upload Spreadsheet
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => onFileSelected(file)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60 font-bold">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{file.filename}</p>
                        <p className="text-[10px] text-slate-500">
                          {file.file_type.toUpperCase()} • {(file.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      id={`delete-file-mobile-${file.id}`}
                      onClick={e => {
                        e.stopPropagation();
                        setFileToDelete(file);
                      }}
                      title="Delete file"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
                      aria-label={`Delete ${file.filename}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">
                      {file.row_count.toLocaleString()} rows • {file.column_count} cols
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                      <span>Analyze</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Spreadsheet</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Dimensions</th>
                    <th className="py-3 px-4">Worksheet</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {files.map(file => (
                    <tr
                      key={file.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onFileSelected(file)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60 font-bold">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {file.filename}
                            </p>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {file.file_type}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {(file.file_size / 1024).toFixed(1)} KB
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">{file.row_count.toLocaleString()}</span> rows
                        <span className="text-slate-400 mx-1">•</span>
                        <span className="font-semibold text-slate-900">{file.column_count}</span> cols
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {file.sheet_name || 'Sheet1'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(file.uploaded_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            id={`open-file-${file.id}`}
                            onClick={() => onFileSelected(file)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors border border-emerald-200"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            id={`delete-file-${file.id}`}
                            onClick={() => setFileToDelete(file)}
                            title="Delete file"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-4 text-center sm:text-left animate-in fade-in duration-150"
          onClick={() => setFileToDelete(null)}
        >
          <div
            className="relative w-full max-w-sm my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 text-left"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900">Delete spreadsheet?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 break-all">{fileToDelete.filename}</strong>? This action will remove all associated analysis and conversations.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5">
              <button
                onClick={() => setFileToDelete(null)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFile}
                disabled={deleteLoading}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Spreadsheet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
