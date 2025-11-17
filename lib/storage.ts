import { Deck, ReviewState } from "@/types";

const DECKS_KEY = "flashcard_decks";
const REVIEW_STATE_KEY = "review_state";

export const storage = {
  // Decks
  getDecks(): Deck[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(DECKS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveDeck(deck: Deck): void {
    const decks = this.getDecks();
    const index = decks.findIndex((d) => d.id === deck.id);
    if (index >= 0) {
      decks[index] = deck;
    } else {
      decks.push(deck);
    }
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  },

  deleteDeck(deckId: string): void {
    const decks = this.getDecks().filter((d) => d.id !== deckId);
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  },

  getDeck(deckId: string): Deck | null {
    return this.getDecks().find((d) => d.id === deckId) || null;
  },

  // Review State
  getReviewState(deckId: string): ReviewState | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(`${REVIEW_STATE_KEY}_${deckId}`);
    return data ? JSON.parse(data) : null;
  },

  saveReviewState(state: ReviewState): void {
    localStorage.setItem(`${REVIEW_STATE_KEY}_${state.deckId}`, JSON.stringify(state));
  },

  clearReviewState(deckId: string): void {
    localStorage.removeItem(`${REVIEW_STATE_KEY}_${deckId}`);
  },
};
