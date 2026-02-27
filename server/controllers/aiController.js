import OpenAI from 'openai';
import NodeCache from 'node-cache';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';

// Initialize Cache (1 hour TTL)
const aiCache = new NodeCache({ stdTTL: 3600 });

// Simple Async Queue to prevent hitting free tier rate limits
class AsyncQueue {
    constructor(concurrency = 1) {
        this.concurrency = concurrency;
        this.running = 0;
        this.queue = [];
    }

    add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const res = await task();
                    resolve(res);
                } catch (err) {
                    reject(err);
                }
            });
            this.next();
        });
    }

    next() {
        if (this.running >= this.concurrency || this.queue.length === 0) return;
        this.running++;
        const nextTask = this.queue.shift();
        nextTask().finally(() => {
            this.running--;
            this.next();
        });
    }
}

const aiQueue = new AsyncQueue(1); // Lock strictly to 1 concurrent request for free-tier

const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is missing from server .env file');
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// @desc    Summarize array of texts (e.g., sticky notes)
// @route   POST /api/ai/summarize
// @access  Private
export const summarizeText = asyncHandler(async (req, res) => {
    const { texts } = req.body;
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        res.status(400);
        throw new Error('Please provide an array of text strings to summarize');
    }

    const combinedText = texts.join('\n---\n');
    // Generate simple cache key
    const cacheKey = `summary_${Buffer.from(combinedText).toString('base64').substring(0, 50)}`;

    const cached = aiCache.get(cacheKey);
    if (cached) {
        return res.status(200).json({ summary: cached });
    }

    const openai = getOpenAIClient();

    const task = async () => {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a concise summarization assistant. Summarize the following notes into a single clear, actionable paragraph.' },
                { role: 'user', content: combinedText }
            ],
            temperature: 0.5,
            max_tokens: 250
        });
        return response.choices[0].message.content.trim();
    };

    const summary = await aiQueue.add(task);
    aiCache.set(cacheKey, summary);

    res.status(200).json({ summary });
});


// @desc    Generate diagram elements explicitly structured for Konva 
// @route   POST /api/ai/generate-diagram
// @access  Private
export const generateDiagram = asyncHandler(async (req, res) => {
    const { prompt, startX = 100, startY = 100 } = req.body;
    if (!prompt) {
        res.status(400);
        throw new Error('Please provide a prompt to generate a diagram');
    }

    const cacheKey = `diagram_${prompt.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = aiCache.get(cacheKey);
    if (cached) {
        // Remap new UUIDs to cached items to avoid collisions on multiple requests
        const freshElements = JSON.parse(cached).map(el => ({ ...el, id: uuidv4() }));
        return res.status(200).json({ elements: freshElements });
    }

    const openai = getOpenAIClient();

    const systemPrompt = `
You are a diagram generator for a React-Konva object-oriented whiteboard.
Output ONLY a strict JSON array of objects representing the generated Diagram based on the user's prompt. Do NOT wrap in markdown \`\`\` tags.
Each object must follow this schema:
{
  "id": "generate unique string",
  "type": "rectangle" | "circle" | "line" | "triangle" | "star",
  "x": number,
  "y": number,
  "color": "Use standard modern color hexes like #2563eb",
  "strokeWidth": 2,
  "isFinished": true
}
For 'rectangle', 'circle', 'triangle', 'star': Must include 'points' property as an array [startX, startY, endX, endY]. 
For 'line': 'points' as array [x1, y1, x2, y2].
Layout nodes logically, branching out starting around (${startX}, ${startY}). Keep shapes sized ~ 100x100px.
    `;

    const task = async () => {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 1000
        });

        let content = response.choices[0].message.content.trim();
        if (content.startsWith('\`\`\`json')) {
            content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (content.startsWith('\`\`\`')) {
            content = content.replace(/\`\`\`/g, '').trim();
        }

        return JSON.parse(content);
    };

    let elements;
    try {
        elements = await aiQueue.add(task);
    } catch (err) {
        // Fallback for LLM parsing errors
        console.error("LLM Parsing Failure", err);
        res.status(500);
        throw new Error("Failed to generate a valid diagram format from AI. Please try a simpler prompt.");
    }

    // Cache the stringified version
    aiCache.set(cacheKey, JSON.stringify(elements));

    // Enforce final structure requirements
    const mappedElements = elements.map(el => ({
        ...el,
        id: uuidv4(),
        isFinished: true
    }));

    res.status(200).json({ elements: mappedElements });
});


// @desc    Analyze layout and provide structural/design feedback
// @route   POST /api/ai/feedback
// @access  Private
export const getDesignFeedback = asyncHandler(async (req, res) => {
    const { elements } = req.body;
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
        res.status(400);
        throw new Error('Please provide canvas elements to analyze');
    }

    // Hash the first 20 object positions to avoid full huge payloads overcaching but keep basic cache
    const cacheKey = `feedback_${Buffer.from(JSON.stringify(elements.slice(0, 20))).toString('base64').substring(0, 30)}`;
    const cached = aiCache.get(cacheKey);
    if (cached) {
        return res.status(200).json({ feedback: cached });
    }

    const openai = getOpenAIClient();

    // Map object to basic string to keep LLM context window low
    const simplifiedElements = elements.map(el => {
        return `Type: ${el.type}, Pos: (${Math.round(el.x)}, ${Math.round(el.y)}), Color: ${el.color}`;
    });

    const systemPrompt = `
You are an expert UX/UI and architecture Designer.
Analyze this list of whiteboard canvas elements indicating their type, position, and color.
Provide 3 short, actionable bullet points to improve the design.
Maybe suggest aligning things, changing colors for contrast, or adding missing components (like "Add a sticky note for context", or "Align the rectangles horizontally").
Be very concise. Max 3 bullets.
    `;

    const task = async () => {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Canvas Elements:\n${simplifiedElements.join('\n')}` }
            ],
            temperature: 0.6,
            max_tokens: 200
        });
        return response.choices[0].message.content.trim();
    };

    const feedback = await aiQueue.add(task);
    aiCache.set(cacheKey, feedback);

    res.status(200).json({ feedback });
});

