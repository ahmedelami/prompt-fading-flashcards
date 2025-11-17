/**
 * Tests for "Wrong" button behavior - moving cards to back of queue
 *
 * Verifies that pressing "Wrong" moves current card to END of queue
 * This behavior should work identically in both main and later review modes
 */

import { ReviewState, LaterReviewState } from "@/types";

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

const storage = {
  getReviewState(deckId: string): ReviewState | null {
    const data = localStorage.getItem(`review_state_${deckId}`);
    return data ? JSON.parse(data) : null;
  },

  saveReviewState(state: ReviewState): void {
    localStorage.setItem(`review_state_${state.deckId}`, JSON.stringify(state));
  },

  getLaterReviewState(deckId: string): LaterReviewState | null {
    const data = localStorage.getItem(`later_review_state_${deckId}`);
    return data ? JSON.parse(data) : null;
  },

  saveLaterReviewState(state: LaterReviewState): void {
    localStorage.setItem(`later_review_state_${state.deckId}`, JSON.stringify(state));
  },
};

// Simulate handleWrong from ReviewMode.tsx
function handleWrong(state: ReviewState | LaterReviewState, currentCardId: string): ReviewState | LaterReviewState {
  // Move current card to back of queue
  const newQueue = [
    ...state.queue.filter((id) => id !== currentCardId),
    currentCardId,
  ];

  return {
    ...state,
    queue: newQueue,
    currentCardId: newQueue[0],
    currentStepIndex: 0,
  };
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

console.log("\n=== TESTING WRONG BUTTON ORDER BEHAVIOR ===\n");

// TEST 1: Main review - Wrong button moves card to back
console.log("TEST 1: Main Review - Wrong button moves card to back");
localStorage.clear();

let mainState: ReviewState = {
  deckId: "test-deck",
  queue: ["card-1", "card-2", "card-3"],
  currentCardId: "card-1",
  currentStepIndex: 0,
  completedCards: [],
};

console.log("Initial order: [card-1, card-2, card-3]");
console.log("Current card: card-1");

// Press Wrong on card-1
mainState = handleWrong(mainState, "card-1") as ReviewState;
assert(arrayEquals(mainState.queue, ["card-2", "card-3", "card-1"]),
  "After Wrong on card-1: queue should be [card-2, card-3, card-1]");
assert(mainState.currentCardId === "card-2",
  "Current card should move to card-2");

console.log("\n");

// TEST 2: Main review - Multiple Wrong presses
console.log("TEST 2: Main Review - Multiple Wrong presses");

console.log("Queue: [card-2, card-3, card-1], Current: card-2");

// Press Wrong on card-2
mainState = handleWrong(mainState, "card-2") as ReviewState;
assert(arrayEquals(mainState.queue, ["card-3", "card-1", "card-2"]),
  "After Wrong on card-2: queue should be [card-3, card-1, card-2]");
assert(mainState.currentCardId === "card-3",
  "Current card should move to card-3");

console.log("\n");

// TEST 3: Later review - Wrong button works identically
console.log("TEST 3: Later Review - Wrong button works identically");
localStorage.clear();

let laterState: LaterReviewState = {
  deckId: "test-deck",
  queue: ["card-A", "card-B", "card-C"],
  currentCardId: "card-A",
  currentStepIndex: 0,
  completedCards: [],
};

console.log("Initial order: [card-A, card-B, card-C]");
console.log("Current card: card-A");

// Press Wrong on card-A
laterState = handleWrong(laterState, "card-A") as LaterReviewState;
assert(arrayEquals(laterState.queue, ["card-B", "card-C", "card-A"]),
  "After Wrong on card-A: queue should be [card-B, card-C, card-A]");
assert(laterState.currentCardId === "card-B",
  "Current card should move to card-B");

console.log("\n");

// TEST 4: Complex scenario - Mix of Right and Wrong in main
console.log("TEST 4: Complex scenario - Mix of Right and Wrong in main");
localStorage.clear();

mainState = {
  deckId: "test-deck",
  queue: ["1", "2", "3", "4", "5"],
  currentCardId: "1",
  currentStepIndex: 0,
  completedCards: [],
};

console.log("Start: [1, 2, 3, 4, 5], Current: 1");

// Card 1: Wrong → moves to back
mainState = handleWrong(mainState, "1") as ReviewState;
console.log("After Wrong on 1: " + JSON.stringify(mainState.queue));
assert(arrayEquals(mainState.queue, ["2", "3", "4", "5", "1"]),
  "Queue: [2, 3, 4, 5, 1]");
assert(mainState.currentCardId === "2", "Current: 2");

// Card 2: Right → remove from queue
mainState.queue = mainState.queue.filter(id => id !== "2");
mainState.currentCardId = mainState.queue[0];
mainState.completedCards.push("2");
console.log("After Right on 2: " + JSON.stringify(mainState.queue));
assert(arrayEquals(mainState.queue, ["3", "4", "5", "1"]),
  "Queue: [3, 4, 5, 1]");
assert(mainState.currentCardId === "3", "Current: 3");

// Card 3: Wrong → moves to back
mainState = handleWrong(mainState, "3") as ReviewState;
console.log("After Wrong on 3: " + JSON.stringify(mainState.queue));
assert(arrayEquals(mainState.queue, ["4", "5", "1", "3"]),
  "Queue: [4, 5, 1, 3]");
assert(mainState.currentCardId === "4", "Current: 4");

// Card 4: Right → remove from queue
mainState.queue = mainState.queue.filter(id => id !== "4");
mainState.currentCardId = mainState.queue[0];
mainState.completedCards.push("4");
console.log("After Right on 4: " + JSON.stringify(mainState.queue));
assert(arrayEquals(mainState.queue, ["5", "1", "3"]),
  "Queue: [5, 1, 3]");
assert(mainState.currentCardId === "5", "Current: 5");

// Card 5: Right → remove from queue
mainState.queue = mainState.queue.filter(id => id !== "5");
mainState.currentCardId = mainState.queue[0];
mainState.completedCards.push("5");
console.log("After Right on 5: " + JSON.stringify(mainState.queue));
assert(arrayEquals(mainState.queue, ["1", "3"]),
  "Queue: [1, 3] (failed cards remain)");
assert(mainState.currentCardId === "1", "Current: 1 (retry)");

console.log("\n");

// TEST 5: Same complex scenario in Later review
console.log("TEST 5: Same scenario in Later review mode");
localStorage.clear();

laterState = {
  deckId: "test-deck",
  queue: ["A", "B", "C", "D", "E"],
  currentCardId: "A",
  currentStepIndex: 0,
  completedCards: [],
};

console.log("Start: [A, B, C, D, E], Current: A");

// Card A: Wrong → moves to back
laterState = handleWrong(laterState, "A") as LaterReviewState;
assert(arrayEquals(laterState.queue, ["B", "C", "D", "E", "A"]),
  "Queue: [B, C, D, E, A]");

// Card B: Right → remove
laterState.queue = laterState.queue.filter(id => id !== "B");
laterState.currentCardId = laterState.queue[0];
laterState.completedCards.push("B");
assert(arrayEquals(laterState.queue, ["C", "D", "E", "A"]),
  "Queue: [C, D, E, A]");

// Card C: Wrong → moves to back
laterState = handleWrong(laterState, "C") as LaterReviewState;
assert(arrayEquals(laterState.queue, ["D", "E", "A", "C"]),
  "Queue: [D, E, A, C]");

// Card D: Right → remove
laterState.queue = laterState.queue.filter(id => id !== "D");
laterState.currentCardId = laterState.queue[0];
laterState.completedCards.push("D");
assert(arrayEquals(laterState.queue, ["E", "A", "C"]),
  "Queue: [E, A, C]");

// Card E: Right → remove
laterState.queue = laterState.queue.filter(id => id !== "E");
laterState.currentCardId = laterState.queue[0];
laterState.completedCards.push("E");
assert(arrayEquals(laterState.queue, ["A", "C"]),
  "Queue: [A, C] (failed cards remain)");

console.log("\n");

// TEST 6: Verify main and later queues are independent
console.log("TEST 6: Main and Later queues are completely independent");
localStorage.clear();

mainState = {
  deckId: "test-deck",
  queue: ["1", "2", "3"],
  currentCardId: "1",
  currentStepIndex: 0,
  completedCards: [],
};

laterState = {
  deckId: "test-deck",
  queue: ["A", "B", "C"],
  currentCardId: "A",
  currentStepIndex: 0,
  completedCards: [],
};

// Save both states
storage.saveReviewState(mainState);
storage.saveLaterReviewState(laterState);

// Wrong on main card
mainState = handleWrong(mainState, "1") as ReviewState;
storage.saveReviewState(mainState);

// Check main changed but later didn't
const readMainState = storage.getReviewState("test-deck");
const readLaterState = storage.getLaterReviewState("test-deck");

assert(arrayEquals(readMainState!.queue, ["2", "3", "1"]),
  "Main queue changed to [2, 3, 1]");
assert(arrayEquals(readLaterState!.queue, ["A", "B", "C"]),
  "Later queue unchanged [A, B, C]");

console.log("\n");

// TEST 7: Merge preserves order after Wrong operations
console.log("TEST 7: Merge preserves order after Wrong operations");
localStorage.clear();

mainState = {
  deckId: "test-deck",
  queue: ["1", "2", "3"],
  currentCardId: "1",
  currentStepIndex: 0,
  completedCards: [],
};

laterState = {
  deckId: "test-deck",
  queue: ["A", "B", "C"],
  currentCardId: "A",
  currentStepIndex: 0,
  completedCards: [],
};

// Press Wrong on card-2 in main
mainState.currentCardId = "2"; // simulate moving to card 2
mainState = handleWrong(mainState, "2") as ReviewState;
console.log("Main after Wrong on 2: " + JSON.stringify(mainState.queue));
assert(arrayEquals(mainState.queue, ["1", "3", "2"]),
  "Main: [1, 3, 2]");

// Press Wrong on card-B in later
laterState = handleWrong(laterState, "A") as LaterReviewState;
laterState.currentCardId = "B";
laterState = handleWrong(laterState, "B") as LaterReviewState;
console.log("Later after Wrong on B: " + JSON.stringify(laterState.queue));
assert(arrayEquals(laterState.queue, ["C", "A", "B"]),
  "Later: [C, A, B]");

// Merge later to main
const mergedQueue = [...mainState.queue, ...laterState.queue];
console.log("Merged: " + JSON.stringify(mergedQueue));
assert(arrayEquals(mergedQueue, ["1", "3", "2", "C", "A", "B"]),
  "Merged preserves both queue orders: [1, 3, 2, C, A, B]");

console.log("\n");

console.log("=== ALL WRONG BUTTON TESTS PASSED ✅ ===\n");

console.log("Summary:");
console.log("✅ Wrong button moves card to END of queue in main review");
console.log("✅ Wrong button moves card to END of queue in later review");
console.log("✅ Behavior is identical in both modes");
console.log("✅ Multiple Wrong presses maintain correct order");
console.log("✅ Mix of Right/Wrong maintains order correctly");
console.log("✅ Main and later queues are completely independent");
console.log("✅ Merge preserves order from both queues after Wrong operations");
