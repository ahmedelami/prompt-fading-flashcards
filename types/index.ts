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

export interface ReviewState {
  deckId: string;
  queue: string[]; // card IDs in review order
  currentCardId: string | null;
  currentStepIndex: number;
  completedCards: string[];
}
