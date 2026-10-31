/**
 * Testes de ponta a ponta da API (node:test).
 * Rode com: npm test
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';
import { buildContainer } from '../src/container.js';
import { createApp } from '../src/app.js';
import { Database } from '../src/database/Database.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'autec-test-'));
let base = '';
let server: ReturnType<ReturnType<typeof createApp>['listen']>;

async function api(method: string, url: string, body?: unknown, token?: string, raw?: { data: Buffer; type: string }) {
  const res = await fetch(base + url, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(raw ? { 'content-type': raw.type } : body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: raw ? raw.data : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json, text };
}

before(async () => {
  const app = createApp(buildContainer({ databaseFile: path.join(tmp, 'test.db'), storageDir: path.join(tmp, 'files') }));
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(() => {
  server.close();
  Database.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('Autec API', () => {
  let admin = '', user = '', userId = 0;

  it('responde ao health check', async () => {
    const r = await api('GET', '/health');
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  it('cadastra o primeiro usuário como administrador', async () => {
    const r = await api('POST', '/auth/register', { name: 'Kauã Alves', email: 'kaua@renapsi.org.br', password: 'Senha1234' });
    assert.equal(r.status, 201);
    assert.equal(r.json.user.role, 'admin');
    assert.equal(r.json.user.initials, 'KA');
    assert.ok(!('passwordHash' in r.json.user));
    admin = r.json.token;
  });

  it('valida os dados de cadastro', async () => {
    const r = await api('POST', '/auth/register', { name: 'X', email: 'invalido', password: '123' });
    assert.equal(r.status, 400);
    assert.ok(r.json.error.details.email);
  });

  it('impede e-mail duplicado', async () => {
    const r = await api('POST', '/auth/register', { name: 'Outra', email: 'KAUA@renapsi.org.br', password: 'Senha1234' });
    assert.equal(r.status, 409);
  });

  it('faz login e recusa senha errada', async () => {
    assert.equal((await api('POST', '/auth/login', { email: 'kaua@renapsi.org.br', password: 'errada' })).status, 401);
    const ok = await api('POST', '/auth/login', { email: 'kaua@renapsi.org.br', password: 'Senha1234' });
    assert.equal(ok.status, 200);
    assert.ok(ok.json.token);
  });

  it('exige token nas rotas protegidas', async () => {
    assert.equal((await api('GET', '/workspace')).status, 401);
    assert.equal((await api('GET', '/workspace', undefined, 'token-falso')).status, 401);
  });

  it('salva e recupera o espaço de trabalho com controle de versão', async () => {
    const empty = await api('GET', '/workspace', undefined, admin);
    assert.equal(empty.json.rev, 0);
    const ws = {
      rev: 0,
      folders: [{ id: 'u1', name: 'Áurea', children: [{ id: 'r1', name: 'SP', children: [] }] }],
      files: {
        root: [],
        r1: [{ id: 'd1', name: 'Contrato Cristiano', contractType: 'Principal', value: 'R$ 5.000,00', endDate: '2027-04-02', cnpj: ['37.381.902/0001-25'] }],
      },
      alerts: { u1: 60 },
    };
    const saved = await api('PUT', '/workspace', ws, admin);
    assert.equal(saved.status, 200);
    assert.equal(saved.json.rev, 1);

    const got = await api('GET', '/workspace', undefined, admin);
    assert.equal(got.json.folders[0].children[0].name, 'SP');
    assert.equal(got.json.files.r1[0].value, 'R$ 5.000,00');
    assert.deepEqual(got.json.files.r1[0].cnpj, ['37.381.902/0001-25']);
    assert.equal(got.json.alerts.u1, 60);

    const stale = await api('PUT', '/workspace', ws, admin); // rev 0 já está desatualizado
    assert.equal(stale.status, 409);
    assert.equal(stale.json.error.details.rev, 1);
  });

  it('guarda e devolve o arquivo original', async () => {
    const pdf = Buffer.from('%PDF-1.4\n% teste\n');
    const up = await api('PUT', '/documents/d1/file', undefined, admin, { data: pdf, type: 'application/pdf' });
    assert.equal(up.status, 201);
    const down = await fetch(base + '/documents/d1/file', { headers: { authorization: `Bearer ${admin}` } });
    assert.equal(down.status, 200);
    assert.equal(down.headers.get('content-type'), 'application/pdf');
    assert.equal(Buffer.from(await down.arrayBuffer()).toString(), pdf.toString());
  });

  it('recusa formatos não suportados', async () => {
    const r = await api('PUT', '/documents/d1/file', undefined, admin, { data: Buffer.from('x'), type: 'image/png' });
    assert.equal(r.status, 400);
  });

  it('remove o arquivo quando o documento é excluído do espaço', async () => {
    const saved = await api('PUT', '/workspace', { rev: 1, folders: [], files: { root: [] }, alerts: {} }, admin);
    assert.equal(saved.json.rev, 2);
    assert.equal((await api('GET', '/documents/d1/file', undefined, admin)).status, 404);
  });

  it('informa quando a IA não está configurada', async () => {
    const r = await api('POST', '/ai/messages', { messages: [{ role: 'user', content: 'oi' }] }, admin);
    assert.equal(r.status, 503);
  });

  it('permite ao admin gerenciar usuários e redefinir senha', async () => {
    const reg = await api('POST', '/auth/register', { name: 'Aline Bezerra', email: 'aline@renapsi.org.br', password: 'Senha1234' });
    user = reg.json.token; userId = reg.json.user.id;
    assert.equal(reg.json.user.role, 'user');
    assert.equal((await api('GET', '/users', undefined, user)).status, 403);
    const list = await api('GET', '/users', undefined, admin);
    assert.equal(list.json.users.length, 2);
    assert.equal((await api('POST', `/users/${userId}/reset-password`, { password: 'NovaSenha9' }, admin)).status, 204);
    assert.equal((await api('POST', '/auth/login', { email: 'aline@renapsi.org.br', password: 'NovaSenha9' })).status, 200);
    const audit = await api('GET', '/audit', undefined, admin);
    assert.ok(audit.json.entries.some((e: any) => e.action === 'auth.password_reset'));
  });

  it('gera o resumo de relatórios', async () => {
    const r = await api('GET', '/reports/summary', undefined, admin);
    assert.equal(r.status, 200);
    assert.equal(typeof r.json.documents, 'number');
  });
});
