"use client";

import { useState, useEffect } from "react";
import { Deck } from "@/types";
import { storage } from "@/lib/storage";
import DeckList from "@/components/DeckList";
import AddCardsMode from "@/components/AddCardsMode";
import DeckEditor from "@/components/DeckEditor";
import ReviewMode from "@/components/ReviewMode";

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "add" | "edit" | "review">("list");

  useEffect(() => {
    setDecks(storage.getDecks());
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

  const handleSelectDeck = (deckId: string, action: "add" | "edit" | "review") => {
    setSelectedDeckId(deckId);
    setMode(action);
  };

  const handleDeleteDeck = (deckId: string) => {
    storage.deleteDeck(deckId);
    setDecks(storage.getDecks());
  };

  const handleBackToList = () => {
    setMode("list");
    setSelectedDeckId(null);
    setDecks(storage.getDecks());
  };

  const selectedDeck = selectedDeckId ? storage.getDeck(selectedDeckId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {mode === "list" && (
        <DeckList
          decks={decks}
          onCreateDeck={handleCreateDeck}
          onSelectDeck={handleSelectDeck}
          onDeleteDeck={handleDeleteDeck}
        />
      )}
      {mode === "add" && selectedDeck && (
        <AddCardsMode deck={selectedDeck} onBack={handleBackToList} />
      )}
      {mode === "edit" && selectedDeck && (
        <DeckEditor deck={selectedDeck} onBack={handleBackToList} />
      )}
      {mode === "review" && selectedDeck && (
        <ReviewMode deck={selectedDeck} onBack={handleBackToList} />
      )}
    </div>
  );
}
