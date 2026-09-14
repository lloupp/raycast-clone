# Atalho

Launcher de desktop rápido, orientado a teclado e inspirado no fluxo de trabalho do Raycast. O aplicativo usa Tauri 2 no backend e React + TypeScript no frontend.

## Estado atual

`Ctrl/Cmd + Space` abre ou fecha o launcher. A pesquisa usa fuzzy search sobre comandos internos e aplicativos instalados descobertos pelo backend nativo.

O launcher atualmente oferece:

- descoberta e abertura de aplicativos instalados;
- favoritos persistentes;
- histórico de comandos e apps recentes;
- calculadora do sistema;
- terminal e editor de texto;
- navegador padrão e nova mensagem de e-mail;
- Google Calendar e GitHub;
- configurações do sistema;
- ferramenta de captura de tela;
- pesquisa dinâmica no Google.

No Windows, aplicativos são descobertos pelos atalhos dos menus Iniciar do usuário e do sistema. No macOS, são descobertos em `/Applications` e `~/Applications`. No Linux, são lidos os arquivos `.desktop` dos diretórios padrão.

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl/Cmd + Space` | abrir ou fechar o launcher |
| `↑` / `↓` | navegar pelos resultados |
| `Enter` | executar o item selecionado |
| `Alt + F` | adicionar ou remover o item dos favoritos |
| `Esc` | fechar o launcher |

## Desenvolvimento

Requisitos: Node.js 20+, Rust estável e as dependências de sistema exigidas pelo Tauri 2.

```bash
npm ci
npm run build
npm run tauri dev
```

Para gerar o aplicativo:

```bash
npm run tauri build
```

## Arquitetura

- `src/components/CommandPalette.tsx`: descoberta, busca, favoritos, recentes, navegação por teclado, acessibilidade e execução.
- `src/data/commands.ts`: catálogo de comandos internos.
- `src-tauri/src/lib.rs`: atalho global, descoberta segura de aplicativos, janela e integrações nativas.
- `src-tauri/tauri.conf.json`: configuração da janela, bundle e CSP.

## Segurança

Comandos internos usam uma allowlist explícita no backend. Aplicativos só podem ser lançados se o caminho solicitado estiver presente em uma nova descoberta feita pelo próprio backend; o frontend não recebe uma primitiva de execução arbitrária de shell. URLs usadas pelos comandos são construídas internamente e a aplicação possui CSP de produção configurada no Tauri.
