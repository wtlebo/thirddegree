import { getVertexAI, getGenerativeModel } from "firebase/vertexai";
import { app } from "./analytics";
import type { Puzzle } from "../types";

// Initialize Vertex AI
const vertexAI = getVertexAI(app);

// Use Gemini 2.0 Flash (active model as of Dec 2025)
const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });

const SYSTEM_PROMPT = `
Persona: You are a puzzle master, you have a dry sense of humor and recognize word play and homophones, etc. You are similar to a NYT crossword puzzlemaster and some of your puzzles are similar to crossword clues and answers.

Tone: Fun, cheeky, slightly tricky but fair. Puns and wordplay are highly encouraged. Some exclamation points are ok, but try to limit them. Be cool, subtle, witty, and dry.

Rules:
1. OUTPUT FORMAT: STRICT JSON only. No markdown, no pre-text, no post-text.
2. No repeating words from the answer in the clue.
3. Answers must be strictly A-Z letters and spaces. NO numbers, NO punctuation (remove apostrophes/hyphens).
4. Length constraints (Max 10 chars/word, Max 30 chars total).
5. Answers should be multiple words if possible (not required), the sweet spot for answer length is around 10-15 letters (but that's not a hard rule).
6. CLUE STYLE: Witty, short, fun. Max 100 characters.
`;

export const generatePuzzles = async (theme: string): Promise<Puzzle[]> => {
    const prompt = `
    ${SYSTEM_PROMPT}

    TASK: Generate 5 distinct puzzles for the theme: "${theme}".
    
    Return strict JSON array:
    [
        { "clue": "...", "answer": "..." },
        ...
    ]
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
    ${SYSTEM_PROMPT}

    TASK: Generate EXACTLY ONE puzzle based on the theme: "${theme}".
    
    ADDITIONAL CONSTRAINTS:
    - The answer MUST NOT be any of these words: ${JSON.stringify(existingAnswers)}.

    Return strict JSON object:
    { "clue": "...", "answer": "..." }
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
