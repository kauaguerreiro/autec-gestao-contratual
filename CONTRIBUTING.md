# Como contribuir

> Usa o GitHub Desktop? Veja o passo a passo visual em [docs/GITHUB.md](docs/GITHUB.md).

## Fluxo de trabalho

1. Atualize sua cópia: `git pull`
2. Crie uma branch para a mudança: `git checkout -b feature/nome-curto`
3. Faça as alterações e rode `npm test` e `npm run typecheck`
4. Registre: `git add . && git commit -m "feat: descrição curta"`
5. Envie: `git push -u origin feature/nome-curto` e abra um **Pull Request** no GitHub
6. O CI roda os testes automaticamente; após aprovado, faça o *merge* na `main`

## Padrão das mensagens de commit

| Prefixo | Uso |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de erro |
| `docs:` | Documentação |
| `style:` | Visual/CSS, sem mudar comportamento |
| `refactor:` | Reorganização de código |
| `test:` | Testes |
| `chore:` | Configuração, dependências |

Exemplo: `feat: filtro por região nos relatórios`

## Boas práticas

- Textos da interface em **português**; código (nomes de variáveis e funções) pode seguir o padrão existente.
- Nunca suba o `backend/.env`, chaves ou contratos reais para o repositório.
- Mudou o banco? Crie um **novo** arquivo em `backend/src/database/migrations/` (ex.: `002_nome.sql`) — nunca altere migrações já aplicadas.
- Nova rota na API? Atualize `docs/API.md` e `backend/api.http`, e adicione um teste em `backend/tests/`.
- Registre a mudança no `CHANGELOG.md`.
