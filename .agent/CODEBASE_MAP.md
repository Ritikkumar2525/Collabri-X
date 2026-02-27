# CODEBASE_MAP.md

## Project Overview
**Digital HQ** is a real-time collaborative workspace using React, Node.js, and Konva for canvas rendering.

## Folder Structure
- `/client`: React (Vite) frontend.
    - `/src/components`: UI components (Toolbar, Chat, AIPanel, Cursors).
    - `/src/pages`: Main application views (Home, Dashboard, Room, Login, Register).
    - `/src/services`: API client (Axios).
    - `/src/store`: Global state (Zustand).
- `/server`: Node.js (Express) backend.
    - `/config`: Database connection.
    - `/controllers`: API business logic.
    - `/models`: MongoDB schemas (User, Room, Activity).
    - `/routes`: API endpoints.
    - `/sockets`: WebSocket handler (Socket.io).

## Critical Files
- [Room.jsx](file:///Users/shidan/Desktop/antigravity/client/src/pages/Room.jsx): Core canvas/whiteboard engine and WebRTC logic.
- [Toolbar.jsx](file:///Users/shidan/Desktop/antigravity/client/src/components/Toolbar.jsx): Whiteboard controls and AI tools.
- [index.js (server)](file:///Users/shidan/Desktop/antigravity/server/sockets/index.js): Server-side real-time synchronization.
- [authStore.js](file:///Users/shidan/Desktop/antigravity/client/src/store/authStore.js): Authentication and session state.

## Tech Audit Findings
- **Canvas Engine**: `react-konva`. JSON-based element persistence.
- **Synchronization**: Current implementation uses raw WebSockets (Socket.io) with full state broadcasts. **Yjs is currently missing** and needs integration in later phases.
- **Media**: WebRTC for video and screen sharing is implemented in `Room.jsx`.
- **Database**: MongoDB (Mongoose) for users, rooms, and archived states.

## DO NOT TOUCH Areas
- **WebRTC Signalling Flow**: Signaling logic in `Room.jsx` and `sockets/index.js` is functional. 
- **Landing Page Design**: `Home.jsx` is highly polished and should remain untouched.

## Future Integration Points
- **Phase 2 (Auth)**: Enhance `authStore` and `ProtectedRoute`.
- **Phase 3 (Dashboard)**: Refactor `Dashboard.jsx` to ensure all actions are persistent.
- **Phase 4 & 5 (Yjs)**: Replace raw socket sync with Yjs in `Room.jsx` and `sockets/index.js`.
- **Phase 8 (AI)**: Extend `AIPanel` and `aiRoutes`.
