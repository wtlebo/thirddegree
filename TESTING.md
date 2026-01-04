# Automated Testing Guide 🧪

This project uses **Vitest** for unit testing. It's fast, compatible with Vite, and uses the same API as Jest (`describe`, `it`, `expect`).

## How to Run Tests

- **Run all tests**: `npm test` (or `npx vitest run`)
- **Watch mode** (re-runs on save): `npx vitest`
- **UI mode**: `npx vitest --ui`

## What We Tested

We focused on the "Business Logic" that is critical for data integrity but easy to break with typos.

### 1. Schema Validation (`src/lib/schemas.test.ts`)
We use Zod to define what a "Puzzle" looks like. The tests ensure:
- Valid puzzles are accepted.
- Missing fields (like `clues`) are rejected.
- Data types (strings vs numbers) are enforced.

### 2. Puzzle Utils (`src/lib/puzzleUtils.test.ts`)
We extracted the `validatePuzzle` function from the `PuzzleEditor` component.
**Why?**
- **Testability**: We can test the logic without rendering the entire React component (which requires mocking databases, authentication, local storage, etc.).
- **Speed**: Pure function tests run in milliseconds.
- **Coverage**: We can easily test edge cases like "51 character answers" or "Invalid characters like @" without manually typing them into the UI.

## How to Add New Tests

1.  Create a file ending in `.test.ts` (for logic) or `.test.tsx` (for components).
2.  Import what you want to test.
3.  Write a `describe` block for the feature.
4.  Write `it` blocks for specific behaviors ("it should return true...").

Example:
```typescript
import { add } from './math';

describe('Math', () => {
  it('adds two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
});
```
