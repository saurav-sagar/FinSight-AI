import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../utils/api';

const AiCoach = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Pagination states
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const defaultGreeting = { 
    role: 'assistant', 
    content: 'Hello! I am FinSight AI. I can analyze your transactions and help you make better financial decisions. What would you like to know today?' 
  };

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const fetchHistory = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      
      const res = await api.get(`/ai/history?limit=10&skip=${isLoadMore ? skip : 0}`);
      const newMessages = res.data.data;
      
      if (!isLoadMore) {
        if (newMessages.length > 0) {
          setMessages(newMessages);
          setSkip(newMessages.length);
        } else {
          setMessages([defaultGreeting]);
        }
        setHasMore(res.data.hasMore);
        
        // Wait for DOM to update then scroll instantly
        setTimeout(() => scrollToBottom('auto'), 100);
      } else {
        if (newMessages.length > 0) {
          const container = chatContainerRef.current;
          const oldScrollHeight = container?.scrollHeight || 0;
          
          setMessages(prev => [...newMessages, ...prev]);
          setSkip(prev => prev + newMessages.length);
          
          // Preserve scroll position
          setTimeout(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - oldScrollHeight;
            }
          }, 0);
        }
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      if (!isLoadMore) setMessages([defaultGreeting]);
    } finally {
      if (!isLoadMore) setLoadingHistory(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchHistory(false);
  }, []);

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && !loadingMore && !loadingHistory) {
      fetchHistory(true);
    }
  };

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const text = textOverride || input;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setTimeout(() => scrollToBottom('smooth'), 100);

    try {
      const res = await api.post('/ai/coach', { message: text });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.data }]);
      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error analyzing your data. Please make sure the backend is connected to OpenRouter." }]);
      setTimeout(() => scrollToBottom('smooth'), 100);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Analyze my spending this month",
    "Where can I cut costs?",
    "Am I saving enough?",
    "Summarize my biggest expenses"
  ];

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)] flex flex-col">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
          <Sparkles className="text-purple-400" />
          Smart Assistant
        </h2>
        <p className="text-slate-400">Ask questions about your financial data directly.</p>
      </div>

      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden relative">
        {/* Chat Area */}
        <div 
          className="flex-1 overflow-y-auto chat-scroll p-6 space-y-6"
          onScroll={handleScroll}
          ref={chatContainerRef}
        >
          {loadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 size={24} className="animate-spin text-purple-500" />
            </div>
          )}
          {loadingHistory ? (
            <div className="space-y-6">
              {/* Skeleton 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse shrink-0"></div>
                <div className="w-3/4 h-24 bg-slate-800/50 rounded-2xl animate-pulse"></div>
              </div>
              {/* Skeleton 2 */}
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse shrink-0"></div>
                <div className="w-1/2 h-16 bg-slate-800/50 rounded-2xl animate-pulse"></div>
              </div>
              {/* Skeleton 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse shrink-0"></div>
                <div className="w-2/3 h-32 bg-slate-800/50 rounded-2xl animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}>
                    {msg.role === 'user' ? (
                      user?.avatar ? (
                        <img src={user.avatar} alt="User" className="w-full h-full object-cover rounded-lg" />
                      ) : user?.name ? (
                        <span className="text-white font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                      ) : (
                        <User size={18} className="text-white" />
                      )
                    ) : (
                      <Bot size={18} className="text-white" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none text-sm md:text-base'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-slate-300" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="leading-relaxed pl-1" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-3 mt-4" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold text-white mb-2 mt-3" {...props} />,
                          a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2" {...props} />,
                          code: ({node, inline, ...props}) => 
                            inline 
                              ? <code className="bg-slate-700/50 text-purple-300 px-1.5 py-0.5 rounded text-sm" {...props} />
                              : <code className="block bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto text-sm mb-3" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-white"/>
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-5 py-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="px-6 py-4 flex items-center justify-between gap-4 border-t border-slate-800 bg-slate-900/30">
            <div className="flex flex-wrap gap-2 flex-1">
              {suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(null, s)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-full transition-colors border border-slate-700 hover:border-slate-500 cursor-pointer z-10"
                >
                  {s}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowSuggestions(false)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-full hover:bg-slate-800 shrink-0"
              title="Dismiss suggestions"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 backdrop-blur-md">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FinSight AI anything..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiCoach;
