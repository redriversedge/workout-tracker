// === CUSTOM / OUTSIDE WORKOUT ===
function rCWBtn(el,logKey){
  var btn=h('div',{className:'cw-card',onClick:function(){S.cwForm={type:'Group Fitness',name:'',dur:60,int:'Moderate',cal:'',notes:'',target:logKey};S.modal='customWk';R();}});
  btn.appendChild(h('p',{style:{fontSize:'22px',margin:'0 0 2px',color:'var(--accent)'}},'+'));
  btn.appendChild(h('p',{style:{fontSize:'12px',fontWeight:700,color:'var(--accent)'}},'Log Outside Workout'));
  btn.appendChild(h('p',{style:{fontSize:'10px',color:'var(--text2)'}},'Group class, cardio, sports \u2014 counts toward streaks'));
  el.appendChild(btn);
}
function rCWList(el){
  var today=localDateStr();
  var todayWks=(S.customWks||[]).filter(function(cw){return cw&&cw.date&&cw.date.startsWith(today);});
  if(todayWks.length===0)return;
  el.appendChild(h('h3',{style:{fontSize:'13px',fontWeight:700,margin:'12px 0 6px',color:'var(--text2)'}},'Additional Workouts Today'));
  todayWks.forEach(function(cw){
    var c=h('div',{className:'cw-log'});
    c.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
      h('div',null,
        h('p',{style:{fontWeight:700,fontSize:'13px',margin:0}},cw.name||cw.type),
        h('p',{style:{color:'var(--text2)',fontSize:'10px',margin:'2px 0 0'}},cw.type+' \u00B7 '+cw.dur+' min'+(cw.int?' \u00B7 '+cw.int:'')+(cw.cal?' \u00B7 ~'+cw.cal+' cal':''))
      ),
      h('button',{style:{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',padding:'4px'},innerHTML:svg('trash',14,'var(--danger)'),onClick:function(){
        var idx=S.customWks.indexOf(cw);if(idx>-1){S.customWks.splice(idx,1);sv();R();}
      }})
    ));
    if(cw.notes)c.appendChild(h('p',{style:{fontSize:'10px',color:'var(--text2)',marginTop:'4px',fontStyle:'italic'}},cw.notes));
    el.appendChild(c);
  });
}
function rCWModal(){
  var m=h('div',{className:'modal',style:{maxHeight:'80vh',overflowY:'auto'}});
  var f=S.cwForm||{};
  m.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}},
    h('h3',{style:{fontSize:'16px',fontWeight:700,margin:0}},'Log Outside Workout'),
    h('button',{style:{background:'none',border:'none',cursor:'pointer',padding:'4px'},innerHTML:svg('x',16,'var(--text2)'),onClick:function(){S.modal=null;R();}})
  ));
  // Type tags
  m.appendChild(h('p',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',marginBottom:'4px'}},'TYPE'));
  var tags=h('div',{style:{display:'flex',flexWrap:'wrap',marginBottom:'12px'}});
  ['Group Fitness','Spin Class','CrossFit','Swimming','Basketball','Soccer','Hiking','Cycling','Boxing','Dance','Martial Arts','Yoga Class','Boot Camp','Other'].forEach(function(t){
    tags.appendChild(h('button',{className:'cw-tag'+((f.type||'Group Fitness')===t?' active':''),onClick:function(){f.type=t;R();}},t));
  });m.appendChild(tags);
  // Name
  m.appendChild(h('p',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',marginBottom:'4px'}},'NAME / DESCRIPTION'));
  var nameI=h('input',{className:'input',placeholder:'e.g. "HIIT at Orange Theory"',value:f.name||'',style:{marginBottom:'10px'}});
  nameI.addEventListener('input',function(e){f.name=e.target.value;});m.appendChild(nameI);
  // Duration
  m.appendChild(h('p',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',marginBottom:'4px'}},'DURATION (min)'));
  var dRow=h('div',{className:'pill-row',style:{marginBottom:'10px'}});
  [20,30,45,60,75,90].forEach(function(d){dRow.appendChild(h('button',{className:'pill'+((f.dur||60)===d?' active':''),onClick:function(){f.dur=d;R();}},''+d));});m.appendChild(dRow);
  // Intensity
  m.appendChild(h('p',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',marginBottom:'4px'}},'INTENSITY'));
  var iRow=h('div',{className:'pill-row',style:{marginBottom:'10px'}});
  ['Light','Moderate','Hard','Max Effort'].forEach(function(i){iRow.appendChild(h('button',{className:'pill'+((f.int||'Moderate')===i?' active':''),onClick:function(){f.int=i;R();}},i));});m.appendChild(iRow);
  // Calories
  m.appendChild(h('p',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',marginBottom:'4px'}},'ESTIMATED CALORIES (optional)'));
  var calI=h('input',{className:'input',type:'number',inputMode:'numeric',placeholder:'e.g. 400',value:f.cal||'',style:{marginBottom:'10px'}});
  calI.addEventListener('input',function(e){f.cal=e.target.value;});m.appendChild(calI);
  // Notes
  m.appendChild(h('p',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',marginBottom:'4px'}},'NOTES (optional)'));
  var notesI=h('textarea',{className:'input',placeholder:'What did you do?',value:f.notes||'',style:{minHeight:'50px',resize:'vertical',marginBottom:'12px'}});
  notesI.addEventListener('input',function(e){f.notes=e.target.value;});m.appendChild(notesI);
  // Context message
  var hasLog=f.target&&S.logs[f.target];
  if(hasLog){
    m.appendChild(h('div',{style:{background:'rgba(16,185,129,0.08)',borderRadius:'8px',padding:'10px',marginBottom:'12px',border:'1px solid rgba(16,185,129,0.2)'}},
      h('p',{style:{fontSize:'11px',color:'#10b981',fontWeight:600}},"\u2713 You already completed today's programmed workout. This adds as a bonus workout for the day!")
    ));
  }else if(f.target){
    m.appendChild(h('div',{style:{background:'rgba(59,130,246,0.08)',borderRadius:'8px',padding:'10px',marginBottom:'12px',border:'1px solid rgba(59,130,246,0.2)'}},
      h('p',{style:{fontSize:'11px',color:'#3b82f6',fontWeight:600}},"This will replace today's programmed workout and count toward your streak and progress.")
    ));
  }
  // Buttons
  var btns=h('div',{style:{display:'flex',gap:'8px'}});
  btns.appendChild(h('button',{className:'btn btn-primary',style:{flex:1},onClick:function(){
    var cw={date:localISOStr(),name:f.name||(f.type||'Outside Workout'),type:f.type||'Group Fitness',dur:f.dur||60,int:f.int||'Moderate',cal:f.cal?parseInt(f.cal):null,notes:f.notes||'',target:f.target||null};
    if(!S.customWks)S.customWks=[];
    S.customWks.push(cw);
    // If replacing a programmed workout (slot not yet logged), mark slot as done
    if(f.target&&!S.logs[f.target]){
      S.logs[f.target]={date:cw.date,custom:true,customName:cw.name,customType:cw.type,feeling:null,dur:cw.dur*60};
    }
    S.modal=null;S.cwForm={};sv();toast('\u2705 Workout logged!');R();
  }},'Save Workout'));
  btns.appendChild(h('button',{className:'btn btn-secondary',onClick:function(){S.modal=null;S.cwForm={};R();}},'Cancel'));
  m.appendChild(btns);return m;
}

function rRestDay(el,dy){var rest=h('div',{className:'card',style:{textAlign:'center',padding:'28px'}});rest.appendChild(h('div',{style:{fontSize:'40px'}},'\uD83E\uDDD8'));rest.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,margin:'8px 0 4px'}},dy?dy.name:'Rest Day'));rest.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'13px',marginBottom:'16px'}},'Recovery is where gains happen.'));el.appendChild(rest);
// Rest Day Activity Logging
var today=localDateStr();
if(!S.restDayLogs)S.restDayLogs={};
var todayLog=S.restDayLogs[today]||{activities:[],notes:''};
var rlc=h('div',{className:'card',style:{marginBottom:'12px'}});
rlc.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'8px'}},'Log Recovery Activities'));
var rlGrid=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}});
REST_ACTIVITIES.forEach(function(act){
  var done=todayLog.activities.indexOf(act.id)>-1;
  var btn=h('button',{style:{background:done?'var(--accent-light)':'var(--card)',border:'1px solid '+(done?'var(--accent)':'var(--border)'),borderRadius:'10px',padding:'10px',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:'8px'},onClick:function(){
    if(!S.restDayLogs)S.restDayLogs={};if(!S.restDayLogs[today])S.restDayLogs[today]={activities:[],notes:''};
    var idx=S.restDayLogs[today].activities.indexOf(act.id);
    if(idx>-1)S.restDayLogs[today].activities.splice(idx,1);else S.restDayLogs[today].activities.push(act.id);sv();R();}});
  btn.appendChild(h('span',{style:{fontSize:'18px'}},act.icon));
  btn.appendChild(h('div',null,h('p',{style:{fontWeight:700,fontSize:'12px',margin:0,color:done?'var(--accent)':'var(--text)'}},act.name),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},act.dur)));
  rlGrid.appendChild(btn);
});
rlc.appendChild(rlGrid);
var rnote=h('textarea',{className:'input',placeholder:'How are you feeling today?',style:{marginTop:'8px',fontSize:'16px',minHeight:'40px',resize:'vertical'},value:todayLog.notes||''});
rnote.addEventListener('change',function(e){if(!S.restDayLogs)S.restDayLogs={};if(!S.restDayLogs[today])S.restDayLogs[today]={activities:[],notes:''};S.restDayLogs[today].notes=e.target.value;sv();});
rlc.appendChild(rnote);el.appendChild(rlc);

