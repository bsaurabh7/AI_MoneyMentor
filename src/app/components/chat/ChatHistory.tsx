import { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  messages: any[];
}

export function ChatHistory({ isOpen, onClose, onClearHistory, messages }: ChatHistoryProps) {
  const { user } = useAuth();
  const [confirmClear, setConfirmClear] = useState(false);
  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load messages from Supabase when modal is opened
  useEffect(() => {
    if (!isOpen || !user) return;

    setLoading(true);
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          console.error('Failed to load chat history:', error);
        } else if (data) {
          setDbMessages(data);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Group messages by date
  const messagesByDate: Record<string, any[]> = {};
  dbMessages.forEach((msg) => {
    const created = new Date(msg.created_at);
    const date = created.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    if (!messagesByDate[date]) messagesByDate[date] = [];
    messagesByDate[date].push(msg);
  });

  const sortedDates = Object.keys(messagesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[#0F172A] font-bold text-lg">Chat History</h2>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#0F172A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-[#94A3B8] text-sm">Loading history...</p>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#94A3B8] text-sm">No chat history yet</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#6366F1]" />
                  <p className="text-[#374151] text-xs font-semibold">{date}</p>
                </div>
                <div className="space-y-2 pl-6">
                  {messagesByDate[date].map((msg, idx) => {
                    const time = new Date(msg.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={`${date}-${idx}`}
                        className={`text-xs p-2 rounded-lg ${
                          isUser
                            ? 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]'
                            : 'bg-[#F8FAFC] text-[#374151] border border-[#E2E8F0]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium">{isUser ? 'You' : 'Arthmize'}</span>
                          <div className="flex items-center gap-1 text-[#94A3B8]">
                            <Clock className="w-3 h-3" />
                            <span>{time}</span>
                          </div>
                        </div>
                        <p className="line-clamp-2">{msg.content || '(Card result)'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#0F172A] font-medium text-sm hover:bg-[#F8FAFC] transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => setConfirmClear(true)}
            className="flex-1 px-4 py-2 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] font-medium text-sm hover:bg-[#FEF2F2] transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* Confirm Delete Modal */}
        {confirmClear && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="bg-white rounded-xl p-6 max-w-sm shadow-lg">
              <p className="text-[#0F172A] font-semibold mb-4">Clear all chat history?</p>
              <p className="text-[#64748B] text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#0F172A] font-medium text-sm hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearHistory();
                    setConfirmClear(false);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-[#EF4444] text-white font-medium text-sm hover:bg-[#DC2626] transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
