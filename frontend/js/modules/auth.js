/* Autec — Login, cadastro, sessão e animações de entrada */
// ══════════════════════════════════════════════
//  AUTH SYSTEM
// ══════════════════════════════════════════════
const USERS_KEY = 'lxv_users';
const SESSION_KEY = 'lxv_session';

function getUsers(){
  try{ return JSON.parse(LS.getItem(USERS_KEY)||'[]'); } catch(e){ return []; }
}
function saveUsers(u){ LS.setItem(USERS_KEY, JSON.stringify(u)); }
function getSession(){ try{ return JSON.parse(LS.getItem(SESSION_KEY)||SS.getItem(SESSION_KEY)||'null'); } catch(e){ return null; } }
// "Lembrar de mim": marcado → fica salvo; desmarcado → só até fechar o navegador
function saveSession(u, remember=true){
  const {hash, ...safe}=u;
  clearSession();
  (remember?LS:SS).setItem(SESSION_KEY, JSON.stringify(safe));
}
function clearSession(){ LS.removeItem(SESSION_KEY); SS.removeItem(SESSION_KEY); }

// hash simples (demo — não usar em produção)
function hashPass(p){ let h=0; for(let i=0;i<p.length;i++){h=((h<<5)-h)+p.charCodeAt(i);h|=0;} return h.toString(36); }

let authTab = 'login';
let pwVisible = {login:false, register:false, confirm:false};

function switchTab(tab){
  authTab = tab;
  const h=document.querySelector('.auth-heading'), hs=document.querySelector('.auth-heading-sub');
  if(h) h.textContent = tab==='login'?'Acesso à plataforma':'Criar conta';
  if(hs) hs.textContent = tab==='login'?'Entre com suas credenciais corporativas.':'Cadastre-se com seu e-mail corporativo.';
  pwVisible = {login:false, register:false, confirm:false};
  document.getElementById('tabLogin').classList.toggle('active', tab==='login');
  document.getElementById('tabRegister').classList.toggle('active', tab==='register');
  renderAuthForm();
}

