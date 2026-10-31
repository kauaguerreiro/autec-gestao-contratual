# Publicar e atualizar no GitHub (GitHub Desktop)

Repositório: **autec-gestao-contratual** (público, com site de demonstração no GitHub Pages).

## Primeira publicação (uma vez só)

1. Extraia o `autec-gestao-contratual.zip` em uma pasta fixa, por exemplo `Documentos\GitHub\autec-gestao-contratual`.
2. Abra o **GitHub Desktop** e entre na sua conta (**File › Options › Accounts**).
3. **File › Add local repository…** › escolha a pasta extraída.
4. Aparece a mensagem *"This directory does not appear to be a Git repository"* › clique em **create a repository**.
   - Name: `autec-gestao-contratual`
   - Git ignore: **None** (o projeto já tem `.gitignore`) · License: **None**
   - Clique em **Create repository** — o GitHub Desktop já faz o primeiro *commit* com todos os arquivos.
5. Clique em **Publish repository** (barra superior).
   - **Desmarque** *Keep this code private* (necessário para o GitHub Pages gratuito).
   - Clique em **Publish repository**.

## Ativar o site (GitHub Pages)

1. No navegador, abra o repositório › **Settings › Pages**.
2. Em **Build and deployment › Source**, escolha **GitHub Actions**.
3. Vá em **Actions › Publicar front-end (GitHub Pages) › Run workflow**.
4. Em 1–2 minutos o site fica em `https://kauaguerreiro.github.io/autec-gestao-contratual/`.

> O site do Pages roda em **modo local** (dados no navegador). O sistema completo, com banco de dados e login compartilhado, roda com o back-end — veja [DEPLOY.md](DEPLOY.md).

## Atualizar o GitHub com a versão mais recente

Sempre que o projeto mudar (por você no VS Code, ou com uma nova versão gerada pelo Claude):

1. Copie os arquivos novos por cima da pasta do repositório (se vier em ZIP, extraia e substitua).
2. No GitHub Desktop, a aba **Changes** mostra tudo o que mudou.
3. Escreva um resumo em **Summary** (ex.: `feat: filtro por região nos relatórios`) › **Commit to main**.
4. Clique em **Push origin**.

O GitHub roda os testes automaticamente (**Actions › CI**) e republica o site se o `frontend/` mudou.

## Dicas

- **History** mostra todas as versões; clique com o botão direito em um commit › *Revert* para desfazer uma mudança.
- Para mudanças maiores, crie uma *branch* (**Current branch › New branch**), publique e abra um **Pull Request** — veja [CONTRIBUTING.md](../CONTRIBUTING.md).
- Nunca faça commit do `backend/.env` (já está ignorado) nem de contratos reais.
