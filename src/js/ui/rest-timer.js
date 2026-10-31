// === REST TIMER ===
function openT(sec){S.timer=true;S.tSec=sec;S.tTotal=sec;S.tRun=false;clearInterval(S.tInt);R();}
function closeT(){S.timer=null;S.tRun=false;clearInterval(S.tInt);R();}
function togT(){if(S.tRun){S.tRun=false;clearInterval(S.tInt);}else{S.tRun=true;S.tInt=setInterval(function(){S.tSec--;if(S.tSec<=0){S.tSec=0;S.tRun=false;clearInterval(S.tInt);}R();},1000);}R();}
function rstT(){S.tSec=S.tTotal;S.tRun=false;clearInterval(S.tInt);R();}

function rTimer(){var ov=h('div',{className:'timer-ov',onClick:function(e){if(e.target===ov)closeT();}});
var box=h('div',{className:'timer-box'});
box.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}},h('h3',{style:{fontSize:'15px',fontWeight:700,margin:0}},'Rest Timer'),h('button',{style:{background:'none',border:'none',cursor:'pointer',padding:'4px'},innerHTML:svg('x',16,'var(--text2)'),onClick:closeT})));
var pct=S.tTotal>0?((S.tTotal-S.tSec)/S.tTotal*100):0;var circ=2*Math.PI*50;var off=circ-(pct/100)*circ;
var cw=h('div',{style:{position:'relative',width:'110px',height:'110px',margin:'0 auto 16px'}});
cw.innerHTML='<svg width="110" height="110" viewBox="0 0 110 110" style="transform:rotate(-90deg)"><circle cx="55" cy="55" r="50" fill="none" stroke="var(--border)" stroke-width="7"/><circle cx="55" cy="55" r="50" fill="none" stroke="'+(S.tSec===0?'var(--success)':'var(--accent)')+'" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+off+'" style="transition:stroke-dashoffset 1s linear"/></svg>';
var tt=h('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}});
tt.appendChild(h('span',{style:{fontSize:'28px',fontWeight:800,color:S.tSec===0?'var(--success)':'var(--text)',fontVariantNumeric:'tabular-nums'}},fmtT(S.tSec)));cw.appendChild(tt);box.appendChild(cw);
if(S.tSec===0)box.appendChild(h('p',{style:{color:'var(--success)',fontWeight:700,fontSize:'13px',marginBottom:'10px'}},"Time's up! Next set!"));
var btns=h('div',{style:{display:'flex',gap:'8px',justifyContent:'center'}});
btns.appendChild(h('button',{className:'btn btn-primary',innerHTML:S.tRun?svg('pause',14,'#fff')+' Pause':(S.tSec===0?svg('check',14,'#fff')+' Done':svg('play',14,'#fff')+' Start'),onClick:S.tSec===0?closeT:togT}));
btns.appendChild(h('button',{className:'btn btn-secondary',innerHTML:svg('reset',12)+' Reset',onClick:rstT}));box.appendChild(btns);
var presets=h('div',{style:{display:'flex',gap:'5px',justifyContent:'center',marginTop:'12px'}});
[30,60,90,120,180].forEach(function(s){presets.appendChild(h('button',{className:'pill',style:{padding:'4px 8px',fontSize:'10px',borderColor:S.tTotal===s?'var(--accent)':'var(--border)',background:S.tTotal===s?'var(--accent-light)':'transparent',color:S.tTotal===s?'var(--accent)':'var(--text2)'},onClick:function(){S.tSec=s;S.tTotal=s;S.tRun=false;clearInterval(S.tInt);R();}},s<60?s+'s':(s/60)+'m'));});box.appendChild(presets);
ov.appendChild(box);return ov;}
