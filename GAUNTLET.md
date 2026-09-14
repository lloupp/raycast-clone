# Gauntlet 9/10

## Quality bar

- launcher deve abrir por atalho global e fechar de forma previsível;
- interface principal deve ser React/Tauri, sem protótipo paralelo ativo;
- comandos visíveis devem executar ações reais ou retornar erro explícito;
- aplicativos instalados devem ser descobertos e executados sem expor shell arbitrário ao frontend;
- favoritos e recentes devem sobreviver entre execuções;
- busca e navegação devem funcionar integralmente por teclado;
- produção deve usar CSP e permissões mínimas;
- dependências de runtime com vulnerabilidade alta devem bloquear CI;
- build frontend e testes Rust devem rodar em CI.

## Evidências do ciclo 1

- `index.html` reduzido ao shell do Vite/React;
- `CommandPalette` usa `invoke()` e feedback de erro;
- backend possui allowlist e integrações nativas para Windows/macOS/Linux;
- `Esc` fecha o launcher e perda de foco oculta a janela;
- pesquisa dinâmica no Google usa URL fixa construída no backend;
- CSP de produção e capabilities reduzidas;
- workflow de CI adicionado.

## Evidências do ciclo 2

- descoberta de apps do menu Iniciar no Windows, bundles em `/Applications` no macOS e `.desktop` no Linux;
- execução de app exige que o backend reencontre o mesmo caminho em sua própria descoberta;
- favoritos persistentes via `Alt + F`;
- histórico de recentes persistente e promovido na tela inicial;
- busca fuzzy unificada entre apps instalados e comandos;
- CI passa a bloquear vulnerabilidades altas em dependências de runtime.

## Próximos critérios para elevar além do núcleo atual

- calculadora inline;
- clipboard history nativo;
- action panel e quicklinks configuráveis;
- ícones nativos dos aplicativos;
- testes E2E do launcher empacotado.