el.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,margin:'14px 0 8px'}},'Recovery Ideas'));
REST.forEach(function(act){var card=h('div',{style:{background:'var(--card)',borderRadius:'14px',padding:'14px',marginBottom:'10px',cursor:'pointer',border:'1px solid var(--border)',boxShadow:'var(--shadow)'}});
card.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'10px'}},h('span',{style:{fontSize:'22px'}},act.icon),h('div',null,h('h4',{style:{fontSize:'14px',fontWeight:700,margin:0}},act.name),h('p',{style:{color:'var(--text2)',fontSize:'10px'}},act.dur))));
var exp=!!S.show['r_'+act.name];card.addEventListener('click',function(){S.show['r_'+act.name]=!S.show['r_'+act.name];R();});
if(exp){card.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px',margin:'10px 0',lineHeight:'1.5'}},act.desc));
act.steps.forEach(function(step,i){card.appendChild(h('div',{style:{display:'flex',gap:'8px',marginBottom:'6px'}},h('span',{style:{background:'var(--accent)',color:'#fff',borderRadius:'50%',width:'18px',height:'18px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,flexShrink:0}},''+(i+1)),h('p',{style:{fontSize:'12px',lineHeight:'1.4',margin:0}},step)));});}
el.appendChild(card);});return el;}
