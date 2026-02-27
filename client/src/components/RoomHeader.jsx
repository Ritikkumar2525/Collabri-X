import React, { useState } from 'react';
import {
    Video, Download, Sparkles, MonitorPlay,
    MoreHorizontal, Share2, Settings, Eye,
    UserPlus, Shield, Info, Activity,
    Zap, Mic, Camera, PhoneOff, Globe, Palette, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RoomHeader = ({
    roomId,
    userCount,
    isLive,
    onStartCall,
    onStopCall,
    isCallActive,
    onExport,
    onSummarize,
    isPresenting,
    setIsPresenting,
    onToggleAIPanel,
    onInvite,
    onSettings,
    onToggleBackgroundSelector,
    user,
    onExit
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-[110] h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 flex items-center justify-between shadow-md">
            {/* Left: Room Info */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800 tracking-tight uppercase">Room: {roomId}</span>
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Activity size={10} />
                            {userCount} {userCount === 1 ? 'Collaborator' : 'Collaborators'} Online
                        </span>
                        <div className="w-px h-3 bg-slate-200" />
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                            <Globe size={10} />
                            Public Workspace
                        </span>
                    </div>
                </div>
            </div>

            {/* Center: Main Actions */}
            <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                <HeaderButton
                    icon={isCallActive ? PhoneOff : Video}
                    label={isCallActive ? "End Call" : "Video Call"}
                    onClick={isCallActive ? onStopCall : onStartCall}
                    variant={isCallActive ? "danger" : "ghost"}
                />
                <HeaderButton
                    icon={Download}
                    label="Export"
                    onClick={onExport}
                />
                <HeaderButton
                    icon={Sparkles}
                    label="AI Summary"
                    onClick={onSummarize}
                />
                <HeaderButton
                    icon={MonitorPlay}
                    label={isPresenting ? "Stop Presenting" : "Present"}
                    onClick={() => setIsPresenting(!isPresenting)}
                    active={isPresenting}
                />
                <HeaderButton
                    icon={LogOut}
                    label="Exit Room"
                    onClick={onExit}
                    variant="danger"
                />
            </div>

            {/* Right: Quick Actions & Profile */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all border border-slate-200/50 flex items-center gap-1"
                    >
                        <span className="text-xs font-bold px-1">Quick Actions</span>
                        <MoreHorizontal size={18} />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden"
                                >
                                    <div className="p-2 space-y-1">
                                        <MenuButton icon={UserPlus} label="Invite Teammates" onClick={() => { onInvite(); setIsMenuOpen(false); }} />
                                        <MenuButton icon={Settings} label="Room Settings" onClick={() => { onSettings(); setIsMenuOpen(false); }} />
                                        <MenuButton icon={Zap} label="Toggle AI Panel" onClick={() => { onToggleAIPanel(); setIsMenuOpen(false); }} />
                                        <MenuButton icon={Palette} label="Canvas Background" onClick={() => { onToggleBackgroundSelector(); setIsMenuOpen(false); }} />
                                        <div className="h-px bg-slate-100 my-1 mx-2" />
                                        <MenuButton icon={Info} label="Room Info" onClick={() => setIsMenuOpen(false)} />
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200/60">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-slate-800 tracking-tight">{user?.name}</span>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Administrator</span>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-100 ring-2 ring-white">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

const HeaderButton = ({ icon: Icon, label, onClick, active, variant = "ghost" }) => {
    const baseClasses = "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2";
    const variants = {
        ghost: active
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
            : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm",
        danger: "bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600",
    };

    return (
        <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
            <Icon size={16} />
            <span className="hidden md:inline">{label}</span>
        </button>
    );
};

const MenuButton = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all"
    >
        <Icon size={16} />
        {label}
    </button>
);

export default RoomHeader;
