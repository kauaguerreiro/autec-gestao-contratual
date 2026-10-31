/* Autec — Conta do usuário e administração (modo servidor) */
// ══════════════════════════════════════════════
//  CONTA E ADMINISTRAÇÃO
// ══════════════════════════════════════════════
const ACCOUNT={tab:'conta'};
const AUDIT_LBL={
  'auth.login':'Entrou no sistema','auth.login_failed':'Tentativa de login recusada','auth.register':'Criou a conta',
  'auth.password_changed':'Trocou a própria senha','auth.password_reset':'Redefiniu a senha de um usuário',
  'workspace.save':'Salvou alterações','file.upload':'Enviou um arquivo','ai.message':'Usou a leitura por IA','user.update':'Alterou um usuário'
};

function isAdmin(){ return (getSession()?.role||'')==='Administrador'; }

function openAccount(tab){
  if(!API.online){ showToast('Disponível quando o Autec está conectado ao servidor','var(--amber)'); return; }
  ACCOUNT.tab=tab||ACCOUNT.tab||'conta';
  if(!isAdmin()&&ACCOUNT.tab!=='conta') ACCOUNT.tab='conta';
  const u=getSession()||{};
  const tabs=[['conta','Minha conta'],...(isAdmin()?[['usuarios','Usuários'],['auditoria','Auditoria']]:[])];
  makeModal(`<div class="modal acc-modal">
    <div class="acc-head">
      <div class="acc-avatar">${esc(u.initials||'?')}</div>
      <div><div class="modal-title" style="margin:0">${esc(u.name||'')}</div><div class="acc-sub">${esc(u.email||'')} · ${esc(u.role||'')}</div></div>
      <button class="drawer-close" style="margin-left:auto" onclick="closeModal()" aria-label="Fechar">${IC.close}</button>
    </div>
    <div class="acc-tabs">${tabs.map(([k,l])=>`<button class="acc-tab ${ACCOUNT.tab===k?'on':''}" onclick="openAccount('${k}')">${l}</button>`).join('')}</div>
    <div class="acc-body" id="accBody"><div class="rx-empty">Carregando…</div></div>
  </div>`);
  ({conta:renderAccountTab,usuarios:renderUsersTab,auditoria:renderAuditTab})[ACCOUNT.tab]();
}

function renderAccountTab(){
  document.getElementById('accBody').innerHTML=`
    <div class="acc-section-title">Trocar senha</div>
    <div class="modal-label">Senha atual</div><input class="modal-input" type="password" id="acc_cur" autocomplete="current-password">
    <div class="modal-label">Nova senha</div><input class="modal-input" type="password" id="acc_new" autocomplete="new-password" placeholder="Mínimo de 8 caracteres">
    <div class="modal-label">Confirmar nova senha</div><input class="modal-input" type="password" id="acc_new2" autocomplete="new-password">
    <div class="modal-err" id="acc_err"></div>
    <div class="modal-actions"><button class="btn-save" onclick="saveOwnPassword()">Salvar nova senha</button></div>`;
}
async function saveOwnPassword(){
  const cur=document.getElementById('acc_cur').value, n1=document.getElementById('acc_new').value, n2=document.getElementById('acc_new2').value;
  const err=document.getElementById('acc_err'); const fail=m=>{err.textContent=m; err.style.display='block';};
  err.style.display='none';
  if(n1.length<8) return fail('A nova senha precisa ter pelo menos 8 caracteres.');
  if(n1!==n2) return fail('As senhas não coincidem.');
  try{ await API.changePassword(cur,n1); closeModal(); showToast('Senha alterada com sucesso','var(--green)'); }
  catch(e){ fail(e.message); }
}

