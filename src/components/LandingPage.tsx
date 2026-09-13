import React from 'react';
import {
  Sparkles,
  ArrowRight,
  UploadCloud,
  Cpu,
  MessageSquareQuote,
  TrendingUp,
  FileCheck2,
  PieChart,
  Binary,
  FileText,
  ShieldCheck,
  CheckCircle2,
  TableProperties,
} from 'lucide-react';
import { SAMPLE_SALES_DATA } from '../data/sampleData';

interface LandingPageProps {
  onStart: () => void;
  onTrySample: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onTrySample }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Subtle background gradient circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10 opacity-60">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-6 shadow-2xs animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI-Powered Spreadsheet Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Turn Your Excel Data Into <span className="text-emerald-600">Instant Insights</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload your Excel or CSV file, ask questions in plain English, and let AI analyze your data for you. No complex formulas required.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              id="hero-analyze-button"
              onClick={onStart}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Analyze My Spreadsheet</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              id="hero-sample-button"
              onClick={onTrySample}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm shadow-2xs hover:border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <TableProperties className="w-4 h-4 text-emerald-600" />
              <span>Try Sample Data</span>
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-500 font-medium px-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Supports .xlsx, .xls, .csv
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Ground-truth calculations
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 100% Secure & Private
            </span>
          </div>

          {/* Interactive Product Preview Mockup */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden text-left">
            {/* Top window bar */}
            <div className="h-10 bg-slate-100/90 border-b border-slate-200 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-500 font-medium">Enterprise_Sales_2024.xlsx • Sheet1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                  Active Analysis
                </span>
              </div>
            </div>

            {/* Dashboard Content preview */}
            <div className="p-5 sm:p-6 bg-slate-50/50 grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 columns: KPI cards + Spreadsheet rows preview */}
              <div className="lg:col-span-2 space-y-4">
                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Rows</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">35</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Verified</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Columns</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">9</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Categorized</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-xl font-extrabold text-emerald-700 mt-1">₦44.6M</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Calculated</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Quality Score</p>
                    <p className="text-xl font-extrabold text-emerald-600 mt-1">98/100</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">High Integrity</p>
                  </div>
                </div>

                {/* Table Snippet */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Dataset Preview</span>
                    <span className="text-[11px] text-slate-500">Showing first 4 records</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Product</th>
                          <th className="py-2 px-3">Region</th>
                          <th className="py-2 px-3 text-right">Revenue</th>
                          <th className="py-2 px-3 text-right">Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {SAMPLE_SALES_DATA.slice(0, 4).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{row.Date}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{row.Product}</td>
                            <td className="py-2 px-3">{row.Region}</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700">₦{row.Revenue.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-900">₦{row.Profit.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right column: AI Chat Preview */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Ask ExcelAI</p>
                      <p className="text-[10px] text-slate-500">Natural language data Q&A</p>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-2.5 text-xs">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-emerald-600 text-white px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-[11px] shadow-2xs">
                        What product generated the most revenue?
                      </div>
                    </div>

                    {/* AI Answer */}
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-800 px-3 py-2.5 rounded-2xl rounded-tl-sm max-w-[90%] text-[11px] leading-relaxed">
                        <span className="font-semibold text-emerald-800 block mb-0.5">Enterprise Cloud Suite</span>
                        Generated ₦14.4M in total revenue across 7 transactions. This accounts for ~32.3% of your total sales.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-400">
                    <span>Ask anything about your data...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Simple 4-Step Process</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">How ExcelAI Works</h2>
            <p className="text-sm text-slate-600 mt-2">
              From raw workbook to executive insights in under 10 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center justify-center mb-4 border border-emerald-100">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Upload</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your Excel (.xlsx, .xls) or CSV file. Multi-sheet workbooks are automatically detected.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 font-bold text-sm flex items-center justify-center mb-4 border border-teal-100">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Analyze</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ExcelAI calculates distributions, missing values, duplicates, and statistical outliers instantly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 font-bold text-sm flex items-center justify-center mb-4 border border-sky-100">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Ask</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ask questions about your data in plain English. Calculations are verified programmatically without hallucinations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center mb-4 border border-indigo-100">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Understand</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get answers, charts, trends, formulas, and actionable executive reports to share with your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Enterprise Capabilities</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Everything You Need To Master Your Data
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Engineered with mathematical precision and modern generative AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">AI Spreadsheet Analysis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically understands the structure, column types, statistical summaries, and quality of uploaded spreadsheets.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <MessageSquareQuote className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Natural Language Data Questions</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ask questions without knowing complicated Excel formulas. The backend computes the answers against your actual data.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Binary className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Excel Formula Generator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Describe what you want to calculate in plain words and receive the exact syntax, explanations, and cell coordinate examples.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Automatic Charts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate bar, line, pie, area, and scatter visualizations from your spreadsheet with custom aggregation controls.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">AI Reports</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate professional summaries, executive highlights, key findings, and actionable business recommendations in seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Data Quality Detection</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Detect missing values, duplicate records, empty columns, and potential numerical anomalies before presenting reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Transparent Pricing</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">Choose Your Plan</h2>
            <p className="text-sm text-slate-600 mt-2">
              Start free, upgrade whenever you need unlimited capacity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Free Tier */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Free Plan</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">₦0</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Ideal for casual analysis, quick validations, and exploring your spreadsheets.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>3 uploads per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Maximum 5,000 rows per file</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>10 AI questions per file</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Basic charts and data preview</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standard data quality audit</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStart}
                className="mt-8 w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                Start Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Recommended
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Pro Plan</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₦7,500</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  For business professionals, analysts, and teams requiring high volume processing.
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
                    <span>Unlimited AI questions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Advanced charts & customizable exports</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Executive AI Report Generator</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Priority GPU computation & support</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onStart}
                className="mt-8 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>ExcelAI</span>
          </div>
          <p>© {new Date().getFullYear()} ExcelAI Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-800 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-800 cursor-pointer">Security</span>
            <span className="hover:text-slate-800 cursor-pointer">API</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
