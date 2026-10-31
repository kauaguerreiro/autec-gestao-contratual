import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

export type OAuthProvider = 'google' | 'microsoft';

export interface OAuthIdentity {
  provider: OAuthProvider;
  email: string;
  name: string;
}

/**
 * Valida o "ID token" emitido pelo Google ou pela Microsoft depois que a pessoa
 * entra na janela oficial deles. A assinatura é conferida com as chaves públicas
 * do provedor (JWKS), e o token precisa ter sido emitido para o nosso Client ID.
 */
export class OAuthService {
  private readonly googleJwks: JWTVerifyGetKey;
  private readonly msJwks: JWTVerifyGetKey;

  /** As chaves podem ser injetadas (usado nos testes). */
  constructor(keys: { google?: JWTVerifyGetKey; microsoft?: JWTVerifyGetKey } = {}) {
    this.googleJwks = keys.google ?? createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
    this.msJwks = keys.microsoft ?? createRemoteJWKSet(new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys'));
  }

  /** Client IDs públicos, enviados ao front-end pelo /api/health. */
  get publicConfig() {
    return {
      google: env.googleClientId || null,
      microsoft: env.microsoftClientId ? { clientId: env.microsoftClientId, tenant: env.microsoftTenant } : null,
    };
  }

  async verify(provider: OAuthProvider, idToken: string): Promise<OAuthIdentity> {
    if (provider === 'google') return this.verifyGoogle(idToken);
    if (provider === 'microsoft') return this.verifyMicrosoft(idToken);
    throw HttpError.badRequest('Provedor desconhecido');
  }

  private async verifyGoogle(token: string): Promise<OAuthIdentity> {
    if (!env.googleClientId) throw new HttpError(503, 'Login com Google não configurado no servidor (GOOGLE_CLIENT_ID).');
    const p = await this.check(token, this.googleJwks, {
      audience: env.googleClientId,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });
    if (p.email_verified === false) throw HttpError.unauthorized('E-mail do Google não verificado');
    return { provider: 'google', email: String(p.email ?? '').toLowerCase(), name: String(p.name ?? p.email ?? '') };
  }

  private async verifyMicrosoft(token: string): Promise<OAuthIdentity> {
    if (!env.microsoftClientId) throw new HttpError(503, 'Login com Microsoft não configurado no servidor (MICROSOFT_CLIENT_ID).');
    const p = await this.check(token, this.msJwks, { audience: env.microsoftClientId });
    // emissor no formato https://login.microsoftonline.com/{tenant}/v2.0
    const iss = String(p.iss ?? '');
    if (!/^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}\/v2\.0$/i.test(iss)) throw HttpError.unauthorized('Emissor do token inválido');
    const t = env.microsoftTenant;
    if (!['common', 'organizations', 'consumers'].includes(t) && !iss.includes(t)) throw HttpError.forbidden('Conta de outra organização');
    const email = String(p.email ?? p.preferred_username ?? '').toLowerCase();
    return { provider: 'microsoft', email, name: String(p.name ?? email) };
  }

  private async check(token: string, jwks: JWTVerifyGetKey, opts: { audience: string; issuer?: string[] }): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, jwks, { ...opts, clockTolerance: 60 });
      if (!payload.email && !payload.preferred_username) throw new Error('sem e-mail');
      return payload;
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw HttpError.unauthorized('Não foi possível validar o login. Tente novamente.');
    }
  }
}
