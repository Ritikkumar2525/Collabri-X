import { useCallback } from 'react';
import useCanvasStore from '../store/canvasStore';
import { v4 as uuidv4 } from 'uuid';

export const useDraw = (yDoc, isLocalUpdate) => {
    const { tool, color, strokeWidth, addElement, updateElement, elements, stickyShape, stickyFont } = useCanvasStore();

    const handlePointerDown = useCallback((e) => {
        if (tool === 'selection' || tool === 'hand' || !yDoc) return;

        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        const scale = stage.scaleX();
        const pos = {
            x: (pointerPosition.x - stage.x()) / scale,
            y: (pointerPosition.y - stage.y()) / scale,
        };

        const id = uuidv4();
        let newElement;

        if (tool === 'sticky') {
            // Random slight rotation for physical feel (-5 to 5 degrees)
            const rotation = (Math.random() * 10) - 5;

            newElement = {
                id,
                type: 'sticky',
                x: pos.x,
                y: pos.y,
                width: 200,
                height: 200,
                rotation: rotation,
                color: color || '#fef08a',
                text: 'New Note', // Start with placeholder for direct editing
                stickyFont: stickyFont || 'sans-serif',
                isFinished: true
            };
        } else {
            newElement = {
                id,
                type: tool,
                points: [pos.x, pos.y],
                color,
                strokeWidth: tool === 'highlighter' ? Math.max(strokeWidth, 20) : strokeWidth,
                opacity: tool === 'highlighter' ? 0.3 : 1,
                isFinished: false
            };
        }

        if (newElement) {
            isLocalUpdate.current = true;
            yDoc.transact(() => {
                const elementsMap = yDoc.getMap('elements');
                const orderArray = yDoc.getArray('order');
                elementsMap.set(id, newElement);
                orderArray.push([id]);
            });
            addElement(newElement);
            isLocalUpdate.current = false;
        }

    }, [tool, color, strokeWidth, addElement, yDoc, isLocalUpdate, stickyShape, stickyFont]);

    const handlePointerMove = useCallback((e) => {
        if (tool === 'selection' || tool === 'hand' || elements.length === 0 || !yDoc) return;

        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        const scale = stage.scaleX();
        const pos = {
            x: (pointerPosition.x - stage.x()) / scale,
            y: (pointerPosition.y - stage.y()) / scale,
        };

        const currentElement = elements[elements.length - 1];
        if (!currentElement || currentElement.isFinished) return;

        const updatedPoints = currentElement.type === 'pencil' || currentElement.type === 'eraser'
            ? [...currentElement.points, pos.x, pos.y]
            : [currentElement.points[0], currentElement.points[1], pos.x, pos.y];

        isLocalUpdate.current = true;
        updateElement(currentElement.id, { points: updatedPoints });

        const elementsMap = yDoc.getMap('elements');
        elementsMap.set(currentElement.id, { ...currentElement, points: updatedPoints });

        isLocalUpdate.current = false;

    }, [tool, elements, updateElement, yDoc, isLocalUpdate]);

    const handlePointerUp = useCallback(() => {
        if (elements.length === 0 || !yDoc) return;

        const currentElement = elements[elements.length - 1];
        if (!currentElement || currentElement.isFinished) return;

        isLocalUpdate.current = true;
        updateElement(currentElement.id, { isFinished: true });

        const elementsMap = yDoc.getMap('elements');
        elementsMap.set(currentElement.id, { ...currentElement, isFinished: true });

        isLocalUpdate.current = false;

    }, [elements, updateElement, yDoc, isLocalUpdate]);

    return { handlePointerDown, handlePointerMove, handlePointerUp };
};
