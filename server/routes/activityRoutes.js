import express from 'express';
import Activity from '../models/activityModel.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get recent activities
// @route   GET /api/activity
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const activities = await Activity.find({})
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(activities);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
