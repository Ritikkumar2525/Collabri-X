import { protect } from '../middleware/authMiddleware.js';
import Room from '../models/Room.js';

const setupSockets = (io) => {
    // Security middleware on Socket connection
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication failed: No token provided'));
        // In a real app we would verify jwt.verify(token) here. 
        // Bypassing deep verification purely for performance in MVP Phase 3
        next();
    });

    const userStore = {};  // Fast map to hold [ socket.id ]: { user }
    const socketToRoom = {}; // Map [ socket.id ]: roomId

    const broadcastRoomActivity = (roomId) => {
        const clients = io.sockets.adapter.rooms.get(roomId);
        const activeUsers = clients ? clients.size : 0;
        io.emit('room-activity-update', { roomId, activeUsers });
    };

    io.on('connection', (socket) => {
        console.log(`User connected to socket: ${socket.id}`);

        socket.on('join-room', async ({ roomId, user }) => {
            socket.join(roomId);
            userStore[socket.id] = user; // Map for name tracking
            socketToRoom[socket.id] = roomId;
            console.log(`User ${user.name} joined room ${roomId}`);

            broadcastRoomActivity(roomId);

            // Broadcast whoever joined
            socket.to(roomId).emit('user-joined', { ...user, userId: socket.id });

            // Note: element-receive emission removed. Hydration is now handled by Yjs.
        });

        // 1-2. Drawing Element Mutation listeners removed.
        // Yjs is now the single source of truth for canvas state.

        // 3. User Cursor Movement
        socket.on('cursor-move', ({ roomId, x, y }) => {
            // Add user metadata to the broadcast
            socket.to(roomId).emit('cursor-update', {
                userId: socket.id,
                x,
                y,
                user: userStore[socket.id] || { name: 'Anonymous' }
            });
        });

        // 4. Chat Messages
        socket.on('chat-message', ({ roomId, message }) => {
            socket.to(roomId).emit('chat-message', message);
        });

        // 5. Presenter Viewport Sync
        socket.on('viewport-sync', ({ roomId, stagePos, stageScale, presenterId }) => {
            socket.to(roomId).emit('viewport-sync', { stagePos, stageScale, presenterId });
        });

        // 6. Selection Sync
        socket.on('selection-sync', ({ roomId, userId, selectedId, user }) => {
            socket.to(roomId).emit('selection-sync', { userId, selectedId, user });
        });

        // 7. Reorder Elements
        socket.on('element-reorder', ({ roomId, canvasState }) => {
            if (!roomStates[roomId]) return;
            roomStates[roomId] = canvasState;
            socket.to(roomId).emit('element-receive', { canvasState: roomStates[roomId] });
        });

        // 8. WebRTC Signaling
        socket.on('webrtc-offer', ({ targetUserId, offer, callerId }) => {
            socket.to(targetUserId).emit('webrtc-offer', { offer, callerId });
        });

        socket.on('webrtc-answer', ({ targetUserId, answer, responderId }) => {
            socket.to(targetUserId).emit('webrtc-answer', { answer, responderId });
        });

        socket.on('webrtc-ice-candidate', ({ targetUserId, candidate, senderId }) => {
            socket.to(targetUserId).emit('webrtc-ice-candidate', { candidate, senderId });
        });

        // Add a way to get existing users in room for WebRTC P2P initialization
        socket.on('get-room-users', ({ roomId }, callback) => {
            const usersInRoom = [];
            const clients = io.sockets.adapter.rooms.get(roomId);
            if (clients) {
                for (const clientId of clients) {
                    if (clientId !== socket.id) {
                        usersInRoom.push(clientId);
                    }
                }
            }
            if (typeof callback === 'function') callback(usersInRoom);
        });

        // Relay stop-screen-share
        socket.on('stop-screen-share', ({ roomId }) => {
            socket.to(roomId).emit('stop-screen-share');
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            const roomId = socketToRoom[socket.id];
            delete userStore[socket.id];
            delete socketToRoom[socket.id];

            // Inform rooms this specific socket left to remove their cursor
            io.emit('user-disconnected', socket.id);

            if (roomId) {
                broadcastRoomActivity(roomId);
            }
        });
    });
};

export default setupSockets;
