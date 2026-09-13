import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ColumnProfile, DataQualityReport, InsightItem, SpreadsheetAnalysis } from '../src/types.js';

export interface ParsedSpreadsheet {
  sheets: string[];
  selectedSheet: string;
  rows: Record<string, any>[];
  columns: string[];
}

export function parseFileBuffer(buffer: Buffer, filename: string, sheetOverride?: string): ParsedSpreadsheet {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text = buffer.toString('utf-8');
    const result = Papa.parse<Record<string, any>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
    });

    if (result.errors && result.errors.length > 0 && (!result.data || result.data.length === 0)) {
      throw new Error(`CSV parsing error: ${result.errors[0].message}`);
    }

    const rows = result.data.filter(row => row && Object.keys(row).length > 0);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      sheets: ['Sheet1'],
      selectedSheet: 'Sheet1',
      rows,
      columns,
    };
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheets = workbook.SheetNames;
    if (sheets.length === 0) {
      throw new Error('Workbook contains no sheets.');
    }

    const targetSheet = sheetOverride && sheets.includes(sheetOverride) ? sheetOverride : sheets[0];
    const worksheet = workbook.Sheets[targetSheet];
    if (!worksheet) {
      throw new Error(`Worksheet ${targetSheet} not found.`);
    }

    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      sheets,
      selectedSheet: targetSheet,
      rows,
      columns,
    };
  }

  throw new Error("This file type isn't supported. Please upload an XLSX, XLS, or CSV file.");
}

