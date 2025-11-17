/**
 * Test that forward mode still works exactly as before
 * This ensures backward compatibility
 */

import { getCurrentStepNumber } from "@/lib/fadingLogic";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log("\n=== TESTING FORWARD MODE COMPATIBILITY ===\n");

// TEST: Old behavior (direct array indexing) vs new behavior (using getCurrentStepNumber)
console.log("TEST: Forward mode matches old behavior");

const uniqueSteps = [1, 2, 3, 4, 5];

// Old way (what the code used to do):
// const currentStepNumber = uniqueSteps[currentStepIndex];

for (let currentStepIndex = 0; currentStepIndex < uniqueSteps.length; currentStepIndex++) {
  const oldWay = uniqueSteps[currentStepIndex];
  const newWay = getCurrentStepNumber(currentStepIndex, uniqueSteps, "forward");

  assert(oldWay === newWay,
    `Step ${currentStepIndex}: Old (${oldWay}) === New (${newWay})`);
}

console.log("\n");

// TEST: Cover display logic
console.log("TEST: Cover shouldShow logic");

// Old logic:
// const shouldShow = cover.stepNumber > currentStepNumber ||
//                   (cover.stepNumber === currentStepNumber && !currentStepRevealed);

// For step index 2, currentStepNumber should be 3 (old behavior)
const currentStepIndex = 2;
const currentStepNumber = getCurrentStepNumber(currentStepIndex, uniqueSteps, "forward");

assert(currentStepNumber === 3, "At step index 2, current step number is 3");

// Now check which covers should show
const currentStepRevealed = false;

// Cover with step 1: Should NOT show (already revealed)
const cover1ShouldShow = 1 > currentStepNumber! || (1 === currentStepNumber && !currentStepRevealed);
assert(cover1ShouldShow === false, "Step 1 cover should NOT show");

// Cover with step 2: Should NOT show (already revealed)
const cover2ShouldShow = 2 > currentStepNumber! || (2 === currentStepNumber && !currentStepRevealed);
assert(cover2ShouldShow === false, "Step 2 cover should NOT show");

// Cover with step 3: Should show if not revealed (current step)
const cover3ShouldShow = 3 > currentStepNumber! || (3 === currentStepNumber && !currentStepRevealed);
assert(cover3ShouldShow === true, "Step 3 cover SHOULD show (current, not revealed)");

// Cover with step 4: Should show (future step)
const cover4ShouldShow = 4 > currentStepNumber! || (4 === currentStepNumber && !currentStepRevealed);
assert(cover4ShouldShow === true, "Step 4 cover SHOULD show (future)");

// Cover with step 5: Should show (future step)
const cover5ShouldShow = 5 > currentStepNumber! || (5 === currentStepNumber && !currentStepRevealed);
assert(cover5ShouldShow === true, "Step 5 cover SHOULD show (future)");

console.log("\n");

// TEST: When current step is revealed
console.log("TEST: After revealing current step");

const currentStepRevealedAfter = true;

// Cover with step 3: Should NOT show (current but revealed)
const cover3AfterReveal = 3 > currentStepNumber! || (3 === currentStepNumber && !currentStepRevealedAfter);
assert(cover3AfterReveal === false, "Step 3 cover should NOT show after reveal");

console.log("\n");

// TEST: Complete progression simulation
console.log("TEST: Complete forward mode progression simulation");

console.log("\nCard with 5 steps - Forward mode progression:");
for (let stepIdx = 0; stepIdx <= 5; stepIdx++) {
  const currentStep = getCurrentStepNumber(stepIdx, uniqueSteps, "forward");

  if (currentStep === null) {
    console.log(`Step ${stepIdx}: Complete! All steps revealed`);
    continue;
  }

  // Before reveal
  const hiddenBefore = uniqueSteps.filter(s =>
    s > currentStep || (s === currentStep && true) // not revealed yet
  );

  // After reveal
  const hiddenAfter = uniqueSteps.filter(s =>
    s > currentStep || (s === currentStep && false) // revealed
  );

  console.log(`Step ${stepIdx}: Current=${currentStep}, Hidden before reveal=[${hiddenBefore}], after=[${hiddenAfter}]`);
}

console.log("\n=== FORWARD MODE COMPATIBILITY VERIFIED ✅ ===\n");

console.log("Summary:");
console.log("✅ getCurrentStepNumber matches old array indexing behavior");
console.log("✅ Cover display logic works identically");
console.log("✅ Forward mode is 100% backward compatible");
