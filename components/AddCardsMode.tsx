"use client";

import { useState, useRef, useEffect } from "react";
import { Deck, Card, Cover } from "@/types";
import { storage } from "@/lib/storage";
import ImageEditor from "@/components/ImageEditor";

interface AddCardsModeProps {
  deck: Deck;
  onBack: () => void;
}

export default function AddCardsMode({ deck, onBack }: AddCardsModeProps) {
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
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col"
    >
      <div className="p-6 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-2xl font-bold">{currentDeck.name} - Add Cards</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Done
        </button>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex-1 flex flex-col items-center justify-center p-12 cursor-pointer"
      >
        <div className="text-center max-w-2xl">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Drop an image anywhere
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            or paste from clipboard (Cmd/Ctrl + V)
          </p>
          <p className="text-lg text-gray-500">
            or click anywhere to browse files
          </p>
          <div className="mt-8 p-4 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              {currentDeck.cards.length} card{currentDeck.cards.length !== 1 ? "s" : ""} added so far
            </p>
          </div>
        </div>
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
    </div>
  );
}
