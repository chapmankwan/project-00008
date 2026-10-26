"use client";

import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { baseBtn } from "@/components/ui";

export interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode | ((close: () => void) => ReactNode);
  action?: ReactNode | ((close: () => void) => ReactNode);
  className?: string;
}

export function Sheet({ title, onClose, children, action, className }: SheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    setIsVisible(false);
    window.setTimeout(onClose, 250);
  }

  const content = typeof children === "function" ? children(close) : children;
  const headerAction = typeof action === "function" ? action(close) : action;

  function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  return (
    <section className="fixed inset-0 z-40" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label={`Close ${title} sheet`}
        tabIndex={-1}
        className={clsx(
          "absolute inset-0 w-full bg-black/50 transition-opacity duration-250",
          isVisible ? "opacity-100" : "opacity-0",
        )}
        onClick={close}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "absolute z-50 flex flex-col overflow-hidden bg-mono-800 shadow-2xl",
          "bottom-0 left-0 right-0 h-3/4 rounded-t-2xl",
          "transform transition-transform duration-300 ease-out",
          "md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-100 md:rounded-none",
          isVisible ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full",
          className,
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 p-5">
          <button type="button" className={clsx(baseBtn, "text-blush-300")} onClick={close}>Cancel</button>
          <h2 className="min-w-0 flex-1 truncate text-center font-semibold">{title}</h2>
          <div className="flex shrink-0 justify-end">{headerAction ?? <span className="w-12" aria-hidden="true" />}</div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          {content}
        </div>
      </section>
    </section>
  );
}
