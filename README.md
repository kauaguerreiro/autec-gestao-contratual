# Autec — Gestão Contratual

🔗 **Demonstração online:** https://kauaguerreiro.github.io/autec-gestao-contratual/ (modo local — dados ficam no seu navegador)

Plataforma para organizar contratos, aditivos e distratos por **Unidade › Região › Fornecedor**, acompanhar vencimentos e gerar relatórios. Os contratos são lidos automaticamente por **IA (Claude, da Anthropic)**, que extrai valor mensal, vigência, data e forma de pagamento, partes e CNPJ.

| | |
|---|---|
| **Front-end** | HTML, CSS e JavaScript puro (sem build), dividido em módulos — pasta [`frontend/`](frontend) |
| **Back-end** | Node.js 22 + Express + TypeScript, arquitetura em camadas — pasta [`backend/`](backend) |
| **Banco de dados** | SQLite (arquivo único, sem instalação). Pronto para migrar para PostgreSQL |
| **Autenticação** | E-mail e senha (bcrypt + JWT) ou **Google / Microsoft** (janelas oficiais) |
| **IA** | Chamada pelo servidor; a chave da Anthropic **nunca** vai para o navegador |

---

## Começando em 3 passos

> Pré-requisitos: [Node.js 22](https://nodejs.org) e [Git](https://git-scm.com). Passo a passo detalhado para Windows em [`docs/INSTALACAO.md`](docs/INSTALACAO.md).

```bash
git clone https://github.com/kauaguerreiro/autec-gestao-contratual.git
cd autec-gestao-contratual
npm run setup     # instala as dependências e cria backend/.env
npm run dev       # inicia em http://localhost:3000
```

Abra **http://localhost:3000**, clique em **Criar conta** — o primeiro cadastro vira **administrador**.
Administradores gerenciam usuários, redefinem senhas e consultam a auditoria pelo ícone de engrenagem no rodapé do menu.
Para ativar a leitura por IA, coloque sua chave em `backend/.env` (`ANTHROPIC_API_KEY=...`) e reinicie.

---

## Dois modos de funcionamento

| Modo | Quando acontece | Onde ficam os dados |
|---|---|---|
| **Servidor** | O site é aberto pelo back-end (`npm run dev` ou servidor publicado) | Banco de dados e pasta de arquivos do servidor, compartilhados pela equipe |
| **Local** | O `index.html` é aberto sem back-end (ex.: GitHub Pages, ou abrindo o arquivo direto) | Apenas no navegador de quem está usando — ideal para demonstração |

A detecção é automática (`frontend/js/api.js`).

---

## Estrutura do projeto

```
autec/
├── frontend/                 Interface (servida pelo back-end ou pelo GitHub Pages)
│   ├── index.html
│   ├── css/app.css
│   └── js/
│       ├── config.js         Endereço do back-end
│       ├── api.js            Cliente da API (classe AutecApi)
│       ├── storage.js        Armazenamento seguro do navegador
│       └── modules/          Telas e regras da interface (ver docs/FRONTEND.md)
├── backend/
│   ├── src/
│   │   ├── config/           Variáveis de ambiente
│   │   ├── database/         Conexão SQLite e migrações .sql
│   │   ├── models/           Tipos de domínio (User, Workspace, ContractDocument…)
│   │   ├── repositories/     Acesso ao banco (uma classe por tabela/assunto)
│   │   ├── services/         Regras de negócio (Auth, Workspace, Arquivos, IA, Relatórios, Auditoria)
│   │   ├── controllers/      Entrada/saída HTTP + validação (zod)
│   │   ├── middlewares/      Autenticação, perfis e tratamento de erros
│   │   ├── routes/           Mapa de rotas /api
│   │   ├── container.ts      Injeção de dependências
│   │   ├── app.ts            Aplicação Express
│   │   └── server.ts         Ponto de entrada
│   ├── tests/                Testes de ponta a ponta da API
│   └── api.http              Requisições prontas para o VS Code (REST Client)
├── docs/                     Documentação
├── .vscode/                  Configuração do VS Code (extensões, depuração, tarefas)
├── .github/workflows/        CI (testes) e publicação no GitHub Pages
├── Dockerfile · render.yaml  Implantação
└── package.json              Atalhos: setup, dev, test, build
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run setup` | Instala dependências e cria `backend/.env` a partir do exemplo |
| `npm run dev` | Inicia o servidor com recarga automática |
| `npm test` | Roda os testes da API |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm run build` / `npm start` | Gera e executa a versão de produção |
| `npm run standalone` | Gera `dist/autec.html`, um arquivo único que abre offline (modo local) |

No VS Code: **Terminal › Executar Tarefa…** lista as mesmas ações, e **F5** inicia o back-end em modo de depuração.

## Documentação

- [Instalação passo a passo (Windows)](docs/INSTALACAO.md)
- [Arquitetura e modelo de dados](docs/ARQUITETURA.md)
- [Referência da API](docs/API.md)
- [Front-end: módulos e como evoluir](docs/FRONTEND.md)
- [Publicação e hospedagem](docs/DEPLOY.md)
- [Login com Google e Microsoft](docs/LOGIN_SOCIAL.md)
- [Publicar e atualizar no GitHub (GitHub Desktop)](docs/GITHUB.md)
- [Como contribuir (fluxo Git)](CONTRIBUTING.md)
- [Próximos passos](docs/ROADMAP.md) · [Histórico de versões](CHANGELOG.md)

## Segurança

- Nunca versione o arquivo `backend/.env` (já está no `.gitignore`).
- Em produção, defina um `JWT_SECRET` longo e aleatório e use HTTPS.
- Faça backup periódico da pasta `backend/data/` (banco + arquivos dos contratos).
