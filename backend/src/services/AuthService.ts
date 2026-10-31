import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser, User } from '../models/index.js';
import { OrganizationRepository } from '../repositories/OrganizationRepository.js';
import { UserRepository, strip } from '../repositories/UserRepository.js';
import { HttpError } from '../utils/HttpError.js';
import { AuditService } from './AuditService.js';

export interface AuthResult { token: string; user: User }

/**
 * Cadastro, login e emissão de tokens JWT.
 * A primeira pessoa cadastrada cria a organização e vira administradora.
 */
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly orgs: OrganizationRepository,
    private readonly audit: AuditService,
  ) {}

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const isFirst = this.users.count() === 0;
    if (!isFirst && !env.allowSignup) throw HttpError.forbidden('Cadastro desativado. Peça acesso ao administrador.');
    if (this.users.findByEmail(email)) throw HttpError.conflict('Este e-mail já está cadastrado');

    const orgId = this.orgs.first()?.id ?? this.orgs.create(env.orgName);
    const user = this.users.create({
      orgId,
      name: name.trim(),
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: isFirst ? 'admin' : 'user',
      initials: initialsOf(name),
    });
    this.users.touchLogin(user.id);
    this.audit.record(orgId, user.id, 'auth.register', { email: user.email, role: user.role });
    return { token: this.sign(user), user: strip(user) };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = this.users.findByEmail(email);
    const ok = user && user.active && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      this.audit.record(user?.orgId ?? null, user?.id ?? null, 'auth.login_failed', { email });
      throw HttpError.unauthorized('E-mail ou senha incorretos');
    }
    this.users.touchLogin(user.id);
    this.audit.record(user.orgId, user.id, 'auth.login');
    return { token: this.sign(user), user: strip(user) };
  }

  /**
   * Login com Google/Microsoft. Se o e-mail já existe, entra nessa conta.
   * Se não existe, cria a conta (respeitando ALLOW_SIGNUP) sem senha local.
   */
  async loginWithProvider(identity: { provider: string; email: string; name: string }): Promise<AuthResult> {
    if (!identity.email) throw HttpError.badRequest('A conta não informou um e-mail');
    let user = this.users.findByEmail(identity.email);
    if (user && !user.active) throw HttpError.forbidden('Seu acesso está desativado. Fale com o administrador.');
    if (!user) {
      const isFirst = this.users.count() === 0;
      if (!isFirst && !env.allowSignup) throw HttpError.forbidden('Seu e-mail ainda não tem acesso ao Autec. Peça ao administrador.');
      const orgId = this.orgs.first()?.id ?? this.orgs.create(env.orgName);
      user = this.users.create({
        orgId,
        name: identity.name || identity.email,
        email: identity.email,
        // senha aleatória e desconhecida: a conta só entra pelo provedor (ou após redefinição pelo admin)
        passwordHash: await bcrypt.hash(crypto.randomUUID() + crypto.randomUUID(), 10),
        role: isFirst ? 'admin' : 'user',
        initials: initialsOf(identity.name || identity.email),
        provider: identity.provider,
      });
      this.audit.record(orgId, user.id, 'auth.register', { email: user.email, provider: identity.provider });
    }
    this.users.touchLogin(user.id);
    this.audit.record(user.orgId, user.id, 'auth.login', { provider: identity.provider });
    return { token: this.sign(user), user: strip(user) };
  }

  me(id: number): User {
    const user = this.users.findById(id);
    if (!user || !user.active) throw HttpError.unauthorized('Sessão expirada');
    return strip(user);
  }

  async changePassword(id: number, current: string, next: string): Promise<void> {
    const user = this.users.findById(id);
    if (!user || !(await bcrypt.compare(current, user.passwordHash))) throw HttpError.badRequest('Senha atual incorreta');
    this.users.updatePassword(id, await bcrypt.hash(next, 10));
    this.audit.record(user.orgId, id, 'auth.password_changed');
  }

  /** Redefinição feita por um administrador (substitui o "esqueci a senha" sem e-mail). */
  async resetPassword(admin: AuthUser, userId: number, next: string): Promise<void> {
    const user = this.users.findById(userId);
    if (!user || user.orgId !== admin.orgId) throw HttpError.notFound('Usuário não encontrado');
    this.users.updatePassword(userId, await bcrypt.hash(next, 10));
    this.audit.record(admin.orgId, admin.id, 'auth.password_reset', { userId });
  }

  verify(token: string): AuthUser {
    try {
      const p = jwt.verify(token, env.jwtSecret) as any;
      return { id: Number(p.sub), orgId: p.org, role: p.role, email: p.email };
    } catch {
      throw HttpError.unauthorized('Sessão expirada. Entre novamente.');
    }
  }

  private sign(u: User): string {
    return jwt.sign({ org: u.orgId, role: u.role, email: u.email }, env.jwtSecret, {
      subject: String(u.id),
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }
}

export function initialsOf(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
}
