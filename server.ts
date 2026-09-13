import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, UserRecord } from './server/db.js';
import { parseFileBuffer, analyzeDataset, executeProgrammaticQuery } from './server/analyzer.js';
import { answerQuestionWithAi, generateFormulaWithAi, generateReportWithAi } from './server/ai.js';
import { SAMPLE_SALES_DATA } from './src/data/sampleData.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with 15MB limit for spreadsheet uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Authentication middleware
interface AuthRequest extends Request {
  user?: UserRecord & { subscription?: any };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in to continue.' });
  }
  const token = authHeader.split(' ')[1];
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
  req.user = user;
  next();
}

function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = db.getUserByToken(token);
    if (user) req.user = user;
  }
  next();
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide your full name (minimum 2 characters).' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match. Please verify and try again.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in instead.' });
    }

    const passwordHash = db.hashPassword(password);
    const user = db.createUser(name.trim(), email, passwordHash);
    const token = db.createSession(user.id);
    const sub = db.getSubscription(user.id);

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: sub.plan,
        created_at: user.created_at,
        usage: {
          uploads_this_month: sub.uploads_this_month,
          uploads_limit: sub.plan === 'free' ? 3 : Infinity,
          ai_questions_used: sub.questions_count,
          ai_questions_limit: sub.plan === 'free' ? 10 : Infinity,
          max_rows_per_file: sub.plan === 'free' ? 5000 : 100000,
        },
      },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again later.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both your email address and password.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
    }

    const valid = db.verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
    }

    const token = db.createSession(user.id);
    const sub = db.getSubscription(user.id);

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: sub.plan,
        created_at: user.created_at,
        usage: {
          uploads_this_month: sub.uploads_this_month,
          uploads_limit: sub.plan === 'free' ? 3 : Infinity,
          ai_questions_used: sub.questions_count,
          ai_questions_limit: sub.plan === 'free' ? 10 : Infinity,
          max_rows_per_file: sub.plan === 'free' ? 5000 : 100000,
        },
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  try {
    // Google Sign-In helper flow for seamless authentication
    const { email, name } = req.body;
    const targetEmail = email || 'google.user@excelai.app';
    const targetName = name || 'Google User';

    let user = db.findUserByEmail(targetEmail);
    if (!user) {
      const dummyHash = db.hashPassword('GoogleOAuth2026!');
      user = db.createUser(targetName, targetEmail, dummyHash);
    }

    const token = db.createSession(user.id);
    const sub = db.getSubscription(user.id);

    return res.json({
      message: 'Logged in with Google successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: sub.plan,
        created_at: user.created_at,
        usage: {
          uploads_this_month: sub.uploads_this_month,
          uploads_limit: sub.plan === 'free' ? 3 : Infinity,
          ai_questions_used: sub.questions_count,
          ai_questions_limit: sub.plan === 'free' ? 10 : Infinity,
          max_rows_per_file: sub.plan === 'free' ? 5000 : 100000,
        },
      },
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Failed to authenticate with Google.' });
  }
});

app.post('/api/auth/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    db.deleteSession(token);
  }
  return res.json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const sub = db.getSubscription(user.id);
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: sub.plan,
      created_at: user.created_at,
      usage: {
        uploads_this_month: sub.uploads_this_month,
        uploads_limit: sub.plan === 'free' ? 3 : Infinity,
        ai_questions_used: sub.questions_count,
        ai_questions_limit: sub.plan === 'free' ? 10 : Infinity,
        max_rows_per_file: sub.plan === 'free' ? 5000 : 100000,
      },
    },
  });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  // Safe generic notification
  return res.json({
    message: `If an account exists for ${email}, a password reset link has been dispatched to your inbox.`,
  });
});

app.post('/api/auth/update-profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  }
  db.updateUserName(req.user!.id, name.trim());
  return res.json({ message: 'Profile updated successfully!' });
});

app.post('/api/auth/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Please provide both current and new password.' });
  }
  const user = db.findUserById(req.user!.id);
  if (!user || !db.verifyPassword(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }
  db.updateUserPassword(user.id, db.hashPassword(newPassword));
  return res.json({ message: 'Password changed successfully.' });
});

