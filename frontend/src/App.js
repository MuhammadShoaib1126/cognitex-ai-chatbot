import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const loadFromStorage = (key, defaultValue) => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

function App() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState(() => loadFromStorage('chatMessages', []));
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(chat));
  }, [chat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setChat(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/chat', { message: input });
      setChat(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setChat(prev => [...prev, { role: 'assistant', content: 'Error. Try again.' }]);
    }
    setLoading(false);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = async () => {
    try {
      await axios.post('http://localhost:8000/clear');
    } catch (error) {
      console.error('Error clearing backend history:', error);
    }
    setChat([]);
    localStorage.removeItem('chatMessages');
  };

  return (
    <div style={s.body}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0d0d0d; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
        @keyframes glow { 0% { text-shadow: 0 0 10px rgba(196, 156, 40, 0.15); } 50% { text-shadow: 0 0 20px rgba(196, 156, 40, 0.3); } 100% { text-shadow: 0 0 10px rgba(196, 156, 40, 0.15); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Code block styling */
        pre {
          background: #0a0a0a !important;
          border: 1px solid #222 !important;
          border-radius: 8px !important;
          padding: 16px !important;
          overflow-x: auto !important;
          margin: 8px 0 !important;
        }
        code {
          font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace !important;
          font-size: 13px !important;
          color: #e0e0e0 !important;
        }
        pre code {
          color: #c9d1d9 !important;
        }
        p code {
          background: #1a1a1a !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          color: #c49c28 !important;
        }
      `}</style>

      <div style={s.container}>
        <div style={s.headerRow}>
          <div style={s.logoWrapper}>
            <div style={s.logoIcon}>🧠</div>
            <div style={s.logoText}>
              <span style={s.logoMain}>COGNITEX</span>
              <span style={s.logoSub}>AI CHAT</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={clearChat} style={s.clearBtn}>Clear</button>
            <span style={s.badge}>BETA</span>
          </div>
        </div>
        <p style={s.tagline}>Persistent memory chatbot</p>

        <div style={s.statsRow}>
          <div style={s.statBox}>
            <span style={s.statNumber}>{chat.length}</span>
            <span style={s.statLabel}>Messages</span>
          </div>
        </div>

        <div style={s.chatBox}>
          {chat.length === 0 && (
            <div style={s.empty}>
              <p style={{ color: '#555', fontSize: 14 }}>Start a conversation</p>
              <p style={{ color: '#2a2a2a', fontSize: 12, marginTop: 6 }}>Your first message is permanently protected</p>
            </div>
          )}
          {chat.map((msg, i) => {
            const isAssistant = msg.role === 'assistant';
            return (
              <div key={i} style={s.msgGroup}>
                <div style={s.rowLabel}>{isAssistant ? 'COGNITEX' : 'YOU'}</div>
                <div style={{ ...s.row, justifyContent: isAssistant ? 'flex-start' : 'flex-end' }}>
                  {isAssistant && <div style={s.avatar}>C</div>}
                  <div style={isAssistant ? s.aiBubble : s.userBubble}>
                    {isAssistant ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                    {isAssistant && (
                      <button
                        onClick={() => copyToClipboard(msg.content, i)}
                        style={{ ...s.copyBtn, opacity: copiedIndex === i ? 1 : undefined }}
                        title="Copy message"
                      >
                        {copiedIndex === i ? '✓' : '📋'}
                      </button>
                    )}
                  </div>
                  {!isAssistant && <div style={s.userAvatar}>U</div>}
                </div>
                {isAssistant && (
                  <div style={s.copiedIndicator}>
                    {copiedIndex === i && <span style={s.copiedText}>Copied!</span>}
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div style={s.msgGroup}>
              <div style={s.rowLabel}>COGNITEX</div>
              <div style={{ ...s.row, justifyContent: 'flex-start' }}>
                <div style={s.avatar}>C</div>
                <div style={s.aiBubble}>
                  <span style={{ ...s.dot, animation: 'blink 1.4s infinite' }}>●</span>
                  <span style={{ ...s.dot, animation: 'blink 1.4s infinite 0.2s' }}>●</span>
                  <span style={{ ...s.dot, animation: 'blink 1.4s infinite 0.4s' }}>●</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={s.inputRow}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            style={s.input}
          />
          <button onClick={sendMessage} disabled={loading} style={s.sendBtn}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
        
        <p style={s.footerText}>Messages persist after refresh · Powered by Groq</p>
      </div>
    </div>
  );
}

const s = {
  body: { minHeight: '100vh', background: '#0d0d0d', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  container: { maxWidth: 750, width: '100%', margin: '0 auto', padding: '24px 20px 20px 20px', background: '#0d0d0d', borderRadius: 16, border: '1px solid #1a1a1a', boxShadow: '0 0 40px rgba(0,0,0,0.8)' },
  
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  logoWrapper: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: { fontSize: 32, filter: 'drop-shadow(0 0 12px rgba(196, 156, 40, 0.2))' },
  logoText: { display: 'flex', flexDirection: 'column' },
  logoMain: { color: '#f5f5f5', fontSize: 22, fontWeight: 800, letterSpacing: '2px', lineHeight: 1.1, animation: 'glow 3s ease-in-out infinite' },
  logoSub: { color: '#444', fontSize: 8, letterSpacing: '4px', fontWeight: 600, textTransform: 'uppercase' },

  clearBtn: {
    background: '#1a1a1a',
    color: '#666',
    border: '1px solid #222',
    padding: '4px 14px',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
  },

  badge: { background: '#c49c28', color: '#0d0d0d', padding: '2px 10px', borderRadius: 4, fontSize: 8, fontWeight: 700, letterSpacing: '2px' },
  tagline: { color: '#333', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20 },

  statsRow: { display: 'flex', gap: 2, marginBottom: 20, background: '#111', borderRadius: 8, border: '1px solid #1a1a1a', overflow: 'hidden' },
  statBox: { flex: 1, textAlign: 'center', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  statNumber: { color: '#f5f5f5', fontSize: 22, fontWeight: 700 },
  statLabel: { color: '#555', fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' },

  chatBox: { display: 'flex', flexDirection: 'column', gap: 16, minHeight: 400, maxHeight: '50vh', overflowY: 'auto', padding: '0 4px 20px 4px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, color: '#555' },
  msgGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  rowLabel: { color: '#222', fontSize: 8, fontWeight: 700, letterSpacing: '2px', paddingLeft: 8 },
  row: { display: 'flex', alignItems: 'flex-end', gap: 10 },
  avatar: { width: 28, height: 28, borderRadius: 8, background: '#181818', color: '#c49c28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  userAvatar: { width: 28, height: 28, borderRadius: 8, background: '#c49c28', color: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  
  userBubble: { maxWidth: '75%', padding: '12px 18px', borderRadius: 10, fontSize: 14, lineHeight: 1.55, color: '#0d0d0d', background: '#c49c28', fontWeight: 500, position: 'relative' },
  aiBubble: { maxWidth: '75%', padding: '12px 18px', borderRadius: 10, fontSize: 14, lineHeight: 1.55, color: '#e0e0e0', background: '#181818', border: '1px solid #222', position: 'relative' },
  
  copyBtn: {
    background: 'none',
    border: 'none',
    color: '#444',
    cursor: 'pointer',
    fontSize: 11,
    marginLeft: 12,
    padding: '2px 4px',
    borderRadius: 4,
  },
  copiedIndicator: { paddingLeft: 48, minHeight: 14 },
  copiedText: { color: '#c49c28', fontSize: 10, fontWeight: 500, animation: 'fadeIn 0.3s ease' },

  dot: { fontSize: 8, letterSpacing: 2, color: '#444' },

  inputRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 },
  input: { flex: 1, padding: '14px 18px', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 10, color: '#e0e0e0', fontSize: 14, outline: 'none' },
  sendBtn: { padding: '14px 28px', background: '#f5f5f5', color: '#0d0d0d', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, letterSpacing: '2px', cursor: 'pointer', whiteSpace: 'nowrap' },
  
  footerText: { textAlign: 'center', color: '#1a1a1a', fontSize: 10, marginTop: 20, letterSpacing: '0.5px' },
};

export default App;