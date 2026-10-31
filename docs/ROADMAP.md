# Próximos passos sugeridos

## Curto prazo
- [x] Tela de **administração de usuários** na interface (perfis, desativar, redefinir senha, auditoria).
- [x] **Troca de senha** pelo próprio usuário na interface.
- [ ] Recuperação de senha **por e-mail** (token temporário).
- [ ] Permissões por **unidade** (ex.: usuário de SP vê só SP).

## Médio prazo
- [ ] Salvar alterações **por documento** (rotas `POST/PATCH/DELETE /documents`) em vez do espaço inteiro, permitindo edição simultânea sem conflitos.
- [ ] Mover a leitura por IA para uma **fila no servidor** (processa mesmo com o navegador fechado).
- [ ] **PostgreSQL** para produção com muitos usuários.
- [ ] Armazenamento de arquivos em **nuvem** (S3, Azure Blob).
- [ ] Alertas de vencimento por **e-mail** ou Teams.

## Longo prazo
- [ ] Migrar o front-end para **TypeScript + componentes** (React ou Vue), aproveitando a API existente.
- [ ] Integração com **Clicksign** para importar contratos assinados automaticamente.
- [ ] Testes automatizados de interface (Playwright).
