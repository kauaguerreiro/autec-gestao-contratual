# Histórico de versões

## [1.1.1] — 2026-10-31
### Alterado
- Novo símbolo da marca: "A" em fita azul com anel dourado (sidebar, login, abertura animada, boas-vindas e favicon).
- Abertura animada: o "A" surge e o anel dourado "passa" ao redor, com brilho.

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
