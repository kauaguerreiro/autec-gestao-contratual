/* Autec — Prévia, edição, exportação CSV, alertas e modais */
// ══════════════════════════════════════════════
//  PRÉVIA DO DOCUMENTO NO PAINEL
// ══════════════════════════════════════════════
const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let pdfjsPromise=null;
function loadPdfJs(){
  if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if(pdfjsPromise) return pdfjsPromise;
  pdfjsPromise=new Promise((res,rej)=>{
    const s=document.createElement('script'); s.src=PDFJS_URL;
    s.onload=()=>{ if(window.pdfjsLib){ window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER; res(window.pdfjsLib);} else rej(new Error('pdf.js indisponível')); };
    s.onerror=()=>{pdfjsPromise=null; rej(new Error('pdf.js indisponível'));};
    document.head.appendChild(s);
  });
  return pdfjsPromise;
}
const previewCache=new Map(); // id -> elemento já renderizado
let previewToken=0;
function cachePreview(id,el){previewCache.set(id,el); if(previewCache.size>6){previewCache.delete(previewCache.keys().next().value);}}
function dropPreview(id){previewCache.delete(id);}

async function renderPreview(f){
  const host=document.getElementById('docPages'); if(!host) return;
  const token=++previewToken;
  if(previewCache.has(f.id)){host.innerHTML=''; host.appendChild(previewCache.get(f.id)); return;}
  const done=el=>{ if(token!==previewToken) return; host.innerHTML=''; host.appendChild(el); cachePreview(f.id,el); };
  try{
    const blob=await blobDB.get(f.id);
    if(!blob) throw new Error('Arquivo não encontrado neste navegador');
    const t=(f.type||'pdf').toLowerCase();
    const wrap=document.createElement('div'); wrap.className='doc-pages-inner';
    if(t==='pdf'){
      let lib=null; try{ lib=await loadPdfJs(); }catch(e){}
      if(!lib){ // sem pdf.js: usa o visualizador do navegador
        const fr=document.createElement('iframe'); fr.className='doc-frame'; fr.title='Prévia do contrato';
        fr.src=URL.createObjectURL(blob)+'#toolbar=0&navpanes=0&view=FitH';
        wrap.classList.add('frame'); wrap.appendChild(fr); done(wrap); return;
      }
      // verbosity 0 = só erros: oculta avisos internos do pdf.js (ex.: "Setting up fake worker",
      // usado quando o navegador bloqueia workers, e "TT: undefined function", sobre dicas de fonte do PDF)
      const pdf=await lib.getDocument({data:new Uint8Array(await blob.arrayBuffer()),verbosity:0,isEvalSupported:false}).promise;
      if(token!==previewToken) return;
      done(wrap);
      const width=Math.max(260,host.clientWidth-24);
      const max=Math.min(pdf.numPages,40);
      for(let i=1;i<=max;i++){
        const page=await pdf.getPage(i);
        const vp1=page.getViewport({scale:1});
        const scale=width/vp1.width*(window.devicePixelRatio||1)*1.25;
        const vp=page.getViewport({scale});
        const c=document.createElement('canvas'); c.className='doc-page'; c.width=vp.width; c.height=vp.height;
        c.setAttribute('aria-label',`Página ${i}`);
        wrap.appendChild(c);
        await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
      }
      if(pdf.numPages>max){const m=document.createElement('div'); m.className='doc-more'; m.textContent=`Mostrando ${max} de ${pdf.numPages} páginas · clique em Abrir para ver o documento completo`; wrap.appendChild(m);}
    } else {
      const buf=await blob.arrayBuffer();
      let text='';
      if(t==='docx'){const xml=await unzipEntry(buf,'word/document.xml'); if(xml) text=xmlToText(xml);}
      if(!text) text=legacyDocText(buf);
      const page=document.createElement('div'); page.className='doc-page doc-text';
      text.split(/\n+/).filter(p=>p.trim()).forEach(p=>{const el=document.createElement('p'); el.textContent=p; page.appendChild(el);});
      if(!page.childNodes.length) page.textContent='Não foi possível gerar a prévia deste arquivo.';
      wrap.appendChild(page); done(wrap);
    }
  }catch(e){
    if(token!==previewToken) return;
    host.innerHTML=`<div class="doc-loading">Prévia indisponível · ${esc(e.message||'erro')}</div>`;
  }
}

// ══════════════════════════════════════════════
//  ABRIR DOCUMENTO
// ══════════════════════════════════════════════
async function openDocument(id){
  const f=findFile(id); if(!f) return;
  if(!f.hasBlob){showToast('Documento de exemplo — não há arquivo anexado','var(--amber)'); return;}
  const isPdf=(f.type||'pdf')==='pdf';
  const win=isPdf?window.open('','_blank'):null;
  try{
    const blob=await blobDB.get(id);
    if(!blob){ if(win) win.close(); showToast('Arquivo não encontrado neste navegador','var(--red)'); return; }
    const url=URL.createObjectURL(blob);
    if(win){
      win.document.title=f.name;
      win.document.body.style.cssText='margin:0;background:#222';
      const fr=win.document.createElement('iframe');
      fr.src=url; fr.style.cssText='border:0;width:100vw;height:100vh;display:block';
      win.document.body.appendChild(fr);
    }
    else { const a=document.createElement('a'); a.href=url; a.download=`${f.name}.${f.type||'pdf'}`; document.body.appendChild(a); a.click(); a.remove(); }
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){ if(win) win.close(); showToast('Não foi possível abrir o arquivo','var(--red)'); }
}

