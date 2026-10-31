// === TRACKER ===
function loadCL(){var ap=gAP();if(!ap)return;var key=lk(ap.id,S.week,S.day);
// If autosaved curLog matches this workout, keep it; otherwise load from completed logs
if(S._curLogKey===key&&Object.keys(S.curLog).length>0){/* already have autosaved data */}
else{S.curLog=JSON.parse(JSON.stringify(S.logs[key]||{}));}
S._curLogKey=key;
// Restore session timer from persisted timestamp
try{var _st=localStorage.getItem('rre2_sesstimer');if(_st){var _stp=JSON.parse(_st);if(_stp&&_stp.key===key&&_stp.startAt){S._sessStartAt=_stp.startAt;S.sessRun=!!_stp.running;S.sessTimer=Math.floor((Date.now()-_stp.startAt)/1000);return;}}
}catch(e){}
S.sessTimer=0;S.sessRun=false;S._sessStartAt=null;clearInterval(S.sessInt);}

function rTrack(){console.log('[RRE] rTrack called, enrolled:',S.enrolled.length,'active:',S.active);var el=h('div',{className:'page active'});var ap=gAP(),pd=ap?gPD(ap.id):null;
if(!ap||!pd){el.appendChild(h('p',{style:{textAlign:'center',padding:'40px',color:'var(--text2)'}},'Select a program first.'));return el;}
var adaptedData=getAdaptedProgram(ap.id,ap.days)||pd.data;var wk=adaptedData[S.week];if(!wk||!wk.days){el.appendChild(h('p',null,'No data for week '+S.week));return el;}
var pills=h('div',{className:'pill-row',style:{marginBottom:'8px'}});for(var dn=1;dn<=ap.days;dn++){(function(dd){var d=wk.days?wk.days[dd]:null;if(!d)return;pills.appendChild(h('button',{className:'pill'+(S.day===dd?' active':''),onClick:function(){S.day=dd;loadCL();R();}},d.isRest?'Rest':'D'+dd));})(dn);}el.appendChild(pills);
var dy=wk.days[S.day];if(!dy){el.appendChild(h('p',{style:{color:'var(--text2)',textAlign:'center',padding:'20px'}},'No data for this day.'));return el;}
// Apply S&C modular elements
if(ap.scElements&&ap.id.indexOf('sc_')===0&&dy.ex){dy=Object.assign({},dy);dy.ex=applySCElements(dy.ex,ap.scElements);}
// Show banner if this day was replaced by custom workout
var curLogKey=lk(ap.id,S.week,S.day);
var isCustomReplaced=S.logs[curLogKey]&&S.logs[curLogKey].custom;
if(isCustomReplaced){
  var cl=S.logs[curLogKey];
  el.appendChild(h('div',{style:{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'12px',padding:'14px',marginBottom:'10px'}},
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
      h('div',null,
        h('p',{style:{fontWeight:700,fontSize:'13px',color:'#10b981',margin:0}},'\u2705 Completed with: '+(cl.customName||'Outside Workout')),
        h('p',{style:{fontSize:'10px',color:'var(--text2)',margin:'3px 0 0'}},cl.customType||'Custom')
      ),
      h('button',{className:'btn btn-sm',style:{fontSize:'10px'},onClick:function(){
        delete S.logs[curLogKey];S.curLog={};sv();toast('Cleared \u2014 programmed workout restored');R();
      }},'Undo')
    ),
    h('p',{style:{fontSize:'10px',color:'var(--text2)',marginTop:'8px'}},'The programmed workout is still below if you want to do it too.')
  ));
}
if(dy.isRest)return rRestDay(el,dy);

// === MANUAL SESSION TIMER ===
var tc=h('div',{className:'card',style:{textAlign:'center',padding:'10px'}});
tc.appendChild(h('p',{className:'label',style:{marginBottom:'4px'}},'Session Timer'));
// Calculate current elapsed from persisted timestamp
var _sessElapsed=S.sessTimer;
if(S._sessStartAt&&S.sessRun){_sessElapsed=Math.floor((Date.now()-S._sessStartAt)/1000);}
tc.appendChild(h('p',{style:{fontSize:'24px',fontWeight:800,fontVariantNumeric:'tabular-nums',margin:'0 0 8px'},id:'sess-t'},fmtT(_sessElapsed)));
var btns=h('div',{className:'timer-ctrl'});
if(!S.sessRun){btns.appendChild(h('button',{className:'timer-ctrl tc-start',onClick:function(){
  if(S.sessTimer>0){S._sessStartAt=Date.now()-S.sessTimer*1000;}else{S._sessStartAt=Date.now();}
  S.sessRun=true;clearInterval(S.sessInt);
  S.sessInt=setInterval(function(){var el=document.getElementById('sess-t');if(el&&S._sessStartAt)el.textContent=fmtT(Math.floor((Date.now()-S._sessStartAt)/1000));},1000);
  autosaveCL();R();}},S.sessTimer>0?'\u25B6 Resume':'\u25B6 Start'));}
else{
  // Auto-start display interval if running (e.g. after tab switch)
  if(!S.sessInt||!S.sessInt._rre){clearInterval(S.sessInt);S.sessInt=setInterval(function(){var el=document.getElementById('sess-t');if(el&&S._sessStartAt)el.textContent=fmtT(Math.floor((Date.now()-S._sessStartAt)/1000));},1000);S.sessInt._rre=1;}
  btns.appendChild(h('button',{className:'timer-ctrl tc-pause',onClick:function(){S.sessRun=false;clearInterval(S.sessInt);S.sessTimer=S._sessStartAt?Math.floor((Date.now()-S._sessStartAt)/1000):S.sessTimer;autosaveCL();R();}},'\u23F8 Pause'));}
