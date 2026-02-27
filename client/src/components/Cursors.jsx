import { useEffect, useState } from 'react';

const CURSOR_COLORS = [
    '#e11d48', '#2563eb', '#16a34a', '#eab308',
    '#9333ea', '#db2777', '#ca8a04', '#059669',
    '#f97316', '#8b5cf6', '#06b6d4', '#10b981'
];

const getCursorColor = (id) => {
    if (!id) return CURSOR_COLORS[0];
    const idStr = id.toString();
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
};

const Cursors = ({ provider, roomId }) => {
    const [cursors, setCursors] = useState({});

    useEffect(() => {
        if (!provider) return;

        const awareness = provider.awareness;

        const handleMouseMove = (e) => {
            awareness.setLocalStateField('cursor', {
                x: e.clientX,
                y: e.clientY
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        const handleAwarenessChange = () => {
            const states = awareness.getStates();
            const newCursors = {};

            states.forEach((state, clientID) => {
                if (clientID === awareness.clientID) return;
                if (state.cursor && state.user) {
                    newCursors[clientID] = {
                        ...state.cursor,
                        user: state.user
                    };
                }
            });

            setCursors(newCursors);
        };

        awareness.on('change', handleAwarenessChange);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            awareness.off('change', handleAwarenessChange);
        };
    }, [provider]);

    return (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
            {Object.entries(cursors).map(([id, cursor]) => {
                const color = getCursorColor(id);
                return (
                    <div
                        key={id}
                        className="absolute top-0 left-0 transition-all duration-75 ease-out flex flex-col items-start"
                        style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
                    >
                        {/* SVG standard cursor arrow */}
                        <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md z-50">
                            <path d="M5.65376 2.15376C5.40189 1.90189 5 2.08036 5 2.43686V32.3275C5 32.747 5.51868 32.9431 5.79468 32.6288L14.0729 23.196L23.4243 14.8988C23.7712 14.5913 23.5705 14 23.1075 14H6.38605L5.65376 13.2677V2.15376Z" fill={color} stroke="white" strokeWidth="2" />
                        </svg>
                        {cursor.user && (
                            <div
                                className="text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-sm whitespace-nowrap ml-4 -mt-1 z-40"
                                style={{ backgroundColor: color }}
                            >
                                {cursor.user.name}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Cursors;