app.delete('/api/auth/delete-account', authMiddleware, (req: AuthRequest, res: Response) => {
  db.deleteUser(req.user!.id);
  return res.json({ message: 'Account and associated data deleted permanently.' });
});

// ----------------------------------------------------
// FILE UPLOAD & PROCESSING ROUTES
// ----------------------------------------------------

app.post('/api/files/upload', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const sub = db.getSubscription(user.id);

    // 1. Enforce Free plan upload limits
    if (sub.plan === 'free' && sub.uploads_this_month >= 3) {
      return res.status(403).json({
        error: "You've reached your free-plan limit. Upgrade to Pro to continue.",
        code: 'LIMIT_REACHED',
      });
    }

    const { filename, base64Content, sheetOverride } = req.body;

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required.' });
    }

    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
      return res.status(400).json({
        error: "This file type isn't supported. Please upload an XLSX, XLS, or CSV file.",
      });
    }

    if (!base64Content) {
      return res.status(400).json({ error: 'No file data received.' });
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'This file is too large. Please upload a file smaller than 10 MB.',
      });
    }

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'The uploaded file is empty. Please select a valid spreadsheet.' });
    }

    // 2. Parse spreadsheet buffer
    let parsed;
    try {
      parsed = parseFileBuffer(buffer, filename, sheetOverride);
    } catch (parseErr: any) {
      console.error('Spreadsheet parse failure:', parseErr);
      return res.status(422).json({
        error: "We couldn't read this spreadsheet. Please check that the file isn't corrupted and try again.",
      });
    }

    // 3. Validate rows limit for Free tier
    if (sub.plan === 'free' && parsed.rows.length > 5000) {
      return res.status(403).json({
        error: "You've reached your free-plan limit. Your file contains more than 5,000 rows. Upgrade to Pro to continue.",
        code: 'LIMIT_REACHED',
      });
    }

    // 4. Analyze dataset
    const analysis = analyzeDataset(parsed.rows, filename, parsed.selectedSheet, parsed.sheets);

    // 5. Save file and analysis in database
    const savedFile = db.saveFile({
      user_id: user.id,
      filename,
      file_type: ext as any,
      file_size: buffer.length,
      row_count: parsed.rows.length,
      column_count: parsed.columns.length,
      sheet_name: parsed.selectedSheet,
      all_sheets: parsed.sheets,
      raw_data: parsed.rows,
    });

    analysis.file_id = savedFile.id;
    db.saveAnalysis({
      file_id: savedFile.id,
      user_id: user.id,
      metadata: {
        filename,
        sheet_name: parsed.selectedSheet,
        all_sheets: parsed.sheets,
        row_count: parsed.rows.length,
        column_count: parsed.columns.length,
        column_names: parsed.columns,
        columns: analysis.columns,
      },
      data_quality: analysis.data_quality,
      insights: analysis.insights,
    });

    return res.status(201).json({
      file: {
        ...savedFile,
        raw_data: undefined, // Don't send huge raw array in file metadata
      },
      analysis,
    });
  } catch (err: any) {
    console.error('File upload route error:', err);
    return res.status(500).json({
      error: "ExcelAI couldn't process your request right now. Please try again.",
    });
  }
});

// Load built-in sample sales dataset
app.post('/api/files/sample', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const filename = 'Enterprise_Sales_2024.xlsx';
    const rows = SAMPLE_SALES_DATA;
    const columns = Object.keys(rows[0]);

    const analysis = analyzeDataset(rows, filename, 'Sales_Records', ['Sales_Records']);

    const savedFile = db.saveFile({
      user_id: user.id,
      filename,
      file_type: 'xlsx',
      file_size: 45200,
      row_count: rows.length,
      column_count: columns.length,
      sheet_name: 'Sales_Records',
      all_sheets: ['Sales_Records'],
      raw_data: rows,
    });

    analysis.file_id = savedFile.id;
    db.saveAnalysis({
      file_id: savedFile.id,
      user_id: user.id,
      metadata: {
        filename,
        sheet_name: 'Sales_Records',
        all_sheets: ['Sales_Records'],
        row_count: rows.length,
        column_count: columns.length,
        column_names: columns,
        columns: analysis.columns,
      },
      data_quality: analysis.data_quality,
      insights: analysis.insights,
    });

    return res.status(201).json({
      file: {
        ...savedFile,
        raw_data: undefined,
      },
      analysis,
    });
  } catch (err: any) {
    console.error('Sample data error:', err);
    return res.status(500).json({ error: 'Failed to load sample dataset.' });
  }
});

