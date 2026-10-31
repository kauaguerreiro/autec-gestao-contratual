# Publicação e hospedagem

## 1. GitHub Pages — demonstração do front-end

O GitHub Pages hospeda **apenas arquivos estáticos**, então lá o Autec roda em **modo local** (dados no navegador de cada pessoa). Serve para apresentar a interface.

1. No repositório: **Settings › Pages › Build and deployment › Source: GitHub Actions**.
2. A cada `push` na branch `main` que altere `frontend/`, o workflow `.github/workflows/pages.yml` publica o site.
3. Endereço: `https://kauaguerreiro.github.io/<repositorio>/`.

> Em repositórios **privados**, o GitHub Pages exige plano pago (GitHub Pro/Team).

## 2. Servidor completo (front + back-end)

### Opção A — Render (recomendado para começar)
1. Crie conta em https://render.com e conecte o GitHub.
2. **New › Blueprint** e selecione o repositório: o `render.yaml` cria o serviço com disco persistente.
3. Preencha `ANTHROPIC_API_KEY` quando solicitado. O `JWT_SECRET` é gerado automaticamente.
4. Acesse a URL gerada e crie o primeiro usuário (administrador). O cadastro público fica desligado (`ALLOW_SIGNUP=false`).

### Opção B — Docker (servidor próprio da empresa)
```bash
docker build -t autec .
docker run -d -p 3000:3000 -v autec-data:/data \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  --name autec autec
```
Coloque um proxy com HTTPS na frente (Nginx, Caddy, IIS…).

### Front-end no GitHub Pages + back-end em outro lugar
1. Em `frontend/js/config.js`, defina `window.AUTEC_API_URL = 'https://seu-backend.onrender.com';`
2. No servidor, defina `CORS_ORIGINS=https://kauaguerreiro.github.io`.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | 3000 | Porta HTTP |
| `JWT_SECRET` | — | **Obrigatória em produção.** Texto longo e aleatório |
| `JWT_EXPIRES_IN` | 12h | Validade da sessão |
| `ALLOW_SIGNUP` | true | Permite novos cadastros pela tela de login |
| `ORG_NAME` | Autec | Nome da organização criada no primeiro cadastro |
| `DATABASE_FILE` | ./data/autec.db | Arquivo do banco SQLite |
| `STORAGE_DIR` | ./data/files | Pasta dos arquivos dos contratos |
| `MAX_UPLOAD_MB` | 25 | Tamanho máximo por arquivo |
| `CORS_ORIGINS` | (vazio) | Domínios externos autorizados, separados por vírgula |
| `GOOGLE_CLIENT_ID` | (vazio) | Login com Google — ver [LOGIN_SOCIAL.md](LOGIN_SOCIAL.md) |
| `MICROSOFT_CLIENT_ID` | (vazio) | Login com Microsoft |
| `MICROSOFT_TENANT` | common | `common`, `organizations` ou ID do locatário |
| `ANTHROPIC_API_KEY` | (vazio) | Chave da Anthropic para a leitura por IA |
| `ANTHROPIC_MODEL` | claude-sonnet-4-6 | Modelo usado |

## Backup

Tudo fica em `DATABASE_FILE` e `STORAGE_DIR` (no Docker/Render: pasta `/data`). Copie essa pasta periodicamente.
