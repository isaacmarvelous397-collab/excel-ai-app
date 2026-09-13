import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BotMessageSquare,
  Binary,
  PieChart,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TableProperties,
  Sparkles,
  Info,
} from 'lucide-react';
import { SpreadsheetFile, SpreadsheetAnalysis, ColumnProfile } from '../types';

interface AnalysisDashboardProps {
  file: SpreadsheetFile;
  analysis: SpreadsheetAnalysis;
  onNavigateTab: (tab: string) => void;
  onSwitchSheet?: (sheetName: string) => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  file,
  analysis,
  onNavigateTab,
  onSwitchSheet,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'quality' | 'insights'>('preview');

  // Preview table state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);

  const rawRows = analysis.preview_rows || [];
  const columns = analysis.columns || [];

  // Sheet selector
  const sheets = file.all_sheets && file.all_sheets.length > 0 ? file.all_sheets : [file.sheet_name || 'Sheet1'];

  // Handle column sorting
  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(colName);
      setSortAsc(true);
    }
  };

  // Filtered and sorted rows
  const processedRows = useMemo(() => {
    let result = [...rawRows];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [rawRows, searchTerm, sortColumn, sortAsc]);

  const totalPages = Math.ceil(processedRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedRows.slice(start, start + rowsPerPage);
  }, [processedRows, currentPage, rowsPerPage]);

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'number':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'date':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'boolean':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 break-all sm:break-normal">{file.filename}</h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {file.file_type}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>{analysis.row_count.toLocaleString()} total rows</span>
              <span>•</span>
              <span>{analysis.column_count} columns</span>
              <span>•</span>
              <span>{(file.file_size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>

        {/* Sheet selector & Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {sheets.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs min-h-[38px]">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Sheet:</span>
              <select
                value={analysis.sheet_name || file.sheet_name}
                onChange={e => onSwitchSheet?.(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
              >
                {sheets.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => onNavigateTab('assistant')}
            className="min-h-[38px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <BotMessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>

          <button
            onClick={() => onNavigateTab('formulas')}
            className="min-h-[38px] px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Binary className="w-3.5 h-3.5 text-emerald-600" />
            <span>Formulas</span>
          </button>

          <button
            onClick={() => onNavigateTab('charts')}
            className="min-h-[38px] px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5"
          >
            <PieChart className="w-3.5 h-3.5 text-amber-500" />
            <span>Charts</span>
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="min-h-[38px] px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Rows</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1.5">{analysis.row_count.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Parsed successfully</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Columns</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1.5">{analysis.column_count}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {columns.filter(c => c.type === 'number').length} numeric, {columns.filter(c => c.type === 'text').length} text
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Missing Values</p>
          <p className={`text-2xl font-extrabold mt-1.5 ${analysis.data_quality.totalMissing > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {analysis.data_quality.totalMissing}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {analysis.data_quality.missingPercentage}% of total cells
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duplicate Rows</p>
          <p className={`text-2xl font-extrabold mt-1.5 ${analysis.data_quality.duplicateRowsCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {analysis.data_quality.duplicateRowsCount}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {analysis.data_quality.duplicatePercentage}% of dataset
          </p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs font-bold overflow-x-auto scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveSubTab('preview')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'preview'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TableProperties className="w-4 h-4" />
          <span>Data Preview & Grid</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
            {processedRows.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('quality')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'quality'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Data Quality & Audit</span>
          <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${analysis.data_quality.qualityScore >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {analysis.data_quality.qualityScore}/100
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('insights')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeSubTab === 'insights'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Automatic Insights</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px]">
            {analysis.insights.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DATA PREVIEW */}
      {activeSubTab === 'preview' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Table controls */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-slate-500">
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={e => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Table */}
          <div className="overflow-x-auto max-h-[550px] relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 font-mono text-[10px] text-slate-400 w-12 text-center border-r border-slate-200">
                    #
                  </th>
                  {analysis.column_names.map(colName => {
                    const colMeta = columns.find(c => c.name === colName);
                    const isSorted = sortColumn === colName;

                    return (
                      <th
                        key={colName}
                        onClick={() => handleSort(colName)}
                        className="py-2.5 px-3 font-bold text-slate-800 hover:bg-slate-200/70 cursor-pointer transition-colors whitespace-nowrap select-none border-r border-slate-200 last:border-r-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span>{colName}</span>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${getTypeBadgeColor(
                                colMeta?.type || 'text'
                              )}`}
                            >
                              {colMeta?.type || 'text'}
                            </span>
                          </div>
                          <ArrowUpDown
                            className={`w-3 h-3 ${
                              isSorted ? 'text-emerald-700' : 'text-slate-300'
                            }`}
                          />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={analysis.column_names.length + 1} className="py-8 text-center text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => {
                    const absIdx = (currentPage - 1) * rowsPerPage + rIdx + 1;
                    return (
                      <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 text-center bg-slate-50/50 border-r border-slate-100">
                          {absIdx}
                        </td>
                        {analysis.column_names.map(colName => {
                          const val = row[colName];
                          const colMeta = columns.find(c => c.name === colName);
                          const isNumeric = colMeta?.type === 'number';

                          return (
                            <td
                              key={colName}
                              className={`py-2.5 px-3 border-r border-slate-100 last:border-r-0 ${
                                isNumeric ? 'text-right font-mono' : ''
                              }`}
                            >
                              {val === null || val === undefined || val === '' ? (
                                <span className="italic text-slate-300">null</span>
                              ) : isNumeric && typeof val === 'number' ? (
                                colName.toLowerCase().includes('revenue') || colName.toLowerCase().includes('profit') || colName.toLowerCase().includes('cost') || colName.toLowerCase().includes('price') ? (
                                  `₦${val.toLocaleString()}`
                                ) : (
                                  val.toLocaleString()
                                )
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DATA QUALITY & AUDIT */}
      {activeSubTab === 'quality' && (
        <div className="space-y-6">
          {/* Health Score Overview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <div
                  className={`w-20 h-20 rounded-full border-4 flex items-center justify-center font-extrabold text-2xl ${
                    analysis.data_quality.qualityScore >= 80
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                      : 'border-amber-500 text-amber-700 bg-amber-50/50'
                  }`}
                >
                  {analysis.data_quality.qualityScore}%
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {analysis.data_quality.qualityScore >= 80
                    ? 'High Quality Dataset'
                    : 'Data Quality Needs Attention'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-lg leading-relaxed">
                  ExcelAI audited {analysis.row_count.toLocaleString()} rows and {analysis.column_count} columns. Missing cells, duplicate values, and numerical anomalies were evaluated.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Cells</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {analysis.data_quality.totalCells.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Missing Values</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {analysis.data_quality.totalMissing} ({analysis.data_quality.missingPercentage}%)
                </span>
              </div>
            </div>
          </div>

          {/* Warnings List */}
          {analysis.data_quality.warnings && analysis.data_quality.warnings.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Data Quality Findings ({analysis.data_quality.warnings.length})</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-900 pl-6 list-disc">
                {analysis.data_quality.warnings.map((warn: string, i: number) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Column Profile Cards Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Column Integrity Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.map(col => (
                <div
                  key={col.name}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={col.name}>
                      {col.name}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${getTypeBadgeColor(
                        col.type
                      )}`}
                    >
                      {col.type}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Missing Values:</span>
                      <span className={col.missingCount > 0 ? 'text-amber-600 font-bold' : 'font-medium'}>
                        {col.missingCount} ({col.missingPercentage}%)
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Unique Values:</span>
                      <span className="font-medium text-slate-800">{col.uniqueCount}</span>
                    </div>

                    {col.type === 'number' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Sum:</span>
                          <span className="font-mono font-medium text-slate-800">
                            {col.sum?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Average:</span>
                          <span className="font-mono font-medium text-slate-800">
                            {col.avg?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Range (Min - Max):</span>
                          <span className="font-mono text-[11px] text-slate-800">
                            {col.min?.toLocaleString()} to {col.max?.toLocaleString()}
                          </span>
                        </div>
                        {col.outliersCount !== undefined && col.outliersCount > 0 && (
                          <div className="flex justify-between text-amber-700 font-medium">
                            <span>Outliers Detected:</span>
                            <span>{col.outliersCount} rows</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATIC AI INSIGHTS */}
      {activeSubTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Calculated Key Insights</h3>
            <span className="text-xs text-slate-500">Derived directly from row computations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.insights.map(ins => {
              const getCategoryIcon = (cat: string) => {
                switch (cat) {
                  case 'revenue':
                    return <TrendingUp className="w-4 h-4 text-emerald-600" />;
                  case 'outlier':
                    return <AlertTriangle className="w-4 h-4 text-amber-600" />;
                  case 'quality':
                    return <ShieldCheck className="w-4 h-4 text-sky-600" />;
                  default:
                    return <Sparkles className="w-4 h-4 text-teal-600" />;
                }
              };

              return (
                <div
                  key={ins.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        {getCategoryIcon(ins.category)}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs">{ins.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">{ins.description}</p>
                  </div>

                  {ins.metric_value && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 uppercase font-bold text-[10px]">Computed Value</span>
                      <span className="font-extrabold text-slate-900 font-mono">{ins.metric_value}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
