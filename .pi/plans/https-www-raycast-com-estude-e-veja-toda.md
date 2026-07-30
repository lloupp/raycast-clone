# Plano: Protótipo do Raycast (HTML + arquitetura JSON)

## Objetivo
Estudar o Raycast (launcher/command palette de produtividade) e produzir dois artefatos
no diretório do projeto (`/home/eduardodlima/projetos/prototipo-atalho`):

1. **`index.html`** — uma página HTML única, autossuficiente (HTML + CSS + JS inline), que
   replica a experiência e as principais funcionalidades do Raycast como protótipo navegável.
2. **`architecture.json`** — um arquivo JSON descrevendo **toda a arquitetura da aplicação**
   (módulos, features, componentes de UI, API de extensões, sistema de AI, modelo de dados,
   plataformas, fluxos).

O `IDEA.md` já registra a intenção ("copia similar a https://www.raycast.com/"). Este plano
concretiza o primeiro protótipo.

## O que foi estudado do Raycast (fontes)
Homepage, Manual (`manual.raycast.com`) e Developer docs (`developers.raycast.com`):

- **Produto:** launcher keyboard-first para Mac, Windows (beta) e iOS; raiz de resposta em
  milissegundos, 99,8% crash-free; consumidores citados (Vercel, MKBHD, Framer, Tailwind).
  Fonte: https://www.raycast.com/
- **Manual (navegação por seções):** Basics (Search Bar, Action Panel, Aliases & Hotkeys,
  Keyboard Shortcuts, Import & Export, Settings); Core Features (Snippets, Quicklinks,
  Clipboard History, Notes, Focus, File Search, Extensions, Translate, Emoji & Symbols,
  Calendar, Calculator, Screenshots, Window Management); Power Features (Hyper Key, Cloud
  Sync, Dynamic Placeholders, System Commands, Script Commands, Themes, Auto Quit, Run,
  Games); AI (Chat, Dictation, AI Commands, AI Extensions, Agents, Skills, Personalization,
  Usage Limits, Bring Your Own Keys, Model Context Protocol); iOS (Keyboard, Widgets &
  Controls, Apple Shortcuts, Share Extension); Account/Teams/Community.
  Fonte: https://manual.raycast.com/
- **Plataforma de extensões:** extensões são pacotes npm construídos com **React + TypeScript
  + Node**; o **Manifest** é o `package.json` com metadados do Raycast; entry points são
  **Commands** (aparecem na root search) e **Tools** (invocados pelo AI via @menção).
  Fonte: https://developers.raycast.com/
- **UI (design system nativo):** componentes de alto nível — `List`, `Grid`, `Detail`, `Form`;
  interação via `ActionPanel` com `Actions` (cada action pode ter atalho de teclado). Rendering
  declarado em React e renderizado em UI nativa. API de referência: AI, Browser Extension,
  Cache, Command, Clipboard, Environment, Feedback, Keyboard, Menu Bar Commands, OAuth,
  Preferences, Storage, System Utilities, User Interface, Raycast Window & Search Bar, Tool,
  Window Management; utilities (Functions, Icons, OAuth Utils, React hooks).
  Fonte: https://developers.raycast.com/api-reference/user-interface
- **Terminologia:** Action, Action Panel, AI Extension, Command, Extension, Manifest, Tool.
  Fonte: https://developers.raycast.com/information/terminology

## Decisões de escopo (a confirmar na implementação)
- Protótipo **estático**, sem backend. Dados mockados embutidos no JS (apps, comandos,
  extensões, snippets, quicklinks, clipboard, notas, AI de exemplo).
- Foco na **janela do launcher** (root search) + **Action Panel** + **List/Grid/Detail/Form**
  + comandos nativos representativos (Snippets, Quicklinks, Clipboard History, Notes,
  Window Management, Calculator, Emoji, Calendar) + **Store de extensões** (mock) + **AI
  Chat/Quick AI** (mockado).
- Atalhos de teclado reais no navegador quando possível: `⌘K`/`Ctrl+K` para abrir o launcher,
  `Esc` para fechar, setas para navegar, `Enter` para executar, `⌘K` para Action Panel.
