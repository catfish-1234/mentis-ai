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
        console.error('Firebase Admin Initialization Error:', error);
    }
}

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
        try {
            await admin.auth().verifyIdToken(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const { prompt, history, fileData, reasoningMode, subject, langInstruction, socraticMode, mimeType } = req.body;

        // Input Validation
        if (prompt && prompt.length > 5000) {
            return res.status(400).json({ error: 'Bad Request: Prompt exceeds 5000 characters' });
        }

        if (fileData) {
            // Calculate approximate byte size of base64 string
            const sizeInBytes = (fileData.length * 3) / 4;
            if (sizeInBytes > 2 * 1024 * 1024) {
                return res.status(400).json({ error: 'Bad Request: File size exceeds 2MB limit' });
            }
        }

        // Prepare system instruction
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
            if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error');
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
            if (!response.ok) throw new Error(data.error?.message || 'Groq API Error');
            return res.status(200).json({ text: data.choices[0].message.content });
        }
    } catch (error) {
        console.error('API Route Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
