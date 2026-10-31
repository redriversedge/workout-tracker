// === PROGRESS ===
function rProgress(){var el=h('div',{className:'page active'});el.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,marginBottom:'14px'}},'Progress'));
var ap=gAP(),pd=ap?gPD(ap.id):null;

// === OVERALL TRAINING SUMMARY (works even without active program) ===
var totalSessions=0,totalVol=0,totalSets=0,totalCustom=S.customWks?S.customWks.length:0,totalDur=0,dates=[];
Object.keys(S.logs).forEach(function(k){var l=S.logs[k];if(!l||!l.date)return;totalSessions++;dates.push(l.date.split('T')[0]);
  if(l.dur)totalDur+=l.dur;
  Object.keys(l).forEach(function(ek){if(ek.startsWith('e'))Object.keys(l[ek]).forEach(function(sk){if(sk.startsWith('s')){totalSets++;var s=l[ek][sk];totalVol+=(parseFloat(s.w)||0)*(parseFloat(s.r)||0);}});});});

if(totalSessions>0||totalCustom>0){
  var sC=h('div',{className:'card'});sC.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'\uD83D\uDCCA Training Summary'));
  var sg=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}});
  sg.appendChild(h('div',{style:{textAlign:'center'}},h('p',{style:{fontSize:'22px',fontWeight:800,margin:0,color:'var(--accent)'}},''+(totalSessions+totalCustom)),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'total workouts')));
  sg.appendChild(h('div',{style:{textAlign:'center'}},h('p',{style:{fontSize:'22px',fontWeight:800,margin:0}},(totalVol/1000).toFixed(1)+'k'),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'lbs moved')));
  sg.appendChild(h('div',{style:{textAlign:'center'}},h('p',{style:{fontSize:'22px',fontWeight:800,margin:0}},''+totalSets),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'total sets')));
  sC.appendChild(sg);

  // Streak + consistency
  var streak=getStreakNum();
  var _udSeen={};var uniqueDays=0;dates.forEach(function(d){if(!_udSeen[d]){_udSeen[d]=1;uniqueDays++;}});
  var sg2=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginTop:'12px',paddingTop:'10px',borderTop:'1px solid var(--border)'}});
  sg2.appendChild(h('div',{style:{textAlign:'center'}},h('p',{style:{fontSize:'22px',fontWeight:800,margin:0,color:'#f59e0b'}},streak+''),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'wk streak \uD83D\uDD25')));
  sg2.appendChild(h('div',{style:{textAlign:'center'}},h('p',{style:{fontSize:'22px',fontWeight:800,margin:0}},uniqueDays+''),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'training days')));
  sg2.appendChild(h('div',{style:{textAlign:'center'}},h('p',{style:{fontSize:'22px',fontWeight:800,margin:0}},totalCustom+''),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'outside wkts')));
  sC.appendChild(sg2);el.appendChild(sC);
}

// === STREAK & CONSISTENCY ===
var _streak=getStreak();
var _streakCard=h('div',{className:'card',style:{marginBottom:'12px'}});
_streakCard.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'8px'}},'\uD83D\uDD25 Consistency'));
var _streakRow=h('div',{style:{display:'flex',gap:'12px',marginBottom:'10px'}});
[{v:_streak.current||0,l:'Week Streak'},{v:_streak.thisWeek||0,l:'This Week'},{v:_streak.totalDays||0,l:'Total Sessions'}].forEach(function(item){
  _streakRow.appendChild(h('div',{style:{flex:1,textAlign:'center',padding:'8px',background:'var(--bg)',borderRadius:'8px'}},
    h('div',{style:{fontSize:'20px',fontWeight:800,color:'var(--accent)'}},String(item.v)),
    h('div',{style:{fontSize:'9px',color:'var(--text2)',marginTop:'2px'}},item.l)));
});
_streakCard.appendChild(_streakRow);
// Heat map (12 weeks)
var _hm=getHeatMap();
var _hmWrap=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:'2px'}});
_hm.forEach(function(wk){
  wk.forEach(function(day){
    var clr=day.count===0?'var(--border)':day.count===1?'rgba(200,16,46,0.4)':'rgba(200,16,46,0.8)';
    _hmWrap.appendChild(h('div',{style:{aspectRatio:'1',borderRadius:'2px',background:clr,minHeight:'8px'},title:day.date+': '+day.count}));
  });
});
_streakCard.appendChild(h('p',{style:{fontSize:'9px',color:'var(--text2)',marginBottom:'4px'}},'Last 12 weeks'));
_streakCard.appendChild(_hmWrap);
el.appendChild(_streakCard);

