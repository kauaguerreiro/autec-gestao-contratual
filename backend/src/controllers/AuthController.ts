import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { OAuthService } from '../services/OAuthService.js';
import { changePasswordSchema, loginSchema, oauthSchema, registerSchema } from './schemas.js';

export class AuthController {
  constructor(private readonly auth: AuthService, private readonly oauth: OAuthService) {}

  /** Recebe o ID token do Google/Microsoft, valida e devolve a sessão do Autec. */
  oauthLogin = async (req: Request, res: Response) => {
    const { provider, idToken } = oauthSchema.parse(req.body);
    const identity = await this.oauth.verify(provider, idToken);
    res.json(await this.auth.loginWithProvider(identity));
  };

  register = async (req: Request, res: Response) => {
    const { name, email, password } = registerSchema.parse(req.body);
    res.status(201).json(await this.auth.register(name, email, password));
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    res.json(await this.auth.login(email, password));
  };

  me = (req: Request, res: Response) => {
    res.json({ user: this.auth.me(req.user!.id) });
  };

  changePassword = async (req: Request, res: Response) => {
    const { current, next } = changePasswordSchema.parse(req.body);
    await this.auth.changePassword(req.user!.id, current, next);
    res.status(204).end();
  };
}
