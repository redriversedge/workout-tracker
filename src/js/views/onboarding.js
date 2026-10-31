// === ONBOARDING ===
var OBQ=[
{id:"name",q:"What should we call you?",t:"text",ph:"Your name or nickname"},
{id:"sex",q:"Biological sex",sub:"Helps calibrate strength standards and recovery.",t:"single",opts:["Male","Female","Prefer not to disclose"],cu:1},
{id:"pregnant",q:"Are you currently pregnant?",sub:"This changes your programming for safety.",t:"single",opts:["No","Yes \u2014 1st trimester","Yes \u2014 2nd trimester","Yes \u2014 3rd trimester"],cu:1,cond:function(){return S.profile.sex==='Female';}},
{id:"level",q:"What's your fitness level?",sub:"Be honest \u2014 we'll build from where you are.",t:"single",opts:["Just Starting Out","Beginner","Intermediate","Advanced"],cu:1},
{id:"goals",q:"What are your primary goals?",sub:"Select all that apply",t:"multi",opts:["Strength","Muscle Building","Fat Loss","General Fitness","Endurance","Flexibility & Mobility","Running","HIIT / Conditioning","Pilates","Prenatal Fitness"],cu:1},
{id:"strengthFocus",q:"What type of strength training?",sub:"This determines your program style.",t:"single",opts:["Pure Strength (build max strength)","Strength & Conditioning (strength + conditioning blend)","Muscle Building (hypertrophy focus)"],cu:1,cond:function(){return Array.isArray(S.profile.goals)&&(S.profile.goals.indexOf('Strength')>-1||S.profile.goals.indexOf('Muscle Building')>-1||S.profile.goals.indexOf('General Fitness')>-1||S.profile.goals.indexOf('Fat Loss')>-1);}},
{id:"runGoal",q:"What's your running goal?",sub:"This shapes your running program structure.",t:"single",opts:["Just starting (walk to run)","General fitness running","5K","10K","Half Marathon","Marathon","Sprint / Track","Trail Running"],cu:1,cond:function(){return Array.isArray(S.profile.goals)&&S.profile.goals.indexOf('Running')>-1;}},
{id:"flexGoal",q:"What's your flexibility focus?",sub:"This shapes your mobility programming.",t:"single",opts:["General flexibility","Recovery & injury prevention","Athletic mobility","Pilates core & stability","Prenatal mobility","Stress relief & relaxation"],cu:1,cond:function(){return Array.isArray(S.profile.goals)&&(S.profile.goals.indexOf('Flexibility & Mobility')>-1||S.profile.goals.indexOf('Pilates')>-1||S.profile.goals.indexOf('Prenatal Fitness')>-1);}},
{id:"scElements",q:"Add training elements?",sub:"Select any that interest you, or skip to move on.",t:"multi",opts:["No preference","Barbell-focused compounds","Kettlebell conditioning","Dumbbell complexes","HIIT finishers"],cu:1,opt:true,cond:function(){return S.profile.strengthFocus==='Strength & Conditioning (strength + conditioning blend)';}},
{id:"days",q:"How many days per week?",sub:"",t:"single",opts:["2 days","3 days","4 days","5 days","6 days"],
  redRec:function(){
    var p=S.profile,lvl=p.level||'Beginner',goals=Array.isArray(p.goals)?p.goals:[];
    var rec=4,reason='';
    if(lvl==='Just Starting Out'){rec=3;reason="you're building your foundation \u2014 3 days gives you enough stimulus with plenty of recovery.";}
    else if(lvl==='Beginner'){rec=3;reason="at the beginner stage, 3 days hits the sweet spot for building consistency without overdoing it.";}
    else if(lvl==='Intermediate'){
      if(goals.indexOf('Running')>-1&&goals.indexOf('Strength')>-1){rec=5;reason="combining strength and running, 5 days lets you cover both without stacking too much.";}
      else{rec=4;reason="4 days gives you the volume to progress while keeping recovery solid.";}
    }
    else if(lvl==='Advanced'){rec=5;reason="at your level, 5 days keeps the intensity high with enough frequency to drive adaptation.";}
    if(goals.indexOf('General Fitness')>-1&&rec>4){rec=4;reason="for general fitness, 4 days is the sweet spot \u2014 strong results without burning out.";}
    return{days:rec,reason:reason};
  }},
{id:"time",q:"How much time per session?",t:"single",opts:["20 min","30 min","45 min","60 min","90 min"],cu:1},
{id:"equipment",q:"What equipment do you have?",sub:"Select all that apply",t:"multi",opts:["Full Gym","Barbells & Racks","Dumbbells","Kettlebells","Pull-Up Bar","Resistance Bands","Yoga Mat","Foam Roller","Medicine Ball","Cable Machine","Bodyweight Only"],cu:1},
{id:"equipPref",q:"Preferred equipment for strength?",sub:"We'll build your program around this.",t:"single",opts:["Barbells & Racks","Dumbbells","Kettlebells","Bodyweight","No preference (mix it up)"],cu:1,cond:function(){return Array.isArray(S.profile.goals)&&(S.profile.goals.indexOf('Strength')>-1||S.profile.goals.indexOf('Muscle Building')>-1||S.profile.goals.indexOf('General Fitness')>-1||S.profile.goals.indexOf('Fat Loss')>-1);}},
{id:"injuries",q:"Any injuries or limitations?",sub:"We'll modify exercises to keep you safe.",t:"multi",opts:["None","Lower Back","Shoulders","Knees","Wrists","Neck","Hips","Ankles","Elbows"],cu:1},
{id:"measurements",q:"Starting measurements",sub:"Track your progress over time. All optional \u2014 skip any you want.",t:"measure"}
]

