import { GoogleGenAI } from '@google/genai';
import { ColumnProfile, FormulaResult, AiReport } from '../src/types.js';

let aiClient: GoogleGenAI | null = null;

const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

async function generateWithFallback(ai: GoogleGenAI, params: any) {
  let lastErr = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        ...params,
        model,
      });
      return res;
    } catch (err: any) {
      lastErr = err;
      console.warn(`Model ${model} failed, trying next candidate:`, err.message || err);
    }
  }
  throw lastErr;
}

function getAiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment. AI features will use fallback engine.');
    return null;
  }
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiClient;
}

export async function answerQuestionWithAi(
  question: string,
  spreadsheetInfo: {
    filename: string;
    rowCount: number;
    columnCount: number;
    columns: ColumnProfile[];
    sampleRows: Record<string, any>[];
    programmaticResult?: {
      handled: boolean;
      computedAnswer?: string;
      metric?: string;
      value?: string | number;
      details?: string;
    };
  }
): Promise<{ answer: string; calculationDetails?: any }> {
  const { programmaticResult, columns, rowCount, columnCount, filename, sampleRows } = spreadsheetInfo;

  // If programmatic calculation was performed, provide exact verified numbers to AI
  const ai = getAiClient();
  if (!ai) {
    if (programmaticResult && programmaticResult.handled && programmaticResult.computedAnswer) {
      return {
        answer: programmaticResult.computedAnswer,
        calculationDetails: {
          metric: programmaticResult.metric,
          computed_value: programmaticResult.value,
          formula_used: programmaticResult.details,
        },
      };
    }
    return {
      answer: "I can't determine that from the data provided.",
    };
  }

  const columnsSummary = columns
    .map(c => `- ${c.name} (${c.type}): unique=${c.uniqueCount}, missing=${c.missingCount}${c.sum !== undefined ? `, sum=${c.sum}, avg=${c.avg}, min=${c.min}, max=${c.max}` : ''}`)
    .join('\n');

  const systemInstruction = `You are ExcelAI, an expert spreadsheet analyst and financial data scientist.
Your job is to answer questions about the user's uploaded spreadsheet accurately and concisely.

CRITICAL RULES:
1. NEVER guess or invent numbers. All numerical statements must be supported by the provided data summary and programmatic calculation results.
2. If the user asks a question about information NOT present in the columns or data, you MUST respond: "I can't determine that from the data provided."
3. If programmatic calculation results are provided below, they are the GROUND TRUTH. Use them and explain them clearly to the user.
4. Keep answers professional, executive-ready, and easy to read. Use bullet points or bold text where appropriate.`;

  const prompt = `Dataset: "${filename}"
Rows: ${rowCount}, Columns: ${columnCount}
Columns Metadata:
${columnsSummary}

Sample Records (first ${sampleRows.length} rows):
${JSON.stringify(sampleRows, null, 2)}

${programmaticResult?.handled ? `Verified Calculation Result:\n${programmaticResult.computedAnswer}\nTechnical Details: ${programmaticResult.details}` : 'No exact pre-computed calculation matched.'}

User Question: "${question}"

Please provide a clear, accurate, and helpful response based strictly on the data:`;

  try {
    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high factual accuracy
      },
    });

    const text = response.text || (programmaticResult?.computedAnswer || "I can't determine that from the data provided.");
    return {
      answer: text,
      calculationDetails: programmaticResult?.handled
        ? {
            metric: programmaticResult.metric,
            computed_value: programmaticResult.value,
            formula_used: programmaticResult.details,
          }
        : undefined,
    };
  } catch (err) {
    console.error('Gemini API Error:', err);
    if (programmaticResult?.handled && programmaticResult.computedAnswer) {
      return {
        answer: programmaticResult.computedAnswer,
        calculationDetails: {
          metric: programmaticResult.metric,
          computed_value: programmaticResult.value,
          formula_used: programmaticResult.details,
        },
      };
    }
    return {
      answer: "ExcelAI couldn't process your request right now. Please check your data and try again.",
    };
  }
}

