import { Deck, ReviewState, LaterReviewState } from "@/types";

const DECKS_KEY = "flashcard_decks";
const REVIEW_STATE_KEY = "review_state";
const LATER_REVIEW_STATE_KEY = "later_review_state";

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

  // Later Review State
  getLaterReviewState(deckId: string): LaterReviewState | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(`${LATER_REVIEW_STATE_KEY}_${deckId}`);
    if (!data) return null;

    const state: LaterReviewState = JSON.parse(data);

    // Clean up duplicates (defensive programming for corrupted data)
    const uniqueQueue = [...new Set(state.queue)];
    let needsSave = false;

    if (uniqueQueue.length !== state.queue.length) {
      state.queue = uniqueQueue;
      needsSave = true;
    }

    // If currentCardId is null but queue has items, set it to first card
    if (!state.currentCardId && state.queue.length > 0) {
      state.currentCardId = state.queue[0];
      state.currentStepIndex = 0;
      needsSave = true;
    }

    // If currentCardId is not in the queue, reset it
    if (state.currentCardId && !state.queue.includes(state.currentCardId)) {
      state.currentCardId = state.queue[0] || null;
      state.currentStepIndex = 0;
      needsSave = true;
    }

    // Save if we made any corrections
    if (needsSave) {
      this.saveLaterReviewState(state);
    }

    return state;
  },

  saveLaterReviewState(state: LaterReviewState): void {
    // Ensure queue has no duplicates before saving
    state.queue = [...new Set(state.queue)];
    localStorage.setItem(`${LATER_REVIEW_STATE_KEY}_${state.deckId}`, JSON.stringify(state));
  },

  clearLaterReviewState(deckId: string): void {
    localStorage.removeItem(`${LATER_REVIEW_STATE_KEY}_${deckId}`);
  },
};
