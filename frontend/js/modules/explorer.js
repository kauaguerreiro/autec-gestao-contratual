/* Autec — Explorador de arquivos, pastas e edição */
// ══════════════════════════════════════════════
//  EXPLORADOR DE ARQUIVOS (estilo OneDrive)
// ══════════════════════════════════════════════
const FOLDER_SVG=(w=22)=>`<svg width="${w}" height="${Math.round(w*.82)}" viewBox="0 0 24 20" fill="none" aria-hidden="true"><path d="M1 3.2C1 2 2 1 3.2 1h5.6c.6 0 1.1.2 1.5.6L12 3.3h8.8C22 3.3 23 4.3 23 5.5V7H1V3.2z" fill="#C98F1F"/><path d="M1 6.2h22v10.6c0 1.2-1 2.2-2.2 2.2H3.2C2 19 1 18 1 16.8V6.2z" fill="#F0BE4B"/><path d="M1 6.2h22v1H1z" fill="#FFF" opacity=".35"/></svg>`;
function FILE_SVG(type,w=22){
  const t=(type||'pdf').toLowerCase();
  const map={pdf:['#B42318','PDF'],doc:['#2459A8','DOC'],docx:['#2459A8','DOC']};
  const [c,l]=map[t]||['#667285',t.toUpperCase().slice(0,3)];
  return `<svg width="${w}" height="${Math.round(w*1.2)}" viewBox="0 0 20 24" fill="none" aria-hidden="true"><path d="M3 1h9.5L18 6.5V21a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2z" fill="#fff" stroke="#C3CAD4"/><path d="M12.5 1v5.5H18" stroke="#C3CAD4" fill="#EEF1F5"/><rect x="0" y="12" width="15" height="7" rx="1" fill="${c}"/><text x="7.5" y="17.4" text-anchor="middle" font-family="Arial,sans-serif" font-size="5" font-weight="700" fill="#fff">${l}</text></svg>`;
}
const IC={
  plus:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  upload:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 11V2.5M4.5 6L8 2.5 11.5 6M2.5 13.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  list:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  grid:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>',
  info:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2V11M8 5h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  move:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1.5 4a1 1 0 011-1h3.3l1.5 1.5h6.2a1 1 0 011 1V12a1 1 0 01-1 1h-11a1 1 0 01-1-1V4z" stroke="currentColor" stroke-width="1.3"/><path d="M6 9h5M9 7l2 2-2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  edit:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11 3.5l-.8 8a1 1 0 01-1 .9H4.8a1 1 0 01-1-.9L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  open:'<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13h8A1.5 1.5 0 0012 11.5V9M7 7l5-5M9 2h3v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close:'<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  arrow:'<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2.5 5.5L5 8l2.5-2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

// pasta atualmente aberta no explorador ('root' = Todos os arquivos)
function curFolderId(){
  if(S.view==='folder'&&S.folder&&findFolder(S.folder)) return S.folder;
  if(S.view==='files') return 'root';
  return null;
}
function childFoldersOf(fid){return fid==='root'?DATA.folders:(findFolder(fid)?.children||[]);}
function directFilesOf(fid){return DATA.files[fid]||[];}
function folderModified(fid){
  const f=findFolder(fid);
  const dates=getAllDescendantFiles(fid).map(x=>x.updatedAt).filter(d=>d&&d!=='—');
  if(f?.createdAt) dates.push(f.createdAt);
  return dates.sort().pop()||null;
}
function itemCount(fid){return childFoldersOf(fid).length+directFilesOf(fid).length;}
function relDate(iso){
  if(!iso||iso==='—') return '—';
  const d=daysUntil(iso); // negativo = passado
  if(d===0) return 'Hoje';
  if(d===-1) return 'Ontem';
  if(d<0&&d>-7) return `Há ${-d} dias`;
  return fmtDate(iso);
}
function isDescendant(folderId,maybeChildId){
  return (getFolderPath(maybeChildId)||[]).some(n=>n.id===folderId);
}

// ---------- estado de seleção / ordenação / layout ----------
S.sel=new Set();
S.exSort={key:'nome',dir:1};
S.layout=(()=>{try{return LS.getItem('autec_layout')||'list';}catch(e){return 'list';}})();
function setLayout(l){S.layout=l; try{LS.setItem('autec_layout',l);}catch(e){} renderWorkspace();}
function setExSort(k){
  if(S.exSort.key===k) S.exSort.dir*=-1; else S.exSort={key:k,dir:k==='nome'?1:-1};
  renderWorkspace();
}
function toggleSel(key,ev){
  if(ev) ev.stopPropagation();
  S.sel.has(key)?S.sel.delete(key):S.sel.add(key);
  renderWorkspace();
}
function toggleSelAll(){
  const fid=curFolderId(); if(!fid) return;
  const keys=[...childFoldersOf(fid).map(f=>'d:'+f.id),...directFilesOf(fid).map(f=>'f:'+f.id)];
  const all=keys.length&&keys.every(k=>S.sel.has(k));
  S.sel=new Set(all?[]:keys);
  renderWorkspace();
}
function clearSel(){S.sel.clear(); renderWorkspace();}
function openFolder(id){selectFolder(id);}
function goFiles(){goView('files');}

// ---------- render ----------
function renderExplorer(el){
  const fid=curFolderId();
  const folders=[...childFoldersOf(fid)];
  const files=[...directFilesOf(fid)];
  // valida seleção
  const valid=new Set([...folders.map(f=>'d:'+f.id),...files.map(f=>'f:'+f.id)]);
  S.sel=new Set([...S.sel].filter(k=>valid.has(k)));

  const {key,dir}=S.exSort;
  const cmpName=(a,b)=>a.name.localeCompare(b.name,'pt-BR',{numeric:true});
  const fMod=f=>folderModified(f.id)||'';
  folders.sort((a,b)=>key==='modificado'?dir*fMod(a).localeCompare(fMod(b)):key==='valor'?cmpName(a,b):dir*cmpName(a,b));
  files.sort((a,b)=>{
    if(key==='modificado') return dir*(a.updatedAt||'').localeCompare(b.updatedAt||'');
    if(key==='valor') return dir*(parseVal(a.value)-parseVal(b.value));
    if(key==='status') return dir*st(a).localeCompare(st(b));
    return dir*cmpName(a,b);
  });

  // banner de vencimento (inclui subpastas)
  const expiring=(fid==='root'?allFilesList():getAllDescendantFiles(fid)).filter(f=>st(f)==='expiring');
  let alertHtml='';
  if(expiring.length&&!S.bannerDismissed){
    alertHtml=`<div class="alert-banner" id="alertBanner">
      <div class="alert-icon">${IC.info}</div>
      <div class="alert-body">
        <div class="alert-title">${expiring.length} contrato${expiring.length>1?'s':''} com vencimento próximo nesta pasta</div>
        <div class="alert-items">${expiring.map(f=>`<div class="alert-item" onclick="selectFile('${f.id}')"><span class="alert-item-name">${esc(f.name)}</span><span class="alert-item-days">${daysLabel(daysUntil(f.endDate))}</span></div>`).join('')}</div>
      </div>
      <button class="alert-close" title="Dispensar" onclick="dismissAlert()">${IC.close}</button>
    </div>`;
  }

  const n=S.sel.size;
  const bar=n?`<div class="ex-bar sel">
      <button class="ex-btn" onclick="clearSel()" title="Limpar seleção">${IC.close}<span>${n} selecionado${n>1?'s':''}</span></button>
      <span class="ex-divider"></span>
      ${n===1&&[...S.sel][0].startsWith('f:')?`<button class="ex-btn" onclick="selectFile('${[...S.sel][0].slice(2)}')">${IC.info}<span>Detalhes</span></button>`:''}
      ${n===1?`<button class="ex-btn" onclick="renameSelected()">${IC.edit}<span>Renomear</span></button>`:''}
      <button class="ex-btn" onclick="openMoveModal()">${IC.move}<span>Mover para</span></button>
      <button class="ex-btn danger" onclick="confirmDeleteSelected()">${IC.trash}<span>Excluir</span></button>
    </div>`
    :`<div class="ex-bar">
      <button class="ex-btn primary" onclick="openNewFolderModal()">${IC.plus}<span>Nova pasta</span></button>
      <button class="ex-btn" onclick="triggerUpload()">${IC.upload}<span>Carregar</span></button>
      <span class="ex-spacer"></span>
      ${fid!=='root'?`<button class="ex-btn" onclick="openFolderDrawer('${fid}')">${IC.info}<span>Detalhes</span></button>`:''}
      <div class="ex-seg" role="group" aria-label="Modo de exibição">
        <button class="${S.layout==='list'?'on':''}" onclick="setLayout('list')" title="Lista">${IC.list}</button>
        <button class="${S.layout==='grid'?'on':''}" onclick="setLayout('grid')" title="Blocos">${IC.grid}</button>
      </div>
    </div>`;

  const dropAttrs=id=>`ondragover="dndOver(event,'${id}')" ondragleave="dndLeave(event)" ondrop="dndDrop(event,'${id}')"`;
  const dragAttrs=k=>`draggable="true" ondragstart="dndStart(event,'${k}')" ondragend="dndEnd()"`;
  const check=(k)=>`<span class="ex-check ${S.sel.has(k)?'on':''}" role="checkbox" aria-checked="${S.sel.has(k)}" tabindex="0" onclick="toggleSel('${k}',event)" onkeydown="if(event.key===' '||event.key==='Enter'){toggleSel('${k}',event);event.preventDefault()}"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.2l2 2 4-4.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  const empty=!folders.length&&!files.length;
  let body='';

  if(empty){
    body=`<div class="ex-empty" ${dropAttrs(fid)}>
      ${FOLDER_SVG(64)}
      <div class="empty-title">Esta pasta está vazia</div>
      <div class="empty-sub">Arraste contratos ou pastas do seu computador para cá, ou use os botões abaixo.</div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="ex-btn primary" onclick="triggerUpload()">${IC.upload}<span>Carregar contratos</span></button>
        <button class="ex-btn" onclick="openNewFolderModal()">${IC.plus}<span>Nova pasta</span></button>
      </div>
    </div>`;
  } else if(S.layout==='grid'){
    body=`<div class="ex-grid">
      ${folders.map(f=>{const k='d:'+f.id;const c=itemCount(f.id);return `<div class="ex-tile ${S.sel.has(k)?'selected':''}" tabindex="0" ${dragAttrs(k)} ${dropAttrs(f.id)} onclick="openFolder('${f.id}')" onkeydown="if(event.key==='Enter')openFolder('${f.id}')">
        ${check(k)}
        <div class="ex-tile-icon">${FOLDER_SVG(72)}<span class="ex-tile-count">${c}</span></div>
        <div class="ex-tile-name" title="${esc(f.name)}">${esc(f.name)}</div>
        <div class="ex-tile-sub">${relDate(folderModified(f.id))}</div>
      </div>`;}).join('')}
      ${files.map(f=>{const k='f:'+f.id;return `<div class="ex-tile ${S.sel.has(k)||S.file===f.id?'selected':''}" data-id="${f.id}" tabindex="0" ${dragAttrs(k)} onclick="selectFile('${f.id}')" onkeydown="if(event.key==='Enter')selectFile('${f.id}')">
        ${check(k)}
        <div class="ex-tile-icon file">${FILE_SVG(f.type,46)}</div>
        <div class="ex-tile-name" title="${esc(f.name)}">${esc(f.name)}</div>
        <div class="ex-tile-sub">${statusBadge(st(f))}</div>
      </div>`;}).join('')}
    </div>`;
  } else {
    const allSel=(folders.length+files.length)>0&&[...folders.map(f=>'d:'+f.id),...files.map(f=>'f:'+f.id)].every(k=>S.sel.has(k));
    const th=(k,l,cls='')=>`<button class="ex-th ${cls} ${S.exSort.key===k?'sorted':''}" onclick="setExSort('${k}')">${l}${S.exSort.key===k?`<span class="ex-sort ${S.exSort.dir<0?'desc':''}">${IC.arrow}</span>`:''}</button>`;
    body=`<div class="ex-list" role="grid">
      <div class="ex-row ex-head">
        <span class="ex-check ${allSel?'on':''}" role="checkbox" aria-checked="${allSel}" tabindex="0" title="Selecionar tudo" onclick="toggleSelAll()" onkeydown="if(event.key===' '){toggleSelAll();event.preventDefault()}"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.2l2 2 4-4.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span></span>
        ${th('nome','Nome')}
        ${th('modificado','Modificado','ex-c-mod')}
        ${th('status','Status')}
        ${th('valor','Valor mensal','num')}
        <span class="ex-th static ex-c-resp">Responsável</span>
        <span></span>
      </div>
      ${folders.map(f=>{const k='d:'+f.id;const c=itemCount(f.id);return `<div class="ex-row ${S.sel.has(k)?'selected':''}" tabindex="0" ${dragAttrs(k)} ${dropAttrs(f.id)} onclick="openFolder('${f.id}')" onkeydown="if(event.key==='Enter')openFolder('${f.id}')">
        ${check(k)}
        <span class="ex-ico">${FOLDER_SVG(24)}</span>
        <span class="ex-name"><span class="ex-name-text">${esc(f.name)}</span></span>
        <span class="ex-muted ex-c-mod">${relDate(folderModified(f.id))}</span>
        <span class="ex-muted">Pasta · ${c} ${c===1?'item':'itens'}</span>
        <span class="ex-muted num">${(()=>{const v=getAllDescendantFiles(f.id).reduce((s,x)=>s+parseVal(x.value),0);return v?'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2}):'—';})()}</span>
        <span class="ex-muted ex-c-resp">—</span>
        <span class="ex-actions" onclick="event.stopPropagation()">
          <button title="Renomear" onclick="openEditFolderModal('${f.id}')">${IC.edit}</button>
          <button title="Mover" onclick="S.sel=new Set(['${k}']);openMoveModal()">${IC.move}</button>
          <button title="Excluir" class="del" onclick="confirmDeleteFolder('${f.id}')">${IC.trash}</button>
        </span>
      </div>`;}).join('')}
      ${files.map(f=>{const k='f:'+f.id;return `<div class="ex-row ${S.sel.has(k)||S.file===f.id?'selected':''} ${st(f)==='expiring'?'warn':''}" data-id="${f.id}" tabindex="0" ${dragAttrs(k)} onclick="selectFile('${f.id}')" onkeydown="if(event.key==='Enter')selectFile('${f.id}')">
        ${check(k)}
        <span class="ex-ico">${FILE_SVG(f.type,20)}</span>
        <span class="ex-name"><span class="ex-name-text">${esc(f.name)}</span><span class="ex-name-sub">${f.processing==='processing'?'<span class="ai-tag"><span class="ai-spin"></span>Lendo com IA…</span>':f.processing==='error'?'<span class="ai-tag err">Leitura pela IA falhou</span>':f.processing==='pending'?typeBadge(f.contractType)+'<span class="ai-tag muted">Aguardando leitura da IA</span>':typeBadge(f.contractType)+`<span>${esc((f.parties||[])[0]||'')}</span>`}</span></span>
        <span class="ex-muted ex-c-mod">${relDate(f.updatedAt)}</span>
        <span>${statusBadge(st(f))}</span>
        <span class="ex-val num">${f.value&&f.value!=='—'?esc(f.value):'—'}</span>
        <span class="ex-muted ex-c-resp">${esc(f.responsible||'—')}</span>
        <span class="ex-actions" onclick="event.stopPropagation()">
          ${f.hasBlob?`<button title="Abrir arquivo" onclick="openDocument('${f.id}')">${IC.open}</button>`:''}
          <button title="Editar" onclick="openEditModal('${f.id}')">${IC.edit}</button>
          <button title="Mover" onclick="S.sel=new Set(['${k}']);openMoveModal()">${IC.move}</button>
          <button title="Excluir" class="del" onclick="confirmDelete('${f.id}')">${IC.trash}</button>
        </span>
      </div>`;}).join('')}
    </div>`;
  }
  const total=folders.length+files.length;
  el.innerHTML=`${pendingBanner(fid==='root'?allFilesList():getAllDescendantFiles(fid),'folder')}${alertHtml}${bar}${body}
    ${!empty?`<div class="ex-foot">${folders.length} pasta${folders.length!==1?'s':''} · ${files.length} contrato${files.length!==1?'s':''}${n?` · ${n} de ${total} selecionado${n>1?'s':''}`:''} <span class="ex-hint">Dica: arraste itens sobre uma pasta para movê-los.</span></div>`:''}`;
}

// título em forma de caminho (como no OneDrive)
function explorerHead(){
  const fid=curFolderId();
  const path=fid==='root'?[]:(getFolderPath(fid)||[]);
  const parts=[`<button class="ex-crumb ${!path.length?'last':''}" onclick="goFiles()" ondragover="dndOver(event,'root')" ondragleave="dndLeave(event)" ondrop="dndDrop(event,'root')">Todos os arquivos</button>`];
  path.forEach((n,i)=>{
    const last=i===path.length-1;
    parts.push(`<span class="ex-crumb-sep">›</span><button class="ex-crumb ${last?'last':''}" ${last?'':`onclick="openFolder('${n.id}')" ondragover="dndOver(event,'${n.id}')" ondragleave="dndLeave(event)" ondrop="dndDrop(event,'${n.id}')"`}>${esc(n.name)}</button>`);
  });
  return `<div class="page-head ex-head-wrap"><h1 class="ex-path">${parts.join('')}</h1></div>`;
}

// ---------- arrastar para mover ----------
let dndKeys=null;
function dndStart(e,key){
  dndKeys=S.sel.has(key)?[...S.sel]:[key];
  e.dataTransfer.effectAllowed='move';
  try{e.dataTransfer.setData('application/x-autec',dndKeys.join(','));}catch(_){}
  e.dataTransfer.setData('text/plain',dndKeys.length+' item(ns)');
}
function dndEnd(){dndKeys=null; document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));}
function canDropInto(target){
  if(!dndKeys) return false;
  return dndKeys.every(k=>{
    const id=k.slice(2);
    if(k.startsWith('d:')) return target!==id && !(target!=='root'&&isDescendant(id,target));
    return true;
  });
}
function dndOver(e,target){
  if(!dndKeys||!canDropInto(target)) return;
  e.preventDefault(); e.stopPropagation();
  e.dataTransfer.dropEffect='move';
  e.currentTarget.classList.add('drop-target');
}
function dndLeave(e){e.currentTarget.classList.remove('drop-target');}
function dndDrop(e,target){
  if(!dndKeys) return;
  e.preventDefault(); e.stopPropagation();
  e.currentTarget.classList.remove('drop-target');
  const keys=dndKeys; dndEnd();
  if(canDropIntoKeys(keys,target)) moveItems(keys,target);
}
function canDropIntoKeys(keys,target){const k=dndKeys; dndKeys=keys; const ok=canDropInto(target); dndKeys=k; return ok;}

// ---------- mover ----------
function parentOfFolder(id){const p=getFolderPath(id)||[]; return p.length>1?p[p.length-2].id:'root';}
function moveItems(keys,target){
  let moved=0, skipped=0;
  for(const k of keys){
    const id=k.slice(2);
    if(k.startsWith('f:')){
      const src=fileFolderId(id); if(!src||src===target){skipped++; continue;}
      const arr=DATA.files[src]; const i=arr.findIndex(x=>x.id===id); if(i<0) continue;
      const [f]=arr.splice(i,1); (DATA.files[target]=DATA.files[target]||[]).push(f); moved++;
    } else {
      if(id===target||(target!=='root'&&isDescendant(id,target))||parentOfFolder(id)===target){skipped++; continue;}
      const node=findFolder(id); if(!node) continue;
      removeFolderFromTree(id,DATA.folders);
      if(target==='root') DATA.folders.push(node);
      else {const t=findFolder(target); t.children=t.children||[]; t.children.push(node); S.expandedFolders.add(target);}
      moved++;
    }
  }
  S.sel.clear(); closeModal();
  if(!moved){showToast('Os itens já estão nessa pasta','var(--amber)'); renderWorkspace(); return;}
  saveData(); refreshAll();
  const name=target==='root'?'Todos os arquivos':findFolder(target)?.name;
  showToast(`${moved} ${moved>1?'itens':'item'} movido${moved>1?'s':''} para "${name}"`,'var(--green)');
}
let moveTarget=null;
function openMoveModal(){
  const keys=[...S.sel]; if(!keys.length) return;
  moveTarget=null;
  const blocked=id=>keys.some(k=>k.startsWith('d:')&&(k.slice(2)===id||isDescendant(k.slice(2),id)));
  const rows=[];
  (function walk(nodes,depth){nodes.forEach(n=>{rows.push({id:n.id,name:n.name,depth,off:blocked(n.id)}); walk(n.children||[],depth+1);});})(DATA.folders,1);
  makeModal(`<div class="modal" style="width:min(460px,92vw)">
    <div class="modal-title">Mover ${keys.length} ${keys.length>1?'itens':'item'}</div>
    <div class="modal-sub">Escolha a pasta de destino.</div>
    <div class="mv-list">
      <button class="mv-item" data-id="root" onclick="pickMove('root',this)" style="padding-left:12px">${FOLDER_SVG(18)}<span>Todos os arquivos</span></button>
      ${rows.map(r=>`<button class="mv-item" data-id="${r.id}" ${r.off?'disabled':''} onclick="pickMove('${r.id}',this)" style="padding-left:${12+r.depth*18}px">${FOLDER_SVG(18)}<span>${esc(r.name)}</span></button>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn-save" id="mvGo" disabled onclick="moveItems([...S.sel],moveTarget)">Mover aqui</button>
      <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`);
}
function pickMove(id,btn){
  moveTarget=id;
  document.querySelectorAll('.mv-item').forEach(b=>b.classList.toggle('on',b===btn));
  const go=document.getElementById('mvGo'); if(go) go.disabled=false;
}

// ---------- ações em lote ----------
function renameSelected(){
  const k=[...S.sel][0]; if(!k) return;
  k.startsWith('d:')?openEditFolderModal(k.slice(2)):openEditModal(k.slice(2));
}
function confirmDeleteSelected(){
  const keys=[...S.sel]; if(!keys.length) return;
  const nFold=keys.filter(k=>k.startsWith('d:')).length, nFile=keys.length-nFold;
  const inner=keys.filter(k=>k.startsWith('d:')).reduce((s,k)=>s+countFiles(k.slice(2)),0);
  makeModal(`<div class="modal" style="max-width:420px">
    <div class="modal-title">Excluir ${keys.length} ${keys.length>1?'itens':'item'}</div>
    <div class="modal-sub">${[nFold?`${nFold} pasta${nFold>1?'s':''}`:'',nFile?`${nFile} contrato${nFile>1?'s':''}`:''].filter(Boolean).join(' e ')} ser${keys.length>1?'ão':'á'} excluído${keys.length>1?'s':''} permanentemente.</div>
    ${inner?`<div style="padding:10px 12px;background:var(--rd);border:1px solid var(--rb);border-radius:var(--r8);font-size:12.5px;color:var(--red);margin-bottom:16px">As pastas selecionadas contêm <strong>${inner} contrato${inner>1?'s':''}</strong>, que também serão excluídos.</div>`:''}
    <div class="modal-actions">
      <button class="btn-danger" onclick="doDeleteSelected()">Excluir</button>
      <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`);
}
function doDeleteSelected(){
  const keys=[...S.sel];
  keys.filter(k=>k.startsWith('f:')).forEach(k=>{
    const id=k.slice(2), src=fileFolderId(id); if(!src) return;
    const arr=DATA.files[src], i=arr.findIndex(x=>x.id===id);
    if(i>-1){ if(arr[i].hasBlob) blobDB.del(id); arr.splice(i,1); }
    if(S.file===id) closeDrawer();
  });
  keys.filter(k=>k.startsWith('d:')).forEach(k=>{
    const id=k.slice(2); if(!findFolder(id)) return;
    deleteAllFilesInFolder(id); removeFolderFromTree(id,DATA.folders); S.expandedFolders.delete(id);
  });
  S.sel.clear(); saveData(); closeModal(); refreshAll();
  showToast(`${keys.length} ${keys.length>1?'itens':'item'} excluído${keys.length>1?'s':''}`,'var(--red)');
}

// ══════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════
function filterNav(q){
  const term=q.trim().toLowerCase();
  if(!term){
    const was=S.view==='search';
    S.search='';
    if(was) S.view=S.prevView||'dashboard';
    refreshAll(); return;
  }
  if(S.view!=='search') S.prevView=S.view;
  S.search=term; S.view='search'; closeDrawer();
  refreshAll();
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
let toastT;
function showToast(msg,color='var(--green)'){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  document.getElementById('toastDot').style.background=color;
  t.classList.add('show'); clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove('show'),2800);
}

// ══════════════════════════════════════════════
//  FOLDER EDIT & DELETE
// ══════════════════════════════════════════════
function openEditFolderModal(id){
  const folder=findFolder(id); if(!folder) return;
  const ex=document.getElementById('lxModal'); if(ex) ex.remove();
  const ov=document.createElement('div');
  ov.id='lxModal'; ov.className='modal-overlay';
  ov.innerHTML=`<div class="modal" style="max-width:400px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <div style="width:34px;height:34px;border-radius:9px;background:var(--gold3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold)">
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="modal-title" style="margin-bottom:0">Renomear espaço</div>
    </div>
    <div class="modal-sub" style="margin-bottom:14px">Renomeando: <strong style="color:var(--t1)">${esc(folder.name)}</strong></div>
    <div class="modal-label">Novo nome</div>
    <input class="modal-input" id="ef_name" value="${esc(folder.name)}"
      onkeydown="if(event.key==='Enter')doEditFolder('${id}');if(event.key==='Escape')closeModal()">
    <div class="modal-actions">
      <button class="btn-save" style="flex:1;padding:9px" onclick="doEditFolder('${id}')">Salvar</button>
      <button class="btn-ghost" style="padding:9px 16px" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`;
  ov.addEventListener('click',e=>{if(e.target===ov) closeModal();});
  document.body.appendChild(ov);
  setTimeout(()=>{const inp=document.getElementById('ef_name'); if(inp){inp.focus();inp.select();}},50);
}

function doEditFolder(id){
  const folder=findFolder(id); if(!folder) return;
  const name=(document.getElementById('ef_name')?.value||'').trim();
  if(!name){document.getElementById('ef_name')?.focus(); return;}
  folder.name=name;
  saveData(); closeModal();
  refreshAll();
  showToast(`Espaço renomeado para "${name}"`,'var(--green)');
}

function confirmDeleteFolder(id){
  const folder=findFolder(id); if(!folder) return;
  const cnt=countFiles(id);
  const ex=document.getElementById('lxModal'); if(ex) ex.remove();
  const ov=document.createElement('div');
  ov.id='lxModal'; ov.className='modal-overlay';
  ov.innerHTML=`<div class="modal" style="max-width:400px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <div style="width:34px;height:34px;border-radius:9px;background:var(--rd);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11 3.5l-.8 8a1 1 0 01-1 .9H4.8a1 1 0 01-1-.9L3 3.5" stroke="var(--red)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="modal-title" style="margin-bottom:0">Excluir espaço</div>
    </div>
    <div class="modal-sub" style="margin-bottom:12px">
      Tem certeza que deseja excluir <strong style="color:var(--t1)">${esc(folder.name)}</strong>?
    </div>
    ${cnt>0?`<div style="padding:10px 12px;background:var(--rd);border:1px solid var(--rb);border-radius:var(--r8);font-size:12px;color:var(--red);margin-bottom:14px">
      Esta pasta contém <strong>${cnt} documento${cnt!==1?'s':''}</strong>. Todos serão excluídos permanentemente.
    </div>`:`<div style="padding:10px 12px;background:var(--s4);border:1px solid var(--b1);border-radius:var(--r8);font-size:12px;color:var(--t3);margin-bottom:14px">
      A pasta está vazia.
    </div>`}
    <div class="modal-actions">
      <button class="btn-danger" onclick="doDeleteFolder('${id}')">Excluir espaço</button>
      <button class="btn-ghost" style="padding:9px 16px" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`;
  ov.addEventListener('click',e=>{if(e.target===ov) closeModal();});
  document.body.appendChild(ov);
}

function removeFolderFromTree(id, nodes){
  const idx=nodes.findIndex(n=>n.id===id);
  if(idx>-1){nodes.splice(idx,1); return true;}
  for(const n of nodes){if(n.children&&removeFolderFromTree(id,n.children)) return true;}
  return false;
}

function deleteAllFilesInFolder(id){
  // delete files of this folder (e arquivos anexados)
  (DATA.files[id]||[]).forEach(f=>{if(f.hasBlob) blobDB.del(f.id);});
  delete DATA.files[id];
  delete DATA.alerts[id];
  const folder=findFolder(id);
  if(folder&&folder.children) folder.children.forEach(c=>deleteAllFilesInFolder(c.id));
}

function doDeleteFolder(id){
  // verifica ANTES de remover se a pasta atual está dentro da excluída
  const currentInside=S.folder&&(getFolderPath(S.folder)||[]).some(n=>n.id===id);
  deleteAllFilesInFolder(id);
  removeFolderFromTree(id, DATA.folders);
  if(currentInside){ S.folder=null; S.file=null; if(S.view==='folder') S.view='dashboard'; }
  S.expandedFolders.delete(id);
  saveData(); closeModal(); closeDrawer();
  refreshAll();
  showToast('Espaço excluído','var(--red)');
}

// ══════════════════════════════════════════════
//  DELETE (document)
function confirmDelete(id){
  const f=findFile(id); if(!f) return;
  const ex=document.getElementById('lxModal'); if(ex) ex.remove();
  const ov=document.createElement('div');
  ov.id='lxModal'; ov.className='modal-overlay';
  ov.innerHTML=`<div class="modal" style="max-width:380px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <div style="width:34px;height:34px;border-radius:9px;background:var(--rd);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11 3.5l-.8 8a1 1 0 01-1 .9H4.8a1 1 0 01-1-.9L3 3.5" stroke="var(--red)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="modal-title" style="margin-bottom:0">Excluir documento</div>
    </div>
    <div class="modal-sub" style="margin-bottom:16px">
      Tem certeza que deseja excluir <strong style="color:var(--t1)">${esc(f.name)}</strong>? Esta ação não pode ser desfeita.
    </div>
    <div class="modal-actions">
      <button class="btn-danger" onclick="doDelete('${id}')">Excluir</button>
      <button class="btn-ghost" style="padding:9px 16px" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`;
  ov.addEventListener('click',e=>{if(e.target===ov) closeModal();});
  document.body.appendChild(ov);
}

function doDelete(id){
  for(const arr of Object.values(DATA.files)){
    const idx=arr.findIndex(x=>x.id===id);
    if(idx>-1){if(arr[idx].hasBlob) blobDB.del(id); arr.splice(idx,1); break;}
  }
  if(S.file===id){closeDrawer();}
  saveData(); closeModal();
  refreshAll();
  showToast('Documento excluído','var(--red)');
}

// ══════════════════════════════════════════════
//  EDIT MODAL
// ══════════════════════════════════════════════
function openEditModal(id){
  const f=findFile(id); if(!f) return;
  const ex=document.getElementById('lxModal'); if(ex) ex.remove();
  const ov=document.createElement('div');
  ov.id='lxModal'; ov.className='modal-overlay';
  ov.innerHTML=`<div class="modal" style="max-width:480px;width:90%">
    <div class="modal-title">Editar documento</div>
    <div class="modal-sub" style="margin-bottom:16px">${esc(f.name)}</div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div>
        <div class="modal-label">Nome do documento</div>
        <input class="modal-input" id="ed_name" value="${esc(f.name)}" style="margin-bottom:0">
      </div>
      <div>
        <div class="modal-label">Tipo</div>
        <select id="ed_type" class="modal-input" style="margin-bottom:0;cursor:pointer">
          <option value="Principal" ${f.contractType==='Principal'?'selected':''}>Principal</option>
          <option value="Aditivo" ${f.contractType==='Aditivo'?'selected':''}>Aditivo</option>
          <option value="Distrato" ${f.contractType==='Distrato'?'selected':''}>Distrato</option>
        </select>
      </div>
      <div>
        <div class="modal-label">Status</div>
        <select id="ed_status" class="modal-input" style="margin-bottom:0;cursor:pointer">
          <option value="auto" ${f.statusMode!=='manual'?'selected':''}>Automático (pela data)</option>
          <option value="active" ${f.statusMode==='manual'&&f.status==='active'?'selected':''}>Ativo</option>
          <option value="expiring" ${f.statusMode==='manual'&&f.status==='expiring'?'selected':''}>Vencendo</option>
          <option value="overdue" ${f.statusMode==='manual'&&f.status==='overdue'?'selected':''}>Vencido</option>
          <option value="expired" ${f.statusMode==='manual'&&f.status==='expired'?'selected':''}>Encerrado</option>
        </select>
      </div>
      <div>
        <div class="modal-label">Valor mensal</div>
        <input class="modal-input" id="ed_value" value="${esc(f.value)}" style="margin-bottom:0">
      </div>
      <div>
        <div class="modal-label">Data início (DD/MM/AAAA)</div>
        <input class="modal-input" id="ed_start" placeholder="DD/MM/AAAA" value="${f.startDate&&f.startDate!=='—'?fmtDate(f.startDate):''}" style="margin-bottom:0">
      </div>
      <div>
        <div class="modal-label">Data término (DD/MM/AAAA)</div>
        <input class="modal-input" id="ed_end" placeholder="Sem término" value="${f.endDate&&f.endDate!=='—'?fmtDate(f.endDate):''}" style="margin-bottom:0">
      </div>
    </div>
    <div style="margin-bottom:10px">
      <div class="modal-label">Forma de pagamento</div>
      <input class="modal-input" id="ed_payment" value="${esc(f.payment)}" style="margin-bottom:0">
    </div>
    <div style="margin-bottom:16px">
      <div class="modal-label">Responsável</div>
      <input class="modal-input" id="ed_responsible" value="${esc(f.responsible||'')}" style="margin-bottom:0">
    </div>
    <div class="modal-err" id="ed_err">
    </div>

    <div class="modal-actions">
      <button class="btn-save" style="flex:1;padding:9px" onclick="doEdit('${id}')">Salvar alterações</button>
      <button class="btn-ghost" style="padding:9px 16px" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`;
  ov.addEventListener('click',e=>{if(e.target===ov) closeModal();});
  document.body.appendChild(ov);
  setTimeout(()=>document.getElementById('ed_name')?.focus(),50);
}

// Retorna AAAA-MM-DD, '—' se vazio, ou null se inválida
function parseDateInput(s){
  s=(s||'').trim();
  if(!s||s==='—') return '—';
  const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m) return null;
  const d=+m[1], mo=+m[2], y=+m[3];
  const dt=new Date(y,mo-1,d);
  if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d) return null;
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function doEdit(id){
  const f=findFile(id); if(!f) return;
  const err=m=>{const e=document.getElementById('ed_err'); if(e){e.textContent=m; e.style.display='block';}};
  const start=parseDateInput(document.getElementById('ed_start')?.value);
  const end=parseDateInput(document.getElementById('ed_end')?.value);
  if(start===null) return err('Data de início inválida — use DD/MM/AAAA.');
  if(end===null) return err('Data de término inválida — use DD/MM/AAAA.');
  if(start!=='—'&&end!=='—'&&end<start) return err('A data de término é anterior à data de início.');
  f.name=document.getElementById('ed_name')?.value.trim()||f.name;
  f.contractType=document.getElementById('ed_type')?.value||f.contractType;
  const sv=document.getElementById('ed_status')?.value||'auto';
  if(sv==='auto'){f.statusMode='auto';} else {f.statusMode='manual'; f.status=sv;}
  f.value=document.getElementById('ed_value')?.value.trim()||f.value;
  f.startDate=start; f.endDate=end;
  f.payment=normalizePayment(document.getElementById('ed_payment')?.value.trim()||f.payment);
  f.responsible=document.getElementById('ed_responsible')?.value.trim()||f.responsible;
  f.updatedAt=todayISO();
  saveData(); closeModal();
  refreshAll();
  if(S.file===id){ openFileDrawer(f); document.querySelectorAll('.ct-row').forEach(r=>r.classList.toggle('selected',r.dataset.id===id)); }
  showToast('Documento atualizado','var(--green)');
}
