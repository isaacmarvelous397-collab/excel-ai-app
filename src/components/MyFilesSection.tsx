import React, { useState } from 'react';
import {
  FolderArchive,
  FileSpreadsheet,
  Trash2,
  ArrowRight,
  UploadCloud,
  TableProperties,
} from 'lucide-react';
import { api } from '../lib/api';
import { SpreadsheetFile } from '../types';

interface MyFilesSectionProps {
  files: SpreadsheetFile[];
  onFileSelected: (file: SpreadsheetFile) => void;
  onRefreshFiles: () => void;
  onNewUpload: () => void;
}

export const MyFilesSection: React.FC<MyFilesSectionProps> = ({
  files,
  onFileSelected,
  onRefreshFiles,
  onNewUpload,
}) => {
  const [fileToDelete, setFileToDelete] = useState<SpreadsheetFile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      setDeleteLoading(true);
      await api.deleteFile(fileToDelete.id);
      setFileToDelete(null);
      await onRefreshFiles();
    } catch (err) {
      console.error('Delete file error:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Spreadsheets</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access and manage your uploaded Excel and CSV datasets.
          </p>
        </div>

        <button
          onClick={onNewUpload}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Spreadsheet</span>
        </button>
      </div>

      {files.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FolderArchive className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No spreadsheets saved</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            You haven't uploaded any spreadsheets yet. Upload a workbook to get started with instant AI analysis.
          </p>
          <button
            onClick={onNewUpload}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Upload First Spreadsheet
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {files.map(f => (
              <div
                key={f.id}
                onClick={() => onFileSelected(f)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 font-bold">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{f.filename}</h4>
                      <p className="text-[10px] text-slate-500">
                        {f.file_type.toUpperCase()} • {(f.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setFileToDelete(f);
                    }}
                    title="Delete file"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
                    aria-label={`Delete ${f.filename}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    {f.row_count.toLocaleString()} rows • {f.column_count} cols
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
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Records</th>
                  <th className="py-3 px-4">Columns</th>
                  <th className="py-3 px-4">Sheet</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {files.map(f => (
                  <tr
                    key={f.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => onFileSelected(f)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 font-bold">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {f.filename}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono uppercase font-bold text-[10px] text-slate-500">
                      {f.file_type}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {(f.file_size / 1024).toFixed(1)} KB
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {f.row_count.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {f.column_count}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        {f.sheet_name || 'Sheet1'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(f.uploaded_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onFileSelected(f)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors border border-emerald-200"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => setFileToDelete(f)}
                          title="Delete"
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
              Are you sure you want to permanently remove <strong className="text-slate-900 break-all">{fileToDelete.filename}</strong>? All associated charts, audits, and chat history will be deleted.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5">
              <button
                onClick={() => setFileToDelete(null)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60"
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
