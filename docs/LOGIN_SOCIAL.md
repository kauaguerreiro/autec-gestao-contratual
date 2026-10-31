# Login com Google e Microsoft

O Autec usa as **janelas oficiais** de cada provedor — o mesmo fluxo de outros sites:
a pessoa clica em **Continuar com o Google / com a Microsoft**, escolhe a conta na janela
do provedor e volta logada. O Autec nunca vê a senha do Google ou da Microsoft.

| Modo | Como o login é validado |
|---|---|
| **Servidor** | O navegador envia o *ID token* ao back-end (`POST /api/auth/oauth`), que confere a assinatura com as chaves públicas do provedor e cria a sessão. Se o e-mail ainda não tem conta, ela é criada (se `ALLOW_SIGNUP=true`). |
| **Local** (GitHub Pages) | O nome e o e-mail do token criam a conta apenas neste navegador (demonstração). |

Para ativar, é preciso **cadastrar o Autec** em cada provedor (uma vez só) e copiar o **Client ID**,
que é um identificador **público** (não é senha).

---

## Google

1. Acesse https://console.cloud.google.com e crie um projeto (ex.: **Autec**).
2. **APIs e serviços › Tela de permissão OAuth**
   - Tipo de usuário: **Externo** (ou **Interno**, se só contas do Google Workspace da empresa).
   - Nome do app: **Autec** · e-mail de suporte · domínio autorizado: `kauaguerreiro.github.io`.
   - Escopos: `openid`, `email`, `profile` (os padrões). Salve e **publique o app**.
3. **APIs e serviços › Credenciais › Criar credenciais › ID do cliente OAuth**
   - Tipo: **Aplicativo da Web** · Nome: `Autec Web`
   - **Origens JavaScript autorizadas**:
     - `https://kauaguerreiro.github.io`
     - `http://localhost:3000`
     - (o endereço do servidor de produção, quando houver)
   - Não é preciso informar URI de redirecionamento.
4. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`).

## Microsoft (contas corporativas Microsoft 365 e pessoais)

1. Acesse https://entra.microsoft.com › **Identidade › Aplicativos › Registros de aplicativo › Novo registro**.
2. Nome: **Autec** · Tipos de conta: **Contas em qualquer diretório organizacional e contas Microsoft pessoais**
   (ou só a sua organização, se preferir restringir).
3. **URI de redirecionamento**: plataforma **Aplicativo de página única (SPA)**:
   - `https://kauaguerreiro.github.io/autec-gestao-contratual/`
   - `http://localhost:3000/`
4. Copie o **ID do aplicativo (cliente)**.
   Se restringiu à sua organização, copie também o **ID do diretório (locatário)**.

---

## Onde colar os IDs

**Site no GitHub Pages (modo local)** — `frontend/js/config.js`:
```js
window.AUTEC_OAUTH = {
  google: '1234-abc.apps.googleusercontent.com',
  microsoft: { clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', tenant: 'common' }
};
```

**Servidor (modo servidor)** — `backend/.env` (tem prioridade sobre o `config.js`):
```ini
GOOGLE_CLIENT_ID=1234-abc.apps.googleusercontent.com
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_TENANT=common
```
`MICROSOFT_TENANT`: `common` (todas), `organizations` (só corporativas) ou o ID do seu locatário.

Enquanto os IDs não forem informados, os botões aparecem normalmente e explicam que o login ainda não foi ativado.

## Regras de acesso

- Se o e-mail já tem conta no Autec, a pessoa entra nela (mesmo que tenha sido criada com senha).
- Com `ALLOW_SIGNUP=false`, só entram e-mails já cadastrados — o administrador cria/libera os acessos.
- Contas desativadas pelo administrador não conseguem entrar por nenhum método.