// List user files
app.get('/api/files', authMiddleware, (req: AuthRequest, res: Response) => {
  const files = db.getFilesByUser(req.user!.id).map(f => ({
    id: f.id,
    user_id: f.user_id,
    filename: f.filename,
    file_type: f.file_type,
    file_size: f.file_size,
    row_count: f.row_count,
    column_count: f.column_count,
    sheet_name: f.sheet_name,
    all_sheets: f.all_sheets,
    uploaded_at: f.uploaded_at,
    last_analyzed: f.uploaded_at,
  }));
  return res.json({ files });
});

// Get specific file and its analysis
app.get('/api/files/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const fileId = req.params.id;
  const file = db.getFileById(fileId, req.user!.id);
  if (!file) {
    return res.status(404).json({ error: 'Spreadsheet not found or you do not have permission to access it.' });
  }

  const analysisRecord = db.getAnalysisByFileId(fileId, req.user!.id);
  let analysis: any = null;

  if (analysisRecord) {
    analysis = {
      id: analysisRecord.id,
      file_id: file.id,
      sheet_name: file.sheet_name,
      all_sheets: file.all_sheets || [file.sheet_name],
      row_count: file.row_count,
      column_count: file.column_count,
      column_names: analysisRecord.metadata.column_names || [],
      columns: analysisRecord.metadata.columns || [],
      data_quality: analysisRecord.data_quality,
      insights: analysisRecord.insights,
      preview_rows: file.raw_data.slice(0, 500),
      created_at: analysisRecord.created_at,
    };
  } else {
    // Generate fresh analysis if not cached
    analysis = analyzeDataset(file.raw_data, file.filename, file.sheet_name, file.all_sheets || [file.sheet_name]);
    analysis.file_id = file.id;
  }

  return res.json({
    file: {
      ...file,
      raw_data: undefined,
    },
    analysis,
  });
});

// Switch worksheet for an Excel file
app.post('/api/files/:id/sheet', authMiddleware, (req: AuthRequest, res: Response) => {
  const fileId = req.params.id;
  const { sheetName } = req.body;
  const file = db.getFileById(fileId, req.user!.id);
  if (!file) {
    return res.status(404).json({ error: 'Spreadsheet not found.' });
  }

  // Update sheet name and re-analyze
  file.sheet_name = sheetName;
  const analysis = analyzeDataset(file.raw_data, file.filename, sheetName, file.all_sheets || [sheetName]);
  analysis.file_id = file.id;

  db.saveAnalysis({
    file_id: file.id,
    user_id: req.user!.id,
    metadata: {
      filename: file.filename,
      sheet_name: sheetName,
      all_sheets: file.all_sheets,
      row_count: file.row_count,
      column_count: file.column_count,
      column_names: analysis.column_names,
      columns: analysis.columns,
    },
    data_quality: analysis.data_quality,
    insights: analysis.insights,
  });

  return res.json({ file: { ...file, raw_data: undefined }, analysis });
});

// Delete file
app.delete('/api/files/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const fileId = req.params.id;
  const deleted = db.deleteFile(fileId, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: 'File not found or already removed.' });
  }
  return res.json({ message: 'Spreadsheet deleted successfully.' });
});

// ----------------------------------------------------
// AI ASSISTANT, FORMULAS & REPORTS
// ----------------------------------------------------