function getActiveOBQ(){return OBQ.filter(function(q){return !q.cond||q.cond();});}
function rOB(){var activeQs=getActiveOBQ();var qIdx=Math.min(S.obStep,activeQs.length-1);var q=activeQs[qIdx],val=S.profile[q.id],isL=qIdx===activeQs.length-1;
var can=q.t==='text'?(val&&val.trim()):q.t==='measure'?true:q.opt?true:(q.t==='single'?!!val:(Array.isArray(val)&&val.length>0));
var w=h('div',{className:'ob-wrap'}),card=h('div',{className:'ob-card',style:{position:'relative'}});
// X button \u2014 exit setup without completing
var xBtn=h('button',{style:{position:'absolute',top:'12px',right:'12px',background:'none',border:'none',fontSize:'18px',color:'var(--text2)',cursor:'pointer',padding:'4px 8px',zIndex:10,lineHeight:1,opacity:.6},onClick:function(){
  // Apply sensible defaults for missing fields
  if(!S.profile.level)S.profile.level='Intermediate';
  if(!S.profile.days)S.profile.days='4 days';
  if(!S.profile.time)S.profile.time='45 min';
  if(!S.profile.equipment)S.profile.equipment=['Full Gym'];
  if(!S.profile.injuries)S.profile.injuries=['None'];
  S.profile._setupComplete=false;
  // Auto-enroll if we have enough info
  if(S.profile.goals&&S.profile.goals.length>0&&S.enrolled.length===0){
    try{var auto=autoEnrollProgram();if(auto.length>0){auto.forEach(function(ep){ep.startDate=localISOStr();});S.enrolled=auto;S.active=auto[0].id;S.week=1;S.day=1;}}catch(e){}
  }
  S.startDate=S.startDate||localISOStr();
  S.screen='app';S.tab='profile';sv();R();
}});
xBtn.appendChild(h('span',null,'\u2715'));
card.appendChild(xBtn);
var dots=h('div',{className:'ob-dots'});for(var i=0;i<activeQs.length;i++)dots.appendChild(h('div',{className:'ob-dot'+(i<=S.obStep?' filled':'')}));card.appendChild(dots);
card.appendChild(h('div',{style:{textAlign:'center',marginBottom:'20px'}},h('div',{style:{fontSize:'28px'},innerHTML:REDWOLF_SVG.replace('width="22"','width="40"').replace('height="22"','height="40"')}),h('h1',{style:{fontSize:'18px',fontWeight:800,margin:'4px 0 0'}},'RedRiversEdgeFitness'),h('p',{className:'label',style:{marginTop:'3px'}},'Step '+(S.obStep+1)+'/'+activeQs.length)));
var qc=h('div',{className:'card',style:{padding:'20px'}});qc.appendChild(h('h2',{style:{fontSize:'17px',fontWeight:700}},q.q));
if(q.sub)qc.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px',marginTop:'4px'}},q.sub));
var body=h('div',{style:{marginTop:'14px'}});

if(q.t==='text'){var inp=h('input',{className:'input',type:'text',placeholder:q.ph,value:val||'',id:'ob-inp'});
inp.addEventListener('input',function(e){S.profile[q.id]=e.target.value;sv();var nb=document.getElementById('ob-nx');if(nb)nb.style.opacity=e.target.value.trim()?'1':'0.5';});
inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&S.profile[q.id]&&S.profile[q.id].trim()){S.obStep++;S.ci='';R();}});
body.appendChild(inp);setTimeout(function(){var el=document.getElementById('ob-inp');if(el)el.focus();},100);
}else if(q.t==='measure'){
// Measurement inputs for onboarding
var meas=S.profile.measurements||{};

// HEIGHT \u2014 feet/inches dropdowns
var htRow=h('div',{style:{marginBottom:'14px'}});
htRow.appendChild(h('label',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',display:'block',marginBottom:'6px'}},'Height'));
var htWrap=h('div',{style:{display:'flex',gap:'10px',alignItems:'center'}});
var curTotalIn=parseInt(meas.height)||0;
var curFt=curTotalIn>0?Math.floor(curTotalIn/12):0;
var curIn=curTotalIn>0?curTotalIn%12:0;
// Feet dropdown
var ftSel=h('select',{className:'input',style:{padding:'10px 12px',fontSize:'14px',flex:'1',WebkitAppearance:'auto',appearance:'auto'}});
ftSel.appendChild(h('option',{value:''},'Ft'));
for(var fi=4;fi<=7;fi++){var fo=h('option',{value:''+fi},fi+"'");if(fi===curFt&&curTotalIn>0)fo.selected=true;ftSel.appendChild(fo);}
// Inches dropdown
var inSel=h('select',{className:'input',style:{padding:'10px 12px',fontSize:'14px',flex:'1',WebkitAppearance:'auto',appearance:'auto'}});
inSel.appendChild(h('option',{value:''},'In'));
for(var ii=0;ii<=11;ii++){var io=h('option',{value:''+ii},ii+'"');if(ii===curIn&&curTotalIn>0)io.selected=true;inSel.appendChild(io);}
function saveHt(){var f=parseInt(ftSel.value)||0;var i=parseInt(inSel.value)||0;if(f>0){if(!S.profile.measurements)S.profile.measurements={};S.profile.measurements.height=''+(f*12+i);sv();}}
ftSel.addEventListener('change',saveHt);inSel.addEventListener('change',saveHt);
htWrap.appendChild(ftSel);htWrap.appendChild(inSel);
htRow.appendChild(htWrap);body.appendChild(htRow);

// Weight \u2014 free type number input
var wtRow=h('div',{style:{marginBottom:'14px'}});
wtRow.appendChild(h('label',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',display:'block',marginBottom:'6px'}},'Weight'));
var wtWrap=h('div',{style:{display:'flex',gap:'8px',alignItems:'center'}});
var wtInp=h('input',{className:'input',type:'number',inputMode:'decimal',placeholder:'e.g. 185',value:meas.weight||'',style:{padding:'10px 12px',fontSize:'16px',flex:'1'}});
var wtUnit=h('span',{style:{fontSize:'13px',fontWeight:700,color:'var(--text2)',whiteSpace:'nowrap'}},'lbs');
var wtErr=h('p',{style:{fontSize:'10px',color:'var(--danger)',margin:'4px 0 0',display:'none'},id:'wt-err'},'Weight should be between 50-500 lbs');
wtInp.addEventListener('input',function(e){
  var v=parseFloat(e.target.value);
  var errEl=document.getElementById('wt-err');
  if(e.target.value&&(isNaN(v)||v<50||v>500)){if(errEl)errEl.style.display='block';}
  else{if(errEl)errEl.style.display='none';if(!S.profile.measurements)S.profile.measurements={};S.profile.measurements.weight=e.target.value;sv();}
});
wtWrap.appendChild(wtInp);wtWrap.appendChild(wtUnit);
wtRow.appendChild(wtWrap);wtRow.appendChild(wtErr);body.appendChild(wtRow);

// Body measurement dropdowns (chest, waist, hips, arms - all optional)
var measDD=[{k:'chest',l:'Chest',mn:20,mx:70},{k:'waist',l:'Waist',mn:20,mx:60},{k:'hips',l:'Hips',mn:25,mx:65},{k:'arms',l:'Arms',mn:8,mx:50}];
measDD.forEach(function(f){var row=h('div',{style:{marginBottom:'10px'}});
row.appendChild(h('label',{style:{fontSize:'11px',fontWeight:700,color:'var(--text2)',display:'block',marginBottom:'3px'}},f.l+' (in) \u2014 optional'));
var sel=h('select',{className:'input',style:{padding:'10px 12px',fontSize:'14px',WebkitAppearance:'auto',appearance:'auto'}});
sel.appendChild(h('option',{value:''},'Skip'));
for(var mi=f.mn*2;mi<=f.mx*2;mi++){var v=mi%2===0?''+(mi/2):''+(mi/2).toFixed(1);var so=h('option',{value:v},v+'"');if(meas[f.k]===v)so.selected=true;sel.appendChild(so);}
(function(key){sel.addEventListener('change',function(e){if(!S.profile.measurements)S.profile.measurements={};S.profile.measurements[key]=e.target.value;sv();});})(f.k);
row.appendChild(sel);body.appendChild(row);});
}else{
// Red's recommendation for this question
if(q.redRec){var rec=q.redRec();var recOpt=rec.days+' days';
  var recCard=h('div',{style:{background:'var(--accent-light)',borderRadius:'10px',padding:'12px',marginBottom:'12px',borderLeft:'3px solid var(--accent)'}});
  var recTop=h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}});
  recTop.appendChild(h('div',{style:{width:'24px',height:'24px',borderRadius:'7px',background:'linear-gradient(135deg,#c8102e,#8b0000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff',fontWeight:800,flexShrink:0}},'R'));
  recTop.appendChild(h('span',{style:{fontWeight:700,fontSize:'12px',color:'var(--accent)'}},'Red recommends: '+recOpt));
  recCard.appendChild(recTop);
  recCard.appendChild(h('p',{style:{fontSize:'11px',lineHeight:'1.5',color:'var(--text)',margin:0}},rec.reason?'Based on your profile, '+rec.reason+' But you know your schedule best.':''));
  body.appendChild(recCard);
  if(!S.profile[q.id])S.profile[q.id]=recOpt;
}
var pills=h('div',{className:'pill-wrap'});q.opts.forEach(function(opt){var sel=q.t==='single'?val===opt:(Array.isArray(val)&&val.indexOf(opt)>-1);var b=h('button',{className:'pill'+(sel?' active':'')},(sel?'\u2713 ':'')+opt);b.addEventListener('click',function(){if(q.t==='single')S.profile[q.id]=opt;else{var c=Array.isArray(val)?val.slice():[];if(opt==='None')c=['None'];else{c=c.filter(function(v){return v!=='None';});var i=c.indexOf(opt);i>-1?c.splice(i,1):c.push(opt);}S.profile[q.id]=c;}sv();R();});pills.appendChild(b);});body.appendChild(pills);
if(q.opt){var skipBtn=h("button",{className:"btn btn-secondary",style:{marginTop:"12px",width:"100%",padding:"10px",fontSize:"13px"},onClick:function(){S.obStep++;S.ci="";R();}});skipBtn.textContent="Skip this step \u2192";body.appendChild(skipBtn);}
if(q.cu){var row=h('div',{style:{display:'flex',gap:'6px',marginTop:'12px'}});var ci=h('input',{className:'input',placeholder:'Other',value:S.ci||'',style:{flex:1,padding:'10px',fontSize:'16px'},id:'ob-ci'});ci.addEventListener('input',function(e){S.ci=e.target.value;});ci.addEventListener('keydown',function(e){if(e.key==='Enter')addC(q);});row.appendChild(ci);row.appendChild(h('button',{className:'btn btn-primary btn-sm',innerHTML:svg('plus',14,'#fff'),onClick:function(){addC(q);}}));body.appendChild(row);}}
qc.appendChild(body);card.appendChild(qc);
var nav=h('div',{style:{display:'flex',justifyContent:'space-between',marginTop:'16px'}});
nav.appendChild(h('button',{className:'btn btn-secondary',style:{visibility:S.obStep>0?'visible':'hidden'},innerHTML:svg('left',14)+' Back',onClick:function(){if(S.obStep>0){S.obStep--;S.ci='';R();}}}));
nav.appendChild(h('button',{className:'btn btn-primary',style:{opacity:can?1:.5,padding:'12px 24px'},id:'ob-nx',innerHTML:(isL?"Let's Go! ":(q.opt?'Skip / Next ':'Next '))+svg('right',14,'#fff'),onClick:function(){var aq=getActiveOBQ(),qi=Math.min(S.obStep,aq.length-1),qq=aq[qi],vv=S.profile[qq.id];var ok=qq.t==='text'?(vv&&vv.trim()):qq.t==='measure'?true:(qq.t==='single'?!!vv:(Array.isArray(vv)&&vv.length>0));if(!ok)return;qi===aq.length-1?finOB():(S.obStep++,S.ci='',R());}}));
card.appendChild(nav);w.appendChild(card);return w;}
function addC(q){var v=(S.ci||'').trim();if(!v)return;if(q.t==='single')S.profile[q.id]=v;else{var c=Array.isArray(S.profile[q.id])?S.profile[q.id].filter(function(x){return x!=='None';}):[];c.push(v);S.profile[q.id]=c;}S.ci='';sv();R();}
function applySCElements(exercises, elements){
  if(!elements||!Array.isArray(elements)||elements.length===0)return exercises;
  var mods=exercises.slice();
  var hasBB=elements.indexOf('Barbell-focused compounds')>-1;
  var hasKB=elements.indexOf('Kettlebell conditioning')>-1;
  var hasDB=elements.indexOf('Dumbbell complexes')>-1;
  var hasHIIT=elements.indexOf('HIIT finishers')>-1;
  
  // Swap and enhance exercises based on elements
  mods=mods.map(function(ex){
    var e=Object.assign({},ex);
    if(hasBB){
      if(e.n==='Goblet Squat')e.n='Barbell Back Squat';
      else if(e.n==='Dumbbell Bench Press')e.n='Barbell Bench Press';
      else if(e.n==='Dumbbell Romanian Deadlift')e.n='Barbell Romanian Deadlift';
      else if(e.n==='Dumbbell Overhead Press')e.n='Barbell Overhead Press';
      else if(e.n==='Dumbbell Row')e.n='Barbell Bent-Over Row';
      else if(e.n==='Dumbbell Front Squat')e.n='Barbell Front Squat';
      else if(e.n==='Dumbbell Walking Lunges')e.n='Barbell Walking Lunges';
    }
    if(hasKB){
      if(e.n==='Dumbbell Snatch')e.n='Kettlebell Snatch';
      else if(e.n==='Dumbbell Thrusters'&&!hasBB)e.n='Kettlebell Clean & Press';
      else if(e.n==='Dumbbell Curl to Press')e.n='Kettlebell Clean & Press';
    }
    if(hasDB){
      if(e.n==='Barbell Bent-Over Row'&&!hasBB)e.n='Dumbbell Renegade Row';
      if(e.n==='Kettlebell Swing'&&!hasKB)e.n='Dumbbell Swing';
    }
    return e;
  });

  // Add HIIT finisher if selected
  if(hasHIIT){
    var last=mods[mods.length-1];
    if(last&&(last.n.indexOf('Stretch')>-1||last.n.indexOf('Foam Roll')>-1||last.n.indexOf('Cool-Down')>-1)){
      // Insert HIIT finisher before cooldown
      var finishers=['Tabata Burpees','AMRAP 5min: 10 KB Swing + 5 Burpees','EMOM 8min: 5 Thrusters + 10 Mountain Climbers','Tabata Mountain Climbers'];
      var pick=finishers[Math.floor(Math.random()*finishers.length)];
      mods.splice(mods.length-1,0,{n:pick,s:1,r:'see description'});
    } else {
      mods.push({n:'EMOM 5min: 3 Burpees + 5 KB Swings',s:1,r:'see description'});
    }
  }

  return mods;
}