if(_sessElapsed>0){btns.appendChild(h('button',{className:'timer-ctrl tc-finish',onClick:function(){S.sessRun=false;clearInterval(S.sessInt);var dur=S._sessStartAt?Math.floor((Date.now()-S._sessStartAt)/1000):S.sessTimer;S.sessTimer=dur;S.curLog.dur=dur;toast('Session: '+fmtT(dur));autosaveCL();R();}},'\u2713 Finish'));
btns.appendChild(h('button',{className:'timer-ctrl tc-reset',onClick:function(){S.sessRun=false;clearInterval(S.sessInt);S.sessTimer=0;S._sessStartAt=null;try{localStorage.removeItem('rre2_sesstimer');}catch(e){}R();}},'Reset'));}
tc.appendChild(btns);el.appendChild(tc);

// Active adjustment badge in tracker
var adjF=getAdjFactor();
if(adjF!==1){var adjLabel=adjF<1?'Reduced ('+Math.round(adjF*100)+'%)':'Boosted ('+Math.round(adjF*100)+'%)';
  var adjBadge=h('div',{style:{background:adjF<1?'rgba(59,130,246,0.1)':'rgba(200,16,46,0.1)',borderRadius:'8px',padding:'8px 12px',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}});
  adjBadge.appendChild(h('span',{style:{fontSize:'11px',fontWeight:700,color:adjF<1?'#3b82f6':'var(--accent)'}},'Red Adjusted: '+adjLabel));
  adjBadge.appendChild(h('span',{style:{fontSize:'9px',color:'var(--text2)'}},'Weights auto-scaled'));
  el.appendChild(adjBadge);}

// Header
var hdr=h('div',{className:'card',style:{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'6px'}});
hdr.appendChild(h('div',null,h('p',{className:'label'},'W'+S.week+' D'+S.day),h('h2',{style:{fontSize:'16px',fontWeight:800,margin:'2px 0 0'}},dy.name)));
var hbtns=h('div',{style:{display:'flex',gap:'4px'}});
hbtns.appendChild(h('button',{className:'btn btn-primary btn-sm',onClick:function(){var _svW=S.week,_svD=S.day,_svKey=lk(ap.id,_svW,_svD);S.curLog.date=localISOStr();if(S.sessTimer>0)S.curLog.dur=S.sessTimer;S.logs[_svKey]=JSON.parse(JSON.stringify(S.curLog));
if(dy.ex)dy.ex.forEach(function(ex,ei){if(ex.n&&(ex.n.indexOf('Dynamic Warm-Up')>-1||ex.n.indexOf('Dynamic Stretches')>-1))return;var eL=S.curLog['e'+ei];if(eL)Object.keys(eL).forEach(function(sk){if(sk.startsWith('s')){var w=parseFloat(eL[sk]&&eL[sk].w)||0;if(checkPR(ex.n,w)){sv();toast('\uD83C\uDFC6 PR! '+ex.n+': '+w+'lbs','pr-toast');}}});});useAdjSession();
// Clear autosave + timer on completion
S._sessStartAt=null;S.sessRun=false;S.sessTimer=0;clearInterval(S.sessInt);
try{localStorage.removeItem('rre2_curlog');localStorage.removeItem('rre2_sesstimer');}catch(e){}
sv();
// Celebration with session data for Red's post-workout feedback
var _nxtW=getNextWorkout(ap,pd);
var _logCopy=JSON.parse(JSON.stringify(S.curLog));
S.modal={type:'celebration',dayName:dy.name,nextW:_nxtW,ap:ap,pd:pd,wk:wk,dy:dy,w:_svW,d:_svD,logKey:_svKey,curLog:_logCopy,feeling:null,redFeedback:null,redLoading:false};
R();
}},'Save'));
hbtns.appendChild(h('button',{className:'btn btn-danger btn-sm',innerHTML:svg('trash',12,'var(--danger)'),'aria-label':'Clear this workout',onClick:function(){S.modal={type:'confirm',title:'Clear Workout?',msg:'This will erase all logged data for this workout.',confirmText:'Clear',cancelText:'Keep',onConfirm:function(){delete S.logs[lk(ap.id,S.week,S.day)];S.curLog={};S._sessStartAt=null;S.sessTimer=0;S.sessRun=false;clearInterval(S.sessInt);try{localStorage.removeItem('rre2_curlog');localStorage.removeItem('rre2_sesstimer');}catch(e){}sv();S.modal=null;R();}};R();}}));
hdr.appendChild(hbtns);el.appendChild(hdr);

