"use client";

import { useState, useRef, useEffect } from "react";
import { Deck, Card, Cover } from "@/types";
import { storage } from "@/lib/storage";
import ImageEditor from "@/components/ImageEditor";

interface DeckEditorProps {
  deck: Deck;
  onBack: () => void;
}

export default function DeckEditor({ deck, onBack }: DeckEditorProps) {
  const [currentDeck, setCurrentDeck] = useState<Deck>(deck);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;

      // Compress image before editing
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Max dimensions to reduce file size
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality
        const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
        setEditingImage(compressedImage);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageUpload(file);
          }
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const handleSaveCard = (imageData: string, covers: Cover[]) => {
    const newCard: Card = {
      id: crypto.randomUUID(),
      imageData,
      covers,
      createdAt: Date.now(),
    };

    const updatedDeck = {
      ...currentDeck,
      cards: [...currentDeck.cards, newCard],
    };

    storage.saveDeck(updatedDeck);
    setCurrentDeck(updatedDeck);
    setEditingImage(null);
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedDeck = {
      ...currentDeck,
      cards: currentDeck.cards.filter((c) => c.id !== cardId),
    };
    storage.saveDeck(updatedDeck);
    setCurrentDeck(updatedDeck);
  };

  if (editingImage) {
    return (
      <ImageEditor
        imageData={editingImage}
        onSave={handleSaveCard}
        onCancel={() => setEditingImage(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{currentDeck.name}</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Decks
        </button>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mb-8 p-12 border-4 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-lg text-gray-600">
          Drop an image here, paste from clipboard, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Cards ({currentDeck.cards.length})
        </h2>
        {currentDeck.cards.length === 0 ? (
          <p className="text-gray-500">No cards yet. Add an image to create your first card!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {currentDeck.cards.map((card) => (
              <div key={card.id} className="bg-white p-4 rounded shadow relative">
                <img
                  src={card.imageData}
                  alt="Card"
                  className="w-full h-48 object-contain mb-2"
                />
                <p className="text-sm text-gray-600">
                  {card.covers.length} cover{card.covers.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="mt-2 w-full px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
