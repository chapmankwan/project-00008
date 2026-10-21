"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

interface SwipeToDeleteProps {
  children: ReactNode;
  label: string;
  onDelete: () => void;
}

const DELETE_ACTION_WIDTH = 64;

export function SwipeToDelete({ children, label, onDelete }: SwipeToDeleteProps) {
  const startX = useRef(0);
  const offsetAtStart = useRef(0);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest("input, button, select, textarea")) return;
    if (!event.isPrimary) return;

    startX.current = event.clientX;
    offsetAtStart.current = offsetRef.current;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const nextOffset = Math.max(
      -DELETE_ACTION_WIDTH,
      Math.min(0, offsetAtStart.current + event.clientX - startX.current),
    );
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  }

  function finishSwipe() {
    setDragging(false);
    const nextOffset = offsetRef.current <= -(DELETE_ACTION_WIDTH / 2) ? -DELETE_ACTION_WIDTH : 0;
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  }

  return (
    <div className="relative overflow-hidden bg-blush-700" aria-label={label}>
      <div className="absolute inset-y-0 right-0 w-16">
        <button
          type="button"
          aria-label={`Delete ${label}`}
          tabIndex={offset === -DELETE_ACTION_WIDTH ? 0 : -1}
          onClick={onDelete}
          className="h-full w-full touch-manipulation bg-blush-700 px-1 text-xs font-medium text-white focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white"
        >
          Delete
        </button>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? "none" : "transform 180ms ease-out" }}
        className="relative touch-pan-y bg-mono-700"
      >
        {children}
      </div>
    </div>
  );
}
