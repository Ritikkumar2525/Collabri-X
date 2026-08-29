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
        { id: '#0a0a14', label: 'White' },
        { id: '#1a1a2e', label: 'Slate' },
        { id: '#2a0a0a', label: 'Cream' },
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
            className="fixed right-6 top-20 z-[150] w-72 bg-dark-lighter/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-accent/10 text-red-accent rounded-lg">
                        <Palette size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-200 tracking-tight uppercase">Background</h3>
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-all">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Type Selection */}
                <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3 block">Type</label>
                    <div className="grid grid-cols-4 gap-2">
                        {patterns.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setCanvasBackground({ type: p.id === 'none' ? 'solid' : 'pattern', value: p.id })}
                                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${(canvasBackground.type === 'pattern' && canvasBackground.value === p.id) || (canvasBackground.type === 'solid' && p.id === 'none')
                                    ? 'bg-red-accent text-white border-red-600 shadow-lg shadow-red-200'
                                    : 'bg-dark text-gray-500 border-white/5 hover:bg-dark-lighter hover:shadow-sm'
                                    }`}
                            >
                                <p.icon size={16} />
                                <span className="text-[9px] font-medium">{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Base Color Selection */}
                <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3 block">Base Color</label>
                    <div className="flex items-center gap-2">
                        {colors.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setCanvasBackground({ color: c.id })}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${canvasBackground.color === c.id ? 'border-red-600 scale-110 shadow-md' : 'border-white'
                                    }`}
                                style={{ backgroundColor: c.id }}
                                title={c.label}
                            />
                        ))}
                        <div className="w-px h-6 bg-gray-100 mx-1" />
                        <label className="w-8 h-8 rounded-full bg-dark border border-white/10 flex items-center justify-center cursor-pointer hover:bg-dark-lighter overflow-hidden">
                            <Hash size={12} className="text-gray-500" />
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
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3 block">Custom Image</label>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all ${canvasBackground.type === 'image'
                            ? 'bg-red-accent/10 border-red-200 text-red-accent'
                            : 'bg-dark border-white/10 text-gray-500 hover:bg-dark-lighter hover:border-red-200 hover:text-red-accent'
                            }`}
                    >
                        {canvasBackground.type === 'image' ? <ImageIcon size={18} /> : <Upload size={18} />}
                        <span className="text-xs font-medium">{canvasBackground.type === 'image' ? 'Change Image' : 'Upload Image'}</span>
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
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                    <img src={canvasBackground.value} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[10px] font-medium text-gray-500 truncate max-w-[120px]">Custom Wallpaper</span>
                            </div>
                            <button
                                onClick={() => setCanvasBackground({ type: 'pattern', value: 'grid' })}
                                className="text-[10px] font-medium text-red-500 hover:underline"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Opacity Control */}
                <div>
                    <div className="flex items-center justify-between mb-3 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                        <span>Opacity</span>
                        <span className="text-red-accent">{Math.round(canvasBackground.opacity * 100)}%</span>
                    </div>
                    <div className="px-1">
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={canvasBackground.opacity}
                            onChange={(e) => setCanvasBackground({ opacity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-gray-500 italic">
                <Layers size={14} />
                <span className="text-[10px] font-medium leading-tight">Settings are saved automatically for this workspace.</span>
            </div>
        </motion.div>
    );
};

export default BackgroundSelector;