export function analyzeDataset(rows: Record<string, any>[], filename: string, sheetName: string, allSheets: string[]): SpreadsheetAnalysis {
  const rowCount = rows.length;
  if (rowCount === 0) {
    return {
      id: `anl_${Date.now()}`,
      file_id: '',
      sheet_name: sheetName,
      all_sheets: allSheets,
      row_count: 0,
      column_count: 0,
      column_names: [],
      columns: [],
      data_quality: {
        totalCells: 0,
        totalMissing: 0,
        missingPercentage: 0,
        duplicateRowsCount: 0,
        duplicatePercentage: 0,
        emptyColumnsCount: 0,
        columnsQuality: [],
        qualityScore: 100,
        warnings: ['Empty dataset'],
      },
      insights: [],
      preview_rows: [],
      created_at: new Date().toISOString(),
    };
  }

  const columnNames = Object.keys(rows[0]);
  const columnCount = columnNames.length;

  // Detect duplicate rows
  const rowStrings = new Set<string>();
  let duplicateRowsCount = 0;
  for (const row of rows) {
    const serialized = JSON.stringify(row);
    if (rowStrings.has(serialized)) {
      duplicateRowsCount++;
    } else {
      rowStrings.add(serialized);
    }
  }

  let totalMissingCells = 0;
  const columnProfiles: ColumnProfile[] = [];

  for (const col of columnNames) {
    let missingCount = 0;
    const values: any[] = [];
    const nonNullValues: any[] = [];

    for (const row of rows) {
      const val = row[col];
      values.push(val);
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        missingCount++;
      } else {
        nonNullValues.push(val);
      }
    }

    totalMissingCells += missingCount;

    // Detect type
    let numCount = 0;
    let dateCount = 0;
    let boolCount = 0;

    for (const val of nonNullValues) {
      if (typeof val === 'number') {
        numCount++;
      } else if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val) && !isNaN(Date.parse(val)))) {
        dateCount++;
      } else if (typeof val === 'boolean' || val === 'true' || val === 'false') {
        boolCount++;
      }
    }

    const totalValid = nonNullValues.length;
    let detectedType: 'number' | 'text' | 'date' | 'boolean' = 'text';

    if (totalValid > 0) {
      if (numCount / totalValid > 0.7) detectedType = 'number';
      else if (dateCount / totalValid > 0.7) detectedType = 'date';
      else if (boolCount / totalValid > 0.7) detectedType = 'boolean';
    }

    const uniqueSet = new Set(nonNullValues);
    const uniqueCount = uniqueSet.size;

    const profile: ColumnProfile = {
      name: col,
      type: detectedType,
      missingCount,
      missingPercentage: Math.round((missingCount / rowCount) * 1000) / 10,
      uniqueCount,
      sampleValues: nonNullValues.slice(0, 5),
    };

    if (detectedType === 'number') {
      const numbers = nonNullValues
        .map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]+/g, '')))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

      if (numbers.length > 0) {
        const sum = numbers.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / numbers.length;
        const min = numbers[0];
        const max = numbers[numbers.length - 1];
        const median = numbers[Math.floor(numbers.length / 2)];

        profile.sum = Math.round(sum * 100) / 100;
        profile.avg = Math.round(avg * 100) / 100;
        profile.min = min;
        profile.max = max;
        profile.median = median;

        // Outlier detection via IQR
        const q1 = numbers[Math.floor(numbers.length * 0.25)];
        const q3 = numbers[Math.floor(numbers.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = numbers.filter(n => n < lowerBound || n > upperBound);
        profile.potentialOutliersCount = outliers.length;
      }
    } else if (detectedType === 'date') {
      const dates = nonNullValues
        .map(d => (d instanceof Date ? d.getTime() : new Date(d).getTime()))
        .filter(t => !isNaN(t))
        .sort((a, b) => a - b);

      if (dates.length > 0) {
        profile.min = new Date(dates[0]).toISOString().split('T')[0];
        profile.max = new Date(dates[dates.length - 1]).toISOString().split('T')[0];
      }
    }

    columnProfiles.push(profile);
  }

  const totalCells = rowCount * columnCount;
  const missingPercentage = totalCells > 0 ? Math.round((totalMissingCells / totalCells) * 1000) / 10 : 0;
  const duplicatePercentage = rowCount > 0 ? Math.round((duplicateRowsCount / rowCount) * 1000) / 10 : 0;
  const emptyColumnsCount = columnProfiles.filter(c => c.missingCount === rowCount).length;

  // Quality score formula: starts at 100, drops by missing % and duplicate %
  let qualityScore = Math.max(0, Math.min(100, Math.round(100 - (missingPercentage * 1.5) - (duplicatePercentage * 1.2) - (emptyColumnsCount * 5))));

  const warnings: string[] = [];
  if (duplicateRowsCount > 0) {
    warnings.push(`Detected ${duplicateRowsCount} duplicate record${duplicateRowsCount > 1 ? 's' : ''} (${duplicatePercentage}% of total rows).`);
  }
  if (missingPercentage > 5) {
    warnings.push(`${missingPercentage}% of all values are missing across columns.`);
  }
  if (emptyColumnsCount > 0) {
    warnings.push(`${emptyColumnsCount} column${emptyColumnsCount > 1 ? 's are' : ' is'} completely empty.`);
  }
  for (const c of columnProfiles) {
    if (c.potentialOutliersCount && c.potentialOutliersCount > 0) {
      warnings.push(`Column "${c.name}" has ${c.potentialOutliersCount} potential numerical outlier${c.potentialOutliersCount > 1 ? 's' : ''}.`);
    }
  }

  const dataQuality: DataQualityReport = {
    totalCells,
    totalMissing: totalMissingCells,
    missingPercentage,
    duplicateRowsCount,
    duplicatePercentage,
    emptyColumnsCount,
    columnsQuality: columnProfiles,
    qualityScore,
    warnings,
  };

  // Generate deterministic, verified insights
  const insights = generateInsights(rows, columnProfiles);

  return {
    id: `anl_${Date.now()}`,
    file_id: '',
    sheet_name: sheetName,
    all_sheets: allSheets,
    row_count: rowCount,
    column_count: columnCount,
    column_names: columnNames,
    columns: columnProfiles,
    data_quality: dataQuality,
    insights,
    preview_rows: rows.slice(0, 500), // top 500 rows for high-performance preview
    created_at: new Date().toISOString(),
  };
}

