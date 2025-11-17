/**
 * Tests for fading logic helper functions
 */

import { getStepNumbersToHide, getCurrentStepNumber, isStepHidden } from "@/lib/fadingLogic";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ ${message}`);
}

function arrayEquals<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((val, idx) => val === b[idx]);
}

console.log("\n=== TESTING FADING LOGIC ===\n");

// TEST 1: Forward mode - basic progression
console.log("TEST 1: Forward mode - 5 steps progression");
const totalSteps = 5;

let hidden = getStepNumbersToHide(totalSteps, 0, "forward");
assert(arrayEquals(hidden, [1,2,3,4,5]), "Step 0: Hide all [1,2,3,4,5]");

hidden = getStepNumbersToHide(totalSteps, 1, "forward");
assert(arrayEquals(hidden, [2,3,4,5]), "Step 1: Hide [2,3,4,5] (reveal 1)");

hidden = getStepNumbersToHide(totalSteps, 2, "forward");
assert(arrayEquals(hidden, [3,4,5]), "Step 2: Hide [3,4,5] (reveal 1-2)");

hidden = getStepNumbersToHide(totalSteps, 3, "forward");
assert(arrayEquals(hidden, [4,5]), "Step 3: Hide [4,5] (reveal 1-3)");

hidden = getStepNumbersToHide(totalSteps, 4, "forward");
assert(arrayEquals(hidden, [5]), "Step 4: Hide [5] (reveal 1-4)");

hidden = getStepNumbersToHide(totalSteps, 5, "forward");
assert(arrayEquals(hidden, []), "Step 5: Hide [] (reveal all - complete)");

console.log("\n");

// TEST 2: Backward mode - basic progression
console.log("TEST 2: Backward mode - 5 steps progression");

hidden = getStepNumbersToHide(totalSteps, 0, "backward");
assert(arrayEquals(hidden, [5]), "Step 0: Hide [5] (reveal 1-4)");

hidden = getStepNumbersToHide(totalSteps, 1, "backward");
assert(arrayEquals(hidden, [4,5]), "Step 1: Hide [4,5] (reveal 1-3)");

hidden = getStepNumbersToHide(totalSteps, 2, "backward");
assert(arrayEquals(hidden, [3,4,5]), "Step 2: Hide [3,4,5] (reveal 1-2)");

hidden = getStepNumbersToHide(totalSteps, 3, "backward");
assert(arrayEquals(hidden, [2,3,4,5]), "Step 3: Hide [2,3,4,5] (reveal 1)");

hidden = getStepNumbersToHide(totalSteps, 4, "backward");
assert(arrayEquals(hidden, [1,2,3,4,5]), "Step 4: Hide [1,2,3,4,5] (reveal none)");

hidden = getStepNumbersToHide(totalSteps, 5, "backward");
assert(arrayEquals(hidden, []), "Step 5: Hide [] (complete)");

console.log("\n");

// TEST 3: getCurrentStepNumber - forward mode
console.log("TEST 3: getCurrentStepNumber - forward mode");

const uniqueSteps = [1, 2, 3, 4, 5];

let current = getCurrentStepNumber(0, uniqueSteps, "forward");
assert(current === 1, "Forward step 0: Current step is 1");

current = getCurrentStepNumber(1, uniqueSteps, "forward");
assert(current === 2, "Forward step 1: Current step is 2");

current = getCurrentStepNumber(4, uniqueSteps, "forward");
assert(current === 5, "Forward step 4: Current step is 5");

current = getCurrentStepNumber(5, uniqueSteps, "forward");
assert(current === null, "Forward step 5: Complete (null)");

console.log("\n");

// TEST 4: getCurrentStepNumber - backward mode
console.log("TEST 4: getCurrentStepNumber - backward mode");

current = getCurrentStepNumber(0, uniqueSteps, "backward");
assert(current === 5, "Backward step 0: Current step is 5 (last)");

current = getCurrentStepNumber(1, uniqueSteps, "backward");
assert(current === 4, "Backward step 1: Current step is 4");

current = getCurrentStepNumber(4, uniqueSteps, "backward");
assert(current === 1, "Backward step 4: Current step is 1 (first)");

current = getCurrentStepNumber(5, uniqueSteps, "backward");
assert(current === null, "Backward step 5: Complete (null)");

console.log("\n");

// TEST 5: isStepHidden helper
console.log("TEST 5: isStepHidden helper function");

// Forward mode, step index 2 (showing 1-2, hiding 3-5)
assert(isStepHidden(1, 2, 5, "forward") === false, "Forward step 2: Step 1 NOT hidden");
assert(isStepHidden(2, 2, 5, "forward") === false, "Forward step 2: Step 2 NOT hidden");
assert(isStepHidden(3, 2, 5, "forward") === true, "Forward step 2: Step 3 IS hidden");
assert(isStepHidden(5, 2, 5, "forward") === true, "Forward step 2: Step 5 IS hidden");

// Backward mode, step index 2 (showing 1-2, hiding 3-5)
assert(isStepHidden(1, 2, 5, "backward") === false, "Backward step 2: Step 1 NOT hidden");
assert(isStepHidden(2, 2, 5, "backward") === false, "Backward step 2: Step 2 NOT hidden");
assert(isStepHidden(3, 2, 5, "backward") === true, "Backward step 2: Step 3 IS hidden");
assert(isStepHidden(5, 2, 5, "backward") === true, "Backward step 2: Step 5 IS hidden");

console.log("\n");

// TEST 6: Edge cases
console.log("TEST 6: Edge cases");

// Single step card
hidden = getStepNumbersToHide(1, 0, "forward");
assert(arrayEquals(hidden, [1]), "Single step - forward step 0: Hide [1]");

hidden = getStepNumbersToHide(1, 1, "forward");
assert(arrayEquals(hidden, []), "Single step - forward step 1: Complete");

hidden = getStepNumbersToHide(1, 0, "backward");
assert(arrayEquals(hidden, [1]), "Single step - backward step 0: Hide [1]");

hidden = getStepNumbersToHide(1, 1, "backward");
assert(arrayEquals(hidden, []), "Single step - backward step 1: Complete");

// Three step card
hidden = getStepNumbersToHide(3, 0, "forward");
assert(arrayEquals(hidden, [1,2,3]), "3 steps - forward step 0: Hide all");

hidden = getStepNumbersToHide(3, 1, "forward");
assert(arrayEquals(hidden, [2,3]), "3 steps - forward step 1: Hide [2,3]");

hidden = getStepNumbersToHide(3, 0, "backward");
assert(arrayEquals(hidden, [3]), "3 steps - backward step 0: Hide [3]");

hidden = getStepNumbersToHide(3, 1, "backward");
assert(arrayEquals(hidden, [2,3]), "3 steps - backward step 1: Hide [2,3]");

console.log("\n");

// TEST 7: Visual verification - forward vs backward
console.log("TEST 7: Visual comparison - forward vs backward");
console.log("\nCard with 5 steps:");
console.log("\nFORWARD MODE:");
for (let i = 0; i <= 5; i++) {
  const hidden = getStepNumbersToHide(5, i, "forward");
  const shown = [1,2,3,4,5].filter(s => !hidden.includes(s));
  console.log(`  Step ${i}: Show [${shown.join(",")}] | Hide [${hidden.join(",")}]`);
}

console.log("\nBACKWARD MODE:");
for (let i = 0; i <= 5; i++) {
  const hidden = getStepNumbersToHide(5, i, "backward");
  const shown = [1,2,3,4,5].filter(s => !hidden.includes(s));
  console.log(`  Step ${i}: Show [${shown.join(",")}] | Hide [${hidden.join(",")}]`);
}

console.log("\n=== ALL FADING LOGIC TESTS PASSED ✅ ===\n");
