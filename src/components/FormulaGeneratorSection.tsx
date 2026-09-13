import React, { useState } from 'react';
import { Binary, Copy, Check, Sparkles, ArrowRight, Lightbulb, BookOpen, Layers } from 'lucide-react';
import { api } from '../lib/api';
import { FormulaResult } from '../types';

export const FormulaGeneratorSection: React.FC = () => {
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FormulaResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    'Calculate gross profit margin percentage using Revenue and Cost',
    'Calculate month-over-month percentage growth',
    'XLOOKUP product code and return product price',
    'SUMIF total sales where region is Lagos',
    'Calculate average customer order value excluding empty cells',
  ];

  const handleGenerate = async (presetText?: string) => {
    const text = (presetText || promptInput).trim();
    if (!text) return;

    setLoading(true);
    setError(null);
    if (presetText) setPromptInput(presetText);

    try {
      const res = await api.generateFormula(text);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate formula.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.formula) return;
    navigator.clipboard.writeText(result.formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Excel Formula Generator</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Describe what you want to calculate in plain English. ExcelAI generates the exact formula and syntax.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mt-6">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            What do you want to calculate?
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="formula-desc-input"
              type="text"
              placeholder="e.g. Calculate profit margin using revenue in column B and cost in column C..."
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <button
              id="generate-formula-btn"
              onClick={() => handleGenerate()}
              disabled={loading || !promptInput.trim()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Formula</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset chips */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">Popular presets:</span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleGenerate(preset)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 text-[11px] font-medium transition-colors border border-transparent hover:border-emerald-200 text-left"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden animate-in fade-in">
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Formula</span>
              <p className="font-mono text-base sm:text-lg font-extrabold text-white mt-1 break-all select-all">
                {result.formula}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="self-start sm:self-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Formula</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 space-y-5 text-xs text-slate-700">
            {/* Description & Explanation */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>How This Formula Works</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">{result.explanation}</p>
            </div>

            {/* Example */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Cell Coordinate Scenario</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">{result.example}</p>
            </div>

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Formulas Best Practices</span>
                </h4>
                <ul className="space-y-1.5 text-slate-600 pl-5 list-disc">
                  {result.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
