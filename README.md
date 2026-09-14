# Atalho

Launcher de desktop rápido, orientado a teclado e inspirado no fluxo de trabalho do Raycast. O aplicativo usa Tauri 2 no backend e React + TypeScript no frontend.

## Estado atual

O protótipo original foi convertido em um aplicativo Tauri funcional. `Ctrl/Cmd + Space` abre ou fecha o launcher, a pesquisa usa fuzzy search e os comandos abaixo executam ações reais no sistema operacional:

- calculadora;
- terminal;
- editor de texto;
- navegador padrão;
- nova mensagem de e-mail;
- Google Calendar;
- GitHub;
- configurações do sistema;
- ferramenta de captura de tela;
- pesquisa dinâmica no Google.

O backend mantém uma allowlist explícita de comandos. O frontend não envia comandos de shell arbitrários.

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl/Cmd + Space` | abrir ou fechar o launcher |
| `↑` / `↓` | navegar pelos resultados |
| `Enter` | executar o comando selecionado |
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

- `src/components/CommandPalette.tsx`: busca, navegação por teclado, acessibilidade e execução.
- `src/data/commands.ts`: catálogo de comandos apresentados ao usuário.
- `src-tauri/src/lib.rs`: atalho global, janela e execução segura das integrações nativas.
- `src-tauri/tauri.conf.json`: configuração da janela, bundle e CSP.

## Segurança

A execução nativa é limitada a IDs conhecidos no backend. URLs usadas pelo aplicativo são construídas internamente e a aplicação possui CSP de produção configurada no Tauri.
