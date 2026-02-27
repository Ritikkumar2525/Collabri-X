import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMedia } from '../controllers/mediaController.js';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname.replace(/ /g, '_')}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter(req, file, cb) {
        const filetypes = /jpe?g|png|webp|gif|svg|pdf/;
        const mimetypes = /image\/jpe?g|image\/png|image\/webp|image\/gif|image\/svg\+xml|application\/pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = mimetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images and PDFs only!'));
        }
    }
});

const router = express.Router();

router.post('/upload', protect, upload.single('media'), uploadMedia);

export default router;
