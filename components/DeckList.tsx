import { useState } from "react";
import { Deck } from "@/types";

interface DeckListProps {
  decks: Deck[];
  onCreateDeck: (name: string) => void;
  onSelectDeck: (deckId: string, action: "add" | "edit" | "review") => void;
  onDeleteDeck: (deckId: string) => void;
}

export default function DeckList({
  decks,
  onCreateDeck,
  onSelectDeck,
  onDeleteDeck,
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
      <h1 className="text-3xl font-bold mb-8">Flashcard Decks</h1>

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
          decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <h2 className="text-xl font-semibold">{deck.name}</h2>
                <p className="text-gray-600 text-sm">
                  {deck.cards.length} card{deck.cards.length !== 1 ? "s" : ""}
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
          ))
        )}
      </div>
    </div>
  );
}
