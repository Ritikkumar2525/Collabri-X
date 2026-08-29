import Logo from "../components/Logo";
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, Layers, Sparkles, Users, FileImage, LayoutTemplate, History, CheckCircle2, MessageSquare, Video, PenTool, LayoutList, Clock, MonitorPlay, MousePointer2, Pencil, Square, Circle, Type, X, MousePointer, Star, Trash2, Plus } from 'lucide-react';
import { Stage, Layer, Line, Path, Rect, Circle as KonvaCircle, Text, Group } from 'react-konva';

const Home = () => {
    const navigate = useNavigate();

    // Hero Canvas State
    const [heroTool, setHeroTool] = useState('pencil'); // pencil | rect | circle | text
    const [heroElements, setHeroElements] = useState([
        { type: 'pencil', points: [100, 100, 150, 120, 200, 100], color: '#dc2626', strokeWidth: 4 },
        { type: 'rect', x: 700, y: 150, width: 100, height: 100, stroke: '#ef4444', strokeWidth: 4, fill: '#333333', opacity: 0.5 },
        { type: 'circle', x: 150, y: 250, radius: 40, stroke: '#dc2626', strokeWidth: 4, fill: '#444444', opacity: 0.5 }
    ]);
    const isDrawing = useRef(false);

    // Simulated Cursors
    const [cursors, setCursors] = useState([
        { id: 1, x: 200, y: 150, name: 'Alex Chen', color: '#ec4899' },
        { id: 2, x: 600, y: 300, name: 'Sarah (AI)', color: '#dc2626' },
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCursors(prev => prev.map((c, i) => ({
                ...c,
                x: c.x + (Math.random() - 0.5) * (i === 0 ? 40 : 10), // Ghost cursor moves less
                y: c.y + (Math.random() - 0.5) * (i === 0 ? 40 : 10)
            })));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // CTA Sparkles
    const [sparkles, setSparkles] = useState([]);
    const addSparkle = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newSparkle = { id: Date.now(), x, y };
        setSparkles(prev => [...prev, newSparkle]);
        setTimeout(() => {
            setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
        }, 1000);
    };

    const handleHeroMouseDown = (e) => {
        isDrawing.current = true;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();

        const id = Date.now().toString();
        let newElement = {
            id,
            type: heroTool,
            x: pos.x,
            y: pos.y,
            points: [pos.x, pos.y],
            color: '#dc2626',
            stroke: '#dc2626',
            strokeWidth: 4,
            fill: heroTool === 'pencil' ? 'transparent' : 'rgba(99, 102, 241, 0.1)',
            width: 0,
            height: 0,
            radius: 0
        };

        if (heroTool === 'text') {
            newElement.text = "Hello!";
            setHeroElements([...heroElements, newElement]);
            isDrawing.current = false;
        } else {
            setHeroElements([...heroElements, newElement]);
        }
    };

    const handleHeroMouseMove = (e) => {
        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();

        setHeroElements(elements => {
            const last = { ...elements[elements.length - 1] };
            if (last.type === 'pencil') {
                last.points = [...last.points, pos.x, pos.y];
            } else if (last.type === 'rect') {
                last.width = pos.x - last.x;
                last.height = pos.y - last.y;
            } else if (last.type === 'circle') {
                const rx = Math.pow(pos.x - last.x, 2);
                const ry = Math.pow(pos.y - last.y, 2);
                last.radius = Math.sqrt(rx + ry);
            }
            return [...elements.slice(0, -1), last];
        });
    };

    const handleHeroMouseUp = () => {
        isDrawing.current = false;
    };

    const handleGetStarted = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    // AI Section State
    const [aiInput, setAiInput] = useState('');
    const [aiState, setAiState] = useState('idle'); // idle | generating | done

    // Sandbox State [NEW]
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [sandboxElements, setSandboxElements] = useState([]);
    const [sandboxTool, setSandboxTool] = useState('pencil');
    const isSandboxDrawing = useRef(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSandboxMouseDown = (e) => {
        isSandboxDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        const newEl = {
            type: sandboxTool,
            points: [pos.x, pos.y],
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            radius: 0
        };
        setSandboxElements([...sandboxElements, newEl]);
    };

    const handleSandboxMouseMove = (e) => {
        if (!isSandboxDrawing.current) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        let lastElement = sandboxElements[sandboxElements.length - 1];

        if (sandboxTool === 'pencil') {
            lastElement.points = lastElement.points.concat([point.x, point.y]);
        } else if (sandboxTool === 'rect') {
            lastElement.width = point.x - lastElement.x;
            lastElement.height = point.y - lastElement.y;
        } else if (sandboxTool === 'circle') {
            const rx = Math.pow(point.x - lastElement.x, 2);
            const ry = Math.pow(point.y - lastElement.y, 2);
            lastElement.radius = Math.sqrt(rx + ry);
        }

        sandboxElements.splice(sandboxElements.length - 1, 1, lastElement);
        setSandboxElements([...sandboxElements]);
    };

    const handleSandboxMouseUp = () => {
        isSandboxDrawing.current = false;
    };

    const handleAiSubmit = (e) => {
        e.preventDefault();
        if (!aiInput.trim()) return;
        setAiState('generating');
        setTimeout(() => setAiState('done'), 2000);
    };

    const scrollToSection = (e, id) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };


    // Version History State
    const [historySlider, setHistorySlider] = useState(75);
    const mockHistoryStages = [
        [], // 0
        [{ type: 'rect', x: 50, y: 50, fill: '#333333', opacity: 1 }],
        [{ type: 'rect', x: 50, y: 50, fill: '#333333', opacity: 1 }, { type: 'circle', x: 150, y: 120, fill: '#444444', opacity: 1 }],
        [{ type: 'rect', x: 50, y: 50, fill: '#333333', opacity: 1 }, { type: 'circle', x: 150, y: 120, fill: '#444444', opacity: 1 }, { type: 'rect', x: 250, y: 60, fill: '#555555', opacity: 1 }],
        [{ type: 'rect', x: 50, y: 50, fill: '#333333', opacity: 1 }, { type: 'circle', x: 150, y: 120, fill: '#444444', opacity: 1 }, { type: 'rect', x: 250, y: 60, fill: '#555555', opacity: 1 }, { type: 'line', points: [100, 100, 150, 150], stroke: '#94a3b8' }],
        [{ type: 'rect', x: 50, y: 50, fill: '#333333', opacity: 1 }, { type: 'circle', x: 150, y: 120, fill: '#444444', opacity: 1 }, { type: 'rect', x: 250, y: 60, fill: '#555555', opacity: 1 }, { type: 'line', points: [100, 100, 150, 150], stroke: '#94a3b8' }, { type: 'line', points: [200, 150, 250, 110], stroke: '#94a3b8' }],
        [{ type: 'rect', x: 50, y: 50, fill: '#333333', opacity: 1 }, { type: 'circle', x: 150, y: 120, fill: '#444444', opacity: 1 }, { type: 'rect', x: 250, y: 60, fill: '#555555', opacity: 1 }, { type: 'line', points: [100, 100, 150, 150], stroke: '#94a3b8' }, { type: 'line', points: [200, 150, 250, 110], stroke: '#94a3b8' }, { type: 'rect', x: 100, y: 140, fill: '#666666', opacity: 1 }]
    ];
    const currentStageIdx = Math.floor((historySlider / 100) * (mockHistoryStages.length - 1));
    const activeHistoryStage = mockHistoryStages[currentStageIdx];

    // Parallax Scroll Effects
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

    // Navigation State for scroll transparency
    const [isScrolled, setIsScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    return (
        <div className="min-h-screen bg-dark overflow-x-hidden font-sans text-white selection:bg-red-accent/20 selection:text-red-900">
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "bg-dark-lighter/80 backdrop-blur-md border-b border-white/10 py-3 shadow-sm"
                    : "bg-transparent py-6"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <Logo textClassName="text-xl font-medium text-white tracking-tight font-sans" />
                    <nav className="hidden md:flex items-center gap-8">
                        {['Features', 'How it Works', 'Templates', 'Pricing'].map(item => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                                className="text-sm font-semibold text-gray-400 hover:text-red-accent transition-colors relative group"
                                onClick={(e) => scrollToSection(e, item.toLowerCase().replace(/ /g, '-'))}
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-accent transition-all group-hover:w-full" />
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-400 hover:text-red-accent hidden sm:block">Log In</button>
                        <button onClick={handleGetStarted} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-dark-lightest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10 mb-1">
                            Get Started
                        </button>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest text-center">Free • No setup</p>
                    </div>
                </div>
            </header>

            {/* Sub-header Spacer to prevent content jump */}
            <div className={`h-20 ${isScrolled ? 'block' : 'hidden md:block'}`} />

            {/* 1. Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden perspective-[1000px]">
                {/* Parallax Background animations */}
                <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-[blob_7s_infinite]"></div>
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-[blob_7s_infinite_2000ms]"></div>
                    <div className="absolute -bottom-8 left-1/3 w-[600px] h-[600px] bg-pink-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-[blob_7s_infinite_4000ms]"></div>

                    {/* Floating Shapes for depth */}
                    <motion.div
                        animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute top-40 left-20 w-12 h-12 bg-red-600/20 rounded-lg rotate-12 backdrop-blur-sm border border-white/20"
                    />
                    <motion.div
                        animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-40 right-20 w-16 h-16 bg-purple-500/20 rounded-full backdrop-blur-sm border border-white/20"
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 left-10 w-8 h-8 border-2 border-pink-500/20 rounded-sm"
                    />
                </motion.div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-5xl md:text-7xl font-light tracking-wide text-white mb-6 leading-tight">
                                Your team’s ideas, meetings, and work — <br className="hidden md:block" />
                                <span className="text-red-light font-serif italic">in one persistent space.</span>
                            </h1>
                            <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                                Whiteboards, video, AI, and real-time collaboration that never resets.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
                                <div className="flex flex-col items-center">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => { addSparkle(e); handleGetStarted(); }}
                                        className="group relative overflow-hidden inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-red-accent rounded-full hover:bg-red-800 transition-colors shadow-xl shadow-red-500/30 mb-2"
                                    >
                                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -trangray-x-[100%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                        <span className="relative flex items-center">
                                            Start Whiteboarding
                                            <ArrowRight className="ml-2 w-4 h-4 group-hover:trangray-x-1 transition-transform" />
                                        </span>
                                        {sparkles.map(s => (
                                            <motion.span
                                                key={s.id}
                                                initial={{ opacity: 1, scale: 0 }}
                                                animate={{ opacity: 0, scale: 2, x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }}
                                                className="absolute w-2 h-2 bg-yellow-300 rounded-full pointer-events-none"
                                                style={{ left: s.x, top: s.y }}
                                            />
                                        ))}
                                    </motion.button>
                                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">Free • No setup</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05, backgroundColor: "#f8fafc" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { addSparkle(e); scrollToSection(e, 'how-it-works'); }}
                                    className="relative inline-flex items-center justify-center px-8 py-4 text-base font-medium text-gray-300 bg-dark-lighter border border-white/10 rounded-full transition-colors shadow-sm hover:shadow-md overflow-hidden"
                                >
                                    <Play className="mr-2 w-4 h-4 fill-current text-red-accent" />
                                    Watch Demo
                                    {sparkles.map(s => (
                                        <motion.span
                                            key={s.id}
                                            initial={{ opacity: 1, scale: 0 }}
                                            animate={{ opacity: 0, scale: 2, x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }}
                                            className="absolute w-2 h-2 bg-red-500 rounded-full pointer-events-none"
                                            style={{ left: s.x, top: s.y }}
                                        />
                                    ))}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Interactive Canvas Demo Mockup Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="mt-16 md:mt-24 relative max-w-5xl mx-auto h-[400px] md:h-[500px]"
                    >
                        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-red-500/10 border border-white/10 bg-dark-lighter w-full h-full relative group cursor-crosshair">
                            {/* Hero Toolbar */}
                            <div className="absolute top-4 left-1/2 -trangray-x-1/2 bg-dark-lighter rounded-full shadow-lg border border-white/5 flex items-center p-2 gap-2 z-10">
                                {[
                                    { id: 'pencil', icon: Pencil, tooltip: 'Draw' },
                                    { id: 'rect', icon: Square, tooltip: 'Shape' },
                                    { id: 'circle', icon: Circle, tooltip: 'Shape' },
                                    { id: 'text', icon: Type, tooltip: 'Add text' }
                                ].map((item, i) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setHeroTool(item.id)}
                                        title={item.tooltip}
                                        className={`p-2 rounded-full ${heroTool === item.id ? 'bg-red-accent/10 text-red-accent' : 'text-gray-500 hover:bg-dark hover:text-gray-400'} transition-colors cursor-pointer`}
                                    >
                                        <item.icon size={18} />
                                    </div>
                                ))}
                            </div>

                            {/* Actual Interactive Konva Stage */}
                            <Stage
                                width={1000} // Approximate max width
                                height={500}
                                onMouseDown={handleHeroMouseDown}
                                onTouchStart={handleHeroMouseDown}
                                onMouseMove={handleHeroMouseMove}
                                onTouchMove={handleHeroMouseMove}
                                onMouseUp={handleHeroMouseUp}
                                onTouchEnd={handleHeroMouseUp}
                                className="w-full h-full"
                            >
                                <Layer>
                                    {heroElements.map((el, i) => {
                                        if (el.type === 'pencil') return (
                                            <Line
                                                key={i}
                                                points={el.points}
                                                stroke={el.color || el.stroke}
                                                strokeWidth={el.strokeWidth}
                                                tension={0.5}
                                                lineCap="round"
                                                lineJoin="round"
                                            />
                                        );
                                        if (el.type === 'rect') return (
                                            <Rect
                                                key={i}
                                                x={el.x}
                                                y={el.y}
                                                width={el.width}
                                                height={el.height}
                                                stroke={el.stroke}
                                                strokeWidth={el.strokeWidth}
                                                fill={el.fill}
                                                opacity={el.opacity || 1}
                                                cornerRadius={8}
                                            />
                                        );
                                        if (el.type === 'circle') return (
                                            <KonvaCircle
                                                key={i}
                                                x={el.x}
                                                y={el.y}
                                                radius={el.radius}
                                                stroke={el.stroke}
                                                strokeWidth={el.strokeWidth}
                                                fill={el.fill}
                                                opacity={el.opacity || 1}
                                            />
                                        );
                                        if (el.type === 'text') return (
                                            <Text
                                                key={i}
                                                x={el.x}
                                                y={el.y}
                                                text={el.text}
                                                fontSize={20}
                                                fill={el.stroke}
                                            />
                                        );
                                        return null;
                                    })}

                                    {/* Simulated Cursors in Konva (Hidden to avoid duplication) */}
                                </Layer>
                            </Stage>

                            {/* Floating "Try drawing" chip */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute bottom-8 left-1/2 -trangray-x-1/2 bg-black text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg pointer-events-none z-30"
                            >
                                ✨ Try drawing on the canvas!
                            </motion.div>

                            {/* AI Tooltip Bubble */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
                                transition={{ delay: 1, duration: 4, repeat: Infinity }}
                                className="absolute top-1/4 right-1/4 bg-dark-lighter text-red-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-xl border border-red-100 flex items-center gap-1.5 pointer-events-none z-30"
                            >
                                <Sparkles className="w-3 h-3 text-red-500" />
                                Smart Draw in action
                            </motion.div>

                            {/* Animated Demo Strokes Overlay */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 500">
                                <motion.path
                                    d="M 100 100 Q 200 150 250 250 T 400 200"
                                    fill="transparent"
                                    stroke="#ec4899"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
                                />
                                <motion.path
                                    d="M 120 120 Q 220 170 270 270 T 420 220"
                                    fill="transparent"
                                    stroke="#8b5cf6"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.5 }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 8, ease: "easeInOut", delay: 0.2 }}
                                />
                            </svg>

                            {/* Fake Remote Cursors (using HTML for easier animation) */}
                            {cursors.map((cursor, i) => (
                                <motion.div
                                    key={cursor.id}
                                    animate={{ x: cursor.x, y: cursor.y }}
                                    transition={{ type: "spring", damping: 30, stiffness: 200 }}
                                    className="absolute top-0 left-0 z-20 pointer-events-none"
                                >
                                    <div className={`flex flex-col ${i === 1 ? 'opacity-20 trangray-x-1 trangray-y-1' : ''}`}>
                                        <div style={{ color: cursor.color }} className="w-4 h-4 drop-shadow-sm">
                                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.64,21.97C13.31,22.1 12.91,21.96 12.75,21.64L9.96,15.11L4.66,18.06C4.33,18.24 3.91,18.15 3.69,17.86C3.59,17.7 3.55,17.5 3.56,17.31L4.69,3.31C4.72,2.95 5.03,2.69 5.39,2.72C5.55,2.73 5.71,2.81 5.82,2.94L18.4,14.62C18.67,14.86 18.69,15.27 18.45,15.54C18.33,15.67 18.15,15.75 17.96,15.75L12.55,15.53L15.42,21.97C15.58,22.3 15.44,22.69 15.11,22.86L13.64,21.97Z" /></svg>
                                        </div>
                                        {i === 0 && (
                                            <span style={{ backgroundColor: cursor.color }} className="text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap ml-3 mt-1 font-medium">
                                                {cursor.name}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. Features Section */}
            <section id="features" className="py-32 bg-dark-lighter relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">The journey to better ideas</h2>
                        <p className="text-lg text-gray-400">Explore how your team can go from blank canvas to brilliant execution.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: Plus, title: "1. Create a Room", desc: "Start a shared workspace in seconds with zero friction.", color: "text-red-accent", bg: "bg-red-accent/10", preview: "🚀 Launching Room..." },
                            { icon: Users, title: "2. Collaborate in Real Time", desc: "Draw, move, and edit together on a shared infinite canvas.", color: "text-blue-600", bg: "bg-blue-50", preview: "👥 Everyone's here..." },
                            { icon: MonitorPlay, title: "3. Talk & Share Screen", desc: "Unified huddles so you can walk through ideas together.", color: "text-purple-600", bg: "bg-purple-50", preview: "🎥 Live Huddle..." },
                            { icon: Sparkles, title: "4. Use AI to Summarize", desc: "Turn messy brainstorms into clear action items instantly.", color: "text-red-600", bg: "bg-red-50", preview: "✨ AI Processing..." },
                            { icon: History, title: "5. Return Anytime", desc: "Everything auto-saves (Yjs) so your work is always there.", color: "text-pink-600", bg: "bg-pink-50", preview: "⌛ Never resets..." },
                            { icon: LayoutTemplate, title: "Ready Made Flow", desc: "Kickstart sessions with pre-built whiteboarding templates.", color: "text-orange-600", bg: "bg-orange-50", preview: "📋 50+ Templates..." }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="relative p-8 rounded-2xl bg-dark-lighter border border-white/5 shadow-sm hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
                            >
                                {/* Background glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Live Tooltip Preview */}
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        whileHover={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute top-4 right-4 bg-black/90 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none flex items-center gap-1.5"
                                    >
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        {feature.preview}
                                    </motion.div>
                                </AnimatePresence>

                                <div className={`w-12 h-12 rounded-xl border border-white/50 shadow-sm ${feature.bg} flex items-center justify-center mb-6 overflow-hidden relative`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                                    <feature.icon className={`w-6 h-6 ${feature.color} relative z-10 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300`} />
                                </div>
                                <h3 className="relative z-10 text-xl font-medium text-white mb-3 group-hover:text-red-accent transition-colors">{feature.title}</h3>
                                <p className="relative z-10 text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{feature.desc}</p>

                                {/* Bottom Accent Line */}
                                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section >

            {/* 3. How It Works */}
            <section id="how-it-works" className="py-32 bg-dark border-t border-white/10/50 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">How it works</h2>
                        <p className="text-lg text-gray-400">From idea to execution in four simple steps.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                        {/* Step 1 */}
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="relative group">
                            <div className="h-32 bg-dark-lighter rounded-xl border border-white/10 shadow-sm mb-6 flex items-center justify-center overflow-hidden relative">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-12 h-12 bg-red-accent/20 border-2 border-red-400 rounded-lg flex items-center justify-center text-red-accent shadow-inner"
                                >
                                    <Layers size={24} />
                                </motion.div>
                                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-5xl font-medium text-white group-hover:text-red-100 transition-colors mb-4 tracking-tighter">01</div>
                            <h3 className="text-xl font-medium text-white mb-2">Create</h3>
                            <p className="text-gray-400">Sign up and instantly spin up a new infinitely scalable whiteboard.</p>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="relative group">
                            <div className="h-32 bg-dark-lighter rounded-xl border border-white/10 shadow-sm mb-6 relative overflow-hidden flex items-center justify-center">
                                <motion.div animate={{ x: [-20, 20, -20], y: [-20, 20, -20] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute left-1/4 w-4 h-4 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50" />
                                <motion.div animate={{ x: [20, -20, 20], y: [20, -20, 20] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute right-1/4 w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
                                <Users className="text-gray-400 w-12 h-12 opacity-50" />
                            </div>
                            <div className="text-5xl font-medium text-white group-hover:text-pink-100 transition-colors mb-4 tracking-tighter">02</div>
                            <h3 className="text-xl font-medium text-white mb-2">Invite</h3>
                            <p className="text-gray-400">Share your room ID. Team members jump in with zero friction.</p>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="relative group">
                            <div className="h-32 bg-dark-lighter rounded-xl border border-white/10 shadow-sm mb-6 flex items-center justify-center relative overflow-hidden">
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 12 }}
                                    className="w-16 h-16 bg-yellow-100 border border-yellow-300 shadow-sm transform rotate-3 flex items-center justify-center"
                                >
                                    <Sparkles className="w-8 h-8 text-yellow-600" />
                                </motion.div>
                                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute text-purple-600 top-4 right-8">
                                    <Sparkles className="w-4 h-4" />
                                </motion.div>
                            </div>
                            <div className="text-5xl font-medium text-white group-hover:text-yellow-100 transition-colors mb-4 tracking-tighter">03</div>
                            <h3 className="text-xl font-medium text-white mb-2">Collaborate</h3>
                            <p className="text-gray-400">Draw, share screens, and use AI features simultaneously.</p>
                        </motion.div>

                        {/* Step 4 */}
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="relative group">
                            <div className="h-32 bg-dark-lighter rounded-xl border border-white/10 shadow-sm mb-6 flex items-center justify-center relative overflow-hidden">
                                <div className="w-24 h-14 border-2 border-white/20 rounded-lg relative overflow-hidden bg-dark shadow-inner">
                                    <motion.div
                                        animate={{ x: [-50, 60] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute top-0 bottom-0 w-1.5 bg-red-600 shadow-[0_0_12px_rgba(99,102,241,1)]"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FileImage className="text-gray-400 w-8 h-8" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-5xl font-medium text-white group-hover:text-red-100 transition-colors mb-4 tracking-tighter">04</div>
                            <h3 className="text-xl font-medium text-white mb-2">Export</h3>
                            <p className="text-gray-400">Scrub through the history and export designs to PNG or PDF.</p>
                        </motion.div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="mt-16 h-1 w-full bg-gray-200 rounded-full overflow-hidden relative">
                        <motion.div
                            className="absolute top-0 bottom-0 left-0 bg-red-accent"
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                    </div>
                </div>
            </section>

            {/* 4. Templates & Productivity */}
            <section id="templates" className="py-32 bg-dark-lighter relative overflow-hidden">
                {/* Background Shapes for flair */}
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute top-20 right-0 w-64 h-64 bg-dark rounded-full blur-3xl opacity-50"
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">Start faster with Templates</h2>
                            <p className="text-lg text-gray-400">Don't stare at a blank canvas. Pre-built templates for every workflow.</p>
                        </div>
                        <button className="text-red-accent font-medium flex items-center hover:text-red-800 transition-colors group">
                            View all templates <ArrowRight className="ml-2 w-4 h-4 group-hover:trangray-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Agile Kanban", desc: "Organize sprints and track progress with your team.", color: "bg-orange-100 border-orange-200 text-orange-700", mockElements: [{ type: 'rect', x: 50, y: 50, fill: '#444444' }, { type: 'rect', x: 200, y: 50, fill: '#555555' }, { type: 'rect', x: 350, y: 50, fill: '#333333' }] },
                            { title: "User Journey", desc: "Map out customer experiences step by step.", color: "bg-blue-100 border-blue-200 text-blue-700", mockElements: [{ type: 'circle', x: 100, y: 150, fill: '#93c5fd' }, { type: 'circle', x: 250, y: 150, fill: '#93c5fd' }, { type: 'circle', x: 400, y: 150, fill: '#93c5fd' }, { type: 'line', points: [120, 150, 230, 150], stroke: '#ef4444' }, { type: 'line', points: [270, 150, 380, 150], stroke: '#ef4444' }] },
                            { title: "Wireframing", desc: "Quickly ideate interfaces with raw shapes.", color: "bg-gray-100 border-white/10 text-gray-300", mockElements: [{ type: 'rect', x: 100, y: 30, w: 300, h: 200, fill: 'transparent', stroke: '#94a3b8' }, { type: 'rect', x: 120, y: 50, w: 260, h: 40, fill: '#cbd5e1' }, { type: 'rect', x: 120, y: 100, w: 80, h: 80, fill: '#cbd5e1' }, { type: 'rect', x: 220, y: 100, w: 160, h: 10, fill: '#e2e8f0' }] }
                        ].map((template, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.05, y: -5 }}
                                drag
                                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                                dragElastic={0.1}
                                className="group cursor-grab active:cursor-grabbing relative"
                                onClick={() => setSelectedTemplate(template)}
                            >
                                <div className={`aspect-video rounded-2xl ${template.color} border-2 flex items-center justify-center mb-4 overflow-hidden relative shadow-sm group-hover:shadow-2xl transition-all duration-500`}>
                                    <LayoutTemplate className="w-12 h-12 opacity-50 group-hover:opacity-0 transition-opacity duration-300 absolute" />

                                    {/* Hover Reveal Mini Canvas */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-dark-lighter/60 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="relative w-[85%] h-[85%] scale-75 group-hover:scale-110 transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) origin-center">
                                            {template.mockElements.map((el, i) => {
                                                if (el.type === 'line') return null;
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        whileInView={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="absolute shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-black/5"
                                                        style={{
                                                            left: `${(el.x / 500) * 100}%`,
                                                            top: `${(el.y / 300) * 100}%`,
                                                            width: el.w ? `${(el.w / 500) * 100}%` : el.type === 'circle' ? '20%' : '15%',
                                                            height: el.h ? `${(el.h / 300) * 100}%` : el.type === 'circle' ? '30%' : '20%',
                                                            backgroundColor: el.fill === 'transparent' ? 'white' : el.fill,
                                                            borderRadius: el.type === 'circle' ? '50%' : '6px'
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Label */}
                                    <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 trangray-y-4 group-hover:trangray-y-0 transition-all duration-300 z-20">
                                        <span className="bg-black text-white text-[10px] font-medium px-3 py-1 rounded-full shadow-lg">Click to Preview</span>
                                    </div>
                                </div>
                                <h4 className="text-lg font-medium text-white mb-1 flex items-center justify-between">
                                    {template.title}
                                    <Sparkles size={14} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </h4>
                                <p className="text-sm text-gray-400">{template.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section >

            {/* Template Modal */}
            < AnimatePresence >
                {selectedTemplate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedTemplate(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-dark-lighter rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl border border-white/10 z-10"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark">
                                <div>
                                    <h3 className="text-xl font-medium text-white">{selectedTemplate.title} Preview</h3>
                                    <p className="text-sm text-gray-500">{selectedTemplate.desc}</p>
                                </div>
                                <button onClick={() => setSelectedTemplate(null)} className="p-2 text-gray-500 hover:text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="bg-gray-100 relative h-[450px] flex items-center justify-center border-b border-white/10">
                                {/* Interactive Sandbox Canvas */}
                                <div className="absolute top-4 right-4 z-20 flex gap-2">
                                    <div className="bg-dark-lighter p-2 rounded-xl shadow-lg border border-white/10 flex gap-1">
                                        {[
                                            { id: 'pencil', icon: Pencil },
                                            { id: 'rect', icon: Square },
                                            { id: 'circle', icon: Circle }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSandboxTool(t.id)}
                                                className={`p-2 rounded-lg transition-all ${sandboxTool === t.id ? 'bg-red-accent text-white' : 'text-gray-500 hover:bg-dark'}`}
                                            >
                                                <t.icon size={16} />
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setSandboxElements([])} className="bg-dark-lighter p-2 rounded-xl shadow-lg border border-white/10 text-gray-500 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <Stage
                                    width={windowWidth > 768 ? 800 : 350}
                                    height={400}
                                    className="w-full h-full cursor-crosshair"
                                    onMouseDown={handleSandboxMouseDown}
                                    onMouseMove={handleSandboxMouseMove}
                                    onMouseUp={handleSandboxMouseUp}
                                >
                                    <Layer>
                                        {/* Template Background Elements */}
                                        {selectedTemplate.mockElements.map((el, i) => {
                                            if (el.type === 'rect') return <Rect key={`tmpl-${i}`} x={el.x} y={el.y} width={el.w || 100} height={el.h || 100} fill={el.fill} opacity={0.3} stroke="#cbd5e1" strokeWidth={1} cornerRadius={4} />;
                                            if (el.type === 'circle') return <KonvaCircle key={`tmpl-${i}`} x={el.x} y={el.y} radius={30} fill={el.fill} opacity={0.3} stroke="#cbd5e1" strokeWidth={1} />;
                                            if (el.type === 'line') return <Line key={`tmpl-${i}`} points={el.points} stroke="#cbd5e1" opacity={0.3} strokeWidth={2} />;
                                            return null;
                                        })}

                                        {/* User Sandbox Elements */}
                                        {sandboxElements.map((el, i) => {
                                            if (el.type === 'pencil') return <Line key={i} points={el.points} stroke="#dc2626" strokeWidth={4} tension={0.5} lineCap="round" lineJoin="round" />;
                                            if (el.type === 'rect') return <Rect key={i} x={el.x} y={el.y} width={el.width} height={el.height} stroke="#dc2626" strokeWidth={2} cornerRadius={4} />;
                                            if (el.type === 'circle') return <KonvaCircle key={i} x={el.x} y={el.y} radius={el.radius} stroke="#dc2626" strokeWidth={2} />;
                                            return null;
                                        })}
                                    </Layer>
                                </Stage>

                                <div className="absolute bottom-4 left-4 z-20 bg-red-accent text-white px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest shadow-lg shadow-red-600/20">
                                    Interactive Sandbox Mode
                                </div>
                            </div>
                            <div className="p-6 bg-dark-lighter flex justify-end">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-6 py-3 bg-red-accent text-white font-medium rounded-xl hover:bg-red-800 transition-colors shadow-lg shadow-red-500/30 flex items-center gap-2"
                                >
                                    Use Template <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* 5. AI Features Highlight */}
            < section id="ai" className="py-24 bg-gradient-to-br from-black via-dark-lightest to-dark text-white overflow-hidden relative" >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNHYtNGgtMnY0aC00djJoNHY0aDJ2LTRoNHYtMmgtNHptMC0zMFYwaC0ydjRoLTR2Mmg0djRoMnYtNGg0VjRoLTR6bS0yMCAxMnYtNGgtMnY0aC00djJoNHY0aDJ2LTRoNHYtMmgtNHptMCAzMHYtNGgtMnY0aC00djJoNHY0aDJ2LTRoNHYtMmgtNHoiIGZpbGw9IiNmZmZiIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-50"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/20 text-red-200 text-sm font-medium mb-6 border border-red-400/30">
                                <Sparkles className="w-4 h-4" />
                                <span>Powered by Gemini AI</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-medium mb-6">Your Always-On AI Co-Pilot</h2>
                            <p className="text-xl text-red-100 mb-8 leading-relaxed">
                                <span>Our platform uses AI to turn your raw ideas into structured diagrams, summarize messy sticky notes, and critique UX designs in real-time.</span>

                            </p>
                            <ul className="space-y-4">
                                {[
                                    { title: "Smart Draw", desc: "Generate complex flowcharts from a simple text prompt.", color: "pink" },
                                    { title: "UX Advice", desc: "Get immediate feedback on layout and usability.", color: "purple" },
                                    { title: "Summarize", desc: "Condense hundreds of sticky notes into one clean summary.", color: "red" }
                                ].map((feature, idx) => (
                                    <motion.li
                                        key={idx}
                                        className="flex items-start p-4 rounded-xl border border-transparent transition-colors cursor-default relative overflow-hidden group"
                                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)", scale: 1.02, borderColor: "rgba(255, 255, 255, 0.1)" }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -trangray-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                        <CheckCircle2 className={`w-6 h-6 text-${feature.color}-400 mr-3 shrink-0 mt-0.5 group-hover:scale-110 transition-transform`} />
                                        <div className="relative z-10">
                                            <h4 className="font-medium text-lg text-white group-hover:text-red-200 transition-colors">{feature.title}</h4>
                                            <p className="text-red-200/80 group-hover:text-red-100 transition-colors">{feature.desc}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <motion.div
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="bg-dark-lightest/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden"
                            >
                                {/* Animated background glow for AI section */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-3xl rounded-full" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full" />

                                <div className="space-y-4 relative z-10">
                                    <form onSubmit={handleAiSubmit} className="flex gap-2 items-center">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={aiInput}
                                                onChange={(e) => setAiInput(e.target.value)}
                                                placeholder="Ask AI to draw a flowchart..."
                                                disabled={aiState !== 'idle'}
                                                className="w-full bg-dark-lighter/50 border border-white/20 rounded-xl py-3 px-4 text-sm text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-all focus:bg-dark-lighter"
                                            />
                                            {aiState === 'idle' && !aiInput && (
                                                <motion.div
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute right-3 top-3 text-red-400"
                                                >
                                                    <Sparkles size={16} />
                                                </motion.div>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!aiInput.trim() || aiState !== 'idle'}
                                            className="px-4 py-3 bg-red-accent text-white rounded-xl text-sm font-medium hover:bg-red-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-red-600/20"
                                        >
                                            Generate
                                        </button>
                                    </form>

                                    {aiState === 'generating' && (
                                        <div className="flex flex-col gap-4 mt-4 h-48 justify-center items-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="text-red-400"
                                            >
                                                <Sparkles size={48} />
                                            </motion.div>
                                            <p className="text-red-200 text-sm animate-pulse">Consulting the Co-Pilot...</p>

                                            {/* Flying Sticky Notes Simulation */}
                                            {[1, 2, 3].map(i => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -100, y: 50, rotate: -20 }}
                                                    animate={{ opacity: [0, 1, 0], x: 200, y: -50, rotate: 20 }}
                                                    transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                                                    className="absolute w-12 h-12 bg-yellow-200/20 border border-yellow-200/40 rounded shadow-lg"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {aiState === 'done' && (
                                        <div className="flex gap-4 items-end justify-end mt-4">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-red-accent/30 border border-red-500/30 p-4 rounded-lg rounded-br-none max-w-full shadow-lg shadow-red-900/20 w-full"
                                            >
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Sparkles className="w-4 h-4 text-red-300" />
                                                    <span className="text-xs font-medium text-red-200 uppercase tracking-wider">AI Generated Result</span>
                                                </div>
                                                <div className="flex flex-col items-center space-y-2 py-6 bg-black/60 rounded-xl border border-red-500/20 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent opacity-50" />

                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-24 h-10 flex items-center justify-center bg-dark-lightest rounded border border-white/20 text-[10px] font-mono text-gray-400 z-10">User Login</motion.div>
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 20 }} transition={{ delay: 0.3 }} className="w-0.5 bg-red-600/50" />
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="w-10 h-10 flex rotate-45 items-center justify-center bg-red-accent rounded border border-red-400 text-[8px] font-mono text-white z-10 shadow-lg shadow-red-500/20"><span className="-rotate-45">Auth?</span></motion.div>

                                                    <div className="flex gap-12 mt-2">
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex flex-col items-center">
                                                            <div className="w-0.5 h-10 bg-green-500/50 -rotate-45 origin-top" />
                                                            <div className="w-16 h-8 flex items-center justify-center bg-green-900/40 rounded border border-green-500/50 text-[8px] font-mono text-green-200">Dashboard</div>
                                                        </motion.div>
                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex flex-col items-center">
                                                            <div className="w-0.5 h-10 bg-red-500/50 rotate-45 origin-top" />
                                                            <div className="w-16 h-8 flex items-center justify-center bg-red-900/40 rounded border border-red-500/50 text-[8px] font-mono text-red-200">Error</div>
                                                        </motion.div>
                                                    </div>
                                                </div>
                                                <button onClick={() => { setAiState('idle'); setAiInput(''); }} className="mt-4 w-full text-center py-2 px-4 rounded-lg bg-red-600/10 border border-red-500/20 text-xs text-red-200 hover:bg-red-600/20 transition-colors">
                                                    Reset Sandbox
                                                </button>
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Collaboration & Media */}
            < section className="py-24 bg-dark-lighter overflow-hidden" >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">Built for Distributed Teams</h2>
                        <p className="text-lg text-gray-400">See exactly what your team is looking at, directly on the canvas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="relative aspect-square md:aspect-auto md:h-[400px] bg-dark rounded-3xl border border-white/10 overflow-hidden shadow-inner flex flex-col justify-center items-center p-8">
                            {/* Improved Grid Background */}
                            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

                            {/* Multiple Fake Remote Cursors for Demo */}
                            {[
                                { name: "Sarah (Presenting)", color: "#dc2626", delay: 0, x: [-50, 50, 100, -50], y: [-50, -20, 50, -50] },
                                { name: "Mike T.", color: "#10b981", delay: 1, x: [100, -20, -80, 100], y: [80, 120, 10, 80] },
                                { name: "Elena R.", color: "#f43f5e", delay: 2, x: [0, 80, -40, 0], y: [-60, 40, 80, -60] }
                            ].map((c, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ x: c.x, y: c.y }}
                                    transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut", delay: c.delay }}
                                    className="absolute pointer-events-none z-20"
                                >
                                    <div className="flex flex-col">
                                        <div style={{ color: c.color }} className="w-5 h-5 drop-shadow-md">
                                            <MousePointer size={20} fill="currentColor" />
                                        </div>
                                        <span style={{ backgroundColor: c.color }} className="text-white text-[11px] px-2 py-0.5 rounded shadow-md whitespace-nowrap ml-3 mt-1 font-semibold">
                                            {c.name}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Animated WebRTC PiP Mockup */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                className="absolute bottom-8 right-8 w-64 aspect-video bg-black rounded-xl shadow-2xl border-4 border-white/5 overflow-hidden flex flex-col group z-10"
                            >
                                <div className="flex-1 w-full bg-dark-lightest relative overflow-hidden">
                                    <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-700 to-red-500">
                                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop')] bg-cover opacity-30" />
                                    </motion.div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-dark-lighter/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                                            <Video className="text-white w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                                <div className="h-10 bg-black w-full flex items-center justify-between px-3 text-[10px] text-gray-500 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                        />
                                        <span className="font-medium uppercase tracking-wider text-gray-300">Main Canvas Share</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>12 active</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-medium flex items-center gap-3 mb-2"><MonitorPlay className="text-red-accent" /> Follow Presenter Mode</h3>
                                <p className="text-gray-400">Lock everyone's viewport to the presenter so no one gets lost during a walkthrough.</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-medium flex items-center gap-3 mb-2"><MousePointer2 className="text-pink-600" /> Live Cursors</h3>
                                <p className="text-gray-400">See real-time cursors with names flying across the board to understand exactly where attention is focused.</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-medium flex items-center gap-3 mb-2"><Video className="text-blue-600" /> WebRTC Screen Sharing</h3>
                                <p className="text-gray-400">Instantly share your screen directly over the canvas via a Picture-in-Picture window.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* 7. Version History & Export */}
            < section className="py-24 bg-black text-white" >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <History className="w-12 h-12 text-red-400 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-medium mb-6">Never lose your work</h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
                        Every stroke is saved to the cloud. Scrub back through the timeline to restore previous versions, or export exactly what you need as PNG, SVG, or high-res PDF.
                    </p>
                    <div className="max-w-xl mx-auto bg-dark-lightest p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-purple-500 opacity-50" />

                        <div className="w-full h-56 bg-dark-lighter rounded-2xl mb-8 overflow-hidden relative flex justify-center items-center shadow-inner">
                            {/* Konva Version Demo Stage */}
                            <Stage width={450} height={220} className="w-full h-full cursor-not-allowed">
                                <Layer>
                                    {activeHistoryStage.map((el, i) => {
                                        if (el.type === 'rect') return (
                                            <Rect
                                                key={i}
                                                x={el.x}
                                                y={el.y}
                                                width={60}
                                                height={60}
                                                fill={el.fill}
                                                stroke="#1e293b"
                                                strokeWidth={2}
                                                cornerRadius={8}
                                                shadowBlur={5}
                                                shadowOpacity={0.1}
                                            />
                                        );
                                        if (el.type === 'circle') return (
                                            <KonvaCircle
                                                key={i}
                                                x={el.x}
                                                y={el.y}
                                                radius={35}
                                                fill={el.fill}
                                                stroke="#1e293b"
                                                strokeWidth={2}
                                                shadowBlur={5}
                                                shadowOpacity={0.1}
                                            />
                                        );
                                        if (el.type === 'line') return (
                                            <Line
                                                key={i}
                                                points={el.points}
                                                stroke="#64748b"
                                                strokeWidth={4}
                                                lineCap="round"
                                                lineJoin="round"
                                            />
                                        );
                                        return null;
                                    })}
                                </Layer>
                            </Stage>

                            {/* Version Label Overlay */}
                            <div className="absolute top-4 right-4 bg-black/10 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-900/5 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                                Snapshot v{currentStageIdx + 1}.0
                            </div>
                        </div>

                        <div className="flex justify-between text-[10px] text-red-300 mb-4 font-medium uppercase tracking-widest">
                            <span>Initial Session</span>
                            <span>Current Canvas</span>
                        </div>

                        <div className="relative flex items-center h-6">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={historySlider}
                                onChange={(e) => setHistorySlider(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-dark-lighter rounded-lg appearance-none cursor-pointer accent-red-400 hover:accent-red-300 transition-colors z-10"
                            />
                            <motion.div
                                style={{ width: `${historySlider}%` }}
                                className="absolute top-1/2 -trangray-y-1/2 left-0 h-1.5 bg-gradient-to-r from-red-500 to-red-400 rounded-l-lg pointer-events-none"
                            />
                        </div>

                        <div className="mt-6 flex justify-center">
                            <div className="px-4 py-2 bg-dark-lighter/50 rounded-xl border border-white/20 flex items-center gap-3 text-sm text-gray-400 group-hover:bg-dark-lighter transition-colors">
                                <History size={16} className="text-red-400 group-hover:rotate-180 transition-transform duration-700" />
                                <span>Restoring to {historySlider}% mark</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* 6. Testimonials */}
            <section className="py-24 bg-dark relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">Loved by creative teams</h2>
                        <p className="text-lg text-gray-400">Join thousands of designers, engineers, and product managers.</p>
                    </div>

                    <div className="relative">
                        {/* Auto-scrolling carousel container */}
                        <div className="flex gap-6 overflow-hidden py-10">
                            <motion.div
                                animate={{ x: [0, -1000] }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                className="flex gap-6 shrink-0"
                            >
                                {[
                                    { name: "Alex Rivera", role: "Product Designer @ Linear", text: "The AI Co-Pilot is a game changer. I just describe the flow and it builds the bones for me instantly.", avatar: "AR" },
                                    { name: "Sarah Chen", role: "Engineering Lead @ Vercel", text: "The infinite canvas is actually infinite. No lag even with hundreds of complex wireframes.", avatar: "SC" },
                                    { name: "Marcus Thorne", role: "Creative Director", text: "Finally a tool that feels as fast as my thoughts. The WebRTC integration is seamless.", avatar: "MT" },
                                    { name: "Jenny Wu", role: "UX Researcher", text: "Exporting to high-res PDF has saved our client presentation workflow. Highly recommended.", avatar: "JW" },
                                    // Duplicate for infinite loop effect
                                    { name: "Alex Rivera", role: "Product Designer @ Linear", text: "The AI Co-Pilot is a game changer. I just describe the flow and it builds the bones for me instantly.", avatar: "AR" },
                                    { name: "Sarah Chen", role: "Engineering Lead @ Vercel", text: "The infinite canvas is actually infinite. No lag even with hundreds of complex wireframes.", avatar: "SC" },
                                    { name: "Marcus Thorne", role: "Creative Director", text: "Finally a tool that feels as fast as my thoughts. The WebRTC integration is seamless.", avatar: "MT" },
                                    { name: "Jenny Wu", role: "UX Researcher", text: "Exporting to high-res PDF has saved our client presentation workflow. Highly recommended.", avatar: "JW" }
                                ].map((t, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.05, y: -10, rotateZ: 2 }}
                                        className="w-[350px] bg-dark-lighter p-8 rounded-3xl border border-white/10 shadow-xl shadow-black/50/50 flex flex-col justify-between group transition-all"
                                    >
                                        <div>
                                            <div className="flex gap-1 mb-6 text-yellow-400">
                                                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                            </div>
                                            <p className="text-gray-300 italic text-lg leading-relaxed mb-8">"{t.text}"</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    backgroundColor: ["#dc2626", "#8b5cf6", "#dc2626"]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium shadow-lg"
                                            >
                                                {t.avatar}
                                            </motion.div>
                                            <div>
                                                <h4 className="font-medium text-white">{t.name}</h4>
                                                <p className="text-xs text-gray-500 font-medium">{t.role}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Gradient fades for carousel */}
                        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-dark to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-dark to-transparent z-10 pointer-events-none" />
                    </div>
                </div>

                {/* Floating Micro-avatars in background */}
                {[1, 2, 3, 4].map(i => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [-20, 20, -20],
                            x: [-10, 10, -10],
                            rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                            duration: 4 + i,
                            repeat: Infinity,
                            delay: i * 0.5
                        }}
                        className="absolute opacity-5 pointer-events-none"
                        style={{
                            top: `${15 + i * 20}%`,
                            left: `${5 + i * 25}%`,
                        }}
                    >
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-2xl font-medium">
                            ?
                        </div>
                    </motion.div>
                ))}
            </section>

            <footer className="bg-black py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="md:col-span-2">
                            <div className="flex flex-col gap-6">
                                <Logo textClassName="text-xl font-medium text-white font-sans" />
                                <p className="text-gray-500 text-sm leading-relaxed max-w-xs font-medium">
                                    The persistent digital workspace for modern teams. Collaborate, innovate, and execute.
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-2">
                                    Built for real-time teams.
                                </p>
                                <div className="flex gap-4">
                                    {['Twitter', 'GitHub', 'LinkedIn'].map(social => (
                                        <motion.div
                                            key={social}
                                            whileHover={{ y: -4, scale: 1.1 }}
                                            className="w-10 h-10 bg-dark-lightest rounded-xl flex items-center justify-center text-gray-500 hover:bg-red-accent hover:text-white transition-colors cursor-pointer border border-white/10 hover:border-red-500"
                                        >
                                            <Sparkles size={18} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-medium mb-6 text-sm uppercase tracking-widest">Product</h4>
                            <ul className="space-y-4 text-gray-500 text-sm font-medium">
                                {[
                                    { name: 'Features', id: 'features' },
                                    { name: 'Templates', id: 'templates' },
                                    { name: 'AI Co-Pilot', id: 'ai' },
                                    { name: 'How it Works', id: 'how-it-works' }
                                ].map(item => (
                                    <li key={item.name} onClick={(e) => scrollToSection(e, item.id)} className="hover:text-red-400 transition-colors cursor-pointer">{item.name}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-medium mb-6 text-sm uppercase tracking-widest">Resources</h4>
                            <ul className="space-y-4 text-gray-500 text-sm font-medium">
                                {[
                                    { name: 'Documentation', id: 'how-it-works' },
                                    { name: 'Community', id: 'features' },
                                    { name: 'Case Studies', id: 'templates' },
                                    { name: 'Pricing', id: 'ai' }
                                ].map(item => (
                                    <li key={item.name} onClick={(e) => scrollToSection(e, item.id)} className="hover:text-red-400 transition-colors cursor-pointer">{item.name}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-gray-500 text-sm font-medium">© 2026 Collabrix Inc. All rights reserved.</p>
                        <div className="flex gap-8 text-gray-500 text-sm font-medium">
                            <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>
                            <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div >
    );
};

export default Home;
