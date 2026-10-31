/* Autec — Inicialização */
// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
function init(){
  loadData();
  relinkAll();
  if(getAICfg().key||API.ai) setTimeout(refineObjects,2000);
  allFilesList().forEach(f=>{ if(f.processing==='processing'){ if(f.hasBlob) setTimeout(()=>enqueueAI(f.id),800); else f.processing='done'; } });
  S.view='folder'; S.folder=findFolder('f1a1')?'f1a1':null;
  if(!S.folder) S.view='dashboard';
  S.expandedFolders=new Set(['f1','f1a','f1a1']);
  refreshAll();
  initAuth();
}
// Detecta o back-end antes de iniciar (modo servidor ou modo local)
API.detect().then(init);
