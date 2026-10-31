/** Erro com código HTTP, tratado pelo middleware de erros. */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message);
  }
  static badRequest(msg = 'Requisição inválida', details?: unknown) { return new HttpError(400, msg, details); }
  static unauthorized(msg = 'Não autenticado') { return new HttpError(401, msg); }
  static forbidden(msg = 'Acesso negado') { return new HttpError(403, msg); }
  static notFound(msg = 'Não encontrado') { return new HttpError(404, msg); }
  static conflict(msg = 'Conflito', details?: unknown) { return new HttpError(409, msg, details); }
}