function generateInsights(rows: Record<string, any>[], profiles: ColumnProfile[]): InsightItem[] {
  const insights: InsightItem[] = [];

  // Find candidate columns
  const findCol = (terms: string[]) =>
    profiles.find(p => terms.some(t => p.name.toLowerCase().includes(t.toLowerCase())));

  const revCol = findCol(['revenue', 'sales', 'turnover', 'amount', 'total_amount', 'price']);
  const prodCol = findCol(['product', 'item', 'description', 'service', 'sku']);
  const custCol = findCol(['customer', 'client', 'company', 'buyer', 'account']);
  const regCol = findCol(['region', 'country', 'city', 'state', 'territory', 'location']);
  const dateCol = findCol(['date', 'month', 'year', 'time', 'period']);
  const profCol = findCol(['profit', 'margin', 'net_income']);
  const qtyCol = findCol(['quantity', 'qty', 'units', 'volume']);

  // Total Revenue Insight
  if (revCol && revCol.sum !== undefined) {
    insights.push({
      id: 'ins_total_rev',
      category: 'revenue',
      title: 'Total Gross Revenue',
      description: `Total accumulated ${revCol.name} across ${rows.length} records is ₦${revCol.sum.toLocaleString()}`,
      metric: revCol.name,
      value: `₦${revCol.sum.toLocaleString()}`,
      impact: 'positive',
    });
  }

  // Top Selling Product
  if (prodCol && (revCol || qtyCol)) {
    const metricCol = revCol || qtyCol!;
    const agg: Record<string, number> = {};
    for (const r of rows) {
      const prod = String(r[prodCol.name] || 'Unknown');
      const val = Number(r[metricCol.name]) || 0;
      agg[prod] = (agg[prod] || 0) + val;
    }
    const sorted = Object.entries(agg).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const top = sorted[0];
      insights.push({
        id: 'ins_top_product',
        category: 'performance',
        title: `Top-Selling ${prodCol.name}`,
        description: `"${top[0]}" leads with ₦${top[1].toLocaleString()} in total ${metricCol.name}.`,
        metric: top[0],
        value: `₦${top[1].toLocaleString()}`,
        impact: 'positive',
      });

      if (sorted.length > 2) {
        const bottom = sorted[sorted.length - 1];
        insights.push({
          id: 'ins_lowest_product',
          category: 'performance',
          title: `Lowest Performing ${prodCol.name}`,
          description: `"${bottom[0]}" had the lowest recorded ${metricCol.name} at ₦${bottom[1].toLocaleString()}.`,
          metric: bottom[0],
          value: `₦${bottom[1].toLocaleString()}`,
          impact: 'neutral',
        });
      }
    }
  }

  // Regional Performance
  if (regCol && revCol) {
    const regAgg: Record<string, number> = {};
    for (const r of rows) {
      const reg = String(r[regCol.name] || 'Unknown');
      const val = Number(r[revCol.name]) || 0;
      regAgg[reg] = (regAgg[reg] || 0) + val;
    }
    const sortedReg = Object.entries(regAgg).sort((a, b) => b[1] - a[1]);
    if (sortedReg.length > 0) {
      const topReg = sortedReg[0];
      const totalRev = revCol.sum || 1;
      const share = Math.round((topReg[1] / totalRev) * 100);
      insights.push({
        id: 'ins_top_region',
        category: 'trend',
        title: `Top Market: ${topReg[0]}`,
        description: `${topReg[0]} generated ₦${topReg[1].toLocaleString()} representing ~${share}% of overall revenue.`,
        metric: topReg[0],
        value: `${share}% share`,
        impact: 'positive',
      });
    }
  }

  // Profit Margin Insight
  if (profCol && revCol && revCol.sum && profCol.sum) {
    const margin = Math.round((profCol.sum / revCol.sum) * 1000) / 10;
    insights.push({
      id: 'ins_profit_margin',
      category: 'revenue',
      title: 'Overall Profit Margin',
      description: `Total net profit of ₦${profCol.sum.toLocaleString()} yields an overall margin of ${margin}%.`,
      metric: 'Profit Margin',
      value: `${margin}%`,
      impact: margin > 20 ? 'positive' : 'neutral',
    });
  }

  // Best Performing Month / Date Trend
  if (dateCol && revCol) {
    const monthAgg: Record<string, number> = {};
    for (const r of rows) {
      const rawDate = r[dateCol.name];
      if (rawDate) {
        const dStr = String(rawDate);
        const monthKey = dStr.slice(0, 7); // e.g. 2024-03
        const val = Number(r[revCol.name]) || 0;
        monthAgg[monthKey] = (monthAgg[monthKey] || 0) + val;
      }
    }
    const sortedMonths = Object.entries(monthAgg).sort((a, b) => b[1] - a[1]);
    if (sortedMonths.length > 0) {
      const best = sortedMonths[0];
      insights.push({
        id: 'ins_best_month',
        category: 'trend',
        title: `Peak Performance Period: ${best[0]}`,
        description: `Month ${best[0]} achieved the highest recorded revenue of ₦${best[1].toLocaleString()}.`,
        metric: best[0],
        value: `₦${best[1].toLocaleString()}`,
        impact: 'positive',
      });
    }
  }

  // Customer Concentration
  if (custCol && revCol) {
    const custAgg: Record<string, number> = {};
    for (const r of rows) {
      const c = String(r[custCol.name] || 'Unknown');
      const val = Number(r[revCol.name]) || 0;
      custAgg[c] = (custAgg[c] || 0) + val;
    }
    const sortedCust = Object.entries(custAgg).sort((a, b) => b[1] - a[1]);
    if (sortedCust.length > 0) {
      const topCust = sortedCust[0];
      insights.push({
        id: 'ins_top_customer',
        category: 'performance',
        title: `Primary Customer: ${topCust[0]}`,
        description: `Top client "${topCust[0]}" accounted for ₦${topCust[1].toLocaleString()} in purchases.`,
        metric: topCust[0],
        value: `₦${topCust[1].toLocaleString()}`,
        impact: 'positive',
      });
    }
  }

  return insights;
}

