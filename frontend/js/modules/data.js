/* Autec — Dados de exemplo e persistência */
// ══════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════
const DATA = {
  folders:[
    {id:'f1',name:'Clientes',icon:'building',children:[
      {id:'f1a',name:'Grupo Valerio',children:[
        {id:'f1a1',name:'Contratos Ativos',children:[]},
        {id:'f1a2',name:'Histórico',children:[]}
      ]},
      {id:'f1b',name:'TechPrime Ltda',children:[
        {id:'f1b1',name:'2024',children:[]},
        {id:'f1b2',name:'2023',children:[]}
      ]},
      {id:'f1c',name:'Construtora NSB',children:[]}
    ]},
    {id:'f2',name:'Fornecedores',icon:'truck',children:[
      {id:'f2a',name:'SaaS & Tecnologia',children:[]},
      {id:'f2b',name:'Prestadores de Serviço',children:[]}
    ]},
    {id:'f3',name:'Societários',icon:'users',children:[]},
    {id:'f4',name:'Trabalhistas',icon:'briefcase',children:[]}
  ],
  files:{
    'root':[],
    'f1a1':[
      {id:'c1',name:'Contrato de Prestação de Serviços — Grupo Valerio',type:'pdf',contractType:'Principal',status:'active',value:'R$ 480.000,00',period:'Anual',startDate:'2024-03-01',endDate:'2025-02-28',parties:['Grupo Valerio S.A.','Escritório Central Consultoria Ltda'],cnpj:['12.345.678/0001-90','98.765.432/0001-11'],payment:'Boleto bancário — vencimento dia 10',processing:'done',confidence:0.94,responsible:'Ana Medeiros',updatedAt:'2024-11-15'},
      {id:'c2',name:'Aditivo 001 — Ampliação de Escopo',type:'pdf',contractType:'Aditivo',status:'active',value:'R$ 60.000,00',period:'Único',startDate:'2024-06-15',endDate:'2025-02-28',parties:['Grupo Valerio S.A.','Escritório Central Consultoria Ltda'],cnpj:['12.345.678/0001-90','98.765.432/0001-11'],payment:'Transferência bancária',processing:'done',confidence:0.91,responsible:'Ana Medeiros',updatedAt:'2024-09-10',parentId:'c1'},
      {id:'c3',name:'Aditivo 002 — Prorrogação de Prazo',type:'pdf',contractType:'Aditivo',status:'expiring',value:'—',period:'—',startDate:'2024-09-01',endDate:'2025-01-31',parties:['Grupo Valerio S.A.','Escritório Central Consultoria Ltda'],cnpj:['12.345.678/0001-90','98.765.432/0001-11'],payment:'—',processing:'done',confidence:0.88,responsible:'Carlos Ramos',updatedAt:'2024-09-01',parentId:'c1'},
    ],
    'f1a2':[
      {id:'c4',name:'Contrato 2022 — Serviços de TI',type:'pdf',contractType:'Principal',status:'expired',value:'R$ 220.000,00',period:'Anual',startDate:'2022-01-01',endDate:'2022-12-31',parties:['Grupo Valerio S.A.','TechBase Soluções'],cnpj:['12.345.678/0001-90','55.443.221/0001-33'],payment:'NF mensal',processing:'done',confidence:0.97,responsible:'Carlos Ramos',updatedAt:'2023-01-05'},
      {id:'c5',name:'Distrato — Contrato 2022',type:'pdf',contractType:'Distrato',status:'expired',value:'—',period:'—',startDate:'2022-11-30',endDate:'2022-11-30',parties:['Grupo Valerio S.A.','TechBase Soluções'],cnpj:['12.345.678/0001-90','55.443.221/0001-33'],payment:'—',processing:'done',confidence:0.96,responsible:'Ana Medeiros',updatedAt:'2022-12-01',parentId:'c4'},
    ],
    'f1b1':[
      {id:'c6',name:'MSA — TechPrime Ltda 2024',type:'pdf',contractType:'Principal',status:'active',value:'R$ 1.200.000,00',period:'Anual',startDate:'2024-01-01',endDate:'2024-12-31',parties:['TechPrime Ltda','Holding Principal S.A.'],cnpj:['77.123.456/0001-80','33.222.111/0001-55'],payment:'Parcelas mensais — NF 15 dias',processing:'done',confidence:0.96,responsible:'Ana Medeiros',updatedAt:'2024-10-22'},
      {id:'c7',name:'SLA Suporte Técnico',type:'pdf',contractType:'Aditivo',status:'active',value:'R$ 84.000,00',period:'Anual',startDate:'2024-02-01',endDate:'2024-12-31',parties:['TechPrime Ltda','Holding Principal S.A.'],cnpj:['77.123.456/0001-80','33.222.111/0001-55'],payment:'Boleto mensal',processing:'done',confidence:0.89,responsible:'Carlos Ramos',updatedAt:'2024-08-14',parentId:'c6'},
    ],
    'f1b2':[
      {id:'c8',name:'MSA — TechPrime Ltda 2023',type:'pdf',contractType:'Principal',status:'expired',value:'R$ 980.000,00',period:'Anual',startDate:'2023-01-01',endDate:'2023-12-31',parties:['TechPrime Ltda','Holding Principal S.A.'],cnpj:['77.123.456/0001-80','33.222.111/0001-55'],payment:'Parcelas mensais',processing:'done',confidence:0.93,responsible:'Ana Medeiros',updatedAt:'2024-01-02'},
    ],
    'f1c':[
      {id:'c9',name:'Contrato de Empreitada Global — NSB',type:'pdf',contractType:'Principal',status:'active',value:'R$ 3.750.000,00',period:'Projeto',startDate:'2024-05-01',endDate:'2026-04-30',parties:['Construtora NSB S.A.','Urbaniza Incorporações'],cnpj:['88.999.000/0001-44','44.555.666/0001-22'],payment:'Medições mensais — crédito 30 dias',processing:'done',confidence:0.92,responsible:'Ana Medeiros',updatedAt:'2024-11-01'},
      {id:'c10',name:'Aditivo Materiais — Reajuste INCC',type:'pdf',contractType:'Aditivo',status:'active',value:'R$ 210.000,00',period:'Único',startDate:'2024-08-15',endDate:'2026-04-30',parties:['Construtora NSB S.A.','Urbaniza Incorporações'],cnpj:['88.999.000/0001-44','44.555.666/0001-22'],payment:'Parcela única',processing:'processing',confidence:0,responsible:'Carlos Ramos',updatedAt:'2024-08-15',parentId:'c9'},
    ],
    'f2a':[
      {id:'c11',name:'Contrato HubSpot CRM',type:'pdf',contractType:'Principal',status:'expiring',value:'R$ 36.000,00',period:'Anual',startDate:'2024-01-15',endDate:'2025-01-14',parties:['Empresa ABC Ltda','HubSpot Ireland Ltd'],cnpj:['11.222.333/0001-00','—'],payment:'Cartão corporativo anual',processing:'done',confidence:0.85,responsible:'Carlos Ramos',updatedAt:'2024-11-10'},
      {id:'c12',name:'Contrato AWS — Nuvem',type:'pdf',contractType:'Principal',status:'active',value:'Variável',period:'Mensal',startDate:'2022-07-01',endDate:'—',parties:['Empresa ABC Ltda','Amazon Web Services'],cnpj:['11.222.333/0001-00','—'],payment:'Cartão de crédito — uso mensal',processing:'done',confidence:0.78,responsible:'Carlos Ramos',updatedAt:'2024-11-01'},
    ],
    'f2b':[
      {id:'c13',name:'Contrato Limpeza e Conservação',type:'pdf',contractType:'Principal',status:'active',value:'R$ 72.000,00',period:'Anual',startDate:'2024-03-01',endDate:'2025-02-28',parties:['Empresa ABC Ltda','CleanPro Serviços'],cnpj:['11.222.333/0001-00','22.333.444/0001-99'],payment:'Boleto mensal',processing:'done',confidence:0.91,responsible:'Ana Medeiros',updatedAt:'2024-10-15'},
    ],
    'f3':[
      {id:'c14',name:'Acordo de Acionistas — Revisão 2024',type:'pdf',contractType:'Principal',status:'active',value:'—',period:'—',startDate:'2024-04-01',endDate:'—',parties:['Ana Medeiros','Carlos Fontes','Beatriz Lamarão'],cnpj:['—','—','—'],payment:'N/A',processing:'done',confidence:0.88,responsible:'Ana Medeiros',updatedAt:'2024-09-20'},
    ],
    'f4':[
      {id:'c15',name:'Acordo Individual — Redução Salarial',type:'pdf',contractType:'Principal',status:'active',value:'—',period:'—',startDate:'2024-06-01',endDate:'—',parties:['Empresa ABC Ltda','Funcionário X'],cnpj:['11.222.333/0001-00','—'],payment:'N/A',processing:'done',confidence:0.83,responsible:'Carlos Ramos',updatedAt:'2024-06-01'},
      {id:'c16',name:'Termo de Rescisão — João P.',type:'pdf',contractType:'Distrato',status:'expired',value:'R$ 18.500,00',period:'Único',startDate:'2024-07-31',endDate:'2024-07-31',parties:['Empresa ABC Ltda','João Pereira'],cnpj:['11.222.333/0001-00','—'],payment:'FGTS + verbas rescisórias',processing:'done',confidence:0.95,responsible:'Ana Medeiros',updatedAt:'2024-08-02',parentId:'c15'},
    ],
  }
};

DATA.alerts={};

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