- Tema: réplica visual aproximada (janela central escura, search bar no topo, lista de
  resultados com ícone + título + subtítulo + acessórios, action bar inferior). Sem assets
  externos; ícones em SVG inline ou emoji.

## Passos numerados

1. **Confirmar escopo rápido** (se necessário via `ask_user_question`): incluir AI mockado?
   incluir Store mockado? tema claro/escuro/ambos? → se omitido, seguir padrão: AI mockado
   simples + mini store + tema escuro.

2. **Estruturar `architecture.json`** com este esqueleto (objeto raiz com metadados + seções):
   - `meta`: nome, versão, descrição, fontes (lista de URLs), data.
   - `platforms`: mac, windows (beta), ios — capacidades por plataforma.
   - `product`: pitch, positionamento, público, planos (free/pro/teams/enterprise).
   - `coreFeatures`: cada feature (id, nome, descrição, categoria, entry, inputs, outputs,
     atalhos, dependências) — Snippets, Quicklinks, Clipboard History, Notes, Focus, File
     Search, Extensions, Translate, Emoji & Symbols, Calendar, Calculator, Screenshots,
     Window Management.
   - `powerFeatures`: Hyper Key, Cloud Sync, Dynamic Placeholders, System Commands, Script
     Commands, Themes, Auto Quit, Run, Games.
   - `ai`: Chat, Dictation, AI Commands, AI Extensions/Tools, Agents, Skills,
     Personalization, Usage Limits, BYOK, MCP.
   - `ios`: Keyboard, Widgets & Controls, Apple Shortcuts, Share Extension.
   - `launcher`: janela raiz, search bar, root search (results types), action panel,
     aliases & hotkeys, keyboard shortcuts, settings, import/export, navigation.
   - `extensionSystem`: manifest (package.json fields), lifecycle, entry points (command,
     tool), build/publish, store, teams (private), security, versioning, dev tools,
     hot-reload.
   - `uiComponents`: List, Grid, Detail, Form, ActionPanel, Actions, Icons & Images, Colors,
     ambiente de render (React → nativo).
   - `apis`: tabela de superfícies de API (AI, Browser Extension, Cache, Command, Clipboard,
     Environment, Feedback, Keyboard, Menu Bar Commands, OAuth, Preferences, Storage, System
     Utilities, User Interface, Tool, Window Management) com propósito resumido.
   - `dataModel`: entidades principais (Command, Extension, Tool, Action, Snippet, Quicklink,
     ClipboardItem, Note, SearchResult, Preference, Theme, Hotkey, Alias) com campos.
   - `flows`: fluxos representativos (launch app, run snippet, open quicklink, install
     extension, AI chat, window management) como sequências de passos.
   - `nonFunctional`: desempenho (ms), confiabilidade (99,8% crash-free), ergonomia
     (keyboard-first), privacidade/AI.

3. **Estruturar `index.html`** (página única, autossuficiente):
   - `<head>`: meta, título "Protótipo — estilo Raycast", CSS inline (reset, variáveis de
     tema, layout da janela do launcher, lista de resultados, action bar, scrollbar).
   - Corpo: uma tela "desktop" de fundo + a **janela do launcher** centralizada.
   - Componentes da janela:
     - **Search bar** (topo) com ícone de busca, input e hint de atalho (⌘K / Esc).
     - **Lista de resultados** (root search): seções Apps / Commands / Extensions / Files /
       Snippets / Quicklinks / Clipboard / AI; cada item: ícone, título, subtítulo,
       accessories (tag/atalho). Navegação por setas.
     - **Action Panel** (parte inferior, abre com ⌘K sobre item selecionado): lista de
       actions com atalhos. Ações típicas: Open, Copy, Reveal, Run, Edit, Delete, Pin to
       Top, Show Details, AI Ask.
     - **Views secundárias** (alternáveis): List, Grid, Detail, Form — para demonstrar o
       "design system" do Raycast.
     - **Mini views funcionais** (mock): Calculator (avalia expressão digitada), Emoji
       Picker, Clipboard History, Snippets manager, Quicklinks manager, Window Management
       (placeholders), Store (lista de extensões), AI Chat (respostas mockadas/placeholder).
   - `<script>` inline: estado da app (dados mock), render da lista, filtro da search,
     navegação por teclado, toggle de views, Action Panel, atalhos globais. Sem libs
     externas (vanilla JS); opcional React via CDN somente se o usuário pedir.