export function executeProgrammaticQuery(query: string, rows: Record<string, any>[], profiles: ColumnProfile[]): {
  handled: boolean;
  computedAnswer?: string;
  metric?: string;
  value?: string | number;
  details?: string;
} {
  const q = query.toLowerCase();

  const findCol = (terms: string[]) =>
    profiles.find(p => terms.some(t => p.name.toLowerCase().includes(t.toLowerCase())));

  const revCol = findCol(['revenue', 'sales', 'turnover', 'amount', 'total_amount', 'price']);
  const prodCol = findCol(['product', 'item', 'description', 'service', 'sku']);
  const custCol = findCol(['customer', 'client', 'company', 'buyer', 'account']);
  const regCol = findCol(['region', 'country', 'city', 'state', 'location']);
  const dateCol = findCol(['date', 'month', 'year', 'time', 'period']);
  const profCol = findCol(['profit', 'margin', 'net_income']);
  const costCol = findCol(['cost', 'expense', 'cogs']);
  const qtyCol = findCol(['quantity', 'qty', 'units', 'volume']);

  // 1. Total revenue / sales / sum
  if ((q.includes('total revenue') || q.includes('how much revenue') || q.includes('total sales') || q.includes('what is my total revenue') || q.includes('gross revenue')) && revCol && revCol.sum !== undefined) {
    return {
      handled: true,
      computedAnswer: `The total accumulated ${revCol.name} across all ${rows.length} rows is ₦${revCol.sum.toLocaleString()}.`,
      metric: 'Total Revenue',
      value: `₦${revCol.sum.toLocaleString()}`,
      details: `Calculated exact sum of "${revCol.name}" across ${rows.length} rows. Average per transaction is ₦${revCol.avg?.toLocaleString()}.`,
    };
  }

  // 2. Which product sold the most / highest product / top product
  if ((q.includes('which product sold the most') || q.includes('product generated the most') || q.includes('highest selling product') || q.includes('top product') || q.includes('most revenue')) && prodCol && revCol) {
    const agg: Record<string, number> = {};
    for (const r of rows) {
      const prod = String(r[prodCol.name] || 'Unknown');
      const val = Number(r[revCol.name]) || 0;
      agg[prod] = (agg[prod] || 0) + val;
    }
    const sorted = Object.entries(agg).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const top = sorted[0];
      return {
        handled: true,
        computedAnswer: `The product that generated the most revenue is "${top[0]}" with a total of ₦${top[1].toLocaleString()}.`,
        metric: 'Top Product',
        value: top[0],
        details: `Top 3 products: 1. ${sorted[0][0]} (₦${sorted[0][1].toLocaleString()}), 2. ${sorted[1]?.[0] || 'N/A'} (₦${(sorted[1]?.[1] || 0).toLocaleString()}), 3. ${sorted[2]?.[0] || 'N/A'} (₦${(sorted[2]?.[1] || 0).toLocaleString()}).`,
      };
    }
  }

  // 3. Which month had the highest sales / best month
  if ((q.includes('highest sales') || q.includes('best month') || q.includes('month had the highest') || q.includes('sales trend') || q.includes('best performing month')) && dateCol && revCol) {
    const monthAgg: Record<string, number> = {};
    for (const r of rows) {
      const rawDate = r[dateCol.name];
      if (rawDate) {
        const monthKey = String(rawDate).slice(0, 7);
        const val = Number(r[revCol.name]) || 0;
        monthAgg[monthKey] = (monthAgg[monthKey] || 0) + val;
      }
    }
    const sorted = Object.entries(monthAgg).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const top = sorted[0];
      return {
        handled: true,
        computedAnswer: `The month with the highest sales was ${top[0]} with total revenue of ₦${top[1].toLocaleString()}.`,
        metric: 'Peak Month',
        value: top[0],
        details: `Monthly breakdown: ${sorted.map(s => `${s[0]}: ₦${s[1].toLocaleString()}`).join(', ')}`,
      };
    }
  }

  // 4. Average order value / average profit / average revenue
  if (q.includes('average order value') || q.includes('average sales') || q.includes('aov') || q.includes('average revenue')) {
    if (revCol && revCol.avg !== undefined) {
      return {
        handled: true,
        computedAnswer: `The average order value (${revCol.name}) is ₦${revCol.avg.toLocaleString()} per transaction.`,
        metric: 'Average Order Value',
        value: `₦${revCol.avg.toLocaleString()}`,
        details: `Based on ${rows.length} transactions ranging from ₦${revCol.min?.toLocaleString()} to ₦${revCol.max?.toLocaleString()}.`,
      };
    }
  }

  // 5. Total or average profit
  if ((q.includes('total profit') || q.includes('average profit') || q.includes('net profit')) && profCol) {
    const sum = profCol.sum || 0;
    const avg = profCol.avg || 0;
    return {
      handled: true,
      computedAnswer: `Total net profit is ₦${sum.toLocaleString()} with an average profit of ₦${avg.toLocaleString()} per order.`,
      metric: 'Total Profit',
      value: `₦${sum.toLocaleString()}`,
      details: `Calculated from column "${profCol.name}". Profit ranges between ₦${profCol.min?.toLocaleString()} and ₦${profCol.max?.toLocaleString()}.`,
    };
  }

  // 6. Top 10 or Top Customers
  if ((q.includes('top 10 customers') || q.includes('top customers') || q.includes('who are my top') || q.includes('best customers')) && custCol && revCol) {
    const custAgg: Record<string, number> = {};
    for (const r of rows) {
      const c = String(r[custCol.name] || 'Unknown');
      const val = Number(r[revCol.name]) || 0;
      custAgg[c] = (custAgg[c] || 0) + val;
    }
    const sorted = Object.entries(custAgg).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const list = sorted.map((c, i) => `${i + 1}. ${c[0]} (₦${c[1].toLocaleString()})`).join('\n');
    return {
      handled: true,
      computedAnswer: `Here are your top customers ranked by total spend:\n\n${list}`,
      metric: 'Top Customer',
      value: sorted[0]?.[0] || 'None',
      details: `Computed revenue contribution across ${Object.keys(custAgg).length} unique customers.`,
    };
  }

  // 7. Regional breakdown / which region
  if ((q.includes('which region') || q.includes('regional') || q.includes('region generated the most')) && regCol && revCol) {
    const regAgg: Record<string, number> = {};
    for (const r of rows) {
      const reg = String(r[regCol.name] || 'Unknown');
      const val = Number(r[revCol.name]) || 0;
      regAgg[reg] = (regAgg[reg] || 0) + val;
    }
    const sorted = Object.entries(regAgg).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const top = sorted[0];
      const list = sorted.map((r, i) => `${i + 1}. ${r[0]}: ₦${r[1].toLocaleString()}`).join(', ');
      return {
        handled: true,
        computedAnswer: `The region that generated the most revenue is ${top[0]} with ₦${top[1].toLocaleString()}.\n\nFull regional breakdown: ${list}`,
        metric: 'Top Region',
        value: top[0],
        details: `Calculated sum of revenue across ${Object.keys(regAgg).length} regions.`,
      };
    }
  }

  // 8. Total cost or expenses
  if ((q.includes('total cost') || q.includes('total expenses') || q.includes('cogs')) && costCol && costCol.sum !== undefined) {
    return {
      handled: true,
      computedAnswer: `The total cost across all records is ₦${costCol.sum.toLocaleString()}.`,
      metric: 'Total Cost',
      value: `₦${costCol.sum.toLocaleString()}`,
      details: `Average cost per unit/transaction is ₦${costCol.avg?.toLocaleString()}.`,
    };
  }

  // 9. Anomalies or unusual values
  if (q.includes('unusual values') || q.includes('anomalies') || q.includes('outliers')) {
    const outlierCols = profiles.filter(p => (p.potentialOutliersCount || 0) > 0);
    if (outlierCols.length > 0) {
      const summary = outlierCols.map(c => `• Column "${c.name}": ${c.potentialOutliersCount} outlier values (Max: ${c.max}, Min: ${c.min}, Average: ${c.avg})`).join('\n');
      return {
        handled: true,
        computedAnswer: `Yes, statistical analysis detected potential outliers using IQR bounds:\n\n${summary}`,
        metric: 'Outliers Found',
        value: outlierCols.reduce((acc, c) => acc + (c.potentialOutliersCount || 0), 0),
        details: 'Evaluated using 1.5x Interquartile Range (IQR) threshold across numerical features.',
      };
    } else {
      return {
        handled: true,
        computedAnswer: 'No extreme numerical outliers were detected in the current dataset. All values fall within standard statistical distribution ranges.',
        metric: 'Outliers',
        value: 0,
      };
    }
  }

  // 10. Give me 5 insights
  if (q.includes('5 insights') || q.includes('five insights') || q.includes('key insights')) {
    const generated = generateInsights(rows, profiles).slice(0, 5);
    const bullets = generated.map((g, i) => `${i + 1}. **${g.title}**: ${g.description}`).join('\n\n');
    return {
      handled: true,
      computedAnswer: `Here are 5 verified insights directly calculated from your dataset:\n\n${bullets}`,
      metric: 'Insights',
      value: '5 Verified Insights',
    };
  }

  return { handled: false };
}
