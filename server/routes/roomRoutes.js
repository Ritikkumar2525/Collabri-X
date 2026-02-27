import express from 'express';
import { createRoom, joinRoom, getRoom, saveRoomCanvas, getUserRooms, applyTemplate, getOrganizationStats, archiveRoom, restoreRoom, deleteRoom, renameRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getUserRooms);
router.get('/stats', protect, getOrganizationStats);
router.post('/template', protect, applyTemplate);
router.post('/create', protect, createRoom);
router.put('/archive/:roomId', protect, archiveRoom);
router.put('/restore/:roomId', protect, restoreRoom);
router.post('/join/:roomId', protect, joinRoom);
router.get('/:roomId', protect, getRoom);
router.delete('/:roomId', protect, deleteRoom);
router.put('/rename/:roomId', protect, renameRoom);
router.put('/:roomId/save', protect, saveRoomCanvas);

export default router;
