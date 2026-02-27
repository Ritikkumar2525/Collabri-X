import React, { useState, useEffect, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
    LayoutDashboard, Plus, Users, Layers, Sparkles, Settings, LogOut,
    ChevronLeft, ChevronRight, Search, Bell, MessageSquare, Play,
    MoreHorizontal, Share2, Copy, Trash2, Clock, Zap, History, BarChart2, TrendingUp, Target,
    FileText, Lightbulb, Archive, LayoutGrid, Library
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

// Mandatory Safety Guardrail: ErrorBoundary to prevent white screens
class DashboardErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error, errorInfo) { console.error("Dashboard Crash:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-600 p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><FileText size={32} /></div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h2>
                    <p className="text-sm font-medium mb-6 opacity-60 max-w-xs">We encountered an unexpected error while rendering your dashboard. Our team has been notified.</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Refresh Dashboard</button>
                </div>
            );
        }
        return this.props.children;
    }
}

const RoomCard = ({ room, idx, navigate, onRename, onDelete, onArchive }) => {
    return (
        <Reorder.Item
            value={room}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileDrag={{ scale: 1.05, boxShadow: "0px 10px 25px rgba(0,0,0,0.08)" }}
            className="group relative bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-grab active:cursor-grabbing"
            onClick={() => navigate(`/room/${room.id}`)}
        >
            {/* Snapshot Preview Placeholder */}
            <div className="h-40 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-50">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Layers size={40} className="text-slate-200 group-hover:scale-125 transition-transform duration-700 ease-out" />

                {/* Hover Quick Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 transition-transform duration-300">
                    {[
                        { icon: Share2, label: 'Invite', color: 'hover:bg-indigo-500 hover:text-white', action: (e) => { e.stopPropagation(); } },
                        { icon: FileText, label: 'Rename', color: 'hover:bg-slate-100 hover:text-slate-700', action: (e) => { e.stopPropagation(); onRename(room); } },
                        { icon: Archive, label: 'Archive', color: 'hover:bg-amber-50 hover:text-amber-600', action: (e) => { e.stopPropagation(); onArchive(room.id); } },
                        { icon: Trash2, label: 'Delete', color: 'hover:bg-red-50 hover:text-red-500', action: (e) => { e.stopPropagation(); onDelete(room.id); } }
                    ].map((btn, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title={btn.label}
                            onClick={btn.action}
                            className={`p-2 bg-white rounded-lg text-slate-400 transition-all border border-slate-100 shadow-sm ${btn.color}`}
                        >
                            <btn.icon size={16} />
                        </motion.button>
                    ))}
                </div>

                {/* Status Tag */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${room.status === 'Active Now' ? 'bg-green-50 text-green-600 border-green-100' :
                    room.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                    {room.status === 'Active Now' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.3)]" />}
                    {room.status}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-4 relative">
                <div className="flex justify-between items-start">
                    <div className="min-w-0">
                        <h4 className="text-slate-800 font-semibold truncate group-hover:text-indigo-600 transition-colors duration-300">{room.title}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium italic">
                            <Clock size={12} className="opacity-50" /> {room.lastEdited}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex -space-x-2 overflow-hidden">
                        {[...Array(Math.min(room.users, 3))].map((_, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -4, zIndex: 10 }}
                                className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm cursor-default"
                            >
                                {String.fromCharCode(65 + i)}
                            </motion.div>
                        ))}
                        {room.users > 3 && (
                            <div className="flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white bg-slate-50 border border-slate-100 text-[10px] font-bold text-indigo-500">
                                +{room.users - 3}
                            </div>
                        )}
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        Open Room <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </Reorder.Item>
    );
};

