/**
 * Cliente da API do Autec.
 *
 * Detecta se o back-end está disponível. Se estiver ("modo servidor"):
 *   - login e cadastro são feitos no servidor (senhas com bcrypt, sessão com JWT);
 *   - pastas, contratos e alertas ficam no banco de dados, compartilhados pela equipe;
 *   - arquivos PDF/DOC ficam guardados no servidor;
 *   - a leitura por IA passa pelo servidor, que guarda a chave da Anthropic.
 * Se não estiver ("modo local"), tudo continua funcionando só no navegador.
 */
(function () {
  const TOKEN_KEY = 'autec_token';
  const base = (window.AUTEC_API_URL || '').replace(/\/$/, '');

  class ApiError extends Error {
    constructor(status, message, details) { super(message); this.status = status; this.details = details; }
  }

  class AutecApi {
    constructor() {
      this.base = base;
      this.online = false;   // back-end respondeu?
      this.ai = false;       // IA configurada no servidor?
      this.signup = true;    // cadastro liberado?
      this.rev = 0;          // versão do espaço de trabalho
      this._saveTimer = null;
      this._saving = null;
      this._pending = false;
    }

    get token() { return LS.getItem(TOKEN_KEY); }
    set token(v) { v ? LS.setItem(TOKEN_KEY, v) : LS.removeItem(TOKEN_KEY); }

    /** Verifica se há back-end. Timeout curto para não atrasar a abertura. */
    async detect() {
      // aberto direto do disco (file://) sem back-end configurado: modo local
      if (location.protocol === 'file:' && !this.base) { this.online = false; return false; }
      try {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), 2500);
        const r = await fetch(this.base + '/api/health', { cache: 'no-store', signal: ctl.signal });
        clearTimeout(t);
        const j = r.ok ? await r.json() : null;
        this.online = !!(j && j.ok);
        this.ai = !!(j && j.ai);
        this.signup = j ? j.signup !== false : true;
        this.oauth = (j && j.oauth) || {};
      } catch { this.online = false; }
      document.documentElement.classList.toggle('api-mode', this.online);
      return this.online;
    }

    async request(method, path, { body, raw, headers = {} } = {}) {
      const h = { ...headers };
      if (this.token) h.authorization = 'Bearer ' + this.token;
      let payload;
      if (raw !== undefined) { payload = raw; }
      else if (body !== undefined) { h['content-type'] = 'application/json'; payload = JSON.stringify(body); }
      let res;
      try { res = await fetch(this.base + '/api' + path, { method, headers: h, body: payload }); }
      catch { throw new ApiError(0, 'Sem conexão com o servidor'); }
      if (res.status === 204) return null;
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json().catch(() => null) : await res.blob();
      if (!res.ok) {
        const err = data && data.error ? data.error : {};
        if (res.status === 401 && path !== '/auth/login') this.onUnauthorized();
        throw new ApiError(res.status, err.message || 'Erro ' + res.status, err.details);
      }
      return data;
    }

    // ── autenticação ──
    async login(email, password) { const r = await this.request('POST', '/auth/login', { body: { email, password } }); this.token = r.token; return r.user; }
    async register(name, email, password) { const r = await this.request('POST', '/auth/register', { body: { name, email, password } }); this.token = r.token; return r.user; }
    async oauthLogin(provider, idToken) { const r = await this.request('POST', '/auth/oauth', { body: { provider, idToken } }); this.token = r.token; return r.user; }
    async me() { return (await this.request('GET', '/auth/me')).user; }
    logout() { this.token = null; this.rev = 0; }
    onUnauthorized() { this.token = null; if (typeof logout === 'function' && document.getElementById('appRoot')?.style.display !== 'none') { logout(); showToast('Sua sessão expirou. Entre novamente.', 'var(--amber)'); } }

    // ── espaço de trabalho ──
    async loadWorkspace() { const ws = await this.request('GET', '/workspace'); this.rev = ws.rev; return ws; }

    /** Salva com pequeno atraso para agrupar várias alterações seguidas. */
    scheduleSave(getData) {
      this._getData = getData;
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this.flush(), 450);
    }

    async flush() {
      if (this._saving) { this._pending = true; return this._saving; }
      const d = this._getData && this._getData();
      if (!d) return;
      this._saving = this.request('PUT', '/workspace', { body: { rev: this.rev, folders: d.folders, files: d.files, alerts: d.alerts } })
        .then((r) => { this.rev = r.rev; })
        .catch(async (e) => {
          if (e.status === 409) {
            showToast('Outra pessoa alterou os dados. Carregamos a versão mais recente.', 'var(--amber)');
            const ws = await this.loadWorkspace();
            window.applyWorkspace && window.applyWorkspace(ws);
          } else {
            showToast('Não foi possível salvar no servidor: ' + e.message, 'var(--red)');
          }
        })
        .finally(() => { this._saving = null; if (this._pending) { this._pending = false; this.flush(); } });
      return this._saving;
    }

    // ── arquivos ──
    putFile(id, blob) {
      return this.request('PUT', '/documents/' + encodeURIComponent(id) + '/file', {
        raw: blob, headers: { 'content-type': blob.type || 'application/octet-stream', 'x-file-name': encodeURIComponent(blob.name || id) },
      });
    }
    async getFile(id) { try { return await this.request('GET', '/documents/' + encodeURIComponent(id) + '/file'); } catch { return undefined; } }
    delFile(id) { return this.request('DELETE', '/documents/' + encodeURIComponent(id) + '/file').catch(() => {}); }

    // ── conta e administração ──
    changePassword(current, next) { return this.request('POST', '/auth/password', { body: { current, next } }); }
    async users() { return (await this.request('GET', '/users')).users; }
    updateUser(id, data) { return this.request('PATCH', '/users/' + id, { body: data }); }
    resetPassword(id, password) { return this.request('POST', '/users/' + id + '/reset-password', { body: { password } }); }
    async audit(limit = 80) { return (await this.request('GET', '/audit?limit=' + limit)).entries; }

    // ── IA ──
    aiMessage(payload) { return this.request('POST', '/ai/messages', { body: payload }); }
  }

  window.ApiError = ApiError;
  window.API = new AutecApi();
})();
