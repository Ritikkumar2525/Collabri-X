import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Transformer, RegularPolygon, Star, Group, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Layers, MonitorPlay, Video, MessageSquare, Plus, Share2, FileImage, LogOut, ChevronRight, Mic, MicOff, Camera, CameraOff, PhoneOff, Sparkles, Pencil, Zap, MousePointer2, Copy, Move } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import useCanvasStore from '../store/canvasStore';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useDraw } from '../hooks/useDraw';
import Toolbar from '../components/Toolbar';
import Chat from '../components/Chat';
import Cursors from '../components/Cursors';
import AIPanel from '../components/AIPanel';
import RoomHeader from '../components/RoomHeader';
import BackgroundSelector from '../components/BackgroundSelector';
import VideoPlayer from '../components/VideoPlayer';

const SOCKET_URL = 'http://localhost:5001';

// Custom Konva Image Component to load URLs
const URLImage = ({ imageProps, isSelected, onSelect, onTransformEnd, remoteGlowProps }) => {
    const [img] = useImage(imageProps.url, 'anonymous');
    return (
        <KonvaImage
            image={img}
            x={imageProps.x}
            y={imageProps.y}
            width={imageProps.width}
            height={imageProps.height}
            scaleX={imageProps.scaleX || 1}
            scaleY={imageProps.scaleY || 1}
            rotation={imageProps.rotation || 0}
            draggable={imageProps.draggable}
            onPointerDown={onSelect}
            onDragEnd={onTransformEnd}
            onTransformEnd={onTransformEnd}
            id={imageProps.id}
            {...remoteGlowProps}
        />
    );
};

// Configure PDF.js worker using CDN to avoid Vite bundling complexities
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// Custom Konva Component for PDFs
const URLPdf = ({ pdfProps, isSelected, onSelect, onTransformEnd, remoteGlowProps, updateElement }) => {
    const [imageObj, setImageObj] = useState(null);

    useEffect(() => {
        let isSubscribed = true;
        const loadPdf = async () => {
            if (!pdfProps.url) return;
            try {
                const loadingTask = pdfjsLib.getDocument(pdfProps.url);
                const pdf = await loadingTask.promise;

                // Update total pages in state if not known
                if (pdfProps.totalPages !== pdf.numPages && updateElement) {
                    updateElement(pdfProps.id, { totalPages: pdf.numPages });
                }

                // Get requested page (1-indexed)
                const pageNumber = Math.min(Math.max(1, pdfProps.page || 1), pdf.numPages);
                const page = await pdf.getPage(pageNumber);

                // Render to canvas
                const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for higher resolution
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;

                if (isSubscribed) {
                    setImageObj(canvas);
                }
            } catch (err) {
                console.error('Failed to render PDF page:', err);
            }
        };

        loadPdf();
        return () => { isSubscribed = false; };
    }, [pdfProps.url, pdfProps.page]);

    return (
        <KonvaImage
            image={imageObj}
            x={pdfProps.x}
            y={pdfProps.y}
            width={pdfProps.width}
            height={pdfProps.height}
            scaleX={pdfProps.scaleX || 1}
            scaleY={pdfProps.scaleY || 1}
            rotation={pdfProps.rotation || 0}
            draggable={pdfProps.draggable}
            onPointerDown={onSelect}
            onDragEnd={onTransformEnd}
            onTransformEnd={onTransformEnd}
            id={pdfProps.id}
            {...remoteGlowProps}
        />
    );
};

const CURSOR_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4',
    '#f97316', '#14b8a6', '#f43f5e', '#84cc16'
];

