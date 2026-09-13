import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  BotMessageSquare,
  User,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SpreadsheetFile, ChatMessage } from '../types';

interface AskAiSectionProps {
  file: SpreadsheetFile;
  onUpgradeClick: () => void;
}

export const AskAiSection: React.FC<AskAiSectionProps> = ({ file, onUpgradeClick }) => {
  const { user, refreshUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    'What is my total revenue?',
    'Which product sold the most?',
    'What is the average order value?',
    'Which region generated the most revenue?',
    'Are there unusual values in this data?',
    'What are the most important trends?',
    'Give me 5 important insights from this dataset.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      const data = await api.getConversation(file.id);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  useEffect(() => {
    loadConversation();
  }, [file.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputValue).trim();
    if (!q || loading) return;

    // Check free plan limits
    if (user?.plan === 'free' && (user.usage?.ai_questions_used || 0) >= 10) {
      setErrorMsg("You've reached your free-plan limit of 10 AI questions. Upgrade to Pro to continue asking questions.");
      return;
    }

    setErrorMsg(null);
    setInputValue('');

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: 'conv',
      user_id: user?.id || 'usr',
      role: 'user',
      content: q,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.askQuestion(q, file.id);
      setMessages(prev => [...prev, res.message]);
      await refreshUser();
    } catch (err: any) {
      console.error('Ask error:', err);
      const errText = err.message || "ExcelAI couldn't process your request right now. Please try again.";
      setErrorMsg(errText);
      const failMsg: ChatMessage = {
        id: `fail_${Date.now()}`,
        conversation_id: 'conv',
        user_id: user?.id || 'usr',
        role: 'assistant',
        content: errText,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, failMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const questionsRemaining =
    user?.plan === 'free' ? Math.max(0, 10 - (user.usage?.ai_questions_used || 0)) : 'Unlimited';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[calc(100dvh-180px)] sm:h-[calc(100vh-140px)] min-h-[440px] sm:min-h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 rounded-t-2xl gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="shrink-0">Ask ExcelAI</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 truncate max-w-[120px] sm:max-w-[220px]" title={file.filename}>
                {file.filename}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 truncate">Ask anything about your spreadsheet in plain English.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Questions remaining:{' '}
            <strong className="text-slate-800 font-semibold">{questionsRemaining}</strong>
          </span>
          {user?.plan === 'free' && (
            <button
              onClick={onUpgradeClick}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Suggested Questions Chips */}
      <div className="px-4 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> Suggestions:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-[11px] font-medium transition-colors shrink-0 shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <BotMessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No questions yet</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Ask any question about your data. ExcelAI calculates verified metrics directly from your spreadsheet rows.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div>
                  {msg.calculation_details && (
                    <div className="mb-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified Programmatic Calculation</span>
                    </div>
                  )}

                  <div className="markdown-body space-y-2 prose-xs">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:text-slate-700 flex items-center gap-1 font-medium transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-[10px] text-emerald-200 block text-right mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-600 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="font-medium text-slate-500">Thinking and querying data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {errorMsg.includes('limit') && (
            <button
              onClick={onUpgradeClick}
              className="text-xs font-bold text-red-800 underline hover:text-red-950 ml-2"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      )}

      {/* Input box */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white rounded-b-2xl">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="ask-ai-input"
            type="text"
            placeholder="Ask a question about this spreadsheet..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-60"
          />
          <button
            id="ask-ai-send-btn"
            type="submit"
            disabled={!inputValue.trim() || loading}
            aria-label="Send question"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
