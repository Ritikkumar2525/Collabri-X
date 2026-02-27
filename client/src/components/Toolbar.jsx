import {
    Pencil, Pen, Highlighter, Eraser, Square, Circle,
    MousePointer2, Type, StickyNote, Undo, Redo,
    Triangle, Star, Minus, LayoutTemplate,
    ChevronRight, ChevronLeft, ImagePlus,
    MonitorUp, MonitorX, Trash2, GripVertical,
    BringToFront, SendToBack, Layers
} from 'lucide-react';
import useCanvasStore from '../store/canvasStore';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import TemplatesModal from './TemplatesModal';
import { motion, AnimatePresence } from 'framer-motion';

const Toolbar = ({ socket, roomId: propRoomId, yDoc, isLocalUpdate, deleteElement, activeUsers = [] }) => {
    const {
        tool, setTool, color, setColor, strokeWidth, setStrokeWidth,
        undo, redo, elements, selectedId, updateElement, addElement,
        stickyShape, setStickyShape, stickyFont, setStickyFont,
        bringForward, sendToBack
    } = useCanvasStore();

    const { roomId: urlRoomId } = useParams();
    const roomId = propRoomId || urlRoomId;
    const [isUploading, setIsUploading] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isColorPanelOpen, setIsColorPanelOpen] = useState(false);
    const fileInputRef = useRef(null);
    const toolbarRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
                setIsColorPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMediaUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !yDoc) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('media', file);

        try {
            const response = await api.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const fileUrl = response.data.url;
            const isPdf = file.type === 'application/pdf';
            const id = crypto.randomUUID();

            const newElement = {
                id,
                type: isPdf ? 'pdf' : 'image',
                x: (window.innerWidth / 2) - 100,
                y: (window.innerHeight / 2) - 100,
                width: isPdf ? 400 : 200,
                height: isPdf ? 200 : 200,
                url: fileUrl,
                ...(isPdf ? { page: 1, totalPages: 1 } : {}),
                isFinished: true
            };

            isLocalUpdate.current = true;
            yDoc.transact(() => {
                const elementsMap = yDoc.getMap('elements');
                const orderArray = yDoc.getArray('order');
                elementsMap.set(id, newElement);
                orderArray.push([id]);
            });
            addElement(newElement);
            isLocalUpdate.current = false;
            setTool('selection');

        } catch (error) {
            console.error('Failed to upload media:', error);
            alert('Failed to upload media.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = null;
        }
    };

    const handleBringForward = () => {
        if (!selectedId || !yDoc) return;
        isLocalUpdate.current = true;
        yDoc.transact(() => {
            const orderArray = yDoc.getArray('order');
            const index = orderArray.toArray().indexOf(selectedId);
            if (index !== -1 && index < orderArray.length - 1) {
                orderArray.delete(index, 1);
                orderArray.insert(index + 1, [selectedId]);
            }
        });
        bringForward(selectedId);
        isLocalUpdate.current = false;
    };

    const handleSendToBack = () => {
        if (!selectedId || !yDoc) return;
        isLocalUpdate.current = true;
        yDoc.transact(() => {
            const orderArray = yDoc.getArray('order');
            const index = orderArray.toArray().indexOf(selectedId);
            if (index > 0) {
                orderArray.delete(index, 1);
                orderArray.insert(0, [selectedId]);
            }
        });
        sendToBack(selectedId);
        isLocalUpdate.current = false;
    };

    const selectedElement = selectedId ? elements.find(e => e.id === selectedId) : null;

    const tools = [
        { id: 'selection', icon: MousePointer2, label: 'Select (V)' },
        { id: 'pencil', icon: Pencil, label: 'Pencil (P)' },
        { id: 'pen', icon: Pen, label: 'Pen (B)' },
        { id: 'highlighter', icon: Highlighter, label: 'Highlighter (H)' },
        { id: 'sticky', icon: StickyNote, label: 'Sticky Note (N)' },
        { id: 'text', icon: Type, label: 'Text (T)' },
        { id: 'rectangle', icon: Square, label: 'Rectangle (R)' },
        { id: 'circle', icon: Circle, label: 'Circle (O)' },
        { id: 'triangle', icon: Triangle, label: 'Triangle' },
        { id: 'star', icon: Star, label: 'Star' },
        { id: 'eraser', icon: Eraser, label: 'Eraser (E)' },
    ];

    const colors = [
        '#ffffff', '#000000', '#e11d48', '#2563eb', '#16a34a', '#eab308', '#9333ea',
    ];

    const handleColorChange = (c) => {
        setColor(c);
        if (selectedId && yDoc) {
            isLocalUpdate.current = true;
            updateElement(selectedId, { color: c });
            const elementsMap = yDoc.getMap('elements');
            const el = elementsMap.get(selectedId);
            if (el) elementsMap.set(selectedId, { ...el, color: c });
            isLocalUpdate.current = false;
        }
    };

    const handleStrokeChange = (w) => {
        setStrokeWidth(w);
        if (selectedId && yDoc) {
            isLocalUpdate.current = true;
            updateElement(selectedId, { strokeWidth: w });
            const elementsMap = yDoc.getMap('elements');
            const el = elementsMap.get(selectedId);
            if (el) elementsMap.set(selectedId, { ...el, strokeWidth: w });
            isLocalUpdate.current = false;
        }
    };


    const handleStickyFontChange = (font) => {
        setStickyFont(font);
        if (selectedId && yDoc) {
            isLocalUpdate.current = true;
            updateElement(selectedId, { stickyFont: font });
            const elementsMap = yDoc.getMap('elements');
            const el = elementsMap.get(selectedId);
            if (el) elementsMap.set(selectedId, { ...el, stickyFont: font });
            isLocalUpdate.current = false;
        }
    };

    return (
        <>
            <TemplatesModal
                isOpen={isTemplatesOpen}
                onClose={() => setIsTemplatesOpen(false)}
                socket={socket}
                roomId={roomId}
                yDoc={yDoc}
                isLocalUpdate={isLocalUpdate}
            />

            <motion.div
                ref={toolbarRef}
                initial={false}
                animate={{ width: isCollapsed ? 64 : 116 }}
                className="absolute left-4 top-20 bottom-4 z-[90] flex flex-col bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-3 gap-3 pointer-events-auto"
            >
                {/* Active Users Avatars */}
                {activeUsers.length > 0 && (
                    <div className={`flex items-center justify-center gap-1 ${isCollapsed ? 'flex-col' : 'flex-row flex-wrap'}`}>
                        {activeUsers.slice(0, 3).map((u) => (
                            <div key={u.userId} className="relative group/user cursor-pointer transition-transform hover:scale-110">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm ring-1 ring-black/5"
                                    style={{ backgroundColor: u.color || '#6366f1' }}
                                >
                                    {u.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="absolute top-0 right-[-2px] w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/user:opacity-100 pointer-events-none transition-all scale-90 group-hover/user:scale-100 whitespace-nowrap z-[200] shadow-xl">
                                    {u.name || 'Anonymous'}
                                </div>
                            </div>
                        ))}
                        {activeUsers.length > 3 && (
                            <div className="relative group/extra cursor-pointer transition-transform hover:scale-110">
                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border-2 border-white shadow-sm ring-1 ring-black/5">
                                    +{activeUsers.length - 3}
                                </div>
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/extra:opacity-100 pointer-events-none transition-all scale-90 group-hover/extra:scale-100 whitespace-nowrap z-[200] shadow-xl">
                                    {activeUsers.slice(3).map(u => u.name).join(', ')}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeUsers.length > 0 && <div className="w-full h-px bg-slate-100" />}
                {/* Collapse Toggle */}
                <div className="flex items-center justify-between px-2">
                    {!isCollapsed && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tools</span>}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all ml-auto"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <div className="w-full h-px bg-slate-100" />

                {/* Primary Tools */}
                <div className={`grid gap-1 w-full overflow-y-auto custom-scrollbar flex-1 pr-1 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-2 content-start'}`}>
                    {tools.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                if (tool === t.id && ['pencil', 'pen', 'highlighter', 'rectangle', 'circle', 'triangle', 'star', 'text', 'sticky'].includes(t.id)) {
                                    setIsColorPanelOpen(prev => !prev);
                                } else {
                                    setTool(t.id);
                                    if (['pencil', 'pen', 'highlighter', 'rectangle', 'circle', 'triangle', 'star', 'text', 'sticky'].includes(t.id)) {
                                        setIsColorPanelOpen(true);
                                    } else {
                                        setIsColorPanelOpen(false);
                                    }
                                }
                            }}
                            className={`p-3 rounded-2xl transition-all relative flex items-center justify-center group gap-3 shrink-0 ${tool === t.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
                                }`}
                        >
                            <t.icon size={20} strokeWidth={tool === t.id ? 2.5 : 2} className="shrink-0" />

                            {/* Hover Tooltip (Always shown on hover since there are no labels) */}
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap z-[200] shadow-xl">
                                {t.label}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="w-full h-px bg-slate-100" />

                {/* Secondary Actions */}
                <div className="flex flex-col gap-1 w-full">
                    <div className={`grid gap-1 mb-1 border-b border-slate-100 pb-2 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <button
                            onClick={undo}
                            className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all flex items-center justify-center group relative"
                        >
                            <Undo size={18} />
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap z-[200] shadow-xl">Undo (Ctrl+Z)</div>
                        </button>
                        <button
                            onClick={redo}
                            className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all flex items-center justify-center group relative"
                        >
                            <Redo size={18} />
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap z-[200] shadow-xl">Redo (Ctrl+Y)</div>
                        </button>
                    </div>

                    <div className={`grid gap-1 ${isCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <button
                            onClick={() => setIsTemplatesOpen(true)}
                            className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all flex items-center justify-center relative group"
                        >
                            <LayoutTemplate size={20} className="shrink-0" />
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap z-[200] shadow-xl">
                                Templates
                            </div>
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center relative group"
                        >
                            <ImagePlus size={20} className={`shrink-0 ${isUploading ? "animate-pulse" : ""}`} />
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 whitespace-nowrap z-[200] shadow-xl">
                                {isUploading ? 'Uploading...' : 'Images/PDF'}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleMediaUpload}
                                accept="image/*,application/pdf"
                                className="hidden"
                            />
                        </button>
                    </div>

                    {selectedId && (
                        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-3 gap-1">
                                <button onClick={handleBringForward} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center" title="Bring Forward">
                                    <BringToFront size={18} />
                                </button>
                                <button onClick={handleSendToBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center" title="Send to Back">
                                    <SendToBack size={18} />
                                </button>
                                <button onClick={() => deleteElement(selectedId)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center" title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Context Panel (Dropdown Behavior) */}
                <AnimatePresence>
                    {(isColorPanelOpen || selectedId) && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="absolute left-[calc(100%+12px)] top-0 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-4 w-56 flex flex-col gap-4 z-[200]"
                        >
                            {/* Color Picker */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Color</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {colors.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                handleColorChange(c);
                                                if (!selectedId) setIsColorPanelOpen(false); // Auto-close on color pick if not editing an existing item
                                            }}
                                            className={`w-9 h-9 rounded-full border-2 transition-all ${color === c ? 'border-indigo-600 scale-110 shadow-lg' : 'border-white hover:scale-105'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Stroke Width / Font Size */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                                    {tool === 'text' ? 'Font Size' : 'Stroke Weight'}
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={tool === 'highlighter' ? '20' : '1'}
                                        max={tool === 'highlighter' ? '100' : '50'}
                                        value={strokeWidth}
                                        onChange={(e) => handleStrokeChange(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 w-6">{strokeWidth}</span>
                                </div>
                            </div>

                            {/* Sticky/Text Options */}
                            {(tool === 'sticky' || tool === 'text' || (selectedElement?.type === 'sticky')) && (
                                <div className="space-y-4 pt-2 border-t border-slate-50">
                                    {(tool === 'sticky' || selectedElement?.type === 'sticky') && (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Sticky Shape</label>
                                            <div className="flex gap-2">
                                                {['square', 'rectangle', 'circle'].map(shape => (
                                                    <button
                                                        key={shape}
                                                        onClick={() => setStickyShape(shape)}
                                                        className={`flex-1 py-2 flex items-center justify-center rounded-xl transition-all border ${stickyShape === shape ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 hover:bg-slate-50 text-slate-400'}`}
                                                    >
                                                        {shape === 'square' && <Square size={16} />}
                                                        {shape === 'rectangle' && <div className="w-5 h-3.5 border-2 border-current rounded-sm" />}
                                                        {shape === 'circle' && <Circle size={16} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Font Family</label>
                                        <select
                                            value={stickyFont}
                                            onChange={(e) => handleStickyFontChange(e.target.value)}
                                            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none hover:bg-white transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="sans-serif">Sans-serif</option>
                                            <option value="serif">Serif</option>
                                            <option value="monospace">Monospace</option>
                                            <option value="'Comic Sans MS', cursive">Handwritten</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};

export default Toolbar;
