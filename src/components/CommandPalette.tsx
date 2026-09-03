import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { mockCommands, type Command } from "../data/mockCommands";

async function hideWindow() {
  try {
    await getCurrentWindow().hide();
  } catch (err) {
    console.error("falha ao esconder a janela:", err);
  }
}

const fuse = new Fuse(mockCommands, {
  keys: ["title", "subtitle", "group"],
  threshold: 0.35,
});

export function CommandPalette() {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Command[]>(() => {
    if (!query.trim()) return mockCommands;
    return fuse.search(query).map((r) => r.item);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // A janela e reaproveitada entre aberturas: limpa a busca ao reganhar foco.
  // Fora do Tauri (ex.: `npm run dev` no navegador) a API nao existe; ignora.
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    let cancelled = false;

    try {
      void getCurrentWindow()
        .onFocusChanged(({ payload: focused }) => {
          if (focused) {
            setQuery("");
            inputRef.current?.focus();
          }
        })
        .then((fn) => {
          if (cancelled) fn();
          else unlisten = fn;
        });
    } catch (err) {
      console.warn("API de janela indisponivel:", err);
    }

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  async function execute(command: Command) {
    try {
      if (command.action.kind === "url") {
        await openUrl(command.action.url);
      } else {
        await invoke("launch_app", { target: command.action.target });
      }
      await hideWindow();
    } catch (err) {
      console.error(`falha ao executar \`${command.id}\`:`, err);
    }
  }

  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = results[activeIndex];
      if (selected) void execute(selected);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      void hideWindow();
    }
  }

  let lastGroup = "";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900/80 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-neutral-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for apps and commands..."
          className="w-full bg-transparent text-[15px] text-neutral-100 placeholder-neutral-500 outline-none"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-2">
        {results.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-neutral-500">
            Nenhum resultado encontrado
          </div>
        )}

        {results.map((command, index) => {
          const Icon = command.icon;
          const showGroupHeader = command.group !== lastGroup;
          lastGroup = command.group;

          return (
            <div key={command.id}>
              {showGroupHeader && (
                <div className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-neutral-500 first:pt-1">
                  {command.group}
                </div>
              )}
              <div
                data-index={index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => void execute(command)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
                  index === activeIndex ? "bg-white/10" : ""
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-300" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-neutral-100">{command.title}</div>
                  {command.subtitle && (
                    <div className="truncate text-[12px] text-neutral-500">
                      {command.subtitle}
                    </div>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-neutral-400">
                    {command.shortcut}
                  </kbd>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-white/10 px-4 py-2 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-white/10 bg-white/5 px-1">↑↓</kbd> Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-white/10 bg-white/5 px-1">↵</kbd> Select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-white/10 bg-white/5 px-1">esc</kbd> Close
        </span>
      </div>
    </div>
  );
}
