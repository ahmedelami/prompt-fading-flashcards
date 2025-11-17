export interface Cover {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stepNumber: number;
}

export interface Card {
  id: string;
  imageData: string; // base64
  covers: Cover[];
  createdAt: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
}

export type FadingMode = "forward" | "backward";

export interface ReviewState {
  deckId: string;
  queue: string[]; // card IDs in review order
  currentCardId: string | null;
  currentStepIndex: number;
  completedCards: string[];
  fadingMode?: FadingMode; // Optional for backward compatibility, defaults to "forward"
  cardProgress?: Record<string, number>; // Track which step each card is on (cardId -> stepIndex)
}

export interface LaterReviewState {
  deckId: string;
  queue: string[]; // card IDs saved for later
  currentCardId: string | null;
  currentStepIndex: number;
  completedCards: string[];
  fadingMode?: FadingMode; // Optional for backward compatibility, defaults to "forward"
  cardProgress?: Record<string, number>; // Track which step each card is on (cardId -> stepIndex)
}
