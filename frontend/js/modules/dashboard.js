/* Autec — Tela Visão geral */
// ══════════════════════════════════════════════
//  DASHBOARD (home)
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
//  CARTEIRA (base comum para visão geral)
// ══════════════════════════════════════════════
function portfolio(){
  const all=allFilesList();
  const contracts=all.filter(f=>f.contractType==='Principal'||(f.contractType==='Aditivo'&&!(f.parentId&&findFile(f.parentId))));
  const effValue=f=>{
    const docs=[f,...childrenOf(f.id).filter(x=>x.contractType==='Aditivo')].filter(x=>parseVal(x.value)>0)
      .sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate)));
    return docs.length?parseVal(docs[docs.length-1].value):0;
  };
  const grp=s=>s==='active'||s==='expiring'?'ativo':s==='overdue'?'vencido':s==='expired'?'encerrado':'naolido';
  return contracts.map(f=>{
    const fid=fileFolderId(f.id); const p=fid&&fid!=='root'?(getFolderPath(fid)||[]):[];
    return {f,s:st(f),g:grp(st(f)),v:effValue(f),end:effEnd(f),unit:p[0]||{id:'root',name:'Sem pasta'},path:p};
  });
}
const brl=n=>n>0?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\u00a0/g,' '):'—';
const brlShort=n=>n>=1e6?'R$ '+(n/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi':n>=1e4?'R$ '+(n/1e3).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil':brl(n);

function renderDashboard(el){
  const rows=portfolio();
  const by=g=>rows.filter(r=>r.g===g);
  const sum=a=>a.reduce((s,r)=>s+r.v,0);
  const ativos=by('ativo'), vencidos=by('vencido'), encerrados=by('encerrado'), naolidos=by('naolido');
  const vencendo=rows.filter(r=>r.s==='expiring');
  const total=rows.length;
  const pendDocs=allFilesList().filter(f=>f.hasBlob&&f.processing==='pending').length;

  const user=getSession(); const first=(user?.name||'').split(' ')[0];
  const h=new Date().getHours(); const hi=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const plural=(n,s,p)=>`${n} ${n===1?s:p}`;
  let summary=`${plural(total,'contrato','contratos')} na carteira`+(sum(ativos)?`, ${brl(sum(ativos))} por mês em contratos ativos.`:'.');
  const todo=[];
  if(vencidos.length) todo.push(`${plural(vencidos.length,'contrato vencido aguarda','contratos vencidos aguardam')} renovação ou distrato`);
  if(vencendo.length) todo.push(`${plural(vencendo.length,'vence','vencem')} em breve`);
  if(pendDocs) todo.push(`${plural(pendDocs,'documento ainda não foi lido','documentos ainda não foram lidos')} pela IA`);
  const todoTxt=todo.length?todo.join('; ').replace(/^./,c=>c.toUpperCase())+'.':'Nenhuma pendência de prazo no momento.';

  const SEG=[
    {g:'ativo',lbl:'Ativos',col:'var(--green)',n:ativos.length,sub:ativos.length?`${sum(ativos)?brlShort(sum(ativos))+'/mês':'Valor mensal não informado'}${vencendo.length?` · ${vencendo.length} vencendo`:''}`:'Nenhum contrato ativo',act:"goFiles()"},
    {g:'vencido',lbl:'Vencidos',col:'var(--red)',n:vencidos.length,sub:vencidos.length?'Sem distrato registrado':'Tudo em dia',act:"goVencimentos()"},
    {g:'encerrado',lbl:'Encerrados',col:'#8A94A3',n:encerrados.length,sub:'Com distrato vinculado',act:"goVencimentos()"},
    {g:'naolido',lbl:'Não lidos',col:'#C9D0D8',n:naolidos.length,sub:naolidos.length?'Aguardando leitura da IA':'Todos lidos',act:naolidos.length?"readAllPending('all')":"goFiles()"}
  ];

  // Precisa de atenção: vencendo (mais próximo primeiro), depois vencidos (mais recente primeiro)
  const attn=[...vencendo.sort((a,b)=>daysUntil(a.end)-daysUntil(b.end)),...vencidos.sort((a,b)=>daysUntil(b.end)-daysUntil(a.end))];
  const attnHtml=attn.length?attn.slice(0,7).map(r=>{
    const d=daysUntil(r.end); const late=d<0;
    return `<button class="db-row" onclick="selectFile('${r.f.id}')">
      <span class="db-dot" style="background:${late?'var(--red)':'var(--amber)'}"></span>
      <span class="db-row-main"><span class="db-row-name">${esc(r.f.name)}</span><span class="db-row-sub">${esc(r.unit.name)}${(r.f.parties||[])[1]&&r.f.parties[1]!=='—'?' · '+esc(r.f.parties[1]):''}</span></span>
      <span class="db-row-side"><span class="db-when ${late?'late':'soon'}">${daysLabel(d)}</span><span class="db-row-sub">${r.v?brl(r.v)+'/mês':'Valor não informado'}</span></span>
    </button>`;}).join(''):`<div class="db-empty">Nenhum contrato vencido ou vencendo. Os prazos aparecem aqui assim que chegarem à janela de alerta.</div>`;

  // Espaços de trabalho
  const units=DATA.folders.map(fo=>{
    const rs=rows.filter(r=>r.unit.id===fo.id);
    const c=g=>rs.filter(r=>r.g===g).length;
    return {fo,rs,ativo:c('ativo'),vencido:c('vencido'),encerrado:c('encerrado'),naolido:c('naolido'),val:sum(rs.filter(r=>r.g==='ativo'))};
  });
  const unitHtml=units.map(u=>{
    const t=u.rs.length||1;
    const bar=u.rs.length?['ativo','vencido','encerrado','naolido'].map(g=>u[g]?`<span style="width:${u[g]/t*100}%;background:${SEG.find(s=>s.g===g).col}"></span>`:'').join(''):'';
    return `<button class="db-unit" onclick="selectFolder('${u.fo.id}')">
      <span class="db-unit-name">${FOLDER_SVG(18)}${esc(u.fo.name)}</span>
      <span class="db-unit-count">${plural(u.rs.length,'contrato','contratos')}${u.vencido?`<b>${u.vencido} vencido${u.vencido>1?'s':''}</b>`:''}</span>
      <span class="db-unit-bar">${bar}</span>
      <span class="db-unit-val">${u.val?brlShort(u.val)+'/mês':'—'}</span>
    </button>`;}).join('')||`<div class="db-empty">Crie um espaço de trabalho para organizar os contratos por área ou cliente.</div>`;

  // Atualizados recentemente
  const recent=[...allFilesList()].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).slice(0,6);
  const recentHtml=recent.map(f=>{const fid=fileFolderId(f.id); const p=fid&&fid!=='root'?(getFolderPath(fid)||[]).map(n=>n.name).join(' / '):'Sem pasta';
    return `<button class="db-recent" onclick="selectFile('${f.id}')">
      <span class="db-recent-ico">${FILE_SVG(f.type,18)}</span>
      <span class="db-row-main"><span class="db-row-name">${esc(f.name)}</span><span class="db-row-sub">${esc(p)}</span></span>
      ${statusBadge(st(f))}
      <span class="db-recent-date">${relDate(f.updatedAt)}</span>
    </button>`;}).join('');

  el.innerHTML=`
    <section class="db-hero">
      <div class="db-hero-text">
        <h1 class="db-hello">${hi}${first?', '+esc(first):''}</h1>
        <p class="db-summary">${summary}</p>
        <p class="db-todo ${vencidos.length?'warn':''}">${todoTxt}</p>
      </div>
      <div class="db-health" role="img" aria-label="Composição da carteira">
        <div class="db-health-bar">${total?SEG.filter(s=>s.n).map(s=>`<span style="flex:${s.n};background:${s.col}" title="${s.lbl}: ${s.n}"></span>`).join(''):'<span style="flex:1;background:var(--s5)"></span>'}</div>
        <div class="db-health-legend">${SEG.map(s=>`<button class="db-seg" onclick="${s.act}">
          <span class="db-seg-top"><i style="background:${s.col}"></i>${s.lbl}</span>
          <span class="db-seg-n">${s.n}</span>
          <span class="db-seg-sub">${s.sub}</span></button>`).join('')}</div>
      </div>
    </section>

    <div class="db-grid">
      <section class="db-panel">
        <header class="db-panel-head"><h2>Precisa de atenção</h2>${attn.length>7?`<button class="db-link" onclick="goVencimentos()">Ver todos (${attn.length})</button>`:attn.length?`<button class="db-link" onclick="goVencimentos()">Abrir vencimentos</button>`:''}</header>
        <div class="db-list">${attnHtml}</div>
      </section>
      <section class="db-panel">
        <header class="db-panel-head"><h2>Espaços de trabalho</h2><button class="db-link" onclick="goRelatorios()">Relatórios</button></header>
        <div class="db-list">${unitHtml}</div>
      </section>
    </div>

    <section class="db-panel">
      <header class="db-panel-head"><h2>Atualizados recentemente</h2><button class="db-link" onclick="goFiles()">Todos os arquivos</button></header>
      <div class="db-list">${recentHtml||'<div class="db-empty">Carregue o primeiro contrato para começar.</div>'}</div>
    </section>`;
}

function sortControls(){
  return `
    <button class="ctrl-btn ${S.sort==='nome'?'active':''}" onclick="setSort('nome',this)">Nome</button>
    <button class="ctrl-btn ${S.sort==='data'?'active':''}" onclick="setSort('data',this)">Data</button>
    <button class="ctrl-btn ${S.sort==='valor'?'active':''}" onclick="setSort('valor',this)">Valor</button>
  `;
}
