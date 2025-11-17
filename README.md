# Flashcard App - Image Occlusion Flashcards

A web-based flashcard application for creating image-based flashcards with sequential covers/occlusions.

## Features

- **Deck Management**: Create multiple named decks
- **Image Import**: Drag-and-drop, paste from clipboard, or browse for images
- **Cover Creation**: Draw rectangular covers over images in sequence
- **Sequential Review**: Review cards by revealing covers one step at a time
- **Smart Queue**: Wrong answers move cards to the back of the queue
- **Persistence**: All data saved to browser localStorage

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

### Creating a Deck

1. Click "Create New Deck"
2. Enter a name for your deck
3. Click "Create"

### Adding Cards

1. Select a deck and click "Edit"
2. Add an image by:
   - Dragging and dropping an image file
   - Pasting from clipboard (Cmd/Ctrl + V)
   - Clicking the dropzone to browse files
3. Draw covers:
   - Click and drag to create rectangular covers
   - Each cover is numbered in sequence (Step 1, Step 2, etc.)
   - Click "Undo Last Cover" to remove the last cover
4. Click "Add Card" to save the card to your deck

### Reviewing Cards

1. Select a deck and click "Review"
2. Use keyboard controls:
   - **SPACE**: Reveal the current step / Mark as correct and move to next step
   - **B**: Mark as wrong and move card to back of queue
3. Progress:
   - Cards are shown in creation order
   - Wrong answers move the entire card to the back
   - Session completes when all cards are answered correctly in one run

### Card Queue Logic

- Cards are presented in the order they were created
- If you get a card wrong, it moves to the very back of the queue
- The queue structure: `[Failed cards] → [Unseen cards]`
- **NO RANDOMNESS** - everything stays in strict order

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS**
- **localStorage** for persistence

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

Or use any static hosting service that supports Next.js.
