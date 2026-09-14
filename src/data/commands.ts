import {
  Calculator,
  Calendar,
  FileText,
  Globe,
  Image,
  Mail,
  Search,
  Settings,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export type Command = {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  shortcut?: string;
  group: "Aplicativos" | "Produtividade" | "Sistema" | "Web";
};

export const commands: Command[] = [
  {
    id: "calculator",
    title: "Calculadora",
    subtitle: "Abrir a calculadora do sistema",
    icon: Calculator,
    shortcut: "↵",
    group: "Aplicativos",
  },
  {
    id: "terminal",
    title: "Abrir Terminal",
    subtitle: "Abrir um novo terminal",
    icon: Terminal,
    group: "Aplicativos",
  },
  {
    id: "notes",
    title: "Nova Nota",
    subtitle: "Abrir o editor de texto do sistema",
    icon: FileText,
    group: "Produtividade",
  },
  {
    id: "browser",
    title: "Abrir Navegador",
    subtitle: "Abrir o navegador padrão",
    icon: Globe,
    group: "Aplicativos",
  },
  {
    id: "mail",
    title: "Escrever E-mail",
    subtitle: "Abrir uma nova mensagem no cliente padrão",
    icon: Mail,
    group: "Produtividade",
  },
  {
    id: "calendar",
    title: "Abrir Agenda",
    subtitle: "Abrir o Google Calendar",
    icon: Calendar,
    group: "Produtividade",
  },
  {
    id: "github",
    title: "Abrir GitHub",
    subtitle: "Abrir github.com no navegador padrão",
    icon: Globe,
    group: "Web",
  },
  {
    id: "settings",
    title: "Configurações do Sistema",
    subtitle: "Abrir as configurações do sistema operacional",
    icon: Settings,
    group: "Sistema",
  },
  {
    id: "screenshot",
    title: "Capturar Tela",
    subtitle: "Abrir a ferramenta de captura do sistema",
    icon: Image,
    group: "Sistema",
  },
  {
    id: "search-google",
    title: "Buscar no Google",
    subtitle: "Pesquisar o texto digitado na web",
    icon: Search,
    group: "Web",
  },
];
