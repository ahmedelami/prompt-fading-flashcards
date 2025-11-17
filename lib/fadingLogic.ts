import { FadingMode } from "@/types";

/**
 * Determines which steps should be hidden based on fading mode
 *
 * Forward Fading:
 * - Start with all steps hidden
 * - Progressively reveal from step 1 onwards
 * - Step index 0 = hide all, 1 = show step 1, 2 = show steps 1-2, etc.
 *
 * Backward Fading:
 * - Start with only the last step hidden
 * - Progressively hide more steps going backward
 * - Step index 0 = hide last step only, 1 = hide last 2 steps, etc.
 */
export function getStepNumbersToHide(
  totalSteps: number,
  currentStepIndex: number,
  mode: FadingMode = "forward"
): number[] {
  // Card complete - nothing hidden
  if (currentStepIndex >= totalSteps) {
    return [];
  }

  // Get all unique step numbers (1, 2, 3, ...)
  const allSteps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  if (mode === "forward") {
    // Forward: Hide steps AFTER currentStepIndex
    // Index 0: hide [1,2,3,4,5] (all)
    // Index 1: hide [2,3,4,5] (reveal 1)
    // Index 2: hide [3,4,5] (reveal 1-2)
    return allSteps.filter(step => step > currentStepIndex);
  } else {
    // Backward: Hide steps FROM END
    // Index 0: hide [5] (reveal 1-4)
    // Index 1: hide [4,5] (reveal 1-3)
    // Index 2: hide [3,4,5] (reveal 1-2)
    const numStepsToHide = currentStepIndex + 1;
    const startHidingFrom = totalSteps - numStepsToHide + 1;
    return allSteps.filter(step => step >= startHidingFrom);
  }
}

/**
 * Determines if a specific step number should be hidden
 */
export function isStepHidden(
  stepNumber: number,
  currentStepIndex: number,
  totalSteps: number,
  mode: FadingMode = "forward"
): boolean {
  const hiddenSteps = getStepNumbersToHide(totalSteps, currentStepIndex, mode);
  return hiddenSteps.includes(stepNumber);
}

/**
 * Gets the current step number being revealed
 */
export function getCurrentStepNumber(
  currentStepIndex: number,
  uniqueSteps: number[],
  mode: FadingMode = "forward"
): number | null {
  if (currentStepIndex >= uniqueSteps.length) {
    return null; // All steps complete
  }

  if (mode === "forward") {
    // Forward: revealing step at currentStepIndex
    // Index 0 → revealing step 1
    // Index 1 → revealing step 2
    return uniqueSteps[currentStepIndex];
  } else {
    // Backward: revealing step from the end
    // Index 0 → revealing last step
    // Index 1 → revealing second-to-last step
    const reverseIndex = uniqueSteps.length - currentStepIndex - 1;
    return uniqueSteps[reverseIndex];
  }
}
