// Armazenamento seguro: se o navegador bloquear o localStorage/sessionStorage
// (modo privado, iframe com restrições, cota cheia), usa memória para não quebrar o sistema.
(function(){
  function mem(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v));},removeItem:k=>{m.delete(k);},clear:()=>m.clear(),key:i=>[...m.keys()][i]??null,get length(){return m.size;}};}
  function safe(name){
    let real=null; try{const s=window[name]; const t='__autec_t'; s.setItem(t,'1'); s.removeItem(t); real=s;}catch(e){}
    const fb=mem();
    return{
      getItem(k){try{return real?real.getItem(k):fb.getItem(k);}catch(e){return fb.getItem(k);}},
      setItem(k,v){try{if(real){real.setItem(k,v);return;}}catch(e){console.error('Armazenamento local cheio ou bloqueado:',e&&e.name);} fb.setItem(k,v);},
      removeItem(k){try{real&&real.removeItem(k);}catch(e){} fb.removeItem(k);}
    };
  }
  window.LS=safe('localStorage'); window.SS=safe('sessionStorage');
})();
