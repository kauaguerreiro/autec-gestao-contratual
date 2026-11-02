/* Autec — Busca rápida (Ctrl+K / ⌘K): telas, ações, pastas e contratos */
// ══════════════════════════════════════════════
//  BUSCA RÁPIDA
// ══════════════════════════════════════════════
const PAL={items:[],sel:0};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function paletteItems(){
  const nav=[
    {k:'Ir para',t:'Visão geral',run:()=>goHome(),ic:'grid'},
    {k:'Ir para',t:'Todos os arquivos',run:()=>goFiles(),ic:'folder'},
    {k:'Ir para',t:'Vencimentos',run:()=>goVencimentos(),ic:'clock'},
    {k:'Ir para',t:'Relatórios',run:()=>goRelatorios(),ic:'chart'},
    {k:'Ação',t:'Nova pasta',run:()=>{ if(S.view!=='folder'&&S.view!=='files') goFiles(); setTimeout(openNewFolderModal,200); },ic:'plus'},
    {k:'Ação',t:'Carregar contratos',run:()=>{ if(S.view!=='folder'&&S.view!=='files') goFiles(); setTimeout(triggerUpload,200); },ic:'upload'},
    {k:'Ação',t:'Exportar relatório CSV',run:()=>exportCSV(allFilesList(),'autec-contratos-'+todayISO()+'.csv'),ic:'down'},
    {k:'Ação',t:'Integração com IA',run:()=>openAISettings(),ic:'spark'},
  ];
  if(API.online) nav.push({k:'Ação',t:'Minha conta e administração',run:()=>openAccount(),ic:'user'});
  const folders=[];
  (function walk(nodes,path){ nodes.forEach(n=>{ const p=[...path,n.name]; folders.push({k:'Pasta',t:n.name,sub:p.slice(0,-1).join(' › '),run:()=>selectFolder(n.id),ic:'folder'}); walk(n.children||[],p); }); })(DATA.folders,[]);
  const docs=allFilesList().map(f=>{
    const fid=fileFolderId(f.id); const p=fid&&fid!=='root'?(getFolderPath(fid)||[]).map(n=>n.name).join(' › '):'Sem pasta';
    return {k:'Contrato',t:f.name,sub:p,extra:[...(f.parties||[]),...(f.cnpj||[]),f.object||''].join(' '),st:st(f),run:()=>selectFile(f.id),ic:'doc'};
  });
  return [...nav,...folders,...docs];
}
function openPalette(){
  if(document.getElementById('appRoot').style.display==='none') return;
  PAL.all=paletteItems(); PAL.sel=0;
  makeModal(`<div class="modal pal" role="dialog" aria-label="Busca rápida">
    <div class="pal-search"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <input id="palInput" placeholder="Buscar contrato, CNPJ, parte, pasta ou ação…" autocomplete="off" oninput="filterPalette(this.value)" onkeydown="palKey(event)">
      <kbd>Esc</kbd></div>
    <div class="pal-list" id="palList"></div>
    <div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> abrir/fechar</span></div>
  </div>`);
  document.querySelector('#lxModal').classList.add('pal-overlay');
  filterPalette('');
  setTimeout(()=>document.getElementById('palInput')?.focus(),20);
}
function filterPalette(q){
  const toks=norm(q).split(/\s+/).filter(Boolean);
  let items=PAL.all;
  if(toks.length) items=items.filter(it=>{const h=norm(it.t+' '+(it.sub||'')+' '+(it.extra||'')+' '+it.k); return toks.every(t=>h.includes(t));});
  else items=items.slice(0,40);
  PAL.items=items.slice(0,40); PAL.sel=0; renderPalette(q);
}
const PAL_IC={grid:'▦',folder:'📁',clock:'◷',chart:'▤',plus:'+',upload:'⇪',down:'⇩',spark:'✦',user:'◉',doc:'📄'};
function renderPalette(q){
  const el=document.getElementById('palList'); if(!el) return;
  if(!PAL.items.length){ el.innerHTML=`<div class="pal-empty">Nada encontrado para “${esc(q)}”.</div>`; return; }
  let lastK='';
  el.innerHTML=PAL.items.map((it,i)=>{
    const head=it.k!==lastK?`<div class="pal-group">${it.k==='Contrato'?'Contratos':it.k==='Pasta'?'Pastas':it.k==='Ação'?'Ações':'Navegação'}</div>`:''; lastK=it.k;
    return head+`<button class="pal-item ${i===PAL.sel?'on':''}" data-i="${i}" onmouseenter="palHover(${i})" onclick="runPalette(${i})">
      ${it.k==='Contrato'?FILE_SVG('pdf',16):it.k==='Pasta'?FOLDER_SVG(17):`<span class="pal-ic">${PAL_IC[it.ic]||'›'}</span>`}
      <span class="pal-main"><span class="pal-t">${esc(it.t)}</span>${it.sub?`<span class="pal-sub">${esc(it.sub)}</span>`:''}</span>
      ${it.st?statusBadge(it.st):''}<span class="pal-enter">↵</span></button>`;
  }).join('');
}
function palHover(i){ PAL.sel=i; document.querySelectorAll('.pal-item').forEach(b=>b.classList.toggle('on',+b.dataset.i===i)); }
function palKey(e){
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault();
    PAL.sel=(PAL.sel+(e.key==='ArrowDown'?1:-1)+PAL.items.length)%Math.max(1,PAL.items.length);
    palHover(PAL.sel); document.querySelector('.pal-item.on')?.scrollIntoView({block:'nearest'});
  } else if(e.key==='Enter'){ e.preventDefault(); runPalette(PAL.sel); }
}
function runPalette(i){ const it=PAL.items[i]; if(!it) return; closeModal(); setTimeout(()=>it.run(),30); }
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
    e.preventDefault();
    if(document.querySelector('.pal-overlay')) closeModal(); else openPalette();
  }
});