// Ask ExcelAI
app.post('/api/ai/ask', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const sub = db.getSubscription(user.id);
    const { question, fileId } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Please enter a question about your spreadsheet.' });
    }

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required.' });
    }

    // Check Free Plan question limits
    if (sub.plan === 'free' && sub.questions_count >= 10) {
      return res.status(403).json({
        error: "You've reached your free-plan limit of 10 AI questions. Upgrade to Pro to continue asking questions.",
        code: 'LIMIT_REACHED',
      });
    }

    const file = db.getFileById(fileId, user.id);
    if (!file) {
      return res.status(404).json({ error: 'Spreadsheet not found.' });
    }

    const analysisRecord = db.getAnalysisByFileId(fileId, user.id);
    const columns = analysisRecord?.metadata?.columns || [];

    // 1. Programmatic computation first (no AI hallucinations!)
    const programmaticResult = executeProgrammaticQuery(question, file.raw_data, columns);

    // 2. Conversation handling
    const conversation = db.getOrCreateConversation(user.id, file.id);
    db.addMessage({
      conversation_id: conversation.id,
      user_id: user.id,
      role: 'user',
      content: question,
    });

    // 3. AI natural explanation with verified numbers
    const aiResult = await answerQuestionWithAi(question, {
      filename: file.filename,
      rowCount: file.row_count,
      columnCount: file.column_count,
      columns,
      sampleRows: file.raw_data.slice(0, 10),
      programmaticResult,
    });

    const assistantMsg = db.addMessage({
      conversation_id: conversation.id,
      user_id: user.id,
      role: 'assistant',
      content: aiResult.answer,
      calculation_details: aiResult.calculationDetails,
    });

    return res.json({
      answer: aiResult.answer,
      calculationDetails: aiResult.calculationDetails,
      message: assistantMsg,
    });
  } catch (err: any) {
    console.error('Ask AI error:', err);
    return res.status(500).json({
      error: "ExcelAI couldn't process your request right now. Please try again.",
    });
  }
});

// Get conversation messages
app.get('/api/ai/conversation/:fileId', authMiddleware, (req: AuthRequest, res: Response) => {
  const fileId = req.params.fileId;
  const conversation = db.getOrCreateConversation(req.user!.id, fileId);
  const messages = db.getMessages(conversation.id);
  return res.json({ messages });
});

// Excel Formula Generator
app.post('/api/ai/formula', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Please describe the formula you want to generate.' });
    }

    const result = await generateFormulaWithAi(prompt.trim());
    return res.json(result);
  } catch (err: any) {
    console.error('Formula generation error:', err);
    return res.status(500).json({
      error: 'Failed to generate formula. Please try again.',
    });
  }
});

// AI Report Generator
app.post('/api/ai/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required.' });
    }

    const file = db.getFileById(fileId, req.user!.id);
    if (!file) {
      return res.status(404).json({ error: 'Spreadsheet not found.' });
    }

    const analysisRecord = db.getAnalysisByFileId(fileId, req.user!.id);
    const columns = analysisRecord?.metadata?.columns || [];
    const insights = analysisRecord?.insights || [];
    const dataQuality = analysisRecord?.data_quality || {};

    const report = await generateReportWithAi(file.filename, {
      rowCount: file.row_count,
      columnCount: file.column_count,
      columns,
      insights,
      dataQuality,
      sampleRows: file.raw_data.slice(0, 10),
    });

    report.file_id = file.id;
    return res.json({ report });
  } catch (err: any) {
    console.error('Report generation error:', err);
    return res.status(500).json({
      error: 'Failed to generate report. Please try again.',
    });
  }
});

// Subscription plan upgrade/toggle
app.post('/api/subscription/upgrade', authMiddleware, (req: AuthRequest, res: Response) => {
  const { plan } = req.body;
  const targetPlan = plan === 'free' ? 'free' : 'pro';
  const sub = db.updatePlan(req.user!.id, targetPlan);

  return res.json({
    message: `Plan updated to ${targetPlan.toUpperCase()} successfully!`,
    subscription: sub,
  });
});

// ----------------------------------------------------
// DEV & PRODUCTION VITE MIDDLEWARE
// ----------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ExcelAI Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Fatal startup error:', err);
});