const getCursorColor = (id) => {
    let hash = 0;
    if (id) {
        for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

const OnboardingTooltip = ({ text, position = 'top' }) => {
    const posClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-4',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-4',
        left: 'right-full top-1/2 -translate-y-1/2 mr-4',
        right: 'left-full top-1/2 -translate-y-1/2 ml-4',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute z-[250] ${posClasses[position]} px-4 py-2 bg-indigo-600 shadow-2xl rounded-xl border border-indigo-400 pointer-events-none whitespace-nowrap flex items-center gap-2`}
        >
            <Sparkles size={12} className="text-indigo-200 animate-pulse" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">{text}</span>
            <div className={`absolute w-3 h-3 bg-indigo-600 rotate-45 ${position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' :
                    position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' :
                        'left-[-6px] top-1/2 -translate-y-1/2'
                }`} />
        </motion.div>
    );
};

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuthStore();
    const { elements, setElements, tool, setTool, updateElement, addElement, selectedId, setSelectedId, isPresenting, setIsPresenting, setUndoManager, undo, redo, canvasBackground, setCanvasBackground } = useCanvasStore();

    // Multi-user Selection State Tracking
    const [remoteSelections, setRemoteSelections] = useState({});
    const [activeUsers, setActiveUsers] = useState([]);

    // WebRTC Screen Sharing & Video Call State
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { [userId]: stream }
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const peersRef = useRef({});

    // Selection and transform
    const trRef = useRef(null);
    const stageRef = useRef(null);

    // Canvas panning and zooming
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);

    // Canvas dimensions bounding
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const [socket, setSocket] = useState(null);
    const [yDoc, setYDoc] = useState(null);
    const [provider, setProvider] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);
    const [error, setError] = useState(null);
    const isLocalUpdate = useRef(false);

    // Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0); // 0: Welcome, 1: Highlights, 2: Finished

    // UI States
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isBgSelectorOpen, setIsBgSelectorOpen] = useState(false);
    const [userCount, setUserCount] = useState(1);
    const [draggingId, setDraggingId] = useState(null);
    const [editingText, setEditingText] = useState(null); // { id, x, y, width, height, text }

    useEffect(() => {
        if (!provider) return;
        const updateCount = () => {
            setUserCount(provider.awareness.getStates().size);
        };
        provider.awareness.on('change', updateCount);
        updateCount();
        return () => provider.awareness.off('change', updateCount);
    }, [provider]);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('antigravity_onboarding_seen');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

    const completeOnboarding = () => {
        setShowOnboarding(false);
        setOnboardingStep(2);
        localStorage.setItem('antigravity_onboarding_seen', 'true');
    };

    // Auto-dismiss onboarding highlights on interaction
    useEffect(() => {
        if (showOnboarding && onboardingStep === 1) {
            // Check if user starts drawing or adds elements
            if (elements.length > (roomInfo?.canvasState?.length || 0) || tool !== 'selection') {
                completeOnboarding();
            }
        }
    }, [elements.length, tool, showOnboarding, onboardingStep, roomInfo]);


    // Socket Connection Lifecycle (Socket.io)
    useEffect(() => {
        if (!token) return navigate('/login');

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            query: { roomId }
        });

        newSocket.on('connect', () => {
            newSocket.emit('join-room', { roomId, user });
            setSocket(newSocket);
        });

        // Cleanup when users leave
        newSocket.on('user-disconnected', (userId) => {
            if (peersRef.current[userId]) {
                peersRef.current[userId].close();
                delete peersRef.current[userId];
            }
            setRemoteStreams(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });
        });

        // --- WebRTC Signaling Listeners ---
        const handleReceiveOffer = async ({ offer, callerId }) => {
            const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            peersRef.current[callerId] = peer;

            peer.ontrack = (event) => {
                setRemoteStreams(prev => ({ ...prev, [callerId]: event.streams[0] }));
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    newSocket.emit('webrtc-ice-candidate', { targetUserId: callerId, candidate: event.candidate, senderId: newSocket.id });
                }
            };
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            newSocket.emit('webrtc-answer', { targetUserId: callerId, answer, responderId: newSocket.id });
        };

        const handleReceiveAnswer = async ({ answer, responderId }) => {
            const peer = peersRef.current[responderId];
            if (peer) await peer.setRemoteDescription(new RTCSessionDescription(answer));
        };

        const handleReceiveIceCandidate = async ({ candidate, senderId }) => {
            const peer = peersRef.current[senderId];
            if (peer) await peer.addIceCandidate(new RTCIceCandidate(candidate));
        };

        newSocket.on('webrtc-offer', handleReceiveOffer);
        newSocket.on('webrtc-answer', handleReceiveAnswer);
        newSocket.on('webrtc-ice-candidate', handleReceiveIceCandidate);
        newSocket.on('stop-screen-share', () => setRemoteStreams({}));

        return () => newSocket.disconnect();
    }, [roomId, token, user, navigate]);

    // Fetch Room Metadata
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const { data } = await api.get(`/rooms/${roomId}`);
                setRoomInfo(data);
            } catch (err) {
                console.error('Failed to load room:', err);
                setError('Room not found or unauthorized.');
            }
        };
        if (roomId) fetchRoom();
    }, [roomId]);

    // Yjs Connection Lifecycle
    useEffect(() => {
        if (!roomId || !roomInfo) return;

        const doc = new Y.Doc();
        const wsProvider = new WebsocketProvider(
            `ws://${window.location.hostname}:5001/yjs`,
            roomId,
            doc
        );

        const elementsMap = doc.getMap('elements');
        const orderArray = doc.getArray('order');
        const undoManager = new Y.UndoManager([elementsMap, orderArray]);

        // Awareness for presence
        const awareness = wsProvider.awareness;
        const localUser = {
            name: user?.name || 'Anonymous',
            color: getCursorColor(user?._id || user?.userId || socket?.id || 'me'),
            userId: user?._id || user?.userId || 'anonymous'
        };
        awareness.setLocalStateField('user', localUser);

        // Integrate with store
        setUndoManager(undoManager);

        // Sync Yjs to Store
        const syncStore = () => {
            if (isLocalUpdate.current) return;
            const order = orderArray.toArray();
            const elementsList = order
                .map(id => elementsMap.get(id))
                .filter(el => el !== undefined);
            setElements(elementsList);
        };

        elementsMap.observe(() => syncStore());
        orderArray.observe(() => syncStore());

        // Populate Yjs from DB if Doc is empty (on provider sync)
        wsProvider.on('sync', (isSynced) => {
            if (isSynced && elementsMap.size === 0 && roomInfo.canvasState?.length > 0) {
                isLocalUpdate.current = true;
                doc.transact(() => {
                    roomInfo.canvasState.forEach(el => {
                        elementsMap.set(el.id, el);
                        orderArray.push([el.id]);
                    });
                });
                syncStore();
                isLocalUpdate.current = false;
            } else if (isSynced) {
                syncStore();
            }
        });

        // Listen for awareness changes (Presence & Selections)
        const handleAwarenessChange = () => {
            const states = awareness.getStates();
            const selections = {};
            const cursors = {};
            const usersMap = new Map();

            states.forEach((state, clientID) => {
                if (state.user && state.user.userId) {
                    usersMap.set(state.user.userId, state.user);
                }

                if (clientID === doc.clientID) return;
                if (state.user) {
                    if (state.selectedId) {
                        selections[state.user.userId] = {
                            selectedId: state.selectedId,
                            user: state.user
                        };
                    }
                    if (state.cursor) {
                        cursors[state.user.userId] = {
                            ...state.cursor,
                            user: state.user
                        };
                    }
                }
            });

            setRemoteSelections(selections);
            setActiveUsers(Array.from(usersMap.values()));
            // We'll pass awareness to Cursors.jsx instead of using local state if possible, 
            // but for now let's bridge it to keep backwards compatibility if needed.
        };

        awareness.on('change', handleAwarenessChange);

        setYDoc(doc);
        setProvider(wsProvider);

        return () => {
            setUndoManager(null);
            wsProvider.destroy();
            doc.destroy();
        };
    }, [roomId, roomInfo, setElements]);

    // Handle new users joining while sharing screen
    useEffect(() => {
        if (!socket || !localStream) return;
        const handleUserJoined = async (joinedUser) => {
            if (!joinedUser.userId || peersRef.current[joinedUser.userId]) return;
            const targetId = joinedUser.userId;

            const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            peersRef.current[targetId] = peer;

            localStream.getTracks().forEach(track => {
                peer.addTrack(track, localStream);
            });

            peer.ontrack = (event) => {
                setRemoteStreams(prev => ({ ...prev, [targetId]: event.streams[0] }));
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) socket.emit('webrtc-ice-candidate', { targetUserId: targetId, candidate: event.candidate, senderId: socket.id });
            };

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit('webrtc-offer', { targetUserId: targetId, offer, callerId: socket.id });
        };

        socket.on('user-joined', handleUserJoined);
        return () => socket.off('user-joined', handleUserJoined);
    }, [socket, localStream]);

    // Sync selection to Awareness
    useEffect(() => {
        if (provider?.awareness) {
            provider.awareness.setLocalStateField('selectedId', selectedId);
        }
    }, [selectedId, provider]);

    // Broadcast our viewport if presenting
    useEffect(() => {
        if (socket && isPresenting) {
            socket.emit('viewport-sync', { roomId, stagePos, stageScale, presenterId: socket.id });
        }
    }, [stagePos, stageScale, isPresenting, socket, roomId]);

    // Listen to presenter viewport if NOT presenting
    useEffect(() => {
        if (!socket) return;

        const handleViewportSync = ({ stagePos: newPos, stageScale: newScale }) => {
            if (!isPresenting) {
                setStagePos(newPos);
                setStageScale(newScale);
            }
        };

        socket.on('viewport-sync', handleViewportSync);
        return () => socket.off('viewport-sync', handleViewportSync);
    }, [socket, isPresenting]);

    // Sync selection to Awareness (Already handled in another useEffect)

    // Attach Transformer to selected node
    useEffect(() => {
        if (selectedId && trRef.current) {
            const stage = trRef.current.getStage();
            const selectedNode = stage.findOne(`#${selectedId}`);
            if (selectedNode) {
                trRef.current.nodes([selectedNode]);
                trRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedId, elements]);

    // Handle responsive window resize map
    useEffect(() => {
        const handleResize = () => setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
        });

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Zoom and Pan handling via trackpad/mouse wheel
    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();

        // Trackpad pinch-to-zoom sets ctrlKey to true
        if (e.evt.ctrlKey || e.evt.metaKey) {
            const scaleBy = 1.05;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            // Direction: scrolling up vs down
            const direction = e.evt.deltaY > 0 ? -1 : 1;
            let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

            // Prevent zooming too far in/out
            newScale = Math.max(0.1, Math.min(newScale, 10));

            setStageScale(newScale);
            setStagePos({
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            });
        } else {
            // Standard scroll / trackpad two-finger swipe translates to Panning
            setStagePos({
                x: stagePos.x - e.evt.deltaX,
                y: stagePos.y - e.evt.deltaY,
            });
        }
    };

    const handleDragEnd = (e) => {
        if (e.target === e.target.getStage()) {
            setStagePos({
                x: e.target.x(),
                y: e.target.y()
            });
        }
    };

    // Canvas Hook Integrations
    const { handlePointerDown, handlePointerMove, handlePointerUp } = useDraw(yDoc, isLocalUpdate);

    const deleteElement = useCallback((id) => {
        if (!id) return;
        setElements(elements.filter(el => el.id !== id));
        if (selectedId === id) setSelectedId(null);

        if (yDoc) {
            isLocalUpdate.current = true;
            yDoc.transact(() => {
                const elementsMap = yDoc.getMap('elements');
                const orderArray = yDoc.getArray('order');
                elementsMap.delete(id);
                const order = orderArray.toArray();
                const index = order.indexOf(id);
                if (index !== -1) orderArray.delete(index, 1);
            });
            isLocalUpdate.current = false;
        }
    }, [elements, selectedId, yDoc, setElements, setSelectedId]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            const isCmd = e.metaKey || e.ctrlKey;

            // Tools
            if (key === 'v') setTool('selection');
            if (key === 'p') setTool('pencil');
            if (key === 'e') setTool('eraser');
            if (key === 'r') setTool('rectangle');
            if (key === 'c') setTool('circle');
            if (key === 'l') setTool('line');
            if (key === 't') setTool('triangle');
            if (key === 's') setTool('star');
            if (key === 'n') setTool('sticky');
            if (key === 'h') setTool('hand');

            // Deletion
            if ((key === 'backspace' || key === 'delete') && selectedId) {
                deleteElement(selectedId);
            }

            // Undo / Redo
            if (isCmd && key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, deleteElement, setTool, undo, redo]);

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    const syncUpdate = (id, newProps) => {
        updateElement(id, newProps);
        if (yDoc) {
            isLocalUpdate.current = true;
            const elementsMap = yDoc.getMap('elements');
            const current = elementsMap.get(id);
            if (current) {
                elementsMap.set(id, { ...current, ...newProps });
            }
            isLocalUpdate.current = false;
        }
    };

    const handleSelect = (e, id) => {
        if (tool !== 'selection') return;
        e.cancelBubble = true;
        setSelectedId(id);

        // Bring to front on click (user request)
        if (yDoc && id) {
            isLocalUpdate.current = true;
            yDoc.transact(() => {
                const orderArray = yDoc.getArray('order');
                const order = orderArray.toArray();
                const index = order.indexOf(id);
                if (index !== -1 && index < order.length - 1) {
                    orderArray.delete(index, 1);
                    orderArray.push([id]);
                }
            });
            // Also update local store for immediate feedback
            const elIndex = elements.findIndex(el => el.id === id);
            if (elIndex !== -1 && elIndex < elements.length - 1) {
                const newElements = [...elements];
                const [element] = newElements.splice(elIndex, 1);
                newElements.push(element);
                setElements(newElements);
            }
            isLocalUpdate.current = false;
        }
    };

    const handleObjectTransform = (e, id) => {
        const node = e.target;
        const newProps = {
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
        };
        syncUpdate(id, newProps);
    };

    const handleExport = useCallback(() => {
        if (!stageRef.current) return;
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `board-${roomId}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [roomId]);

    const getRemoteSelector = (elementId) => {
        const entry = Object.entries(remoteSelections).find(([, data]) => data.selectedId === elementId);
        return entry ? { userId: entry[0], ...entry[1] } : null;
    };

    // Component Render Mapper (Translating JSON to Konva React Nodes)
    const renderElement = (el) => {
        const remoteSelector = getRemoteSelector(el.id);
        const remoteGlowProps = remoteSelector ? {
            shadowColor: getCursorColor(remoteSelector.userId),
            shadowBlur: 15,
            shadowOpacity: 0.8,
            shadowOffset: { x: 0, y: 0 }
        } : {};

        if (el.type === 'pencil' || el.type === 'eraser' || el.type === 'pen' || el.type === 'highlighter') {
            return (
                <Line
                    key={el.id}
                    id={el.id}
                    x={el.x !== undefined ? el.x : 0}
                    y={el.y !== undefined ? el.y : 0}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    rotation={el.rotation || 0}
                    points={el.points}
                    stroke={el.type === 'eraser' ? '#f9fafb' : el.color}
                    strokeWidth={el.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                        el.type === 'eraser' ? 'destination-out' : 'source-over'
                    }
                    opacity={el.opacity !== undefined ? el.opacity : 1}
                    draggable={tool === 'selection'}
                    onPointerDown={(e) => handleSelect(e, el.id)}
                    onDragEnd={(e) => handleObjectTransform(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    {...remoteGlowProps}
                />
            );
        }

        if (el.type === 'rectangle' && el.points.length >= 4) {
            const width = el.points[2] - el.points[0];
            const height = el.points[3] - el.points[1];
            return (
                <Rect
                    key={el.id}
                    id={el.id}
                    x={el.x !== undefined ? el.x : el.points[0]}
                    y={el.y !== undefined ? el.y : el.points[1]}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    rotation={el.rotation || 0}
                    width={width}
                    height={height}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    fill="transparent"
                    draggable={tool === 'selection'}
                    onPointerDown={(e) => handleSelect(e, el.id)}
                    onDragEnd={(e) => handleObjectTransform(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    {...remoteGlowProps}
                />
            );
        }

        if (el.type === 'circle' && el.points.length >= 4) {
            const radiusX = Math.abs(el.points[2] - el.points[0]) / 2;
            const radiusY = Math.abs(el.points[3] - el.points[1]) / 2;
            const centerX = el.points[0] + (el.points[2] - el.points[0]) / 2;
            const centerY = el.points[1] + (el.points[3] - el.points[1]) / 2;
            return (
                <Ellipse
                    key={el.id}
                    id={el.id}
                    x={el.x !== undefined ? el.x : centerX}
                    y={el.y !== undefined ? el.y : centerY}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    rotation={el.rotation || 0}
                    radiusX={radiusX}
                    radiusY={radiusY}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    fill="transparent"
                    draggable={tool === 'selection'}
                    onPointerDown={(e) => handleSelect(e, el.id)}
                    onDragEnd={(e) => handleObjectTransform(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    {...remoteGlowProps}
                />
            );
        }

        if (el.type === 'line' && el.points.length >= 4) {
            return (
                <Line
                    key={el.id}
                    id={el.id}
                    x={el.x !== undefined ? el.x : 0}
                    y={el.y !== undefined ? el.y : 0}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    rotation={el.rotation || 0}
                    points={[el.points[0], el.points[1], el.points[2], el.points[3]]}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    tension={0}
                    lineCap="round"
                    lineJoin="round"
                    draggable={tool === 'selection'}
                    onPointerDown={(e) => handleSelect(e, el.id)}
                    onDragEnd={(e) => handleObjectTransform(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    {...remoteGlowProps}
                />
            );
        }

        if (el.type === 'triangle' && el.points.length >= 4) {
            const radius = Math.sqrt(Math.pow(el.points[2] - el.points[0], 2) + Math.pow(el.points[3] - el.points[1], 2));
            return (
                <RegularPolygon
                    key={el.id}
                    id={el.id}
                    x={el.x !== undefined ? el.x : el.points[0]}
                    y={el.y !== undefined ? el.y : el.points[1]}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    rotation={el.rotation || 0}
                    sides={3}
                    radius={radius}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    fill="transparent"
                    draggable={tool === 'selection'}
                    onPointerDown={(e) => handleSelect(e, el.id)}
                    onDragEnd={(e) => handleObjectTransform(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    {...remoteGlowProps}
                />
            );
        }

        if (el.type === 'star' && el.points.length >= 4) {
            const outerRadius = Math.sqrt(Math.pow(el.points[2] - el.points[0], 2) + Math.pow(el.points[3] - el.points[1], 2));
            const innerRadius = outerRadius / 2;
            return (
                <Star
                    key={el.id}
                    id={el.id}
                    x={el.x !== undefined ? el.x : el.points[0]}
                    y={el.y !== undefined ? el.y : el.points[1]}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    rotation={el.rotation || 0}
                    numPoints={5}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    stroke={el.color}
                    strokeWidth={el.strokeWidth}
                    fill="transparent"
                    draggable={tool === 'selection'}
                    onPointerDown={(e) => handleSelect(e, el.id)}
                    onDragEnd={(e) => handleObjectTransform(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    {...remoteGlowProps}
                />
            );
        }

        if (el.type === 'sticky') {
            const width = (el.width || 200) * (el.scaleX || 1);
            const height = (el.height || 200) * (el.scaleY || 1);
            const isDragging = draggingId === el.id;
            const isEditing = editingText?.id === el.id;
            const isSelected = selectedId === el.id;

            return (
                <Group
                    key={el.id}
                    id={el.id}
                    x={el.x !== undefined ? el.x : 0}
                    y={el.y !== undefined ? el.y : 0}
                    rotation={el.rotation || 0}
                    draggable={tool === 'selection' && !isEditing}
                    onPointerDown={(e) => {
                        handleSelect(e, el.id);
                        if (tool === 'selection') setDraggingId(el.id);
                    }}
                    onDblClick={(e) => {
                        if (tool !== 'selection') return;
                        const pos = e.target.getAbsolutePosition();
                        setEditingText({
                            id: el.id,
                            x: pos.x,
                            y: pos.y,
                            width: width * stageScale,
                            height: height * stageScale,
                            text: el.text || ''
                        });
                    }}
                    onDragStart={() => {
                        isLocalUpdate.current = true;
                        setDraggingId(el.id);
                    }}
                    onDragEnd={(e) => {
                        handleObjectTransform(e, el.id);
                        setDraggingId(null);
                        isLocalUpdate.current = false;
                    }}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    scaleX={isSelected && !isDragging ? 1.02 : 1}
                    scaleY={isSelected && !isDragging ? 1.02 : 1}
                >
                    <Rect
                        width={el.width || 200}
                        height={el.height || 200}
                        scaleX={el.scaleX || 1}
                        scaleY={el.scaleY || 1}
                        fill={el.color || '#fef08a'}
                        shadowColor="rgba(0,0,0,0.3)"
                        shadowBlur={isDragging ? 40 : (isSelected ? 25 : 15)}
                        shadowOpacity={isDragging ? 0.6 : 0.4}
                        shadowOffset={isDragging ? { x: 12, y: 12 } : (isSelected ? { x: 10, y: 10 } : { x: 5, y: 5 })}
                        cornerRadius={4}
                        stroke={isSelected ? '#6366f1' : 'transparent'}
                        strokeWidth={2}
                    />
                    {!isEditing && (
                        <Text
                            text={el.text || ''}
                            width={(el.width || 200) - 20}
                            height={(el.height || 200) - 20}
                            scaleX={el.scaleX || 1}
                            scaleY={el.scaleY || 1}
                            x={10 * (el.scaleX || 1)}
                            y={10 * (el.scaleY || 1)}
                            fontSize={16}
                            fontFamily={el.stickyFont || 'sans-serif'}
                            fill="#1f2937"
                            wrap="word"
                            align="left"
                            verticalAlign="top"
                            ellipsis={true}
                        />
                    )}
                </Group>
            );
        }

        if (el.type === 'text') {
            return (
                <Text
                    key={el.id}
                    id={el.id}
                    x={el.x !== undefined ? el.x : 0}
                    y={el.y !== undefined ? el.y : 0}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    rotation={el.rotation || 0}
                    text={el.text || ''}
                    fontSize={el.fontSize || 24}
                    fontFamily="sans-serif"
                    fill={el.color || '#000000'}
                    draggable={tool === 'selection'}
                    onPointerDown={(e) => handleSelect(e, el.id)}
                    onDragEnd={(e) => handleObjectTransform(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    {...remoteGlowProps}
                />
            );
        }

        if (el.type === 'image') {
            return (
                <URLImage
                    key={el.id}
                    imageProps={{
                        ...el,
                        draggable: tool === 'selection'
                    }}
                    onSelect={(e) => handleSelect(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    remoteGlowProps={remoteGlowProps.shadowColor ? remoteGlowProps : {}}
                />
            );
        }

        if (el.type === 'pdf') {
            return (
                <URLPdf
                    key={el.id}
                    pdfProps={el}
                    isSelected={selectedId === el.id}
                    onSelect={(e) => handleSelect(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    remoteGlowProps={remoteGlowProps}
                    updateElement={syncUpdate}
                />
            );
        }

        if (el.type === 'embed-youtube' || el.type === 'embed-docs') {
            const isYoutube = el.type === 'embed-youtube';
            return (
                <Group
                    key={el.id}
                    id={el.id}
                    x={el.x || 0}
                    y={el.y || 0}
                    scaleX={el.scaleX || 1}
                    scaleY={el.scaleY || 1}
                    rotation={el.rotation || 0}
                    draggable={tool === 'selection'}
                    onPointerDown={(e) => handleSelect(e, el.id)}
                    onDragEnd={(e) => handleObjectTransform(e, el.id)}
                    onTransformEnd={(e) => handleObjectTransform(e, el.id)}
                    {...(remoteGlowProps.shadowColor ? remoteGlowProps : {})}
                >
                    <Rect
                        width={el.width || 400}
                        height={el.height || 225}
                        fill={isYoutube ? '#fee2e2' : '#dbeafe'}
                        stroke={isYoutube ? '#ef4444' : '#3b82f6'}
                        strokeWidth={2}
                        cornerRadius={12}
                        shadowBlur={10}
                        shadowOpacity={0.1}
                    />
                    <Text
                        text={isYoutube ? '📺 YouTube Placeholder' : '📄 Google Docs Placeholder'}
                        width={el.width || 400}
                        height={el.height || 225}
                        fontSize={18}
                        fontFamily="sans-serif"
                        fontStyle="bold"
                        fill={isYoutube ? '#b91c1c' : '#1d4ed8'}
                        align="center"
                        verticalAlign="middle"
                    />
                    <Text
                        text={el.url || 'No URL provided'}
                        width={el.width || 400}
                        y={(el.height || 225) / 2 + 20}
                        fontSize={12}
                        fontFamily="sans-serif"
                        fill={isYoutube ? '#ef4444' : '#3b82f6'}
                        align="center"
                    />
                </Group>
            );
        }

        return null;
    };

    // Native Drag and Drop onto canvas window
    const handleDragOver = (e) => {
        e.preventDefault(); // necessary to allow drop
    };

    const handleDrop = async (e) => {
        e.preventDefault();

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        // Take the first file
        const file = files[0];

        // Ensure it's an image or PDF
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            return alert('Only images and PDFs can be dropped here.');
        }

        const formData = new FormData();
        formData.append('media', file);

        try {
            const response = await api.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const fileUrl = response.data.url;

            // Map the mouse drop coordinates to the Konva Stage
            // We have to account for stage pan (stagePos) and zoom (stageScale)
            let x = e.clientX;
            let y = e.clientY;

            if (stageRef.current) {
                const stage = stageRef.current;
                const pointerPosition = stage.getPointerPosition() || { x, y };
                const scale = stage.scaleX();
                x = (pointerPosition.x - stage.x()) / scale;
                y = (pointerPosition.y - stage.y()) / scale;
            }

            const isPdf = file.type === 'application/pdf';
            const newElement = {
                id: crypto.randomUUID(),
                type: isPdf ? 'pdf' : 'image',
                x: x,
                y: y,
                width: isPdf ? 400 : 300,
                height: isPdf ? 600 : 300,
                url: fileUrl,
                ...(isPdf ? { page: 1, totalPages: 1 } : {}),
                isFinished: true
            };

            addElement(newElement);
            // socket.emit('element-create', ...) removed. Handled by Yjs transaction below.

            if (yDoc) {
                isLocalUpdate.current = true;
                yDoc.transact(() => {
                    const elementsMap = yDoc.getMap('elements');
                    const orderArray = yDoc.getArray('order');
                    elementsMap.set(newElement.id, newElement);
                    orderArray.push([newElement.id]);
                });
                isLocalUpdate.current = false;
            }

        } catch (error) {
            console.error('Failed to upload dropped media:', error);
            alert('Failed to upload dropped media.');
        }
    };

    // WebRTC Video/Audio Call Methods
    const handleStartCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isCameraOn,
                audio: isMicOn
            });
            setLocalStream(stream);

            socket.emit('get-room-users', { roomId }, (usersInRoom) => {
                usersInRoom.forEach(async (targetId) => {
                    if (targetId === socket.id) return;
                    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
                    peersRef.current[targetId] = peer;

                    stream.getTracks().forEach(track => peer.addTrack(track, stream));

                    peer.onicecandidate = (event) => {
                        if (event.candidate) {
                            socket.emit('webrtc-ice-candidate', { targetUserId: targetId, candidate: event.candidate, senderId: socket.id });
                        }
                    };

                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('webrtc-offer', { targetUserId: targetId, offer, callerId: socket.id });
                });
            });
        } catch (err) {
            console.error('Error starting video call:', err);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        } else {
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        } else {
            setIsCameraOn(!isCameraOn);
        }
    };

    const handleStopCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        Object.values(peersRef.current).forEach(peer => peer.close());
        peersRef.current = {};
        setRemoteStreams({});
        if (socket) socket.emit('stop-screen-share', { roomId }); // Reusing stop-screen-share for cleanup
    };

    // WebRTC Screen Share Methods
    const handleStartScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setLocalStream(stream);

            socket.emit('get-room-users', { roomId }, (usersInRoom) => {
                usersInRoom.forEach(async (targetId) => {
                    if (targetId === socket.id) return;
                    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
                    peersRef.current[targetId] = peer;

                    stream.getTracks().forEach(track => peer.addTrack(track, stream));

                    peer.onicecandidate = (event) => {
                        if (event.candidate) {
                            socket.emit('webrtc-ice-candidate', { targetUserId: targetId, candidate: event.candidate, senderId: socket.id });
                        }
                    };

                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('webrtc-offer', { targetUserId: targetId, offer, callerId: socket.id });
                });
            });

            stream.getVideoTracks()[0].onended = () => {
                handleStopCall();
            };
        } catch (err) {
            console.error('Error starting screen share:', err);
        }
    };

    const handleSummarizeBoard = async () => {
        if (!yDoc) return;
        const textElements = elements.filter(el => (el.type === 'sticky' || el.type === 'text') && el.text);

        if (textElements.length === 0) {
            alert("No sticky notes or text found on the board to summarize.");
            return;
        }

        try {
            const texts = textElements.map(el => el.text);
            const response = await api.post('/ai/summarize', { texts });
            const summary = response.data.summary;
            const id = crypto.randomUUID();

            const summaryNote = {
                id,
                type: 'sticky',
                x: (window.innerWidth / 2) - 100 - stagePos.x,
                y: (window.innerHeight / 2) - 100 - stagePos.y,
                color: '#d8b4fe',
                text: `✨ AI Summary:\n${summary}`,
                isFinished: true
            };

            isLocalUpdate.current = true;
            yDoc.transact(() => {
                const elementsMap = yDoc.getMap('elements');
                const orderArray = yDoc.getArray('order');
                elementsMap.set(id, summaryNote);
                orderArray.push([id]);
            });
            addElement(summaryNote);
            isLocalUpdate.current = false;
        } catch (error) {
            console.error('Failed to summarize:', error);
            alert("Failed to summarize notes. Please try again.");
        }
    };

    const getBackgroundStyle = () => {
        try {
            if (!canvasBackground) return { backgroundColor: '#f8fafc', position: 'absolute', inset: 0 };

            const { type, value, opacity, color } = canvasBackground;
            const safeOpacity = typeof opacity === 'number' ? opacity : 1;
            const safeColor = color || '#f8fafc';

            const style = {
                backgroundColor: safeColor,
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                transition: 'background-color 0.3s ease',
                pointerEvents: 'none',
                opacity: safeOpacity
            };

            if (type === 'solid' || !type) return style;

            if (type === 'image' && value) {
                return {
                    ...style,
                    backgroundImage: `url(${value})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                };
            }

            if (type === 'pattern' && value) {
                const scale = typeof stageScale === 'number' ? stageScale : 1;
                const size = Math.max(10, 40 * scale);
                let patternUrl = '';

                try {
                    if (value === 'grid') {
                        const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="1"/></svg>`;
                        patternUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                    } else if (value === 'dots') {
                        const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="1" fill="rgba(0,0,0,0.15)" /></svg>`;
                        patternUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                    } else if (value === 'lined') {
                        const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="${size}" x2="${size}" y2="${size}" stroke="rgba(0,0,0,0.08)" stroke-width="1" /></svg>`;
                        patternUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                    }

                    if (patternUrl) {
                        return {
                            ...style,
                            backgroundImage: `url("${patternUrl}")`,
                            backgroundPosition: `${stagePos?.x || 0}px ${stagePos?.y || 0}px`
                        };
                    }
                } catch (e) {
                    console.error("SVG generation failed:", e);
                }
            }

            return style;
        } catch (error) {
            console.error("getBackgroundStyle failed:", error);
            return { backgroundColor: '#f8fafc', position: 'absolute', inset: 0 };
        }
    };

    const handleExitRoom = () => {
        if (window.confirm("Are you sure you want to leave this room?")) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden bg-white select-none relative font-sans text-slate-900 pt-16" onDragOver={handleDragOver} onDrop={handleDrop}>
            <RoomHeader
                roomId={roomId}
                userCount={userCount}
                isLive={socket?.connected}
                onStartCall={handleStartCall}
                onStopCall={handleStopCall}
                isCallActive={!!localStream}
                onExport={handleExport}
                onSummarize={handleSummarizeBoard}
                isPresenting={isPresenting}
                setIsPresenting={setIsPresenting}
                onToggleAIPanel={() => setIsAIPanelOpen(!isAIPanelOpen)}
                onToggleBackgroundSelector={() => setIsBgSelectorOpen(!isBgSelectorOpen)}
                onInvite={() => alert(`Invite teammates to room ID: ${roomId}`)}
                onSettings={() => alert("Room settings coming soon!")}
                user={user}
                onExit={handleExitRoom}
            />

            {/* Main Workspace Layout */}
            <div className="flex h-full w-full">
                <Toolbar
                    socket={socket}
                    roomId={roomId}
                    onExport={handleExport}
                    yDoc={yDoc}
                    isLocalUpdate={isLocalUpdate}
                    deleteElement={deleteElement}
                    isSharingScreen={!!localStream}
                    onStartScreenShare={handleStartScreenShare}
                    onStopScreenShare={handleStopCall}
                    showOnboarding={showOnboarding && onboardingStep === 1}
                    activeUsers={activeUsers}
                />

                {/* Canvas Drawing Area */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Dynamic Background */}
                    <div style={getBackgroundStyle()} />
                    {/* Error and Loading Overlays */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/10 backdrop-blur-sm"
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-red-100 max-w-sm mx-4"
                                >
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Workspace Error</h3>
                                    <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">{error}</p>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                    >
                                        Back to Dashboard
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}

                        {!roomInfo && !error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 z-[90] flex items-center justify-center bg-white/80 backdrop-blur-md"
                            >
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm font-bold text-slate-600 animate-pulse">Initializing Secure Workspace...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Stage
                        ref={stageRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        onPointerDown={(e) => {
                            checkDeselect(e);
                            handlePointerDown(e);
                        }}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onWheel={handleWheel}
                        draggable={tool === 'hand'}
                        onDragEnd={handleDragEnd}
                        x={stagePos.x}
                        y={stagePos.y}
                        scaleX={stageScale}
                        scaleY={stageScale}
                        className={tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair touching-none'}
                    >
                        <Layer>
                            {elements.map((el) => renderElement(el))}
                            {selectedId && (
                                <Transformer
                                    ref={trRef}
                                    rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                                    anchorSize={14}
                                    anchorCornerRadius={7}
                                    anchorStroke="#6366f1"
                                    anchorFill="#ffffff"
                                    anchorStrokeWidth={2}
                                    rotateEnabled={true}
                                />
                            )}
                        </Layer>
                    </Stage>

                    {/* Inline Sticky Note Editor */}
                    {editingText && (
                        <textarea
                            autoFocus
                            defaultValue={editingText.text}
                            style={{
                                position: 'absolute',
                                top: editingText.y,
                                left: editingText.x,
                                width: editingText.width,
                                height: editingText.height,
                                backgroundColor: 'transparent',
                                border: 'none',
                                outline: 'none',
                                padding: `${10 * stageScale}px`,
                                fontSize: `${16 * stageScale}px`,
                                fontFamily: elements.find(el => el.id === editingText.id)?.stickyFont || 'sans-serif',
                                color: '#1f2937',
                                resize: 'none',
                                zIndex: 1000,
                                transform: `rotate(${elements.find(el => el.id === editingText.id)?.rotation || 0}deg)`,
                                transformOrigin: 'top left',
                                overflow: 'hidden'
                            }}
                            onBlur={(e) => {
                                const newText = e.target.value;
                                if (newText !== editingText.text) {
                                    isLocalUpdate.current = true;
                                    updateElement(editingText.id, { text: newText });
                                    const elementsMap = yDoc.getMap('elements');
                                    const el = elementsMap.get(editingText.id);
                                    if (el) elementsMap.set(editingText.id, { ...el, text: newText });
                                    isLocalUpdate.current = false;
                                }
                                setEditingText(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setEditingText(null);
                            }}
                        />
                    )}

                    {/* Responsive Video Grid HUD */}
                    {(localStream || Object.keys(remoteStreams).length > 0) && (
                        <motion.div
                            drag
                            dragConstraints={{ left: 0, right: window.innerWidth - 300, top: 0, bottom: window.innerHeight - 300 }}
                            dragMomentum={false}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ resize: 'both', overflow: 'hidden' }}
                            className="absolute top-24 right-8 z-40 bg-white/90 backdrop-blur-xl rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white/40 min-w-[320px] max-w-[90vw] min-h-[200px] p-2 ring-1 ring-black/5"
                        >
                            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100/50 cursor-grab active:cursor-grabbing">
                                <div className="flex items-center gap-2">
                                    <Move size={14} className="text-slate-400" />
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest pointer-events-none">Live Conference</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={toggleCamera} className={`p-2 rounded-xl transition-all ${isCameraOn ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                                        {isCameraOn ? <Camera size={16} /> : <CameraOff size={16} />}
                                    </button>
                                    <button onClick={toggleMic} className={`p-2 rounded-xl transition-all ${isMicOn ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                                        {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                                    </button>
                                    <button onClick={handleStopCall} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all ml-1">
                                        <PhoneOff size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className={`p-3 grid gap-3 ${Object.keys(remoteStreams).length === 0 ? 'grid-cols-1 max-w-sm mx-auto' :
                                Object.keys(remoteStreams).length === 1 ? 'grid-cols-2' :
                                    'grid-cols-2 lg:grid-cols-3'
                                }`}>
                                {localStream && (
                                    <div className="relative aspect-video bg-slate-900 rounded-2.5xl overflow-hidden ring-1 ring-white/20 shadow-2xl group">
                                        {isCameraOn ? (
                                            <VideoPlayer stream={localStream} isLocal={true} muted={true} />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                                    <CameraOff size={24} />
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white font-black border border-white/10 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                            You (Host)
                                        </div>
                                    </div>
                                )}
                                {Object.entries(remoteStreams).map(([uId, stream]) => (
                                    <div key={uId} className="relative aspect-video bg-slate-900 rounded-2.5xl overflow-hidden ring-1 ring-white/20 shadow-2xl group text-left">
                                        <VideoPlayer stream={stream} isLocal={false} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white font-black border border-white/10">
                                            {remoteSelections[uId]?.user?.name || 'Collaborator'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Viewport Zoom Indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-6 z-10">
                        <button className="text-slate-400 hover:text-indigo-600 font-bold" onClick={() => setStageScale(s => Math.max(0.1, s - 0.1))}>-</button>
                        <span className="text-[10px] font-bold text-slate-600 min-w-[40px] text-center">{Math.round(stageScale * 100)}%</span>
                        <button className="text-slate-400 hover:text-indigo-600 font-bold" onClick={() => setStageScale(s => Math.min(10, s + 0.1))}>+</button>
                        <div className="w-px h-4 bg-slate-200" />
                        <button className="text-xs font-bold text-slate-500 hover:text-indigo-600" onClick={() => { setStagePos({ x: 0, y: 0 }); setStageScale(1); }}>Reset View</button>
                    </div>
                </div>

                <div className="relative">
                    <AIPanel
                        roomId={roomId}
                        yDoc={yDoc}
                        isLocalUpdate={isLocalUpdate}
                        showOnboarding={showOnboarding && onboardingStep === 1}
                        isOpen={isAIPanelOpen}
                        setIsOpen={setIsAIPanelOpen}
                    />
                    {showOnboarding && onboardingStep === 1 && (
                        <div className="absolute bottom-24 left-10 pointer-events-none">
                            <OnboardingTooltip text="Generate diagrams with AI" position="top" />
                        </div>
                    )}
                </div>

                <div className="relative">
                    <Chat chatArray={yDoc?.getArray('chat')} roomId={roomId} showOnboarding={showOnboarding && onboardingStep === 1} />
                    {showOnboarding && onboardingStep === 1 && (
                        <div className="absolute bottom-20 right-10 pointer-events-none">
                            <OnboardingTooltip text="Chat with your team" position="top" />
                        </div>
                    )}
                </div>

                {/* Phase 7: Room ID Display (Bottom Left) */}
                <div className="fixed bottom-6 left-28 z-40 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3 transition-all hover:bg-white group">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Room ID</span>
                        <span className="text-xs font-mono font-bold text-slate-700">{roomId}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(roomId);
                            // Simple feedback
                            const btn = document.activeElement;
                            if (btn) btn.innerHTML = '<span class="text-emerald-500">Copied!</span>';
                            setTimeout(() => { if (btn) btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'; }, 2000);
                        }}
                        className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
                        title="Copy Room ID"
                    >
                        <Copy size={14} />
                    </button>
                </div>

                {/* Phase 8: Resize Handle (Bottom Right Corner) */}
                <div className="fixed bottom-0 right-0 z-[100] w-6 h-6 cursor-nwse-resize group flex items-center justify-center pointer-events-auto">
                    <div className="w-4 h-4 border-r-2 border-b-2 border-slate-300 group-hover:border-indigo-500 transition-colors rounded-br-sm" />
                </div>

                <Cursors provider={provider} roomId={roomId} />
            </div>

            {/* Onboarding Overlay */}
            <AnimatePresence>
                {showOnboarding && onboardingStep === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[32px] shadow-2xl p-10 max-w-md mx-4 relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm mx-auto">
                                <Sparkles size={40} className="animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Welcome to your workspace!</h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                You've just created a persistent, collaborative space. Use the toolbar to draw, add shapes, or write text.
                            </p>
                            <button
                                onClick={() => setOnboardingStep(1)}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                            >
                                Let's go!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isBgSelectorOpen && (
                    <BackgroundSelector
                        isOpen={isBgSelectorOpen}
                        onClose={() => setIsBgSelectorOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

class RoomErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("RoomErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center">
                        <MonitorPlay size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black mb-2">Workspace Error</h2>
                        <p className="text-slate-400 text-sm max-w-sm mb-6">{this.state.error?.message || "An unexpected error occurred in the room."}</p>
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function RoomWithErrorBoundary(props) {
    return (
        <RoomErrorBoundary>
            <Room {...props} />
        </RoomErrorBoundary>
    );
};
