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

interface MoveState {
  isMoving: boolean;
  coverId: string | null;
  offsetX: number;
  offsetY: number;
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
  const [moveState, setMoveState] = useState<MoveState>({
    isMoving: false,
    coverId: null,
    offsetX: 0,
    offsetY: 0,
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const [isGrouping, setIsGrouping] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
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
    if (covers.length === 0) return;

    const newCovers = covers.slice(0, -1);
    setCovers(newCovers);

    // Recalculate currentStepNumber based on remaining covers
    if (newCovers.length === 0) {
      setCurrentStepNumber(1);
    } else {
      // Find the highest step number in remaining covers and set next step
      const maxStep = Math.max(...newCovers.map(c => c.stepNumber));
      setCurrentStepNumber(maxStep + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setIsGrouping((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        handleRemoveLastCover();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMoveMode((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsMoveMode(false);
        setIsGrouping(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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

  const findCoverAtPoint = (x: number, y: number): Cover | null => {
    // Find cover at this point (in reverse order so we click topmost)
    for (let i = covers.length - 1; i >= 0; i--) {
      const cover = covers[i];
      if (
        x >= cover.x &&
        x <= cover.x + cover.width &&
        y >= cover.y &&
        y <= cover.y + cover.height
      ) {
        return cover;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getRelativeCoords(e);

    if (isMoveMode) {
      // Move mode: check if clicking on a cover
      const cover = findCoverAtPoint(coords.x, coords.y);
      if (cover) {
        setMoveState({
          isMoving: true,
          coverId: cover.id,
          offsetX: coords.x - cover.x,
          offsetY: coords.y - cover.y,
        });
      }
    } else {
      // Draw mode: start drawing new cover
      setDragState({
        isDrawing: true,
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getRelativeCoords(e);

    if (isMoveMode && moveState.isMoving && moveState.coverId) {
      // Move mode: update cover position
      const newX = coords.x - moveState.offsetX;
      const newY = coords.y - moveState.offsetY;

      setCovers((prevCovers) =>
        prevCovers.map((cover) =>
          cover.id === moveState.coverId
            ? { ...cover, x: newX, y: newY }
            : cover
        )
      );
    } else if (!isMoveMode && dragState.isDrawing) {
      // Draw mode: update drag box
      setDragState((prev) => ({
        ...prev,
        currentX: coords.x,
        currentY: coords.y,
      }));
    }
  };

  const handleMouseUp = () => {
    if (isMoveMode && moveState.isMoving) {
      // End moving
      setMoveState({
        isMoving: false,
        coverId: null,
        offsetX: 0,
        offsetY: 0,
      });
    } else if (!isMoveMode && dragState.isDrawing) {
      // End drawing
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
    }
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
          {isMoveMode ? (
            <>
              <strong>MOVE MODE</strong> - Click and drag covers to reposition them. Press <strong>M</strong> or <strong>Esc</strong> to exit.
            </>
          ) : (
            <>
              Drag to create covers. Press <strong>G</strong> to group multiple covers into the same step. Press <strong>M</strong> to move covers.
            </>
          )}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {covers.length} cover{covers.length !== 1 ? "s" : ""} created
          {!isMoveMode && <> | Current step: {currentStepNumber}</>}
          {isGrouping && (
            <>
              <span className="ml-2 text-blue-600 font-bold">⬤ GROUP MODE</span>
              <button
                onClick={() => {
                  setCurrentStepNumber((prev) => prev + 1);
                  setIsGrouping(false);
                }}
                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next Step (or press G)
              </button>
            </>
          )}
          {isMoveMode && <span className="ml-2 text-purple-600 font-bold">✋ MOVE MODE</span>}
        </p>
      </div>

      <div
        ref={canvasRef}
        className={`relative inline-block select-none ${isMoveMode ? 'cursor-move' : 'cursor-crosshair'}`}
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
          const isBeingMoved = moveState.isMoving && moveState.coverId === cover.id;
          return (
            <div
              key={cover.id}
              className={`absolute bg-black bg-opacity-60 border-2 pointer-events-none ${
                isBeingMoved ? 'border-purple-500 border-4' : 'border-white'
              }`}
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