function renderAuthForm(){
  const el = document.getElementById('authFormArea');
  document.getElementById('authCard')?.classList.remove('plain');
  if(authTab === 'login'){
    el.innerHTML = `
      <div class="auth-field">
        <div class="auth-label">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="5" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          E-mail
        </div>
        <div class="auth-input-wrap">
          <svg class="auth-input-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 6l6 4 6-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input class="auth-input has-icon" id="li_email" type="email" placeholder="seu@email.com" onkeydown="if(event.key==='Enter')doLogin()">
        </div>
        <div class="auth-error-msg" id="li_email_err" style="display:none"></div>
      </div>
      <div class="auth-field">
        <div class="auth-label">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="5" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          Senha
        </div>
        <div class="auth-input-wrap">
          <svg class="auth-input-icon" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="5" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input class="auth-input has-icon has-eye" id="li_pass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()">
          <span class="auth-eye" onclick="toggleEye('li_pass','li_eye')" id="li_eye">${eyeIcon(false)}</span>
        </div>
        <div class="auth-error-msg" id="li_pass_err" style="display:none"></div>
      </div>
      <div class="auth-row">
        <label class="auth-check-label">
          <input type="checkbox" class="auth-check" id="li_remember" checked> Lembrar de mim
        </label>
        <button class="auth-link" onclick="showForgot()">Esqueceu a senha?</button>
      </div>
      <button class="auth-btn" id="li_btn" onclick="doLogin()">Entrar na plataforma</button>
      <div class="auth-divider"><div class="auth-divider-line"></div><span class="auth-divider-text">ou continue com</span><div class="auth-divider-line"></div></div>
      <div class="social-area" id="socialArea"></div>
      <div class="auth-footer">Ainda não tem acesso? <button class="auth-link" onclick="switchTab('register')">Criar conta</button></div>
    `;
    renderSocial();
  } else {
    el.innerHTML = `
      <div class="auth-field">
        <div class="auth-label">Nome completo</div>
        <div class="auth-input-wrap">
          <svg class="auth-input-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2 14a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input class="auth-input has-icon" id="rg_name" type="text" placeholder="Ana Medeiros" oninput="validateRegister()">
        </div>
        <div class="auth-error-msg" id="rg_name_err" style="display:none"></div>
      </div>
      <div class="auth-field">
        <div class="auth-label">E-mail corporativo</div>
        <div class="auth-input-wrap">
          <svg class="auth-input-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 6l6 4 6-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input class="auth-input has-icon" id="rg_email" type="email" placeholder="ana@empresa.com.br" oninput="validateRegister()">
        </div>
        <div class="auth-error-msg" id="rg_email_err" style="display:none"></div>
      </div>
      <div class="auth-field">
        <div class="auth-label">Senha</div>
        <div class="auth-input-wrap">
          <svg class="auth-input-icon" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="5" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input class="auth-input has-icon has-eye" id="rg_pass" type="password" placeholder="Mín. 8 caracteres" oninput="updateStrength();validateRegister()">
          <span class="auth-eye" onclick="toggleEye('rg_pass','rg_eye')" id="rg_eye">${eyeIcon(false)}</span>
        </div>
        <div class="strength-bar" id="strengthBar">
          <div class="strength-seg" id="s1"></div><div class="strength-seg" id="s2"></div><div class="strength-seg" id="s3"></div><div class="strength-seg" id="s4"></div>
        </div>
        <div class="strength-label" id="strengthLabel" style="color:var(--t4);font-size:10px"></div>
        <div class="auth-error-msg" id="rg_pass_err" style="display:none"></div>
      </div>
      <div class="auth-field">
        <div class="auth-label">Confirmar senha</div>
        <div class="auth-input-wrap">
          <svg class="auth-input-icon" width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="5" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          <input class="auth-input has-icon has-eye" id="rg_confirm" type="password" placeholder="Repita a senha" oninput="validateRegister()" onkeydown="if(event.key==='Enter')doRegister()">
          <span class="auth-eye" onclick="toggleEye('rg_confirm','rg_ceye')" id="rg_ceye">${eyeIcon(false)}</span>
        </div>
        <div class="auth-error-msg" id="rg_confirm_err" style="display:none"></div>
      </div>
      <div style="margin-bottom:18px">
        <label class="auth-check-label">
          <input type="checkbox" class="auth-check" id="rg_terms" onchange="validateRegister()">
          <span>Aceito os <button class="auth-link" style="display:inline;font-size:inherit" onclick="event.preventDefault();event.stopPropagation();showLegal('termos')">Termos de Uso</button> e <button class="auth-link" style="display:inline;font-size:inherit" onclick="event.preventDefault();event.stopPropagation();showLegal('privacidade')">Política de Privacidade</button></span>
        </label>
      </div>
      <button class="auth-btn" id="rg_btn" onclick="doRegister()" disabled>Criar minha conta</button>
      <div class="auth-footer">Já tem conta? <button class="auth-link" onclick="switchTab('login')">Entrar agora</button></div>
    `;
  }
  // focus first input
  setTimeout(()=>{
    const first = document.querySelector('#authFormArea input');
    if(first) first.focus();
  },50);
}

function eyeIcon(visible){
  return visible
    ? `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M3 3l10 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/></svg>`;
}

function toggleEye(inputId, eyeId){
  const inp = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if(!inp||!eye) return;
  const show = inp.type==='password';
  inp.type = show?'text':'password';
  eye.innerHTML = eyeIcon(show);
}

function fieldErr(id, msg){
  const el = document.getElementById(id);
  if(!el) return;
  if(msg){
    el.style.display='flex';
    el.innerHTML=`<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M6 4v2.5M6 8h.01" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>${msg}`;
  } else {
    el.style.display='none'; el.innerHTML='';
  }
}

function setInputState(id, state){
  const inp = document.getElementById(id);
  if(!inp) return;
  inp.classList.toggle('error', state==='error');
}

// ── Password strength ──
function updateStrength(){
  const p = document.getElementById('rg_pass')?.value||'';
  let score=0;
  if(p.length>=8) score++;
  if(/[A-Z]/.test(p)) score++;
  if(/[0-9]/.test(p)) score++;
  if(/[^A-Za-z0-9]/.test(p)) score++;
  const colors=['','var(--red)','var(--amber)','var(--blue)','var(--green)'];
  const labels=['','Muito fraca','Fraca','Boa','Forte'];
  for(let i=1;i<=4;i++){
    const seg=document.getElementById('s'+i);
    if(seg) seg.style.background = i<=score ? colors[score] : 'var(--s5)';
  }
  const lbl=document.getElementById('strengthLabel');
  if(lbl){lbl.textContent=p.length>0?labels[score]:''; lbl.style.color=colors[score];}
}

