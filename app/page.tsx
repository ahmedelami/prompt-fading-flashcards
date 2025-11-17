"use client";

import { useState, useEffect } from "react";
import { Deck, LaterReviewState, FadingMode } from "@/types";
import { storage } from "@/lib/storage";
import DeckList from "@/components/DeckList";
import AddCardsMode from "@/components/AddCardsMode";
import DeckEditor from "@/components/DeckEditor";
import ReviewMode from "@/components/ReviewMode";

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "add" | "edit" | "review" | "review-later">("list");
  const [refreshKey, setRefreshKey] = useState(0);
  const [globalFadingMode, setGlobalFadingMode] = useState<FadingMode>("forward");

  useEffect(() => {
    setDecks(storage.getDecks());
    // Load global fading mode preference from localStorage
    const savedMode = localStorage.getItem("globalFadingMode") as FadingMode;
    if (savedMode === "forward" || savedMode === "backward") {
      setGlobalFadingMode(savedMode);
    }
  }, []);

  const handleCreateDeck = (name: string) => {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name,
      cards: [],
      createdAt: Date.now(),
    };
    storage.saveDeck(newDeck);
    setDecks(storage.getDecks());
    setSelectedDeckId(newDeck.id);
    setMode("add");
  };

  const handleSelectDeck = (deckId: string, action: "add" | "edit" | "review" | "review-later") => {
    setSelectedDeckId(deckId);
    setMode(action);
  };

  const handleSaveForLater = (cardId: string) => {
    if (!selectedDeckId) return;

    const laterState = storage.getLaterReviewState(selectedDeckId);

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
        deckId: selectedDeckId,
        queue: [cardId],
        currentCardId: cardId, // Set the first card as current
        currentStepIndex: 0,
        completedCards: [],
      };
      storage.saveLaterReviewState(newLaterState);
    }
  };

  const handleMergeToMain = () => {
    if (!selectedDeckId) return;

    const mainState = storage.getReviewState(selectedDeckId);
    const laterState = storage.getLaterReviewState(selectedDeckId);

    if (!laterState) return;

    // Merge later queue to main queue
    if (mainState) {
      mainState.queue = [...mainState.queue, ...laterState.queue];
      storage.saveReviewState(mainState);
    } else {
      // No main state, convert later to main
      storage.saveReviewState({
        deckId: selectedDeckId,
        queue: laterState.queue,
        currentCardId: laterState.currentCardId || laterState.queue[0] || null,
        currentStepIndex: laterState.currentStepIndex,
        completedCards: laterState.completedCards,
      });
    }

    // Clear later state
    storage.clearLaterReviewState(selectedDeckId);

    // Switch to main review mode
    setMode("review");
  };

  const handleDeleteDeck = (deckId: string) => {
    storage.deleteDeck(deckId);
    setDecks(storage.getDecks());
  };

  const handleBackToList = () => {
    setMode("list");
    setSelectedDeckId(null);
    setDecks(storage.getDecks());
    // Force DeckList to re-render and check later counts
    setRefreshKey(prev => prev + 1);
  };

  const toggleGlobalFadingMode = () => {
    const newMode: FadingMode = globalFadingMode === "forward" ? "backward" : "forward";
    setGlobalFadingMode(newMode);
    localStorage.setItem("globalFadingMode", newMode);
  };

  const selectedDeck = selectedDeckId ? storage.getDeck(selectedDeckId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {mode === "list" && (
        <DeckList
          key={refreshKey}
          decks={decks}
          onCreateDeck={handleCreateDeck}
          onSelectDeck={handleSelectDeck}
          onDeleteDeck={handleDeleteDeck}
          globalFadingMode={globalFadingMode}
          onToggleFadingMode={toggleGlobalFadingMode}
        />
      )}
      {mode === "add" && selectedDeck && (
        <AddCardsMode deck={selectedDeck} onBack={handleBackToList} />
      )}
      {mode === "edit" && selectedDeck && (
        <DeckEditor deck={selectedDeck} onBack={handleBackToList} />
      )}
      {mode === "review" && selectedDeck && (
        <ReviewMode
          deck={selectedDeck}
          onBack={handleBackToList}
          mode="main"
          onSaveForLater={handleSaveForLater}
          globalFadingMode={globalFadingMode}
        />
      )}
      {mode === "review-later" && selectedDeck && (
        <ReviewMode
          deck={selectedDeck}
          onBack={handleBackToList}
          mode="later"
          onMergeToMain={handleMergeToMain}
          globalFadingMode={globalFadingMode}
        />
      )}
    </div>
  );
}
