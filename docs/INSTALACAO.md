# Instalação passo a passo (Windows)

Este guia leva do zero até o Autec rodando no seu computador.

## 1. Instale as ferramentas (uma vez só)

| Ferramenta | Para quê | Download |
|---|---|---|
| **Node.js 22 LTS** | Executa o back-end | https://nodejs.org (botão "LTS") |
| **Git** | Controle de versões e GitHub | https://git-scm.com/download/win |
| **Visual Studio Code** | Editor do projeto | https://code.visualstudio.com |

Durante a instalação, mantenha as opções padrão. Depois, abra o **Prompt de Comando** e confira:

```bash
node -v    # deve mostrar v22.x
git --version
```

## 2. Baixe o projeto

```bash
cd %USERPROFILE%\Documents
git clone https://github.com/kauaguerreiro/autec-gestao-contratual.git
cd autec-gestao-contratual
code .
```

O VS Code abre a pasta e sugere instalar as **extensões recomendadas** — clique em **Instalar todas**.

## 3. Instale as dependências

No terminal do VS Code (**Terminal › Novo Terminal**):

```bash
npm run setup
```

Esse comando instala as bibliotecas do back-end e cria o arquivo `backend/.env`.

## 4. Configure o `.env`

Abra `backend/.env` e ajuste:

```ini
JWT_SECRET=um-texto-longo-e-aleatorio
ANTHROPIC_API_KEY=sk-ant-...        # chave criada em console.anthropic.com
```

Sem a chave da Anthropic o sistema funciona normalmente, só a leitura automática por IA fica desligada.

## 5. Rode

```bash
npm run dev
```

Abra **http://localhost:3000**. Na primeira vez, clique em **Criar conta**: o primeiro usuário é o **administrador**.

## Problemas comuns

| Sintoma | Solução |
|---|---|
| `npm` não é reconhecido | Feche e abra o terminal depois de instalar o Node.js |
| Erro ao instalar `better-sqlite3` | Confirme que está no Node 22 (`node -v`). Se persistir, instale as "Ferramentas de compilação" que o instalador do Node oferece |
| Porta 3000 em uso | Troque `PORT=3001` no `backend/.env` |
| "IA não configurada no servidor" | Preencha `ANTHROPIC_API_KEY` no `.env` e reinicie o `npm run dev` |
| Esqueci a senha | Um administrador redefine em **engrenagem › Usuários › Redefinir senha** |
