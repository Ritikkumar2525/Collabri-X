import Room from '../models/Room.js';
import Activity from '../models/activityModel.js';
import { v4 as uuidv4 } from 'uuid';

// Generate a random 6-character room ID
const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create a new room
// @route   POST /api/rooms/create
// @access  Private
export const createRoom = async (req, res) => {
    try {
        const { title } = req.body;
        const roomId = generateRoomId();

        const room = await Room.create({
            roomId,
            title: title || `Project ${roomId}`,
            hostId: req.user._id,
            participants: [req.user._id]
        });

        // Log Activity
        await Activity.create({
            user: req.user._id,
            type: 'CREATE_ROOM',
            roomId: roomId,
            roomName: room.title,
            details: `Created new workspace ${roomId}`
        });

        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Join an existing room
// @route   POST /api/rooms/join/:roomId
// @access  Private
export const joinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findOne({ roomId: roomId.toUpperCase() });

        if (!room) {
            res.status(404);
            throw new Error('Room not found');
        }

        // Add user to participants if they aren't already in it
        if (!room.participants.includes(req.user._id)) {
            room.participants.push(req.user._id);
            await room.save();
        }

        // Log Activity
        await Activity.create({
            user: req.user._id,
            type: 'JOIN_ROOM',
            roomId: roomId,
            roomName: room.roomId === 'INTERNAL_TEST' ? 'Getting Started' : `Project ${room.roomId}`,
            details: `Joined workspace ${room.roomId}`
        });

        res.status(200).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
// @access  Private
export const getRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findOne({ roomId: roomId.toUpperCase() })
            .populate('hostId', 'name email avatar')
            .populate('participants', 'name email avatar');

        if (!room) {
            res.status(404);
            throw new Error('Room not found');
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Save room canvas state
// @route   PUT /api/rooms/:roomId/save
// @access  Private
export const saveRoomCanvas = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { canvasState } = req.body;

        const room = await Room.findOne({ roomId: roomId.toUpperCase() });

        if (!room) {
            res.status(404);
            throw new Error('Room not found');
        }

        room.canvasState = canvasState;
        room.markModified('canvasState');
        await room.save();

        res.status(200).json({ message: 'Canvas saved successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// @desc    Get user's rooms
// @route   GET /api/rooms
// @access  Private
export const getUserRooms = async (req, res) => {
    const { archived } = req.query;
    try {
        const rooms = await Room.find({
            $or: [
                { hostId: req.user._id },
                { participants: req.user._id }
            ],
            isArchived: archived === 'true'
        })
            .populate('hostId', 'name email')
            .sort({ updatedAt: -1 });

        res.status(200).json(rooms);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Apply a template to a room
// @route   POST /api/rooms/template
// @access  Private
export const applyTemplate = async (req, res) => {
    const { roomId, templateType } = req.body;
    try {
        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        let elements = [];
        if (templateType === 'Agile Board') {
            elements = [
                { id: 't1', type: 'text', x: 100, y: 50, text: 'BACKLOG', fontSize: 24, fill: '#4F46E5', draggable: false },
                { id: 't2', type: 'text', x: 450, y: 50, text: 'IN PROGRESS', fontSize: 24, fill: '#4F46E5', draggable: false },
                { id: 't3', type: 'text', x: 800, y: 50, text: 'DONE', fontSize: 24, fill: '#4F46E5', draggable: false },
                { id: 's1', type: 'sticky', x: 100, y: 120, width: 200, height: 200, fill: '#FEF3C7', text: 'Define Requirements', draggable: true },
                { id: 's2', type: 'sticky', x: 450, y: 120, width: 200, height: 200, fill: '#E0E7FF', text: 'Design System', draggable: true }
            ];
        } else if (templateType === 'Wireframing') {
            elements = [
                { id: 'w1', type: 'rect', x: 100, y: 100, width: 800, height: 600, stroke: '#64748b', strokeWidth: 2, fill: '#f8fafc', draggable: true },
                { id: 'w2', type: 'rect', x: 100, y: 100, width: 800, height: 60, fill: '#f1f5f9', draggable: false },
                { id: 'w3', type: 'text', x: 130, y: 120, text: 'Dashboard Prototype', fontSize: 18, fill: '#475569', draggable: false }
            ];
        } else if (templateType === 'User Journey') {
            elements = [
                { id: 'j1', type: 'rect', x: 100, y: 200, width: 150, height: 100, fill: '#EEF2FF', cornerRadius: 8, stroke: '#4F46E5', draggable: true, text: 'Awareness' },
                { id: 'j2', type: 'rect', x: 350, y: 200, width: 150, height: 100, fill: '#EEF2FF', cornerRadius: 8, stroke: '#4F46E5', draggable: true, text: 'Consideration' },
                { id: 'j3', type: 'arrow', points: [250, 250, 350, 250], stroke: '#4F46E5', strokeWidth: 2, draggable: true }
            ];
        }

        room.canvasState = elements;
        room.markModified('canvasState');
        await room.save();

        // Log Activity
        await Activity.create({
            user: req.user._id,
            type: 'UPDATE_ROOM',
            roomId: roomId,
            roomName: room.roomId === 'INTERNAL_TEST' ? 'Getting Started' : `Project ${room.roomId}`,
            details: `Applied ${templateType} template`
        });

        res.status(200).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get organization-wide stats
// @route   GET /api/rooms/stats
// @access  Private
export const getOrganizationStats = async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments({
            $or: [{ hostId: req.user._id }, { participants: req.user._id }]
        });

        const activeActivities = await Activity.countDocuments({
            user: req.user._id,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        res.status(200).json({
            totalActiveSessions: totalRooms,
            activeProjects: Math.ceil(totalRooms * 0.75),
            completionRate: 82,
            recentActivityCount: activeActivities
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Archive a room
// @route   PUT /api/rooms/archive/:roomId
// @access  Private
export const archiveRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        room.isArchived = true;
        await room.save();

        await Activity.create({
            user: req.user._id,
            type: 'ARCHIVE_ROOM',
            roomId: room.roomId,
            roomName: `Project ${room.roomId}`,
            details: `Archived workspace ${room.roomId}`
        });

        res.status(200).json({ message: 'Room archived' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Restore a room
// @route   PUT /api/rooms/restore/:roomId
// @access  Private
export const restoreRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        room.isArchived = false;
        await room.save();

        await Activity.create({
            user: req.user._id,
            type: 'RESTORE_ROOM',
            roomId: room.roomId,
            roomName: `Project ${room.roomId}`,
            details: `Restored workspace ${room.roomId}`
        });

        res.status(200).json({ message: 'Room restored' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Rename a room
// @route   PUT /api/rooms/rename/:roomId
// @access  Private
export const renameRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { title } = req.body;

        if (!title) {
            res.status(400);
            throw new Error('Title is required');
        }

        const room = await Room.findOne({ roomId: roomId.toUpperCase() });

        if (!room) {
            res.status(404);
            throw new Error('Room not found');
        }

        // Only host can rename
        if (room.hostId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Only the host can rename this room');
        }

        room.title = title;
        await room.save();

        res.status(200).json(room);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:roomId
// @access  Private
export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        await Room.deleteOne({ roomId: req.params.roomId });

        res.status(200).json({ message: 'Room deleted permanently' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
