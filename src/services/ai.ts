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

export const generateIdeaList = async (topic: string): Promise<string[]> => {
    const prompt = `
    Persona: You are a helpful creative assistant.
    TASK: Generate a list of 20 items related to the topic: "${topic}".
    These items are intended to inspire puzzle answers (short phrases, famous people, things, etc.).
    
    Return strict JSON array of strings:
    ["Item 1", "Item 2", ...]
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error generating idea list:", error);
        return [];
    }
};

export const generateHistoryEvents = async (date: string, existingEvents: string[] = []): Promise<{ event: string, link: string }[]> => {
    // Convert YYYY-MM-DD to "Month Day"
    const dateObj = new Date(date + 'T12:00:00');
    const readableDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const prompt = `
    Persona: You are a historian.
    TASK: List 10 notable historical events that happened on ${readableDate} (in any year).
    
    EXCLUDE: Do NOT include birthdays or recurring holidays/observances.
    EXCLUDE: Do NOT include any of these: ${JSON.stringify(existingEvents)}
    
    Structure the response as a valid JSON array of objects:
    [
        { "event": "Description of event (Year)", "link": "https://en.wikipedia.org/wiki/..." },
        ...
    ]
    Ensure the links are valid Wikipedia URLs if possible.
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }
        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed)) return parsed;
        return [];
    } catch (error) {
        console.error("Error generating history events:", error);
        return [];
    }
};

export const generateBirthdays = async (date: string, existing: string[] = []): Promise<{ event: string, link: string }[]> => {
    // Convert YYYY-MM-DD to "Month Day" (e.g. "January 2") to avoid year confusion
    const dateObj = new Date(date + 'T12:00:00'); // T12 to avoid timezone shift
    const readableDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const prompt = `
    Persona: You are a strict fact-checker and trivia expert.
    TASK: List 10 REAL, FAMOUS people born on ${readableDate}.
    
    CRITICAL RULES:
    1. VERIFY that the person was actually born on ${readableDate}. Do NOT guess.
    2. Do NOT include fictional characters unless specified.
    3. EXCLUDE: ${JSON.stringify(existing)}
    
    Structure the response as a valid JSON array of objects:
    [
        { "event": "Name (Birth Year) - Short description", "link": "https://en.wikipedia.org/wiki/..." },
        ...
    ]
    Example: { "event": "Isaac Asimov (1920) - American writer and professor of biochemistry", "link": "https://en.wikipedia.org/wiki/Isaac_Asimov" }
    
    Ensure the links are valid Wikipedia URLs.
    `;

    try {
        console.log(`Searching birthdays for ${date}...`);
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Birthdays Raw AI Response:", text);

        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        // Robust extraction: find the outer brackets
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }
        const parsed = JSON.parse(cleanText);

        if (Array.isArray(parsed)) {
            console.log("Parsed birthdays:", parsed.length);
            return parsed;
        }
        console.warn("Birthdays parsed result is not an array:", parsed);
        return [];
    } catch (error) {
        console.error("Error generating birthdays:", error);
        return [];
    }
};

export const generateNationalDays = async (date: string, existing: string[] = []): Promise<{ event: string, link: string }[]> => {
    // Convert YYYY-MM-DD to "Month Day" to avoid year confusion
    const dateObj = new Date(date + 'T12:00:00');
    const readableDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const prompt = `
    Persona: You are a fan of fun holidays and observances.
    TASK: List 10 "National Days", international observances, or fun holidays that fall on ${readableDate}.
    
    EXCLUDE: Do NOT include any of these: ${JSON.stringify(existing)}
    
    Structure the response as a valid JSON array of objects:
    [
        { "event": "Holiday Name", "link": "https://en.wikipedia.org/wiki/..." },
        ...
    ]
    Ensure the links are valid Wikipedia URLs if possible.
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }
        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed)) return parsed;
        return [];
    } catch (error) {
        console.error("Error generating national days:", error);
        return [];
    }
};
