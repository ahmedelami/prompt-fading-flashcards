import { useState } from "react";
import { Deck, FadingMode } from "@/types";
import { storage } from "@/lib/storage";

interface DeckListProps {
  decks: Deck[];
  onCreateDeck: (name: string) => void;
  onSelectDeck: (deckId: string, action: "add" | "edit" | "review" | "review-later") => void;
  onDeleteDeck: (deckId: string) => void;
  globalFadingMode: FadingMode;
  onToggleFadingMode: () => void;
}

export default function DeckList({
  decks,
  onCreateDeck,
  onSelectDeck,
  onDeleteDeck,
  globalFadingMode,
  onToggleFadingMode,
}: DeckListProps) {
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (newDeckName.trim()) {
      onCreateDeck(newDeckName.trim());
      setNewDeckName("");
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Flashcard Decks</h1>
        <button
          onClick={onToggleFadingMode}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
          title="Toggle between forward and backward fading mode (applies to all decks)"
        >
          {globalFadingMode === "forward" ? "Forward ▶" : "◀ Backward"} Mode
        </button>
      </div>

      <div className="mb-8">
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Deck
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Deck name..."
              className="px-4 py-2 border rounded flex-1"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewDeckName("");
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {decks.length === 0 ? (
          <p className="text-gray-500">No decks yet. Create one to get started!</p>
        ) : (
          decks.map((deck) => {
            const laterState = storage.getLaterReviewState(deck.id);
            const laterCount = laterState?.queue.length || 0;

            return (
              <div
                key={deck.id}
                className="bg-white p-4 rounded shadow flex justify-between items-center"
              >
                <div>
                  <h2 className="text-xl font-semibold">{deck.name}</h2>
                  <p className="text-gray-600 text-sm">
                    {deck.cards.length} card{deck.cards.length !== 1 ? "s" : ""}
                    {laterCount > 0 && (
                      <span className="ml-2 text-yellow-600 font-medium">
                        ({laterCount} saved for later)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                <button
                  onClick={() => onSelectDeck(deck.id, "add")}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Cards
                </button>
                <button
                  onClick={() => onSelectDeck(deck.id, "edit")}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Edit Cards
                </button>
                  <button
                    onClick={() => onSelectDeck(deck.id, "review")}
                    disabled={deck.cards.length === 0}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Review
                  </button>
                  {laterCount > 0 && (
                    <button
                      onClick={() => onSelectDeck(deck.id, "review-later")}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Review Later ({laterCount})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Delete deck "${deck.name}"?`)) {
                        onDeleteDeck(deck.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
