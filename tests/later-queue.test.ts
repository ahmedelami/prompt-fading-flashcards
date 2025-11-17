/**
 * Tests for "Save for Later" functionality
 *
 * These tests verify:
 * 1. Order preservation when saving cards for later
 * 2. Order preservation when merging later queue to main
 * 3. Duplicate prevention
 * 4. State consistency across operations
 */

import { LaterReviewState, ReviewState } from "@/types";

// Mock localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const localStorage = new LocalStorageMock();

// Mock storage implementation (mirrors lib/storage.ts)
const storage = {
  getReviewState(deckId: string): ReviewState | null {
    const data = localStorage.getItem(`review_state_${deckId}`);
    return data ? JSON.parse(data) : null;
  },

  saveReviewState(state: ReviewState): void {
    localStorage.setItem(`review_state_${state.deckId}`, JSON.stringify(state));
  },

  clearReviewState(deckId: string): void {
    localStorage.removeItem(`review_state_${deckId}`);
  },

  getLaterReviewState(deckId: string): LaterReviewState | null {
    const data = localStorage.getItem(`later_review_state_${deckId}`);
    if (!data) return null;

    const state: LaterReviewState = JSON.parse(data);

    // Clean up duplicates (mirrors the fix in storage.ts)
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
    localStorage.setItem(`later_review_state_${state.deckId}`, JSON.stringify(state));
  },

  clearLaterReviewState(deckId: string): void {
    localStorage.removeItem(`later_review_state_${deckId}`);
  },
};

// Simulate handleSaveForLater from app/page.tsx
function handleSaveForLater(deckId: string, cardId: string): void {
  const laterState = storage.getLaterReviewState(deckId);

  if (laterState) {
    // Add to existing later queue (only if not already there)
    if (!laterState.queue.includes(cardId)) {
      laterState.queue.push(cardId);
      // Set currentCardId if it's null (first card being added to active review)
      if (!laterState.currentCardId) {
        laterState.currentCardId = laterState.queue[0];
      }
      storage.saveLaterReviewState(laterState);
    }
  } else {
    // Create new later queue
    const newLaterState: LaterReviewState = {
      deckId: deckId,
      queue: [cardId],
      currentCardId: cardId,
      currentStepIndex: 0,
      completedCards: [],
    };
    storage.saveLaterReviewState(newLaterState);
  }
}

// Simulate handleMergeToMain from app/page.tsx
function handleMergeToMain(deckId: string): void {
  const mainState = storage.getReviewState(deckId);
  const laterState = storage.getLaterReviewState(deckId);

  if (!laterState) return;

  // Merge later queue to main queue
  if (mainState) {
    mainState.queue = [...mainState.queue, ...laterState.queue];
    storage.saveReviewState(mainState);
  } else {
    // No main state, convert later to main
    storage.saveReviewState({
      deckId: deckId,
      queue: laterState.queue,
      currentCardId: laterState.currentCardId || laterState.queue[0] || null,
      currentStepIndex: laterState.currentStepIndex,
      completedCards: laterState.completedCards,
    });
  }

  // Clear later state
  storage.clearLaterReviewState(deckId);
}