const TemplatePreviewModal = ({ isOpen, onClose, template, onLaunch }) => {
    if (!isOpen || !template) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100"
            >
                <div className="relative h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10" />
                    <template.icon size={80} className="text-indigo-500/20 absolute -right-4 -bottom-4 rotate-12" />
                    <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center relative z-10 border border-slate-50">
                        <template.icon size={48} className="text-indigo-600" />
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">{template.title}</h3>
                            <p className="text-slate-500 font-medium">{template.desc}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                            <Plus size={24} className="rotate-45" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Target Workflow</h4>
                            <p className="text-sm font-bold text-slate-700">{template.workflow || 'Standard Collaborative Board'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ready Elements</h4>
                            <p className="text-sm font-bold text-slate-700">{template.elements || 'Canvas, Stickies, AI Tools'}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-200"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={template.isComingSoon}
                            onClick={() => {
                                onLaunch(template.key || template.title);
                                onClose();
                            }}
                            className={`flex-1 px-6 py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-2 ${template.isComingSoon ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 shadow-indigo-600/20'}`}
                        >
                            {template.isComingSoon ? 'Launching Soon...' : 'Launch Session'}
                            {!template.isComingSoon && <Play size={18} fill="currentColor" />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};


const TemplateCard = ({ template, idx, onLaunch, onPreview }) => {
    // Safety Guardrail: Log warning if handler is missing
    const handleLaunch = (e) => {
        e.stopPropagation();
        if (template.isComingSoon) return;
        if (typeof onLaunch !== 'function') {
            throw new Error("Template launch must use handleCreateRoom");
        }
        onLaunch(template.key || template.title);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 + 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`group relative h-56 rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all border-b-8 ${template.isComingSoon ? 'grayscale border-b-slate-200' : 'hover:border-b-indigo-500'}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 group-hover:opacity-0 transition-opacity duration-500" />

            {/* Template Icon/Visual */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className={`w-14 h-14 rounded-[20px] shadow-sm flex items-center justify-center mb-4 transition-all duration-500 border border-slate-100 ${template.isComingSoon ? 'bg-slate-100' : 'bg-white group-hover:bg-indigo-50 group-hover:scale-110'}`}>
                    <template.icon size={28} className={template.isComingSoon ? 'text-slate-400' : 'text-indigo-500'} />
                </div>
                <h5 className="text-slate-800 font-black text-sm mb-1 tracking-tight">{template.title}</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">{template.desc}</p>

                {template.isComingSoon && (
                    <span className="mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-[8px] font-black uppercase text-slate-500 border border-slate-200">Reserved</span>
                )}
            </div>

            {/* Hover Content */}
            {!template.isComingSoon && (
                <div
                    className="absolute inset-0 bg-indigo-600/10 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 p-6 z-30"
                >
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => onPreview(template)}
                            className="bg-white text-slate-800 w-full py-3 rounded-2xl text-xs font-black shadow-lg hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Search size={14} /> Preview
                        </button>
                        <button
                            onClick={handleLaunch}
                            className="bg-indigo-600 text-white w-full py-3 rounded-2xl text-xs font-black shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Launch <Play size={14} fill="currentColor" />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};


const SettingsModal = ({ isOpen, onClose, user, onUpdate }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        const success = await onUpdate({ name, email });
        setIsSaving(false);

        if (success) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(onClose, 1500);
        } else {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <Settings size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Account Settings</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <Plus size={20} className="rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-semibold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-semibold"
                            />
                        </div>

                        {message.text && (
                            <div className={`p-3 rounded-xl text-xs font-bold text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving Changes...' : 'Update Profile'}
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-medium">Enterprise Tier Active</p>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const JoinRoomModal = ({ isOpen, onClose, onJoin }) => {
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!roomId.trim()) {
            setError('Please enter a Room ID');
            return;
        }
        onJoin(roomId);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <Users size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Join Workspace</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <Plus size={20} className="rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Room Identification</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Enter 6-digit Room ID (e.g. AB1234)"
                                value={roomId}
                                onChange={(e) => {
                                    setRoomId(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-mono tracking-widest"
                            />
                            {error && <p className="text-xs text-red-500 mt-2 px-1 font-medium">{error}</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Connect to Session
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium text-center">Ask your team lead for the unique room code.</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

const RenameRoomModal = ({ isOpen, onClose, onRename, currentTitle }) => {
    const [title, setTitle] = useState(currentTitle || '');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setTitle(currentTitle);
    }, [currentTitle]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsLoading(true);
        await onRename(title);
        setIsLoading(false);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <FileText size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Rename Workspace</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <Plus size={20} className="rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Workspace Title</label>
                            <input
                                autoFocus
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-semibold"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Updating...' : 'Save New Title'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};




const AICoPilotPanel = ({ activities = [] }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your AI Pilot. How can I help you with your workspace today?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await api.post('/ai/chat', { message: input });
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleGetInsight = async () => {
        setIsTyping(true);
        try {
            const response = await api.post('/ai/analyze-activity', { logs: activities });
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.summary, isInsight: true }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Couldn't analyze activity right now." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
            {/* Quick Actions */}
            <div className="px-4 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
                <button
                    onClick={handleGetInsight}
                    disabled={isTyping || activities.length === 0}
                    className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100/50 hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                    <TrendingUp size={12} />
                    Analyze Activity
                </button>
            </div>

            {/* Chat History */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium shadow-sm border ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
                            : msg.isInsight
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100 rounded-tl-none'
                                : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                            }`}>
                            {msg.isInsight && <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase text-emerald-600/70 tracking-widest"><Target size={10} /> Daily Insight</div>}
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="relative group">
                    <Sparkles size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 group-focus-within:animate-pulse" />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask AI for advice..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-12 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                        <Zap size={14} />
                    </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-3 text-center font-medium">Powering your productivity with GPT-3.5</p>
            </div>
        </div>
    );
};



const CreateSuccessOverlay = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-3xl"
    >
        <div className="text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Workspace Ready!</h3>
            <p className="text-sm text-slate-500">Redirecting to your new room...</p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [rooms, setRooms] = useState([]);
    const [archivedRooms, setArchivedRooms] = useState([]);
    const [activities, setActivities] = useState([]);
    const [templates] = useState([
        { id: 'T1', title: 'Agile Board', desc: 'Kanban & Scrum', icon: LayoutDashboard, key: 'agile-board', workflow: 'Agile Software Development', elements: 'Kanban Columns, User Stories' },
        { id: 'T2', title: 'User Journey', desc: 'Mapping flows', icon: Users, key: 'user-journey', workflow: 'UX Research & Design', elements: 'Stages, Touchpoints, Pain Points' },
        { id: 'T3', title: 'PDF Review', desc: 'Document markup', icon: Layers, key: 'pdf-review', workflow: 'Document Collaboration', elements: 'Document Hub, Annotation Tools' },
        { id: 'T4', title: 'Wireframing', desc: 'UI/UX basics', icon: Sparkles, key: 'wireframing', workflow: 'Product Design', elements: 'Quick Lo-Fi Components' },
        { id: 'T5', title: 'Coming Soon', desc: 'More projects', icon: Library, key: 'coming-soon', isComingSoon: true }
    ]);

    const [socket, setSocket] = useState(null);
    const [showCreateSuccess, setShowCreateSuccess] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [currentRoomToRename, setCurrentRoomToRename] = useState(null);
    const [showInviteToast, setShowInviteToast] = useState(false);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalActiveSessions: 0,
        activeProjects: 0,
        completionRate: 0,
    });

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [roomsRes, archivedRes, activityRes, statsRes] = await Promise.all([
                    api.get('/rooms?archived=false'),
                    api.get('/rooms?archived=true'),
                    api.get('/activity'),
                    api.get('/rooms/stats')
                ]);

                const format = (r) => ({
                    id: r.roomId,
                    title: r.title || (r.roomId === 'INTERNAL_TEST' ? 'Getting Started' : `Project ${r.roomId}`),
                    status: r.isArchived ? 'Archived' : 'Saved',
                    users: 0,
                    lastEdited: new Date(r.updatedAt).toLocaleDateString() === new Date().toLocaleDateString()
                        ? 'Today' : new Date(r.updatedAt).toLocaleDateString()
                });

                setRooms(roomsRes.data.map(format));
                setArchivedRooms(archivedRes.data.map(format));
                setActivities(activityRes.data);
                setStats(statsRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Failed to load your workspaces.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Socket Connection
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            auth: { token: useAuthStore.getState().token }
        });

        newSocket.on('room-activity-update', ({ roomId, activeUsers }) => {
            setRooms(prev => prev.map(r =>
                r.id === roomId
                    ? { ...r, status: activeUsers > 0 ? 'Active Now' : 'Saved', users: activeUsers }
                    : r
            ));
        });

        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    const handleProfileUpdate = async (data) => {
        return await useAuthStore.getState().updateProfile(data);
    };

    const handleJoinSession = (id) => {
        if (!id) return;
        navigate(`/room/${id}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleInvite = () => {
        navigator.clipboard.writeText(window.location.origin);
        setShowInviteToast(true);
        setTimeout(() => setShowInviteToast(false), 3000);
    };

    const handleCreateRoom = async (templateType = null) => {
        setIsLoading(true);
        try {
            const title = templateType ? `${templateType} Project` : 'New Workspace';
            const response = await api.post('/rooms/create', { title });
            const roomId = response.data.roomId;

            if (templateType) {
                await api.post('/ai/generate-diagram', { prompt: `Initialize ${templateType} layout`, roomId });
            }

            setShowCreateSuccess(true);
            setTimeout(() => {
                navigate(`/room/${roomId}`);
            }, 1000);
        } catch (err) {
            console.error('Create room failed', err);
            setError('Failed to create workspace.');
            setIsLoading(false);
        }
    };

    const handleArchiveRoom = async (roomId) => {
        try {
            await api.put(`/rooms/archive/${roomId}`);
            setRooms(prev => prev.filter(r => r.id !== roomId));
            const archivedRes = await api.get('/rooms?archived=true');
            setArchivedRooms(archivedRes.data.map(r => ({
                id: r.roomId,
                title: r.title || `Project ${r.roomId}`,
                status: 'Archived',
                users: 0,
                lastEdited: 'Recently'
            })));
        } catch (err) {
            console.error('Archive failed', err);
        }
    };

    const handleRestoreRoom = async (roomId) => {
        try {
            await api.put(`/rooms/restore/${roomId}`);
            setArchivedRooms(prev => prev.filter(r => r.id !== roomId));
            const roomsRes = await api.get('/rooms?archived=false');
            setRooms(roomsRes.data.map(r => ({
                id: r.roomId,
                title: r.title || `Project ${r.roomId}`,
                status: 'Saved',
                users: 0,
                lastEdited: 'Just now'
            })));
        } catch (err) {
            console.error('Restore failed', err);
        }
    };

    const handleRenameRoom = async (newTitle) => {
        if (!currentRoomToRename) return;
        try {
            await api.put(`/rooms/rename/${currentRoomToRename.id}`, { title: newTitle });
            setRooms(prev => prev.map(r => r.id === currentRoomToRename.id ? { ...r, title: newTitle } : r));
        } catch (err) {
            console.error('Rename failed', err);
            setError('Failed to rename workspace.');
        }
    };

    const openRenameModal = (room) => {
        setCurrentRoomToRename(room);
        setIsRenameModalOpen(true);
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('Are you sure? This is permanent.')) return;
        try {
            await api.delete(`/rooms/${roomId}`);
            setRooms(prev => prev.filter(r => r.id !== roomId));
            setArchivedRooms(prev => prev.filter(r => r.id !== roomId));
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    return (
        <div className="flex h-screen bg-[#F9FAFB] text-slate-700 overflow-hidden font-sans">
            <motion.aside
                initial={false}
                animate={{ width: isSidebarCollapsed ? 80 : 260 }}
                className="bg-white border-r border-slate-100 flex flex-col z-50 relative shadow-sm"
            >
                <div className="p-6 flex items-center justify-between">
                    {!isSidebarCollapsed && (
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                                <Layers size={22} />
                            </div>
                            <span className="text-xl font-bold text-slate-800">Workspace</span>
                        </div>
                    )}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                        {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    {[
                        { id: 'Overview', icon: LayoutGrid, active: true },
                        { id: 'Archive', icon: Archive, active: true },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <item.icon size={20} />
                            {!isSidebarCollapsed && <span className="font-semibold text-sm">{item.id}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-1">
                    <button onClick={() => setIsSettingsModalOpen(true)} className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-500 hover:bg-slate-50">
                        <Settings size={20} />
                        {!isSidebarCollapsed && <span className="font-semibold text-sm">Settings</span>}
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <LogOut size={20} />
                        {!isSidebarCollapsed && <span className="font-semibold text-sm">Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            <main className="flex-1 flex flex-col relative overflow-hidden bg-[#F9FAFB]">
                <DashboardErrorBoundary>
                    <header className="h-24 border-b border-slate-100 flex flex-col justify-center px-8 bg-white/80 backdrop-blur-xl z-40 shadow-sm gap-2">
                        <div className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-2xl w-full max-w-md border border-slate-100 group focus-within:ring-4 ring-indigo-500/10 transition-all">
                                <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Find projects by name or ID..."
                                    className="bg-transparent border-none outline-none text-sm w-full text-slate-700 font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        if (!handleCreateRoom) console.warn("Dashboard button without handler: Create Room");
                                        handleCreateRoom();
                                    }}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2.5 font-black text-sm"
                                >
                                    <Plus size={18} className="stroke-[3]" />
                                    Create Room
                                </button>

                                {/* AI Assistant Toggle */}
                                <button
                                    onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/10 ${isAIPanelOpen
                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                        : 'bg-white text-slate-700 border border-slate-100 hover:border-indigo-300'
                                        }`}
                                >
                                    <Sparkles size={18} className={isAIPanelOpen ? 'text-indigo-600' : 'text-slate-400'} />
                                    AI Assistant
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold px-1 select-none">
                            Paste a Room ID in search or click Create Room to start.
                        </p>
                    </header>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#F9FAFB]">
                        <div className="max-w-7xl mx-auto p-8 lg:p-12">
                            <AnimatePresence>
                                {showCreateSuccess && <CreateSuccessOverlay />}
                            </AnimatePresence>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                                    <Zap size={18} />
                                    {error}
                                </div>
                            )}

                            {(() => {
                                const filteredRooms = rooms.filter(r =>
                                    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    r.id.toLowerCase().includes(searchQuery.toLowerCase())
                                );
                                const filteredArchived = archivedRooms.filter(r =>
                                    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    r.id.toLowerCase().includes(searchQuery.toLowerCase())
                                );

                                if (isLoading && rooms.length === 0) {
                                    return (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Waking up your workspace...</p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (activeTab === 'Archive') {
                                    return (
                                        <div>
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Archived Rooms</h3>
                                            </div>
                                            {filteredArchived.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {filteredArchived.map((room) => (
                                                        <div key={room.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm grayscale opacity-70">
                                                            <h4 className="font-bold text-slate-800 mb-1">{room.title}</h4>
                                                            <div className="mt-6 flex gap-2">
                                                                <button onClick={() => handleRestoreRoom(room.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold">Restore</button>
                                                                <button onClick={() => handleDeleteRoom(room.id)} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={16} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-20 text-center">
                                                    <div className="text-slate-400 font-bold text-lg mb-2">No archived rooms found</div>
                                                    {searchQuery && <p className="text-slate-400 text-sm">Matching "{searchQuery}"</p>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        {/* Stats */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                            {[
                                                { label: 'Total Sessions Created', val: stats.totalActiveSessions, icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                                { label: 'Active Collaboration Rooms', val: stats.activeProjects, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            ].map((stat, i) => (
                                                <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-6">
                                                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 shadow-sm border border-white`}><stat.icon size={28} /></div>
                                                    <div>
                                                        <p className="text-2xl font-black text-slate-900 mb-0.5">{stat.val}</p>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Recent Activity */}
                                        {filteredRooms.length > 0 && !searchQuery && (
                                            <div className="mb-12">
                                                <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-6">Recent Activity</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {filteredRooms.slice(0, 3).map((room) => (
                                                        <div
                                                            key={room.id}
                                                            onClick={() => navigate(`/room/${room.id}`)}
                                                            className="bg-white border border-slate-100 p-5 rounded-3xl flex items-center justify-between hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer transition-all group"
                                                        >
                                                            <div className="min-w-0 pr-4">
                                                                <p className="text-sm font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{room.title}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold italic mt-1 flex items-center gap-1.5 uppercase tracking-widest"><Clock size={10} /> {room.lastEdited}</p>
                                                            </div>
                                                            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors border border-slate-50 shrink-0">
                                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Templates */}
                                        <div className="mb-12">
                                            <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-8">Start with a Template</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                                                {templates.map((template, idx) => (
                                                    <TemplateCard
                                                        key={template.id}
                                                        template={template}
                                                        idx={idx}
                                                        onLaunch={handleCreateRoom}
                                                        onPreview={setPreviewTemplate}
                                                    />
                                                ))}
                                            </div>

                                            <AnimatePresence>
                                                {previewTemplate && (
                                                    <TemplatePreviewModal
                                                        isOpen={!!previewTemplate}
                                                        onClose={() => setPreviewTemplate(null)}
                                                        template={previewTemplate}
                                                        onLaunch={handleCreateRoom}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Your Workspaces */}
                                        <div>
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Your Workspaces</h3>
                                                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                                                    {searchQuery ? `${filteredRooms.length} Matches` : `${rooms.length} Active Rooms`}
                                                </span>
                                            </div>

                                            {filteredRooms.length > 0 ? (
                                                <Reorder.Group axis="y" values={rooms} onReorder={setRooms} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                                    {filteredRooms.map((room, idx) => (
                                                        <RoomCard
                                                            key={room.id}
                                                            room={room}
                                                            idx={idx}
                                                            navigate={navigate}
                                                            onRename={openRenameModal}
                                                            onDelete={handleDeleteRoom}
                                                            onArchive={handleArchiveRoom}
                                                        />
                                                    ))}
                                                </Reorder.Group>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mb-12 py-20 bg-white border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-4 shadow-sm"
                                                >
                                                    {searchQuery ? (
                                                        <>
                                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-8 shadow-inner border border-slate-100/50">
                                                                <Search size={40} className="opacity-50" />
                                                            </div>
                                                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">No rooms found</h3>
                                                            <p className="text-slate-500 max-w-sm mb-10 leading-relaxed font-medium">
                                                                We couldn't find any workspace matching "{searchQuery}". Check the ID or try a different name.
                                                            </p>
                                                            {searchQuery.length >= 6 && (
                                                                <button
                                                                    onClick={() => handleJoinSession(searchQuery)}
                                                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                                                                >
                                                                    Join Room {searchQuery}
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-8 shadow-inner border border-indigo-100/50">
                                                                <Layers size={40} className="opacity-80" />
                                                            </div>
                                                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Create your first workspace</h3>
                                                            <p className="text-slate-500 max-w-sm mb-10 leading-relaxed font-medium">
                                                                A room is a persistent digital workspace where you can whiteboard, huddle, and collaborate with AI.
                                                            </p>
                                                            <button
                                                                onClick={() => {
                                                                    if (!handleCreateRoom) console.warn("Dashboard empty state button without handler");
                                                                    handleCreateRoom();
                                                                }}
                                                                className="group relative px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 overflow-hidden"
                                                            >
                                                                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                                                Create a Room
                                                            </button>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Floating Bottom-Right Actions */}
                    <motion.div
                        animate={{ right: isAIPanelOpen ? 340 : 32 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-8 flex flex-col items-end gap-4 z-[90]"
                    >
                        {!isAIPanelOpen && !searchQuery && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white border border-indigo-100 text-indigo-600 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-tight cursor-pointer hover:bg-indigo-50 transition-all border-b-4 border-b-indigo-200 active:border-b-indigo-100 active:translate-y-0.5"
                                onClick={() => handleCreateRoom('agile-board')}
                            >
                                <Sparkles size={14} className="animate-pulse" />
                                Smart Suggestion: Create Agile Board
                            </motion.div>
                        )}
                        <button
                            onClick={() => handleCreateRoom()}
                            className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-b-4 border-b-indigo-800"
                        >
                            <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500 stroke-[3]" />
                        </button>
                    </motion.div>
                </DashboardErrorBoundary>
            </main>

            <AnimatePresence>
                {isAIPanelOpen && (
                    <motion.aside
                        initial={{ x: 320 }}
                        animate={{ x: 0 }}
                        exit={{ x: 320 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-100 flex flex-col z-[100] shadow-2xl"
                    >
                        <div className="p-6 h-20 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center font-bold text-slate-800 gap-2">
                                <Sparkles className="text-indigo-600" size={18} />
                                AI Assistant
                            </div>
                            <button onClick={() => setIsAIPanelOpen(false)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                                <Plus size={18} className="rotate-45" />
                            </button>
                        </div>
                        <div className="px-6 py-3 bg-indigo-50/30 border-b border-slate-50 shrink-0">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">Summarize activity, suggest next steps</p>
                        </div>
                        <AICoPilotPanel activities={activities} />
                    </motion.aside>
                )}
            </AnimatePresence>


            <AnimatePresence>
                {isJoinModalOpen && <JoinRoomModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} onJoin={handleJoinSession} />}
                {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} user={user} onUpdate={handleProfileUpdate} />}
                {isRenameModalOpen && (
                    <RenameRoomModal
                        isOpen={isRenameModalOpen}
                        onClose={() => setIsRenameModalOpen(false)}
                        onRename={handleRenameRoom}
                        currentTitle={currentRoomToRename?.title}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
