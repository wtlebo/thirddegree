import { getVertexAI, getGenerativeModel } from "firebase/vertexai";
import { app } from "./analytics";
import type { Puzzle } from "../types";

// Initialize Vertex AI
const vertexAI = getVertexAI(app);

// Use Gemini 2.0 Flash (active model as of Dec 2025)
const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });

export const generatePuzzles = async (theme: string): Promise<Puzzle[]> => {
    const prompt = `
    You are a Puzzle Master for a word game. 
    Generate 5 distinct puzzles based on the theme: "${theme}".
    
    Constraints:
    1. Each puzzle must have a "clue" and an "answer".
    2. The "answer" must be a word or a short phrase.
    3. MAX LENGTH: Answer must be 30 characters or less.
    4. CONTENTS: Answers must contain ONLY letters and spaces. No numbers or special characters.
    5. No words in the answer should correspond to words in the clue (don't use the answer in the definition).
    6. WORD COUNT: Answers should generally be 1-4 words.
    7. Answers should not repeat words from other answers in this set.
    8. CLUE LENGTH: Clues must be short and witty, max 100 characters.

    Output STRICT JSON format:
    [
        { "clue": "...", "answer": "..." },
        ...
    ]
    Do not wrap in markdown code blocks. Just valid JSON.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up markdown if AI adds it despite instructions
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const generated = JSON.parse(cleanText);

        if (!Array.isArray(generated) || generated.length !== 5) {
            throw new Error("AI returned invalid format");
        }

        // Post-process to ensure uppercase and simple reveal order placeholder
        return generated.map((p: any) => ({
            clue: p.clue,
            answer: p.answer.toUpperCase().replace(/[^A-Z ]/g, ''),
            revealOrder: [] // Will be calculated by UI or save logic
        }));

    } catch (error: any) {
        console.error("Error generating puzzles:", error);

        const msg = error.message || '';
        if (msg.includes('403') || msg.includes('billing')) {
            throw new Error("Billing must be enabled on the Firebase project to use AI features. Please switch to the Blaze plan.");
        }
        if (msg.includes('404')) {
            throw new Error("AI Model not found. This might be a version issue.");
        }

        throw error;
    }
};

export const generateSinglePuzzle = async (theme: string, existingAnswers: string[]): Promise<Puzzle> => {
    const prompt = `
    You are a Puzzle Master for a word game. 
    Generate EXACTLY ONE puzzle based on the theme: "${theme}".
    
    Constraints:
    1. EXCLUSIONS: The answer MUST NOT be any of these words: ${JSON.stringify(existingAnswers)}.
    2. Answer must be a word or a short phrase, MAX 30 characters.
    3. Answer must contain ONLY letters and spaces.
    4. Answer must generally be 1-4 words.
    5. No words in the answer should correspond to words in the clue.
    6. Clue must be short and witty, max 100 characters.

    Output STRICT JSON format for a SINGLE object:
    { "clue": "...", "answer": "..." }
    Do not wrap in markdown code blocks. Just valid JSON.
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const generated = JSON.parse(cleanText);

        if (!generated.clue || !generated.answer) {
            throw new Error("AI returned invalid format");
        }

        return {
            clue: generated.clue,
            answer: generated.answer.toUpperCase().replace(/[^A-Z ]/g, ''),
            revealOrder: []
        };
    } catch (error: any) {
        console.error("Error generating single puzzle:", error);
        throw error;
    }
};
