import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines if passed via environment variables
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    : undefined,
            }),
        });
    } catch (error) {
        // Log only the error type, never the credentials
        console.error('Firebase Admin Initialization Error:', error.code || 'UNKNOWN');
    }
}

// ── Rate Limiter ──────────────────────────────────────────────────────
// In-memory sliding-window rate limiter. Resets on cold starts, which is
// acceptable for a serverless environment — persistent rate limiting
// would require Redis or a database.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_AUTHENTICATED = 30;    // requests per minute
const RATE_LIMIT_ANONYMOUS = 10;        // requests per minute

function isRateLimited(uid, isAnonymous) {
    const now = Date.now();
    const limit = isAnonymous ? RATE_LIMIT_ANONYMOUS : RATE_LIMIT_AUTHENTICATED;

    if (!rateLimitMap.has(uid)) {
        rateLimitMap.set(uid, []);
    }

    const timestamps = rateLimitMap.get(uid);
    // Remove entries outside the window
    while (timestamps.length > 0 && timestamps[0] <= now - RATE_LIMIT_WINDOW_MS) {
        timestamps.shift();
    }

    if (timestamps.length >= limit) {
        return true;
    }

    timestamps.push(now);
    return false;
}

// ── Input Validation ──────────────────────────────────────────────────
const VALID_SUBJECTS = ['Math', 'Physics', 'Chemistry', 'History', 'Biology', 'Literature', 'Coding', 'General'];
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_PROMPT_LENGTH = 5000;
const MAX_HISTORY_ENTRIES = 50;
const MAX_HISTORY_CONTENT_LENGTH = 10000;

function validateInputs(body) {
    const { prompt, history, fileData, reasoningMode, subject, langInstruction, socraticMode, mimeType } = body;

    // Subject must be in allow-list
    if (subject && !VALID_SUBJECTS.includes(subject)) {
        return 'Invalid subject';
    }

    // Prompt must be a string within length limit
    if (prompt !== undefined && prompt !== null) {
        if (typeof prompt !== 'string') return 'Prompt must be a string';
        if (prompt.length > MAX_PROMPT_LENGTH) return `Prompt exceeds ${MAX_PROMPT_LENGTH} characters`;
    }

    // Boolean fields must be booleans
    if (reasoningMode !== undefined && typeof reasoningMode !== 'boolean') return 'reasoningMode must be a boolean';
    if (socraticMode !== undefined && typeof socraticMode !== 'boolean') return 'socraticMode must be a boolean';

    // MIME type must be in allow-list (when file data is present)
    if (fileData && mimeType && !VALID_MIME_TYPES.includes(mimeType)) {
        return 'Unsupported file type';
    }

    // History must be an array with valid entries, capped
    if (history !== undefined && history !== null) {
        if (!Array.isArray(history)) return 'History must be an array';
        if (history.length > MAX_HISTORY_ENTRIES) return `History exceeds ${MAX_HISTORY_ENTRIES} entries`;

        for (const entry of history) {
            if (!entry || typeof entry !== 'object') return 'Invalid history entry';
            if (!['user', 'assistant', 'system', 'model'].includes(entry.role)) return 'Invalid history entry role';
            if (typeof entry.content !== 'string') return 'Invalid history entry content';
            if (entry.content.length > MAX_HISTORY_CONTENT_LENGTH) return 'History entry content too long';
        }
    }

    // langInstruction: only allow the expected format pattern
    if (langInstruction && typeof langInstruction === 'string') {
        // Must match the pattern from i18n.ts or be empty
        const langPattern = /^\n\nIMPORTANT: You MUST respond entirely in .+ \([a-z]{2}\)\. All explanations, examples, and text should be in .+\.$/;
        if (!langPattern.test(langInstruction)) {
            return 'Invalid language instruction';
        }
    }

    // File size enforcement (server-side)
    if (fileData) {
        if (typeof fileData !== 'string') return 'fileData must be a string';
        const sizeInBytes = (fileData.length * 3) / 4;
        if (sizeInBytes > 2 * 1024 * 1024) return 'File size exceeds 2MB limit';
    }

    return null; // valid
}

// ── Main Handler ──────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Auth Guard
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
        } catch (error) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Rate limiting based on UID and auth type
        const uid = decodedToken.uid;
        const isAnonymous = decodedToken.firebase?.sign_in_provider === 'anonymous';

        if (isRateLimited(uid, isAnonymous)) {
            return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
        }

        // Input validation
        const validationError = validateInputs(req.body);
        if (validationError) {
            return res.status(400).json({ error: `Bad Request: ${validationError}` });
        }

        const { prompt, history, fileData, reasoningMode, subject, langInstruction, socraticMode, mimeType } = req.body;

        // Prepare system instruction (subject is now validated against allow-list)
        let basePrompt = `You are an expert Tutor specialized in ${subject || 'general topics'}. IMPORTANT: Always use proper grammar, spelling, and formatting. Never use typos.`;

        if (reasoningMode) {
            basePrompt += `

MODE: Deep Reasoning
- Think through the problem step by step before answering.
- Wrap your internal reasoning in <thinking> tags.
- After your reasoning, provide a clear, well-structured final answer.
- Show mathematical derivations, logical deductions, and analytical steps.
- Consider edge cases and alternative approaches.
- Be thorough but organized in your reasoning.
- Format: <thinking>your step-by-step reasoning here</thinking> followed by the final answer.`;
        } else if (socraticMode) {
            basePrompt += `

MODE: Socratic Tutor
- NEVER give the answer directly unless the student has tried and explicitly asks for it.
- Guide the student through leading questions to help them discover the answer.
- Identify where the student is struggling and ask probing questions about that specific area.
- Be patient, encouraging, and supportive.
- After the student understands, offer to create practice problems for the areas they struggled with.
- Start by asking what they already know about the topic.
- If they're stuck, give small hints instead of answers.`;
        } else {
            basePrompt += `

MODE: Direct Answer
- Provide the answer immediately with a clear, concise explanation.
- Show your work/reasoning step by step.
- Be efficient and to the point.
- Use examples when helpful.`;
        }

        if (subject === 'Math') basePrompt += ' Use LaTeX for math equations.';
        if (subject === 'Coding') basePrompt += ' Provide clean, commented code snippets.';
        if (langInstruction) basePrompt += langInstruction;

        // Traffic Router
        if (fileData) {
            // Call Gemini 1.5 Flash
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: basePrompt }] },
                    contents: [
                        ...(history || []),
                        {
                            role: 'user',
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: mimeType || 'image/jpeg',
                                        data: fileData
                                    }
                                }
                            ]
                        }
                    ]
                })
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('Gemini API Error:', data.error?.message);
                throw new Error('AI service temporarily unavailable');
            }
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        } else {
            // Call Groq (Llama-3.3)
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: basePrompt },
                        ...(history || []),
                        { role: 'user', content: prompt }
                    ],
                    temperature: reasoningMode ? 0.3 : 0.7,
                    max_tokens: reasoningMode ? 2048 : 1024
                })
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('Groq API Error:', data.error?.message);
                throw new Error('AI service temporarily unavailable');
            }
            return res.status(200).json({ text: data.choices[0].message.content });
        }
    } catch (error) {
        console.error('API Route Error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