// === ESTIMATED 1RM TRACKING ===
if(ap&&pd&&pd.type!=='running'&&pd.type!=='flexibility'){
  var _rmCard=h('div',{className:'card',style:{marginBottom:'12px'}});
  _rmCard.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'8px'}},'\uD83D\uDCAA Estimated 1RM'));
  var _compounds=['Barbell Bench Press','Barbell Back Squat','Barbell Deadlift','Barbell Overhead Press','Barbell Romanian Deadlift','Barbell Bent-Over Row'];
  var _hasAny1RM=false;
  _compounds.forEach(function(cn){
    var rm=getExercise1RM(cn);
    if(rm>0){_hasAny1RM=true;
      var _row=h('div',{style:{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:'12px',cursor:'pointer'},onClick:function(){S.modal={type:'exHistory',exName:cn};R();}});
      _row.appendChild(h('span',{style:{fontWeight:600}},cn.replace('Barbell ','')));
      _row.appendChild(h('span',{style:{color:'var(--accent)',fontWeight:700}},rm+' lbs'));
      _rmCard.appendChild(_row);
    }
  });
  if(!_hasAny1RM)_rmCard.appendChild(h('p',{style:{fontSize:'11px',color:'var(--text2)'}},'Complete workouts to see estimated 1RM for key lifts.'));
  el.appendChild(_rmCard);
}

// === DELOAD WARNING ===
if(ap&&pd&&needsDeload(ap,pd)){
  var _dlCard=h('div',{className:'card',style:{marginBottom:'12px',borderLeft:'3px solid var(--warn)'}});
  _dlCard.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'8px'}},
    h('div',{style:{width:'24px',height:'24px',borderRadius:'7px',background:'linear-gradient(135deg,#c8102e,#8b0000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff',fontWeight:800}},'R'),
    h('span',{style:{fontWeight:700,fontSize:'13px'}},'Deload Recommended')));
  _dlCard.appendChild(h('p',{style:{fontSize:'11px',color:'var(--text)',lineHeight:'1.5',marginTop:'6px'}},"You have been pushing hard for 3+ weeks at high intensity. Consider reducing weights by 40-50% this week and focusing on movement quality. Your body builds strength during recovery, not just during training."));
  el.appendChild(_dlCard);
}

// === WEEKLY RED CHECK-IN ===
var _wStats=getWeeklyStats();
if(_wStats.cur.sessions>0||_wStats.prev.sessions>0){
  var _wkCard=h('div',{className:'card',style:{marginBottom:'12px',borderLeft:'3px solid var(--accent)'}});
  _wkCard.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}},
    h('div',{style:{width:'24px',height:'24px',borderRadius:'7px',background:'linear-gradient(135deg,#c8102e,#8b0000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff',fontWeight:800}},'R'),
    h('span',{style:{fontWeight:700,fontSize:'13px'}},"Red's Weekly Snapshot")));
  var _wkBody=h('div',{style:{fontSize:'12px',lineHeight:'1.6',color:'var(--text)'}});
  var _wkCacheKey='weeklyCheckin_'+getWeekKey(new Date());
  var _wkCached=S.coachCache[_wkCacheKey];
  if(_wkCached){_wkBody.textContent=_wkCached;}
  else{
    var _wkText='This week: '+_wStats.cur.sessions+' sessions, '+Math.round(_wStats.cur.vol)+' lbs volume.';
    if(_wStats.prev.sessions>0)_wkText+=' Last week: '+_wStats.prev.sessions+' sessions, '+Math.round(_wStats.prev.vol)+' lbs volume. Volume change: '+(_wStats.volChange>0?'+':'')+_wStats.volChange+'%.';
    _wkText+=' Streak: '+getStreak().current+' weeks.';
    _wkBody.textContent=_wkText;_wkBody.style.color='var(--text2)';
    var _wkReq=redOnce(_wkCacheKey,{maxTokens:220,
        system:"You are Red, a warm authoritative fitness coach. Give a brief weekly check-in (60-80 words). Reference the specific numbers. Be encouraging but direct. Use contractions naturally.",
        user:'Weekly stats for '+(S.profile.name||'athlete')+': '+_wkText+' Goals: '+(S.profile.goals||[]).join(', ')});
    if(_wkReq)_wkReq.then(function(txt){S.coachCache[_wkCacheKey]=txt;sv();R();},function(){});
  }
  _wkCard.appendChild(_wkBody);
  el.appendChild(_wkCard);
}

