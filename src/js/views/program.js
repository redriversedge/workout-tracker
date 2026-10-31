// === PROGRAM TAB ===
function rProg(){console.log('[RRE] rProg called, enrolled:',S.enrolled.length,'active:',S.active);var el=h('div',{className:'page active'});var ap=gAP(),pd=ap?gPD(ap.id):null;if(!ap||!pd)return rPP();var adaptedData=getAdaptedProgram(ap.id,ap.days)||pd.data;var wk=adaptedData[S.week];if(!wk||!wk.days)return el;
var isSC=pd.id&&pd.id.indexOf('sc_')===0;var scEls=(gAP()&&gAP().scElements)||[];
// Program level badge
if(pd.level){el.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}},
  h('span',{style:{fontSize:'10px',fontWeight:700,padding:'3px 8px',borderRadius:'6px',background:pd.level==='Beginner'?'rgba(16,185,129,.12)':pd.level==='Advanced'?'rgba(239,68,68,.12)':'rgba(59,130,246,.12)',color:pd.level==='Beginner'?'#10b981':pd.level==='Advanced'?'#ef4444':'#3b82f6'}},pd.level),
  h('span',{style:{fontSize:'11px',color:'var(--text2)'}},pd.name)));}
var pills=h('div',{className:'pill-row',style:{marginBottom:'12px'}});for(var w=1;w<=pd.weeks;w++){(function(ww){
  var hasLogs=false;for(var dd=1;dd<=ap.days;dd++){if(S.logs[lk(ap.id,ww,dd)]){hasLogs=true;break;}}
  pills.appendChild(h('button',{className:'pill'+(S.week===ww?' active':''),style:{position:'relative',minWidth:'38px'},onClick:function(){S.week=ww;R();}},
    'W'+ww+(hasLogs?' \u2713':'')));})(w);}el.appendChild(pills);

