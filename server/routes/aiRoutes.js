import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { summarizeText, generateDiagram, getDesignFeedback, chatWithAI, analyzeActivity, generateBrainstorm } from '../controllers/aiController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting to protect the free tier OpenAI key
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 20, // Limit each IP to 20 AI requests per window
    message: { message: 'Too many AI requests from this IP, please try again after 15 minutes' }
});

router.post('/summarize', protect, aiLimiter, summarizeText);
router.post('/generate-diagram', protect, aiLimiter, generateDiagram);
router.post('/feedback', protect, aiLimiter, getDesignFeedback);
router.post('/chat', protect, aiLimiter, chatWithAI);
router.post('/analyze-activity', protect, aiLimiter, analyzeActivity);
router.post('/brainstorm', protect, aiLimiter, generateBrainstorm);

export default router;