// === RED'S INSIGHTS (data-driven coaching observations) ===
var insights=[];
// Insight: Feeling trend
var allFeelings=[];Object.keys(S.logs).forEach(function(k){var l=S.logs[k];if(l&&l.feeling)allFeelings.push({f:l.feeling,d:l.date});});
if(allFeelings.length>=3){
  allFeelings.sort(function(a,b){return a.d>b.d?1:-1;});
  var recent=allFeelings.slice(-3);var avg=recent.reduce(function(s,x){return s+x.f;},0)/recent.length;
  if(avg>=8)insights.push({icon:'\uD83D\uDD25',text:"You've been rating workouts "+avg.toFixed(1)+"/10 lately. You're in a groove \u2014 consider progressing weights if you haven't already."});
  else if(avg<=4.5)insights.push({icon:'\u26A0\uFE0F',text:"Recent feelings averaging "+avg.toFixed(1)+"/10. Your body may need recovery. A deload week or extra rest days can help you bounce back stronger."});
  else insights.push({icon:'\u2705',text:"Workout feelings averaging "+avg.toFixed(1)+"/10. Solid middle ground \u2014 you're training appropriately."});
}
// Insight: Volume trend
if(ap&&pd){
  var wkVols=[];for(var w=1;w<=pd.weeks;w++){var vol=0;for(var d=1;d<=6;d++){var log=S.logs[lk(ap.id,w,d)];if(log)Object.keys(log).forEach(function(k){if(k.startsWith('e'))Object.keys(log[k]).forEach(function(sk){if(sk.startsWith('s')){var s=log[k][sk];vol+=(parseFloat(s.w)||0)*(parseFloat(s.r)||0);}});});}if(vol>0)wkVols.push(vol);}
  if(wkVols.length>=2){var last=wkVols[wkVols.length-1];var prev=wkVols[wkVols.length-2];var pctChange=((last-prev)/prev*100).toFixed(0);
    if(pctChange>5)insights.push({icon:'\uD83D\uDCC8',text:"Volume is up "+pctChange+"% from last tracked week. Progressive overload working."});
    else if(pctChange<-10)insights.push({icon:'\uD83D\uDCC9',text:"Volume dropped "+Math.abs(pctChange)+"% from last week. If intentional (deload), great. Otherwise, try to maintain last week's weights."});
  }
}
// Insight: PR streak
var prCount=Object.keys(S.prs).length;
if(prCount>0)insights.push({icon:'\uD83C\uDFC6',text:prCount+" personal record"+(prCount>1?'s':'')+' set! Top lift: '+Object.keys(S.prs).sort(function(a,b){return S.prs[b]-S.prs[a];})[0].replace(/_/g,' ')+' at '+S.prs[Object.keys(S.prs).sort(function(a,b){return S.prs[b]-S.prs[a];})[0]]+' lbs.'});
// Insight: Consistency
if(totalSessions>=5&&uniqueDays){var sessPerWeek=totalSessions/Math.max(1,Math.ceil(uniqueDays/7));
  if(sessPerWeek>=4)insights.push({icon:'\uD83D\uDCAA',text:"Averaging "+sessPerWeek.toFixed(1)+" sessions/week. Excellent consistency."});
  else if(sessPerWeek<2)insights.push({icon:'\uD83D\uDCAC',text:"Averaging "+sessPerWeek.toFixed(1)+" sessions/week. Try to hit 3+ for better results."});
}
// Insight: Custom workouts
if(totalCustom>=3)insights.push({icon:'\uD83C\uDFCB\uFE0F',text:totalCustom+" outside workouts logged. Cross-training is great for overall fitness and injury prevention."});

if(insights.length>0){
  var iC=h('div',{className:'card'});
  iC.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'6px',marginBottom:'10px'}},
    h('div',{style:{width:'24px',height:'24px',borderRadius:'12px',background:'linear-gradient(135deg,var(--accent),#8b0000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800,color:'#fff'}},'R'),
    h('h3',{style:{fontSize:'14px',fontWeight:700,margin:0}},"Red's Insights")
  ));
  insights.forEach(function(ins){iC.appendChild(h('div',{style:{display:'flex',gap:'8px',padding:'8px 0',borderTop:'1px solid var(--border)'}},
    h('span',{style:{fontSize:'16px',flexShrink:0}},ins.icon),
    h('p',{style:{fontSize:'12px',lineHeight:'1.5',margin:0}},ins.text)
  ));});
  el.appendChild(iC);
}

