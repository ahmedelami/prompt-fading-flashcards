"use client";

import { useState, useRef, useEffect } from "react";
import { Cover } from "@/types";

interface ImageEditorProps {
  imageData: string;
  onSave: (imageData: string, covers: Cover[]) => void;
  onCancel: () => void;
}

interface DragState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export default function ImageEditor({
  imageData,
  onSave,
  onCancel,
}: ImageEditorProps) {
  const [covers, setCovers] = useState<Cover[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const [isGrouping, setIsGrouping] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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

  const handleRemoveLastCover = () => {
    setCovers(covers.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") {
        setIsGrouping(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        handleRemoveLastCover();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") {
        setIsGrouping(false);
        // Move to next step when G is released
        setCurrentStepNumber((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [covers]);

  const getRelativeCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const img = imageRef.current;
    if (!rect || !img) return { x: 0, y: 0 };

    const scaleX = imageSize.width / img.clientWidth;
    const scaleY = imageSize.height / img.clientHeight;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getRelativeCoords(e);
    setDragState({
      isDrawing: true,
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDrawing) return;
    const coords = getRelativeCoords(e);
    setDragState((prev) => ({
      ...prev,
      currentX: coords.x,
      currentY: coords.y,
    }));
  };

  const handleMouseUp = () => {
    if (!dragState.isDrawing) return;

    const x = Math.min(dragState.startX, dragState.currentX);
    const y = Math.min(dragState.startY, dragState.currentY);
    const width = Math.abs(dragState.currentX - dragState.startX);
    const height = Math.abs(dragState.currentY - dragState.startY);

    if (width > 5 && height > 5) {
      const newCover: Cover = {
        id: crypto.randomUUID(),
        x,
        y,
        width,
        height,
        stepNumber: currentStepNumber,
      };
      setCovers([...covers, newCover]);

      // If not grouping (G not held), move to next step
      if (!isGrouping) {
        setCurrentStepNumber((prev) => prev + 1);
      }
    }

    setDragState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  };

  const handleSave = () => {
    if (covers.length === 0) {
      alert("Please add at least one cover to the image");
      return;
    }
    onSave(imageData, covers);
  };

  const getDisplayCoords = (cover: Cover) => {
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

  const getCurrentDragBox = () => {
    const img = imageRef.current;
    if (!img || !dragState.isDrawing) return null;

    const scaleX = img.clientWidth / imageSize.width;
    const scaleY = img.clientHeight / imageSize.height;

    const x = Math.min(dragState.startX, dragState.currentX) * scaleX;
    const y = Math.min(dragState.startY, dragState.currentY) * scaleY;
    const width = Math.abs(dragState.currentX - dragState.startX) * scaleX;
    const height = Math.abs(dragState.currentY - dragState.startY) * scaleY;

    return { x, y, width, height };
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create Covers</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRemoveLastCover}
            disabled={covers.length === 0}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Undo Last Cover
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Card
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-600">
          Drag to create covers. <strong>Hold G</strong> to group multiple covers into the same step.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {covers.length} cover{covers.length !== 1 ? "s" : ""} created | Next step: {currentStepNumber}
          {isGrouping && <span className="ml-2 text-blue-600 font-bold">⬤ GROUPING (release G to move to next step)</span>}
        </p>
      </div>

      <div
        ref={canvasRef}
        className="relative inline-block cursor-crosshair select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageData}
          alt="Edit"
          className="max-w-full max-h-[70vh] select-none"
          draggable={false}
        />

        {covers.map((cover) => {
          const displayCoords = getDisplayCoords(cover);
          return (
            <div
              key={cover.id}
              className="absolute bg-black bg-opacity-60 border-2 border-white pointer-events-none"
              style={{
                left: `${displayCoords.x}px`,
                top: `${displayCoords.y}px`,
                width: `${displayCoords.width}px`,
                height: `${displayCoords.height}px`,
              }}
            >
              <div className="absolute top-1 left-1 bg-white text-black px-2 py-1 text-xs font-bold rounded">
                {cover.stepNumber}
              </div>
            </div>
          );
        })}

        {dragState.isDrawing && (() => {
          const box = getCurrentDragBox();
          return box ? (
            <div
              className="absolute bg-blue-500 bg-opacity-30 border-2 border-blue-500 pointer-events-none"
              style={{
                left: `${box.x}px`,
                top: `${box.y}px`,
                width: `${box.width}px`,
                height: `${box.height}px`,
              }}
            />
          ) : null;
        })()}
      </div>
    </div>
  );
}
