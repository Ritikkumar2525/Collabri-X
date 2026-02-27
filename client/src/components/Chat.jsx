import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import { Send, Sparkles, MessageSquare, X, Loader2 } from 'lucide-react';
import * as Y from 'yjs';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = ({ chatArray, roomId, showOnboarding }) => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!chatArray) return;

        const handleChatChange = () => {
            setMessages(chatArray.toArray());
            scrollToBottom();
        };

        // Initial load
        setMessages(chatArray.toArray());
        chatArray.observe(handleChatChange);

        return () => {
            chatArray.unobserve(handleChatChange);
        };
    }, [chatArray]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatArray) return;

        const messageData = {
            id: crypto.randomUUID(),
            sender: user.name,
            content: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        chatArray.push([messageData]);
        setNewMessage('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-96 h-[500px] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col pointer-events-auto ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-900 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Room Chat</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, idx) => {
                                    const isSelf = msg.sender === user.name;
                                    return (
                                        <motion.div
                                            key={msg.id || idx}
                                            initial={{ opacity: 0, x: isSelf ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                                        >
                                            {!isSelf && (
                                                <span className="text-[10px] font-black text-slate-400 mb-1 ml-1 uppercase tracking-widest">
                                                    {msg.sender}
                                                </span>
                                            )}
                                            <div className={`max-w-[85%] px-4 py-3 rounded-2.5xl text-sm shadow-sm font-medium leading-relaxed ${isSelf
                                                ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-100'
                                                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                                                }`}>
                                                {msg.content}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 mt-1.5 opacity-60 px-1 uppercase tabular-nums">
                                                {msg.timestamp}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 ring-indigo-500/10 rounded-2xl py-3.5 pl-5 pr-14 text-sm transition-all outline-none font-medium text-slate-700"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center shadow-lg shadow-indigo-100"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className={`h-16 w-16 bg-slate-900 text-white rounded-3xl shadow-2xl flex items-center justify-center transition-all border-2 border-white/10 pointer-events-auto relative ${showOnboarding ? 'ring-8 ring-indigo-500/20' : ''}`}
                >
                    <MessageSquare size={24} />
                    {messages.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 border-2 border-white rounded-full" />
                    )}
                </motion.button>
            )}
        </div>
    );
};

export default Chat;
