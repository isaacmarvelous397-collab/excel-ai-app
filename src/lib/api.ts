import { User, SpreadsheetFile, SpreadsheetAnalysis, ChatMessage, FormulaResult, AiReport, PlanType, PaymentHistoryItem } from '../types';

const TOKEN_KEY = 'excelai_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: globalThis.Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error('Connection problem. Please check your internet connection and try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || 'An unexpected error occurred. Please try again.';
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async signup(name: string, email: string, password: string, confirmPassword: string) {
    const data = await request<{ message: string; token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    setAuthToken(data.token);
    return data.user;
  },

  async login(email: string, password: string) {
    const data = await request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    return data.user;
  },

  async loginWithGoogle(name?: string, email?: string) {
    const data = await request<{ message: string; token: string; user: User }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
    setAuthToken(data.token);
    return data.user;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    } finally {
      removeAuthToken();
    }
  },

  async getMe(): Promise<User> {
    const data = await request<{ user: User }>('/api/auth/me');
    return data.user;
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async updateProfile(name: string) {
    return request<{ message: string }>('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async deleteAccount() {
    const res = await request<{ message: string }>('/api/auth/delete-account', {
      method: 'DELETE',
    });
    removeAuthToken();
    return res;
  },

  // Files
  async uploadFile(filename: string, base64Content: string, sheetOverride?: string) {
    return request<{ file: SpreadsheetFile; analysis: SpreadsheetAnalysis }>('/api/files/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, base64Content, sheetOverride }),
    });
  },

  async loadSampleData() {
    return request<{ file: SpreadsheetFile; analysis: SpreadsheetAnalysis }>('/api/files/sample', {
      method: 'POST',
    });
  },

  async getFiles() {
    return request<{ files: SpreadsheetFile[] }>('/api/files');
  },

  async getFile(fileId: string) {
    return request<{ file: SpreadsheetFile; analysis: SpreadsheetAnalysis }>(`/api/files/${fileId}`);
  },

  async switchSheet(fileId: string, sheetName: string) {
    return request<{ file: SpreadsheetFile; analysis: SpreadsheetAnalysis }>(`/api/files/${fileId}/sheet`, {
      method: 'POST',
      body: JSON.stringify({ sheetName }),
    });
  },

  async deleteFile(fileId: string) {
    return request<{ message: string }>(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
  },

  // AI & Analysis
  async askQuestion(question: string, fileId: string) {
    return request<{ answer: string; calculationDetails?: any; message: ChatMessage }>('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, fileId }),
    });
  },

  async getConversation(fileId: string) {
    return request<{ messages: ChatMessage[] }>(`/api/ai/conversation/${fileId}`);
  },

  async generateFormula(prompt: string) {
    return request<FormulaResult>('/api/ai/formula', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },

  async generateReport(fileId: string) {
    return request<{ report: AiReport }>('/api/ai/report', {
      method: 'POST',
      body: JSON.stringify({ fileId }),
    });
  },

  // Subscriptions & Paystack Payments
  async initializePayment(plan: 'pro' | 'business', callbackUrl?: string) {
    return request<{
      success: boolean;
      authorization_url: string;
      reference: string;
      access_code: string;
      is_simulation?: boolean;
      amount: number;
      currency: string;
      plan: 'pro' | 'business';
    }>('/api/paystack/initialize', {
      method: 'POST',
      body: JSON.stringify({ plan, callbackUrl }),
    });
  },

  async verifyPayment(reference: string, plan: 'pro' | 'business') {
    return request<{
      success: boolean;
      message: string;
      plan: 'pro' | 'business';
      subscription: any;
      user: User;
    }>('/api/paystack/verify', {
      method: 'POST',
      body: JSON.stringify({ reference, plan }),
    });
  },

  async getPaymentHistory() {
    return request<{ payments: PaymentHistoryItem[] }>('/api/paystack/history');
  },

  async upgradePlan(plan: PlanType) {
    return request<{ message: string; subscription: any; user?: User }>('/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },
};
