# Histórico de versões

## [1.2.2] — 2026-10-31
### Alterado
- A plataforma começa **vazia**: removidos os contratos e pastas de exemplo. Só aparece o que for inserido.
- Dados de exemplo salvos por versões anteriores são apagados automaticamente; pastas e documentos
  enviados pelo usuário são mantidos.
- A tela inicial passa a ser sempre a Visão geral.

## [1.2.1] — 2026-10-31
### Adicionado
- Visão geral: clicar na barra de situação ou na legenda (Ativos, Vencidos, Encerrados, Não lidos) destaca o grupo
  e abre um painel com os contratos daquela situação; clicar de novo, no X ou Esc fecha.

## [1.2.0] — 2026-10-31
### Adicionado
- Login real com **Google** (botão oficial do Google Identity Services) e **Microsoft** (janela oficial via MSAL),
  substituindo a simulação. Back-end valida o *ID token* (`POST /api/auth/oauth`) com as chaves públicas do provedor.
- Variáveis `GOOGLE_CLIENT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_TENANT`; migração `002_oauth.sql`.
- Guia `docs/LOGIN_SOCIAL.md` e 3 novos testes da API.

## [1.1.1] — 2026-10-31
### Alterado
- Novo símbolo da marca: "A" em fita azul com anel dourado (sidebar, login, abertura animada, boas-vindas e favicon).
- Abertura animada: o "A" surge e o anel dourado "passa" ao redor, com brilho.
- Interação no símbolo: ao passar o mouse, o "A" sobe e o anel faz uma órbita brilhando; clique leva à Visão geral; o anel brilha suavemente no login.

## [1.1.0] — 2026-10-31
### Adicionado
- Janela **Conta e administração** (engrenagem no rodapé do menu, modo servidor):
  troca da própria senha; para administradores, lista de usuários com perfil, desativação,
  redefinição de senha e trilha de auditoria.
- Guia de publicação e atualização com GitHub Desktop (`docs/GITHUB.md`).

## [1.0.0] — 2026-10-29
### Adicionado
- Back-end Node.js + Express + TypeScript em camadas (rotas, controladores, serviços, repositórios).
- Banco SQLite com migrações, organização, usuários, pastas, documentos, alertas, arquivos e trilha de auditoria.
- Autenticação com bcrypt + JWT; primeiro usuário vira administrador; administração de usuários e redefinição de senha.
- Espaço de trabalho compartilhado com controle de versão otimista (evita sobrescrever alterações de outra pessoa).
- Armazenamento dos arquivos originais (PDF/DOC/DOCX) no servidor.
- Proxy seguro para a IA (Claude): a chave da Anthropic fica só no servidor.
- Front-end dividido em módulos, com detecção automática de modo servidor/local.
- Configuração do VS Code, CI no GitHub Actions, publicação no GitHub Pages, Dockerfile e Blueprint do Render.
- Documentação: instalação, arquitetura, API, front-end, implantação, contribuição e roadmap.

### Interface (herdada do protótipo)
- Explorador de pastas estilo OneDrive, leitura de contratos por IA, vínculos por CNPJ, status Vencido/Encerrado,
  Vencimentos, Relatórios analíticos por Unidade/Região/Fornecedor, abertura animada e boas-vindas.
