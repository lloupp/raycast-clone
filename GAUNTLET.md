# Gauntlet 9/10

## Quality bar

- launcher deve abrir por atalho global e fechar de forma previsível;
- interface principal deve ser React/Tauri, sem protótipo paralelo ativo;
- comandos visíveis devem executar ações reais ou retornar erro explícito;
- frontend não pode executar shell arbitrário;
- busca e navegação devem funcionar integralmente por teclado;
- produção deve usar CSP e permissões mínimas;
- build frontend e testes Rust devem rodar em CI.

## Evidências do ciclo 1

- `index.html` reduzido ao shell do Vite/React;
- `CommandPalette` usa `invoke()` e feedback de erro;
- backend possui allowlist e integrações nativas para Windows/macOS/Linux;
- `Esc` fecha o launcher e perda de foco oculta a janela;
- pesquisa dinâmica no Google usa URL fixa construída no backend;
- CSP de produção e capabilities reduzidas;
- workflow de CI adicionado.

## Próximos critérios para elevar além do núcleo atual

- indexação de aplicativos instalados;
- histórico e favoritos persistentes;
- calculadora inline;
- clipboard history nativo;
- action panel e quicklinks configuráveis;
- testes E2E do launcher empacotado.
