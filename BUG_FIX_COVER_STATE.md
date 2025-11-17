# Bug Fix: Cover State Persistence

## Bug Description
When creating covers in the ImageEditor, if the user canceled and tried to create a new card, the `currentStepNumber` would continue from where it left off instead of resetting to 1.

**Example:**
1. User loads image A
2. User creates 3 covers (steps 1, 2, 3)
3. User clicks "Cancel"
4. User loads image B
5. First cover shows step 4 instead of step 1 ❌

## Root Cause
The `currentStepNumber` and `covers` state variables persisted across component unmounts/remounts because the `useEffect` that loaded the image didn't reset the state when `imageData` changed.

## Fix
Added state reset to the `imageData` useEffect dependency:

```typescript
useEffect(() => {
  const img = new Image();
  img.onload = () => {
    setImageSize({ width: img.width, height: img.height });
  };
  img.src = imageData;

  // Reset state when new image is loaded
  setCovers([]);
  setCurrentStepNumber(1);
}, [imageData]);
```

## Files Changed
- `components/ImageEditor.tsx` - Added state reset in useEffect

## Tests Created
- `tests/image-editor-state.test.ts` - Comprehensive test suite covering:
  - State reset on new image load
  - Cover creation logic
  - Grouping behavior (G key)
  - Undo functionality
  - Regression tests for the bug
  - Edge cases (rapid cycles, save/create cycles)

## Verification
The fix ensures:
- ✅ Each new image starts with step 1
- ✅ Covers array is empty for new images
- ✅ State doesn't persist between different images
- ✅ Multiple cancel/reload cycles work correctly