// === FEELING TREND CHART ===
if(allFeelings.length>=3){
  var fC=h('div',{className:'card'});fC.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'\uD83D\uDCCA Feeling Trend'));
  var last10=allFeelings.slice(-10);
  var bc=h('div',{style:{display:'flex',alignItems:'flex-end',gap:'4px',height:'80px'}});
  last10.forEach(function(f){var pct=f.f/10*100;var color=f.f>=8?'#10b981':f.f>=6?'var(--accent)':f.f>=4?'#f59e0b':'#ef4444';
    bc.appendChild(h('div',{style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}},
      h('span',{style:{fontSize:'9px',fontWeight:700}},f.f+''),
      h('div',{style:{width:'100%',height:Math.max(pct,8)+'%',background:color,borderRadius:'3px 3px 0 0'}}),
      h('span',{style:{fontSize:'7px',color:'var(--text2)'}},parseLocalDate(f.d).toLocaleDateString('en',{month:'numeric',day:'numeric'}))
    ));});
  fC.appendChild(bc);el.appendChild(fC);
}

if(!ap||!pd){if(totalSessions===0&&totalCustom===0)el.appendChild(h('p',{style:{color:'var(--text2)',textAlign:'center',padding:'40px'}},'Enroll in a program and start training to see progress.'));return el;}

// === PRs ===
var prK=Object.keys(S.prs);if(prK.length>0){var prC=h('div',{className:'card'});prC.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'\uD83C\uDFC6 Personal Records'));prK.sort(function(a,b){return S.prs[b]-S.prs[a];}).slice(0,8).forEach(function(k){prC.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('span',{style:{fontSize:'12px',fontWeight:600}},k.replace(/_/g,' ')),h('span',{style:{fontSize:'12px',fontWeight:800,color:'var(--accent)'}},S.prs[k]+' lbs')));});el.appendChild(prC);}

