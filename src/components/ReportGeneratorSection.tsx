import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { SpreadsheetFile, AiReport } from '../types';

interface ReportGeneratorSectionProps {
  file: SpreadsheetFile;
}

export const ReportGeneratorSection: React.FC<ReportGeneratorSectionProps> = ({ file }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AiReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateReport(file.id);
      setReport(res.report);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const getReportAsMarkdown = () => {
    if (!report) return '';
    return `# ${report.title}
Generated: ${new Date(report.generated_at).toLocaleString()}
Spreadsheet: ${file.filename}

## Executive Summary
${report.executive_summary}

## Key Findings
${report.key_findings.map(f => `- ${f}`).join('\n')}

## Business & Data Trends
${report.trends.map(t => `- ${t}`).join('\n')}

## Data Quality & Integrity Notes
${report.data_quality_notes.map(q => `- ${q}`).join('\n')}

## Strategic Recommendations
${report.recommendations.map(r => `- ${r}`).join('\n')}
`;
  };

  const handleCopy = () => {
    const md = getReportAsMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const md = getReportAsMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.filename.replace(/\.[^/.]+$/, '')}_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Executive Report</h1>
            <p className="text-xs text-slate-500">
              Generate structured business summaries and recommendations for {file.filename}.
            </p>
          </div>
        </div>

        <button
          id="generate-report-btn"
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating report...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{report ? 'Regenerate Report' : 'Generate AI Report'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generated Report View */}
      {report ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden animate-in fade-in">
          {/* Action Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Report generated on {new Date(report.generated_at).toLocaleDateString()} at{' '}
                {new Date(report.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleCopy}
                className="min-h-[36px] px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="min-h-[36px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export (.md)</span>
              </button>
            </div>
          </div>

          {/* Report Body */}
          <div className="p-6 sm:p-8 space-y-8 text-xs text-slate-700 leading-relaxed">
            {/* Title */}
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                Executive Brief
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{report.title}</h2>
            </div>

            {/* 1. Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Executive Summary</span>
              </h3>
              <p className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 leading-relaxed text-slate-800">
                {report.executive_summary}
              </p>
            </div>

            {/* 2. Key Findings */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Key Findings</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {report.key_findings.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-slate-800 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Trends */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Observed Trends</span>
              </h3>
              <ul className="space-y-2 pl-4 list-disc text-slate-700">
                {report.trends.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 4. Data Quality Notes */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Data Quality Notes</span>
              </h3>
              <ul className="space-y-2 pl-4 list-disc text-slate-700">
                {report.data_quality_notes.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 5. Strategic Recommendations */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Recommendations</span>
              </h3>
              <div className="space-y-2">
                {report.recommendations.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-emerald-950 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No report generated yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Click "Generate AI Report" to create an executive summary, findings, data audit, and strategic recommendations based on {file.filename}.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Report Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
