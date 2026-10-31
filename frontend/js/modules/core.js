/* Autec — Estado, utilitários, árvore de pastas e navegação */
// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
const S = {
  folder: null,
  file: null,
  sort: 'nome',
  view: 'dashboard',
  prevView: 'dashboard',
  search: '',
  expandedFolders: new Set(['f1','f2']),
  drawerMode: null,
  bannerDismissed: false
};

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function fmtDate(d){
  if(!d||d==='—') return '—';
  const[y,m,day]=d.split('-'); return `${day}/${m}/${y}`;
}
function daysUntil(d){
  if(!d||d==='—') return null;
  const[y,m,day]=d.split('-').map(Number);
  const end=new Date(y,m-1,day), now=new Date(); now.setHours(0,0,0,0);
  return Math.round((end-now)/86400000);
}
function parseVal(v){
  if(!v||v==='—'||v==='Variável') return 0;
  return parseFloat(v.replace(/[^\d,]/g,'').replace(',','.'))||0;
}
function findFolder(id,nodes=DATA.folders){
  for(const n of nodes){if(n.id===id) return n; if(n.children){const f=findFolder(id,n.children); if(f) return f;}} return null;
}
function getFolderPath(id,nodes=DATA.folders,path=[]){
  for(const n of nodes){const p=[...path,n]; if(n.id===id) return p; if(n.children){const f=getFolderPath(id,n.children,p); if(f) return f;}} return null;
}
function getAllDescendantFiles(fid){
  const files=DATA.files[fid]||[];
  const folder=findFolder(fid);
  if(!folder||!folder.children) return files;
  return files.concat(...folder.children.map(c=>getAllDescendantFiles(c.id)));
}
function countFiles(fid){
  return getAllDescendantFiles(fid).length;
}
function findFile(id){
  for(const arr of Object.values(DATA.files)){const f=arr.find(x=>x.id===id); if(f) return f;} return null;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function todayISO(){const t=new Date();return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;}
function allFilesList(){return Object.values(DATA.files).flat();}
function fileFolderId(fileId){for(const [k,arr] of Object.entries(DATA.files)){if(arr.some(x=>x.id===fileId)) return k;} return null;}
const DEFAULT_ALERT_DAYS=30;
function alertDaysFor(fid){
  const path=getFolderPath(fid)||[];
  for(let i=path.length-1;i>=0;i--){const a=DATA.alerts[path[i].id]; if(a) return a;}
  return DATA.alerts.__global||DEFAULT_ALERT_DAYS;
}
// ── Vínculos entre documentos (contrato principal ↔ aditivos/distratos) ──
function childrenOf(id){return allFilesList().filter(x=>x.parentId===id&&x.id!==id);}
function parentOf(f){return f&&f.parentId?findFile(f.parentId):null;}
// Distrato/resilição vinculado que encerra o contrato
function terminationDoc(f){
  if(!f) return null;
  if(f.contractType==='Distrato') return f;
  const root=f.contractType==='Principal'?f:parentOf(f);
  if(!root) return null;
  return childrenOf(root.id).find(x=>x.contractType==='Distrato')||null;
}
// Término efetivo: considera prorrogações feitas por aditivos vinculados
function effEnd(f){
  const root=f.contractType==='Principal'?f:(parentOf(f)||f);
  const ends=[root,...childrenOf(root.id).filter(x=>x.contractType==='Aditivo'),f]
    .map(x=>x.endDate).filter(d=>d&&d!=='—');
  if(f.contractType==='Principal'||f.contractType==='Aditivo'){
    // sem término definido em nenhum documento = prazo indeterminado
    if(!ends.length) return '—';
    return ends.sort().pop();
  }
  return f.endDate||'—';
}
// Status efetivo:
//  Encerrado = existe distrato/resilição vinculado (ou o próprio documento é o distrato)
//  Vencido   = prazo passou, mas não há distrato
//  Vencendo  = dentro da janela de alerta
function st(f){
  if(f.statusMode==='manual') return f.status;
  if(f.hasBlob&&!f.aiAt&&(!f.endDate||f.endDate==='—')) return 'pending';
  if(terminationDoc(f)) return 'expired';
  const d=daysUntil(effEnd(f));
  if(d===null) return 'active';
  if(d<0) return 'overdue';
  if(d<=alertDaysFor(fileFolderId(f.id))) return 'expiring';
  return 'active';
}
function daysLabel(d){
  if(d===null) return '—';
  if(d<0) return `Venceu há ${-d} dia${d===-1?'':'s'}`;
  if(d===0) return 'Vence hoje';
  if(d===1) return 'Vence amanhã';
  return `${d} dias`;
}
function fmtMoney(v){ const n=parseVal(v); if(!n) return '—'; return 'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2}); }

// ══════════════════════════════════════════════
//  BADGE BUILDERS
// ══════════════════════════════════════════════
const STATUS_LBL={active:'Ativo',expiring:'Vencendo',overdue:'Vencido',expired:'Encerrado',pending:'Não lido'};
function typeBadge(t){
  const map={Principal:'badge-principal',Aditivo:'badge-aditivo',Distrato:'badge-distrato'};
  return `<span class="badge ${map[t]||'badge-outro'}"><span class="badge-dot"></span>${t}</span>`;
}
function statusBadge(s){
  const map={active:'badge-active',expiring:'badge-expiring',overdue:'badge-overdue',expired:'badge-expired',pending:'badge-pending'};
  const lbl=STATUS_LBL;
  return `<span class="badge ${map[s]||'badge-outro'}"><span class="badge-dot"></span>${lbl[s]||'—'}</span>`;
}

// ══════════════════════════════════════════════
//  NAV TREE
// ══════════════════════════════════════════════
const ICONS={
  building:`<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="11" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.3"/><path d="M6 9h4M8 7v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  truck:`<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M11 7l3 2v3h-3V7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="4" cy="13" r="1.5" fill="currentColor"/><circle cx="12" cy="13" r="1.5" fill="currentColor"/></svg>`,
  users:`<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M1 14a5 5 0 0110 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="13" cy="6" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M15 14a3 3 0 00-4-2.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  briefcase:`<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="14" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 5V4a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.3"/><path d="M1 9h14" stroke="currentColor" stroke-width="1.3"/></svg>`,
  folder:`<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4a1 1 0 011-1h3l2 2h5a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" stroke-width="1.3"/></svg>`
};

function buildNavTree(nodes,level=0){
  return nodes.map(n=>{
    const hasC=n.children&&n.children.length>0;
    const isExp=S.expandedFolders.has(n.id);
    const cnt=countFiles(n.id);
    const isAct=S.folder===n.id;
    const icon=ICONS[n.icon||'folder'];
    let html=`<div class="tree-group">
      <div class="tree-parent ${isAct?'active':''}" onclick="selectFolder('${n.id}')" ondragover="dndOver(event,'${n.id}')" ondragleave="dndLeave(event)" ondrop="dndDrop(event,'${n.id}')">
        <span class="tree-arrow ${hasC&&isExp?'open':''}" onclick="toggleExpand(event,'${n.id}')">
          ${hasC?`<svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M2 1l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`:'<span style="width:7px;display:inline-block"></span>'}
        </span>
        <span class="tree-icon" style="color:${isAct?'var(--gold)':'var(--t3)'}">${icon}</span>
        <span class="tree-label">${esc(n.name)}</span>
        ${cnt>0?`<span class="tree-count">${cnt}</span>`:''}
        <span class="tree-item-actions" onclick="event.stopPropagation()">
          <button class="tree-action-btn" title="Renomear" onclick="openEditFolderModal('${n.id}')">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="tree-action-btn del" title="Excluir" onclick="confirmDeleteFolder('${n.id}')">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11 3.5l-.8 8a1 1 0 01-1 .9H4.8a1 1 0 01-1-.9L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </span>
      </div>`;
    if(hasC&&isExp){
      html+=`<div class="tree-children">`;
      n.children.forEach(c=>{
        const cAct=S.folder===c.id;
        const cCnt=countFiles(c.id);
        if(c.children&&c.children.length>0){
          html+=buildNavTree([c],level+1);
        } else {
          html+=`<div class="tree-child ${cAct?'active':''}" onclick="selectFolder('${c.id}')" ondragover="dndOver(event,'${c.id}')" ondragleave="dndLeave(event)" ondrop="dndDrop(event,'${c.id}')">
            <span class="tree-child-dot"></span>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.name)}</span>
            ${cCnt>0?`<span class="tree-count">${cCnt}</span>`:''}
            <span class="tree-item-actions" onclick="event.stopPropagation()">
              <button class="tree-action-btn" title="Renomear" onclick="openEditFolderModal('${c.id}')">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button class="tree-action-btn del" title="Excluir" onclick="confirmDeleteFolder('${c.id}')">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11 3.5l-.8 8a1 1 0 01-1 .9H4.8a1 1 0 01-1-.9L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </span>
          </div>`;
        }
      });
      html+=`</div>`;
    }
    html+=`</div>`;
    return html;
  }).join('');
}

function filterTree(nodes,term){
  return nodes.reduce((a,n)=>{const ch=filterTree(n.children||[],term); const m=n.name.toLowerCase().includes(term); if(m||ch.length>0){a.push({...n,children:ch}); if(ch.length>0) S.expandedFolders.add(n.id);} return a;},[]);
}
function renderNav(){
  const nodes=S.search?filterTree(DATA.folders,S.search):DATA.folders;
  document.getElementById('navTree').innerHTML=nodes.length?buildNavTree(nodes):(S.search?'<div style="padding:8px 14px;font-size:11.5px;color:var(--t3)">Nenhum espaço encontrado</div>':'');
  updateNavActive();
}
function updateNavActive(){
  const map={dashboard:'navDash',vencimentos:'navVenc',relatorios:'navRel',files:'navFiles',folder:'navFiles'};
  document.body.classList.toggle('explorer',S.view==='files'||S.view==='folder');
  ['navDash','navVenc','navRel','navFiles'].forEach(id=>document.getElementById(id)?.classList.toggle('active',map[S.view]===id));
}

function toggleExpand(e,id){
  e.stopPropagation();
  S.expandedFolders.has(id)?S.expandedFolders.delete(id):S.expandedFolders.add(id);
  renderNav();
}

// ══════════════════════════════════════════════
//  FOLDER NAVIGATION
// ══════════════════════════════════════════════
function clearSearch(){
  S.search='';
  const inp=document.getElementById('searchInput'); if(inp) inp.value='';
}
function selectFolder(id){
  closeNav();
  if(id&&id===S.folder&&S.view==='folder') return;
  clearSearch(); if(S.sel) S.sel.clear();
  S.view=id?'folder':'dashboard';
  S.folder=id; S.file=null; S.bannerDismissed=false;
  if(id) S.expandedFolders.add(id);
  renderNav(); renderBreadcrumb(); renderWorkspace(); closeDrawer();
}
function toggleNav(){document.body.classList.toggle('nav-open');}
function closeNav(){document.body.classList.remove('nav-open');}
function goView(v){closeNav(); clearSearch(); if(S.sel) S.sel.clear(); S.view=v; S.folder=null; S.file=null; S.bannerDismissed=false; renderNav(); renderBreadcrumb(); renderWorkspace(); closeDrawer();}
function goHome(){goView('dashboard');}
function goVencimentos(){goView('vencimentos');}
function goRelatorios(){goView('relatorios');}
function refreshAll(){renderNav(); renderBreadcrumb(); renderWorkspace(); updateExpiringCount();}
function updateExpiringCount(){
  const el=document.getElementById('expiringNavCount');
  const n=allFilesList().filter(f=>st(f)==='expiring').length;
  if(el){el.textContent=n; el.style.display=n?'':'none';}
}

// ══════════════════════════════════════════════
//  BREADCRUMB
// ══════════════════════════════════════════════
function renderBreadcrumb(){
  const el=document.getElementById('breadcrumb');
  const titles={dashboard:'Visão geral',vencimentos:'Vencimentos',relatorios:'Relatórios',search:'Resultados da busca',files:'Todos os arquivos'};
  if(S.view==='files'||S.view==='folder'){el.innerHTML=`<span class="bc-item last">Arquivos</span>`; return;}
  if(S.view!=='folder'||!S.folder){
    el.innerHTML=S.view==='dashboard'?`<span class="bc-item last">Visão geral</span>`:`<span class="bc-item" onclick="goHome()">Início</span><span class="bc-sep">›</span><span class="bc-item last">${titles[S.view]||''}</span>`;
    return;
  }
  const path=getFolderPath(S.folder)||[];
  let h=`<span class="bc-item" onclick="goHome()">Início</span>`;
  path.forEach((n,i)=>{
    h+=`<span class="bc-sep">›</span>`;
    if(i===path.length-1) h+=`<span class="bc-item last">${esc(n.name)}</span>`;
    else h+=`<span class="bc-item" onclick="selectFolder('${n.id}')">${esc(n.name)}</span>`;
  });
  el.innerHTML=h;
}

// ══════════════════════════════════════════════
//  WORKSPACE RENDERER
// ══════════════════════════════════════════════
function renderWorkspace(){
  const el=document.getElementById('workspaceContent');
  updateExpiringCount();
  if(S.view==='search') renderSearch(el);
  else if(S.view==='vencimentos') renderVencimentos(el);
  else if(S.view==='relatorios') renderRelatorios(el);
  else if(S.view==='files'||(S.view==='folder'&&S.folder&&findFolder(S.folder))){ renderExplorer(el); el.insertAdjacentHTML('afterbegin',explorerHead()); return; }
  else {S.view='dashboard'; S.folder=null; renderDashboard(el);}
  if(S.view!=='dashboard'&&S.view!=='relatorios') el.insertAdjacentHTML('afterbegin',pageHead());
}

function pageHead(){
  const hoje=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
  let t='',sub='';
  if(S.view==='dashboard'){t='Visão geral'; sub='Panorama consolidado da carteira de contratos.';}
  else if(S.view==='vencimentos'){t='Vencimentos'; sub='Acompanhamento de prazos e janelas de alerta.';}
  else if(S.view==='relatorios'){t='Relatórios'; sub='Carteira por unidade, região e fornecedor: contratos ativos, vencidos e encerrados.';}
  else if(S.view==='search'){t='Resultados da busca'; sub='Contratos que correspondem ao termo pesquisado.';}
  else { const f=findFolder(S.folder); const p=(getFolderPath(S.folder)||[]).slice(0,-1).map(n=>n.name).join(' / ');
    t=f?f.name:''; sub=p?`Em ${p}`:'Espaço de trabalho'; }
  return `<div class="page-head"><div><h1 class="page-title">${esc(t)}</h1><div class="page-sub">${esc(sub)}</div></div><div class="page-meta">${hoje}</div></div>`;
}