// ══════════════════════════════════════════════
//  SALVAR EDIÇÕES DO PAINEL
// ══════════════════════════════════════════════
function saveDrawer(id){
  const f=findFile(id); if(!f) return;
  const v=x=>(document.getElementById(x)?.value||'').trim();
  const start=parseDateInput(v('dr_start')), end=parseDateInput(v('dr_end'));
  if(start===null){showToast('Data de início inválida — use DD/MM/AAAA','var(--red)'); document.getElementById('dr_start')?.focus(); return;}
  if(end===null){showToast('Data de término inválida — use DD/MM/AAAA','var(--red)'); document.getElementById('dr_end')?.focus(); return;}
  if(start!=='—'&&end!=='—'&&end<start){showToast('A data de término é anterior ao início','var(--red)'); return;}
  f.startDate=start; f.endDate=end;
  f.value=v('dr_value')||'—'; {const pd=v('dr_payday').replace(/^dia\s*/i,''); f.payDay=pd&&pd!=='—'?pd:'—';} f.payment=normalizePayment(v('dr_payment'));
  (f.parties||[]).forEach((_,i)=>{ f.parties[i]=v('dr_party_'+i)||'—'; f.cnpj=f.cnpj||[]; f.cnpj[i]=v('dr_cnpj_'+i)||'—'; });
  f.updatedAt=todayISO();
  relinkAll(); saveData(); refreshAll(); openFileDrawer(f);
  document.querySelectorAll('.ct-row').forEach(r=>r.classList.toggle('selected',r.dataset.id===id));
  showToast('Alterações salvas','var(--green)');
}

// ══════════════════════════════════════════════
//  EXPORTAÇÃO CSV
// ══════════════════════════════════════════════
function exportCSV(files,filename){
  if(!files.length){showToast('Nenhum documento para exportar','var(--amber)'); return;}
  const lbl=STATUS_LBL;
  const cols=['Documento','Espaço','Tipo','Status','Valor mensal','Início','Término','Dia de pagamento','Forma de pagamento','Partes','CNPJ','Responsável','Atualizado em'];
  const q=x=>`"${String(x??'').replace(/"/g,'""')}"`;
  const rows=files.map(f=>{
    const fid=fileFolderId(f.id);
    const path=fid==='root'?'Sem pasta':(getFolderPath(fid)||[]).map(n=>n.name).join(' / ');
    return [f.name,path,f.contractType,lbl[st(f)],f.value,fmtDate(f.startDate),fmtDate(f.endDate),f.payDay||'—',f.payment,(f.parties||[]).join(' | '),(f.cnpj||[]).join(' | '),f.responsible,fmtDate(f.updatedAt)].map(q).join(';');
  });
  const csv='\ufeff'+[cols.map(q).join(';'),...rows].join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  showToast('Relatório exportado (CSV)','var(--green)');
}
function slug(t){return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'relatorio';}
function exportFolderReport(fid){const f=findFolder(fid); if(!f) return; exportCSV(getAllDescendantFiles(fid),`autec-${slug(f.name)}-${todayISO()}.csv`);}
function exportAllReport(){exportCSV(allFilesList(),`autec-contratos-${todayISO()}.csv`);}

// ══════════════════════════════════════════════
//  ALERTAS DE VENCIMENTO
// ══════════════════════════════════════════════
function openAlertModal(fid){
  const folder=findFolder(fid); if(!folder) return;
  const cur=DATA.alerts[fid]||'';
  const ov=makeModal(`<div class="modal" style="max-width:400px">
    <div class="modal-title">Alerta de vencimento</div>
    <div class="modal-sub" style="margin-bottom:14px">Contratos de <strong style="color:var(--t1)">${esc(folder.name)}</strong> (e subpastas) serão marcados como <em>Vencendo</em> e aparecerão em Vencimentos com esta antecedência.</div>
    <div class="modal-label">Avisar com antecedência de</div>
    <select class="modal-input" id="al_days">
      ${[7,15,30,60,90,120].map(d=>`<option value="${d}" ${Number(cur||DEFAULT_ALERT_DAYS)===d?'selected':''}>${d} dias</option>`).join('')}
    </select>
    <div class="modal-actions">
      <button class="btn-save" style="flex:1;padding:9px" onclick="saveAlert('${fid}')">Salvar alerta</button>
      ${cur?`<button class="btn-ghost" style="padding:9px 12px;color:var(--red)" onclick="removeAlert('${fid}')">Remover</button>`:''}
      <button class="btn-ghost" style="padding:9px 16px" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`);
}
function saveAlert(fid){
  const d=Number(document.getElementById('al_days')?.value)||DEFAULT_ALERT_DAYS;
  DATA.alerts[fid]=d; saveData(); closeModal(); refreshAll(); openFolderDrawer(fid);
  showToast(`Alerta configurado: ${d} dias antes do vencimento`,'var(--amber)');
}
function removeAlert(fid){
  delete DATA.alerts[fid]; saveData(); closeModal(); refreshAll(); openFolderDrawer(fid);
  showToast('Alerta removido','var(--t3)');
}
function setGlobalAlert(v){DATA.alerts.__global=Number(v)||DEFAULT_ALERT_DAYS; saveData(); refreshAll();}

// ══════════════════════════════════════════════
//  MODAL GENÉRICO
// ══════════════════════════════════════════════
function makeModal(html){
  closeModal();
  const ov=document.createElement('div');
  ov.id='lxModal'; ov.className='modal-overlay';
  ov.innerHTML=html;
  ov.addEventListener('click',e=>{if(e.target===ov) closeModal();});
  document.body.appendChild(ov);
  return ov;
}
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if(document.getElementById('lxModal')) closeModal();
  else if(document.body.classList.contains('nav-open')) closeNav();
  else if(document.getElementById('drawer')?.classList.contains('open')) closeDrawer();
  else if(S.sel&&S.sel.size) clearSel();
  else if(S.dbFocus&&S.view==='dashboard') dbFocus(null);
});
