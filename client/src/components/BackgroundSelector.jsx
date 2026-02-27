import React, { useState, useRef } from 'react';
import {
    Grid, Square, LayoutGrid, Image as ImageIcon,
    Upload, X, Layers, Hash, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCanvasStore from '../store/canvasStore';

const BackgroundSelector = ({ isOpen, onClose }) => {
    const { canvasBackground, setCanvasBackground } = useCanvasStore();
    const fileInputRef = useRef(null);

    const patterns = [
        { id: 'grid', label: 'Grid', icon: Grid },
        { id: 'dots', label: 'Dots', icon: Square },
        { id: 'lined', label: 'Lined', icon: LayoutGrid },
        { id: 'none', label: 'None', icon: Square },
    ];

    const colors = [
        { id: '#ffffff', label: 'White' },
        { id: '#f8fafc', label: 'Slate' },
        { id: '#fdfbf7', label: 'Cream' },
        { id: '#1e293b', label: 'Dark' },
    ];

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCanvasBackground({
                    type: 'image',
                    value: event.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-6 top-20 z-[150] w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Palette size={18} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Background</h3>
                </div>
                <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Type Selection */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Type</label>
                    <div className="grid grid-cols-4 gap-2">
                        {patterns.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setCanvasBackground({ type: p.id === 'none' ? 'solid' : 'pattern', value: p.id })}
                                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${(canvasBackground.type === 'pattern' && canvasBackground.value === p.id) || (canvasBackground.type === 'solid' && p.id === 'none')
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                <p.icon size={16} />
                                <span className="text-[9px] font-bold">{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Base Color Selection */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Base Color</label>
                    <div className="flex items-center gap-2">
                        {colors.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setCanvasBackground({ color: c.id })}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${canvasBackground.color === c.id ? 'border-indigo-600 scale-110 shadow-md' : 'border-white'
                                    }`}
                                style={{ backgroundColor: c.id }}
                                title={c.label}
                            />
                        ))}
                        <div className="w-px h-6 bg-slate-100 mx-1" />
                        <label className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-white overflow-hidden">
                            <Hash size={12} className="text-slate-400" />
                            <input
                                type="color"
                                value={canvasBackground.color}
                                onChange={(e) => setCanvasBackground({ color: e.target.value })}
                                className="absolute opacity-0 cursor-pointer"
                            />
                        </label>
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Custom Image</label>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all ${canvasBackground.type === 'image'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                    >
                        {canvasBackground.type === 'image' ? <ImageIcon size={18} /> : <Upload size={18} />}
                        <span className="text-xs font-bold">{canvasBackground.type === 'image' ? 'Change Image' : 'Upload Image'}</span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </button>
                    {canvasBackground.type === 'image' && (
                        <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
                                    <img src={canvasBackground.value} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">Custom Wallpaper</span>
                            </div>
                            <button
                                onClick={() => setCanvasBackground({ type: 'pattern', value: 'grid' })}
                                className="text-[10px] font-bold text-red-500 hover:underline"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Opacity Control */}
                <div>
                    <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Opacity</span>
                        <span className="text-indigo-600">{Math.round(canvasBackground.opacity * 100)}%</span>
                    </div>
                    <div className="px-1">
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={canvasBackground.opacity}
                            onChange={(e) => setCanvasBackground({ opacity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-400 italic">
                <Layers size={14} />
                <span className="text-[10px] font-medium leading-tight">Settings are saved automatically for this workspace.</span>
            </div>
        </motion.div>
    );
};

export default BackgroundSelector;
