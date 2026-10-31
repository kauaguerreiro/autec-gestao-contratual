# Referência da API

Base: `/api` · Formato: JSON · Autenticação: `Authorization: Bearer <token>` (exceto onde indicado).

Erros seguem sempre o formato:

```json
{ "error": { "message": "Texto para o usuário", "details": { "campo": ["motivo"] } } }
```

| Código | Significado |
|---|---|
| 400 | Dados inválidos (`details` traz o campo) |
| 401 | Sem token, token expirado ou senha incorreta |
| 403 | Perfil sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (e-mail já cadastrado, ou espaço de trabalho alterado por outra pessoa) |
| 413 | Arquivo grande demais (`MAX_UPLOAD_MB`) |
| 503 | IA não configurada no servidor |

---

## Saúde

### `GET /health` — pública
```json
{ "ok": true, "ai": true, "signup": true, "oauth": { "google": "…apps.googleusercontent.com", "microsoft": { "clientId": "…", "tenant": "common" } }, "version": "1.2.0" }
```

## Autenticação

### `POST /auth/register` — pública
O primeiro cadastro cria a organização e recebe perfil `admin`. Os demais recebem `user` (se `ALLOW_SIGNUP=true`).
```json
// requisição
{ "name": "Kauã Alves", "email": "kaua@empresa.com.br", "password": "Senha1234" }
// resposta 201
{ "token": "eyJ…", "user": { "id": 1, "name": "Kauã Alves", "email": "…", "role": "admin", "initials": "KA" } }
```

### `POST /auth/login` — pública
```json
{ "email": "kaua@empresa.com.br", "password": "Senha1234" }   →   { "token": "…", "user": { … } }
```

### `POST /auth/oauth` — pública
Login com Google ou Microsoft. O front-end envia o *ID token* recebido da janela oficial do provedor.
```json
{ "provider": "google", "idToken": "eyJhbGciOiJSUzI1NiIs…" }   →   { "token": "…", "user": { … } }
```
O servidor confere assinatura, emissor e público (`GOOGLE_CLIENT_ID` / `MICROSOFT_CLIENT_ID`). Sem configuração → **503**.

### `GET /auth/me`
Retorna o usuário do token. Usado para restaurar a sessão.

### `POST /auth/password`
Troca a própria senha: `{ "current": "…", "next": "NovaSenha123" }` → `204`.

## Espaço de trabalho

### `GET /workspace`
```json
{
  "rev": 12,
  "folders": [ { "id": "u1", "name": "Áurea", "children": [ { "id": "r1", "name": "SP", "children": [] } ] } ],
  "files":   { "root": [], "r1": [ { "id": "d1", "name": "Contrato X", "contractType": "Principal", "value": "R$ 5.000,00", "endDate": "2027-04-02" } ] },
  "alerts":  { "u1": 60 }
}
```
`files` é indexado pelo id da pasta (`root` = sem pasta). Cada documento aceita campos livres, que são preservados.

### `PUT /workspace`
Envia o espaço completo com o `rev` atual. Resposta `{ "rev": 13 }`.
Se o `rev` estiver desatualizado → **409** com `details.rev` = versão atual.

## Arquivos dos contratos

| Método | Rota | Descrição |
|---|---|---|
| `PUT` | `/documents/:id/file` | Corpo = bytes do arquivo. Cabeçalhos `Content-Type` (pdf/doc/docx) e `X-File-Name` (opcional). → `201` |
| `GET` | `/documents/:id/file` | Devolve o arquivo original |
| `DELETE` | `/documents/:id/file` | Remove o arquivo → `204` |

## Inteligência artificial

### `POST /ai/messages`
Encaminha para a API de mensagens da Anthropic usando a chave do servidor e o modelo `ANTHROPIC_MODEL`.
```json
{ "system": "Você é um analista jurídico…", "max_tokens": 1000,
  "messages": [ { "role": "user", "content": [ { "type": "document", "source": { "type": "base64", "media_type": "application/pdf", "data": "…" } }, { "type": "text", "text": "Extraia os dados…" } ] } ] }
```
Resposta: o objeto retornado pela Anthropic (`content`, `usage`…).

## Relatórios

### `GET /reports/summary`
Totais calculados no servidor: documentos, contratos, aditivos, distratos, não lidos, valor mensal somado e vencimentos dos próximos 90 dias.

## Administração (perfil `admin`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/users` | Lista os usuários da organização |
| `PATCH` | `/users/:id` | `{ "role": "admin"\|"user", "active": true\|false, "name": "…" }` |
| `POST` | `/users/:id/reset-password` | `{ "password": "NovaSenha123" }` — redefine a senha de alguém |
| `GET` | `/audit?limit=100` | Trilha de auditoria |

> Dica: o arquivo `backend/api.http` tem todas essas chamadas prontas para a extensão **REST Client** do VS Code.
