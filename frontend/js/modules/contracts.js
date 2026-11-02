/* Autec — Tabela de contratos, painel de detalhamento, arrastar e soltar, upload */
// ══════════════════════════════════════════════
//  FOLDER VIEW
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
//  CONTRACT TABLE
// ══════════════════════════════════════════════
function renderContractTable(files, container, opts={}){
  if(!container) return;
  if(!files.length){
    container.innerHTML=`<div class="empty fade-in">
      <div class="empty-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.4"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></div>
      <div class="empty-title">${opts.emptyTitle||'Nenhum documento'}</div>
      <div class="empty-sub">${opts.emptySub||'Arraste arquivos ou clique em Upload para adicionar contratos'}</div>
    </div>`; return;
  }

  const sorted=opts.sortFn?[...files].sort(opts.sortFn):[...files].sort((a,b)=>{
    if(S.sort==='nome') return a.name.localeCompare(b.name);
    if(S.sort==='data') return (b.startDate||'').localeCompare(a.startDate||'');
    if(S.sort==='valor') return parseVal(b.value)-parseVal(a.value);
    return 0;
  });

  const rows=sorted.map(f=>{
    const isExpiring=st(f)==='expiring';
    const isProc=f.processing==='processing';
    const fst=st(f); const dd=fst==='expired'?null:daysUntil(effEnd(f));
    const term=fst==='expired'?terminationDoc(f):null;
    const daysHtml=term?`<span class="ct-days" style="color:var(--t3)">Distrato${term.id!==f.id&&term.startDate&&term.startDate!=='—'?' em '+fmtDate(term.startDate):''}</span>`
      :(dd!==null&&fst!=='active')?`<span class="ct-days" style="color:${fst==='expiring'?'var(--amber)':'var(--red)'}">${daysLabel(dd)}</span>`:'';
    const confBadge=isProc
      ? `<span style="font-size:11px;color:var(--blue);display:flex;align-items:center;gap:4px"><span class="ai-spin"></span>Lendo</span>`
      : f.processing==='error' ? `<span style="font-size:11px;color:var(--red)">Falhou</span>`
      : f.processing==='pending' ? `<span style="font-size:11px;color:var(--t3);white-space:nowrap">Não lido</span>`
      : f.confidence ? `<span style="font-size:11px;color:var(--green)" title="Confiança da leitura pela IA">${Math.round(f.confidence*100)}%</span>`
      : `<span style="font-size:11px;color:var(--t4)">—</span>`;

    return `<div class="ct-row fade-in ${S.file===f.id?'selected':''}${isExpiring?' expiring-row':''}" data-id="${f.id}" onclick="selectFile('${f.id}')">
      <div class="ct-cell">
        <div class="ct-name-wrap">
          <div class="ct-file-icon fi-pdf">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2h5.5L12 4.5V14a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M9 2v3h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </div>
          <div class="ct-name-body">
            <div class="ct-name" title="${esc(f.name)}">${esc(f.name)}</div>
            <div class="ct-sub">${typeBadge(f.contractType)}${(f.parties||[])[0]&&f.parties[0]!=='—'?`<span>${esc(f.parties[0])}</span>`:''}</div>
          </div>
        </div>
      </div>
      <div class="ct-cell">${statusBadge(st(f))}</div>
      <div class="ct-cell ct-col-val">
        <div>
          <div class="ct-value">${f.value&&f.value!=='—'?esc(f.value):'—'}</div>
          <div class="ct-date">${f.startDate&&f.startDate!=='—'?`${fmtDate(f.startDate)} → ${f.endDate&&f.endDate!=='—'?fmtDate(f.endDate):'Sem término'}`:'Vigência não informada'}${daysHtml}</div>
        </div>
      </div>
      <div class="ct-cell ct-col-ia" style="justify-content:flex-end;gap:6px">
        <div style="font-size:10px;color:var(--t3)">${confBadge}</div>
        <div class="ct-actions">
          <button class="ct-action-btn" title="Ver detalhes" onclick="event.stopPropagation();selectFile('${f.id}')">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13h8A1.5 1.5 0 0012 11.5V9M7 7l5-5M9 2h3v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="ct-action-btn" title="Editar" onclick="event.stopPropagation();openEditModal('${f.id}')">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="ct-action-btn" title="Excluir" style="color:var(--red)" onclick="event.stopPropagation();confirmDelete('${f.id}')">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11 3.5l-.8 8a1 1 0 01-1 .9H4.8a1 1 0 01-1-.9L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 6.5v3M8.5 6.5v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  container.innerHTML=`<div class="contract-table fade-in">
    <div class="ct-head">
      <div class="ct-head-cell">Documento</div>
      <div class="ct-head-cell">Status</div>
      <div class="ct-head-cell ct-col-val">Valor mensal / Vigência</div>
      <div class="ct-head-cell ct-col-ia" style="text-align:right">Leitura IA</div>
    </div>
    ${rows}
  </div>`;
}

// ══════════════════════════════════════════════
//  DASHBOARD TABLE RENDER (called after DOM ready)
// ══════════════════════════════════════════════


// ══════════════════════════════════════════════
//  FILE SELECTION → DRAWER
// ══════════════════════════════════════════════
function selectFile(id){
  const f=findFile(id); if(!f) return;
  S.file=id; S.drawerMode='file';
  document.querySelectorAll('.ct-row').forEach(r=>r.classList.toggle('selected',r.dataset.id===id));
  document.querySelectorAll('.ex-row[data-id],.ex-tile[data-id]').forEach(r=>r.classList.toggle('current',r.dataset.id===id));
  openFileDrawer(f);
}

/**
 * Histórico do contrato: contrato principal → aditivos → distrato, em ordem de data,
 * com a evolução do valor mensal e da vigência (mesmo CNPJ das partes).
 */
function contractHistoryHtml(f){
  const chain=[f,...relatedDocs(f)];
  if(chain.length<2) return '';
  const key=d=>(d.startDate&&d.startDate!=='—'?d.startDate:(d.updatedAt||'9999'));
  const ord={Principal:0,Aditivo:1,Distrato:2};
  chain.sort((a,b)=>key(a).localeCompare(key(b))||(ord[a.contractType]??3)-(ord[b.contractType]??3));
  const vals=chain.map(d=>parseVal(d.value));
  const firstV=vals.find(v=>v>0)||0, lastV=[...vals].reverse().find(v=>v>0)||0;
  const pct=firstV&&lastV&&firstV!==lastV?((lastV/firstV-1)*100):null;
  const ends=chain.map(d=>d.endDate).filter(d=>d&&d!=='—').sort();
  const lastEnd=ends.length?ends[ends.length-1]:null;
  const nAd=chain.filter(d=>d.contractType==='Aditivo').length, dist=chain.find(d=>d.contractType==='Distrato');
  let prev=0;
  const items=chain.map((d,i)=>{
    const v=parseVal(d.value); let delta='';
    if(v>0&&prev>0&&v!==prev){const p=(v/prev-1)*100; delta=`<span class="hx-delta ${p>0?'up':'down'}">${p>0?'▲':'▼'} ${Math.abs(p).toLocaleString('pt-BR',{maximumFractionDigits:1})}%</span>`;}
    if(v>0) prev=v;
    const cur=d.id===f.id;
    return `<li class="hx-item ${cur?'cur':''} t-${(d.contractType||'').toLowerCase()}" style="--i:${i}" ${cur?'':`onclick="selectFile('${d.id}')"`}>
      <span class="hx-dot"></span>
      <div class="hx-body">
        <div class="hx-top"><span class="hx-date">${d.startDate&&d.startDate!=='—'?fmtDate(d.startDate):'Sem data'}</span>${typeBadge(d.contractType)}${cur?'<span class="hx-cur">este documento</span>':''}</div>
        <div class="hx-name" title="${esc(d.name)}">${esc(d.name)}</div>
        <div class="hx-meta">${v>0?`<b>${esc(d.value)}</b>${delta}`:'<span>Sem alteração de valor</span>'}${d.endDate&&d.endDate!=='—'?`<span>· vigência até ${fmtDate(d.endDate)}</span>`:''}</div>
      </div></li>`;
  }).join('');
  return `<div class="cd-section">
    <div class="cd-section-title">Histórico do contrato</div>
    <div class="hx-summary">
      <div><span>Valor inicial</span><b>${firstV?brl(firstV):'—'}</b></div>
      <div><span>Valor atual</span><b>${lastV?brl(lastV):'—'}</b>${pct!==null?`<em class="${pct>0?'up':'down'}">${pct>0?'+':''}${pct.toLocaleString('pt-BR',{maximumFractionDigits:1})}%</em>`:''}</div>
      <div><span>${dist?'Encerrado em':'Vigência até'}</span><b>${dist?(dist.startDate&&dist.startDate!=='—'?fmtDate(dist.startDate):'distrato'):(lastEnd?fmtDate(lastEnd):'—')}</b></div>
    </div>
    <ol class="hx-list">${items}</ol>
    <div class="rel-caption" style="margin-top:6px">${nAd} aditivo${nAd!==1?'s':''}${dist?' · 1 distrato':''} · documentos ligados pelo mesmo CNPJ</div>
  </div>`;
}

function statusNote(f){
  const s=st(f), end=effEnd(f), d=daysUntil(end);
  const ext=end!=='—'&&end!==f.endDate?` <span style="color:var(--t3)">(prorrogado por aditivo)</span>`:'';
  const box=(bg,bd,c,html)=>`<div class="status-note" style="background:${bg};border-color:${bd};color:${c}">${html}</div>`;
  if(s==='expired'){const t=terminationDoc(f);
    return box('var(--s3)','var(--b2)','var(--t2)',t&&t.id!==f.id?`<strong>Encerrado por distrato</strong><span class="sn-link" onclick="selectFile('${t.id}')">${esc(t.name)}${t.startDate&&t.startDate!=='—'?' · '+fmtDate(t.startDate):''}</span>`:`<strong>${f.contractType==='Distrato'?'Documento de encerramento':'Encerrado'}</strong>`);}
  if(s==='overdue') return box('var(--rd)','var(--rb)','var(--red)',`<strong>Vencido — ${daysLabel(d).replace('Venceu','venceu')}</strong><span>Término em ${fmtDate(end)}${ext}. Nenhum distrato ou resilição vinculado.</span>`);
  if(s==='expiring') return box('var(--ad)','var(--ab)','var(--amber)',`<strong>${daysLabel(d)}</strong><span>Término em ${fmtDate(end)}${ext}</span>`);
  if(ext) return box('var(--gd)','var(--gb)','var(--green)',`<strong>Vigente</strong><span>Término em ${fmtDate(end)}${ext}</span>`);
  return '';
}
function openFileDrawer(f){
  const drawer=document.getElementById('drawer');
  drawer.className='drawer open';
  document.getElementById('drawerTitle').textContent='Detalhamento do contrato';

  // Related docs
  const allFiles=allFilesList();
  const related=relatedDocs(f);
  const ids=[...partyIds(f)];
  const fmtId=d=>d.length===14?d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5'):d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
  const idsCaption=ids.length?`<div class="rel-caption">Documentos com o mesmo CNPJ: ${ids.map(fmtId).join(' · ')}</div>`:'';
  const fidHere=fileFolderId(f.id);
  const unread=(DATA.files[fidHere]||[]).filter(x=>x.id!==f.id&&x.hasBlob&&['pending','processing','error'].includes(x.processing));
  const reading=unread.filter(x=>x.processing==='processing').length;
  const toRead=unread.filter(x=>x.processing!=='processing');
  const unreadHtml=unread.length?`<div class="rel-unread">
      ${reading?'<span class="ai-spin"></span>':IC.info}
      <div><strong>${reading?`Lendo ${reading} documento${reading>1?'s':''} desta pasta…`:`${unread.length} documento${unread.length>1?'s':''} desta pasta ainda não ${unread.length>1?'foram lidos':'foi lido'} pela IA`}</strong>
      <span>O vínculo é feito pelo CNPJ, que só é identificado após a leitura.</span></div>
      ${toRead.length?`<button class="btn-save" onclick="readFolderUnread('${fidHere}')">Ler ${toRead.length>1?'agora':'agora'}</button>`:''}
    </div>`:'';
  const relatedHtml=related.length?`
    <div class="cd-section">
      <div class="cd-section-title">Documentos vinculados</div>
      ${idsCaption}
      ${unreadHtml}
      <div class="related-list">
        ${related.map(r=>`<div class="related-item" onclick="selectFile('${r.id}')">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="color:var(--t3);flex-shrink:0"><path d="M4 2h5l3 3v7a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M9 2v3h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          <div class="rel-body">
            <span class="related-item-name" title="${esc(r.name)}">${esc(r.name)}</span>
            <span class="rel-meta">${typeBadge(r.contractType)}${statusBadge(st(r))}${st(r)==='overdue'?`<span class="rel-days">${daysLabel(daysUntil(effEnd(r)))}</span>`:''}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>`:
    `<div class="cd-section">
      <div class="cd-section-title">Documentos vinculados</div>
      ${idsCaption}
      ${unreadHtml}
      <div style="font-size:12px;color:var(--t3);padding:8px 0">${unread.length?'':ids.length?'Nenhum outro documento com o mesmo CNPJ.':'CNPJ não identificado neste documento — leia com a IA ou preencha nas partes envolvidas.'}</div>
    </div>`;

  const confPct=Math.round((f.confidence||0)*100);
  const dis=f.processing==='processing'?'disabled':'';
  const confHtml=f.processing==='processing'?`
    <div class="ai-box busy"><span class="ai-spin"></span><div><strong>Lendo o contrato com IA…</strong><span>Os campos abaixo serão preenchidos automaticamente.</span></div></div>`
  : f.processing==='error'?`
    <div class="ai-box err"><div><strong>A IA não conseguiu ler este documento</strong><span>${esc(f.aiError||'Erro desconhecido')}</span>
      <div class="ai-box-actions"><button class="btn-save" onclick="retryAI('${f.id}')">Tentar novamente</button><button class="btn-ghost" onclick="openAISettings()">Configurar IA</button></div></div></div>`
  : (f.hasBlob&&!f.aiAt)?`
    <div class="ai-box"><div><strong>Este documento ainda não foi lido pela IA</strong><span>Extraia tipo, vigência, valor, pagamento e partes automaticamente.</span>
      <div class="ai-box-actions"><button class="btn-save" onclick="retryAI('${f.id}')">Ler com IA</button></div></div></div>`
  : f.processing!=='processing'?`
    <div class="cd-confidence">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 7l2 2L9.5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="cd-conf-label">${f.aiAt?`Lido pela IA em ${fmtDate(f.aiAt)}`:"Confiança da extração"}</span>
      <div class="cd-conf-bar"><div class="cd-conf-fill" style="width:${confPct}%"></div></div>
      <span class="cd-conf-pct">${confPct}%</span>
      ${f.hasBlob?`<button class="cd-conf-redo" title="Ler novamente com IA" onclick="confirmReprocess('${f.id}')">Reler</button>`:''}
    </div>`:'';
  const historyHtml=contractHistoryHtml(f);
  const objHtml=f.object?`<div class="cd-section"><div class="cd-section-title">Objeto</div><div class="cd-object">${esc(f.object)}</div>${f.aiNotes?`<div class="cd-notes">${esc(f.aiNotes)}</div>`:''}</div>`:'';

  document.getElementById('drawerBody').innerHTML=`
    <div style="padding:20px" class="${dis?'ai-locked':''}">
      <!-- Header -->
      <div class="cd-header">
        <div class="cd-file-name">${esc(f.name)}</div>
        <div class="cd-badges">
          ${typeBadge(f.contractType)}
          ${statusBadge(st(f))}
          ${f.payDay&&f.payDay!=='—'?`<span class="badge badge-outro">${/^\d+$/.test(f.payDay)?"Pagamento dia "+esc(f.payDay):"Pagamento: "+esc(f.payDay)}</span>`:''}
        </div>
        <div class="cd-meta-row">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2"/><path d="M6 4v2.5l1.5 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          Atualizado em ${fmtDate(f.updatedAt||'—')} · Responsável: <strong style="color:var(--t2)">${esc(f.responsible||'—')}</strong>
        </div>
      </div>

      ${confHtml}

      <!-- Prévia do documento -->
      ${f.hasBlob?`
      <div class="doc-preview" title="Passe o mouse e role para ler">
        <div class="doc-pages" id="docPages"><div class="doc-loading"><span class="ai-spin"></span>Carregando prévia…</div></div>
        <div class="pdf-mock-type ${f.contractType==='Principal'?'badge-principal':f.contractType==='Aditivo'?'badge-aditivo':'badge-distrato'}" style="padding:3px 10px;font-size:10.5px;font-weight:600;z-index:2">${f.contractType}</div>
        <button class="doc-open" onclick="openDocument('${f.id}')">Abrir em tela cheia</button>
      </div>`:`
      <div class="pdf-mock">
        <div class="pdf-mock-lines">
          ${Array.from({length:11},(_,i)=>`<div class="pdf-mock-line" style="width:${55+Math.sin(i*1.9)*35}%"></div>`).join('')}
        </div>
        <div class="pdf-mock-type ${f.contractType==='Principal'?'badge-principal':f.contractType==='Aditivo'?'badge-aditivo':'badge-distrato'}" style="padding:3px 10px;font-size:10.5px;font-weight:600">${f.contractType}</div>
        <div class="pdf-mock-label">Arquivo original não disponível</div>
      </div>`}

      ${objHtml}
      <!-- Vigência -->
      <div class="cd-section">
        <div class="cd-section-title">Vigência</div>
        <div class="cd-grid">
          <div class="cd-field">
            <div class="cd-field-label">Data de início</div>
            <input class="cd-field-value editable mono" id="dr_start" placeholder="DD/MM/AAAA" value="${f.startDate&&f.startDate!=='—'?fmtDate(f.startDate):''}">
          </div>
          <div class="cd-field">
            <div class="cd-field-label">Data de término</div>
            <input class="cd-field-value editable mono" id="dr_end" placeholder="Sem término" value="${f.endDate&&f.endDate!=='—'?fmtDate(f.endDate):''}">
          </div>
        </div>
        ${statusNote(f)}
      </div>

      <!-- Valor -->
      <div class="cd-section">
        <div class="cd-section-title">Valor e pagamento</div>
        <div class="cd-grid">
          <div class="cd-field">
            <div class="cd-field-label">Valor mensal</div>
            <input class="cd-field-value editable gold mono" id="dr_value" value="${esc(f.value||'—')}">
          </div>
          <div class="cd-field">
            <div class="cd-field-label">Data de pagamento</div>
            <input class="cd-field-value editable" id="dr_payday" placeholder="Ex.: 15" value="${esc(f.payDay?(/^\d+$/.test(f.payDay)?'Dia '+f.payDay:f.payDay):'—')}">
          </div>
        </div>
        <div class="cd-field-full" style="margin-top:8px">
          <div class="cd-field-label">Forma de pagamento</div>
          <input class="cd-field-value editable" id="dr_payment" value="${esc(f.payment||'—')}" style="width:100%">
        </div>
      </div>

      <!-- Partes -->
      <div class="cd-section">
        <div class="cd-section-title">Partes envolvidas</div>
        ${(f.parties||[]).map((p,i)=>`
          <div class="cd-field-full" style="margin-top:${i>0?'8px':'0'}">
            <div class="cd-field-label">${esc((f.partyRoles||[])[i]||(i===0?'Contratante':i===1?'Contratada':'Parte '+(i+1)))}</div>
            <input class="cd-field-value editable" id="dr_party_${i}" value="${esc(p)}" style="width:100%">
            <input class="cd-field-value editable mono" id="dr_cnpj_${i}" value="${esc((f.cnpj||[])[i]||'—')}" style="width:100%;font-size:10.5px;color:var(--t3);margin-top:4px">
          </div>`).join('')}
      </div>

      <!-- Vinculados -->
      ${historyHtml}
      ${relatedHtml}
    </div>
  `;

  document.getElementById('drawerFooter').innerHTML=`
    <button class="btn-save" onclick="saveDrawer('${f.id}')">Salvar alterações</button>
    <button class="btn-ghost" onclick="openDocument('${f.id}')">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13h8A1.5 1.5 0 0012 11.5V9M7 7l5-5M9 2h3v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Abrir
    </button>
  `;
  if(f.hasBlob) renderPreview(f);
}

// ══════════════════════════════════════════════
//  FOLDER DRAWER (second click)
// ══════════════════════════════════════════════
function openFolderDrawer(fid){
  const folder=findFolder(fid); if(!folder) return;
  const files=getAllDescendantFiles(fid);
  S.drawerMode='folder';
  const drawer=document.getElementById('drawer');
  drawer.className='drawer open folder-mode';
  document.getElementById('drawerTitle').textContent='Resumo do espaço';

  const total=files.reduce((s,f)=>s+parseVal(f.value),0);
  const active=files.filter(f=>st(f)==='active').length;
  const expiring=files.filter(f=>st(f)==='expiring').length;
  const expired=files.filter(f=>st(f)==='expired').length;
  const overdue=files.filter(f=>st(f)==='overdue').length;
  const principals=files.filter(f=>f.contractType==='Principal').length;
  const aditivos=files.filter(f=>f.contractType==='Aditivo').length;
  const distratos=files.filter(f=>f.contractType==='Distrato').length;
  const tot2=principals+aditivos+distratos||1;
  const path=(getFolderPath(fid)||[]).map(n=>n.name).join(' › ');

  const recents=files.filter(f=>f.processing==='done').slice(0,5);

  document.getElementById('drawerBody').innerHTML=`
    <div style="padding:20px">
      <div class="fs-hero">
        <div class="fs-hero-title">${esc(folder.name)}</div>
        <div class="fs-hero-path">${esc(path)}</div>
        <div class="fs-kpis">
          <div class="fs-kpi">
            <div class="fs-kpi-label">Valor mensal</div>
            <div class="fs-kpi-val gold" style="font-size:14px">${total>0?'R$ '+total.toLocaleString('pt-BR',{minimumFractionDigits:2}):'—'}</div>
          </div>
          <div class="fs-kpi">
            <div class="fs-kpi-label">Documentos</div>
            <div class="fs-kpi-val">${files.length}</div>
            <div class="fs-kpi-sub">${active} ativos · ${expiring} vencendo · ${overdue} vencidos · ${expired} encerrados</div>
          </div>
          <div class="fs-kpi">
            <div class="fs-kpi-label">Contratos principais</div>
            <div class="fs-kpi-val">${principals}</div>
            <div class="fs-kpi-sub">${aditivos} aditivos · ${distratos} distratos</div>
          </div>
          <div class="fs-kpi" style="${overdue>0?'background:var(--rd);border-color:var(--rb)':expiring>0?'background:var(--ad);border-color:var(--ab)':''}">
            <div class="fs-kpi-label">Situação jurídica</div>
            <div class="fs-kpi-val" style="font-size:13px;${overdue>0?'color:var(--red)':expiring>0?'color:var(--amber)':''}">${overdue>0?'Contratos vencidos':expiring>0?'Atenção':'Regular'}</div>
            <div class="fs-kpi-sub">${overdue} vencido${overdue!==1?'s':''} · ${expired} encerrado${expired!==1?'s':''}</div>
          </div>
        </div>
        <div style="margin-top:16px;font-size:11.5px;font-weight:500;color:var(--t3)">Composição de documentos</div>
        <div class="fs-bar">
          <div class="fs-bar-seg" style="background:var(--blue);width:${Math.round(principals/tot2*100)}%"></div>
          <div class="fs-bar-seg" style="background:var(--amber);width:${Math.round(aditivos/tot2*100)}%"></div>
          <div class="fs-bar-seg" style="background:var(--red);width:${Math.round(distratos/tot2*100)}%"></div>
        </div>
        <div style="display:flex;gap:12px;margin-top:6px">
          <span style="font-size:10px;color:var(--t3);display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:2px;background:var(--blue);display:inline-block"></span>${principals} Principal</span>
          <span style="font-size:10px;color:var(--t3);display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:2px;background:var(--amber);display:inline-block"></span>${aditivos} Aditivo</span>
          <span style="font-size:10px;color:var(--t3);display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:2px;background:var(--red);display:inline-block"></span>${distratos} Distrato</span>
        </div>
      </div>

      <div class="cd-section-title">Contratos recentes</div>
      <div class="related-list">
        ${recents.map(f=>`<div class="related-item" onclick="selectFile('${f.id}')">
          <span style="width:6px;height:6px;border-radius:50%;flex-shrink:0;background:${st(f)==='active'?'var(--green)':st(f)==='expiring'?'var(--amber)':'var(--t4)'}"></span>
          <span class="related-item-name">${esc(f.name)}</span>
          <span style="font-size:11px;font-family:var(--mono);color:var(--gold2);white-space:nowrap">${f.value==='—'?'':esc(f.value)}</span>
          ${typeBadge(f.contractType)}
        </div>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('drawerFooter').innerHTML=`
    <button class="btn-save" onclick="exportFolderReport('${fid}')">Exportar relatório</button>
    <button class="btn-ghost" onclick="openAlertModal('${fid}')">${DATA.alerts[fid]?`Alerta: ${DATA.alerts[fid]} dias`:'Criar alerta'}</button>
  `;
}

function closeDrawer(){
  document.getElementById('drawer').className='drawer';
  document.querySelectorAll('.ex-row.current,.ex-tile.current').forEach(r=>r.classList.remove('current'));
  S.file=null; S.drawerMode=null;
}

// ══════════════════════════════════════════════
//  SORT
// ══════════════════════════════════════════════
function setSort(s,btn){
  S.sort=s;
  document.querySelectorAll('.ctrl-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderWorkspace();
}

// ══════════════════════════════════════════════
//  ALERT
// ══════════════════════════════════════════════
function dismissAlert(){
  S.bannerDismissed=true;
  const b=document.getElementById('alertBanner');
  if(b){b.style.opacity='0';b.style.transform='translateY(-6px)';b.style.transition='all .2s';setTimeout(()=>b.remove(),200);}
}

// ══════════════════════════════════════════════
//  DRAG & DROP
// ══════════════════════════════════════════════
let dragCnt=0;
const ACCEPT_RE=/\.(pdf|doc|docx)$/i;
function appVisible(){return document.getElementById('appRoot').style.display!=='none';}
function dragHasFiles(e){return e.dataTransfer&&Array.from(e.dataTransfer.types||[]).includes('Files');}
function hideDragOverlay(){dragCnt=0;document.getElementById('dragOverlay').classList.remove('show');}
document.addEventListener('dragenter',e=>{
  if(!dragHasFiles(e)||!appVisible()) return;
  e.preventDefault(); dragCnt++; document.getElementById('dragOverlay').classList.add('show');
});
// impede o navegador de abrir o arquivo quando ele é solto fora da área
document.addEventListener('dragover',e=>{if(dragHasFiles(e)){e.preventDefault(); e.dataTransfer.dropEffect=appVisible()?'copy':'none';}});
document.addEventListener('dragleave',e=>{
  if(!dragHasFiles(e)) return;
  dragCnt--; if(dragCnt<=0) hideDragOverlay();
});
document.addEventListener('drop',e=>{
  if(!dragHasFiles(e)) return;
  e.preventDefault(); hideDragOverlay();
  if(!appVisible()) return;
  collectDropped(e.dataTransfer).then(entries=>startUpload(entries)).catch(()=>showToast('Não foi possível ler os arquivos soltos','var(--red)'));
});

// Lê arquivos e pastas soltos, preservando a hierarquia de pastas
async function collectDropped(dt){
  const items=dt.items?Array.from(dt.items):[];
  const entries=items.map(i=>i.webkitGetAsEntry?i.webkitGetAsEntry():null).filter(Boolean);
  if(!entries.length) return Array.from(dt.files||[]).map(file=>({file,path:[]}));
  const out=[];
  async function walk(entry,path){
    if(entry.isFile){
      const file=await new Promise((res,rej)=>entry.file(res,rej));
      out.push({file,path});
    } else if(entry.isDirectory){
      const reader=entry.createReader(); let batch;
      do{
        batch=await new Promise((res,rej)=>reader.readEntries(res,rej));
        for(const ch of batch) await walk(ch,[...path,entry.name]);
      }while(batch.length);
    }
  }
  for(const en of entries) await walk(en,[]);
  return out;
}

function onDragOver(e){e.preventDefault();}
function onDragLeave(e){e.preventDefault();}
function onDrop(e){e.preventDefault();}

// ══════════════════════════════════════════════
//  UPLOAD
// ══════════════════════════════════════════════
function triggerUpload(){
  const inp=document.createElement('input');
  inp.type='file'; inp.multiple=true; inp.accept='.pdf,.doc,.docx';
  inp.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(inp);
  inp.onchange=()=>{const list=Array.from(inp.files||[]); inp.remove(); if(list.length) startUpload(list.map(file=>({file,path:[]})));};
  inp.addEventListener('cancel',()=>inp.remove());
  inp.click();
}

function ensureSubfolder(parentId,name){
  const siblings=parentId==='root'?DATA.folders:(findFolder(parentId).children=findFolder(parentId).children||[]);
  let f=siblings.find(x=>x.name===name);
  if(!f){f={id:'uf_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),name,children:[]}; siblings.push(f); DATA.files[f.id]=DATA.files[f.id]||[];}
  return f.id;
}

function startUpload(entries){
  const valid=entries.filter(e=>ACCEPT_RE.test(e.file.name));
  const ignored=entries.length-valid.length;
  if(!valid.length){
    showToast(ignored?'Formato não suportado — envie PDF, DOC ou DOCX':'Nenhum arquivo encontrado','var(--red)');
    return;
  }
  const count=valid.length;
  const up=document.getElementById('upProgress');
  const fill=document.getElementById('upFill');
  const pctEl=document.getElementById('upPct');
  const stepEl=document.getElementById('upStep');
  document.getElementById('upLabel').textContent=`Enviando ${count} arquivo${count>1?'s':''}...`;
  fill.style.width='0%'; pctEl.textContent='0%'; up.classList.add('show');
  (async ()=>{
    const base=curFolderId()||'root';
    const iso=todayISO();
    const user=getSession();
    let stored=0; const created=[];
    for(let i=0;i<valid.length;i++){
      const {file,path}=valid[i];
      stepEl.textContent=file.name;
      let target=base;
      for(const dir of path){ target=ensureSubfolder(target,dir); if(target!=='root') S.expandedFolders.add(target); }
      if(!DATA.files[target]) DATA.files[target]=[];
      const id='u'+Date.now()+'_'+i;
      const ext=(file.name.match(/\.(\w+)$/)||[])[1]?.toLowerCase()||'pdf';
      const rec={id,name:file.name.replace(ACCEPT_RE,''),type:ext,contractType:guessTypeFromName(file.name),status:'active',value:'—',period:'—',startDate:'—',endDate:'—',parties:['—','—'],cnpj:['—','—'],payment:'—',processing:'processing',confidence:0,responsible:user?.name||'—',updatedAt:iso,hasBlob:false};
      try{ await blobDB.put(id,file); rec.hasBlob=true; stored++; }catch(e){ rec.processing='error'; rec.aiError='Não foi possível guardar o arquivo neste navegador'; }
      DATA.files[target].push(rec); created.push(rec);
      const pct=Math.round((i+1)/count*100); fill.style.width=pct+'%'; pctEl.textContent=pct+'%';
    }
    saveData(); refreshAll();
    setTimeout(()=>{up.classList.remove('show'); fill.style.width='0%';},400);
    const where=base==='root'?'Todos os arquivos':(findFolder(base)?.name||'');
    let msg=`${count} arquivo${count>1?'s':''} enviado${count>1?'s':''} para ${where} · a IA está lendo os contratos`;
    if(ignored) msg+=` · ${ignored} ignorado${ignored>1?'s':''}`;
    showToast(msg,'var(--blue)');
    created.filter(r=>r.hasBlob).forEach(r=>enqueueAI(r.id));
  })();
}
function simulateUpload(count,files){ if(files) startUpload(files.map(file=>({file,path:[]}))); }