// Strength table
if(pd.type==='strength'){var lifts=['Barbell Bench Press','Barbell Back Squat','Barbell Deadlift','Barbell Bent-Over Row'];
var sC=h('div',{className:'card'});sC.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'Strength by Week'));
var tbl=h('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:'11px'}});var thead=h('tr');['Lift'].concat(Array.from({length:pd.weeks},function(_,i){return 'W'+(i+1);})).forEach(function(t){thead.appendChild(h('th',{style:{background:'var(--accent)',color:'#fff',padding:'6px 3px',textAlign:'left',fontSize:'9px'}},t));});tbl.appendChild(thead);
lifts.forEach(function(lift){var row=h('tr');row.appendChild(h('td',{style:{padding:'6px 3px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:'10px'}},lift.replace('Barbell ','')));
for(var w=1;w<=pd.weeks;w++){var best=0;var wkD=pd.data[w];if(wkD)for(var d=1;d<=6;d++){var log=S.logs[lk(ap.id,w,d)];if(!log)continue;var dy=wkD.days?wkD.days[d]:null;if(!dy||dy.isRest||!dy.ex)continue;dy.ex.forEach(function(ex,ei){if(ex.n===lift){var eL=log['e'+ei];if(eL)Object.keys(eL).forEach(function(sk){if(sk.startsWith('s')){var wt=parseFloat(eL[sk]&&eL[sk].w)||0;if(wt>best)best=wt;}});}});}
var prevBest=0;if(w>1){var pwkD=pd.data[w-1];if(pwkD)for(var d2=1;d2<=6;d2++){var pl=S.logs[lk(ap.id,w-1,d2)];if(!pl)continue;var pdy=pwkD.days?pwkD.days[d2]:null;if(!pdy||pdy.isRest||!pdy.ex)continue;pdy.ex.forEach(function(ex,ei){if(ex.n===lift){var eL=pl['e'+ei];if(eL)Object.keys(eL).forEach(function(sk){if(sk.startsWith('s')){var wt=parseFloat(eL[sk]&&eL[sk].w)||0;if(wt>prevBest)prevBest=wt;}});}});}}
var cellStyle={padding:'6px 3px',borderBottom:'1px solid var(--border)',textAlign:'center',fontSize:'10px'};
if(best>0&&prevBest>0&&best>prevBest)cellStyle.color='#10b981';
else if(best>0&&prevBest>0&&best<prevBest)cellStyle.color='#ef4444';
row.appendChild(h('td',{style:cellStyle},best?''+best:'-'));}tbl.appendChild(row);});sC.appendChild(tbl);
sC.appendChild(h('p',{style:{fontSize:'9px',color:'var(--text2)',marginTop:'6px'}},'\uD83D\uDFE2 Green = improved from previous week \u00B7 \uD83D\uDD34 Red = decreased'));
el.appendChild(sC);}

// Volume chart
var vC=h('div',{className:'card'});vC.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'Weekly Volume'));
var maxV=1,vols=[];for(var w=1;w<=pd.weeks;w++){var vol=0;for(var d=1;d<=6;d++){var log=S.logs[lk(ap.id,w,d)];if(log)Object.keys(log).forEach(function(k){if(k.startsWith('e'))Object.keys(log[k]).forEach(function(sk){if(sk.startsWith('s')){var ss=log[k][sk];vol+=(parseFloat(ss.w)||0)*(parseFloat(ss.r)||0);}});});}vols.push(vol);if(vol>maxV)maxV=vol;}
var bc=h('div',{style:{display:'flex',alignItems:'flex-end',gap:'6px',height:'80px'}});vols.forEach(function(v,i){var pct=maxV>0?(v/maxV*100):0;bc.appendChild(h('div',{style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}},h('span',{style:{fontSize:'8px',color:'var(--text2)',fontWeight:600}},v>0?(v/1000).toFixed(1)+'k':'-'),h('div',{style:{width:'100%',height:Math.max(pct,3)+'%',background:'var(--accent)',borderRadius:'4px 4px 0 0'}}),h('span',{style:{fontSize:'9px',fontWeight:700,color:'var(--text2)'}},'W'+(i+1))));});vC.appendChild(bc);el.appendChild(vC);

// Body Measurement Progress Charts
if(S.bodyLogs.length>1){
  var bChart=h('div',{className:'card'});
  bChart.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'Measurement Trends'));
  var metrics=[{k:'wt',l:'Weight',u:'lbs',c:'var(--accent)'},{k:'wa',l:'Waist',u:'in',c:'#3b82f6'},{k:'ch',l:'Chest',u:'in',c:'#10b981'},{k:'ar',l:'Arms',u:'in',c:'#f59e0b'}].filter(function(m){return S.bodyLogs.some(function(l){return l[m.k]&&parseFloat(l[m.k])>0;});});
  metrics.forEach(function(met){
    var vals=S.bodyLogs.map(function(e){return parseFloat(e[met.k])||0;}).filter(function(v){return v>0;});
    if(vals.length<2)return;
    var maxV=Math.max.apply(null,vals),minV=Math.min.apply(null,vals);
    var range=maxV-minV||1;var change=vals[vals.length-1]-vals[0];
    var row=h('div',{style:{marginBottom:'10px'}});
    var isGood=(met.k==='wt'||met.k==='wa')?change<=0:change>=0;
    row.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:'3px'}},
      h('span',{style:{fontSize:'11px',fontWeight:700}},met.l+' ('+vals[vals.length-1]+' '+met.u+')'),
      h('span',{style:{fontSize:'11px',fontWeight:700,color:isGood?'#10b981':'#ef4444'}},
        (change>0?'+':'')+change.toFixed(1)+' '+met.u)));
    var bc=h('div',{style:{display:'flex',alignItems:'flex-end',gap:'2px',height:'30px'}});
    vals.forEach(function(v){var pct=(v-minV)/range*100;
      bc.appendChild(h('div',{style:{flex:1,height:Math.max(pct,5)+'%',background:met.c,borderRadius:'2px 2px 0 0',opacity:.8}}));});
    row.appendChild(bc);bChart.appendChild(row);});
  el.appendChild(bChart);
}