// Test utilities
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ ${message}`);
}

function arrayEquals<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((val, idx) => val === b[idx]);
}

// Run tests
console.log("\n=== RUNNING LATER QUEUE TESTS ===\n");

// TEST 1: Order preservation when saving cards for later
console.log("TEST 1: Order preservation when saving cards for later");
localStorage.clear();
const deckId = "test-deck-1";

handleSaveForLater(deckId, "card-A");
handleSaveForLater(deckId, "card-B");
handleSaveForLater(deckId, "card-C");

let laterState = storage.getLaterReviewState(deckId);
assert(laterState !== null, "Later state should exist");
assert(arrayEquals(laterState!.queue, ["card-A", "card-B", "card-C"]),
  "Later queue should preserve order: [card-A, card-B, card-C]");
assert(laterState!.currentCardId === "card-A",
  "Current card should be first card (card-A)");

console.log("\n");

// TEST 2: Duplicate prevention
console.log("TEST 2: Duplicate prevention");
localStorage.clear();

handleSaveForLater(deckId, "card-A");
handleSaveForLater(deckId, "card-B");
handleSaveForLater(deckId, "card-A"); // Try to add duplicate
handleSaveForLater(deckId, "card-C");
handleSaveForLater(deckId, "card-B"); // Try to add another duplicate

laterState = storage.getLaterReviewState(deckId);
assert(laterState!.queue.length === 3,
  "Queue should have 3 cards (duplicates prevented)");
assert(arrayEquals(laterState!.queue, ["card-A", "card-B", "card-C"]),
  "Queue should only contain unique cards in order");

console.log("\n");

// TEST 3: Merge to main - appends to end of main queue
console.log("TEST 3: Merge to main - appends to end of main queue");
localStorage.clear();

// Set up main review state with cards 1, 2, 3
const mainState: ReviewState = {
  deckId: deckId,
  queue: ["card-1", "card-2", "card-3"],
  currentCardId: "card-1",
  currentStepIndex: 0,
  completedCards: [],
};
storage.saveReviewState(mainState);

// Save cards A, B, C for later
handleSaveForLater(deckId, "card-A");
handleSaveForLater(deckId, "card-B");
handleSaveForLater(deckId, "card-C");

// Merge
handleMergeToMain(deckId);

const mergedMainState = storage.getReviewState(deckId);
assert(mergedMainState !== null, "Main state should exist after merge");
assert(arrayEquals(mergedMainState!.queue, ["card-1", "card-2", "card-3", "card-A", "card-B", "card-C"]),
  "Merged queue should be: [card-1, card-2, card-3, card-A, card-B, card-C]");
assert(mergedMainState!.currentCardId === "card-1",
  "Current card in main should remain unchanged (card-1)");

const laterStateAfterMerge = storage.getLaterReviewState(deckId);
assert(laterStateAfterMerge === null,
  "Later state should be cleared after merge");

console.log("\n");

// TEST 4: Merge when main queue is empty
console.log("TEST 4: Merge when main queue is empty");
localStorage.clear();

handleSaveForLater(deckId, "card-X");
handleSaveForLater(deckId, "card-Y");
handleSaveForLater(deckId, "card-Z");

handleMergeToMain(deckId);

const newMainState = storage.getReviewState(deckId);
assert(newMainState !== null, "Main state should be created from later state");
assert(arrayEquals(newMainState!.queue, ["card-X", "card-Y", "card-Z"]),
  "Main queue should contain all later cards in order");
assert(newMainState!.currentCardId === "card-X",
  "Current card should be first card from later queue");

console.log("\n");

// TEST 5: Automatic cleanup of corrupted data with duplicates
console.log("TEST 5: Automatic cleanup of corrupted data with duplicates");
localStorage.clear();

// Manually inject corrupted state with duplicates (simulating the bug)
const corruptedState: LaterReviewState = {
  deckId: deckId,
  queue: ["card-A", "card-B", "card-A", "card-C", "card-B", "card-A"],
  currentCardId: null,
  currentStepIndex: 0,
  completedCards: [],
};
localStorage.setItem(`later_review_state_${deckId}`, JSON.stringify(corruptedState));

// Read it back - should auto-clean
const cleanedState = storage.getLaterReviewState(deckId);
assert(cleanedState !== null, "Cleaned state should exist");
assert(cleanedState!.queue.length === 3,
  "Cleaned queue should have 3 unique cards");
assert(arrayEquals(cleanedState!.queue, ["card-A", "card-B", "card-C"]),
  "Cleaned queue should remove duplicates: [card-A, card-B, card-C]");
assert(cleanedState!.currentCardId === "card-A",
  "Current card should be set to first card after cleanup");

// Verify it was saved back to localStorage
const rereadState = storage.getLaterReviewState(deckId);
assert(rereadState!.queue.length === 3,
  "Cleaned state should persist in localStorage");

console.log("\n");

// TEST 6: Complex scenario - Save, review some, save more, merge
console.log("TEST 6: Complex scenario - Save, review some, save more, merge");
localStorage.clear();

// Initial main queue: cards 1-5
storage.saveReviewState({
  deckId: deckId,
  queue: ["card-1", "card-2", "card-3", "card-4", "card-5"],
  currentCardId: "card-1",
  currentStepIndex: 0,
  completedCards: [],
});

// Save card-2 and card-4 for later (out of order)
handleSaveForLater(deckId, "card-2");
handleSaveForLater(deckId, "card-4");

// Simulate: user reviewed card-1 successfully, now on card-3
storage.saveReviewState({
  deckId: deckId,
  queue: ["card-3", "card-5"], // card-2 and card-4 already removed
  currentCardId: "card-3",
  currentStepIndex: 0,
  completedCards: ["card-1"],
});

// User saves card-3 for later too
handleSaveForLater(deckId, "card-3");

// Update main state - card-3 removed from main queue
storage.saveReviewState({
  deckId: deckId,
  queue: ["card-5"], // Only card-5 left
  currentCardId: "card-5",
  currentStepIndex: 0,
  completedCards: ["card-1"],
});

// Check later queue order
laterState = storage.getLaterReviewState(deckId);
assert(arrayEquals(laterState!.queue, ["card-2", "card-4", "card-3"]),
  "Later queue should preserve save order: [card-2, card-4, card-3]");

// Now merge back to main
handleMergeToMain(deckId);

const finalMainState = storage.getReviewState(deckId);
assert(arrayEquals(finalMainState!.queue, ["card-5", "card-2", "card-4", "card-3"]),
  "Final merged queue: remaining main [card-5] + later [card-2, card-4, card-3]");

console.log("\n");

// TEST 7: CurrentCardId edge cases
console.log("TEST 7: CurrentCardId edge cases");
localStorage.clear();

// Manually create state with null currentCardId but non-empty queue (simulating old bug)
const edgeCaseState: LaterReviewState = {
  deckId: deckId,
  queue: ["card-P", "card-Q", "card-R"],
  currentCardId: null, // Bug: should be set
  currentStepIndex: 0,
  completedCards: [],
};
localStorage.setItem(`later_review_state_${deckId}`, JSON.stringify(edgeCaseState));

// Read it - should fix currentCardId
const fixedState = storage.getLaterReviewState(deckId);
assert(fixedState!.currentCardId === "card-P",
  "CurrentCardId should be auto-fixed to first card in queue");

console.log("\n");

console.log("=== ALL TESTS PASSED ✅ ===\n");

console.log("Summary:");
console.log("✅ Order is preserved when saving cards for later");
console.log("✅ Order is preserved when merging later queue to main");
console.log("✅ Duplicates are prevented when adding cards");
console.log("✅ Corrupted data with duplicates is auto-cleaned");
console.log("✅ Merge appends later cards to END of main queue (first saved = first reviewed)");
console.log("✅ CurrentCardId is properly maintained across all operations");
console.log("✅ Edge cases with null currentCardId are handled");