function autoEnrollProgram(){
  var p=S.profile,lvl=p.level||'Beginner',goals=Array.isArray(p.goals)?p.goals:[],equip=Array.isArray(p.equipment)?p.equipment:[];
  var lvlMap={'Just Starting Out':'jso','Beginner':'beg','Intermediate':'int','Advanced':'adv'};
  var lvlKey=lvlMap[lvl]||'beg';
  var enrolled=[];

  // Determine equipment preference
  var ep=p.equipPref||'No preference (mix it up)';
  var eqKey='bb';
  if(ep.indexOf('Dumbbell')>-1)eqKey='db';
  else if(ep.indexOf('Kettlebell')>-1)eqKey='kb';
  else if(ep.indexOf('Bodyweight')>-1)eqKey='bw';
  else if(ep==='No preference (mix it up)'){
    if(equip.indexOf('Barbells & Racks')>-1)eqKey='bb';
    else if(equip.indexOf('Dumbbells')>-1)eqKey='db';
    else if(equip.indexOf('Kettlebells')>-1)eqKey='kb';
    else eqKey='bw';
  }

  // Strength-type program
  var sf=p.strengthFocus||'';
  var needsStrength=goals.indexOf('Strength')>-1||goals.indexOf('Muscle Building')>-1||goals.indexOf('General Fitness')>-1||goals.indexOf('Fat Loss')>-1||goals.indexOf('HIIT / Conditioning')>-1;

  if(needsStrength){
    if(sf.indexOf('Strength & Conditioning')>-1){
      var scId='sc_'+lvlKey;
      if(PROGRAMS[scId]&&PROGRAMS[scId].data){
        var scEnroll={id:scId,days:PROGRAMS[scId].daysPerWeek,week:1,day:1};
        if(Array.isArray(p.scElements))scEnroll.scElements=p.scElements;
        enrolled.push(scEnroll);
      }
    } else {
      var strId='str_'+lvlKey+'_'+eqKey;
      if(PROGRAMS[strId])enrolled.push({id:strId,days:PROGRAMS[strId].daysPerWeek,week:1,day:1});
    }
  }
  if(goals.indexOf('HIIT / Conditioning')>-1&&sf.indexOf('Strength & Conditioning')===-1){
    var hiitId=lvlKey==='adv'?'hiit_adv':(lvlKey==='int'?'hiit_int':'hiit_jso');
    if(PROGRAMS[hiitId]&&!enrolled.find(function(e){return e.id===hiitId;}))enrolled.push({id:hiitId,days:PROGRAMS[hiitId].daysPerWeek,week:1,day:1});
  }

  // Running
  if(goals.indexOf('Running')>-1){
    var rg=p.runGoal||'General fitness running';
    var runId='run_jso';
    if(rg.indexOf('5K')>-1)runId='run_5k';
    else if(rg.indexOf('10K')>-1)runId='run_10k';
    else if(rg.indexOf('Half')>-1)runId='run_half';
    else if(rg.indexOf('Marathon')>-1)runId='run_marathon';
    else if(rg.indexOf('Sprint')>-1||rg.indexOf('Track')>-1)runId='run_sprint';
    else if(rg.indexOf('Just starting')>-1||lvlKey==='jso')runId='run_jso';
    if(PROGRAMS[runId])enrolled.push({id:runId,days:PROGRAMS[runId].daysPerWeek,week:1,day:1});
  }

  // Flexibility / Pilates / Prenatal
  if(goals.indexOf('Flexibility & Mobility')>-1||goals.indexOf('Pilates')>-1||goals.indexOf('Prenatal Fitness')>-1){
    var fg=p.flexGoal||'General flexibility';
    var flexId='flex_general';
    if(fg.indexOf('Athletic')>-1)flexId='flex_athletic';
    else if(fg.indexOf('Pilates')>-1)flexId='flex_pilates';
    else if(fg.indexOf('Prenatal')>-1)flexId='flex_prenatal';
    else if(lvlKey==='jso')flexId='flex_jso';
    if(PROGRAMS[flexId])enrolled.push({id:flexId,days:PROGRAMS[flexId].daysPerWeek,week:1,day:1});
  }

  // Fallback: if nothing matched, enroll in the best general program
  if(enrolled.length===0){
    var fallback='str_'+lvlKey+'_'+eqKey;
    if(PROGRAMS[fallback])enrolled.push({id:fallback,days:PROGRAMS[fallback].daysPerWeek,week:1,day:1});
  }

  console.log('[RRE] autoEnroll result:',enrolled.map(function(e){return e.id;}));
return enrolled;
}

