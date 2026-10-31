/**
 * Configuração do front-end.
 *
 * AUTEC_API_URL — endereço do back-end.
 *   ''  (vazio)  → usa o mesmo endereço do site (quando o back-end serve o front-end).
 *   'https://autec-api.onrender.com' → back-end hospedado em outro domínio.
 *
 * Se o back-end não responder, o Autec funciona em "modo local":
 * os dados ficam salvos apenas neste navegador (útil para demonstração, ex.: GitHub Pages).
 */
window.AUTEC_API_URL = '';

/**
 * Login com Google / Microsoft (veja docs/LOGIN_SOCIAL.md).
 * Os "Client IDs" são públicos (não são senhas). No modo servidor, os valores
 * definidos no backend/.env têm prioridade sobre estes.
 */
window.AUTEC_OAUTH = {
  google: '',                                   // ex.: '1234-abc.apps.googleusercontent.com'
  microsoft: { clientId: '', tenant: 'common' } // ex.: { clientId: 'xxxxxxxx-xxxx-…', tenant: 'common' }
};