export async function generateFormulaWithAi(promptDescription: string): Promise<FormulaResult> {
  const ai = getAiClient();
  if (!ai) {
    // Built-in rule-based fallback generator
    return getFallbackFormula(promptDescription);
  }

  const systemInstruction = `You are ExcelAI's Formula Architect.
The user will describe what calculation they want to achieve in Excel or Google Sheets.
Generate a valid, efficient Excel formula with explanation and practical cell example.
Always return response in valid JSON matching this schema:
{
  "formula": "=...",
  "description": "Short 1-line description",
  "explanation": "Clear explanation of how the formula and its functions operate",
  "example": "Sample cell references scenario (e.g. Assuming Revenue is in column B and Cost is in column C)",
  "tips": ["Tip 1", "Tip 2"]
}`;

  try {
    const response = await generateWithFallback(ai, {
      contents: `Generate an Excel formula for: "${promptDescription}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.formula) {
      return parsed;
    }
    return getFallbackFormula(promptDescription);
  } catch (err) {
    console.error('Error generating formula with AI:', err);
    return getFallbackFormula(promptDescription);
  }
}

function getFallbackFormula(desc: string): FormulaResult {
  const d = desc.toLowerCase();
  if (d.includes('if') || d.includes('commission') || d.includes('tax') || d.includes('greater than') || d.includes('less than')) {
    return {
      formula: '=IF(B2>500000, B2*0.05, B2*0.02)',
      description: 'Conditional formula using IF function',
      explanation: 'Evaluates if Revenue in B2 exceeds 500,000. If true, calculates 5% commission/tax; otherwise calculates 2%.',
      example: 'If cell B2 contains 750,000, the formula computes 37,500 (750000 * 0.05).',
      tips: ['For multiple tier ranges, use nested IF or IFS: =IFS(B2>1000000, B2*0.1, B2>500000, B2*0.05, TRUE, B2*0.02)'],
    };
  }
  if (d.includes('profit margin')) {
    return {
      formula: '=(B2-C2)/B2',
      description: 'Calculates the gross profit margin percentage',
      explanation: 'Subtracts Cost (C2) from Revenue (B2) to find gross profit, then divides by Revenue (B2). Format cell as Percentage.',
      example: 'If Revenue is in B2 ($10,000) and Cost is in C2 ($6,000), result is 40.0%.',
      tips: ['Format the resulting cell as Percentage (Ctrl+Shift+%)', 'Wrap in IFERROR to handle zero revenue: =IFERROR((B2-C2)/B2, 0)'],
    };
  }
  if (d.includes('percentage growth') || d.includes('growth')) {
    return {
      formula: '=(C2-B2)/B2',
      description: 'Calculates period-over-period percentage growth',
      explanation: 'Takes the new value (C2) minus original value (B2), divided by original value (B2).',
      example: 'If Jan Sales are in B2 (100) and Feb Sales are in C2 (125), result is 25.0% growth.',
      tips: ['Format as Percentage', 'Handle empty prior period with: =IF(B2>0, (C2-B2)/B2, "N/A")'],
    };
  }
  if (d.includes('xlookup') || d.includes('lookup') || d.includes('vlookup')) {
    return {
      formula: '=XLOOKUP(E2, A2:A100, B2:B100, "Not Found", 0)',
      description: 'Looks up a value in a range and returns matching item',
      explanation: 'Searches for the value in E2 within array A2:A100 and retrieves the corresponding value from B2:B100.',
      example: 'Looking up a Product ID in E2 and returning its unit price from column B.',
      tips: ['XLOOKUP defaults to exact match', 'Unlike VLOOKUP, XLOOKUP can look left and does not break when columns are inserted'],
    };
  }
  if (d.includes('sumif') || d.includes('sum if')) {
    return {
      formula: '=SUMIF(C2:C100, "Software", G2:G100)',
      description: 'Sums values that meet a specific condition',
      explanation: 'Evaluates the Category in column C, and if it equals "Software", sums the Revenue from column G.',
      example: 'Sums all revenues for software products.',
      tips: ['For multiple criteria, use =SUMIFS(G2:G100, C2:C100, "Software", D2:D100, "Lagos")'],
    };
  }
  return {
    formula: '=AVERAGE(B2:B100)',
    description: 'Calculates statistical average of a range',
    explanation: 'Returns the numerical arithmetic mean of numbers in column B.',
    example: 'Average order value across rows 2 through 100.',
    tips: ['Empty cells are ignored automatically by AVERAGE'],
  };
}

export async function generateReportWithAi(
  filename: string,
  analysisData: {
    rowCount: number;
    columnCount: number;
    columns: ColumnProfile[];
    insights: any[];
    dataQuality: any;
    sampleRows: Record<string, any>[];
  }
): Promise<AiReport> {
  const { filename: fname, rowCount, columnCount, columns, insights, dataQuality, sampleRows } = {
    filename,
    ...analysisData,
  };

  const ai = getAiClient();
  const defaultReport: AiReport = {
    id: `rep_${Date.now()}`,
    file_id: '',
    title: `Executive Business Analysis: ${fname}`,
    executive_summary: `This report provides an in-depth data audit and performance evaluation of ${fname}. The dataset comprises ${rowCount.toLocaleString()} records across ${columnCount} distinct dimensions. Key performance indicators demonstrate robust commercial activity alongside targeted operational optimization opportunities.`,
    key_findings: insights.map(i => `${i.title}: ${i.description}`),
    trends: [
      `Data distribution encompasses ${rowCount} transactional events with an overall data completeness score of ${dataQuality.qualityScore}%.`,
      insights.find(i => i.category === 'revenue')?.description || 'Revenue performance shows stable volume across reporting periods.',
      insights.find(i => i.category === 'trend')?.description || 'Primary regional markets drive substantial revenue concentrations.',
    ],
    data_quality_notes: [
      `Overall data quality score: ${dataQuality.qualityScore}/100.`,
      `Duplicate records: ${dataQuality.duplicateRowsCount} (${dataQuality.duplicatePercentage}%).`,
      `Missing values: ${dataQuality.totalMissing} cells (${dataQuality.missingPercentage}% of dataset).`,
      ...dataQuality.warnings,
    ],
    recommendations: [
      'Prioritize inventory and resource allocation for top-performing product categories.',
      'Investigate records flagged as numerical outliers to verify data ingestion fidelity.',
      'Implement validation rules at source to eliminate duplicate transactions before reporting.',
      'Expand outreach in high-yield customer segments to capture secondary lifetime value.',
    ],
    generated_at: new Date().toISOString(),
  };

  if (!ai) {
    return defaultReport;
  }

  const prompt = `Dataset: "${fname}"
Rows: ${rowCount}, Columns: ${columnCount}
Quality Score: ${dataQuality.qualityScore}%
Warnings: ${JSON.stringify(dataQuality.warnings)}
Calculated Insights:
${JSON.stringify(insights, null, 2)}
Column Statistics:
${JSON.stringify(columns.map(c => ({ name: c.name, type: c.type, sum: c.sum, avg: c.avg, min: c.min, max: c.max, missing: c.missingCount })), null, 2)}
Sample Data:
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

Generate a structured business analysis report. Return strictly JSON matching this structure:
{
  "title": "Executive Business Analysis: ...",
  "executive_summary": "Comprehensive 3-4 sentence executive overview...",
  "key_findings": ["Finding 1", "Finding 2", "Finding 3", "Finding 4"],
  "trends": ["Trend 1", "Trend 2", "Trend 3"],
  "data_quality_notes": ["Note 1", "Note 2", "Note 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4"]
}`;

  try {
    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: 'You are an executive business analyst. Generate precise, factual, professional reports based strictly on the provided data without fabricating statistics.',
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      id: `rep_${Date.now()}`,
      file_id: '',
      title: parsed.title || defaultReport.title,
      executive_summary: parsed.executive_summary || defaultReport.executive_summary,
      key_findings: Array.isArray(parsed.key_findings) && parsed.key_findings.length > 0 ? parsed.key_findings : defaultReport.key_findings,
      trends: Array.isArray(parsed.trends) && parsed.trends.length > 0 ? parsed.trends : defaultReport.trends,
      data_quality_notes: Array.isArray(parsed.data_quality_notes) && parsed.data_quality_notes.length > 0 ? parsed.data_quality_notes : defaultReport.data_quality_notes,
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0 ? parsed.recommendations : defaultReport.recommendations,
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error generating report with Gemini:', err);
    return defaultReport;
  }
}
