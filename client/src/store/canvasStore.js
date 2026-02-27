import { create } from 'zustand';

const useCanvasStore = create((set) => ({
    elements: [],
    tool: 'pencil', // pencil | eraser | rectangle | circle | selection
    color: '#000000',
    strokeWidth: 4,
    selectedId: null,
    stickyShape: 'square',
    stickyFont: 'sans-serif',
    isPresenting: false,
    presenterId: null,
    undoManager: null,
    canvasBackground: {
        type: 'pattern', // 'solid' | 'pattern' | 'image'
        value: 'grid',    // color hex or pattern name or image URL
        opacity: 1,
        color: '#f8fafc' // Base background color
    },

    setSelectedId: (id) => set({ selectedId: id }),
    setIsPresenting: (status) => set({ isPresenting: status }),
    setPresenterId: (id) => set({ presenterId: id }),
    setStickyShape: (shape) => set({ stickyShape: shape }),
    setStickyFont: (font) => set({ stickyFont: font }),
    setUndoManager: (um) => set({ undoManager: um }),
    setCanvasBackground: (bg) => set((state) => ({
        canvasBackground: { ...state.canvasBackground, ...bg }
    })),

    // Set active tool
    setTool: (tool) => set({ tool }),

    // Set stroke color
    setColor: (color) => set({ color }),

    // Set stroke width
    setStrokeWidth: (width) => set({ strokeWidth: width }),

    // Set entire elements array (used for socket/yjs sync)
    setElements: (newElements) => set({ elements: newElements }),

    // Local state updates for UI responsiveness
    addElement: (element) => set((state) => ({
        elements: [...state.elements, element]
    })),

    addElements: (elementsToAdd) => set((state) => ({
        elements: [...state.elements, ...elementsToAdd]
    })),

    // Update existing element (like dragging or drawing a line)
    updateElement: (id, newProps) => set((state) => ({
        elements: state.elements.map((el) =>
            el.id === id ? { ...el, ...newProps } : el
        )
    })),

    bringForward: (id) => set((state) => {
        const index = state.elements.findIndex(el => el.id === id);
        if (index === -1 || index === state.elements.length - 1) return state;
        const newElements = [...state.elements];
        const [element] = newElements.splice(index, 1);
        newElements.push(element);
        return { elements: newElements };
    }),

    sendToBack: (id) => set((state) => {
        const index = state.elements.findIndex(el => el.id === id);
        if (index <= 0) return state;
        const newElements = [...state.elements];
        const [element] = newElements.splice(index, 1);
        newElements.unshift(element);
        return { elements: newElements };
    }),

    undo: () => set((state) => {
        if (state.undoManager) {
            state.undoManager.undo();
        }
        return state;
    }),

    redo: () => set((state) => {
        if (state.undoManager) {
            state.undoManager.redo();
        }
        return state;
    }),

    clearCanvas: () => set(() => ({
        elements: []
    }))
}));

export default useCanvasStore;
