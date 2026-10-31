/* Autec — Telas de Vencimentos, Relatórios e Busca */
// ══════════════════════════════════════════════
//  TELA: VENCIMENTOS
// ══════════════════════════════════════════════
function renderVencimentos(el){
  const all=allFilesList();
  const withEnd=all.filter(f=>daysUntil(f.endDate)!==null);
  const expiring=all.filter(f=>st(f)==='expiring');
  const upcoming=all.filter(f=>st(f)==='active'&&daysUntil(effEnd(f))!==null);
  const expired=all.filter(f=>st(f)==='expired');
  const overdue=all.filter(f=>st(f)==='overdue');
  const noEnd=all.filter(f=>daysUntil(f.endDate)===null);
  const g=DATA.alerts.__global||DEFAULT_ALERT_DAYS;
  const byDate=(a,b)=>(daysUntil(effEnd(a))??1e9)-(daysUntil(effEnd(b))??1e9);
  el.innerHTML=`
    <div class="kpi-strip fade-in">
      <div class="kpi-card"><div class="kpi-value" style="color:var(--amber)">${expiring.length}</div><div class="kpi-label">Vencendo (janela de alerta)</div></div>
      <div class="kpi-card"><div class="kpi-value">${upcoming.length}</div><div class="kpi-label">Com vencimento futuro</div></div>
      <div class="kpi-card"><div class="kpi-value" style="color:var(--red)">${overdue.length}</div><div class="kpi-label">Vencidos (sem distrato)</div></div>
      <div class="kpi-card"><div class="kpi-value" style="color:var(--t2)">${expired.length}</div><div class="kpi-label">Encerrados (com distrato)</div></div>
    </div>
    <div class="sec-header">
      <div class="sec-title">Vencendo em breve</div>
      <div class="sec-controls venc-setting">Alerta padrão:
        <select class="modal-input" onchange="setGlobalAlert(this.value)">
          ${[7,15,30,60,90,120].map(d=>`<option value="${d}" ${g===d?'selected':''}>${d} dias</option>`).join('')}
        </select>
      </div>
    </div>
    <div id="vencExpiring"></div>
    <div class="sec-header"><div class="sec-title">Próximos vencimentos</div></div>
    <div id="vencUpcoming"></div>
    <div class="sec-header"><div class="sec-title">Vencidos</div></div>
    <div id="vencOverdue"></div>
    <div class="sec-header"><div class="sec-title">Encerrados por distrato</div></div>
    <div id="vencExpired"></div>`;
  renderContractTable(overdue,document.getElementById('vencOverdue'),{sortFn:(a,b)=>byDate(b,a),emptyTitle:'Nenhum contrato vencido',emptySub:'Todos os contratos com prazo vencido têm distrato registrado.'});
  renderContractTable(expiring,document.getElementById('vencExpiring'),{sortFn:byDate,emptyTitle:'Nenhum contrato vencendo',emptySub:`Nenhum contrato vence nos próximos ${g} dias (ou na janela de alerta do espaço).`});
  renderContractTable(upcoming,document.getElementById('vencUpcoming'),{sortFn:byDate,emptyTitle:'Nada por aqui',emptySub:'Nenhum contrato com vencimento futuro fora da janela de alerta.'});
  renderContractTable(expired,document.getElementById('vencExpired'),{sortFn:(a,b)=>byDate(b,a),emptyTitle:'Nenhum contrato encerrado',emptySub:'Contratos só aparecem aqui quando há um distrato ou resilição vinculado.'});
}

