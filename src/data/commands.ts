import { Code, Mail, Search, type LucideIcon } from "lucide-react";

export type CommandAction =
  | { kind: "url"; url: string }
  /** Linha de comando ja resolvida para o SO em execucao; indice 0 e o executavel. */
  | { kind: "launch"; argv: string[] };

export type Command = {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  shortcut?: string;
  group: string;
  action: CommandAction;
};

/** Atalhos fixos. Os aplicativos vem do backend, via `list_apps`. */
export const quicklinks: Command[] = [
  {
    id: "search-google",
    title: "Buscar no Google",
    subtitle: "google.com",
    icon: Search,
    group: "Web",
    action: { kind: "url", url: "https://www.google.com" },
  },
  {
    id: "github",
    title: "Abrir GitHub",
    subtitle: "github.com",
    icon: Code,
    group: "Web",
    action: { kind: "url", url: "https://github.com" },
  },
  {
    id: "mail",
    title: "Escrever E-mail",
    subtitle: "Novo e-mail no cliente padrão",
    icon: Mail,
    group: "Produtividade",
    action: { kind: "url", url: "mailto:" },
  },
];