function finOB(){try{console.log('[RRE] finOB starting');
  S.profile._setupComplete=true;
  // Save initial measurements as first body log entry
  var m=S.profile.measurements||{};
  if(m.weight||m.chest||m.waist||m.hips||m.arms){
    S.bodyLogs.push({date:localDateStr(),wt:m.weight||'',ch:m.chest||'',wa:m.waist||'',hp:m.hips||'',ar:m.arms||''});
  }
  // Auto-enroll based on selections
  var autoPrograms=autoEnrollProgram();
  if(autoPrograms.length>0){
    autoPrograms.forEach(function(ep){ep.startDate=localISOStr();});S.enrolled=autoPrograms;
    // Set active to first enrolled
    S.active=autoPrograms[0].id;
    // Set week/day from first program
    S.week=1;S.day=1;
    // Generate Red welcome message
    var names=autoPrograms.map(function(e){return PROGRAMS[e.id]?PROGRAMS[e.id].name:e.id;});
    S.chatMsgs=[{role:'assistant',text:"Welcome to RedRiversEdgeFitness, "+(S.profile.name||'Athlete')+"! I'm Red, your coach. Based on your goals, I've set you up with: "+names.join(', ')+". Your first workout is ready \u2014 head to the Track tab whenever you are. Let's get after it."}];
  }
  S.startDate=S.startDate||localISOStr();S.screen='app';S.tab='home';sv();R();
}catch(e){console.error('finOB error:',e);S.screen='app';S.tab='home';S.enrolled=S.enrolled||[];sv();R();}}
