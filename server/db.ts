import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabase } from './supabase.js';

export type PlanType = 'free' | 'pro' | 'business';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan: PlanType;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string | null;
  paystack_reference?: string | null;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  month: string; // YYYY-MM
  analysis_count: number;
  questions_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number; // in NGN
  currency: string; // 'NGN'
  reference: string;
  status: 'pending' | 'success' | 'failed';
  plan: 'pro' | 'business';
  paid_at?: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  filename: string;
  file_type: 'xlsx' | 'xls' | 'csv';
  file_size: number;
  row_count: number;
  column_count: number;
  sheet_name: string;
  all_sheets: string[];
  raw_data: Record<string, any>[];
  uploaded_at: string;
}

export interface AnalysisRecord {
  id: string;
  file_id: string;
  user_id: string;
  metadata: Record<string, any>;
  data_quality: Record<string, any>;
  insights: any[];
  created_at: string;
}

export interface ConversationRecord {
  id: string;
  user_id: string;
  file_id: string;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  calculation_details?: any;
  created_at: string;
}

export interface SessionRecord {
  token: string;
  user_id: string;
  expires_at: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  subscriptions: SubscriptionRecord[];
  usage: UsageRecord[];
  payments: PaymentRecord[];
  files: FileRecord[];
  analyses: AnalysisRecord[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  sessions: SessionRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

class DatabaseService {
  private db: DatabaseSchema = {
    users: [],
    subscriptions: [],
    usage: [],
    payments: [],
    files: [],
    analyses: [],
    conversations: [],
    messages: [],
    sessions: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.db = {
          users: parsed.users || [],
          subscriptions: parsed.subscriptions || [],
          usage: parsed.usage || [],
          payments: parsed.payments || [],
          files: parsed.files || [],
          analyses: parsed.analyses || [],
          conversations: parsed.conversations || [],
          messages: parsed.messages || [],
          sessions: parsed.sessions || [],
        };
      } else {
        this.persist();
      }
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_PATH);
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // Auth & Password utilities
  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  public verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return testHash === hash;
  }

  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    this.db.sessions.push({ token, user_id: userId, expires_at: expiresAt });
    this.persist();
    return token;
  }

  public getUserByToken(token: string): (UserRecord & { subscription?: SubscriptionRecord; usageSummary?: any }) | null {
    const session = this.db.sessions.find(s => s.token === token && s.expires_at > Date.now());
    if (!session) return null;
    const user = this.db.users.find(u => u.id === session.user_id);
    if (!user) return null;
    const subscription = this.getSubscription(user.id);
    const usageSummary = this.getMonthlyUsage(user.id);
    return { ...user, subscription, usageSummary };
  }

  public deleteSession(token: string): void {
    this.db.sessions = this.db.sessions.filter(s => s.token !== token);
    this.persist();
  }

  // Users
  public findUserByEmail(email: string): UserRecord | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): UserRecord | undefined {
    return this.db.users.find(u => u.id === id);
  }

  public createUser(name: string, email: string, passwordHash: string): UserRecord {
    const user: UserRecord = {
      id: `usr_${crypto.randomUUID()}`,
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    };
    this.db.users.push(user);

    // Default Free subscription
    const sub: SubscriptionRecord = {
      id: `sub_${crypto.randomUUID()}`,
      user_id: user.id,
      plan: 'free',
      status: 'active',
      start_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    this.db.subscriptions.push(sub);

    // Initial usage for current month
    this.getOrCreateUsage(user.id);

    this.persist();

    // Sync to Supabase if configured
    const sb = getSupabase();
    if (sb) {
      sb.from('users').insert({
        id: user.id,
        name: user.name,
        email: user.email,
        password_hash: user.password_hash,
      }).then(({ error }) => {
        if (error) console.warn('Supabase sync error (user):', error.message);
      });
      sb.from('subscriptions').insert({
        id: sub.id,
        user_id: user.id,
        plan: sub.plan,
        status: sub.status,
      }).then(({ error }) => {
        if (error) console.warn('Supabase sync error (sub):', error.message);
      });
    }

    return user;
  }

  public updateUserPassword(userId: string, newHash: string): boolean {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) return false;
    user.password_hash = newHash;
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('users').update({ password_hash: newHash }).eq('id', userId).then();
    }
    return true;
  }

  public updateUserName(userId: string, newName: string): boolean {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) return false;
    user.name = newName;
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('users').update({ name: newName }).eq('id', userId).then();
    }
    return true;
  }

  public deleteUser(userId: string): boolean {
    this.db.users = this.db.users.filter(u => u.id !== userId);
    this.db.subscriptions = this.db.subscriptions.filter(s => s.user_id !== userId);
    this.db.usage = this.db.usage.filter(u => u.user_id !== userId);
    this.db.payments = this.db.payments.filter(p => p.user_id !== userId);
    this.db.files = this.db.files.filter(f => f.user_id !== userId);
    this.db.analyses = this.db.analyses.filter(a => a.user_id !== userId);
    this.db.conversations = this.db.conversations.filter(c => c.user_id !== userId);
    this.db.messages = this.db.messages.filter(m => m.user_id !== userId);
    this.db.sessions = this.db.sessions.filter(s => s.user_id !== userId);
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('users').delete().eq('id', userId).then();
    }
    return true;
  }

  // Subscriptions
  public getSubscription(userId: string): SubscriptionRecord {
    let sub = this.db.subscriptions.find(s => s.user_id === userId);
    if (!sub) {
      sub = {
        id: `sub_${crypto.randomUUID()}`,
        user_id: userId,
        plan: 'free',
        status: 'active',
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      this.db.subscriptions.push(sub);
      this.persist();
    }
    return sub;
  }

  public updatePlan(
    userId: string,
    plan: PlanType,
    details?: { paystackReference?: string; endDate?: string }
  ): SubscriptionRecord {
    const sub = this.getSubscription(userId);
    sub.plan = plan;
    sub.status = 'active';
    if (details?.paystackReference) {
      sub.paystack_reference = details.paystackReference;
    }
    if (details?.endDate) {
      sub.end_date = details.endDate;
    } else if (plan !== 'free') {
      // Set 30 days renewal
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      sub.end_date = expiry.toISOString();
    } else {
      sub.end_date = null;
    }

    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('subscriptions').upsert({
        id: sub.id,
        user_id: userId,
        plan: sub.plan,
        status: sub.status,
        end_date: sub.end_date,
        paystack_reference: sub.paystack_reference,
      }).then();
    }

    return sub;
  }

  // Usage Management (Monthly auto-reset)
  public getOrCreateUsage(userId: string): UsageRecord {
    const currentMonth = getCurrentMonth();
    let usage = this.db.usage.find(u => u.user_id === userId && u.month === currentMonth);
    if (!usage) {
      usage = {
        id: `usg_${crypto.randomUUID()}`,
        user_id: userId,
        month: currentMonth,
        analysis_count: 0,
        questions_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.db.usage.push(usage);
      this.persist();
    }
    return usage;
  }

  public getMonthlyUsage(userId: string) {
    const sub = this.getSubscription(userId);
    const usage = this.getOrCreateUsage(userId);
    const plan = sub.plan;

    // Free plan: 5 analyses per month
    // Pro plan: unlimited
    // Business plan: unlimited
    const limit = plan === 'free' ? 5 : Infinity;
    const questionsLimit = plan === 'free' ? 10 : Infinity;
    const used = usage.analysis_count;
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);

    return {
      month: usage.month,
      analyses_used: used,
      analyses_limit: limit,
      analyses_remaining: remaining,
      questions_used: usage.questions_count,
      questions_limit: questionsLimit,
      plan,
      is_limit_reached: plan === 'free' && used >= 5,
    };
  }

  public canPerformAnalysis(userId: string): { allowed: boolean; reason?: string } {
    const sub = this.getSubscription(userId);
    if (sub.plan === 'pro' || sub.plan === 'business') {
      return { allowed: true };
    }
    const usage = this.getOrCreateUsage(userId);
    if (usage.analysis_count >= 5) {
      return {
        allowed: false,
        reason: "You've reached your free monthly limit of 5 spreadsheet analyses. Upgrade to Pro for unlimited analyses.",
      };
    }
    return { allowed: true };
  }

  public incrementAnalysisCount(userId: string): void {
    const usage = this.getOrCreateUsage(userId);
    usage.analysis_count += 1;
    usage.updated_at = new Date().toISOString();
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('usage').upsert({
        id: usage.id,
        user_id: userId,
        month: usage.month,
        analysis_count: usage.analysis_count,
        questions_count: usage.questions_count,
      }).then();
    }
  }

  public incrementQuestionCount(userId: string): void {
    const usage = this.getOrCreateUsage(userId);
    usage.questions_count += 1;
    usage.updated_at = new Date().toISOString();
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('usage').upsert({
        id: usage.id,
        user_id: userId,
        month: usage.month,
        analysis_count: usage.analysis_count,
        questions_count: usage.questions_count,
      }).then();
    }
  }

  // Payments (Paystack)
  public createPayment(record: Omit<PaymentRecord, 'id' | 'created_at'>): PaymentRecord {
    const payment: PaymentRecord = {
      ...record,
      id: `pay_${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
    };
    this.db.payments.push(payment);
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('payments').insert({
        id: payment.id,
        user_id: payment.user_id,
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.reference,
        status: payment.status,
        plan: payment.plan,
      }).then();
    }

    return payment;
  }

  public getPaymentByReference(reference: string): PaymentRecord | undefined {
    return this.db.payments.find(p => p.reference === reference);
  }

  public updatePaymentStatus(
    reference: string,
    status: 'success' | 'pending' | 'failed',
    paidAt?: string
  ): PaymentRecord | null {
    const payment = this.db.payments.find(p => p.reference === reference);
    if (!payment) return null;
    payment.status = status;
    if (paidAt) payment.paid_at = paidAt;
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('payments').update({
        status,
        paid_at: payment.paid_at,
      }).eq('reference', reference).then();
    }

    return payment;
  }

  public getPaymentsByUser(userId: string): PaymentRecord[] {
    return this.db.payments
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Files
  public saveFile(record: Omit<FileRecord, 'id' | 'uploaded_at'>): FileRecord {
    const file: FileRecord = {
      ...record,
      id: `file_${crypto.randomUUID()}`,
      uploaded_at: new Date().toISOString(),
    };
    this.db.files.push(file);
    this.incrementAnalysisCount(record.user_id);
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('files').insert({
        id: file.id,
        user_id: file.user_id,
        filename: file.filename,
        file_type: file.file_type,
        file_size: file.file_size,
        row_count: file.row_count,
        column_count: file.column_count,
        sheet_name: file.sheet_name,
        all_sheets: file.all_sheets,
      }).then();
    }

    return file;
  }

  public getFilesByUser(userId: string): FileRecord[] {
    return this.db.files
      .filter(f => f.user_id === userId)
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  public getFileById(fileId: string, userId: string): FileRecord | null {
    const file = this.db.files.find(f => f.id === fileId && f.user_id === userId);
    return file || null;
  }

  public deleteFile(fileId: string, userId: string): boolean {
    const beforeCount = this.db.files.length;
    this.db.files = this.db.files.filter(f => !(f.id === fileId && f.user_id === userId));
    this.db.analyses = this.db.analyses.filter(a => !(a.file_id === fileId && a.user_id === userId));
    this.db.conversations = this.db.conversations.filter(c => !(c.file_id === fileId && c.user_id === userId));
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('files').delete().eq('id', fileId).then();
    }
    return this.db.files.length < beforeCount;
  }

  // Analyses
  public saveAnalysis(record: Omit<AnalysisRecord, 'id' | 'created_at'>): AnalysisRecord {
    this.db.analyses = this.db.analyses.filter(a => a.file_id !== record.file_id);
    const analysis: AnalysisRecord = {
      ...record,
      id: `anl_${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
    };
    this.db.analyses.push(analysis);
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('analyses').insert({
        id: analysis.id,
        file_id: analysis.file_id,
        user_id: analysis.user_id,
        metadata: analysis.metadata,
        data_quality: analysis.data_quality,
        insights: analysis.insights,
      }).then();
    }

    return analysis;
  }

  public getAnalysisByFileId(fileId: string, userId: string): AnalysisRecord | null {
    return this.db.analyses.find(a => a.file_id === fileId && a.user_id === userId) || null;
  }

  // Conversations & Messages
  public getOrCreateConversation(userId: string, fileId: string): ConversationRecord {
    let conv = this.db.conversations.find(c => c.user_id === userId && c.file_id === fileId);
    if (!conv) {
      conv = {
        id: `conv_${crypto.randomUUID()}`,
        user_id: userId,
        file_id: fileId,
        created_at: new Date().toISOString(),
      };
      this.db.conversations.push(conv);
      this.persist();
    }
    return conv;
  }

  public getMessages(conversationId: string): MessageRecord[] {
    return this.db.messages
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public addMessage(record: Omit<MessageRecord, 'id' | 'created_at'>): MessageRecord {
    const msg: MessageRecord = {
      ...record,
      id: `msg_${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
    };
    this.db.messages.push(msg);
    if (record.role === 'user') {
      this.incrementQuestionCount(record.user_id);
    }
    this.persist();

    const sb = getSupabase();
    if (sb) {
      sb.from('messages').insert({
        id: msg.id,
        conversation_id: msg.conversation_id,
        user_id: msg.user_id,
        role: msg.role,
        content: msg.content,
        calculation_details: msg.calculation_details,
      }).then();
    }

    return msg;
  }
}

export const db = new DatabaseService();
