import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import Room from '../models/Room.js';

export const setupYjs = (server) => {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const { pathname } = new URL(request.url, `http://${request.headers.host}`);

        if (pathname.startsWith('/yjs')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
    });

    wss.on('connection', (conn, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const roomName = url.pathname.split('/').pop();

        // setupWSConnection handles the Yjs protocol over WebSocket
        setupWSConnection(conn, req, { docName: roomName, docs });

        const doc = docs.get(roomName);
        if (doc) {
            // LOAD FROM DB: If this is a fresh doc in memory, hydrate from MongoDB
            if (!doc.get('isHydrated')) {
                doc.set('isHydrated', true);
                (async () => {
                    try {
                        const room = await Room.findOne({ roomId: roomName.toUpperCase() });
                        if (room && room.yjsState) {
                            Y.applyUpdate(doc, room.yjsState);
                            console.log(`[Yjs] Hydrated room ${roomName} from MongoDB binary state.`);
                        }
                    } catch (err) {
                        console.error(`[Yjs] Hydration error for room ${roomName}:`, err);
                    }
                })();
            }

            // SAVE TO DB: Set up a debounced save operation
            let saveTimeout = null;
            doc.on('update', () => {
                if (saveTimeout) clearTimeout(saveTimeout);
                saveTimeout = setTimeout(async () => {
                    try {
                        const stateVector = Y.encodeStateAsUpdate(doc);
                        const elementsMap = doc.getMap('elements');
                        const canvasState = Array.from(elementsMap.values());

                        await Room.findOneAndUpdate(
                            { roomId: roomName.toUpperCase() },
                            {
                                yjsState: Buffer.from(stateVector),
                                canvasState // Mirror JSON for dashboards
                            },
                            { upsert: true }
                        );
                        console.log(`[Yjs] Binary state persisted for room: ${roomName}`);
                    } catch (err) {
                        console.error(`[Yjs] Save error for room ${roomName}:`, err);
                    }
                }, 3000); // 3s debounce
            });
        }

        console.log(`Yjs connected to room: ${roomName}`);
    });

    return wss;
};
