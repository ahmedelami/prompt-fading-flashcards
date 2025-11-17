"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Deck, Card, ReviewState, FadingMode } from "@/types";
import { storage } from "@/lib/storage";
import { getCurrentStepNumber } from "@/lib/fadingLogic";

interface ReviewModeProps {
  deck: Deck;
  onBack: () => void;
  mode?: "main" | "later";
  onSaveForLater?: (cardId: string) => void;
  onMergeToMain?: () => void;
  globalFadingMode: FadingMode;
}

export default function ReviewMode({ deck, onBack, mode = "main", onSaveForLater, onMergeToMain, globalFadingMode }: ReviewModeProps) {
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);
  const [currentStepRevealed, setCurrentStepRevealed] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Initialize or load review state based on mode
    let state;

    if (mode === "later") {
      state = storage.getLaterReviewState(deck.id);
      if (!state || state.queue.length === 0) {
        // Start new later review session (empty)
        state = {
          deckId: deck.id,
          queue: [],
          currentCardId: null,
          currentStepIndex: 0,
          completedCards: [],
          cardProgress: {},
        };
      } else {
        // Existing later queue - ensure currentCardId is set
        if (!state.currentCardId && state.queue.length > 0) {
          state.currentCardId = state.queue[0];
          state.currentStepIndex = 0;
        }
        // Initialize cardProgress if missing (backward compatibility)
        if (!state.cardProgress) {
          state.cardProgress = {};
        }
        // Load progress for current card
        if (state.currentCardId) {
          state.currentStepIndex = state.cardProgress[state.currentCardId] || 0;
        }
      }
      setReviewState(state);
      storage.saveLaterReviewState(state);
    } else {
      state = storage.getReviewState(deck.id);
      if (!state || state.queue.length === 0) {
        // Start new review session
        state = {
          deckId: deck.id,
          queue: deck.cards.map((c) => c.id),
          currentCardId: deck.cards[0]?.id || null,
          currentStepIndex: 0,
          completedCards: [],
          cardProgress: {},
        };
      } else {
        // Initialize cardProgress if missing (backward compatibility)
        if (!state.cardProgress) {
          state.cardProgress = {};
        }
        // Load progress for current card
        if (state.currentCardId) {
          state.currentStepIndex = state.cardProgress[state.currentCardId] || 0;
        }
      }
      setReviewState(state);
      storage.saveReviewState(state);
    }
  }, [deck.id, mode]);

  const currentCard = reviewState?.currentCardId
    ? deck.cards.find((c) => c.id === reviewState.currentCardId)
    : null;

  useEffect(() => {
    if (currentCard) {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = currentCard.imageData;
    }
  }, [currentCard?.id]);

  const saveState = useCallback((state: ReviewState) => {
    if (mode === "later") {
      storage.saveLaterReviewState(state);
    } else {
      storage.saveReviewState(state);
    }
  }, [mode]);

  const clearState = useCallback(() => {
    if (mode === "later") {
      storage.clearLaterReviewState(deck.id);
    } else {
      storage.clearReviewState(deck.id);
    }
  }, [mode, deck.id]);

  const handleSpace = useCallback(() => {
    if (!reviewState || !currentCard) return;

    if (!currentStepRevealed) {
      // Reveal current step
      setCurrentStepRevealed(true);
    } else {
      // Get unique step numbers sorted
      const uniqueSteps = [...new Set(currentCard.covers.map(c => c.stepNumber))].sort((a, b) => a - b);
      const currentStepNumber = uniqueSteps[reviewState.currentStepIndex];

      // Move to next step or complete card
      if (reviewState.currentStepIndex < uniqueSteps.length - 1) {
        // Save progress for this card
        const newCardProgress = {
          ...reviewState.cardProgress,
          [currentCard.id]: reviewState.currentStepIndex + 1,
        };

        // Move card to back of queue
        const newQueue = [
          ...reviewState.queue.filter((id) => id !== currentCard.id),
          currentCard.id,
        ];

        // Move to next card
        const nextCardId = newQueue[0];
        const nextCardProgress = newCardProgress[nextCardId] || 0;

        const newState = {
          ...reviewState,
          queue: newQueue,
          currentCardId: nextCardId,
          currentStepIndex: nextCardProgress,
          cardProgress: newCardProgress,
        };
        setReviewState(newState);
        saveState(newState);
        setCurrentStepRevealed(false);
      } else {
        // Card completed - remove from queue
        const newQueue = reviewState.queue.filter((id) => id !== currentCard.id);
        const newCompletedCards = [...reviewState.completedCards, currentCard.id];

        if (newQueue.length === 0) {
          // Session complete!
          clearState();
          setReviewState({
            ...reviewState,
            queue: [],
            currentCardId: null,
            completedCards: newCompletedCards,
          });
        } else {
          const newState = {
            ...reviewState,
            queue: newQueue,
            currentCardId: newQueue[0],
            currentStepIndex: reviewState.cardProgress?.[newQueue[0]] || 0,
            completedCards: newCompletedCards,
          };
          setReviewState(newState);
          saveState(newState);
          setCurrentStepRevealed(false);
        }
      }
    }
  }, [reviewState, currentCard, currentStepRevealed, deck.id, saveState, clearState]);

  const handleWrong = useCallback(() => {
    if (!reviewState || !currentCard || !currentStepRevealed) return;

    // Reset progress for this card
    const newCardProgress = {
      ...reviewState.cardProgress,
      [currentCard.id]: 0,
    };

    // Move current card to back of queue
    const newQueue = [
      ...reviewState.queue.filter((id) => id !== currentCard.id),
      currentCard.id,
    ];

    // Move to next card and load its progress
    const nextCardId = newQueue[0];
    const nextCardProgress = newCardProgress[nextCardId] || 0;

    const newState = {
      ...reviewState,
      queue: newQueue,
      currentCardId: nextCardId,
      currentStepIndex: nextCardProgress,
      cardProgress: newCardProgress,
    };

    setReviewState(newState);
    saveState(newState);
    setCurrentStepRevealed(false);
  }, [reviewState, currentCard, currentStepRevealed, saveState]);

  const handleSaveForLater = useCallback(() => {
    if (!reviewState || !currentCard || !onSaveForLater) return;

    // Remove card from current queue
    const newQueue = reviewState.queue.filter((id) => id !== currentCard.id);

    // Call the callback to add to later queue
    onSaveForLater(currentCard.id);

    if (newQueue.length === 0) {
      // No more cards in main queue
      clearState();
      setReviewState({
        ...reviewState,
        queue: [],
        currentCardId: null,
      });
    } else {
      const newState = {
        ...reviewState,
        queue: newQueue,
        currentCardId: newQueue[0],
        currentStepIndex: 0,
      };
      setReviewState(newState);
      saveState(newState);
      setCurrentStepRevealed(false);
    }
  }, [reviewState, currentCard, onSaveForLater, deck.id, saveState, clearState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        handleSpace();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        handleWrong();
      } else if (e.key === "1") {
        e.preventDefault();
        handleWrong();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSpace, handleWrong]);

  const handleRestart = () => {
    const newState: ReviewState = {
      deckId: deck.id,
      queue: deck.cards.map((c) => c.id),
      currentCardId: deck.cards[0]?.id || null,
      currentStepIndex: 0,
      completedCards: [],
    };
    setReviewState(newState);
    storage.saveReviewState(newState);
    setCurrentStepRevealed(false);
  };

  const getDisplayCoords = (cover: { x: number; y: number; width: number; height: number }) => {
    const img = imageRef.current;
    if (!img) return cover;

    const scaleX = img.clientWidth / imageSize.width;
    const scaleY = img.clientHeight / imageSize.height;

    return {
      x: cover.x * scaleX,
      y: cover.y * scaleY,
      width: cover.width * scaleX,
      height: cover.height * scaleY,
    };
  };

  if (!reviewState || !currentCard) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">{deck.name} - Review</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Decks
          </button>
        </div>
        {deck.cards.length === 0 ? (
          <p className="text-gray-500">No cards in this deck. Add some cards first!</p>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Session Complete!</h2>
            <p className="mb-6">You got all cards correct!</p>
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start New Session
            </button>
          </div>
        )}
      </div>
    );
  }

  const uniqueSteps = [...new Set(currentCard.covers.map(c => c.stepNumber))].sort((a, b) => a - b);
  // Use global fading mode instead of per-session mode
  const currentStepNumber = getCurrentStepNumber(reviewState.currentStepIndex, uniqueSteps, globalFadingMode);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{deck.name} - Review</h1>
          <p className="text-gray-600 mt-2">
            Step {reviewState.currentStepIndex + 1} of {uniqueSteps.length} | Cards
            remaining: {reviewState.queue.length} | Completed: {reviewState.completedCards.length}
          </p>
        </div>
        <div className="flex gap-2">
          {mode === "later" && onMergeToMain && (
            <button
              onClick={onMergeToMain}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Merge to Main Review
            </button>
          )}
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Restart Deck
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Exit Review
          </button>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
        <p className="text-sm font-medium mb-1">
          <strong>SPACE</strong> = {currentStepRevealed ? "Got it right (next step)" : "Reveal current step"} |{" "}
          <strong>B or 1</strong> = Got it wrong (move card to back)
        </p>
        <p className="text-xs text-gray-700">
          Mode: <strong>{globalFadingMode === "forward" ? "Forward" : "Backward"}</strong> —{" "}
          {globalFadingMode === "forward"
            ? "Problem → Solution (reveal from beginning)"
            : "Solution → Problem (reveal from end)"}
        </p>
      </div>

      <div className="relative inline-block mb-6">
        <img
          ref={imageRef}
          src={currentCard.imageData}
          alt="Review card"
          className="max-w-full max-h-[70vh] select-none"
          draggable={false}
        />

        {currentCard.covers.map((cover) => {
          const shouldShow =
            cover.stepNumber > currentStepNumber ||
            (cover.stepNumber === currentStepNumber && !currentStepRevealed);

          if (!shouldShow) return null;

          const displayCoords = getDisplayCoords(cover);

          return (
            <div
              key={cover.id}
              className="absolute bg-black bg-opacity-70 border-2 border-white"
              style={{
                left: `${displayCoords.x}px`,
                top: `${displayCoords.y}px`,
                width: `${displayCoords.width}px`,
                height: `${displayCoords.height}px`,
              }}
            >
              {cover.stepNumber === currentStepNumber && (
                <div className="absolute top-1 left-1 bg-yellow-400 text-black px-2 py-1 text-xs font-bold rounded">
                  Step {cover.stepNumber}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={handleSpace}
          className="px-12 py-6 bg-green-600 text-white text-2xl font-bold rounded-lg hover:bg-green-700 shadow-lg"
        >
          ✓ Next
        </button>
        <button
          onClick={handleWrong}
          disabled={!currentStepRevealed}
          className={`px-12 py-6 text-white text-2xl font-bold rounded-lg shadow-lg transition-opacity ${
            currentStepRevealed
              ? "bg-red-600 hover:bg-red-700 opacity-100"
              : "bg-gray-400 cursor-not-allowed opacity-40"
          }`}
        >
          ✗ Wrong
        </button>
        {mode === "main" && onSaveForLater && (
          <button
            onClick={handleSaveForLater}
            className="px-12 py-6 bg-yellow-500 text-white text-2xl font-bold rounded-lg hover:bg-yellow-600 shadow-lg"
          >
            ⏸ Save for Later
          </button>
        )}
      </div>
    </div>
  );
}