// === MISSED WORKOUT BANNER ===
var _missedInfo=getMissedInfo(ap,pd);
var _missAlertId=ap.id+'_w'+S.week+'d'+S.day+'_m'+(_missedInfo.missed||0);
if(_missedInfo.missed>0&&_missedInfo.msg&&(S._dismissedAlerts||[]).indexOf(_missAlertId)===-1){
  var missCard=h('div',{style:{background:'var(--accent-light)',borderRadius:'10px',padding:'12px',marginBottom:'8px',borderLeft:'3px solid var(--accent)',position:'relative'}});
  var missTop=h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}});
  missTop.appendChild(h('div',{style:{width:'24px',height:'24px',borderRadius:'7px',background:'linear-gradient(135deg,#c8102e,#8b0000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff',fontWeight:800,flexShrink:0}},'R'));
  missTop.appendChild(h('span',{style:{fontWeight:700,fontSize:'12px',color:'var(--accent)',flex:1}},'Schedule shifted'));
  missTop.appendChild(h('button',{style:{background:'none',border:'none',cursor:'pointer',padding:'4px',color:'var(--text2)',fontSize:'16px',lineHeight:1},onClick:function(){if(!S._dismissedAlerts)S._dismissedAlerts=[];S._dismissedAlerts.push(_missAlertId);sv();R();}},'\u2715'));
  missCard.appendChild(missTop);
  missCard.appendChild(h('p',{style:{fontSize:'11px',lineHeight:'1.5',color:'var(--text)',margin:0}},_missedInfo.msg));
  el.appendChild(missCard);
}
// === WORKOUT INTRO: Red's pre-workout coaching (auto-generates) ===
var introKey='intro_w'+S.week+'d'+S.day;
var introText=S.coachCache[introKey]||null;
// Auto-generate briefing if not cached
if(!introText)generateCoaching('intro',introKey,function(){return COACH_PROMPTS.intro(ap,pd,wk,dy,getExDB());},function(){R();});
var _introFailed=!introText&&redHasFailed(introKey);
var introSection=h('div',{className:'card',style:{padding:'10px 14px',marginBottom:'6px'}});
var introTop=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'},role:'button','aria-expanded':S.show['tr_'+introKey]?'true':'false',onClick:function(){
  if(_introFailed){redRetry(introKey);R();return;}
  S.show['tr_'+introKey]=!S.show['tr_'+introKey];R();
}});
introTop.appendChild(h('div',{style:{width:'28px',height:'28px',borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}},h('span',{style:{color:'#fff',fontSize:'12px',fontWeight:800}},'R')));
introTop.appendChild(h('div',{style:{flex:1}},h('p',{style:{fontWeight:700,fontSize:'13px',margin:0}},"Red's Workout Briefing"),h('p',{style:{fontSize:'11px',color:_introFailed?'var(--accent)':'var(--text2)',margin:'1px 0 0'}},introText?(S.show['tr_'+introKey]?'Tap to collapse':'Tap to read'):(_introFailed?"Couldn't load. Tap to retry":'Red is writing your briefing...'))));
if(!_introFailed)introTop.appendChild(h('span',{style:{fontSize:'10px',color:'var(--text2)',transition:'transform 0.2s',display:'inline-block',transform:S.show['tr_'+introKey]?'rotate(180deg)':'rotate(0deg)'}},'\u25BC'));
introSection.appendChild(introTop);
if(S.show['tr_'+introKey]&&introText){introSection.appendChild(h('div',{style:{padding:'8px 0 4px',fontSize:'13px',lineHeight:'1.6',color:'var(--text2)',whiteSpace:'pre-line'}},introText));}
el.appendChild(introSection);

// Feeling meter moved to post-workout congrats popup

// Superset toggle
if(dy.ex)renderSSToggle(el,dy.ex);

// Warmup
var wType=dy.type||'full';var wups=WU[wType]||WU.full;
if(wups&&wups.length){var wu=h('div',{className:'ex-block',style:{borderLeft:'3px solid var(--warn)'}});wu.appendChild(h('div',{style:{padding:'10px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'},onClick:function(){S.show.wu=!S.show.wu;R();}},h('span',{style:{fontWeight:700,fontSize:'12px',color:'var(--warn)'}},'\uD83D\uDD25 WARM-UP'),h('span',{style:{fontSize:'10px',color:'var(--text2)'}},S.show.wu?'\u25B2':'\u25BC')));
if(S.show.wu){var wb=h('div',{style:{padding:'6px 14px'}});wups.forEach(function(w,i){wb.appendChild(h('div',{style:{padding:'5px 0',borderBottom:i<wups.length-1?'1px solid var(--border)':'none'}},h('p',{style:{fontWeight:600,fontSize:'12px'}},w.n+' \u2014 '+w.r),h('p',{style:{color:'var(--text2)',fontSize:'10px',marginTop:'1px'}},w.d)));});wu.appendChild(wb);}el.appendChild(wu);}
// Warmup checkbox
var wuCheck=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',marginBottom:'6px',cursor:'pointer',border:S.curLog.warmupDone?'1px solid rgba(16,185,129,0.3)':'1px solid var(--border)',background:S.curLog.warmupDone?'rgba(16,185,129,0.05)':'transparent',borderRadius:'10px',transition:'all 0.2s'},onClick:function(){S.curLog.warmupDone=!S.curLog.warmupDone;if(S.curLog.warmupDone)toast('Nice \u2014 let\'s get to work','');autosaveCL();R();}});
var wuCb=h('div',{style:{width:'22px',height:'22px',borderRadius:'6px',border:S.curLog.warmupDone?'none':'2px solid var(--border)',background:S.curLog.warmupDone?'#10b981':'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',flexShrink:0}});
if(S.curLog.warmupDone)wuCb.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>';
wuCheck.appendChild(wuCb);wuCheck.appendChild(h('span',{style:{fontSize:'13px',fontWeight:600,color:S.curLog.warmupDone?'#10b981':'var(--text)'}},'Warmup completed'));
el.appendChild(wuCheck);

