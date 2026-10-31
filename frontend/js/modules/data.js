/* Autec — Dados e persistência (sem dados de exemplo) */
// ══════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════
// Começa vazio: a plataforma mostra apenas o que for inserido nela.
const DATA = { folders:[], files:{ root:[] } };

DATA.alerts={};

// Remove os dados de exemplo das versões antigas: só aparece o que foi inserido na plataforma.
const SAMPLE_DOC_IDS=new Set(['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14','c15','c16']);
const SAMPLE_FOLDER_IDS=new Set(['f1','f1a','f1a1','f1a2','f1b','f1b1','f1b2','f1c','f2','f2a','f2b','f3','f4']);
function purgeSampleData(){
  let changed=false;
  for(const k of Object.keys(DATA.files)){
    const before=DATA.files[k].length;
    DATA.files[k]=DATA.files[k].filter(f=>!(SAMPLE_DOC_IDS.has(f.id)&&!f.hasBlob));
    if(DATA.files[k].length!==before) changed=true;
  }
  const prune=nodes=>nodes.filter(n=>{
    n.children=prune(n.children||[]);
    const empty=!(DATA.files[n.id]||[]).length&&!n.children.length;
    if(SAMPLE_FOLDER_IDS.has(n.id)&&empty){ delete DATA.files[n.id]; delete DATA.alerts[n.id]; changed=true; return false; }
    return true;
  });
  DATA.folders=prune(DATA.folders);
  return changed;
}


// ══════════════════════════════════════════════
//  PERSISTÊNCIA (dados no localStorage, arquivos no IndexedDB)
// ══════════════════════════════════════════════
const DATA_KEY='autec_data_v1';
function saveData(){
  // modo servidor: envia ao back-end (com pequeno atraso para agrupar alterações)
  if(API.online){ if(API.token) API.scheduleSave(()=>({folders:DATA.folders,files:DATA.files,alerts:DATA.alerts})); return; }
  try{ LS.setItem(DATA_KEY, JSON.stringify({folders:DATA.folders,files:DATA.files,alerts:DATA.alerts})); }
  catch(e){ showToast('Não foi possível salvar os dados neste navegador','var(--red)'); }
}
function loadData(){
  if(API.online){
    // no modo servidor os dados chegam após o login (applyWorkspace); nada de dados de exemplo
    DATA.folders=[]; DATA.files={root:[]}; DATA.alerts={};
    return;
  }
  try{
    const r=JSON.parse(LS.getItem(DATA_KEY)||'null');
    if(r&&Array.isArray(r.folders)&&r.files){ DATA.folders=r.folders; DATA.files=r.files; DATA.alerts=r.alerts||{}; }
  }catch(e){}
  normalizeData();
}
/** Recebe o espaço de trabalho do servidor e atualiza a tela. */
function applyWorkspace(ws){
  DATA.folders=ws.folders||[]; DATA.files=ws.files||{root:[]}; DATA.alerts=ws.alerts||{};
  normalizeData();
  relinkAll();
  allFilesList().forEach(f=>{ if(f.processing==='processing'&&f.hasBlob) setTimeout(()=>enqueueAI(f.id),800); });
  if(API.ai) setTimeout(refineObjects,2000);
  if(S.view==='folder'&&!findFolder(S.folder)){S.view='dashboard'; S.folder=null;}
  refreshAll();
}
window.applyWorkspace=applyWorkspace;
/** Ajustes e migrações aplicados a dados antigos. */
function normalizeData(){
  if(!DATA.files.root) DATA.files.root=[];
  if(purgeSampleData()) saveData();
  if(!DATA.alerts) DATA.alerts={};
  let changed=false;
  Object.values(DATA.files).flat().forEach(f=>{
    if(f.payment&&f.payment!=='—'){const p=normalizePayment(f.payment); if(p!==f.payment){f.payment=p; changed=true;}}
    if(f.aiAt&&f.object){const o=shortObject(f.object); if(o!==f.object){f.object=o; changed=true;}}
    if(f.hasBlob&&!f.aiAt&&f.processing==='done'){
      f.processing='pending'; f.confidence=0;
      if(f.startDate&&f.startDate===f.updatedAt) f.startDate='—'; // data de envio gravada por engano como início
      changed=true;
    }
  });
  Object.values(DATA.files).flat().forEach(f=>{
    if(!f.aiAt&&f.hasBlob&&f.contractType==='Principal'){const g=guessTypeFromName(f.name); if(g!=='Principal'){f.contractType=g; changed=true;}}
  });
  if(changed) saveData();
}
function pendingFiles(list){return (list||allFilesList()).filter(f=>f.hasBlob&&f.processing==='pending');}
function readFolderUnread(fid){
  aiConfigPrompted=false;
  const ids=(DATA.files[fid]||[]).filter(x=>x.hasBlob&&['pending','error'].includes(x.processing)).map(x=>x.id);
  ids.forEach(id=>enqueueAI(id));
  if(ids.length) showToast(`${ids.length} documento${ids.length>1?'s':''} na fila de leitura da IA`,'var(--blue)');
}
function readAllPending(scope){
  const cf=curFolderId();
  const ids=(scope==='folder'&&cf&&cf!=='root'?pendingFiles(getAllDescendantFiles(cf)):pendingFiles()).map(f=>f.id);
  aiConfigPrompted=false; ids.forEach(id=>enqueueAI(id));
  showToast(`${ids.length} contrato${ids.length>1?'s':''} na fila de leitura da IA`,'var(--blue)');
}
function pendingBanner(list,scope){
  const n=pendingFiles(list).length; if(!n) return '';
  return `<div class="pending-banner">
    <span class="pending-ico">${IC.info}</span>
    <div class="pending-txt"><strong>${n} contrato${n>1?'s ainda não foram lidos':' ainda não foi lido'} pela IA</strong><span>Valor, datas, partes e tipo ficam vazios até a leitura.</span></div>
    <button class="btn-save" onclick="readAllPending('${scope}')">Ler ${n>1?'todos':''} agora</button>
  </div>`;
}
const blobDB={
  db:null,
  open(){return new Promise((res,rej)=>{
    if(this.db) return res(this.db);
    if(!window.indexedDB) return rej(new Error('IndexedDB indisponível'));
    const r=indexedDB.open('autec_files',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('files');
    r.onsuccess=()=>{this.db=r.result;res(this.db);};
    r.onerror=()=>rej(r.error);
  });},
  mem:new Map(), // reserva quando o IndexedDB está bloqueado (arquivos ficam só até fechar a página)
  async put(id,blob){
    if(API.online){ await API.putFile(id,blob); return; }
    this.mem.set(id,blob);
    try{const db=await this.open();await new Promise((res,rej)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(blob,id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);});this.mem.delete(id);}
    catch(e){ if(!this.warned){this.warned=true; setTimeout(()=>showToast('Este navegador não permite guardar arquivos: eles ficarão disponíveis só até fechar a página','var(--amber)'),1500);} }
  },
  async get(id){
    if(API.online) return API.getFile(id);
    if(this.mem.has(id)) return this.mem.get(id);
    try{const db=await this.open();return await new Promise((res,rej)=>{const q=db.transaction('files').objectStore('files').get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
    catch(e){return undefined;}
  },
  async del(id){if(API.online){API.delFile(id);return;} this.mem.delete(id); try{const db=await this.open();db.transaction('files','readwrite').objectStore('files').delete(id);}catch(e){}}
};
