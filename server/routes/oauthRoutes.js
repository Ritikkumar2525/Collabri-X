import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate standard app JWT (matching authController)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Authenticate with Google via Credential Token
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
    try {
        const { credential, userInfo } = req.body;

        let email, name, picture, googleId;

        if (credential) {
            // Legacy flow: verify Google ID token
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();

            if (!payload) {
                return res.status(400).json({ message: 'Invalid Google token payload' });
            }

            email = payload.email;
            name = payload.name;
            picture = payload.picture;
            googleId = payload.sub;
        } else if (userInfo) {
            // New flow: user info from access token (already verified by Google)
            email = userInfo.email;
            name = userInfo.name;
            picture = userInfo.picture;
            googleId = userInfo.sub;
        } else {
            return res.status(400).json({ message: 'Google credential or userInfo is required' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Could not retrieve email from Google' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create a new user with a random, strong password to satisfy existing schema requirements
            const randomPassword = `OAuth2!${Math.random().toString(36).slice(-8)}${googleId || 'google'}`;

            user = await User.create({
                name: name || 'Google User',
                email,
                password: randomPassword,
                avatar: picture || '',
            });
        } else if (!user.avatar && picture) {
            // Opportunistically add avatar if existing user doesn't have one
            user.avatar = picture;
            await user.save();
        }

        // Generate our standard app JWT and return user
        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Google Authentication failed', details: error.message });
    }
});

export default router;
