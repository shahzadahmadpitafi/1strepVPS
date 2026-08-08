import { useState, useCallback, useEffect, useRef } from "react";
import { Delete, CornerDownLeft, Space, ChevronUp } from "lucide-react";
import { markOskInteracting } from "@/hooks/useOnScreenKeyboard";

type KeyboardLayout = "alpha" | "numeric" | "symbols";

interface OnScreenKeyboardProps {
  activeInputId: string | null;
  onClose: () => void;
}

const ALPHA_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["SHIFT", "z", "x", "c", "v", "b", "n", "m", "BACKSPACE"],
];

const NUMERIC_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["-", "/", ":", ";", "(", ")", "£", "&", "@", "\""],
  ["SYMBOLS", ".", ",", "?", "!", "'", "+", "BACKSPACE"],
];

const SYMBOL_ROWS = [
  ["[", "]", "{", "}", "#", "%", "^", "*", "=", "_"],
  ["\\", "|", "~", "<", ">", "$", "€", "`"],
  ["NUMERIC", ".", ",", "?", "!", "'", "+", "BACKSPACE"],
];

export default function OnScreenKeyboard({ activeInputId, onClose }: OnScreenKeyboardProps) {
  const [layout, setLayout] = useState<KeyboardLayout>("alpha");
  const [isShift, setIsShift] = useState(false);
  const keyboardRef = useRef<HTMLDivElement>(null);

  const safeSetSelection = useCallback((el: HTMLInputElement | HTMLTextAreaElement, pos: number) => {
    try { el.setSelectionRange(pos, pos); } catch {}
  }, []);

  const insertText = useCallback((char: string) => {
    if (!activeInputId) return;
    const el = document.getElementById(activeInputId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) return;

    el.focus();
    const supportsSelection = !(el as HTMLInputElement).type || !["email", "number"].includes((el as HTMLInputElement).type);
    const start = supportsSelection ? (el.selectionStart ?? el.value.length) : el.value.length;
    const end = supportsSelection ? (el.selectionEnd ?? el.value.length) : el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    )?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, before + char + after);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const newPos = start + char.length;
    requestAnimationFrame(() => safeSetSelection(el, newPos));
  }, [activeInputId, safeSetSelection]);

  const handleBackspace = useCallback(() => {
    if (!activeInputId) return;
    const el = document.getElementById(activeInputId) as HTMLInputElement | null;
    if (!el) return;

    el.focus();
    const supportsSelection = !el.type || !["email", "number"].includes(el.type);
    const start = supportsSelection ? (el.selectionStart ?? el.value.length) : el.value.length;
    const end = supportsSelection ? (el.selectionEnd ?? el.value.length) : el.value.length;

    if (start === end && start > 0) {
      const before = el.value.slice(0, start - 1);
      const after = el.value.slice(end);
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value"
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, before + after);
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      requestAnimationFrame(() => safeSetSelection(el, start - 1));
    } else if (start !== end) {
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value"
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, before + after);
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      requestAnimationFrame(() => safeSetSelection(el, start));
    }
  }, [activeInputId, safeSetSelection]);

  const handleKey = useCallback((key: string) => {
    switch (key) {
      case "SHIFT":
        setIsShift(s => !s);
        return;
      case "BACKSPACE":
        handleBackspace();
        return;
      case "SPACE":
        insertText(" ");
        return;
      case "ENTER":
        onClose();
        return;
      case "NUMERIC":
        setLayout("numeric");
        return;
      case "SYMBOLS":
        setLayout("symbols");
        return;
      case "ALPHA":
        setLayout("alpha");
        setIsShift(false);
        return;
      default:
        insertText(isShift ? key.toUpperCase() : key);
        if (isShift) setIsShift(false);
    }
  }, [isShift, insertText, handleBackspace, onClose]);

  useEffect(() => {
    setLayout("alpha");
    setIsShift(false);
  }, [activeInputId]);

  if (!activeInputId) return null;

  const rows = layout === "alpha" ? ALPHA_ROWS : layout === "numeric" ? NUMERIC_ROWS : SYMBOL_ROWS;

  const renderKey = (key: string, rowIndex: number) => {
    let display: React.ReactNode = isShift && layout === "alpha" ? key.toUpperCase() : key;
    let extraClass = "min-w-[2.4rem] sm:min-w-[2.8rem]";

    if (key === "BACKSPACE") {
      display = <Delete className="w-5 h-5" />;
      extraClass = "min-w-[3.5rem] sm:min-w-[4.5rem] bg-red-500/20 text-red-400";
    } else if (key === "SHIFT") {
      display = <ChevronUp className={`w-5 h-5 ${isShift ? "text-blue-400" : ""}`} />;
      extraClass = `min-w-[3.5rem] sm:min-w-[4.5rem] ${isShift ? "bg-blue-500/30 border-blue-500/50" : "bg-white/10"}`;
    } else if (key === "SPACE") {
      display = <Space className="w-5 h-5" />;
      extraClass = "flex-1 min-w-[8rem]";
    } else if (key === "ENTER") {
      display = <CornerDownLeft className="w-5 h-5" />;
      extraClass = "min-w-[4rem] bg-blue-500/30 text-blue-400";
    } else if (key === "NUMERIC" || key === "SYMBOLS") {
      display = key === "NUMERIC" ? "123" : "#+=";
      extraClass = "min-w-[3.5rem] sm:min-w-[4.5rem] bg-white/10 text-xs font-bold";
    } else if (key === "ALPHA") {
      display = "ABC";
      extraClass = "min-w-[3.5rem] sm:min-w-[4.5rem] bg-white/10 text-xs font-bold";
    }

    return (
      <button
        key={`${key}-${rowIndex}`}
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          markOskInteracting(activeInputId);
          handleKey(key);
        }}
        onMouseDown={(e) => e.preventDefault()}
        className={`flex items-center justify-center h-12 sm:h-14 rounded-lg border border-white/10 bg-white/5 text-white text-base sm:text-lg font-medium select-none active:bg-white/20 transition-colors ${extraClass}`}
      >
        {display}
      </button>
    );
  };

  return (
    <div
      id="osk-keyboard"
      ref={keyboardRef}
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-gray-900/98 border-t border-white/10 backdrop-blur-xl px-2 pb-2 pt-1 shadow-2xl"
      onMouseDown={(e) => { e.preventDefault(); markOskInteracting(activeInputId); }}
    >
      <div className="flex justify-between items-center px-2 py-1 mb-1">
        <div className="flex gap-2">
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); markOskInteracting(activeInputId); setLayout("alpha"); setIsShift(false); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${layout === "alpha" ? "bg-blue-500/30 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-white/50"}`}
          >
            ABC
          </button>
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); markOskInteracting(activeInputId); setLayout("numeric"); }}
            onMouseDown={(e) => e.preventDefault()}
            className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${layout === "numeric" ? "bg-blue-500/30 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-white/50"}`}
          >
            123
          </button>
        </div>
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onClose(); }}
          onMouseDown={(e) => e.preventDefault()}
          className="px-3 py-1 rounded text-xs font-bold bg-white/5 border border-white/10 text-white/50 active:bg-white/20"
        >
          Done
        </button>
      </div>

      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 mb-1">
          {ri === 1 && layout === "alpha" && <div className="w-3 sm:w-5" />}
          {row.map((key) => renderKey(key, ri))}
          {ri === 1 && layout === "alpha" && <div className="w-3 sm:w-5" />}
        </div>
      ))}

      <div className="flex justify-center gap-1">
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); markOskInteracting(activeInputId); setLayout(layout === "alpha" ? "numeric" : "alpha"); setIsShift(false); }}
          onMouseDown={(e) => e.preventDefault()}
          className="flex items-center justify-center h-12 sm:h-14 min-w-[4rem] rounded-lg border border-white/10 bg-white/10 text-white text-xs font-bold select-none active:bg-white/20 transition-colors"
        >
          {layout === "alpha" ? "123" : "ABC"}
        </button>
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); markOskInteracting(activeInputId); insertText("@"); }}
          onMouseDown={(e) => e.preventDefault()}
          className="flex items-center justify-center h-12 sm:h-14 min-w-[2.4rem] sm:min-w-[2.8rem] rounded-lg border border-white/10 bg-white/5 text-white text-base sm:text-lg font-medium select-none active:bg-white/20 transition-colors"
        >
          @
        </button>
        {renderKey("SPACE", 3)}
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); markOskInteracting(activeInputId); insertText("."); }}
          onMouseDown={(e) => e.preventDefault()}
          className="flex items-center justify-center h-12 sm:h-14 min-w-[2.4rem] sm:min-w-[2.8rem] rounded-lg border border-white/10 bg-white/5 text-white text-base sm:text-lg font-medium select-none active:bg-white/20 transition-colors"
        >
          .
        </button>
        {renderKey("ENTER", 3)}
      </div>
    </div>
  );
}
