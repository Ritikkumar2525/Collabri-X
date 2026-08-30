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
                        className="w-96 bg-dark-lighter border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto h-full"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark-lighter/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-accent/10 rounded-xl flex items-center justify-center text-red-accent shadow-sm border border-red-100/50">
                                    <Sparkles size={20} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-200 leading-none mb-1">AI Co-Pilot</h3>
                                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Workspace Assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-dark rounded-xl text-gray-500 hover:text-gray-400 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            {/* Brainstorming Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={16} className="text-gray-500" />
                                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-tight">Brainstorm & Generate</h4>
                                </div>
                                <div className="bg-dark rounded-3xl p-4 border border-white/5 focus-within:ring-4 ring-red-500/10 transition-all">
                                    <textarea
                                        ref={inputRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe a flow or topic..."
                                        className="w-full text-sm font-medium resize-none bg-transparent border-none outline-none h-32 placeholder:text-gray-500 text-gray-300 custom-scrollbar"
                                        disabled={isGenerating}
                                    />
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={(e) => handleGenerate(e, 'diagram')}
                                            disabled={isGenerating || !prompt.trim()}
                                            className="flex-1 bg-red-accent hover:bg-red-800 disabled:bg-red-300 text-white text-[11px] font-bold h-11 rounded-1.5xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-100"
                                        >
                                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                                            Diagram
                                        </button>
                                        <button
                                            onClick={(e) => handleGenerate(e, 'brainstorm')}
                                            disabled={isGenerating || !prompt.trim()}
                                            className="flex-1 bg-dark-lighter hover:bg-dark border border-white/10 text-gray-200 text-[11px] font-bold h-11 rounded-1.5xl flex items-center justify-center gap-2 transition-all shadow-sm"
                                        >
                                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-gray-500" />}
                                            Stickies
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-gray-100" />

                            {/* Intelligent Tools Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={16} className="text-red-500" />
                                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-tight">Board Intelligence</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'summarize', label: 'Summarize Board', desc: 'Distill core ideas from your notes', icon: Layers, action: handleSummarizeBoard, loading: isSummarizing, color: 'red' },
                                        { id: 'tasks', label: 'Extract Action Items', desc: 'Convert thoughts into a task list', icon: SendHorizontal, action: handleGetActionItems, loading: isFetchingActionItems, color: 'red' },
                                        { id: 'feedback', label: 'Get UX Advice', desc: 'Analyze layout and hierarchy', icon: Zap, action: handleGetFeedback, loading: isFetchingFeedback, color: 'gray' }
                                    ].map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={tool.action}
                                            disabled={tool.loading || elements.length === 0}
                                            className="group flex flex-col items-start p-4 bg-dark-lighter border border-white/5 rounded-2.5xl hover:border-red-200 hover:bg-red-accent/10/30 transition-all text-left disabled:opacity-50 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className={`w-8 h-8 rounded-lg bg-${tool.color}-50 text-${tool.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                    {tool.loading ? <Loader2 size={14} className="animate-spin" /> : <tool.icon size={16} />}
                                                </div>
                                                <span className="text-sm font-bold text-gray-200 tracking-tight">{tool.label}</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-gray-500 pl-11 group-hover:text-gray-500 transition-colors">{tool.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Output Area */}
                            {(feedback || summary || actionItems || error) && (
                                <section className="animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-tight">Results</h4>
                                        <button
                                            onClick={() => { setFeedback(''); setSummary(''); setActionItems(''); setError(null); }}
                                            className="text-[10px] font-bold text-red-accent hover:text-red-700 uppercase tracking-widest"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    
                                    {error ? (
                                        <div className="bg-red-950/50 border border-red-500/20 rounded-2xl p-4 text-red-400 text-xs font-medium leading-relaxed">
                                            {error}
                                        </div>
                                    ) : (
                                        <div className="bg-black rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -mr-16 -mt-16" />
                                            <div className="relative z-10">
                                                <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                                                    {feedback ? 'UX Feedback' : summary ? 'Board Summary' : 'Action Items'}
                                                </p>
                                                <div className="text-xs leading-relaxed font-medium opacity-90 whitespace-pre-wrap">
                                                    {feedback || summary || actionItems}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-6 bg-dark border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Model: Gemini 2.0 Flash</span>
                            <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Ready</span>
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
                            className={`h-16 w-16 bg-gradient-to-br from-purple-500 to-red-600 hover:from-purple-600 hover:to-red-700 text-white rounded-3xl shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-2 border-white/20 relative ${showOnboarding ? 'ring-8 ring-red-500/20' : ''}`}
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
