import {
  Calculator,
  Code,
  FileText,
  Mail,
  Search,
  Settings,
  Terminal,
  type LucideIcon,
} from "lucide-react";

/** Programa a executar por sistema operacional. O indice 0 e o executavel. */
export type LaunchTarget = {
  linux: string[];
  windows: string[];
};

export type CommandAction =
  | { kind: "url"; url: string }
  | { kind: "launch"; target: LaunchTarget };

export type Command = {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  shortcut?: string;
  group: string;
  action: CommandAction;
};

export const mockCommands: Command[] = [
  {
    id: "calculator",
    title: "Calculadora",
    subtitle: "Abrir a calculadora do sistema",
    icon: Calculator,
    group: "Aplicativos",
    action: {
      kind: "launch",
      target: { linux: ["gnome-calculator"], windows: ["calc.exe"] },
    },
  },
  {
    id: "terminal",
    title: "Abrir Terminal",
    subtitle: "Nova janela de terminal",
    icon: Terminal,
    group: "Aplicativos",
    action: {
      kind: "launch",
      target: {
        linux: ["x-terminal-emulator"],
        windows: ["cmd.exe", "/c", "start", "", "cmd.exe"],
      },
    },
  },
  {
    id: "notes",
    title: "Nova Nota",
    subtitle: "Editor de texto do sistema",
    icon: FileText,
    group: "Produtividade",
    action: {
      kind: "launch",
      target: { linux: ["gedit"], windows: ["notepad.exe"] },
    },
  },
  {
    id: "settings",
    title: "Configurações do Sistema",
    subtitle: "Painel de configurações do SO",
    icon: Settings,
    group: "Sistema",
    action: {
      kind: "launch",
      target: {
        linux: ["gnome-control-center"],
        windows: ["explorer.exe", "ms-settings:"],
      },
    },
  },
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