// @desc    Analyze activity logs and provided a humanized summary
// @route   POST /api/ai/analyze-activity
// @access  Private
export const analyzeActivity = asyncHandler(async (req, res) => {
    const { logs } = req.body;
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
        return res.status(200).json({ summary: "No recent activity to report. Your workspace is waiting for the next big idea!" });
    }

    const openai = getOpenAIClient();

    const activityContext = logs.map(log => `${log.user}: ${log.action} at ${new Date(log.timestamp).toLocaleTimeString()}`).join('\n');

    const systemPrompt = `
You are a project manager assistant.
Analyze the following activity logs from a collaborative whiteboard.
Provide a 2-sentence summary of what has been happening today and what the main focus seems to be.
Be encouraging and professional.
    `;

    const task = async () => {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Activity Logs:\n${activityContext}` }
            ],
            temperature: 0.7,
            max_tokens: 200
        });
        return response.choices[0].message.content.trim();
    };

    const summary = await aiQueue.add(task);
    res.status(200).json({ summary });
});

// @desc    Generate a set of sticky notes for brainstorming
// @route   POST /api/ai/brainstorm
// @access  Private
export const generateBrainstorm = asyncHandler(async (req, res) => {
    const { prompt, startX = 200, startY = 200 } = req.body;
    if (!prompt) {
        res.status(400);
        throw new Error('Please provide a brainstorming prompt');
    }

    const openai = getOpenAIClient();

    const systemPrompt = `
You are a brainstorming assistant. 
Generate 4-6 distinct, creative sticky notes based on the user's prompt.
Output ONLY a strict JSON array of objects. Do NOT wrap in markdown tags.
Each object must follow this schema:
{
  "id": "unique string",
  "type": "sticky",
  "x": number,
  "y": number,
  "color": "Use soft pastel colors like #fef08a, #dcfce7, #dbeafe, #f3e8ff, #ffedd5",
  "text": "The creative idea",
  "stickyShape": "rounded" | "circle",
  "width": 180,
  "height": 180
}
Scatter the notes loosely around the starting coordinates (${startX}, ${startY}).
    `;

    const task = async () => {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 1000
        });

        let content = response.choices[0].message.content.trim();
        if (content.startsWith('\`\`\`json')) {
            content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (content.startsWith('\`\`\`')) {
            content = content.replace(/\`\`\`/g, '').trim();
        }

        return JSON.parse(content);
    };

    try {
        const stickies = await aiQueue.add(task);
        const mappedStickies = stickies.map(s => ({
            ...s,
            id: uuidv4(),
            isFinished: true
        }));
        res.status(200).json({ stickies: mappedStickies });
    } catch (err) {
        console.error("Brainstorming LLM Failure", err);
        res.status(500);
        throw new Error("Failed to generate brainstorm stickies. Please try a different prompt.");
    }
});
// @desc    General chat with AI Assistant
// @route   POST /api/ai/chat
// @access  Private
export const chatWithAI = asyncHandler(async (req, res) => {
    const { message, context = "" } = req.body;
    if (!message) {
        res.status(400);
        throw new Error('Please provide a message');
    }

    const openai = getOpenAIClient();

    const systemPrompt = `
You are an intelligent, professional, and helpful whiteboard assistant named "AI Pilot".
You help users with project management, idea generation, and canvas organization.
Keep answers concise and actionable. If the user asks to generate something, suggest specific types of sticky notes or diagrams.
Context: ${context}
    `;

    const task = async () => {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 500
        });
        return response.choices[0].message.content.trim();
    };

    const reply = await aiQueue.add(task);
    res.status(200).json({ reply });
});