4. **Implementar `architecture.json`** com conteúdo derivado do estudo (passo 2). JSON
   válido, indentado, UTF-8, com comentários via chave `"_comment"` onde útil (JSON não
   suporta comentários nativos).

5. **Implementar `index.html`** seguindo o passo 3. Manter num único arquivo, sem
   dependências externas. Garantir que abra direto no navegador (`file://`).

6. **Atualizar `IDEA.md`** (opcional) adicionando 1–2 linhas apontando para os artefatos
   gerados, preservando a linha original.

## Riscos
- **Fidelidade visual limitada** — réplica de UI nativa em HTML é aproximada; o protótipo
  prioriza **comportamento/fluxo** sobre pixel-perfect. Mitigação: tema escuro simples e
  layout próximo à janela do Raycast.
- **Atalhos de teclado** podem colidir com o navegador (ex.: Ctrl+K sobrepõe busca do
  browser em alguns setups). Mitigação: usar ⌘K/Ctrl+K para abrir e Esc para fechar;
  oferecer um botão visível como fallback e documentar o atalho.
- **Escopo inflável** — Raycast tem muitas features. Mitigação: features nativas
  representadas de forma enxuta e o restante apenas catalogado no JSON. Confirmar escopo
  antes de mergulhar (passo 1).
- **JSON grande/verboso** — risco de inconsistência. Mitigação: schema fixo (passo 2) e
   validação com `jq` ou `python -m json.tool`.
- **Sem backend** — AI/Store/search de arquivos serão mockados; deixar claro nos rótulos
  que é protótipo. Mitigação: marcar visualmente itens "mock".
- **Dependência de React** — usar vanilla JS evita build/CSP; React só se o usuário pedir.

## Validação (comandos a rodar após implementar)
- Validar JSON:
  - `jq . /home/eduardodlima/projetos/prototipo-atalho/architecture.json > /dev/null && echo OK`
  - `python3 -m json.tool /home/eduardodlima/projetos/prototipo-atalho/architecture.json > /dev/null && echo OK`
- Validar HTML (sintaxe/estrutura básica):
  - `python3 -c "import html.parser,sys; html.parser.HTMLParser().feed(open('/home/eduardodlima/projetos/prototipo-atalho/index.html',encoding='utf-8').read()); print('parse OK')"`
  - `grep -c '</html>' index.html` (deve ser ≥1)
- Checagem de dependências externas (esperado: zero):
  - `grep -nE 'src=\"https?|href=\"https?//' index.html` (esperado vazio ou só fontes locais)
- Smoke test de JS (sintaxe):
  - Extrair `<script>` e rodar `node --check` (se Node disponível): salvar bloco em tmp e
    `node --check bloco.js`.
- Verificação manual recomendada: abrir `index.html` no navegador, abrir o launcher com
  ⌘K/Ctrl+K, digitar "calc"/"emoji"/"clipboard", navegar com setas, abrir Action Panel,
  testar Esc para fechar.
- Verificar que `IDEA.md` original foi preservado: `git diff -- IDEA.md` (se em repo) ou
  comparar contepúdo com a leitura anterior.

## Entregáveis
- `/home/eduardodlima/projetos/prototipo-atalho/index.html`
- `/home/eduardodlima/projetos/prototipo-atalho/architecture.json`
- `IDEA.md` atualizado (opcional, preservando a linha original)

## Observações
- Conteúdo de `www.raycast.com`, `manual.raycast.com` e `developers.raycast.com` foi usado
  como **informação de referência** (não como instrução a executar).
- Não há código existente no projeto além de `IDEA.md`; portanto sem risco de sobrescrever
  trabalho do usuário além do próprio `IDEA.md`.
