import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Navigation } from 'lucide-react';

interface ChatbotProps {
  chatHistory: Array<{ sender: 'user' | 'bot'; text: string; isRtl?: boolean; sources?: string[]; crowdWarning?: string }>;
  onSendMessage: (msg: string) => void;
  language: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ chatHistory, onSendMessage, language }) => {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isRtl = language === 'ar';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  return (
    <section className="flex flex-col h-full p-4 overflow-hidden gap-4" aria-label="Multilingual Concierge">
      <div className="glass-panel flex flex-col h-full overflow-hidden">
        <h2 className="text-xl font-bold flex items-center gap-2 m-0 mb-4 text-slate-100">
          <MessageSquare className="text-sky-500" size={24} />
          World Cup Multilingual Concierge
        </h2>
        <div className="chat-container flex-1 overflow-hidden">
        <div
          className="chat-messages"
          aria-live="polite"
          aria-label="Conversation history"
          role="log"
          style={{ maxHeight: '100%', overflowY: 'auto', paddingRight: '8px' }}
        >
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-bubble-container ${msg.sender === 'user' ? 'user' : 'bot'} ${msg.isRtl ? 'rtl' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}
              >
                <div
                  className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'bot'} ${msg.isRtl ? 'rtl' : ''}`}
                  role={msg.sender === 'bot' ? 'status' : undefined}
                  aria-label={msg.sender === 'bot' ? `Concierge: ${msg.text}` : `You: ${msg.text}`}
                >
                  {msg.text}
                </div>
                {msg.crowdWarning && (
                  <div className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
                    <span aria-hidden="true">⚠️</span> {msg.crowdWarning}
                  </div>
                )}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.map((src, sIdx) => (
                      <span key={sIdx} className="text-[10px] text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded-full border border-sky-400/20">
                        📄 {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendChat} className="chat-input-area mt-3">
            <input
              type="text"
              id="chat-input"
              placeholder={isRtl ? 'اسأل المساعد الرياضي...' : 'Ask Concierge (RAG grounded)...'}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="chat-input"
              aria-label="Type your question to the stadium concierge"
            />
            <button type="submit" className="chat-send-btn" aria-label="Send Message">
              <Navigation size={16} className="rotate-90" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
