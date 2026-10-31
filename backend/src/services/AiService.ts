import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

export interface AiMessageRequest {
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: unknown }>;
  max_tokens?: number;
}

/**
 * Intermediário seguro para a API da Anthropic (Claude).
 * A chave ANTHROPIC_API_KEY fica apenas no servidor; o navegador nunca a vê.
 */
export class AiService {
  get configured(): boolean {
    return !!env.anthropicApiKey;
  }

  async message(req: AiMessageRequest): Promise<unknown> {
    if (!this.configured) throw new HttpError(503, 'IA não configurada no servidor. Defina ANTHROPIC_API_KEY no arquivo .env.');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.anthropicModel,
        max_tokens: Math.min(Math.max(Number(req.max_tokens) || 1000, 1), 4000),
        ...(req.system ? { system: req.system } : {}),
        messages: req.messages,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `Erro ${res.status} no serviço de IA`;
      throw new HttpError(res.status === 401 || res.status === 403 ? 502 : res.status, msg);
    }
    return data;
  }
}
