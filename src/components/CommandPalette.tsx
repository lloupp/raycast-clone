import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Fuse from "fuse.js";
import { AlertCircle, AppWindow, LoaderCircle, Search, Star } from "lucide-react";
import { commands, type Command } from "../data/commands";

type AppEntry = {
  id: string;
  title: string;
};

type RuntimeCommand = Omit<Command, "group"> & {
  group: string;
  payload?: string;
  appId?: string;
};

type Feedback = { kind: "error" | "info"; message: string } | null;

const FAVORITES_KEY = "atalho:favorites";
const RECENTS_KEY = "atalho:recents";
const MAX_RECENTS = 8;

function readStoredIds(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // O launcher continua funcional mesmo se o armazenamento local estiver indisponível.
  }
}

function reorderForHome(
  catalog: RuntimeCommand[],
  favoriteIds: string[],
  recentIds: string[],
): RuntimeCommand[] {
  const byId = new Map(catalog.map((command) => [command.id, command]));
  const used = new Set<string>();
  const output: RuntimeCommand[] = [];

  for (const id of favoriteIds) {
    const command = byId.get(id);
    if (!command || used.has(id)) continue;
    output.push({ ...command, group: "Favoritos" });
    used.add(id);
  }

  for (const id of recentIds) {
    const command = byId.get(id);
    if (!command || used.has(id)) continue;
    output.push({ ...command, group: "Recentes" });
    used.add(id);
  }

  for (const command of catalog) {
    if (used.has(command.id)) continue;
    output.push(command);
  }

  return output;
}

export function CommandPalette() {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [installedApps, setInstalledApps] = useState<AppEntry[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readStoredIds(FAVORITES_KEY));
  const [recentIds, setRecentIds] = useState<string[]>(() => readStoredIds(RECENTS_KEY));
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    void invoke<AppEntry[]>("list_apps")
      .then((apps) => {
        if (!cancelled) setInstalledApps(apps);
      })
      .catch((error) => {
        if (!cancelled) {
          setFeedback({
            kind: "error",
            message: `Não foi possível indexar aplicativos: ${String(error)}`,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo<RuntimeCommand[]>(() => {
    const appCommands: RuntimeCommand[] = installedApps.map((app) => ({
      id: `app:${app.id}`,
      title: app.title,
      subtitle: "Aplicativo instalado",
      icon: AppWindow,
      group: "Aplicativos instalados",
      appId: app.id,
    }));

    return [...appCommands, ...commands];
  }, [installedApps]);

  const fuse = useMemo(
    () =>
      new Fuse(catalog.filter((command) => command.id !== "search-google"), {
        keys: ["title", "subtitle", "group"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [catalog],
  );

  const results = useMemo<RuntimeCommand[]>(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return reorderForHome(catalog, favoriteIds, recentIds);

    const fuzzyResults = fuse.search(normalizedQuery).map(({ item }) => item);
    const searchCommand = commands.find((command) => command.id === "search-google");

    if (!searchCommand) return fuzzyResults;

    return [
      ...fuzzyResults,
      {
        ...searchCommand,
        title: `Buscar “${normalizedQuery}” no Google`,
        payload: encodeURIComponent(normalizedQuery),
      },
    ];
  }, [catalog, favoriteIds, fuse, query, recentIds]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  useEffect(() => {
    setActiveIndex(0);
    setFeedback(null);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex >= results.length) setActiveIndex(Math.max(results.length - 1, 0));
  }, [activeIndex, results.length]);

  function rememberRecent(commandId: string) {
    setRecentIds((current) => {
      const next = [commandId, ...current.filter((id) => id !== commandId)].slice(0, MAX_RECENTS);
      writeStoredIds(RECENTS_KEY, next);
      return next;
    });
  }

  function toggleFavorite(commandId: string) {
    setFavoriteIds((current) => {
      const next = current.includes(commandId)
        ? current.filter((id) => id !== commandId)
        : [commandId, ...current];
      writeStoredIds(FAVORITES_KEY, next);
      return next;
    });
  }

  async function execute(command: RuntimeCommand) {
    if (isExecuting) return;

    setIsExecuting(true);
    setFeedback({ kind: "info", message: `Executando ${command.title}…` });

    try {
      if (command.appId) {
        await invoke("launch_app", { appId: command.appId });
      } else {
        await invoke("execute_command", {
          commandId: command.id,
          payload: command.payload ?? null,
        });
      }

      rememberRecent(command.id);
      setQuery("");
      setFeedback(null);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      inputRef.current?.focus();
    } finally {
      setIsExecuting(false);
    }
  }

  async function closeLauncher() {
    try {
      await invoke("hide_launcher");
      setQuery("");
      setFeedback(null);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.altKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      const selected = results[activeIndex];
      if (selected) toggleFavorite(selected.id);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[activeIndex];
      if (selected) void execute(selected);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      void closeLauncher();
    }
  }

  let lastGroup = "";
  const activeOptionId = results[activeIndex] ? `command-option-${activeIndex}` : undefined;

  return (
    <section
      aria-label="Atalho"
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/90 shadow-2xl backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
        {isExecuting ? (
          <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-neutral-400" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar aplicativos e comandos…"
          className="w-full bg-transparent text-[15px] text-neutral-100 placeholder-neutral-500 outline-none"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="command-list"
          aria-activedescendant={activeOptionId}
        />
      </div>

      <div
        id="command-list"
        ref={listRef}
        className="flex-1 overflow-y-auto px-2 py-2"
        role="listbox"
        aria-label="Comandos disponíveis"
      >
        {results.map((command, index) => {
          const Icon = command.icon;
          const showGroupHeader = command.group !== lastGroup;
          lastGroup = command.group;
          const isActive = index === activeIndex;
          const isFavorite = favoriteSet.has(command.id);

          return (
            <div key={`${command.id}-${command.payload ?? "static"}`}>
              {showGroupHeader && (
                <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 first:pt-1">
                  {command.group}
                </div>
              )}
              <button
                id={`command-option-${index}`}
                type="button"
                data-index={index}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void execute(command)}
                disabled={isExecuting}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-wait disabled:opacity-60 ${
                  isActive ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
                  <Icon className="h-4 w-4 text-neutral-300" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-neutral-100">{command.title}</span>
                  <span className="block truncate text-[11px] text-neutral-500">{command.subtitle}</span>
                </span>
                {isFavorite && <Star className="h-3.5 w-3.5 shrink-0 fill-current text-neutral-400" aria-label="Favorito" />}
                {command.shortcut && (
                  <kbd className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-neutral-500">
                    {command.shortcut}
                  </kbd>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex min-h-9 items-center justify-between gap-4 border-t border-white/10 px-4 py-2 text-[10px] text-neutral-500">
        <div className="min-w-0 flex-1" aria-live="polite">
          {feedback ? (
            <span className={`flex items-center gap-1.5 truncate ${feedback.kind === "error" ? "text-red-300" : ""}`}>
              {feedback.kind === "error" && <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />}
              {feedback.message}
            </span>
          ) : (
            <span>{installedApps.length} apps · {results.length} resultados</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/5 px-1">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/5 px-1">alt+f</kbd> favorito
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/5 px-1">↵</kbd> executar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/5 px-1">esc</kbd> fechar
          </span>
        </div>
      </div>
    </section>
  );
}
