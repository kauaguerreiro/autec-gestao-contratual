/* Autec — Leitura de contratos com IA */
// ══════════════════════════════════════════════
//  LEITURA DE CONTRATOS COM IA (Claude)
// ══════════════════════════════════════════════
const AI_KEY='autec_ai';
const AI_DEFAULT_MODEL='claude-sonnet-4-6';
function getAICfg(){try{return JSON.parse(LS.getItem(AI_KEY)||'{}');}catch(e){return {};}}
function setAICfg(c){try{LS.setItem(AI_KEY,JSON.stringify(c));}catch(e){}}

const AI_SYSTEM=`Você é um analista jurídico especializado em contratos brasileiros. Leia o documento e extraia os dados estruturados.
Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois e sem blocos de código. Formato:
{
 "tipo": "Principal" | "Aditivo" | "Distrato" (use "Distrato" para distrato, resilição, rescisão ou termo de encerramento),
 "titulo": string,
 "objeto": string (rótulo CURTO e direto do contrato: no MÁXIMO 8 palavras, só o serviço/fornecimento principal, sem vírgulas, sem listas, sem localidade e sem detalhes. Exemplos: "Assessoria para renovação do CMDCA", "Prestação de serviços de limpeza", "Locação de imóvel comercial", "Consultoria em gestão financeira". Nunca copie a cláusula de objeto),
 "valor_mensal": number | null (valor que será pago POR MÊS, em número, ex.: 5000.00. Se o contrato só traz valor anual, divida por 12; se só traz valor global e prazo em meses, divida pelo número de meses. Se o pagamento for único/não recorrente, use null),
 "valor_total": number | null (valor global do contrato, apenas como referência),
 "moeda": "BRL" | "USD" | "EUR" | string,
 "dia_pagamento": string | null (apenas o dia do mês em que o pagamento vence. Use só o número quando for dia fixo, ex.: "15", "10", "25". Se for regra, resuma em poucas palavras, ex.: "5º dia útil" ou "30 dias após NF"),
 "data_inicio": "AAAA-MM-DD" | null (início da vigência; se não houver, use a data de assinatura),
 "data_termino": "AAAA-MM-DD" | null (calcule a partir do prazo em meses se necessário; null se indeterminado),
 "prazo_indeterminado": boolean,
 "forma_pagamento": string | null (APENAS os meios de pagamento, no padrão: "TED" (inclui transferência, DOC e depósito em conta), "PIX CNPJ", "PIX CPF", "PIX E-MAIL", "PIX TELEFONE", "PIX CHAVE ALEATÓRIA" (informe o tipo da chave PIX citada no contrato; se o tipo não for informado, use só "PIX") e "BOLETO". Outros meios em maiúsculas: "CARTÃO", "DÉBITO AUTOMÁTICO", "CHEQUE". Mais de um meio: junte com " e ", ex.: "TED e BOLETO". Sem prazos, bancos, números de conta ou condições),
 "partes": [ { "nome": string, "documento": string | null (CNPJ ou CPF formatado), "papel": "Contratante" | "Contratada" | "Interveniente" | string } ],
 "contrato_referenciado": string | null (para aditivos/distratos: identificação do contrato original),
 "observacoes": string | null,
 "confianca": number (0 a 1, sua confiança geral na extração)
}
Regras: ignore páginas de log/registro de assinaturas eletrônicas (Clicksign, DocuSign, D4Sign etc.), testemunhas e representantes legais que assinam em nome das partes — liste apenas as pessoas físicas ou jurídicas contratantes. Não invente dados: use null quando a informação não estiver no documento.`;

async function callClaude(content,maxTokens=1000,system=AI_SYSTEM){
  // modo servidor: a chamada passa pelo back-end, que guarda a chave da Anthropic
  if(API.online){
    try{
      const data=await API.aiMessage({system,max_tokens:maxTokens,messages:[{role:'user',content}]});
      return (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');
    }catch(e){
      const err=new Error(e.message); err.status=e.status;
      err.code=e.status===503?'auth':e.status===0?'network':'http'; throw err;
    }
  }
  const cfg=getAICfg();
  const headers={'Content-Type':'application/json'};
  if(cfg.key){
    headers['x-api-key']=cfg.key;
    headers['anthropic-version']='2023-06-01';
    headers['anthropic-dangerous-direct-browser-access']='true';
  }
  let res;
  try{
    res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers,body:JSON.stringify({
      model:cfg.model||AI_DEFAULT_MODEL,max_tokens:maxTokens,system,messages:[{role:'user',content}]
    })});
  }catch(e){const err=new Error('Sem conexão com o serviço de IA'); err.code='network'; throw err;}
  if(!res.ok){
    let msg=''; try{const j=await res.json(); msg=j?.error?.message||'';}catch(_){}
    const err=new Error(res.status===401||res.status===403?'Chave de API inválida ou ausente':res.status===429?'Limite de uso da IA atingido, tente novamente em instantes':msg||`Erro ${res.status} no serviço de IA`);
    err.code=(res.status===401||res.status===403)?'auth':'http'; err.status=res.status; throw err;
  }
  const data=await res.json();
  return (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');
}