// Red's Program Breakdown (collapsible, expanded on first view)
var progOverviewKey='progOverview_'+ap.id;
var progOverviewSeen=S.show['progOV_seen_'+ap.id];
var progOVExpanded=S.show['progOV']!==undefined?S.show['progOV']:!progOverviewSeen;
var poCard=h('div',{className:'card',style:{borderLeft:'3px solid var(--accent)',marginBottom:'12px'}});
var poHead=h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',padding:'2px 0'},onClick:function(){S.show['progOV']=!progOVExpanded;if(!S.show['progOV_seen_'+ap.id]){S.show['progOV_seen_'+ap.id]=true;}R();}});
poHead.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'8px'}},
  h('div',{style:{width:'28px',height:'28px',borderRadius:'8px',background:'linear-gradient(135deg,#c8102e,#8b0000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:'#fff',fontWeight:800,flexShrink:0}},'R'),
  h('span',{style:{fontWeight:700,fontSize:'13px'}},"Red's Program Breakdown")));
poHead.appendChild(h('span',{style:{fontSize:'10px',color:'var(--text2)'}},progOVExpanded?'\u25B2':'\u25BC'));
poCard.appendChild(poHead);
if(progOVExpanded){
  var poBody=h('div',{style:{paddingTop:'10px',borderTop:'1px solid var(--border)',marginTop:'8px'}});
  var cachedOV=S.coachCache['progOV_'+ap.id];
  if(cachedOV){
    poBody.appendChild(h('p',{style:{fontSize:'12px',lineHeight:'1.6',color:'var(--text)',whiteSpace:'pre-line'}},cachedOV));
  } else {
    var _poKey='progOV_'+ap.id;
    var _poFailed=redHasFailed(_poKey);
    if(_poFailed){
      poBody.appendChild(h('button',{className:'btn btn-secondary btn-sm',onClick:function(e){e.stopPropagation();redRetry(_poKey);R();}},"Couldn't load Red's breakdown. Tap to retry"));
    } else {
      poBody.appendChild(h('p',{style:{fontSize:'12px',color:'var(--text2)',fontStyle:'italic'}},'Red is writing your program breakdown...'));
      var poPrompt={
        system:"You are Red, a seasoned fitness coach with decades of experience. Give a clear, conversational overview of this training program. Explain what it is, how it is structured (phases, weekly schedule, progression), what the user can expect over the course of it, and why it fits their goals. Use contractions naturally. Be warm and authoritative but not stiff. Keep it 150-250 words. Address the user directly.",
        user:"Program: "+pd.name+"\nType: "+pd.type+"\nLevel: "+pd.level+"\nWeeks: "+pd.weeks+"\nDays/week: "+pd.daysPerWeek+"\nUser: "+(S.profile.name||'Athlete')+"\nLevel: "+(S.profile.level||'Intermediate')+"\nGoals: "+(Array.isArray(S.profile.goals)?S.profile.goals.join(', '):'General Fitness')+"\n\nWeek structure sample: "+(pd.data[1]&&pd.data[1].days?Object.keys(pd.data[1].days).map(function(d){var dy=pd.data[1].days[d];return dy?'Day '+d+': '+dy.name:'';}).filter(Boolean).join(', '):'')+"\nWeek 1 focus: "+(pd.data[1]&&pd.data[1].name?pd.data[1].name:'')+(pd.data[1]&&pd.data[1].focus?' - '+pd.data[1].focus:'')
      };
      var _poReq=redOnce(_poKey,{system:poPrompt.system,user:poPrompt.user,maxTokens:450});
      if(_poReq)_poReq.then(function(txt){S.coachCache[_poKey]=txt;sv();R();},function(){R();});
    }
  }
  poCard.appendChild(poBody);
}
el.appendChild(poCard);

var info=h('div',{className:'card'});info.appendChild(h('h2',{style:{fontSize:'18px',fontWeight:800,margin:'0 0 3px'}},'Week '+S.week+': '+(wk.name||'')));if(wk.focus)info.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px'}},wk.focus));
if(wk.rpe){var tags=h('div',{style:{display:'flex',gap:'8px',marginTop:'8px'}});tags.appendChild(h('span',{style:{background:'var(--accent-light)',color:'var(--accent)',padding:'4px 10px',borderRadius:'7px',fontSize:'11px',fontWeight:700}},'RPE '+wk.rpe));if(wk.int)tags.appendChild(h('span',{style:{background:'var(--accent-light)',color:'var(--accent)',padding:'4px 10px',borderRadius:'7px',fontSize:'11px',fontWeight:700}},wk.int));info.appendChild(tags);}el.appendChild(info);
for(var dn=1;dn<=ap.days;dn++){(function(d){var dIdx=d;var dy=wk.days?wk.days[d]:null;if(!dy)return;var logKey=lk(ap.id,S.week,d);var dayLog=S.logs[logKey];var isDone=!!dayLog;
if(dIdx===1&&isSC){
  var elCard=h('div',{className:'card',style:{padding:'12px 14px',marginBottom:'12px',borderLeft:'3px solid var(--accent)'}});
  var teExpanded=!!S.show['te_expanded'];
  var teHead=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'},onClick:function(){S.show['te_expanded']=!teExpanded;R();}});
  teHead.appendChild(h('span',{style:{fontSize:'12px',fontWeight:700}},'\u2699 Training Elements'));
  teHead.appendChild(h('span',{style:{fontSize:'10px',color:'var(--text2)'}},teExpanded?'\u25B2':'\u25BC'));
  elCard.appendChild(teHead);
  if(teExpanded){
  var scOpts=['Barbell-focused compounds','Kettlebell conditioning','Dumbbell complexes','HIIT finishers'];
  scOpts.forEach(function(opt){
    var isOn=scEls.indexOf(opt)>-1;
    var row=h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',cursor:'pointer'},onClick:function(){
      if(!ap.scElements)ap.scElements=[];
      var i=ap.scElements.indexOf(opt);
      if(i>-1)ap.scElements.splice(i,1);else ap.scElements.push(opt);
      sv();R();
    }});
    row.appendChild(h('div',{style:{width:'18px',height:'18px',borderRadius:'4px',border:'2px solid '+(isOn?'var(--accent)':'var(--border)'),background:isOn?'var(--accent)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff',flexShrink:'0'}},isOn?'\u2713':''));
    row.appendChild(h('span',{style:{fontSize:'12px',color:isOn?'var(--text)':'var(--text2)'}},opt));
    elCard.appendChild(row);
  });
  elCard.appendChild(h('p',{style:{fontSize:'10px',color:'var(--text2)',marginTop:'6px'}},'Changes apply to your workouts immediately.'));
  } // end teExpanded
  el.appendChild(elCard);
}
var bl=h('div',{className:'ex-block',style:{borderLeft:isDone?'3px solid #10b981':'none',opacity:isDone?0.9:1}});
var hd=h('div',{className:'ex-head'});
hd.appendChild(h('div',null,h('span',{style:{fontWeight:800,fontSize:'10px',textTransform:'uppercase',color:isDone?'#10b981':'var(--text2)'}},(isDone?'\u2713 ':'')+'Day '+d),h('h3',{style:{fontSize:'14px',fontWeight:700,margin:'1px 0 0'}},dy.name)));
if(!dy.isRest)hd.appendChild(h('button',{className:'btn btn-sm '+(isDone?'btn-secondary':'btn-primary'),onClick:function(){S.day=d;S.tab='track';S._trackManual=true;loadCL();R();}},isDone?'Review':'Track'));
bl.appendChild(hd);
if(!dy.isRest&&dy.ex){var bd=h('div',{style:{padding:'8px 14px'}});dy.ex.forEach(function(ex,i){
  if(ex.n&&(ex.n.indexOf('Dynamic Warm-Up')>-1||ex.n.indexOf('Dynamic Stretches')>-1))return;
  var row=h('div',{style:{padding:'5px 0',borderBottom:i<dy.ex.length-1?'1px solid var(--border)':'none'}});
  var top=h('div',{style:{display:'flex',justifyContent:'space-between'}});
  var exName=ex.n;if(ap.scElements&&ap.id.indexOf('sc_')===0){var m=applySCElements([{n:ex.n,s:ex.s,r:ex.r}],ap.scElements);if(m[0])exName=m[0].n;}
  top.appendChild(h('span',{style:{fontWeight:600,fontSize:'12px'}},exName));
  top.appendChild(h('span',{style:{color:'var(--text2)',fontSize:'11px'}},ex.s+'\u00D7'+ex.r));
  row.appendChild(top);
  // Show logged weights/reps if done
  if(isDone&&dayLog['e'+i]){var eld=dayLog['e'+i];var setStrs=[];
    Object.keys(eld).sort().forEach(function(sk){if(sk.startsWith('s')){var s=eld[sk];if(s.w||s.r)setStrs.push((s.w||'-')+'\u00D7'+(s.r||'-'));}});
    if(setStrs.length>0)row.appendChild(h('div',{style:{fontSize:'10px',color:'#10b981',fontWeight:600,marginTop:'2px'}},'\u2713 '+setStrs.join(' \u00B7 ')));}
  bd.appendChild(row);});bl.appendChild(bd);}
else if(dy.isRest)bl.appendChild(h('div',{style:{padding:'14px',textAlign:'center'}},h('p',{style:{color:'var(--text2)',fontSize:'12px'}},'Recovery day')));
// Show feeling + notes if logged
if(isDone&&dayLog.feeling){bl.appendChild(h('div',{style:{padding:'4px 14px 8px',fontSize:'10px',color:'var(--text2)'}},'Feeling: '+dayLog.feeling+'/10'+(dayLog.notes?' \u00B7 '+dayLog.notes:'')));}
el.appendChild(bl);})(dn);}return el;}
