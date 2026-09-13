import React, { useState, useMemo, useRef } from 'react';
import {
  PieChart,
  BarChart,
  LineChart,
  Download,
  Sparkles,
  Layers,
  Settings2,
  TrendingUp,
} from 'lucide-react';
import { SpreadsheetFile, SpreadsheetAnalysis, ColumnProfile } from '../types';

interface ChartGeneratorSectionProps {
  file: SpreadsheetFile;
  analysis: SpreadsheetAnalysis;
}

export const ChartGeneratorSection: React.FC<ChartGeneratorSectionProps> = ({ file, analysis }) => {
  const chartSvgRef = useRef<SVGSVGElement>(null);

  const columns = analysis.columns || [];
  const numericColumns = columns.filter(c => c.type === 'number');
  const categoricalColumns = columns.filter(c => c.type === 'text' || c.type === 'date');

  // Chart configuration state
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [xAxisCol, setXAxisCol] = useState<string>(
    categoricalColumns[0]?.name || columns[0]?.name || ''
  );
  const [yAxisCol, setYAxisCol] = useState<string>(
    numericColumns[0]?.name || columns[1]?.name || ''
  );
  const [aggregation, setAggregation] = useState<'sum' | 'avg' | 'count'>('sum');

  // Compute aggregated chart data
  const chartData = useMemo(() => {
    const rawRows = analysis.preview_rows || [];
    if (!xAxisCol || rawRows.length === 0) return [];

    const groups = new Map<string, { total: number; count: number }>();

    for (const row of rawRows) {
      const xVal = row[xAxisCol] !== null && row[xAxisCol] !== undefined ? String(row[xAxisCol]) : 'Unknown';
      const yRaw = row[yAxisCol];
      const yVal = typeof yRaw === 'number' ? yRaw : parseFloat(yRaw) || 0;

      if (!groups.has(xVal)) {
        groups.set(xVal, { total: 0, count: 0 });
      }
      const g = groups.get(xVal)!;
      g.total += yVal;
      g.count += 1;
    }

    // Convert map to sorted array (top 10 categories to maintain readability)
    const result: { label: string; value: number }[] = [];
    for (const [label, { total, count }] of groups.entries()) {
      let finalVal = total;
      if (aggregation === 'avg') finalVal = count > 0 ? total / count : 0;
      if (aggregation === 'count') finalVal = count;
      result.push({ label, value: Math.round(finalVal * 100) / 100 });
    }

    // Sort descending by value and take top 10
    result.sort((a, b) => b.value - a.value);
    return result.slice(0, 10);
  }, [analysis.preview_rows, xAxisCol, yAxisCol, aggregation]);

  const maxVal = useMemo(() => {
    return Math.max(...chartData.map(d => d.value), 1);
  }, [chartData]);

  // Chart download function
  const handleDownloadSvg = () => {
    if (!chartSvgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(chartSvgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.filename.replace(/\.[^/.]+$/, '')}_chart.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const colors = [
    '#059669', // emerald-600
    '#0d9488', // teal-600
    '#0284c7', // sky-600
    '#6366f1', // indigo-500
    '#8b5cf6', // purple-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#14b8a6', // teal-500
    '#3b82f6', // blue-500
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chart Generator</h1>
              <p className="text-xs text-slate-500">
                Visualize trends, distributions, and comparisons from {file.filename}.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadSvg}
            disabled={chartData.length === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Chart</span>
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Chart Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chart Type</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setChartType('bar')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartType === 'bar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartType === 'line' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartType === 'area' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  chartType === 'pie' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pie
              </button>
            </div>
          </div>

          {/* X Axis Dimension */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">X-Axis (Category / Group)</label>
            <select
              value={xAxisCol}
              onChange={e => setXAxisCol(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Y Axis Metric */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Y-Axis (Value Metric)</label>
            <select
              value={yAxisCol}
              onChange={e => setYAxisCol(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Aggregation</label>
            <select
              value={aggregation}
              onChange={e => setAggregation(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="sum">Sum of values</option>
              <option value="avg">Average of values</option>
              <option value="count">Count of records</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {aggregation.toUpperCase()} of {yAxisCol} by {xAxisCol}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Showing top {chartData.length} categories</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Aggregated Data</span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            No data available for selected columns.
          </div>
        ) : (
          <div className="w-full">
            {chartType !== 'pie' && (
              <p className="sm:hidden text-[10px] text-slate-400 mb-2 flex items-center gap-1">
                <span>Swipe left/right to view full chart</span>
              </p>
            )}
            <div className="w-full overflow-x-auto">
            {chartType === 'pie' ? (
              /* Pie / Donut Chart View */
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6">
                <svg
                  ref={chartSvgRef}
                  viewBox="0 0 320 320"
                  className="w-64 h-64 shrink-0"
                >
                  {(() => {
                    const totalSum = chartData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                    let accumulatedAngle = 0;

                    return chartData.map((d, i) => {
                      const sliceAngle = (d.value / totalSum) * 360;
                      const startAngle = accumulatedAngle;
                      accumulatedAngle += sliceAngle;

                      // Radians
                      const startRad = ((startAngle - 90) * Math.PI) / 180;
                      const endRad = (((startAngle + sliceAngle) - 90) * Math.PI) / 180;

                      const cx = 160;
                      const cy = 160;
                      const r = 130;
                      const innerR = 60;

                      const x1 = cx + r * Math.cos(startRad);
                      const y1 = cy + r * Math.sin(startRad);
                      const x2 = cx + r * Math.cos(endRad);
                      const y2 = cy + r * Math.sin(endRad);

                      const x3 = cx + innerR * Math.cos(endRad);
                      const y3 = cy + innerR * Math.sin(endRad);
                      const x4 = cx + innerR * Math.cos(startRad);
                      const y4 = cy + innerR * Math.sin(startRad);

                      const largeArc = sliceAngle > 180 ? 1 : 0;
                      const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

                      return (
                        <path
                          key={d.label}
                          d={pathData}
                          fill={colors[i % colors.length]}
                          className="hover:opacity-85 transition-opacity cursor-pointer"
                        >
                          <title>{`${d.label}: ${d.value.toLocaleString()} (${Math.round((d.value / totalSum) * 100)}%)`}</title>
                        </path>
                      );
                    });
                  })()}
                </svg>

                {/* Legend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {chartData.map((d, i) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded shrink-0"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                      <span className="font-semibold text-slate-800 truncate max-w-[130px]" title={d.label}>
                        {d.label}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {d.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Bar / Line / Area Chart View */
              <div className="min-w-[600px] py-4">
                <svg
                  ref={chartSvgRef}
                  viewBox="0 0 700 320"
                  className="w-full h-72 overflow-visible"
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = 260 - pct * 220;
                    const val = Math.round(maxVal * pct);
                    return (
                      <g key={idx}>
                        <line
                          x1="60"
                          y1={y}
                          x2="680"
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="52"
                          y={y + 4}
                          textAnchor="end"
                          className="text-[10px] fill-slate-400 font-mono"
                        >
                          {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {chartType === 'area' && (
                    <polygon
                      points={`60,260 ${chartData
                        .map((d, i) => {
                          const x = 70 + (i * (600 / (chartData.length || 1))) + 25;
                          const y = 260 - (d.value / maxVal) * 220;
                          return `${x},${y}`;
                        })
                        .join(' ')} ${670},260`}
                      fill="url(#emeraldGradient)"
                      opacity="0.2"
                    />
                  )}

                  {/* SVG Gradients */}
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Line Path */}
                  {(chartType === 'line' || chartType === 'area') && (
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      points={chartData
                        .map((d, i) => {
                          const x = 70 + (i * (600 / (chartData.length || 1))) + 25;
                          const y = 260 - (d.value / maxVal) * 220;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Data Points / Bars */}
                  {chartData.map((d, i) => {
                    const colWidth = Math.min(45, 550 / (chartData.length || 1) - 10);
                    const x = 70 + i * (600 / (chartData.length || 1)) + 25 - colWidth / 2;
                    const barHeight = Math.max(4, (d.value / maxVal) * 220);
                    const y = 260 - barHeight;

                    return (
                      <g key={d.label} className="group">
                        {chartType === 'bar' ? (
                          <rect
                            x={x}
                            y={y}
                            width={colWidth}
                            height={barHeight}
                            rx="4"
                            fill="#059669"
                            className="hover:fill-emerald-700 transition-colors cursor-pointer"
                          >
                            <title>{`${d.label}: ${d.value.toLocaleString()}`}</title>
                          </rect>
                        ) : (
                          <circle
                            cx={x + colWidth / 2}
                            cy={y}
                            r="5"
                            fill="#059669"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="hover:r-7 transition-all cursor-pointer"
                          >
                            <title>{`${d.label}: ${d.value.toLocaleString()}`}</title>
                          </circle>
                        )}

                        {/* Value label on top of bar */}
                        <text
                          x={x + colWidth / 2}
                          y={y - 6}
                          textAnchor="middle"
                          className="text-[9px] fill-slate-500 font-mono font-bold"
                        >
                          {d.value >= 1000000
                            ? `${(d.value / 1000000).toFixed(1)}M`
                            : d.value >= 1000
                            ? `${(d.value / 1000).toFixed(0)}k`
                            : d.value}
                        </text>

                        {/* X-axis label */}
                        <text
                          x={x + colWidth / 2}
                          y="280"
                          textAnchor="middle"
                          className="text-[10px] fill-slate-600 font-medium"
                        >
                          {d.label.length > 10 ? `${d.label.slice(0, 9)}…` : d.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Axis base line */}
                  <line x1="60" y1="260" x2="680" y2="260" stroke="#cbd5e1" strokeWidth="1.5" />
                </svg>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
