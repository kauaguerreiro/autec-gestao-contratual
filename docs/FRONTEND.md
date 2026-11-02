# Front-end

JavaScript puro, sem etapa de build: basta abrir pelo servidor (`npm run dev`) ou publicar a pasta `frontend/`.

## Ordem de carregamento

Os arquivos são scripts clássicos carregados em ordem pelo `index.html`. Funções e constantes ficam disponíveis para os arquivos seguintes.

| Arquivo | Conteúdo |
|---|---|
| `js/storage.js` | `LS`/`SS`: acesso seguro ao localStorage/sessionStorage |
| `js/config.js` | `AUTEC_API_URL` — endereço do back-end |
| `js/api.js` | Classe `AutecApi` (instância global `API`): detecção do servidor, login, salvar, arquivos, IA |
| `modules/data.js` | Dados (começam vazios), persistência, `applyWorkspace` e remoção dos exemplos antigos |
| `modules/core.js` | Estado `S`, utilitários, cálculo de status (Ativo/Vencendo/Vencido/Encerrado), vínculos por CNPJ, árvore de pastas |
| `modules/dashboard.js` | Tela **Visão geral** |
| `modules/contracts.js` | Tabela de contratos, painel de detalhamento, arrastar e soltar, upload |
| `modules/ai.js` | Leitura por IA: montagem do pedido, fila, padronização de pagamento e objeto |
| `modules/documents.js` | Prévia do PDF, edição, exportação CSV, alertas, modais |
| `modules/views.js` | Telas **Vencimentos**, **Relatórios** (painel analítico) e **Busca** |
| `modules/explorer.js` | Explorador de pastas estilo OneDrive, mover/renomear/excluir |
| `modules/auth.js` | Login, cadastro, sessão, abertura animada e boas-vindas |
| `modules/admin.js` | Conta do usuário (troca de senha) e administração: usuários e auditoria |
| `modules/palette.js` | Busca rápida (Ctrl+K): telas, ações, pastas e contratos |
| `modules/main.js` | Inicialização: `API.detect().then(init)` |

## Regras de negócio importantes

- **Status** (`st()` em `core.js`): *Encerrado* só com distrato/resilição vinculado; *Vencido* quando o prazo passou sem distrato; *Vencendo* dentro da janela de alerta; prorrogações por aditivo estendem o término (`effEnd()`).
- **Vínculos**: documentos são ligados pelo mesmo CNPJ/CPF das partes (`sameParties()`), exigindo duas partes iguais quando ambos têm duas.
- **Relatórios**: 1 contrato = 1 documento principal; aditivos e distratos contam dentro dele. Unidade/Região/Fornecedor = 1º/2º/3º nível de pastas.
- **IA**: prompt em `AI_SYSTEM` (`ai.js`). Objeto resumido em até 8 palavras; forma de pagamento padronizada em `TED`, `PIX <tipo de chave>`, `BOLETO`.

## Como adicionar uma tela

1. Crie a função `renderMinhaTela(el)` em um módulo (ou em um arquivo novo, incluído no `index.html` antes de `main.js`).
2. Em `renderWorkspace()` (`core.js`), adicione o caso `S.view==='minhatela'`.
3. Crie `goMinhaTela()` chamando `goView('minhatela')` e um item no menu lateral do `index.html`.
4. Estilos novos no fim de `css/app.css`, usando as variáveis de cor (`--navy`, `--t1`, `--b1`…).
