import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, SendHorizontal, X, Zap, Layers } from 'lucide-react';
import api from '../services/api';
import useCanvasStore from '../store/canvasStore';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AIPanel = ({ roomId: propRoomId, yDoc, isLocalUpdate, showOnboarding, isOpen: propIsOpen, setIsOpen: propSetIsOpen }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
    const setIsOpen = propSetIsOpen || setInternalIsOpen;
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState('');
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
    const [actionItems, setActionItems] = useState('');
    const [isFetchingActionItems, setIsFetchingActionItems] = useState(false);
    const inputRef = useRef(null);

    const { roomId: urlRoomId } = useParams();
    const roomId = propRoomId || urlRoomId;
    const { elements, addElements } = useCanvasStore();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleGenerate = async (e, type = 'diagram') => {
        if (e) e.preventDefault();
        if (!prompt.trim() || !yDoc) return;

        setIsGenerating(true);
        setError(null);

        try {
            const startX = window.innerWidth / 2 - 200;
            const startY = window.innerHeight / 2 - 200;

            const endpoint = type === 'brainstorm' ? '/ai/brainstorm' : '/ai/generate-diagram';
            const response = await api.post(endpoint, {
                prompt,
                startX,
                startY
            });

            const newElements = type === 'brainstorm' ? response.data.stickies : response.data.elements;

            if (newElements && Array.isArray(newElements)) {
                const mappedElements = newElements.map(el => ({
                    ...el,
                    id: el.id || crypto.randomUUID()
                }));

                isLocalUpdate.current = true;
                yDoc.transact(() => {
                    const elementsMap = yDoc.getMap('elements');
                    const orderArray = yDoc.getArray('order');
                    mappedElements.forEach(el => {
                        elementsMap.set(el.id, el);
                        orderArray.push([el.id]);
                    });
                });

                addElements(mappedElements);
                isLocalUpdate.current = false;

                setIsOpen(false);
                setPrompt('');
            }
        } catch (err) {
            console.error(`AI ${type} failed:`, err);
            setError(err.response?.data?.message || err.message || `Failed to generate ${type}.`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGetFeedback = async () => {
        if (elements.length === 0) {
            setError("No elements on the canvas to analyze!");
            return;
        }
        setIsFetchingFeedback(true);
        setError(null);
        setFeedback('');

        try {
            const response = await api.post('/ai/feedback', { elements });
            setFeedback(response.data.feedback);
        } catch (err) {
            console.error("AI Feedback failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to get design feedback.");
        } finally {
            setIsFetchingFeedback(false);
        }
    };

    const handleSummarizeBoard = async () => {
        const textElements = elements.filter(el => el.type === 'sticky' || el.type === 'text');
        if (textElements.length === 0) {
            setError("No text or sticky notes to summarize!");
            return;
        }

        setIsSummarizing(true);
        setError(null);
        setSummary('');

        try {
            const texts = textElements.map(el => el.text).filter(t => t);
            const response = await api.post('/ai/summarize', { texts });
            setSummary(response.data.summary);
        } catch (err) {
            console.error("Board summarization failed:", err);
            setError("Failed to generate board summary.");
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleGetActionItems = async () => {
        const textElements = elements.filter(el => el.type === 'sticky' || el.type === 'text');
        if (textElements.length === 0) {
            setError("No content to extract action items from!");
            return;
        }

        setIsFetchingActionItems(true);
        setError(null);
        setActionItems('');

        try {
            const texts = textElements.map(el => el.text).filter(t => t);
            const response = await api.post('/ai/chat', {
                message: "Please extract a list of actionable tasks or action items from the following content, formatted as a bulleted list.",
                context: texts.join('\n')
            });
            setActionItems(response.data.reply);
        } catch (err) {
            console.error("Action items extraction failed:", err);
            setError("Failed to extract action items.");
        } finally {
            setIsFetchingActionItems(false);
        }
    };

    return (
        <div className="fixed top-24 right-0 bottom-0 z-50 flex flex-col pointer-events-none">
            {/* Expanded Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-96 bg-white border-l border-slate-200 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto h-full"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                    <Sparkles size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 leading-none mb-1">AI Co-Pilot</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace Assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            {/* Brainstorming Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={16} className="text-amber-500" />
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Brainstorm & Generate</h4>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 focus-within:ring-4 ring-indigo-500/10 transition-all">
                                    <textarea
                                        ref={inputRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe a flow or topic..."
                                        className="w-full text-sm font-medium resize-none bg-transparent border-none outline-none h-32 placeholder:text-slate-400 text-slate-700 custom-scrollbar"
                                        disabled={isGenerating}
                                    />
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={(e) => handleGenerate(e, 'diagram')}
                                            disabled={isGenerating || !prompt.trim()}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-[11px] font-black h-11 rounded-1.5xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100"
                                        >
                                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                                            Diagram
                                        </button>
                                        <button
                                            onClick={(e) => handleGenerate(e, 'brainstorm')}
                                            disabled={isGenerating || !prompt.trim()}
                                            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-black h-11 rounded-1.5xl flex items-center justify-center gap-2 transition-all shadow-sm"
                                        >
                                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-500" />}
                                            Stickies
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-slate-100" />

                            {/* Intelligent Tools Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={16} className="text-indigo-500" />
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Board Intelligence</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'summarize', label: 'Summarize Board', desc: 'Distill core ideas from your notes', icon: Layers, action: handleSummarizeBoard, loading: isSummarizing, color: 'indigo' },
                                        { id: 'tasks', label: 'Extract Action Items', desc: 'Convert thoughts into a task list', icon: SendHorizontal, action: handleGetActionItems, loading: isFetchingActionItems, color: 'emerald' },
                                        { id: 'feedback', label: 'Get UX Advice', desc: 'Analyze layout and hierarchy', icon: Zap, action: handleGetFeedback, loading: isFetchingFeedback, color: 'amber' }
                                    ].map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={tool.action}
                                            disabled={tool.loading || elements.length === 0}
                                            className="group flex flex-col items-start p-4 bg-white border border-slate-100 rounded-2.5xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left disabled:opacity-50 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className={`w-8 h-8 rounded-lg bg-${tool.color}-50 text-${tool.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                    {tool.loading ? <Loader2 size={14} className="animate-spin" /> : <tool.icon size={16} />}
                                                </div>
                                                <span className="text-sm font-black text-slate-800 tracking-tight">{tool.label}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 pl-11 group-hover:text-slate-500 transition-colors">{tool.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Output Area */}
                            {(feedback || summary || actionItems) && (
                                <section className="animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Results</h4>
                                        <button
                                            onClick={() => { setFeedback(''); setSummary(''); setActionItems(''); }}
                                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16" />
                                        <div className="relative z-10">
                                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">
                                                {feedback ? 'UX Feedback' : summary ? 'Board Summary' : 'Action Items'}
                                            </p>
                                            <div className="text-xs leading-relaxed font-medium opacity-90 whitespace-pre-wrap">
                                                {feedback || summary || actionItems}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model: GPT-4o Mini</span>
                            <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Ready</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button (Hidden when open) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        className="pointer-events-auto mt-auto mb-28 mr-6"
                    >
                        <button
                            onClick={() => setIsOpen(true)}
                            className={`h-16 w-16 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-3xl shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-2 border-white/20 relative ${showOnboarding ? 'ring-8 ring-indigo-500/20' : ''}`}
                        >
                            <Sparkles size={28} className="animate-pulse" />
                            {/* Notification Dot */}
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIPanel;