// ---------- leitura do arquivo ----------
function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader(); r.onload=()=>res(String(r.result).split(',')[1]); r.onerror=()=>rej(r.error); r.readAsDataURL(blob);});}
async function unzipEntry(buf,name){
  const dv=new DataView(buf); let eocd=-1;
  for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-65557);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}
  if(eocd<0) return null;
  const count=dv.getUint16(eocd+10,true); let p=dv.getUint32(eocd+16,true); const dec=new TextDecoder();
  for(let k=0;k<count;k++){
    const method=dv.getUint16(p+10,true), csize=dv.getUint32(p+20,true), nlen=dv.getUint16(p+28,true), elen=dv.getUint16(p+30,true), clen=dv.getUint16(p+32,true), loff=dv.getUint32(p+42,true);
    const fname=dec.decode(new Uint8Array(buf,p+46,nlen));
    if(fname===name){
      const start=loff+30+dv.getUint16(loff+26,true)+dv.getUint16(loff+28,true);
      const data=new Uint8Array(buf,start,csize);
      if(method===0) return dec.decode(data);
      const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(stream).text();
    }
    p+=46+nlen+elen+clen;
  }
  return null;
}
function xmlToText(xml){
  return xml.replace(/<w:tab\/>/g,'\t').replace(/<w:br\/>/g,'\n').replace(/<\/w:p>/g,'\n').replace(/<[^>]+>/g,'')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/\n{3,}/g,'\n\n').trim();
}
// .doc antigo (binário): recupera os trechos de texto legíveis
function legacyDocText(buf){
  const bytes=new Uint8Array(buf);
  const runs=(str)=>(str.match(/[A-Za-zÀ-ÿ0-9 \t\r\n.,;:!?()\-–—\/%$ºª°§"'@&*+=]{6,}/g)||[]).filter(r=>(r.match(/[A-Za-zÀ-ÿ]{3,}/g)||[]).length>=2);
  const u16=runs(new TextDecoder('utf-16le').decode(bytes.subarray(0,bytes.length-(bytes.length%2))));
  const l1=runs(new TextDecoder('windows-1252').decode(bytes));
  const seen=new Set(); const out=[];
  [...l1,...u16].forEach(r=>{const k=r.trim(); if(k&&!seen.has(k)){seen.add(k); out.push(k);}});
  return out.join('\n').replace(/\r/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
async function buildAIContent(f,blob){
  const t=(f.type||'pdf').toLowerCase();
  const ask={type:'text',text:`Arquivo: "${f.name}". Extraia os dados deste contrato no formato JSON solicitado.`};
  if(t==='pdf') return [{type:'document',source:{type:'base64',media_type:'application/pdf',data:await blobToBase64(blob)}},ask];
  let text='';
  const buf=await blob.arrayBuffer();
  if(t==='docx'){ const xml=await unzipEntry(buf,'word/document.xml'); if(xml) text=xmlToText(xml); }
  if(!text) text=legacyDocText(buf);
  if(text.length<80){const e=new Error('Não foi possível ler o texto deste arquivo. Converta para PDF e envie novamente.'); e.code='read'; throw e;}
  return [{type:'text',text:`<documento>\n${text.slice(0,180000)}\n</documento>`},ask];
}

// ---------- padronização de campos ----------
// Padrão de formas de pagamento: TED · PIX <tipo de chave> · BOLETO
const PIX_KEYS=[
  ['PIX CNPJ',/cnpj|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/i],
  ['PIX CPF',/\bcpf\b|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/i],
  ['PIX E-MAIL',/e-?mail|[\w.+-]+@[\w-]+\.[\w.]+/i],
  ['PIX TELEFONE',/telefone|celular|whats|\(\d{2}\)\s?9?\d{4}-?\d{4}/i],
  ['PIX CHAVE ALEATÓRIA',/aleat[óo]ria|\bevp\b|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i]
];
const PAY_OTHER=[
  ['CARTÃO',/cart[ãa]o/i],
  ['DÉBITO AUTOMÁTICO',/d[ée]bito autom/i],
  ['CHEQUE',/cheque/i],
  ['DINHEIRO',/dinheiro|esp[ée]cie/i]
];
function pixLabel(t){
  // procura o tipo de chave no trecho que fala de PIX (ou no texto todo, se curto)
  const i=t.search(/\bpix\b/i);
  const near=t.length<=60?t:t.slice(Math.max(0,i-10),i+90);
  const hit=PIX_KEYS.find(([,re])=>re.test(near));
  return hit?hit[0]:'PIX';
}
// Ex.: "Boleto bancário venc. dia 10 ou PIX para a chave CNPJ 12.345.678/0001-90" -> "PIX CNPJ e BOLETO"
function normalizePayment(txt){
  const t=String(txt||'').trim();
  if(!t||t==='—') return '—';
  const out=[];
  if(/\bted\b|\bdoc\b|transfer[êe]ncia|dep[óo]sito/i.test(t)) out.push('TED');
  if(/\bpix\b/i.test(t)){
    // a IA pode trazer mais de um tipo de chave: "PIX CNPJ e PIX E-MAIL"
    const parts=t.split(/\s+e\s+|,|\bou\b/i).filter(p=>/\bpix\b/i.test(p));
    const labels=[...new Set(parts.map(pixLabel))];
    out.push(...(labels.length>1?labels.filter(l=>l!=='PIX'):labels));
  }
  if(/boleto|bloqueto/i.test(t)) out.push('BOLETO');
  PAY_OTHER.forEach(([n,re])=>{if(re.test(t)) out.push(n);});
  if(!out.length) return t.split(/[,.;(]/)[0].trim();
  return out.length===1?out[0]:out.slice(0,-1).join(', ')+' e '+out[out.length-1];
}
// Mantém só a primeira ideia completa (até a primeira vírgula), sem cortar frases no meio
function shortObject(txt){
  let t=String(txt||'').trim().replace(/\s+/g,' ').replace(/[.;]+$/,'');
  if(!t) return '';
  return t.split(/[;,:]|\s[–—-]\s/)[0].trim();
}
const wordCount=t=>String(t||'').trim().split(/\s+/).filter(Boolean).length;
// Se o objeto ainda ficou longo, pede à IA um rótulo curto que faça sentido (só texto, custo mínimo)
const OBJ_SYSTEM=`Você reescreve o objeto de contratos como um rótulo curto, completo e que faça sentido sozinho, em português do Brasil.
Regras: no máximo 8 palavras; mantenha o serviço/fornecimento principal; não corte frases no meio; sem vírgulas, aspas ou ponto final.
Exemplos: "Prestação de serviços técnicos especializados em processos de Renovação e Inscrição do CMDCA, locação de imóvel..." -> Assessoria para renovação e inscrição no CMDCA
"Prestação de serviços de limpeza, conservação e higienização predial nas unidades..." -> Serviços de limpeza e conservação predial
Responda somente com o rótulo.`;
let objRefining=false;
async function refineObjects(){
  if(objRefining) return; objRefining=true;
  try{
    const list=allFilesList().filter(f=>f.object&&wordCount(f.object)>8&&!f.objRefined);
    for(const f of list){
      try{
        const out=(await callClaude([{type:'text',text:f.objectFull||f.object}],60,OBJ_SYSTEM)).trim().split('\n')[0].replace(/^["'“”]+|["'“”.]+$/g,'').trim();
        if(out&&wordCount(out)<=12){ f.object=out; }
        f.objRefined=true; saveData();
        if(S.file===f.id&&document.getElementById('drawer').classList.contains('open')) openFileDrawer(f);
      }catch(e){ if(e.code==='auth'||e.code==='network') break; }
    }
  } finally { objRefining=false; }
}

// ---------- aplicação do resultado ----------
function parseAIJson(txt){
  const clean=txt.replace(/```json|```/g,'').trim();
  const a=clean.indexOf('{'), b=clean.lastIndexOf('}');
  if(a<0||b<0) throw Object.assign(new Error('A IA não retornou dados válidos'),{code:'parse'});
  return JSON.parse(clean.slice(a,b+1));
}
const isoOk=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(new Date(d));
function fmtCurrency(n,moeda){
  if(typeof n!=='number'||!isFinite(n)||n<=0) return '—';
  const cur=(moeda||'BRL').toUpperCase();
  try{return n.toLocaleString('pt-BR',{style:'currency',currency:cur}).replace(/\u00a0/g,' ');}catch(e){return `${cur} ${n.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;}
}
const normDoc=s=>String(s||'').replace(/\D/g,'');
const normName=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(ltda|s\.?a\.?|me|eireli|epp)\b/g,'').replace(/[^a-z0-9 ]/g,'').trim();
// ── Vínculo por CNPJ/CPF ──
// Dois documentos são vinculados quando têm as MESMAS partes (CNPJ/CPF).
// Se ambos têm 2+ documentos identificados, precisam coincidir em pelo menos 2
// (evita ligar contratos diferentes só porque a sua empresa é a contratante em todos).
function partyIds(f){return new Set((f.cnpj||[]).map(normDoc).filter(d=>d.length>=11));}
function partyNames(f){return (f.parties||[]).map(normName).filter(n=>n.length>4);}
function namesMatch(a,b){
  const A=partyNames(a), B=partyNames(b); let n=0;
  A.forEach(x=>{if(B.some(y=>y===x||y.includes(x)||x.includes(y))) n++;});
  return n;
}
function sameParties(a,b){
  const A=partyIds(a), B=partyIds(b);
  const need=Math.min(2,A.size,B.size); if(!need) return false;
  let common=0; A.forEach(d=>{if(B.has(d)) common++;});
  if(common>=need) return true;
  // 1 CNPJ igual e as duas partes com o mesmo nome (ex.: um documento traz CPF e o outro CNPJ)
  return common>=1&&namesMatch(a,b)>=2;
}
function relatedDocs(f){
  const order={Principal:0,Aditivo:1,Distrato:2};
  return allFilesList().filter(x=>x.id!==f.id&&sameParties(f,x))
    .sort((a,b)=>(order[a.contractType]??3)-(order[b.contractType]??3)||String(a.startDate).localeCompare(String(b.startDate)));
}
function findParentContract(f){
  const folder=fileFolderId(f.id);
  let best=null, bestScore=-1;
  for(const [fid,arr] of Object.entries(DATA.files)){
    for(const c of arr){
      if(c.id===f.id||c.contractType!=='Principal'||!sameParties(f,c)) continue;
      let sc=0;
      if(fid===folder) sc+=2;
      if(f.aiRef&&normName(c.name)&&normName(f.aiRef).split(' ').filter(w=>w.length>3&&normName(c.name).includes(w)).length>=2) sc+=2;
      if(sc>bestScore){best=c; bestScore=sc;}
    }
  }
  return best;
}
// Tipo provisório pelo nome do arquivo (a leitura da IA confirma depois)
function guessTypeFromName(name){
  const n=String(name||'').toLowerCase();
  if(/distrato|rescis|resili|encerramento/.test(n)) return 'Distrato';
  if(/aditivo|apostilamento/.test(n)) return 'Aditivo';
  return 'Principal';
}
// Revisa vínculos antigos: remove os que não têm o mesmo CNPJ e cria os que faltam
function relinkAll(){
  let changed=false;
  allFilesList().forEach(f=>{
    if(f.parentId){const p=findFile(f.parentId); if(!p||!sameParties(f,p)){delete f.parentId; changed=true;}}
    if(!f.parentId&&f.contractType!=='Principal'){const p=findParentContract(f); if(p){f.parentId=p.id; changed=true;}}
  });
  if(changed) saveData();
}
function applyAIResult(f,r){
  if(['Principal','Aditivo','Distrato'].includes(r.tipo)) f.contractType=r.tipo;
  f.value=fmtCurrency(typeof r.valor_mensal==='number'?r.valor_mensal:null,r.moeda);
  if(f.value==='—'&&typeof r.valor_total==='number'&&r.valor_total>0) f.value=fmtCurrency(r.valor_total,r.moeda)+' (pagamento único)';
  f.valueTotal=typeof r.valor_total==='number'?r.valor_total:null;
  {const d=String(r.dia_pagamento??'').trim().replace(/^dia\s*/i,''); f.payDay=d||'—';}
  f.payment=normalizePayment(r.forma_pagamento);
  f.startDate=isoOk(r.data_inicio)?r.data_inicio:'—';
  f.endDate=isoOk(r.data_termino)?r.data_termino:'—';
  const partes=Array.isArray(r.partes)?r.partes.filter(p=>p&&p.nome):[];
  if(partes.length){
    f.parties=partes.map(p=>p.nome); f.cnpj=partes.map(p=>p.documento||'—'); f.partyRoles=partes.map(p=>p.papel||'Parte');
  }
  f.objectFull=r.objeto||''; f.object=shortObject(r.objeto); f.objRefined=wordCount(f.object)<=8; f.aiTitle=r.titulo||''; f.aiNotes=r.observacoes||''; f.aiRef=r.contrato_referenciado||'';
  f.confidence=Math.max(0,Math.min(1,Number(r.confianca)||0.8));
  f.statusMode='auto';
  delete f.parentId;
  if(f.contractType!=='Principal'){const p=findParentContract(f); if(p) f.parentId=p.id;}
  f.processing='done'; f.aiError=''; f.aiAt=todayISO(); f.updatedAt=todayISO();
}

// ---------- fila de processamento ----------
const aiQueue=[]; let aiRunning=false, aiConfigPrompted=false;
function enqueueAI(id){
  const f=findFile(id); if(!f||!f.hasBlob) return;
  f.processing='processing'; f.aiError='';
  if(!aiQueue.includes(id)) aiQueue.push(id);
  saveData(); refreshAll(); if(S.file===id) openFileDrawer(f);
  runAIQueue();
}
async function runAIQueue(){
  if(aiRunning) return; aiRunning=true;
  while(aiQueue.length){
    const id=aiQueue.shift(); const f=findFile(id); if(!f) continue;
    try{
      const blob=await blobDB.get(id);
      if(!blob) throw Object.assign(new Error('Arquivo original não encontrado neste navegador'),{code:'read'});
      const content=await buildAIContent(f,blob);
      const out=await callClaude(content);
      applyAIResult(f,parseAIJson(out));
      relinkAll();
      if(!f.objRefined) setTimeout(refineObjects,0);
      showToast(`IA leu "${f.name.slice(0,40)}${f.name.length>40?'…':''}"`,'var(--green)');
    }catch(e){
      f.processing='error'; f.aiError=e.message||'Falha na leitura';
      if((e.code==='auth'||e.code==='network')&&!aiConfigPrompted){
        aiConfigPrompted=true;
        // os demais itens da fila também falhariam: marca e para
        aiQueue.splice(0).forEach(q=>{const x=findFile(q); if(x){x.processing='error'; x.aiError=e.message;}});
        saveData(); refreshAll(); if(S.file) {const x=findFile(S.file); if(x) openFileDrawer(x);}
        openAISettings(e.message);
        break;
      }
    }
    saveData(); refreshAll();
    refreshOpenDrawer();
  }
  aiRunning=false;
  refreshOpenDrawer();
}
function refreshOpenDrawer(){
  const dr=document.getElementById('drawer');
  if(!S.file||!dr.classList.contains('open')||S.drawerMode==='folder') return;
  if(dr.contains(document.activeElement)&&document.activeElement.tagName==='INPUT') return;
  const x=findFile(S.file); if(x){const sc=document.getElementById('drawerBody')?.scrollTop||0; openFileDrawer(x); const b=document.getElementById('drawerBody'); if(b) b.scrollTop=sc;}
}
function retryAI(id){aiConfigPrompted=false; enqueueAI(id);}
function confirmReprocess(id){
  makeModal(`<div class="modal" style="max-width:420px">
    <div class="modal-title">Ler novamente com IA</div>
    <div class="modal-sub">Os campos extraídos (tipo, datas, valor, pagamento e partes) serão substituídos pela nova leitura. Alterações manuais nesses campos serão perdidas.</div>
    <div class="modal-actions"><button class="btn-save" onclick="closeModal();retryAI('${id}')">Ler novamente</button><button class="btn-ghost" onclick="closeModal()">Cancelar</button></div>
  </div>`);
}
function retryAllFailed(){aiConfigPrompted=false; allFilesList().filter(f=>f.processing==='error'&&f.hasBlob).forEach(f=>enqueueAI(f.id));}

// ---------- configurações ----------
function openAISettings(reason){
  if(API.online) return openServerAIInfo(reason);
  const c=getAICfg();
  makeModal(`<div class="modal" style="width:min(500px,94vw)">
    <div class="modal-title">Integração com IA</div>
    <div class="modal-sub">A leitura automática dos contratos usa o Claude, da Anthropic. ${reason?`<br><strong style="color:var(--red)">${esc(reason)}.</strong>`:''}</div>
    <div class="modal-label">Chave de API da Anthropic</div>
    <input class="modal-input" id="ai_key" type="password" autocomplete="off" placeholder="sk-ant-..." value="${esc(c.key||'')}">
    <div class="modal-label">Modelo</div>
    <input class="modal-input" id="ai_model" value="${esc(c.model||AI_DEFAULT_MODEL)}">
    <div style="font-size:12px;color:var(--t3);line-height:1.55;margin:-6px 0 16px">A chave fica salva apenas neste navegador. Para uso em produção, o ideal é fazer essa chamada por um servidor da empresa, sem expor a chave no navegador.</div>
    <div class="modal-err" id="ai_err"></div>
    <div id="ai_ok" style="display:none;font-size:12.5px;color:var(--green);margin:-6px 0 12px">Conexão funcionando.</div>
    <div class="modal-actions">
      <button class="btn-save" onclick="saveAISettings()">Salvar</button>
      <button class="btn-ghost" id="ai_test" onclick="testAISettings()">Testar conexão</button>
      <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`);
  setTimeout(()=>document.getElementById('ai_key')?.focus(),50);
}
/** No modo servidor a chave fica no back-end; aqui só mostramos o status. */
function openServerAIInfo(reason){
  makeModal(`<div class="modal" style="width:min(480px,94vw)">
    <div class="modal-title">Integração com IA</div>
    <div class="modal-sub">A leitura automática usa o Claude, da Anthropic. Neste ambiente a chave fica <strong>guardada no servidor</strong>, nunca no navegador.${reason?`<br><strong style="color:var(--red)">${esc(reason)}.</strong>`:''}</div>
    <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--b2);border-radius:var(--r8);margin-bottom:16px">
      <span style="width:9px;height:9px;border-radius:50%;background:${API.ai?'var(--green)':'var(--red)'}"></span>
      <span style="font-size:13px">${API.ai?'IA configurada no servidor':'IA não configurada no servidor'}</span>
    </div>
    ${API.ai?'':`<div style="font-size:12.5px;color:var(--t3);line-height:1.6;margin:-4px 0 16px">Para ativar, o administrador deve definir <code>ANTHROPIC_API_KEY</code> no arquivo <code>backend/.env</code> e reiniciar o servidor.</div>`}
    <div class="modal-err" id="ai_err"></div>
    <div id="ai_ok" style="display:none;font-size:12.5px;color:var(--green);margin:-6px 0 12px">Conexão funcionando.</div>
    <div class="modal-actions">
      ${API.ai?`<button class="btn-ghost" id="ai_test" onclick="testServerAI()">Testar conexão</button>`:''}
      <button class="btn-save" onclick="closeModal()">Fechar</button>
    </div>
  </div>`);
}
async function testServerAI(){
  const btn=document.getElementById('ai_test'), err=document.getElementById('ai_err'), ok=document.getElementById('ai_ok');
  err.style.display='none'; ok.style.display='none'; btn.disabled=true; btn.textContent='Testando...';
  try{ await callClaude([{type:'text',text:'Responda apenas {"ok":true}'}],20); ok.style.display='block'; }
  catch(e){ err.textContent=e.message; err.style.display='block'; }
  finally{ btn.disabled=false; btn.textContent='Testar conexão'; }
}
function readAIForm(){return {key:(document.getElementById('ai_key')?.value||'').trim(),model:(document.getElementById('ai_model')?.value||'').trim()||AI_DEFAULT_MODEL};}
async function testAISettings(){
  const prev=getAICfg(); setAICfg(readAIForm());
  const btn=document.getElementById('ai_test'), err=document.getElementById('ai_err'), ok=document.getElementById('ai_ok');
  err.style.display='none'; ok.style.display='none'; btn.disabled=true; btn.textContent='Testando...';
  try{ await callClaude([{type:'text',text:'Responda apenas {"ok":true}'}],20); ok.style.display='block'; }
  catch(e){ err.textContent=e.message; err.style.display='block'; }
  finally{ setAICfg(prev); btn.disabled=false; btn.textContent='Testar conexão'; }
}
function saveAISettings(){
  setAICfg(readAIForm()); closeModal();
  const failed=allFilesList().filter(f=>f.processing==='error'&&f.hasBlob);
  showToast('Configuração da IA salva','var(--green)');
  if(failed.length) retryAllFailed();
  setTimeout(refineObjects,500);
}