// ══════════════════════════════════════════════
//  TELA: RELATÓRIOS
// ══════════════════════════════════════════════
function renderRelatorios(el){
  if(!S.rep||!('n1' in S.rep)) S.rep={n1:'',n2:'',n3:'',by:0};
  const R_=S.rep;
  // ---------- base: 1 contrato = 1 documento principal ----------
  const all=allFilesList();
  const contracts=all.filter(f=>f.contractType==='Principal'||(f.contractType==='Aditivo'&&!(f.parentId&&findFile(f.parentId))));
  const effValue=f=>{
    const docs=[f,...childrenOf(f.id).filter(x=>x.contractType==='Aditivo')].filter(x=>parseVal(x.value)>0)
      .sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate)));
    return docs.length?parseVal(docs[docs.length-1].value):0;
  };
  const grp=s=>s==='active'||s==='expiring'?'ativo':s==='overdue'?'vencido':s==='expired'?'encerrado':'naolido';
  const LV=REP_LEVELS;
  const lvName=(f,l)=>repLevelName(f,l);
  const match=(f,upTo)=>[1,2,3].slice(0,upTo).every(l=>!R_['n'+l]||lvName(f,l)===R_['n'+l]);
  const opts=l=>[...new Set(contracts.filter(f=>match(f,l-1)).map(f=>lvName(f,l)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
  [1,2,3].forEach(l=>{ if(R_['n'+l]&&!opts(l).includes(R_['n'+l])){ for(let k=l;k<=3;k++) R_['n'+k]=''; } });
  const deepest=R_.n3?3:R_.n2?2:R_.n1?1:0;
  const byLv=R_.by||Math.min(3,deepest+1);
  const byName=LV[byLv-1].toLowerCase();
  const rows=contracts.filter(f=>match(f,3)).map(f=>{
    const nm=lvName(f,byLv);
    const forn=lvName(f,3)||((f.parties||[])[1]&&f.parties[1]!=='—'?f.parties[1]:'')||f.name;
    return {f,s:st(f),g:grp(st(f)),v:effValue(f),u:{id:nm||'',name:nm||('Sem '+byName)},forn,end:effEnd(f)};
  });
  const by=g=>rows.filter(r=>r.g===g);
  const sumV=a=>a.reduce((s,r)=>s+r.v,0);
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const ativos=by('ativo'), vencidos=by('vencido'), encerrados=by('encerrado'), naolidos=by('naolido');
  const vencendo=rows.filter(r=>r.s==='expiring');
  const total=rows.length, lidos=total-naolidos.length;
  const regular=pct(ativos.length+encerrados.length,lidos);
  const COL={ativo:'#1D7A4D',vencido:'#C0352B',encerrado:'#8A94A3',naolido:'#C9D0D8'};
  const LBL={ativo:'Ativos',vencido:'Vencidos',encerrado:'Encerrados',naolido:'Não lidos'};
  const unitName=[R_.n1,R_.n2,R_.n3].filter(Boolean).join(' › ')||'Todas as unidades';
  const nowTxt=new Date().toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).replace('.','');

  // ---------- agrupamento ----------
  const unitMap=new Map();
  rows.forEach(r=>{ if(!unitMap.has(r.u.id)) unitMap.set(r.u.id,{u:r.u,rows:[]}); unitMap.get(r.u.id).rows.push(r); });
  const units=[...unitMap.values()].map(x=>{
    const c=g=>x.rows.filter(r=>r.g===g);
    const lid=x.rows.length-c('naolido').length;
    return {...x,ativo:c('ativo').length,vencendo:x.rows.filter(r=>r.s==='expiring').length,vencido:c('vencido').length,encerrado:c('encerrado').length,naolido:c('naolido').length,
      valor:sumV(c('ativo')),valorVenc:sumV(c('vencido')),reg:lid?pct(c('ativo').length+c('encerrado').length,lid):null};
  }).sort((a,b)=>b.rows.length-a.rows.length||a.u.name.localeCompare(b.u.name,'pt-BR'));
  S._repKeys=units.map(x=>x.u.id);

  // ---------- gráficos ----------
  const tone=p=>p===null?'#8E9CB2':p>=80?'#3DBB7F':p>=50?'#E8A33A':'#F06B5F';
  // 1) medidor de regularidade
  const gauge=`<svg class="rx-gauge" viewBox="0 0 200 116" aria-hidden="true">
      <defs><linearGradient id="gGrad" x1="0" x2="1"><stop offset="0" stop-color="#F06B5F"/><stop offset=".5" stop-color="#E8A33A"/><stop offset="1" stop-color="#3DBB7F"/></linearGradient></defs>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="14" stroke-linecap="round"/>
      ${[0,25,50,75,100].map(t=>{const a=Math.PI*(1-t/100);return `<line x1="${100+92*Math.cos(a)}" y1="${100-92*Math.sin(a)}" x2="${100+98*Math.cos(a)}" y2="${100-98*Math.sin(a)}" stroke="rgba(255,255,255,.25)" stroke-width="1.5"/>`;}).join('')}
      <path class="rx-gauge-val" d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gGrad)" stroke-width="14" stroke-linecap="round" pathLength="100" style="--p:${lidos?regular:0}"/>
      <text x="100" y="92" text-anchor="middle" class="rx-gauge-svgn" fill="${tone(lidos?regular:null)}">${lidos?regular+'%':'—'}</text>
    </svg>`;
  // 2) rosca de composição
  let acc=0;
  const segs=['ativo','vencido','encerrado','naolido'].map(g=>({g,n:by(g).length})).filter(x=>x.n);
  const donut=`<svg class="rx-donut" viewBox="0 0 160 160" aria-hidden="true">
      <circle cx="80" cy="80" r="58" fill="none" stroke="var(--s4)" stroke-width="18"/>
      ${segs.map(x=>{const len=x.n/total*100; const gap=segs.length>1?1.2:0; const el=`<circle class="rx-seg" cx="80" cy="80" r="58" fill="none" stroke="${COL[x.g]}" stroke-width="18" pathLength="100" stroke-dasharray="${Math.max(len-gap,0.1)} ${100-Math.max(len-gap,0.1)}" stroke-dashoffset="${-acc}" transform="rotate(-90 80 80)"><title>${LBL[x.g]}: ${x.n}</title></circle>`; acc+=len; return el;}).join('')}
      <text x="80" y="78" text-anchor="middle" class="rx-donut-n">${total}</text>
      <text x="80" y="98" text-anchor="middle" class="rx-donut-l">contratos</text>
    </svg>`;
  // 3) linha do tempo: vencidos + próximos 12 meses (barras = quantidade, linha = valor mensal)
  const now=new Date(); const B=[{lbl:'Vencidos',n:vencidos.length,v:sumV(vencidos),late:true}];
  for(let i=0;i<12;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1); B.push({y:d.getFullYear(),m:d.getMonth(),n:0,v:0,lbl:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')+'/'+String(d.getFullYear()).slice(2)});}
  ativos.forEach(r=>{ if(!r.end||r.end==='—') return; const [y,m]=r.end.split('-').map(Number); const b=B.find(x=>x.y===y&&x.m===m-1); if(b){b.n++; b.v+=r.v;} });
  let cum=0; B.forEach((b,i)=>{ if(i===0){b.c=null;return;} cum+=b.v; b.c=cum; });
  const W=680,H=230,pl=34,pr=16,pt=18,pb=34, cw=(W-pl-pr)/B.length;
  const maxN=Math.max(1,...B.map(b=>b.n)), maxV=cum;
  const yN=n=>pt+(H-pt-pb)*(1-n/maxN), yV=v=>pt+(H-pt-pb)*(1-v/(maxV||1));
  const ticks=[...new Set([0,Math.ceil(maxN/2),maxN])];
  const timeline=`<svg class="rx-time" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="tGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2459A8" stop-opacity=".25"/><stop offset="1" stop-color="#2459A8" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map(t=>`<line x1="${pl}" x2="${W-pr}" y1="${yN(t)}" y2="${yN(t)}" class="rx-grid"/><text x="${pl-8}" y="${yN(t)+4}" text-anchor="end" class="rx-ax">${t}</text>`).join('')}
      <line x1="${pl+cw}" x2="${pl+cw}" y1="${pt-6}" y2="${H-pb+4}" class="rx-split"/>
      <text x="${pl+cw+6}" y="${pt-4}" class="rx-ax rx-now">hoje</text>
      ${B.map((b,i)=>{const x=pl+i*cw+cw*.2, w=cw*.6, y=yN(b.n), h=H-pb-y; return `<g class="rx-col"><title>${b.lbl}: ${b.n} contrato${b.n!==1?'s':''}${b.v?' · '+brl(b.v)+'/mês':''}</title>
          <rect x="${pl+i*cw}" y="${pt}" width="${cw}" height="${H-pt-pb}" class="rx-hit"/>
          <rect class="rx-bar" x="${x}" y="${b.n?y:H-pb-2}" width="${w}" height="${b.n?h:2}" rx="3" fill="${b.late?'#C0352B':b.n?'#D9982E':'var(--s5)'}" style="--i:${i}"/>
          ${b.n?`<text x="${x+w/2}" y="${y-6}" text-anchor="middle" class="rx-val">${b.n}</text>`:''}
          <text x="${pl+i*cw+cw/2}" y="${H-12}" text-anchor="middle" class="rx-ax ${b.late?'rx-late':''}">${b.lbl}</text></g>`;}).join('')}
      ${maxV?(()=>{const P=B.slice(1).map((b,k)=>[pl+(k+1)*cw+cw/2,yV(b.c)]); const step=P.map((p,k)=>k?`H${p[0]} V${p[1]}`:`M${p[0]},${p[1]}`).join(' ');
        return `<path d="${step} V${H-pb} H${P[0][0]}Z" fill="url(#tGrad)" class="rx-area"/>
        <path d="${step}" fill="none" stroke="#2459A8" stroke-width="2" class="rx-line" pathLength="1"/>
        ${B.slice(1).map((b,k)=>b.v?`<circle cx="${P[k][0]}" cy="${P[k][1]}" r="3.5" fill="#fff" stroke="#2459A8" stroke-width="2"/>`:'').join('')}
        <text x="${W-pr}" y="${yV(maxV)-8}" text-anchor="end" class="rx-ax rx-cum">${brlShort(maxV)}/mês acumulado</text>`;})():''}
    </svg>`;
  // 4) exposição financeira
  const expo=[['Valor mensal ativo',sumV(ativos),'#1D7A4D'],['Valor mensal vencido',sumV(vencidos),'#C0352B'],['Valor mensal encerrado',sumV(encerrados),'#8A94A3']];
  const maxE=Math.max(1,...expo.map(e=>e[1]));
  // 5) ranking de risco por fornecedor
  const fm=new Map(); vencidos.forEach(r=>{const k=r.forn; const o=fm.get(k)||{n:0,v:0}; o.n++; o.v+=r.v; fm.set(k,o);});
  const rank=[...fm.entries()].map(([k,o])=>({k,...o})).sort((a,b)=>b.v-a.v||b.n-a.n).slice(0,6);
  const maxR=Math.max(1,...rank.map(r=>r.v||r.n));

  const sel=(l,allTxt)=>`<label class="rx-f"><span>${LV[l-1]}</span><select onchange="repSet(${l},this.value)">
      <option value="">${allTxt}</option>${opts(l).map(o=>`<option value="${esc(o)}" ${R_['n'+l]===o?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
  const kpi=(lbl,n,sub,col,act)=>`<button class="rx-kpi" ${act?`onclick="${act}"`:''}><span class="rx-kpi-l"><i style="background:${col}"></i>${lbl}</span><span class="rx-kpi-n" data-count="${n}">${n}</span><span class="rx-kpi-s">${sub}</span></button>`;
  const listRow=(r,tag,cls)=>`<button class="rx-li" onclick="selectFile('${r.f.id}')"><span class="rx-li-main"><span class="rx-li-name">${esc(r.f.name)}</span><span class="rx-li-sub">${esc(r.u.name)} · ${esc(r.forn)}</span></span><span class="rx-li-val">${r.v?brl(r.v):'—'}</span><span class="rx-li-tag ${cls}">${tag}</span></button>`;
  const overdueList=[...vencidos].sort((a,b)=>daysUntil(a.end)-daysUntil(b.end));
  const upcoming=ativos.filter(r=>{const d=daysUntil(r.end); return d!==null&&d>=0&&d<=90;}).sort((a,b)=>daysUntil(a.end)-daysUntil(b.end));

  el.innerHTML=`
  <section class="rx-hero">
    <div class="rx-top">
      <div><h1 class="rx-title">Relatórios</h1><p class="rx-sub">Inteligência da carteira · <b>${esc(unitName)}</b></p></div>
      <div class="rx-live"><span class="rx-pulse"></span>Dados atualizados · ${nowTxt}</div>
    </div>
    <div class="rx-filters">
      ${sel(1,'Todas as unidades')}${sel(2,'Todas as regiões')}${sel(3,'Todos os fornecedores')}
      <label class="rx-f"><span>Agrupar por</span><select onchange="S.rep.by=+this.value;renderWorkspace()">${LV.map((n,i)=>`<option value="${i+1}" ${byLv===i+1?'selected':''}>${n}</option>`).join('')}</select></label>
      ${deepest?`<button class="rx-ghost" onclick="S.rep={n1:'',n2:'',n3:'',by:0};renderWorkspace()">Limpar filtros</button>`:''}
      <span class="ex-spacer"></span>
      <button class="rx-export" onclick="exportCSV(repFiles(),'autec-relatorio-'+todayISO()+'.csv')"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2.5V11M4.5 7.5L8 11l3.5-3.5M2.5 13.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Exportar CSV</button>
    </div>
    <div class="rx-kpis">
      <div class="rx-gauge-card">
        ${gauge}
        <div class="rx-gauge-txt"><span class="rx-gauge-l">Índice de regularidade</span><span class="rx-gauge-tag" style="color:${tone(lidos?regular:null)}">${!lidos?'Sem dados':regular>=80?'Carteira saudável':regular>=50?'Atenção':'Crítico'}</span><span class="rx-kpi-s">${lidos?'Contratos em dia ou formalmente encerrados':'Nenhum contrato lido'}</span></div>
      </div>
      ${kpi('Contratos',total,`${naolidos.length?naolidos.length+' não lidos':'Todos lidos pela IA'}`,'#9DBDEA')}
      ${kpi('Ativos',ativos.length,`${sumV(ativos)?brlShort(sumV(ativos))+'/mês':'Valor não informado'}${vencendo.length?' · '+vencendo.length+' vencendo':''}`,'#3DBB7F',"goVencimentos()")}
      ${kpi('Vencidos',vencidos.length,`${sumV(vencidos)?brlShort(sumV(vencidos))+'/mês em risco':'Sem distrato registrado'}`,'#F06B5F',"document.getElementById('rxOverdue')?.scrollIntoView({behavior:'smooth'})")}
      ${kpi('Encerrados',encerrados.length,'Com distrato vinculado','#A9B3C1')}
    </div>
  </section>

  <div class="rx-grid rx-g12">
    <section class="rx-card">
      <header class="rx-ch"><div><h2>Composição</h2><p>Situação dos contratos</p></div></header>
      <div class="rx-donut-wrap">${total?donut:'<div class="rx-empty">Nenhum contrato no filtro</div>'}
        <ul class="rx-legend">${['ativo','vencido','encerrado','naolido'].map(g=>`<li><i style="background:${COL[g]}"></i><span>${LBL[g]}</span><b>${by(g).length}</b><em>${pct(by(g).length,total)}%</em></li>`).join('')}</ul>
      </div>
    </section>
    <section class="rx-card">
      <header class="rx-ch"><div><h2>Linha do tempo de vencimentos</h2><p>Barras: contratos por mês de término · linha: valor mensal acumulado que vence</p></div>
        <div class="rx-keys"><span><i style="background:#C0352B"></i>Vencidos</span><span><i style="background:#D9982E"></i>A vencer</span>${maxV?'<span><i class="ln"></i>Valor acumulado</span>':''}</div></header>
      <div class="rx-time-wrap">${timeline}</div>
    </section>
  </div>

  <section class="rx-card">
    <header class="rx-ch"><div><h2>Desempenho por ${byName}</h2><p>${byLv<3?'Clique em uma linha para detalhar':'Clique em uma linha para filtrar este fornecedor'}</p></div></header>
    <div class="rx-table-wrap"><table class="rx-table">
      <thead><tr><th>${LV[byLv-1]}</th><th class="n">Contratos</th><th>Situação</th><th class="n">Ativos</th><th class="n">Vencidos</th><th class="n">Encerrados</th><th class="n">Valor ativo/mês</th><th class="n">Valor vencido/mês</th><th class="n">Regularidade</th></tr></thead>
      <tbody>${units.map((x,i)=>{const t=x.rows.length||1; return `<tr onclick="${x.u.id?`repDrill(${byLv},S._repKeys[${i}])`:''}" style="--i:${i}">
        <td><span class="rx-unit">${FOLDER_SVG(16)}${esc(x.u.name)}</span></td>
        <td class="n b">${x.rows.length}</td>
        <td><span class="rx-stack">${['ativo','vencido','encerrado','naolido'].map(g=>x[g]?`<span style="width:${x[g]/t*100}%;background:${COL[g]}"></span>`:'').join('')}</span></td>
        <td class="n">${x.ativo}${x.vencendo?`<small>${x.vencendo} venc.</small>`:''}</td>
        <td class="n"><span class="rx-heat" style="--a:${x.vencido/t}">${x.vencido}</span></td>
        <td class="n" style="color:var(--t3)">${x.encerrado}</td>
        <td class="n b">${brl(x.valor)}</td>
        <td class="n" style="color:${x.valorVenc?'#C0352B':'var(--t4)'}">${brl(x.valorVenc)}</td>
        <td class="n"><span class="rx-reg"><span class="rx-reg-bar"><span style="width:${x.reg??0}%;background:${tone(x.reg)}"></span></span><b style="color:${x.reg===null?'var(--t4)':tone(x.reg)}">${x.reg===null?'—':x.reg+'%'}</b></span></td>
      </tr>`;}).join('')||'<tr><td colspan="9" class="rx-empty">Nenhum contrato</td></tr>'}</tbody>
      ${units.length>1?`<tfoot><tr><td>Total</td><td class="n">${total}</td><td></td><td class="n">${ativos.length}</td><td class="n">${vencidos.length}</td><td class="n">${encerrados.length}</td><td class="n">${brl(sumV(ativos))}</td><td class="n">${brl(sumV(vencidos))}</td><td class="n">${lidos?regular+'%':'—'}</td></tr></tfoot>`:''}
    </table></div>
  </section>

  <div class="rx-grid rx-g11">
    <section class="rx-card">
      <header class="rx-ch"><div><h2>Exposição financeira</h2><p>Soma dos valores mensais por situação</p></div></header>
      <div class="rx-expo">${expo.map(([l,v,c],i)=>`<div class="rx-expo-row"><span class="rx-expo-l">${l}</span><span class="rx-expo-t"><span style="width:${v/maxE*100}%;background:${c};--i:${i}"></span></span><b>${v?brl(v):'—'}</b></div>`).join('')}
        <div class="rx-expo-note">${sumV(vencidos)?`Projeção anual em risco: <b>${brl(sumV(vencidos)*12)}</b> em contratos vencidos sem distrato.`:'Nenhum valor em risco por contrato vencido.'}</div></div>
    </section>
    <section class="rx-card">
      <header class="rx-ch"><div><h2>Ranking de risco por fornecedor</h2><p>Fornecedores com contratos vencidos, por valor mensal</p></div></header>
      <div class="rx-rank">${rank.length?rank.map((r,i)=>`<div class="rx-rank-row"><span class="rx-rank-i">${i+1}</span><span class="rx-rank-n" title="${esc(r.k)}">${esc(r.k)}</span><span class="rx-rank-t"><span style="width:${(r.v||r.n)/maxR*100}%;--i:${i}"></span></span><span class="rx-rank-v">${r.v?brlShort(r.v):r.n+' contr.'}</span></div>`).join(''):'<div class="rx-empty">Nenhum fornecedor com contrato vencido.</div>'}</div>
    </section>
  </div>

  <div class="rx-grid rx-g11">
    <section class="rx-card" id="rxOverdue">
      <header class="rx-ch"><div><h2>Contratos vencidos</h2><p>Prazo encerrado sem distrato</p></div><span class="rx-count red">${vencidos.length}</span></header>
      <div class="rx-list">${overdueList.slice(0,8).map(r=>listRow(r,daysLabel(daysUntil(r.end)),'red')).join('')||'<div class="rx-empty">Nenhum contrato vencido.</div>'}</div>
      ${overdueList.length>8?`<button class="rx-more" onclick="goVencimentos()">Ver todos os ${overdueList.length} em Vencimentos</button>`:''}
    </section>
    <section class="rx-card">
      <header class="rx-ch"><div><h2>Próximos vencimentos</h2><p>Ativos que terminam em até 90 dias</p></div><span class="rx-count amber">${upcoming.length}</span></header>
      <div class="rx-list">${upcoming.slice(0,8).map(r=>listRow(r,daysLabel(daysUntil(r.end)),'amber')).join('')||'<div class="rx-empty">Nenhum vencimento nos próximos 90 dias.</div>'}</div>
    </section>
  </div>`;
  rxCountUp(el);
}
// números contam até o valor ao abrir a tela
function rxCountUp(root){
  if(!motionOK()) return;
  root.querySelectorAll('[data-count]').forEach(n=>{
    const to=+n.dataset.count; if(!to) return;
    const t0=performance.now(), d=700;
    const tick=t=>{const k=Math.min(1,(t-t0)/d); n.textContent=Math.round(to*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(tick);};
    n.textContent='0'; requestAnimationFrame(tick);
  });
}

// documentos do recorte atual (para exportar)
const REP_LEVELS=['Unidade','Região','Fornecedor'];
function repLevelName(f,l){
  const fid=fileFolderId(f.id); if(!fid||fid==='root') return '';
  const p=getFolderPath(fid)||[]; return p[l-1]?.name||'';
}
function repSet(l,v){
  S.rep['n'+l]=v; for(let k=l+1;k<=3;k++) S.rep['n'+k]='';
  S.rep.by=0; renderWorkspace();
}
function repDrill(l,name){
  if(S.rep['n'+l]===name) return;
  repSet(l,name);
}
function repFiles(){
  const r=S.rep||{};
  return allFilesList().filter(f=>[1,2,3].every(l=>!r['n'+l]||repLevelName(f,l)===r['n'+l]));
}
function repFocus(g){
  if(g==='vencido'){document.getElementById('rpOverdue')?.scrollIntoView({behavior:'smooth',block:'start'}); return;}
  goVencimentos();
}

// ══════════════════════════════════════════════
//  TELA: RESULTADOS DA BUSCA
// ══════════════════════════════════════════════
function renderSearch(el){
  const t=S.search;
  const hits=allFilesList().filter(f=>[f.name,f.contractType,f.value,f.responsible,f.payment,...(f.parties||[]),...(f.cnpj||[])].some(x=>String(x||'').toLowerCase().includes(t)));
  el.innerHTML=`<div class="sec-header">
      <div class="sec-title">${hits.length} resultado${hits.length!==1?'s':''} para “${esc(t)}”</div>
      <div class="sec-controls">${sortControls()}</div>
    </div>
    <div id="contractTableContainer"></div>`;
  renderContractTable(hits,document.getElementById('contractTableContainer'),{emptyTitle:'Nenhum contrato encontrado',emptySub:'Tente buscar por nome, parte, CNPJ ou responsável.'});
}

// ══════════════════════════════════════════════
//  NEW FOLDER MODAL
// ══════════════════════════════════════════════
function openNewFolderModal(){
  const ex=document.getElementById('lxModal'); if(ex) ex.remove();
  const ov=document.createElement('div');
  ov.id='lxModal'; ov.className='modal-overlay';
  const cf=curFolderId();
  const loc=cf&&cf!=='root'?findFolder(cf).name:'Todos os arquivos';
  ov.innerHTML=`<div class="modal">
    <div class="modal-title">Nova pasta</div>
    <div class="modal-sub">Será criada em: <strong style="color:var(--t2)">${esc(loc)}</strong></div>
    <div class="modal-label">Nome da pasta</div>
    <input class="modal-input" id="lxFolderName" placeholder="Ex: Contratos 2026" autofocus
      onkeydown="if(event.key==='Enter')doCreateFolder();if(event.key==='Escape')closeModal()">
    <div class="modal-actions">
      <button class="btn-save" style="flex:1;padding:9px" onclick="doCreateFolder()">Criar pasta</button>
      <button class="btn-ghost" style="padding:9px 16px" onclick="closeModal()">Cancelar</button>
    </div>
  </div>`;
  ov.addEventListener('click',e=>{if(e.target===ov) closeModal();});
  document.body.appendChild(ov);
  setTimeout(()=>document.getElementById('lxFolderName')?.focus(),50);
}
function closeModal(){const m=document.getElementById('lxModal'); if(m) m.remove();}
function doCreateFolder(){
  const name=(document.getElementById('lxFolderName')?.value||'').trim();
  if(!name){document.getElementById('lxFolderName')?.focus(); return;}
  const nid='uf_'+Date.now();
  const nf={id:nid,name,children:[],createdAt:todayISO()};
  DATA.files[nid]=[];
  const cf=curFolderId();
  const p=cf&&cf!=='root'?findFolder(cf):null;
  const siblings=p?(p.children=p.children||[]):DATA.folders;
  if(siblings.some(x=>x.name.toLowerCase()===name.toLowerCase())){showToast('Já existe uma pasta com esse nome aqui','var(--red)'); document.getElementById('lxFolderName')?.select(); return;}
  siblings.push(nf); if(p) S.expandedFolders.add(p.id);
  saveData(); closeModal(); refreshAll();
  showToast(`Pasta "${name}" criada`,'var(--green)');
}
