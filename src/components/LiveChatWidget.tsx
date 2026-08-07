import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, Headphones, CheckCircle2, ShieldAlert } from 'lucide-react';

export const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<{ sender: 'bot' | 'user'; text: string; time: string }[]>([
    {
      sender: 'bot',
      text: 'Hello! I am OMOVE AI Assistant. Need help choosing software or booking remote support via AnyDesk / TeamViewer?',
      time: 'Just now'
    }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setInputMessage('');

    // Automated smart assistant response logic
    setTimeout(() => {
      let botReply = 'Thanks for reaching out! A certified technician is online. For instant 1-on-1 AnyDesk repair, click Remote Support in the header.';
      const lower = userText.toLowerCase();

      if (lower.includes('blue screen') || lower.includes('bsod') || lower.includes('crash')) {
        botReply = 'For Blue Screen crashes (WHEA, IRQL), we recommend our $24.99 BSOD Repair Remote Service. Our tech will analyze your minidumps via AnyDesk immediately!';
      } else if (lower.includes('driver') || lower.includes('wifi') || lower.includes('graphics')) {
        botReply = 'Need drivers? Check out our DriverVault Offline 38GB ISO pack in the Store, or book a $19.99 Driver Installation Service!';
      } else if (lower.includes('key') || lower.includes('license') || lower.includes('download')) {
        botReply = 'All license keys and instant downloads are unlocked automatically in your Account Dashboard right after payment!';
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden glass-panel flex flex-col h-[420px]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">OMOVE Tech Assistant</h4>
                <p className="text-[10px] text-emerald-400 font-medium">Technicians Online 24/7</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Quick Option Pills */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              onClick={() => setInputMessage('Need AnyDesk repair help')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono whitespace-nowrap"
            >
              🔧 AnyDesk Fix
            </button>
            <button
              onClick={() => setInputMessage('How do I download my key?')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono whitespace-nowrap"
            >
              🔑 License Keys
            </button>
            <button
              onClick={() => setInputMessage('Fix Blue Screen crash')}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono whitespace-nowrap"
            >
              💻 BSOD Issue
            </button>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask a technical question..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-2xl shadow-indigo-600/50 flex items-center gap-2 hover:scale-105 transition-all active:scale-95 border border-indigo-400/30"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <Headphones className="w-4 h-4" />
        <span className="hidden sm:inline font-mono">Live Tech Chat</span>
      </button>
    </div>
  );
};
