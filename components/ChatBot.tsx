import React, { useState, useEffect, useRef } from 'react';
import { streamChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, User, Bot, Loader2, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am your AI career assistant. Ask me anything about skills, interview preparation, or career development.',
      timestamp: new Date()
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: 'model',
      text: '', // Start empty
      timestamp: new Date()
    }]);

    try {
      // Prepare history (excluding the very last empty model message we just added)
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // Stream
      const stream = streamChatMessage(userMsg.text, history);
      
      let fullResponse = "";
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => 
          m.id === modelMsgId ? { ...m, text: fullResponse } : m
        ));
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m => 
        m.id === modelMsgId ? { ...m, text: "Sorry, I encountered an error. Please try again.", isError: true } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col border-l border-slate-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <h3 className="font-semibold">Career Assistant</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-600 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
            }`}>
              {msg.role === 'model' ? (
                  <ReactMarkdown 
                    components={{
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mt-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mt-2 space-y-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-violet-700" {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
              ) : (
                msg.text
              )}
              {msg.text === '' && isStreaming && (
                 <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150" />
                 </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
