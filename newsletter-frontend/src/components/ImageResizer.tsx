"use client";

import { useState, useEffect } from "react";

interface ImageResizerProps {
  image: HTMLImageElement;
  onClose: () => void;
}

export function ImageResizer({ image, onClose }: ImageResizerProps) {
  const [width, setWidth] = useState(image.width || 600);

  useEffect(() => {
    // Add border to show it's selected
    image.style.border = "2px solid #7c3aed";

    return () => {
      // Cleanup when unmounted
      image.style.border = "";
    };
  }, [image]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    image.style.width = newWidth + "px";
    image.style.maxWidth = "none";
  };

  const handleDone = () => {
    image.style.border = "";
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/20 "
      onClick={handleDone}
    >
      <div
        className="absolute bg-white rounded-xl border border-neutral-300 shadow-2xl p-4 flex items-center gap-4"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-neutral-700">
            Width:
          </label>
          <input
            type="range"
            min="200"
            max="1000"
            step="10"
            value={width}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            className="w-48 accent-purple-600"
          />
          <span className="text-sm text-neutral-600 font-mono w-12">
            {width}px
          </span>
        </div>

        <button
          onClick={handleDone}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}