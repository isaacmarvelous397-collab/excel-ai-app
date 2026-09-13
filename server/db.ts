import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled';
  uploads_this_month: number;
  questions_count: number;
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
  files: FileRecord[];
  analyses: AnalysisRecord[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  sessions: SessionRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');

class DatabaseService {
  private db: DatabaseSchema = {
    users: [],
    subscriptions: [],
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
        this.db = JSON.parse(raw);
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

  public getUserByToken(token: string): (UserRecord & { subscription?: SubscriptionRecord }) | null {
    const session = this.db.sessions.find(s => s.token === token && s.expires_at > Date.now());
    if (!session) return null;
    const user = this.db.users.find(u => u.id === session.user_id);
    if (!user) return null;
    const subscription = this.db.subscriptions.find(s => s.user_id === user.id);
    return { ...user, subscription };
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
      uploads_this_month: 0,
      questions_count: 0,
      created_at: new Date().toISOString(),
    };
    this.db.subscriptions.push(sub);

    this.persist();
    return user;
  }

  public updateUserPassword(userId: string, newHash: string): boolean {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) return false;
    user.password_hash = newHash;
    this.persist();
    return true;
  }

  public updateUserName(userId: string, newName: string): boolean {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) return false;
    user.name = newName;
    this.persist();
    return true;
  }

  public deleteUser(userId: string): boolean {
    this.db.users = this.db.users.filter(u => u.id !== userId);
    this.db.subscriptions = this.db.subscriptions.filter(s => s.user_id !== userId);
    this.db.files = this.db.files.filter(f => f.user_id !== userId);
    this.db.analyses = this.db.analyses.filter(a => a.user_id !== userId);
    this.db.conversations = this.db.conversations.filter(c => c.user_id !== userId);
    this.db.messages = this.db.messages.filter(m => m.user_id !== userId);
    this.db.sessions = this.db.sessions.filter(s => s.user_id !== userId);
    this.persist();
    return true;
  }

  // Subscriptions & Usage Limits
  public getSubscription(userId: string): SubscriptionRecord {
    let sub = this.db.subscriptions.find(s => s.user_id === userId);
    if (!sub) {
      sub = {
        id: `sub_${crypto.randomUUID()}`,
        user_id: userId,
        plan: 'free',
        status: 'active',
        uploads_this_month: 0,
        questions_count: 0,
        created_at: new Date().toISOString(),
      };
      this.db.subscriptions.push(sub);
      this.persist();
    }
    return sub;
  }

  public updatePlan(userId: string, plan: 'free' | 'pro'): SubscriptionRecord {
    const sub = this.getSubscription(userId);
    sub.plan = plan;
    this.persist();
    return sub;
  }

  public incrementUploadCount(userId: string): void {
    const sub = this.getSubscription(userId);
    sub.uploads_this_month += 1;
    this.persist();
  }

  public incrementQuestionCount(userId: string): void {
    const sub = this.getSubscription(userId);
    sub.questions_count += 1;
    this.persist();
  }

  // Files
  public saveFile(record: Omit<FileRecord, 'id' | 'uploaded_at'>): FileRecord {
    const file: FileRecord = {
      ...record,
      id: `file_${crypto.randomUUID()}`,
      uploaded_at: new Date().toISOString(),
    };
    this.db.files.push(file);
    this.incrementUploadCount(record.user_id);
    this.persist();
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
    return this.db.files.length < beforeCount;
  }

  // Analyses
  public saveAnalysis(record: Omit<AnalysisRecord, 'id' | 'created_at'>): AnalysisRecord {
    // Replace old analysis for this file if exists
    this.db.analyses = this.db.analyses.filter(a => a.file_id !== record.file_id);
    const analysis: AnalysisRecord = {
      ...record,
      id: `anl_${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
    };
    this.db.analyses.push(analysis);
    this.persist();
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
    return msg;
  }
}

export const db = new DatabaseService();
