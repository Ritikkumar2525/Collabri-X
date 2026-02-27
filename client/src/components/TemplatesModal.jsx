import React from 'react';
import useCanvasStore from '../store/canvasStore';
import { LayoutTemplate, Map, X, Sparkles } from 'lucide-react';

const kanbanTemplate = [
    { type: 'rectangle', points: [0, 0, 300, 600], color: '#f3f4f6', strokeWidth: 0, isFinished: true },
    { type: 'text', x: 110, y: 20, text: 'To Do', fontSize: 24, color: '#374151', isFinished: true },
    { type: 'rectangle', points: [350, 0, 650, 600], color: '#f3f4f6', strokeWidth: 0, isFinished: true },
    { type: 'text', x: 430, y: 20, text: 'In Progress', fontSize: 24, color: '#374151', isFinished: true },
    { type: 'rectangle', points: [700, 0, 1000, 600], color: '#f3f4f6', strokeWidth: 0, isFinished: true },
    { type: 'text', x: 820, y: 20, text: 'Done', fontSize: 24, color: '#374151', isFinished: true },
    { type: 'sticky', x: 50, y: 80, text: 'Setup Repo', color: '#fef08a', stickyShape: 'square', stickyFont: 'sans-serif', isFinished: true },
    { type: 'sticky', x: 400, y: 80, text: 'Build Toolbar', color: '#bfdbfe', stickyShape: 'square', stickyFont: 'sans-serif', isFinished: true },
];

const journeyTemplate = [
    { type: 'circle', points: [0, 0, 200, 200], color: '#9333ea', strokeWidth: 4, isFinished: true },
    { type: 'text', x: 50, y: 85, text: 'Discovery', fontSize: 20, color: '#9333ea', isFinished: true },
    { type: 'line', points: [210, 100, 390, 100], strokeWidth: 4, color: '#9ca3af', isFinished: true },
    { type: 'circle', points: [400, 0, 600, 200], color: '#2563eb', strokeWidth: 4, isFinished: true },
    { type: 'text', x: 460, y: 85, text: 'Checkout', fontSize: 20, color: '#2563eb', isFinished: true },
    { type: 'line', points: [610, 100, 790, 100], strokeWidth: 4, color: '#9ca3af', isFinished: true },
    { type: 'circle', points: [800, 0, 1000, 200], color: '#16a34a', strokeWidth: 4, isFinished: true },
    { type: 'text', x: 860, y: 85, text: 'Success', fontSize: 20, color: '#16a34a', isFinished: true },
];

const swotTemplate = [
    { type: 'rectangle', points: [0, 0, 400, 300], color: '#dcfce7', strokeWidth: 0, isFinished: true }, // Strengths
    { type: 'text', x: 130, y: 20, text: 'Strengths', fontSize: 24, color: '#166534', isFinished: true },
    { type: 'rectangle', points: [420, 0, 820, 300], color: '#fee2e2', strokeWidth: 0, isFinished: true }, // Weaknesses
    { type: 'text', x: 540, y: 20, text: 'Weaknesses', fontSize: 24, color: '#991b1b', isFinished: true },
    { type: 'rectangle', points: [0, 320, 400, 620], color: '#dbeafe', strokeWidth: 0, isFinished: true }, // Opportunities
    { type: 'text', x: 110, y: 340, text: 'Opportunities', fontSize: 24, color: '#1e40af', isFinished: true },
    { type: 'rectangle', points: [420, 320, 820, 620], color: '#fef3c7', strokeWidth: 0, isFinished: true }, // Threats
    { type: 'text', x: 570, y: 340, text: 'Threats', fontSize: 24, color: '#92400e', isFinished: true },
];

const brainstormTemplate = [
    { type: 'circle', points: [300, 200, 700, 450], color: '#f3f4f6', strokeWidth: 2, isFinished: true },
    { type: 'text', x: 440, y: 300, text: 'Core Idea', fontSize: 32, color: '#111827', isFinished: true },
    { type: 'sticky', x: 100, y: 100, text: 'Idea 1', color: '#fef08a', isFinished: true },
    { type: 'sticky', x: 750, y: 100, text: 'Idea 2', color: '#dcfce7', isFinished: true },
    { type: 'sticky', x: 100, y: 450, text: 'Idea 3', color: '#dbeafe', isFinished: true },
    { type: 'sticky', x: 750, y: 450, text: 'Idea 4', color: '#f3e8ff', isFinished: true },
];

const TemplatesModal = ({ isOpen, onClose, socket, roomId, yDoc, isLocalUpdate }) => {
    const { addElements } = useCanvasStore();

    if (!isOpen) return null;

    const handleInsert = (templateDefinition) => {
        if (!yDoc) return;

        // Offset everything slightly so it drops near the center visually, and map UUIDs
        const offsetX = window.innerWidth / 2 - 500;
        const offsetY = window.innerHeight / 2 - 300;

        const mappedElements = templateDefinition.map(el => {
            const mappedEl = { ...el, id: crypto.randomUUID() };
            // Simple translation
            if (mappedEl.points) {
                mappedEl.points = mappedEl.points.map((pt, i) => i % 2 === 0 ? pt + offsetX : pt + offsetY);
            }
            if (mappedEl.x !== undefined) mappedEl.x += offsetX;
            if (mappedEl.y !== undefined) mappedEl.y += offsetY;
            return mappedEl;
        });

        // Add to Yjs atomically
        isLocalUpdate.current = true;
        yDoc.transact(() => {
            const elementsMap = yDoc.getMap('elements');
            const orderArray = yDoc.getArray('order');
            mappedElements.forEach(element => {
                elementsMap.set(element.id, element);
                orderArray.push([element.id]);
            });
        });

        // Add to local store for immediate feedback
        addElements(mappedElements);
        isLocalUpdate.current = false;

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">Templates Library</h2>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleInsert(kanbanTemplate)}
                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <LayoutTemplate size={40} className="text-gray-400 group-hover:text-blue-500 mb-3" />
                        <span className="font-medium text-gray-700 group-hover:text-blue-700">Agile Kanban</span>
                    </button>

                    <button
                        onClick={() => handleInsert(journeyTemplate)}
                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                    >
                        <Map size={40} className="text-gray-400 group-hover:text-purple-500 mb-3" />
                        <span className="font-medium text-gray-700 group-hover:text-purple-700">User Journey</span>
                    </button>

                    <button
                        onClick={() => handleInsert(swotTemplate)}
                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                    >
                        <LayoutTemplate size={40} className="text-gray-400 group-hover:text-emerald-500 mb-3" />
                        <span className="font-medium text-gray-700 group-hover:text-emerald-700">SWOT Analysis</span>
                    </button>

                    <button
                        onClick={() => handleInsert(brainstormTemplate)}
                        className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                    >
                        <Sparkles size={40} className="text-gray-400 group-hover:text-orange-500 mb-3" />
                        <span className="font-medium text-gray-700 group-hover:text-orange-700">Brainstorming</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplatesModal;
