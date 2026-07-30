import {
  Calculator,
  Search,
  Settings,
  Terminal,
  FileText,
  Clipboard,
  Globe,
  Mail,
  Calendar,
  Github,
  Moon,
  Image,
  type LucideIcon,
} from "lucide-react";

export type Command = {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  shortcut?: string;
  group: string;
};

export const mockCommands: Command[] = [
  {
    id: "calculator",
    title: "Calculadora",
    subtitle: "Abrir a calculadora do sistema",
    icon: Calculator,
    shortcut: "↵",
    group: "Aplicativos",
  },
  {
    id: "search-google",
    title: "Buscar no Google",
    subtitle: "Pesquisar na web",
    icon: Search,
    group: "Web",
  },
  {
    id: "settings",
    title: "Configurações",
    subtitle: "Preferências do aplicativo",
    icon: Settings,
    shortcut: "⌘,",
    group: "Sistema",
  },
  {
    id: "terminal",
    title: "Abrir Terminal",
    subtitle: "Novo terminal na pasta atual",
    icon: Terminal,
    group: "Aplicativos",
  },
  {
    id: "notes",
    title: "Nova Nota",
    subtitle: "Criar uma nota rápida",
    icon: FileText,
    shortcut: "⌘N",
    group: "Produtividade",
  },
  {
    id: "clipboard",
    title: "Histórico da Área de Transferência",
    subtitle: "Ver itens copiados recentemente",
    icon: Clipboard,
    group: "Produtividade",
  },
  {
    id: "browser",
    title: "Abrir Navegador",
    subtitle: "Nova janela do navegador padrão",
    icon: Globe,
    group: "Aplicativos",
  },
  {
    id: "mail",
    title: "Escrever E-mail",
    subtitle: "Novo e-mail no cliente padrão",
    icon: Mail,
    group: "Produtividade",
  },
  {
    id: "calendar",
    title: "Agenda de Hoje",
    subtitle: "Ver eventos do dia",
    icon: Calendar,
    group: "Produtividade",
  },
  {
    id: "github",
    title: "Abrir GitHub",
    subtitle: "github.com",
    icon: Github,
    group: "Web",
  },
  {
    id: "dark-mode",
    title: "Alternar Tema",
    subtitle: "Trocar entre modo claro e escuro",
    icon: Moon,
    group: "Sistema",
  },
  {
    id: "screenshot",
    title: "Capturar Tela",
    subtitle: "Tirar um screenshot",
    icon: Image,
    shortcut: "⌘⇧4",
    group: "Sistema",
  },
];