async function renderUsersTab(){
  const body=document.getElementById('accBody');
  try{
    const users=await API.users(); const me=getSession()?.id;
    body.innerHTML=`<div class="acc-section-title">${users.length} usuário${users.length!==1?'s':''} na organização</div>
      <div class="acc-users">${users.map(u=>`<div class="acc-user ${u.active?'':'off'}">
        <div class="acc-avatar sm">${esc(u.initials)}</div>
        <div class="acc-user-main"><b>${esc(u.name)}${u.id===me?' <em>(você)</em>':''}</b><span>${esc(u.email)} · último acesso ${u.lastLoginAt?fmtDate(u.lastLoginAt.slice(0,10)):'—'}</span></div>
        <select class="modal-input acc-role" ${u.id===me?'disabled':''} onchange="setUserRole(${u.id},this.value)">
          <option value="user" ${u.role==='user'?'selected':''}>Usuário</option><option value="admin" ${u.role==='admin'?'selected':''}>Administrador</option></select>
        <button class="btn-ghost acc-btn" onclick="askResetPassword(${u.id},'${esc(u.name).replace(/'/g,'&#39;')}')">Redefinir senha</button>
        ${u.id===me?'':`<button class="btn-ghost acc-btn ${u.active?'danger':''}" onclick="toggleUser(${u.id},${!u.active})">${u.active?'Desativar':'Reativar'}</button>`}
      </div>`).join('')}</div>
      <p class="acc-note">Novos usuários entram pela tela de login (<b>Criar conta</b>) quando o cadastro está liberado no servidor (<code>ALLOW_SIGNUP</code>).</p>`;
  }catch(e){ body.innerHTML=`<div class="modal-err" style="display:block">${esc(e.message)}</div>`; }
}
async function setUserRole(id,role){ try{ await API.updateUser(id,{role}); showToast('Perfil atualizado','var(--green)'); }catch(e){ showToast(e.message,'var(--red)'); renderUsersTab(); } }
async function toggleUser(id,active){ try{ await API.updateUser(id,{active}); showToast(active?'Usuário reativado':'Usuário desativado — não consegue mais entrar','var(--green)'); renderUsersTab(); }catch(e){ showToast(e.message,'var(--red)'); } }
function askResetPassword(id,name){
  const body=document.getElementById('accBody');
  body.innerHTML=`<div class="acc-section-title">Nova senha para ${name}</div>
    <div class="modal-label">Nova senha</div><input class="modal-input" type="text" id="acc_reset" autocomplete="off" placeholder="Mínimo de 8 caracteres">
    <p class="acc-note" style="margin-top:-6px">Envie a senha à pessoa por um canal seguro e peça que ela a troque em <b>Minha conta</b>.</p>
    <div class="modal-err" id="acc_err"></div>
    <div class="modal-actions"><button class="btn-save" onclick="doResetUser(${id})">Redefinir</button><button class="btn-ghost" onclick="renderUsersTab()">Voltar</button></div>`;
}
async function doResetUser(id){
  const v=document.getElementById('acc_reset').value; const err=document.getElementById('acc_err');
  if(v.length<8){err.textContent='Mínimo de 8 caracteres.'; err.style.display='block'; return;}
  try{ await API.resetPassword(id,v); showToast('Senha redefinida','var(--green)'); renderUsersTab(); }
  catch(e){ err.textContent=e.message; err.style.display='block'; }
}

async function renderAuditTab(){
  const body=document.getElementById('accBody');
  try{
    const rows=await API.audit(80);
    body.innerHTML=`<div class="acc-section-title">Últimas ações registradas</div>
      <div class="acc-audit">${rows.map(r=>`<div class="acc-audit-row"><span class="acc-audit-at">${new Date(r.at.replace(' ','T')+'Z').toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span><span class="acc-audit-who">${esc(r.user||'—')}</span><span class="acc-audit-what">${esc(AUDIT_LBL[r.action]||r.action)}</span></div>`).join('')||'<div class="rx-empty">Nenhum registro ainda.</div>'}</div>`;
  }catch(e){ body.innerHTML=`<div class="modal-err" style="display:block">${esc(e.message)}</div>`; }
}