// ── Validate register form (enable/disable button) ──
function validateRegister(){
  const name=(document.getElementById('rg_name')?.value||'').trim();
  const email=(document.getElementById('rg_email')?.value||'').trim();
  const pass=document.getElementById('rg_pass')?.value||'';
  const confirm=document.getElementById('rg_confirm')?.value||'';
  const terms=document.getElementById('rg_terms')?.checked;
  const btn=document.getElementById('rg_btn');
  const valid = name.length>1 && /\S+@\S+\.\S+/.test(email) && pass.length>=8 && pass===confirm && terms;
  if(btn) btn.disabled = !valid;
}

// ── LOGIN ──
/** Converte o usuário vindo do servidor para o formato de sessão da interface. */
function sessionUser(u){
  return {id:u.id,name:u.name,email:u.email,initials:u.initials,role:u.role==='admin'?'Administrador':'Usuário'};
}
/** Depois do login no servidor: guarda a sessão e baixa o espaço de trabalho. */
async function afterServerLogin(u,remember){
  const su=sessionUser(u);
  saveSession(su,remember);
  applyWorkspace(await API.loadWorkspace());
  return su;
}
function doLogin(){
  const email=(document.getElementById('li_email')?.value||'').trim().toLowerCase();
  const pass=document.getElementById('li_pass')?.value||'';
  let valid=true;

  fieldErr('li_email_err',''); setInputState('li_email','');
  fieldErr('li_pass_err',''); setInputState('li_pass','');

  if(!email||!/\S+@\S+\.\S+/.test(email)){
    fieldErr('li_email_err','E-mail inválido'); setInputState('li_email','error'); valid=false;
  }
  if(!pass){
    fieldErr('li_pass_err','Informe sua senha'); setInputState('li_pass','error'); valid=false;
  }
  if(!valid) return;

  const btn=document.getElementById('li_btn');
  const remember=!!document.getElementById('li_remember')?.checked;
  if(btn){btn.disabled=true; btn.classList.add('loading'); btn.innerHTML='<span class="btn-spin"></span>Verificando credenciais';}

  const resetBtn=()=>{ if(btn){btn.disabled=false; btn.classList.remove('loading'); btn.textContent='Entrar na plataforma';} };
  const fail=(msg)=>{
    setInputState('li_email','error'); setInputState('li_pass','error');
    fieldErr('li_pass_err',msg||'E-mail ou senha incorretos. Confira os dados e tente novamente.');
    resetBtn();
    const card=document.getElementById('authCard');
    if(card){card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');}
    document.getElementById('li_pass')?.select();
  };
  const success=(user)=>{
    if(btn){btn.classList.remove('loading'); btn.classList.add('success'); btn.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Acesso liberado';}
    setTimeout(()=>enterApp(user),motionOK()?520:0);
  };

  if(API.online){
    API.login(email,pass)
      .then(u=>afterServerLogin(u,remember)).then(success)
      .catch(e=>fail(e.status===401?null:e.message));
    return;
  }
  setTimeout(()=>{
    const user=getUsers().find(u=>u.email===email && u.hash && u.hash===hashPass(pass));
    if(user){ saveSession(user,remember); success(user); } else fail();
  },600);
}

// ── REGISTER ──
function doRegister(){
  const name=(document.getElementById('rg_name')?.value||'').trim();
  const email=(document.getElementById('rg_email')?.value||'').trim().toLowerCase();
  const pass=document.getElementById('rg_pass')?.value||'';
  const confirm=document.getElementById('rg_confirm')?.value||'';
  let valid=true;

  // clear errors
  ['rg_name_err','rg_email_err','rg_pass_err','rg_confirm_err'].forEach(id=>fieldErr(id,''));
  ['rg_name','rg_email','rg_pass','rg_confirm'].forEach(id=>setInputState(id,''));

  if(name.length<2){fieldErr('rg_name_err','Informe seu nome completo'); setInputState('rg_name','error'); valid=false;}
  if(!/\S+@\S+\.\S+/.test(email)){fieldErr('rg_email_err','E-mail inválido'); setInputState('rg_email','error'); valid=false;}
  if(pass.length<8){fieldErr('rg_pass_err','Mínimo de 8 caracteres'); setInputState('rg_pass','error'); valid=false;}
  if(pass!==confirm){fieldErr('rg_confirm_err','As senhas não coincidem'); setInputState('rg_confirm','error'); valid=false;}
  if(!valid) return;

  const btn=document.getElementById('rg_btn');
  const showSuccess=(newUser)=>{
    // show success state
    document.getElementById('authFormArea').innerHTML=`
      <div class="auth-success">
        <div class="auth-success-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div style="font-size:17px;font-weight:700;color:var(--t1)">Conta criada com sucesso!</div>
        <div style="font-size:13px;color:var(--t3)">Bem-vindo ao Autec, <strong style="color:var(--gold2)">${esc(name.split(' ')[0])}</strong></div>
      </div>`;
    setTimeout(()=>enterApp(newUser), 1200);
  };

  if(API.online){
    if(btn){btn.disabled=true; btn.textContent='Criando conta...';}
    API.register(name,email,pass).then(u=>afterServerLogin(u,true)).then(showSuccess).catch(e=>{
      if(btn){btn.disabled=false; btn.textContent='Criar conta';}
      if(e.status===409){fieldErr('rg_email_err','Este e-mail já está cadastrado'); setInputState('rg_email','error');}
      else if(e.details&&e.details.password){fieldErr('rg_pass_err',e.details.password[0]); setInputState('rg_pass','error');}
      else showToast(e.message,'var(--red)');
    });
    return;
  }

  const users=getUsers();
  if(users.find(u=>u.email===email)){
    fieldErr('rg_email_err','Este e-mail já está cadastrado'); setInputState('rg_email','error'); return;
  }
  if(btn){btn.disabled=true; btn.textContent='Criando conta...';}
  setTimeout(()=>{
    const initials=name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
    const newUser={id:'u_'+Date.now(), name, email, role:'Usuário', initials, hash:hashPass(pass), createdAt:new Date().toISOString()};
    users.push(newUser);
    saveUsers(users);
    saveSession(newUser, true);
    showSuccess(newUser);
  },800);
}

// ── LOGIN COM GOOGLE / MICROSOFT ──────────────────────────────
// Usa as janelas oficiais de cada provedor (Google Identity Services e MSAL).
// Modo servidor: o back-end valida o token e cria a sessão.
// Modo local (GitHub Pages): o nome e o e-mail do token criam a conta neste navegador.
const G_LOGO='<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
const MS_LOGO='<svg width="18" height="18" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>';

function oauthCfg(){
  const local=window.AUTEC_OAUTH||{};
  const srv=API.online?(API.oauth||{}):{};
  const google=srv.google||local.google||'';
  const ms=(srv.microsoft&&srv.microsoft.clientId)?srv.microsoft:(local.microsoft&&local.microsoft.clientId?local.microsoft:null);
  return {google,microsoft:ms};
}
function loadScriptOnce(src,check){
  if(check()) return Promise.resolve();
  return new Promise((res,rej)=>{
    let el=document.querySelector(`script[src="${src}"]`);
    if(!el){ el=document.createElement('script'); el.src=src; el.async=true; document.head.appendChild(el); }
    el.addEventListener('load',()=>check()?res():rej(new Error('script')));
    el.addEventListener('error',()=>rej(new Error('Não foi possível carregar o login do provedor. Verifique a internet.')));
  });
}
function renderSocial(){
  const area=document.getElementById('socialArea'); if(!area) return;
  const cfg=oauthCfg();
  area.innerHTML=`
    <div class="social-g" id="gBtnHost">
      <button class="auth-social" type="button" onclick="socialNotConfigured('Google')">${G_LOGO}<span>Continuar com o Google</span></button>
    </div>
    <button class="auth-social ms" type="button" onclick="${cfg.microsoft?'loginMicrosoft()':"socialNotConfigured('Microsoft')"}">${MS_LOGO}<span>Continuar com a Microsoft</span></button>`;
  if(cfg.google) mountGoogleButton(cfg.google);
}
// Botão oficial do Google (mesmo visual de outros sites)
function mountGoogleButton(clientId){
  loadScriptOnce('https://accounts.google.com/gsi/client',()=>window.google&&google.accounts&&google.accounts.id).then(()=>{
    const host=document.getElementById('gBtnHost'); if(!host) return;
    google.accounts.id.initialize({client_id:clientId,callback:(r)=>finishOAuth('google',r.credential),ux_mode:'popup',auto_select:false,itp_support:true});
    host.innerHTML='';
    google.accounts.id.renderButton(host,{type:'standard',theme:'outline',size:'large',text:'continue_with',shape:'rectangular',logo_alignment:'center',width:Math.min(400,host.clientWidth||400),locale:'pt-BR'});
  }).catch(()=>{ /* mantém o botão próprio, que explica o problema */ });
}
async function loginMicrosoft(){
  const cfg=oauthCfg().microsoft; if(!cfg) return socialNotConfigured('Microsoft');
  const btn=document.querySelector('.auth-social.ms'); if(btn){btn.disabled=true; btn.querySelector('span').textContent='Abrindo a Microsoft…';}
  const reset=()=>{ if(btn){btn.disabled=false; btn.querySelector('span').textContent='Continuar com a Microsoft';} };
  try{
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/@azure/msal-browser@2.38.4/lib/msal-browser.min.js',()=>window.msal&&msal.PublicClientApplication);
    const app=new msal.PublicClientApplication({
      auth:{clientId:cfg.clientId,authority:'https://login.microsoftonline.com/'+(cfg.tenant||'common'),redirectUri:location.origin+location.pathname},
      cache:{cacheLocation:'sessionStorage'}
    });
    const r=await app.loginPopup({scopes:['openid','profile','email'],prompt:'select_account'});
    reset();
    await finishOAuth('microsoft',r.idToken);
  }catch(e){
    reset();
    if(e&&/user_cancelled|popup_window_error|cancel/i.test(String(e.errorCode||e.message))) return;
    showToast('Não foi possível entrar com a Microsoft: '+(e.errorMessage||e.message||'erro'),'var(--red)');
  }
}
function jwtClaims(t){
  try{ const b=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'); return JSON.parse(decodeURIComponent(escape(atob(b+'==='.slice((b.length+3)%4))))); }
  catch(e){ return {}; }
}
async function finishOAuth(provider,idToken){
  const label=provider==='google'?'Google':'Microsoft';
  try{
    let user;
    if(API.online){
      const u=await API.oauthLogin(provider,idToken);
      user=await afterServerLogin(u,true);
    } else {
      const c=jwtClaims(idToken);
      const email=String(c.email||c.preferred_username||'').toLowerCase();
      if(!email) throw new Error('A conta não informou um e-mail.');
      const name=c.name||email;
      const users=getUsers();
      user=users.find(u=>u.email===email);
      if(!user){
        const initials=name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
        user={id:'u_'+Date.now(),name,email,role:'Usuário',initials,provider:label,hash:null,createdAt:new Date().toISOString()};
        users.push(user); saveUsers(users);
      }
      saveSession(user,true);
    }
    const btn=document.getElementById('li_btn');
    if(btn){btn.classList.add('success'); btn.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Acesso liberado';}
    setTimeout(()=>enterApp(user),motionOK()?420:0);
  }catch(e){
    showToast(`Não foi possível entrar com ${label}: ${e.message}`,'var(--red)');
  }
}
function socialNotConfigured(label){
  makeModal(`<div class="modal" style="max-width:440px">
    <div class="modal-title">Entrar com ${label}</div>
    <div class="modal-sub">O login com ${label} ainda não foi ativado neste ambiente. O administrador precisa cadastrar o Autec no ${label==='Google'?'Google Cloud':'Microsoft Entra'} e informar o <b>Client ID</b> nas configurações.<br><br>Passo a passo: <code>docs/LOGIN_SOCIAL.md</code>.</div>
    <div class="modal-actions"><button class="btn-save" onclick="closeModal()">Entendi</button></div>
  </div>`);
}
function doSocialLogin(p){ p==='Microsoft'?loginMicrosoft():socialNotConfigured('Google'); }

// ── TERMOS / PRIVACIDADE ──
function showLegal(kind){
  const termos=`<h4>1. Objeto</h4>O Autec é uma plataforma de organização e gestão de contratos. Ao criar uma conta, você concorda com estes termos.
    <h4>2. Conta</h4>Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.
    <h4>3. Uso adequado</h4>É proibido enviar documentos sobre os quais você não tenha direito de uso ou que violem a legislação vigente.
    <h4>4. Responsabilidade</h4>As informações extraídas automaticamente por IA devem ser conferidas pelo usuário antes de qualquer decisão.
    <h4>5. Alterações</h4>Estes termos podem ser atualizados; a versão vigente estará sempre disponível nesta página.`;
  const priv=`<h4>1. Dados coletados</h4>Nome, e-mail e os documentos e metadados de contratos que você cadastrar.
    <h4>2. Finalidade</h4>Os dados são usados exclusivamente para operar a plataforma, conforme a LGPD (Lei nº 13.709/2018).
    <h4>3. Armazenamento</h4>Nesta versão, os dados ficam armazenados localmente no seu navegador.
    <h4>4. Seus direitos</h4>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento.
    <h4>5. Contato</h4>Dúvidas sobre privacidade podem ser enviadas ao encarregado de dados da empresa.`;
  makeModal(`<div class="modal" style="max-width:480px;width:90%">
    <div class="modal-title">${kind==='termos'?'Termos de Uso':'Política de Privacidade'}</div>
    <div class="legal-body">${kind==='termos'?termos:priv}</div>
    <div class="modal-actions"><button class="btn-save" style="flex:1;padding:9px" onclick="closeModal()">Entendi</button></div>
  </div>`);
}

// ── FORGOT PASSWORD (redefinição local) ──
function showForgot(){
  if(API.online){
    makeModal(`<div class="modal" style="max-width:420px">
      <div class="modal-title">Recuperar senha</div>
      <div class="modal-sub">Por segurança, a redefinição é feita por um administrador do Autec. Peça a ele para gerar uma nova senha para o seu e-mail.</div>
      <div class="modal-actions"><button class="btn-save" onclick="closeModal()">Entendi</button></div>
    </div>`);
    return;
  }
  const el=document.getElementById('authFormArea');
  document.getElementById('authCard')?.classList.add('plain');
  el.innerHTML=`
    <div style="margin-bottom:20px">
      <button class="auth-link" style="display:flex;align-items:center;gap:5px;font-size:12px" onclick="switchTab('login')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Voltar ao login
      </button>
    </div>
    <div style="font-size:19px;font-weight:700;color:var(--t1);margin-bottom:4px">Recuperar senha</div>
    <div style="font-size:12.5px;color:var(--t3);margin-bottom:20px">Informe o e-mail cadastrado para definir uma nova senha.</div>
    <div class="auth-field">
      <div class="auth-label">E-mail cadastrado</div>
      <div class="auth-input-wrap">
        <svg class="auth-input-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 6l6 4 6-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        <input class="auth-input has-icon" id="fp_email" type="email" placeholder="seu@email.com" onkeydown="if(event.key==='Enter')doForgot()">
      </div>
      <div class="auth-error-msg" id="fp_err" style="display:none"></div>
    </div>
    <button class="auth-btn" onclick="doForgot()">Continuar</button>
  `;
  setTimeout(()=>document.getElementById('fp_email')?.focus(),50);
}

function doForgot(){
  const email=(document.getElementById('fp_email')?.value||'').trim().toLowerCase();
  fieldErr('fp_err',''); setInputState('fp_email','');
  if(!email||!/\S+@\S+\.\S+/.test(email)){fieldErr('fp_err','E-mail inválido'); setInputState('fp_email','error'); return;}
  const user=getUsers().find(u=>u.email===email);
  if(!user){fieldErr('fp_err','Nenhuma conta encontrada com este e-mail'); setInputState('fp_email','error'); return;}
  document.getElementById('authFormArea').innerHTML=`
    <div style="font-size:19px;font-weight:700;color:var(--t1);margin-bottom:4px">Nova senha</div>
    <div style="font-size:12.5px;color:var(--t3);margin-bottom:20px">Defina uma nova senha para <strong style="color:var(--t2)">${esc(email)}</strong>.</div>
    <div class="auth-field">
      <div class="auth-label">Nova senha</div>
      <div class="auth-input-wrap">
        <input class="auth-input has-eye" id="fp_pass" type="password" placeholder="Mín. 8 caracteres">
        <span class="auth-eye" onclick="toggleEye('fp_pass','fp_eye')" id="fp_eye">${eyeIcon(false)}</span>
      </div>
      <div class="auth-error-msg" id="fp_pass_err" style="display:none"></div>
    </div>
    <div class="auth-field">
      <div class="auth-label">Confirmar nova senha</div>
      <div class="auth-input-wrap">
        <input class="auth-input" id="fp_confirm" type="password" placeholder="Repita a senha" onkeydown="if(event.key==='Enter')doResetPass('${esc(email)}')">
      </div>
      <div class="auth-error-msg" id="fp_confirm_err" style="display:none"></div>
    </div>
    <button class="auth-btn" onclick="doResetPass('${esc(email)}')">Redefinir senha</button>
    <div class="auth-footer"><button class="auth-link" onclick="switchTab('login')">Cancelar</button></div>`;
  setTimeout(()=>document.getElementById('fp_pass')?.focus(),50);
}

function doResetPass(email){
  const pass=document.getElementById('fp_pass')?.value||'';
  const confirm=document.getElementById('fp_confirm')?.value||'';
  fieldErr('fp_pass_err',''); fieldErr('fp_confirm_err','');
  if(pass.length<8){fieldErr('fp_pass_err','Mínimo de 8 caracteres'); return;}
  if(pass!==confirm){fieldErr('fp_confirm_err','As senhas não coincidem'); return;}
  const users=getUsers(); const u=users.find(x=>x.email===email);
  if(!u){switchTab('login'); return;}
  u.hash=hashPass(pass); saveUsers(users);
  switchTab('login');
  setTimeout(()=>{const i=document.getElementById('li_email'); if(i) i.value=email; document.getElementById('li_pass')?.focus();},60);
  showToast('Senha redefinida — faça login com a nova senha','var(--green)');
}

// ── ENTER APP ──
function enterApp(user){
  // Update sidebar user info
  const nameEl=document.querySelector('.sb-user-name');
  const roleEl=document.querySelector('.sb-user-role');
  const avatarEl=document.querySelector('.sb-avatar');
  if(nameEl) nameEl.textContent=user.name;
  if(roleEl) roleEl.textContent=user.role||'Usuário';
  if(avatarEl) avatarEl.textContent=user.initials||user.name.slice(0,2).toUpperCase();

  refreshAll();
  const screen=document.getElementById('authScreen');
  const app=document.getElementById('appRoot');
  if(motionOK()){ playWelcome(user); return; }
  const ms=0;
  screen.classList.remove('auth-enter');
  screen.classList.add('auth-leave');
  setTimeout(()=>{
    screen.style.display='none'; screen.classList.remove('auth-leave');
    app.style.opacity=''; app.style.transition='';
    app.style.display='flex';
    if(motionOK()){ app.classList.remove('app-enter'); void app.offsetWidth; app.classList.add('app-enter'); setTimeout(()=>app.classList.remove('app-enter'),900); }
  },ms);
}

// Boas-vindas: o painel azul se expande, mostra o carregamento real da carteira e abre o sistema
function playWelcome(user){
  const screen=document.getElementById('authScreen');
  const app=document.getElementById('appRoot');
  const aside=document.querySelector('.auth-aside');
  const from=aside&&getComputedStyle(aside).display!=='none'?aside.getBoundingClientRect().width+'px':'0px';
  let rows=[]; try{rows=portfolio();}catch(e){}
  const n=rows.length, venc=rows.filter(r=>r.s==='overdue').length, soon=rows.filter(r=>r.s==='expiring').length;
  const pend=allFilesList().filter(f=>f.hasBlob&&f.processing==='pending').length;
  const first=(user.name||'').split(' ')[0];
  const steps=[
    ['Validando acesso','Seguro'],
    ['Carregando carteira',`${n} contrato${n!==1?'s':''}`],
    ['Verificando vencimentos',venc||soon?[venc?`${venc} vencido${venc>1?'s':''}`:'',soon?`${soon} vencendo`:''].filter(Boolean).join(' · '):'Tudo em dia'],
    ['Preparando seu painel',pend?`${pend} para leitura da IA`:'Pronto']
  ];
  const ov=document.createElement('div');
  ov.className='welcome'; ov.style.width=from;
  ov.innerHTML=`<div class="boot-lines" aria-hidden="true"></div>
    <div class="wl-inner">
      ${document.querySelector('.boot-mark')?'':''}<div class="wl-mark">${document.querySelector('.auth-aside .brand-mark')?.outerHTML||''}</div>
      <h1 class="wl-hello">Olá, ${esc(first)}</h1>
      <p class="wl-sub">Preparando seu ambiente de gestão contratual</p>
      <ul class="wl-steps">${steps.map(([t,r])=>`<li><span class="wl-ico"><span class="wl-spin"></span><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="wl-t">${t}</span><b class="wl-r">${esc(r)}</b></li>`).join('')}</ul>
    </div>`;
  document.body.appendChild(ov);
  void ov.offsetWidth;
  ov.style.width='100vw';
  ov.classList.add('open');
  const lis=[...ov.querySelectorAll('.wl-steps li')];
  const t0=620, step=420;
  lis.forEach((li,i)=>{
    setTimeout(()=>li.classList.add('on'),t0+i*step);
    setTimeout(()=>li.classList.add('done'),t0+i*step+300);
  });
  const end=t0+lis.length*step+380;
  setTimeout(()=>{
    screen.style.display='none'; screen.classList.remove('auth-enter','auth-leave');
    app.style.opacity=''; app.style.transition=''; app.style.display='flex';
    ov.classList.add('out');
    app.classList.remove('app-enter'); void app.offsetWidth; app.classList.add('app-enter');
    setTimeout(()=>{ov.remove(); app.classList.remove('app-enter');},900);
  },end);
  ov.addEventListener('click',()=>{ /* clique pula a animação */ lis.forEach(li=>li.classList.add('on','done')); });
}

// ── LOGOUT ──
function logout(){
  if(API.online){ API.logout(); DATA.folders=[]; DATA.files={root:[]}; DATA.alerts={}; }
  clearSession(); closeModal(); closeDrawer(); clearSearch(); if(S.view==='search') S.view='dashboard';
  const app=document.getElementById('appRoot');
  app.style.transition='opacity .25s'; app.style.opacity='0';
  setTimeout(()=>{
    app.style.display='none';
    const screen=document.getElementById('authScreen');
    screen.style.display='flex'; screen.style.opacity='0'; screen.style.transform='scale(.98)';
    screen.style.transition='opacity .3s,transform .3s';
    authTab='login'; pwVisible={login:false,register:false,confirm:false};
    document.getElementById('tabLogin').classList.add('active');
    document.getElementById('tabRegister').classList.remove('active');
    renderAuthForm();
    screen.style.opacity=''; screen.style.transform=''; screen.style.transition='';
    playAuthEnter();
  },250);
}

// ── INIT AUTH ──
function motionOK(){return !(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);}
function playAuthEnter(){
  const screen=document.getElementById('authScreen');
  if(!motionOK()){ document.getElementById('li_email')?.focus(); return; }
  screen.classList.remove('auth-enter'); void screen.offsetWidth; screen.classList.add('auth-enter');
  setTimeout(()=>document.getElementById('li_email')?.focus({preventScroll:true}),750);
}
// Abertura: a marca se desenha e o painel azul "encolhe" até virar o painel lateral do login
function hideSplash(then,toLogin){
  const sp=document.getElementById('bootSplash');
  if(!sp){then&&then();return;}
  if(!motionOK()){sp.remove(); then&&then(); return;}
  const seen=SS.getItem('autec_boot');
  SS.setItem('autec_boot','1');
  if(seen) sp.classList.add('quick');
  const hold=seen?1350:2950;
  setTimeout(()=>{
    const aside=document.querySelector('.auth-aside');
    const w=toLogin&&aside&&getComputedStyle(aside).display!=='none'?aside.getBoundingClientRect().width:0;
    sp.classList.add('closing');
    if(w){
      sp.style.width=w+'px';            // vira o painel lateral
      setTimeout(()=>{ then&&then(); sp.classList.add('out'); setTimeout(()=>sp.remove(),550); },800);
    } else {
      sp.classList.add('out'); then&&then(); setTimeout(()=>sp.remove(),600);
    }
  },hold);
}
function initAuth(){
  const y=document.getElementById('authYear'); if(y) y.textContent=new Date().getFullYear();
  document.documentElement.classList.toggle('no-signup',API.online&&!API.signup);
  renderAuthForm();
  if(API.online){
    // modo servidor: valida o token salvo e baixa os dados antes de abrir o sistema
    if(!API.token){ clearSession(); hideSplash(playAuthEnter,true); return; }
    API.me().then(async u=>{ saveSession(sessionUser(u),true); applyWorkspace(await API.loadWorkspace()); showSessionApp(getSession()); })
      .catch(()=>{ API.logout(); clearSession(); hideSplash(playAuthEnter,true); });
    return;
  }
  const session=getSession();
  if(session) showSessionApp(session); else hideSplash(playAuthEnter,true);
}
function showSessionApp(session){
  {
    // auto-login: skip animation
    document.getElementById('authScreen').style.display='none';
    document.getElementById('appRoot').style.display='flex';
    const nameEl=document.querySelector('.sb-user-name');
    const roleEl=document.querySelector('.sb-user-role');
    const avatarEl=document.querySelector('.sb-avatar');
    if(nameEl) nameEl.textContent=session.name;
    if(roleEl) roleEl.textContent=session.role||'Usuário';
    if(avatarEl) avatarEl.textContent=session.initials||session.name.slice(0,2).toUpperCase();
    const app=document.getElementById('appRoot');
    hideSplash(()=>{ if(motionOK()){ app.classList.add('app-enter'); setTimeout(()=>app.classList.remove('app-enter'),900);} });
  }
}