// Exercises
// Exercises
var ssPairs=S.ssMode?getSupersets(dy.ex):[];
var ssMap={};ssPairs.forEach(function(p){ssMap[p.a]=p;ssMap[p.b]=p;});
var ssShown={};
if(dy.ex) dy.ex.forEach(function(ex,ei){
  // Skip warm-up flow exercises (handled by warmup checkbox above)
  if(ex.n&&(ex.n.indexOf('Dynamic Warm-Up')>-1||ex.n.indexOf('Dynamic Stretches')>-1))return;
  // Superset label before first exercise of pair
  if(S.ssMode&&ssMap[ei]){var pKey=Math.min(ssMap[ei].a,ssMap[ei].b);
    if(!ssShown[pKey]){ssShown[pKey]=true;
      var other=ssMap[ei].a===ei?dy.ex[ssMap[ei].b]:dy.ex[ssMap[ei].a];
      el.appendChild(h('div',{className:'ss-label'},h('span',null,'\uD83D\uDD04 SUPERSET: '+ex.n.split(' ').slice(-2).join(' ')+' + '+(other?other.n.split(' ').slice(-2).join(' '):'')),h('span',{style:{fontSize:'9px',opacity:.7}},'60s between rounds')));
    }
  }
  var eLog=S.curLog['e'+ei]||{};var bl=h('div',{className:'ex-block'+(S.ssMode&&ssMap[ei]?' ss-group':'')});
var exKey='ex_'+ei+'_w'+S.week+'d'+S.day;var exCoachText=S.coachCache[exKey]||null;
var hd=h('div',{className:'ex-head'});var exNameWrap=h('div',{style:{display:'flex',alignItems:'center',gap:'8px',flex:1}});
var _sub=getSubstitution(ex.n);
exNameWrap.appendChild(h('div',null,h('h4',{style:{fontSize:'13px',fontWeight:700,margin:0}},ex.n),
  _sub?h('p',{style:{color:'var(--warn)',fontSize:'9px',margin:'1px 0 0',fontWeight:600}},'\u26A0 Sub: '+_sub.sub+' ('+_sub.reason+')'):null,h('p',{style:{color:'var(--text2)',fontSize:'10px',margin:'1px 0 0'}},ex.s+'\u00D7'+ex.r+(ex.rest&&ex.rest!=='-'?' \u00B7 '+ex.rest:''))));hd.appendChild(exNameWrap);
if(ex.rest&&ex.rest!=='-'&&ex.rest!=='Circuit'&&ex.rest!=='Light')hd.appendChild(h('button',{className:'btn btn-sm',style:{background:'var(--accent)',color:'#fff',border:'none',fontSize:'10px'},innerHTML:svg('clock',10,'#fff')+' Rest',onClick:function(ev){ev.stopPropagation();openT(pRest(ex.rest));}}));
bl.appendChild(hd);var bd=h('div',{className:'ex-body'});
var desc=getDesc(ex.n)||'';if(desc){var dk='d'+ei;bd.appendChild(h('button',{className:'section-toggle',onClick:function(){S.show[dk]=!S.show[dk];R();}},S.show[dk]?'Hide tips \u25B2':'How to \u25BC'));if(S.show[dk])bd.appendChild(h('p',{className:'desc-text'},desc));}
// Red's coaching cues for this exercise (auto-generates on expand)
(function(_eKey,_eName,_eData,_ap,_pd){
var _txt=S.coachCache[_eKey]||null;
var _isOpen=S.show['tr_'+_eKey];
var _tw=h('div',{className:'transcript-wrap',style:{marginTop:'4px',borderLeft:'2px solid var(--accent)',borderRadius:'0 6px 6px 0',background:'rgba(200,16,46,0.03)',overflow:'hidden',transition:'all 0.3s'}});
var _tg=h('div',{style:{padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',justifyContent:'space-between'},onClick:function(){if(redHasFailed(_eKey)){redRetry(_eKey);S.show['tr_'+_eKey]=true;}else{S.show['tr_'+_eKey]=!S.show['tr_'+_eKey];}if(S.show['tr_'+_eKey]&&!S.coachCache[_eKey]){generateCoaching('exercise',_eKey,function(){return COACH_PROMPTS.exercise(_eName,_eData,_ap,_pd);},function(){R();});}R();}});
_tg.appendChild(h('span',{style:{fontSize:'11px',color:'var(--accent)',fontWeight:600}},"Red's coaching cues"));
_tg.appendChild(h('span',{style:{fontSize:'10px',color:'var(--text2)',transition:'transform 0.2s',display:'inline-block',transform:_isOpen?'rotate(180deg)':'rotate(0deg)'}},'\u25BC'));
_tw.appendChild(_tg);
if(_isOpen&&_txt){_tw.appendChild(h('div',{style:{padding:'4px 10px 8px',fontSize:'12px',lineHeight:'1.5',color:'var(--text2)'}},_txt));}
else if(_isOpen&&!_txt){_tw.appendChild(h('div',{style:{padding:'4px 10px 8px',fontSize:'11px',color:redHasFailed(_eKey)?'var(--accent)':'var(--text2)',fontStyle:'italic'}},redHasFailed(_eKey)?"Couldn't load cues. Tap above to retry.":'Red is writing your cues...'));}
bd.appendChild(_tw);
})(exKey,ex.n,ex,ap,pd);
// Progressive overload: show last performance and suggestion
var _lastPerf=getLastPerformance(ex.n);
var _suggest=suggestWeight(ex.n,ex.r);
if(_lastPerf){
  var _lastRow=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',marginBottom:'4px',fontSize:'10px'}});
  var _lastSets=_lastPerf.sets.map(function(s){return s.w+'\u00D7'+s.r;}).join(' \u00B7 ');
  _lastRow.appendChild(h('span',{style:{color:'var(--text2)'}},'Last: '+_lastSets));
  if(_suggest)_lastRow.appendChild(h('span',{style:{color:'var(--accent)',fontWeight:700}},_suggest.note));
  bd.appendChild(_lastRow);
}
// Exercise history button
var _histBtn=h('button',{className:'section-toggle',style:{fontSize:'10px',padding:'2px 0',marginBottom:'4px'},onClick:function(){S.modal={type:'exHistory',exName:ex.n};R();}});
_histBtn.textContent='\uD83D\uDCCA View History';
if(_lastPerf)bd.appendChild(_histBtn);

var _ru=repUnit(ex.r);
var sh=h('div',{className:'set-grid',style:{marginBottom:'2px',paddingBottom:'2px',borderBottom:'1px solid var(--border)'}});['Set','Wt',_ru.hdr,''].forEach(function(t){sh.appendChild(h('span',{className:'set-hdr'},t));});bd.appendChild(sh);
for(var s=1;s<=ex.s;s++){(function(sn,eidx){var sL=eLog['s'+sn]||{};var pW='',pR='';if(sn>1)for(var ps=sn-1;ps>=1;ps--){var prev=eLog['s'+ps];if(prev){if(prev.w&&!pW)pW=prev.w;if(prev.r&&!pR)pR=prev.r;if(pW&&pR)break;}}
var dW=sL.w||pW,dR=sL.r||pR;var row=h('div',{className:'set-grid'});row.appendChild(h('span',{className:'set-num'},''+sn));
var wi=h('input',{className:'input-sm',type:'number',inputMode:'decimal',step:'2.5',placeholder:'lbs',value:dW,style:{color:sL.w?'var(--text)':pW?'var(--text2)':'var(--text)'}});wi.addEventListener('focus',function(){if(!sL.w&&dW){ensL(eidx,sn,ex.n);S.curLog['e'+eidx]['s'+sn].w=dW;}});wi.addEventListener('change',function(e){var _raw=e.target.value;if(_raw!==''){var _n=parseFloat(_raw);if(isNaN(_n)||_n<0){e.target.value='';toast('Invalid weight');return;}if(_n>9999){e.target.value='9999';_raw='9999';}}ensL(eidx,sn,ex.n);S.curLog['e'+eidx]['s'+sn].w=_raw;R();});
var ri=h('input',{className:'input-sm',type:'number',inputMode:'numeric',placeholder:_ru.ph,value:dR,style:{color:sL.r?'var(--text)':pR?'var(--text2)':'var(--text)'}});ri.addEventListener('focus',function(){if(!sL.r&&dR){ensL(eidx,sn,ex.n);S.curLog['e'+eidx]['s'+sn].r=dR;}});ri.addEventListener('change',function(e){ensL(eidx,sn,ex.n);S.curLog['e'+eidx]['s'+sn].r=e.target.value;R();});
var cb=h('button',{className:'chk'+(sL.done?' done':'')});if(sL.done)cb.innerHTML=svg('check',12,'#fff');cb.addEventListener('click',function(){ensL(eidx,sn,ex.n);var c=S.curLog['e'+eidx]['s'+sn];c.done=!c.done;if(!c.w&&dW)c.w=dW;if(!c.r&&dR)c.r=dR;R();});
row.appendChild(wi);row.appendChild(ri);row.appendChild(cb);bd.appendChild(row);})(s,ei);}
var ta=h('textarea',{className:'input-sm',placeholder:'Notes...',style:{width:'100%',textAlign:'left',minHeight:'28px',marginTop:'4px',resize:'vertical',padding:'6px 10px',fontSize:'16px'}});ta.value=eLog.notes||'';ta.addEventListener('change',function(e){if(!S.curLog['e'+ei])S.curLog['e'+ei]={};S.curLog['e'+ei].notes=e.target.value;autosaveCL();});bd.appendChild(ta);
// Running metrics (pace/distance)
if(pd&&(pd.type==='running')&&ex.n&&(ex.n.indexOf('Run')>-1||ex.n.indexOf('run')>-1||ex.n.indexOf('Tempo')>-1||ex.n.indexOf('Sprint')>-1||ex.n.indexOf('Interval')>-1||ex.n.indexOf('Jog')>-1||ex.n.indexOf('Mile')>-1||ex.n.indexOf('Fartlek')>-1)){
  ensL(ei,1,ex.n);var _rLog=S.curLog['e'+ei]||{};
  var _runRow=h('div',{style:{display:'flex',gap:'6px',padding:'6px 0',borderTop:'1px solid var(--border)',marginTop:'4px'}});
  ['dist|Distance|miles|0.1','pace|Pace|min/mi|','runDur|Time|mm:ss|'].forEach(function(spec){
    var p=spec.split('|');
    var inp=h('input',{className:'input-sm',type:p[3]?'number':'text',step:p[3]||'',placeholder:p[2],value:_rLog[p[0]]||'',style:{width:'100%'}});
    (function(key){inp.addEventListener('change',function(e){if(!S.curLog['e'+ei])S.curLog['e'+ei]={};S.curLog['e'+ei][key]=e.target.value;autosaveCL();});})(p[0]);
    _runRow.appendChild(h('div',{style:{flex:1}},h('label',{style:{fontSize:'9px',color:'var(--text2)',display:'block'}},p[1]),inp));
  });
  bd.appendChild(_runRow);
}
bl.appendChild(bd);el.appendChild(bl);});

// Cooldown
var cdb=h('div',{className:'ex-block',style:{borderLeft:'3px solid var(--success)'}});cdb.appendChild(h('div',{style:{padding:'10px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'},onClick:function(){S.show.cd=!S.show.cd;R();}},h('span',{style:{fontWeight:700,fontSize:'12px',color:'var(--success)'}},'\uD83E\uDDCA COOL-DOWN'),h('span',{style:{fontSize:'10px',color:'var(--text2)'}},S.show.cd?'\u25B2':'\u25BC')));
if(S.show.cd){var cdd=h('div',{style:{padding:'6px 14px'}});CD.forEach(function(c,i){cdd.appendChild(h('div',{style:{padding:'5px 0',borderBottom:i<CD.length-1?'1px solid var(--border)':'none'}},h('p',{style:{fontWeight:600,fontSize:'12px'}},c.n),h('p',{style:{color:'var(--text2)',fontSize:'10px',marginTop:'1px'}},c.d)));});cdb.appendChild(cdd);}el.appendChild(cdb);
// Cooldown checkbox
var cdCheck=h('div',{className:'card',style:{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',marginBottom:'6px',cursor:'pointer',border:S.curLog.cooldownDone?'1px solid rgba(16,185,129,0.3)':'1px solid var(--border)',background:S.curLog.cooldownDone?'rgba(16,185,129,0.05)':'transparent',borderRadius:'10px',transition:'all 0.2s'},onClick:function(){S.curLog.cooldownDone=!S.curLog.cooldownDone;if(S.curLog.cooldownDone)toast('Good call. Recovery starts now.','');R();}});
var cdCb=h('div',{style:{width:'22px',height:'22px',borderRadius:'6px',border:S.curLog.cooldownDone?'none':'2px solid var(--border)',background:S.curLog.cooldownDone?'#10b981':'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',flexShrink:0}});
if(S.curLog.cooldownDone)cdCb.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>';
cdCheck.appendChild(cdCb);cdCheck.appendChild(h('span',{style:{fontSize:'13px',fontWeight:600,color:S.curLog.cooldownDone?'#10b981':'var(--text)'}},'Cooldown completed'));
el.appendChild(cdCheck);
// Warmup nudge if logging without warmup
if(!S.curLog.warmupDone&&dy.ex){var hasAnyLog=false;if(dy.ex)dy.ex.forEach(function(ex,ei){if(ex.n&&(ex.n.indexOf('Dynamic Warm-Up')>-1||ex.n.indexOf('Dynamic Stretches')>-1))return;if(S.curLog['e'+ei])hasAnyLog=true;});if(hasAnyLog&&!S.curLog._wuNudged){S.curLog._wuNudged=true;}}
// Today's custom workouts
rCWList(el);
// Add outside workout button
rCWBtn(el,lk(ap.id,S.week,S.day));
return el;}


// === MERGED TRACKER ===
function rMergedTrack(){
  var el=h('div',{className:'page active'});
  var merged=getMergedSchedule();if(!merged)return rTrack();
  var dayTpl=merged.schedule[S.day-1];if(!dayTpl){el.appendChild(h('p',{style:{color:'var(--text2)',textAlign:'center',padding:'40px'}},'No data for this day.'));return el;}
  var logKey='merged_w'+S.week+'d'+S.day;
  loadMergedCL();

  // Day pills (rendered first so a rest day still lets the user reach the other days)
  var pills=h('div',{className:'pill-row',style:{marginBottom:'8px'}});
  merged.schedule.forEach(function(dt,idx){if(dt.isRest)return;
    pills.appendChild(h('button',{className:'pill'+(S.day===(idx+1)?' active':'')+(S.logs['merged_w'+S.week+'d'+(idx+1)]?' done':''),onClick:function(){S.day=idx+1;S._trackManual=true;loadMergedCL();S.sessTimer=0;S.sessRun=false;clearInterval(S.sessInt);R();}},dt.label.split(' ')[0]));});
  el.appendChild(pills);

  if(dayTpl.isRest)return rRestDay(el,{name:dayTpl.label,isRest:true});

  // Session timer
  var tc=h('div',{className:'card',style:{textAlign:'center',padding:'10px'}});
  tc.appendChild(h('p',{className:'label',style:{marginBottom:'4px'}},'Session Timer'));
  tc.appendChild(h('p',{style:{fontSize:'24px',fontWeight:800,fontVariantNumeric:'tabular-nums',margin:'0 0 8px'},id:'sess-t'},fmtT(S.sessTimer)));
  var btns=h('div',{className:'timer-ctrl'});
  if(!S.sessRun){btns.appendChild(h('button',{className:'timer-ctrl tc-start',onClick:function(){S.sessRun=true;S.sessInt=setInterval(function(){S.sessTimer++;var el=document.getElementById('sess-t');if(el)el.textContent=fmtT(S.sessTimer);},1000);R();}},S.sessTimer>0?'\u25B6 Resume':'\u25B6 Start'));}
  else{btns.appendChild(h('button',{className:'timer-ctrl tc-pause',onClick:function(){S.sessRun=false;clearInterval(S.sessInt);R();}},'\u23F8 Pause'));}
  if(S.sessTimer>0){btns.appendChild(h('button',{className:'timer-ctrl tc-finish',onClick:function(){S.sessRun=false;clearInterval(S.sessInt);S.curLog.dur=S.sessTimer;toast('Session: '+fmtT(S.sessTimer));R();}},'\u2713 Finish'));
  btns.appendChild(h('button',{className:'timer-ctrl tc-reset',onClick:function(){S.sessRun=false;clearInterval(S.sessInt);S.sessTimer=0;R();}},'Reset'));}
  tc.appendChild(btns);el.appendChild(tc);

// Active adjustment badge in tracker
var adjF=getAdjFactor();
if(adjF!==1){var adjLabel=adjF<1?'Reduced ('+Math.round(adjF*100)+'%)':'Boosted ('+Math.round(adjF*100)+'%)';
  var adjBadge=h('div',{style:{background:adjF<1?'rgba(59,130,246,0.1)':'rgba(200,16,46,0.1)',borderRadius:'8px',padding:'8px 12px',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}});
  adjBadge.appendChild(h('span',{style:{fontSize:'11px',fontWeight:700,color:adjF<1?'#3b82f6':'var(--accent)'}},'Red Adjusted: '+adjLabel));
  adjBadge.appendChild(h('span',{style:{fontSize:'9px',color:'var(--text2)'}},'Weights auto-scaled'));
  el.appendChild(adjBadge);}

  // Header with type badges
  var hdr=h('div',{className:'card',style:{padding:'14px'}});
  var hTop=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}});
  hTop.appendChild(h('div',null,h('p',{className:'label'},'Week '+S.week+' \u00B7 Day '+S.day),h('h2',{style:{fontSize:'16px',fontWeight:800,margin:'2px 0 0'}},dayTpl.label)));
  var hbtns=h('div',{style:{display:'flex',gap:'4px'}});
  hbtns.appendChild(h('button',{className:'btn btn-primary btn-sm',onClick:function(){S.curLog.date=localISOStr();if(S.sessTimer>0)S.curLog.dur=S.sessTimer;S.logs[logKey]=JSON.parse(JSON.stringify(S.curLog));
  // Also check PRs
  var exs=getMergedDayExercises(dayTpl,S.week);exs.forEach(function(ex,ei){var eL=S.curLog['e'+ei];if(eL)Object.keys(eL).forEach(function(sk){if(sk.startsWith('s')){var w=parseFloat(eL[sk]&&eL[sk].w)||0;if(checkPR(ex.n,w)){sv();toast('\uD83C\uDFC6 PR! '+ex.n+': '+w+'lbs','pr-toast');}}});});
  useAdjSession();
  S._sessStartAt=null;S.sessRun=false;S.sessTimer=0;clearInterval(S.sessInt);
  try{localStorage.removeItem('rre2_curlog');localStorage.removeItem('rre2_sesstimer');}catch(e){}
  sv();
  var _mExs=getMergedDayExercises(dayTpl,S.week);
  var _nxD=getNextMergedDay(merged);
  S.modal={type:'celebration',merged:true,dayName:dayTpl.label,nextW:_nxD,
    ap:{id:'merged'},pd:{name:S.enrolled.map(function(e){return PROGRAMS[e.id]?PROGRAMS[e.id].name:'';}).filter(Boolean).join(' + ')},
    wk:null,dy:{name:dayTpl.label,ex:_mExs},w:S.week,d:S.day,logKey:logKey,curLog:JSON.parse(JSON.stringify(S.curLog)),feeling:null,redFeedback:null,redLoading:false};
  R();}},'Save'));
  hbtns.appendChild(h('button',{className:'btn btn-danger btn-sm',innerHTML:svg('trash',12,'var(--danger)'),'aria-label':'Clear this workout',onClick:function(){S.modal={type:'confirm',title:'Clear Workout?',msg:'This will erase all logged data for this workout.',confirmText:'Clear',cancelText:'Keep',onConfirm:function(){delete S.logs[logKey];sv();S.curLog={};S.modal=null;R();}};R();}}));
  hTop.appendChild(hbtns);hdr.appendChild(hTop);
  // Type badges
  var badges=h('div',{style:{display:'flex',gap:'4px'}});dayTpl.types.forEach(function(t){badges.appendChild(h('span',{style:{background:t==='strength'?'rgba(200,16,46,0.15)':t==='running'?'rgba(59,130,246,0.15)':'rgba(168,85,247,0.15)',color:t==='strength'?'var(--accent)':t==='running'?'#3b82f6':'#a855f7',padding:'3px 10px',borderRadius:'6px',fontSize:'10px',fontWeight:700,textTransform:'uppercase'}},t));});
  hdr.appendChild(badges);hdr.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'11px',marginTop:'6px'}},dayTpl.desc));el.appendChild(hdr);

  // Feeling is rated after Save, in the celebration (keeps the rating unbiased and off the workout screen).

  // Superset toggle for merged day
  var mergedExForSS=getMergedDayExercises(dayTpl,S.week);
  if(mergedExForSS.length>1)renderSSToggle(el,mergedExForSS);

  // Get exercises for this merged day
  var exercises=getMergedDayExercises(dayTpl,S.week);
  if(exercises.length===0){el.appendChild(h('div',{className:'card',style:{textAlign:'center',padding:'20px'}},h('p',{style:{color:'var(--text2)'}},dayTpl.desc)));return el;}

  // Group by source type
  var curSource='';
  exercises.forEach(function(ex,ei){
    if(ex.source!==curSource){curSource=ex.source;
      el.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'6px',margin:'10px 0 4px'}},
        h('span',{style:{fontSize:'14px'}},ex.source==='strength'?'\uD83D\uDCAA':ex.source==='running'?'\uD83C\uDFC3':'\uD83E\uDDD8'),
        h('span',{style:{fontSize:'11px',fontWeight:800,textTransform:'uppercase',color:'var(--text2)'}},ex.source)));}

    var eLog=S.curLog['e'+ei]||{};var bl=h('div',{className:'ex-block'});
    var hd=h('div',{className:'ex-head'});hd.appendChild(h('div',null,h('h4',{style:{fontSize:'13px',fontWeight:700,margin:0}},ex.n),h('p',{style:{color:'var(--text2)',fontSize:'10px',margin:'1px 0 0'}},ex.s+'\u00D7'+ex.r+(ex.rest&&ex.rest!=='-'?' \u00B7 '+ex.rest:''))));
    if(ex.rest&&ex.rest!=='-'&&ex.rest!=='Circuit'&&ex.rest!=='Light')hd.appendChild(h('button',{className:'btn btn-sm',style:{background:'var(--accent)',color:'#fff',border:'none',fontSize:'10px'},innerHTML:svg('clock',10,'#fff')+' Rest',onClick:function(ev){ev.stopPropagation();openT(pRest(ex.rest));}}));
    bl.appendChild(hd);var bd=h('div',{className:'ex-body'});
    var desc=getDesc(ex.n)||'';if(desc){var dk='d'+ei;bd.appendChild(h('button',{className:'section-toggle',onClick:function(){S.show[dk]=!S.show[dk];R();}},S.show[dk]?'Hide tips \u25B2':'How to \u25BC'));if(S.show[dk])bd.appendChild(h('p',{className:'desc-text'},desc));}
    var _ru2=repUnit(ex.r);
    var sh=h('div',{className:'set-grid',style:{marginBottom:'2px',paddingBottom:'2px',borderBottom:'1px solid var(--border)'}});['Set','Wt',_ru2.hdr,''].forEach(function(t){sh.appendChild(h('span',{className:'set-hdr'},t));});bd.appendChild(sh);
    for(var s=1;s<=ex.s;s++){(function(sn,eidx){var sL=eLog['s'+sn]||{};var pW='',pR='';if(sn>1)for(var ps=sn-1;ps>=1;ps--){var prev=eLog['s'+ps];if(prev){if(prev.w&&!pW)pW=prev.w;if(prev.r&&!pR)pR=prev.r;if(pW&&pR)break;}}
    var dW=sL.w||pW,dR=sL.r||pR;var row=h('div',{className:'set-grid'});row.appendChild(h('span',{className:'set-num'},''+sn));
    var wi=h('input',{className:'input-sm',type:'number',inputMode:'decimal',step:'2.5',placeholder:'lbs',value:dW,style:{color:sL.w?'var(--text)':pW?'var(--text2)':'var(--text)'}});wi.addEventListener('focus',function(){if(!sL.w&&dW){ensL(eidx,sn,ex.n);S.curLog['e'+eidx]['s'+sn].w=dW;}});wi.addEventListener('change',function(e){var _raw=e.target.value;if(_raw!==''){var _n=parseFloat(_raw);if(isNaN(_n)||_n<0){e.target.value='';toast('Invalid weight');return;}if(_n>9999){e.target.value='9999';_raw='9999';}}ensL(eidx,sn,ex.n);S.curLog['e'+eidx]['s'+sn].w=_raw;R();});
    var ri=h('input',{className:'input-sm',type:'number',inputMode:'numeric',placeholder:_ru2.ph,value:dR,style:{color:sL.r?'var(--text)':pR?'var(--text2)':'var(--text)'}});ri.addEventListener('focus',function(){if(!sL.r&&dR){ensL(eidx,sn,ex.n);S.curLog['e'+eidx]['s'+sn].r=dR;}});ri.addEventListener('change',function(e){ensL(eidx,sn,ex.n);S.curLog['e'+eidx]['s'+sn].r=e.target.value;R();});
    var cb=h('button',{className:'chk'+(sL.done?' done':'')});if(sL.done)cb.innerHTML=svg('check',12,'#fff');cb.addEventListener('click',function(){ensL(eidx,sn,ex.n);var c=S.curLog['e'+eidx]['s'+sn];c.done=!c.done;if(!c.w&&dW)c.w=dW;if(!c.r&&dR)c.r=dR;R();});
    row.appendChild(wi);row.appendChild(ri);row.appendChild(cb);bd.appendChild(row);})(s,ei);}
    bl.appendChild(bd);el.appendChild(bl);
  });
  // Custom workouts for merged day
  rCWList(el);
  rCWBtn(el,'merged_w'+S.week+'d'+S.day);
  return el;
}