// Body measurements table
var bC=h('div',{className:'card'});var bH=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}});bH.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,margin:0}},'Body Measurements'));
// Determine which metrics user actually tracks
var usedMetrics=[];var metricLabels={wt:'Weight',ch:'Chest',wa:'Waist',hp:'Hips',ar:'Arms'};var metricUnits={wt:'lbs',ch:'in',wa:'in',hp:'in',ar:'in'};
['wt','ch','wa','hp','ar'].forEach(function(k){var has=S.bodyLogs.some(function(l){return l[k]&&parseFloat(l[k])>0;});if(has)usedMetrics.push(k);});
if(!S.bodyEdit){
  bH.appendChild(h('button',{className:'btn btn-primary btn-sm',innerHTML:svg('plus',12,'#fff')+' Add',onClick:function(){S.bodyEdit={date:localDateStr(),wt:'',ch:'',wa:'',hp:'',ar:''};R();}}));
}else{
  bH.appendChild(h('button',{className:'btn btn-secondary btn-sm',onClick:function(){S.bodyEdit=null;R();}},'Cancel'));
}bC.appendChild(bH);
// ADD/EDIT FORM (only visible when editing)
if(S.bodyEdit){
  var ef=h('div',{style:{background:'var(--input)',borderRadius:'10px',padding:'10px',marginBottom:'10px'}});
  var dateR=h('div',{style:{marginBottom:'8px'}});dateR.appendChild(h('label',{style:{fontSize:'10px',fontWeight:700,color:'var(--text2)',display:'block',marginBottom:'2px'}},'Date'));
  var di=h('input',{type:'date',value:S.bodyEdit.date||'',style:{width:'100%',padding:'6px 8px',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'16px',background:'var(--card)',color:'var(--text)'}});
  di.addEventListener('change',function(e){S.bodyEdit.date=e.target.value;});dateR.appendChild(di);ef.appendChild(dateR);
  var mGrid=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}});
  [{k:'wt',l:'Weight (lbs)'},{k:'ch',l:'Chest (in)'},{k:'wa',l:'Waist (in)'},{k:'hp',l:'Hips (in)'},{k:'ar',l:'Arms (in)'}].forEach(function(m){
    var fg=h('div');fg.appendChild(h('label',{style:{fontSize:'10px',fontWeight:700,color:'var(--text2)',display:'block',marginBottom:'2px'}},m.l));
    var inp=h('input',{type:'number',inputMode:'decimal',step:'0.1',placeholder:'-',value:S.bodyEdit[m.k]||'',style:{width:'100%',padding:'6px 8px',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'16px',background:'var(--card)',color:'var(--text)',boxSizing:'border-box'}});
    inp.addEventListener('input',function(e){S.bodyEdit[m.k]=e.target.value;});fg.appendChild(inp);mGrid.appendChild(fg);});
  ef.appendChild(mGrid);
  var saveBtn=h('button',{className:'btn btn-primary btn-block',style:{marginTop:'8px'},onClick:function(){
    var entry=JSON.parse(JSON.stringify(S.bodyEdit));S.bodyLogs.push(entry);S.bodyLogs.sort(function(a,b){return a.date>b.date?1:-1;});S.bodyEdit=null;sv();R();
  }},'Save Measurement');ef.appendChild(saveBtn);bC.appendChild(ef);
}
// SAVED ENTRIES (compact display)
if(S.bodyLogs.length===0&&!S.bodyEdit)bC.appendChild(h('p',{style:{textAlign:'center',color:'var(--text2)',padding:'16px',fontSize:'11px'}},'Track measurements over time.'));
else if(S.bodyLogs.length>0){
  S.bodyLogs.slice().reverse().forEach(function(log,ri){var real=S.bodyLogs.length-1-ri;
    var row=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:ri<S.bodyLogs.length-1?'1px solid var(--border)':'none'}});
    var left=h('div');left.appendChild(h('span',{style:{fontSize:'11px',fontWeight:700}},log.date||'No date'));
    var vals=[];['wt','ch','wa','hp','ar'].forEach(function(k){if(log[k]&&parseFloat(log[k])>0)vals.push(metricLabels[k]+': '+log[k]+metricUnits[k]);});
    left.appendChild(h('p',{style:{fontSize:'10px',color:'var(--text2)',margin:'1px 0 0'}},vals.join(' | ')||'No data'));
    row.appendChild(left);
    row.appendChild(h('button',{style:{background:'none',border:'none',cursor:'pointer',padding:'4px'},innerHTML:svg('trash',12,'var(--danger)'),'aria-label':'Delete this measurement',onClick:function(){S.modal={type:'confirm',title:'Delete measurement?',msg:'This removes the entry from your progress charts.',confirmText:'Delete',cancelText:'Keep',onConfirm:function(){S.bodyLogs.splice(real,1);S.modal=null;sv();R();}};R();}}));
    bC.appendChild(row);});}el.appendChild(bC);return el;}
