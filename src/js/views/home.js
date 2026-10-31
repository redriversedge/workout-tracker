// === DASHBOARD ===
function getWeekDates(refDate){
  var d=new Date(refDate);var day=d.getDay();var mon=new Date(d);mon.setDate(d.getDate()-((day+6)%7));
  var wk=[];for(var i=0;i<7;i++){var dd=new Date(mon);dd.setDate(mon.getDate()+i);wk.push(dd);}return wk;
}
function getMonthDates(year,month){
  var first=new Date(year,month,1);var last=new Date(year,month+1,0);
  var startDay=(first.getDay()+6)%7;var days=[];
  for(var i=-startDay;i<42;i++){var d=new Date(year,month,1+i);days.push(d);if(i>=last.getDate()&&d.getDay()===0)break;}
  return days;
}
function getDayWorkouts(dateStr){
  var results=[];
  var today=localDateStr();
  var isPast=dateStr<today;
  var isToday=dateStr===today;

  // Check completed workouts from actual logs (any day)
  Object.keys(S.logs).forEach(function(k){
    var l=S.logs[k];if(!l||!l.date)return;
    if(l.date.split('T')[0]!==dateStr)return;
    var parts=k.match(/(.+)_w(\d+)d(\d+)/);if(!parts)return;
    var progId=parts[1],prog=PROGRAMS[progId];
    if(!prog)return;
    var wk=parseInt(parts[2]),dy=parseInt(parts[3]);
    var dayData=prog.data&&prog.data[wk]&&prog.data[wk].days?prog.data[wk].days[dy]:null;
    var dayName=l.customName||(dayData?dayData.name:prog.name);
    results.push({id:progId,name:dayName,type:prog.type||'strength',done:true});
  });

  // For today and future: use shifted schedule
  if(!isPast||isToday){
    S.enrolled.forEach(function(en){
      var prog=PROGRAMS[en.id];if(!prog)return;
      if(results.some(function(r){return r.id===en.id;}))return;
      var shifted=getShiftedSchedule(en,prog);
      if(shifted[dateStr]){
        shifted[dateStr].forEach(function(sw){
          if(!sw.done)results.push({id:en.id,name:sw.name,type:sw.type||prog.type||'strength',done:false});
        });
      }
    });
  }

  // Custom workout logs
  if(S.customWks)S.customWks.forEach(function(cw){
    if(cw&&cw.date&&cw.date.split('T')[0]===dateStr)results.push({id:'custom',name:cw.name||'Custom',type:'hiit',done:true});
  });

  // Sunday rest indicator
  var targetDate=new Date(dateStr+'T12:00:00');
  var dow=targetDate.getDay();
  if(dow===0&&results.length===0&&S.enrolled.length>0&&(isToday||!isPast)){
    results.push({id:'rest',name:'Rest Day',type:'rest',done:false});
  }

  return results;
}
function rCalStrip(el){try{
  if(!S.calDate)S.calDate=localDateStr();
  var today=localDateStr();
  var refDate=new Date(S.calDate+'T12:00:00');
  var dows=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  if(S.calExpanded){
    // MONTH VIEW
    var yr=refDate.getFullYear(),mo=refDate.getMonth();
    var monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
    var mHead=h('div',{className:'cal-month'});
    mHead.appendChild(h('button',{className:'cal-month-btn',onClick:function(){var d=new Date(yr,mo-1,1);S.calDate=localDateStr(d);R();}},'\u25C0'));
    var mTitle=h('button',{style:{background:'none',border:'none',color:'var(--text)',fontSize:'14px',fontWeight:700,cursor:'pointer'},onClick:function(){S.calExpanded=false;S.calDate=today;R();}},monthNames[mo]+' '+yr);
    mHead.appendChild(mTitle);
    mHead.appendChild(h('button',{className:'cal-month-btn',onClick:function(){var d=new Date(yr,mo+1,1);S.calDate=localDateStr(d);R();}},'\u25B6'));
    el.appendChild(mHead);

    // Day headers
    var grid=h('div',{className:'cal-grid'});
    dows.forEach(function(dw){var hd=h('div',{style:{textAlign:'center',fontSize:'9px',color:'var(--text2)',fontWeight:600,padding:'4px 0'}},dw);grid.appendChild(hd);});

    var monthDays=getMonthDates(yr,mo);
    monthDays.forEach(function(dd){
      var ds=localDateStr(dd);
      var isToday=ds===today;
      var isOther=dd.getMonth()!==mo;
      var isSel=ds===S.calDate;
      var wks=getDayWorkouts(ds);
      var cls='cal-day'+(isToday?' today':'')+(isOther?' other-month':'')+(isSel?' selected':'');
      var dayEl=h('div',{className:cls,onClick:function(){S.calDate=ds;S.calExpanded=false;R();}});
      dayEl.appendChild(h('div',{className:'cal-num'},dd.getDate()+''));
      if(wks.length>0){var dots=h('div',{className:'cal-dots'});wks.forEach(function(w){
        var dcls='cal-dot '+(w.done?'done':w.type==='running'?'run':w.type==='flexibility'?'flex':w.type==='hiit'?'hiit':'str');
        dots.appendChild(h('div',{className:dcls}));
      });dayEl.appendChild(dots);}
      grid.appendChild(dayEl);
    });
    el.appendChild(grid);
  } else {
    // WEEK STRIP
    var weekDates=getWeekDates(refDate);
    var strip=h('div',{className:'cal-strip'});
    weekDates.forEach(function(dd,i){
      var ds=localDateStr(dd);
      var isToday=ds===today;
      var isSel=ds===S.calDate;
      var wks=getDayWorkouts(ds);
      var cls='cal-day'+(isToday?' today':'')+(isSel?' selected':'');
      var dayEl=h('div',{className:cls,onClick:function(){S.calDate=ds;R();}});
      dayEl.appendChild(h('div',{className:'cal-dow'},dows[i]));
      dayEl.appendChild(h('div',{className:'cal-num'},dd.getDate()+''));
      if(wks.length>0){var dots=h('div',{className:'cal-dots'});wks.forEach(function(w){
        var dcls='cal-dot '+(w.done?'done':w.type==='running'?'run':w.type==='flexibility'?'flex':w.type==='hiit'?'hiit':'str');
        dots.appendChild(h('div',{className:dcls}));
      });dayEl.appendChild(dots);
      if(wks.some(function(w){return w.done;}))dayEl.appendChild(h('span',{className:'cal-check'},'\u2713'));}
      strip.appendChild(dayEl);
    });
    el.appendChild(strip);

    // Week nav + expand button
    var wNav=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}});
    wNav.appendChild(h('button',{className:'cal-month-btn',style:{fontSize:'12px'},onClick:function(){var d=new Date(refDate);d.setDate(d.getDate()-7);S.calDate=localDateStr(d);R();}},'\u25C0 Prev'));
    wNav.appendChild(h('button',{style:{background:'none',border:'none',color:'var(--text2)',fontSize:'11px',cursor:'pointer',textDecoration:'underline'},onClick:function(){S.calExpanded=true;R();}},'Month view'));
    wNav.appendChild(h('button',{className:'cal-month-btn',style:{fontSize:'12px'},onClick:function(){var d=new Date(refDate);d.setDate(d.getDate()+7);S.calDate=localDateStr(d);R();}},'Next \u25B6'));
    el.appendChild(wNav);

    // Selected day detail
    var selWks=getDayWorkouts(S.calDate);
    if(selWks.length>0){
      var detail=h('div',{className:'card',style:{padding:'10px 12px',marginBottom:'12px'}});
      var selDate=new Date(S.calDate+'T12:00:00');
      var monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var dayLabel=S.calDate===today?'Today':dows[(selDate.getDay()+6)%7]+', '+monthNames[selDate.getMonth()]+' '+selDate.getDate();
      dayLabel=S.calDate===today?'Today':dows[(selDate.getDay()+6)%7]+', '+monthNames[selDate.getMonth()]+' '+selDate.getDate();
      detail.appendChild(h('div',{style:{fontSize:'12px',fontWeight:700,marginBottom:'6px',color:'var(--text2)'}},dayLabel));
      selWks.forEach(function(w){
        var wRow=h('div',{style:{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}});
        var dotColor=w.done?'var(--text2)':w.type==='running'?'#4CAF50':w.type==='flexibility'?'#9C27B0':w.type==='hiit'?'#FF9800':'#c8102e';
        wRow.appendChild(h('div',{style:{width:'6px',height:'6px',borderRadius:'50%',background:dotColor,flexShrink:'0'}}));
        wRow.appendChild(h('span',{style:{fontSize:'12px',fontWeight:w.done?'400':'600',textDecoration:w.done?'line-through':'none',color:w.done?'var(--text2)':'var(--text)'}},w.name));
        if(w.done)wRow.appendChild(h('span',{style:{fontSize:'10px',color:'var(--accent)'}},'\u2713'));
        detail.appendChild(wRow);
      });
      if(S.calDate===today){
        detail.appendChild(h('button',{className:'btn btn-primary btn-sm',style:{marginTop:'8px',width:'100%'},onClick:function(){S.tab='track';R();}},'Start Workout \u2192'));
      }
      el.appendChild(detail);
    }
  }
}catch(e){console.error("Cal err:",e);}
}

function rHome(){console.log('[RRE] rHome called, enrolled:',S.enrolled.length,'active:',S.active);var el=h('div',{className:'page active'});
if(S.drill)return rDrill(el);
if(S.enrolled.length===0){
  // Gentle prompt instead of forced redirect if they skipped setup
  if(S.profile._setupComplete===false){
    el.appendChild(h('div',{className:'card',style:{padding:'16px',borderLeft:'3px solid var(--accent)',marginBottom:'12px'}},
      h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}},
        h('div',{style:{width:'24px',height:'24px',borderRadius:'7px',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff',fontWeight:800}},'R'),
        h('span',{style:{fontWeight:700,fontSize:'13px'}},'Pick a program to get started')),
      h('p',{style:{fontSize:'12px',color:'var(--text2)',margin:'0 0 12px',lineHeight:'1.5'}},"You skipped the program selection \u2014 no worries. Browse the programs below and enroll in one that matches your goals. I'll take it from there."),
      h('button',{className:'btn btn-primary',style:{width:'100%'},onClick:function(){S.tab='programs';R();}},'Browse Programs')));
    return el;
  }
  return rPP();
}

var merged=getMergedSchedule();
var ap=gAP(),pd=ap?gPD(ap.id):null;
if(!ap&&S.enrolled.length>0){S.active=S.enrolled[0].id;ap=gAP();pd=ap?gPD(ap.id):null;}
if(!ap||!pd)return rPP();
var streak=getStreakNum();

// Calendar strip
try{rCalStrip(el);}catch(e){}

// Incomplete setup banner
if(S.profile._setupComplete===false&&!(S._dismissedAlerts||[]).includes('incomplete_setup')){
  var _setupBanner=h('div',{className:'card',style:{padding:'12px 14px',borderLeft:'3px solid var(--warn)',marginBottom:'8px',position:'relative'}});
  var _sbTop=h('div',{style:{display:'flex',alignItems:'flex-start',gap:'8px'}});
  _sbTop.appendChild(h('div',{style:{width:'24px',height:'24px',borderRadius:'7px',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#fff',fontWeight:800,flexShrink:0,marginTop:'1px'}},'R'));
  _sbTop.appendChild(h('div',null,
    h('p',{style:{fontSize:'12px',lineHeight:'1.5',color:'var(--text)',margin:0}},"Looks like you skipped some of the intake. No rush \u2014 but the more I know about you, the better I can coach. "),
    h('button',{style:{fontSize:'11px',color:'var(--accent)',fontWeight:700,background:'none',border:'none',cursor:'pointer',padding:'4px 0'},onClick:function(){S.tab='profile';R();}},'Finish up in Profile \u2192')));
  var _sbX=h('button',{style:{position:'absolute',top:'8px',right:'8px',background:'none',border:'none',fontSize:'14px',color:'var(--text2)',cursor:'pointer',padding:'2px 6px',lineHeight:1},onClick:function(){if(!S._dismissedAlerts)S._dismissedAlerts=[];S._dismissedAlerts.push('incomplete_setup');sv();R();}},'\u2715');
  _setupBanner.appendChild(_sbTop);_setupBanner.appendChild(_sbX);
  el.appendChild(_setupBanner);
}

// === RED'S COACHING OVERVIEW ===
function getJSOCoaching(ap,pd,wk,dy){
  // Pre-workout JSO coaching content - much more detailed than standard
  if(!pd||!dy||!dy.ex)return null;
  var isJSO=pd.level==='Just Starting Out';
  if(!isJSO)return null;
  var exercises=dy.ex.map(function(e){return e.n;});
  var tips=[];
  // Generate exercise-specific coaching based on movement patterns
  exercises.forEach(function(en){
    if(en.toLowerCase().indexOf('squat')>-1)tips.push({ex:en,tip:'Keep your chest up and weight in your heels. Think about sitting back into a chair. Your knees should track over your toes, not cave inward.',why:'Squats build the foundation for everything \u2014 strong legs, strong core, better balance.'});
    else if(en.toLowerCase().indexOf('deadlift')>-1||en.toLowerCase().indexOf('rdl')>-1||en.toLowerCase().indexOf('hinge')>-1)tips.push({ex:en,tip:'This is a hip hinge \u2014 push your hips BACK, not down. Keep the weight close to your body. You should feel a stretch in your hamstrings.',why:'The hip hinge is the most important movement pattern for back health and overall strength.'});
    else if(en.toLowerCase().indexOf('press')>-1||en.toLowerCase().indexOf('push')>-1)tips.push({ex:en,tip:'Keep your core tight and squeeze at the top. Control the weight down slowly \u2014 the lowering phase builds strength too.',why:'Pressing builds upper body strength and healthy shoulders.'});
    else if(en.toLowerCase().indexOf('row')>-1||en.toLowerCase().indexOf('pull')>-1)tips.push({ex:en,tip:'Squeeze your shoulder blades together at the top. Think about pulling with your elbows, not your hands.',why:'Pulling exercises balance out all the pressing and protect your posture.'});
    else if(en.toLowerCase().indexOf('plank')>-1||en.toLowerCase().indexOf('dead bug')>-1||en.toLowerCase().indexOf('bird dog')>-1)tips.push({ex:en,tip:'Brace your core like someone is about to poke your stomach. Breathe normally \u2014 do not hold your breath.',why:'Core stability protects your spine during every other exercise.'});
    else tips.push({ex:en,tip:'Focus on controlled movement. If something feels wrong, stop and reset.',why:'Building good habits now pays off forever.'});
  });
  return tips;
}
function getJSOPostWorkout(ap,pd,logData){
  if(!pd||pd.level!=='Just Starting Out')return null;
  var feedback=[];
  feedback.push('Great job finishing that workout. Showing up is the hardest part, and you did it.');
  if(logData&&logData.feeling){
    if(logData.feeling<=4)feedback.push('You rated this pretty tough. That is completely normal when you are learning new movements. Your body is adapting \u2014 next time will feel smoother.');
    else if(logData.feeling>=7)feedback.push('Looks like you felt good through this one. That is a great sign your body is responding to the training.');
  }
  feedback.push('Between now and your next session: drink plenty of water, get good sleep, and eat enough protein. Your muscles grow during rest, not during the workout.');
  feedback.push('You might feel some soreness tomorrow or the day after \u2014 that is called DOMS (delayed onset muscle soreness). It is normal and temporary. Light walking or stretching helps.');
  return feedback;
}
function renderRedOverview(){
  var rc=h('div',{className:'card',style:{borderLeft:'3px solid var(--accent)',background:'var(--card)'}});
  var hd=h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}});
  hd.appendChild(h('div',{style:{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#c8102e,#8b0000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',color:'#fff',fontWeight:800}},'R'));
  hd.appendChild(h('div',null,h('p',{style:{fontWeight:800,fontSize:'13px',margin:0}},'Coach Red'),h('p',{style:{color:'var(--text2)',fontSize:'9px',margin:0}},'Your training overview')));
  rc.appendChild(hd);

  // Program overview
  var overviews=[];
  S.enrolled.forEach(function(en){
    var p=gPD(en.id);if(!p)return;
    var com=RED_COMMENTARY[en.id];
    if(com)overviews.push(com.overview);
  });
  if(overviews.length>0){
    rc.appendChild(h('p',{style:{fontSize:'12px',lineHeight:'1.5',color:'var(--text)',marginBottom:'8px'}},overviews.join(' ')));
  }

  // Journey status
  var totalLogged=Object.keys(S.logs).length;
  var journeyMsg='';
  if(totalLogged===0)journeyMsg="You're right at the starting line. The hardest part is showing up \u2014 and you're here. Let's build something great.";
  else if(totalLogged<5)journeyMsg="Nice start! You've got "+totalLogged+" session"+(totalLogged>1?'s':'')+' logged. The habit is forming. Keep showing up and the results will follow.';
  else if(totalLogged<15)journeyMsg="You're building serious momentum with "+totalLogged+" sessions logged. Your body is adapting and getting stronger with every workout. This is where consistency pays off.";
  else journeyMsg=totalLogged+" sessions deep \u2014 you're not messing around. The work you've put in is building a foundation that'll serve you for years. Respect. \uD83D\uDCAA";
  rc.appendChild(h('p',{style:{fontSize:'12px',lineHeight:'1.5',color:'var(--text)',fontStyle:'italic',marginBottom:'8px'}},journeyMsg));

  // Week-specific intro
  var weekCom=null;
  if(ap&&RED_COMMENTARY[ap.id]){weekCom=RED_COMMENTARY[ap.id].week_intros[S.week];}
  if(weekCom){rc.appendChild(h('div',{style:{background:'var(--accent-light)',borderRadius:'8px',padding:'10px',marginBottom:'8px'}},h('p',{style:{fontSize:'10px',fontWeight:700,color:'var(--accent)',marginBottom:'3px'}},'WEEK '+S.week+' FOCUS'),h('p',{style:{fontSize:'11px',lineHeight:'1.5',color:'var(--text)'}},weekCom)));}

  // Next workout preview
  var nextEx=null,nextLabel='';
  if(merged&&S.enrolled.length>1){
    for(var d=0;d<merged.schedule.length;d++){var dt=merged.schedule[d];if(!dt.isRest&&!S.logs['merged_w'+S.week+'d'+(d+1)]){nextLabel=dt.label;nextEx=getMergedDayExercises(dt,S.week);break;}}
  }else if(ap&&pd){
    for(var w=S.week;w<=pd.weeks&&!nextEx;w++){var wk=pd.data[w];if(!wk)continue;for(var d=1;d<=ap.days&&!nextEx;d++){var dy=wk.days?wk.days[d]:null;if(dy&&!dy.isRest&&!S.logs[lk(ap.id,w,d)]){nextLabel=dy.name;nextEx=dy.ex;break;}}}
  }
  if(nextEx&&nextEx.length>0){
    rc.appendChild(h('div',{style:{borderTop:'1px solid var(--border)',paddingTop:'8px',marginTop:'4px'}},
      h('p',{style:{fontSize:'10px',fontWeight:700,color:'var(--text2)',marginBottom:'4px'}},'UP NEXT: '+nextLabel),
      h('p',{style:{fontSize:'11px',color:'var(--text)'}},nextEx.slice(0,4).map(function(e){return e.n;}).join(', ')+(nextEx.length>4?' +'+( nextEx.length-4)+' more':''))
    ));
  }

  // Smart adjustment alerts
  var adjs=checkAdjustments();
  if(adjs.length>0){
    adjs.forEach(function(adj){
      var ab=h('div',{style:{background:'rgba(200,16,46,0.08)',borderRadius:'8px',padding:'10px',marginTop:'8px',border:'1px solid rgba(200,16,46,0.2)'}});
      ab.appendChild(h('p',{style:{fontSize:'11px',lineHeight:'1.5',color:'var(--text)',marginBottom:'8px'}},adj.msg));
      var btns=h('div',{style:{display:'flex',gap:'6px'}});
      btns.appendChild(h('button',{className:'btn btn-primary btn-sm',onClick:function(){applyAdjustment(adj);R();}},'Yes, adjust'));
      btns.appendChild(h('button',{className:'btn btn-secondary btn-sm',onClick:function(){S.profile.adjDismissed=(S.profile.adjDismissed||0)+1;sv();R();}},'Not now'));
      ab.appendChild(btns);rc.appendChild(ab);
    });
  }

  // Active adjustment badge
  var adj=S.profile.activeAdj;
  if(adj&&adj.sessionsLeft>0){
    var labels={deload:'Deload Mode',intensity_up:'Intensity Boost',comeback:'Comeback Mode'};
    rc.appendChild(h('div',{style:{background:'var(--accent-light)',borderRadius:'6px',padding:'6px 10px',marginTop:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}},
      h('span',{style:{fontSize:'10px',fontWeight:700,color:'var(--accent)'}},(labels[adj.type]||'Adjusted')+' \u2014 '+adj.sessionsLeft+' session'+(adj.sessionsLeft>1?'s':'')+' left'),
      h('button',{style:{background:'none',border:'none',color:'var(--text2)',fontSize:'10px',cursor:'pointer'},onClick:function(){delete S.profile.activeAdj;sv();toast('Adjustment cleared');R();}},'Cancel')
    ));
  }

  return rc;
}

// === MERGED MULTI-PROGRAM VIEW ===
if(merged&&S.enrolled.length>1){
  var hero=h('div',{className:'hero'});hero.appendChild(h('p',{style:{opacity:.85,fontSize:'12px'}},'Welcome back,'));
  hero.appendChild(h('h2',{style:{fontSize:'22px',fontWeight:800,margin:'0 0 4px'}},S.profile.name||'Athlete'));
  if(streak>0)hero.appendChild(h('span',{style:{background:'rgba(255,255,255,0.2)',color:'#fff',padding:'3px 10px',borderRadius:'8px',fontSize:'11px',fontWeight:700}},'\uD83D\uDD25 '+streak+' week streak'));
  var pNames=S.enrolled.map(function(e){var p=gPD(e.id);return p?p.name:'';}).filter(Boolean).join(' + ');
  hero.appendChild(h('p',{style:{opacity:.8,fontSize:'12px',marginTop:'6px'}},'\uD83D\uDD00 Merged: '+pNames));
  hero.appendChild(h('p',{style:{opacity:.7,fontSize:'11px',marginTop:'2px'}},merged.days+' days/week \u00B7 Smart schedule'));
  var logged=Object.keys(S.logs).filter(function(k){return k.startsWith('merged_');}).length;
  var maxWks=Math.max.apply(null,S.enrolled.map(function(e){var p=gPD(e.id);return p?p.weeks:6;}));
  var total=maxWks*merged.days;var pct=total>0?Math.round(logged/total*100):0;
  var hr=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'6px'}});
  hr.appendChild(h('p',{style:{fontSize:'26px',fontWeight:800}},pct+'%'));hr.appendChild(h('p',{style:{opacity:.8,fontSize:'11px'}},logged+'/'+total));hero.appendChild(hr);
  var bar=h('div',{style:{background:'rgba(255,255,255,0.2)',borderRadius:'6px',height:'6px',marginTop:'10px'}});bar.appendChild(h('div',{style:{background:'#fff',borderRadius:'6px',height:'6px',width:pct+'%'}}));hero.appendChild(bar);
  el.appendChild(hero);

  // Red's overview
  el.appendChild(renderRedOverview());

  // Weekly summary card
  el.appendChild(rWeeklySummary());

  // Week pills + schedule
  el.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,margin:'12px 0 8px'}},'Week '+S.week+' Schedule'));
  var wpills=h('div',{className:'pill-row',style:{marginBottom:'10px'}});
  for(var w=1;w<=maxWks;w++){(function(ww){wpills.appendChild(h('button',{className:'pill'+(S.week===ww?' active':''),onClick:function(){S.week=ww;R();}},'W'+ww));})(w);}el.appendChild(wpills);

  merged.schedule.forEach(function(dayTpl,idx){
    var dayNum=idx+1;var logKey='merged_w'+S.week+'d'+dayNum;var done=!!S.logs[logKey];
    var icons={strength:'\uD83D\uDCAA',running:'\uD83C\uDFC3',yoga:'\uD83E\uDDD8',hiit:'\uD83D\uDD25',kettlebell:'\uD83E\uDE86',flexibility:'\uD83E\uDDD8'};
    var typeIcons=dayTpl.types.map(function(t){return icons[t]||'';}).join('');
    var c=h('div',{className:'card',style:{padding:'14px',cursor:dayTpl.isRest?'default':'pointer',border:done?'2px solid var(--success)':'1px solid var(--border)',opacity:done?.75:1}});
    if(!dayTpl.isRest)c.addEventListener('click',function(){S.day=dayNum;S.tab='track';var _lk=logKey;S._curLogKey=_lk;if(S._curLogKey===_lk&&Object.keys(S.curLog).length>0){}else{S.curLog=JSON.parse(JSON.stringify(S.logs[_lk]||{}));}loadCL();R();});
    c.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
      h('div',null,h('div',{style:{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}},h('span',{style:{fontSize:'10px',fontWeight:800,color:'var(--text2)'}},'DAY '+dayNum),done?h('span',{style:{fontSize:'10px',color:'var(--success)',fontWeight:700}},'\u2713 Done'):null),h('h3',{style:{fontSize:'14px',fontWeight:700,margin:'0 0 2px'}},dayTpl.label),h('p',{style:{color:'var(--text2)',fontSize:'11px',margin:0}},dayTpl.desc)),h('span',{style:{fontSize:'20px'}},dayTpl.isRest?'\uD83E\uDDD8':typeIcons)));
    if(dayTpl.types.length>0){var badges=h('div',{style:{display:'flex',gap:'4px',marginTop:'6px'}});dayTpl.types.forEach(function(t){badges.appendChild(h('span',{style:{background:t==='strength'?'rgba(200,16,46,0.15)':t==='running'?'rgba(59,130,246,0.15)':'rgba(168,85,247,0.15)',color:t==='strength'?'var(--accent)':t==='running'?'#3b82f6':'#a855f7',padding:'2px 8px',borderRadius:'6px',fontSize:'9px',fontWeight:700,textTransform:'uppercase'}},t));});c.appendChild(badges);}
    el.appendChild(c);});

  var rc=h('div',{className:'card',style:{padding:'14px',opacity:.7,textAlign:'center'}});rc.appendChild(h('p',{style:{fontSize:'12px',color:'var(--text2)'}},(7-merged.days)+' rest day'+(7-merged.days>1?'s':'')+' per week'));el.appendChild(rc);
  var acts=h('div',{className:'grid-2',style:{margin:'10px 0'}});
  acts.appendChild(h('button',{className:'btn btn-secondary btn-block btn-sm',innerHTML:svg('plus',12)+' Programs',onClick:function(){S.tab='programs';R();}}));
  acts.appendChild(h('button',{className:'btn btn-secondary btn-block btn-sm',innerHTML:svg('settings',12)+' Days',onClick:function(){S.modal='adjustDays';R();}}));
  acts.appendChild(h('button',{className:'btn btn-secondary btn-block btn-sm',style:{gridColumn:'1/-1'},onClick:function(){S.active=S.enrolled[0].id;R();}},'View Individual Programs'));
  el.appendChild(acts);return rDashWidgets(el);
}

// === SINGLE PROGRAM VIEW ===
if(!ap||!pd)return rPP();
var st=getDashStats();if(!st)return rPP();
var totalD=pd.weeks*ap.days,logged=Object.keys(S.logs).filter(function(k){return k.startsWith(ap.id);}).length,pct=totalD>0?Math.round(logged/totalD*100):0;
if(S.enrolled.length>1){var sw=h('div',{className:'pill-row',style:{marginBottom:'10px'}});sw.appendChild(h('button',{className:'pill',onClick:function(){R();}},'Merged View'));S.enrolled.forEach(function(en){var p=gPD(en.id);if(!p)return;sw.appendChild(h('button',{className:'pill'+(S.active===en.id?' active':''),onClick:function(){S.active=en.id;S.week=1;S.day=1;sv();R();}},p.name));});el.appendChild(sw);}
var hero=h('div',{className:'hero'});hero.appendChild(h('p',{style:{opacity:.85,fontSize:'12px'}},'Welcome back,'));hero.appendChild(h('h2',{style:{fontSize:'22px',fontWeight:800,margin:'0 0 4px'}},S.profile.name||'Athlete'));
if(streak>0)hero.appendChild(h('span',{style:{background:'rgba(255,255,255,0.2)',color:'#fff',padding:'3px 10px',borderRadius:'8px',fontSize:'11px',fontWeight:700}},'\uD83D\uDD25 '+streak+' week streak'));
hero.appendChild(h('p',{style:{opacity:.8,fontSize:'12px',marginTop:'6px'}},pd.name));
var hr=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'6px'}});hr.appendChild(h('p',{style:{fontSize:'26px',fontWeight:800}},pct+'%'));hr.appendChild(h('p',{style:{opacity:.8,fontSize:'11px'}},logged+'/'+totalD));hero.appendChild(hr);
var bar=h('div',{style:{background:'rgba(255,255,255,0.2)',borderRadius:'6px',height:'6px',marginTop:'10px'}});bar.appendChild(h('div',{style:{background:'#fff',borderRadius:'6px',height:'6px',width:pct+'%'}}));hero.appendChild(bar);el.appendChild(hero);

// Red's overview
el.appendChild(renderRedOverview());

// Weekly summary
el.appendChild(rWeeklySummary());

// Next workout
var next=null;for(var w=1;w<=pd.weeks&&!next;w++){var wk=pd.data[w];if(!wk||!wk.days)continue;for(var d=1;d<=ap.days&&!next;d++){var dy=wk.days[d];if(dy&&!dy.isRest&&!S.logs[lk(ap.id,w,d)])next={w:w,d:d,name:dy.name};}}
if(next){var nx=h('div',{className:'card',style:{cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}});nx.addEventListener('click',function(){S.week=next.w;S.day=next.d;S.tab='track';loadCL();R();});
nx.appendChild(h('div',null,h('p',{className:'label'},'Up Next'),h('h3',{style:{fontSize:'16px',fontWeight:700,margin:'3px 0'}},'W'+next.w+' D'+next.d),h('p',{style:{color:'var(--accent)',fontSize:'12px',fontWeight:600}},next.name)));
nx.appendChild(h('div',{style:{background:'var(--accent-light)',borderRadius:'12px',padding:'10px'},innerHTML:svg('right',20,'var(--accent)')}));el.appendChild(nx);}
var acts=h('div',{className:'grid-2',style:{marginBottom:'10px'}});acts.appendChild(h('button',{className:'btn btn-secondary btn-block btn-sm',innerHTML:svg('plus',12)+' Programs',onClick:function(){S.tab='programs';R();}}));acts.appendChild(h('button',{className:'btn btn-secondary btn-block btn-sm',innerHTML:svg('settings',12)+' Days',onClick:function(){S.modal='adjustDays';R();}}));el.appendChild(acts);
// Weeks
el.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,margin:'10px 0 8px'}},'Weeks'));var wg=h('div',{className:'grid-3',style:{marginBottom:'16px'}});
for(var w=1;w<=pd.weeks;w++){(function(wk){var wkD=pd.data[wk];if(!wkD||!wkD.days)return;var dl=Object.keys(S.logs).filter(function(k){return k.startsWith(ap.id+'_w'+wk);}).length;var td=0;for(var i=1;i<=ap.days;i++){var dy=wkD.days?wkD.days[i]:null;if(dy&&!dy.isRest)td++;}var p=td>0?Math.round(dl/td*100):0;
// S&C Element indicator
var isSC=ap.id.indexOf('sc_')===0;var scEls=ap.scElements||[];
wg.appendChild(h('button',{style:{background:'var(--card)',borderRadius:'12px',padding:'12px',border:'2px solid '+(p===100?'var(--success)':'var(--border)'),cursor:'pointer',textAlign:'center',width:'100%'},onClick:function(){S.week=wk;S.tab='program';R();}},h('p',{style:{fontSize:'18px',fontWeight:800,margin:0}},p===100?'\u2713':'W'+wk),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},wkD.name||''),h('div',{className:'progress-bar',style:{marginTop:'4px'}},h('div',{className:'progress-fill',style:{width:p+'%'}}))));
})(w);}el.appendChild(wg);return rDashWidgets(el);}

// === WEEKLY SUMMARY ===
function rWeeklySummary(){
  var now=new Date();var ws=new Date(now);ws.setDate(ws.getDate()-ws.getDay());ws.setHours(0,0,0,0);
  var we=new Date(ws);we.setDate(we.getDate()+6);we.setHours(23,59,59);
  var wkVol=0,wkSessions=0,wkSets=0,wkPRs=0,wkCustom=0;
  Object.keys(S.logs).forEach(function(k){var l=S.logs[k];if(!l||!l.date)return;var d=new Date(l.date);if(d<ws||d>we)return;
    wkSessions++;Object.keys(l).forEach(function(ek){if(ek.startsWith('e'))Object.keys(l[ek]).forEach(function(sk){if(sk.startsWith('s')){var s=l[ek][sk];wkVol+=(parseFloat(s.w)||0)*(parseFloat(s.r)||0);wkSets++;}});});});
  // Count custom workouts this week
  if(S.customWks)S.customWks.forEach(function(cw){if(cw&&cw.date){var d=new Date(cw.date);if(d>=ws&&d<=we)wkCustom++;}});
  // Compare to last week
  var lws=new Date(ws);lws.setDate(lws.getDate()-7);var lwe=new Date(ws);lwe.setDate(lwe.getDate()-1);lwe.setHours(23,59,59);
  var lwVol=0;Object.keys(S.logs).forEach(function(k){var l=S.logs[k];if(!l||!l.date)return;var d=new Date(l.date);if(d<lws||d>lwe)return;
    Object.keys(l).forEach(function(ek){if(ek.startsWith('e'))Object.keys(l[ek]).forEach(function(sk){if(sk.startsWith('s')){var s=l[ek][sk];lwVol+=(parseFloat(s.w)||0)*(parseFloat(s.r)||0);}});});});
  var pctChange=lwVol>0?Math.round((wkVol-lwVol)/lwVol*100):0;

  var sc=h('div',{className:'card',style:{padding:'14px'}});
  sc.appendChild(h('h3',{style:{fontSize:'13px',fontWeight:700,marginBottom:'8px'}},'This Week'));
  var grid=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',textAlign:'center'}});
  grid.appendChild(h('div',null,h('p',{style:{fontSize:'18px',fontWeight:800,margin:0,color:'var(--accent)'}},wkVol>0?(wkVol/1000).toFixed(1)+'k':'0'),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'lbs volume'+(pctChange!==0?' ('+(pctChange>0?'+':'')+pctChange+'%)':''))));
  grid.appendChild(h('div',null,h('p',{style:{fontSize:'18px',fontWeight:800,margin:0}},wkSessions+(wkCustom?'+'+wkCustom:'')),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'sessions'+(wkCustom?' (+'+wkCustom+' outside)':''))));
  grid.appendChild(h('div',null,h('p',{style:{fontSize:'18px',fontWeight:800,margin:0}},wkSets+''),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'sets logged')));
  sc.appendChild(grid);return sc;
}

// Dashboard widgets
function rDashWidgets(el){
  var st=getDashStats();
  el.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'8px'}},'Analytics'));
  var r1=h('div',{className:'grid-2',style:{marginBottom:'8px'}});
  var volC=h('div',{className:'drill-card',onClick:function(){S.drill='volume';R();}});volC.appendChild(h('div',{className:'drill-hdr'},h('span',{className:'drill-sub'},'Total Volume'),h('span',{innerHTML:svg('right',14,'var(--text2)')})));
  volC.appendChild(h('p',{className:'drill-val'},st&&st.totalVol>0?(st.totalVol/1000).toFixed(1)+'k':'\u2014'));volC.appendChild(h('p',{className:'drill-sub'},'lbs moved'));
  if(st&&st.weekVols&&st.weekVols.length>1){var maxWV=Math.max.apply(null,st.weekVols)||1;var mc=h('div',{className:'mini-chart'});st.weekVols.forEach(function(v){mc.appendChild(h('div',{className:'mini-bar',style:{height:Math.max(v/maxWV*100,3)+'%'}}));});volC.appendChild(mc);}
  r1.appendChild(volC);
  var wkC=h('div',{className:'drill-card',onClick:function(){S.drill='workouts';R();}});wkC.appendChild(h('div',{className:'drill-hdr'},h('span',{className:'drill-sub'},'Workouts'),h('span',{innerHTML:svg('right',14,'var(--text2)')})));
  wkC.appendChild(h('p',{className:'drill-val'},st?''+st.totalWk:'0'));wkC.appendChild(h('p',{className:'drill-sub'},'completed'));r1.appendChild(wkC);el.appendChild(r1);
  var r2=h('div',{className:'grid-2',style:{marginBottom:'8px'}});
  var bdC=h('div',{className:'drill-card',onClick:function(){S.drill='bestday';R();}});bdC.appendChild(h('div',{className:'drill-hdr'},h('span',{className:'drill-sub'},'Best Session'),h('span',{innerHTML:svg('right',14,'var(--text2)')})));
  bdC.appendChild(h('p',{className:'drill-val'},st&&st.bestDay&&st.bestDay.vol>0?Math.round(st.bestDay.vol).toLocaleString():'\u2014'));bdC.appendChild(h('p',{className:'drill-sub'},st&&st.bestDay&&st.bestDay.date?'W'+st.bestDay.w+' D'+st.bestDay.d:'No data'));r2.appendChild(bdC);
  var prC=h('div',{className:'drill-card',onClick:function(){S.drill='prs';R();}});prC.appendChild(h('div',{className:'drill-hdr'},h('span',{className:'drill-sub'},'Personal Records'),h('span',{innerHTML:svg('right',14,'var(--text2)')})));
  prC.appendChild(h('p',{className:'drill-val'},''+Object.keys(S.prs).length));prC.appendChild(h('p',{className:'drill-sub'},'PRs set'));r2.appendChild(prC);el.appendChild(r2);
  var r3=h('div',{className:'grid-2',style:{marginBottom:'8px'}});
  var teC=h('div',{className:'drill-card',onClick:function(){S.drill='topex';R();}});teC.appendChild(h('div',{className:'drill-hdr'},h('span',{className:'drill-sub'},'Top Exercises'),h('span',{innerHTML:svg('right',14,'var(--text2)')})));
  teC.appendChild(h('p',{className:'drill-val'},st&&st.topExes&&st.topExes.length>0?st.topExes[0].name.split(' ').slice(0,2).join(' '):'\u2014'));teC.appendChild(h('p',{className:'drill-sub'},'by volume'));r3.appendChild(teC);
  var dbC=h('div',{className:'drill-card',onClick:function(){S.drill='exdb';R();}});dbC.appendChild(h('div',{className:'drill-hdr'},h('span',{className:'drill-sub'},'Exercise Database'),h('span',{innerHTML:svg('right',14,'var(--text2)')})));
  dbC.appendChild(h('p',{className:'drill-val'},'\uD83D\uDCCA'));dbC.appendChild(h('p',{className:'drill-sub'},'Search & track'));r3.appendChild(dbC);el.appendChild(r3);
  return el;
}

// === DRILL-DOWN VIEWS ===
function rDrill(el){
  el.appendChild(h('button',{className:'back-btn',innerHTML:svg('left',14,'var(--accent)')+' Dashboard',onClick:function(){S.drill=null;S.exDB=null;R();}}));
  if(S.drill==='volume')return rDrillVol(el);
  if(S.drill==='workouts')return rDrillWk(el);
  if(S.drill==='bestday')return rDrillBest(el);
  if(S.drill==='prs')return rDrillPR(el);
  if(S.drill==='topex')return rDrillTopEx(el);
  if(S.drill==='exdb')return rDrillExDB(el);
  return el;
}

function rDrillVol(el){var st=getDashStats();if(!st)return el;
  el.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,marginBottom:'4px'}},'Volume Breakdown'));
  el.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px',marginBottom:'14px'}},'Total: '+Math.round(st.totalVol).toLocaleString()+' lbs across '+st.totalSets+' sets'));
  // Weekly volume bars
  var c=h('div',{className:'card'});c.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'Volume by Week'));
  var maxV=Math.max.apply(null,st.weekVols)||1;
  st.weekVols.forEach(function(v,i){var pct=maxV>0?(v/maxV*100):0;
    var row=h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}});
    row.appendChild(h('span',{style:{fontSize:'11px',fontWeight:700,width:'30px',color:'var(--text2)'}},'W'+(i+1)));
    var barBg=h('div',{style:{flex:1,background:'var(--border)',borderRadius:'4px',height:'16px',overflow:'hidden'}});
    barBg.appendChild(h('div',{style:{width:pct+'%',height:'100%',background:'var(--accent)',borderRadius:'4px',transition:'width .3s'}}));
    row.appendChild(barBg);
    row.appendChild(h('span',{style:{fontSize:'10px',fontWeight:700,width:'50px',textAlign:'right'}},v>0?(v/1000).toFixed(1)+'k':'-'));
    c.appendChild(row);});el.appendChild(c);
  // Top contributing exercises
  if(st.topExes.length>0){var tc=h('div',{className:'card'});tc.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'Where Your Volume Came From'));
    st.topExes.slice(0,8).forEach(function(ex,i){tc.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('span',{style:{fontSize:'12px',fontWeight:600}},(i+1)+'. '+ex.name),h('span',{style:{fontSize:'12px',fontWeight:700,color:'var(--accent)'}},Math.round(ex.vol).toLocaleString())));});
    el.appendChild(tc);}return el;}

function rDrillWk(el){var st=getDashStats();if(!st)return el;
  el.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,marginBottom:'4px'}},'Workout History'));
  el.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px',marginBottom:'14px'}},st.totalWk+' workouts \u00B7 '+st.totalSets+' sets \u00B7 '+st.totalReps.toLocaleString()+' reps'));
  st.recentLogs.slice(0,20).forEach(function(log){var c=h('div',{className:'card',style:{padding:'12px'}});
    var top=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}});
    top.appendChild(h('div',null,h('p',{style:{fontWeight:700,fontSize:'13px'}},log.name),h('p',{style:{color:'var(--text2)',fontSize:'10px'}},'W'+log.w+' D'+log.d+' \u00B7 '+new Date(log.date).toLocaleDateString())));
    top.appendChild(h('span',{style:{fontWeight:800,fontSize:'14px',color:'var(--accent)'}},Math.round(log.vol).toLocaleString()+' lbs'));
    c.appendChild(top);el.appendChild(c);});return el;}

function rDrillBest(el){var st=getDashStats();if(!st||!st.bestDay.date)return el;
  el.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,marginBottom:'4px'}},'\uD83C\uDFC6 Best Session'));
  el.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px',marginBottom:'14px'}},Math.round(st.bestDay.vol).toLocaleString()+' lbs on '+new Date(st.bestDay.date).toLocaleDateString()));
  var ap=gAP(),pd=ap?gPD(ap.id):null;if(!ap||!pd)return el;
  var log=S.logs[lk(ap.id,st.bestDay.w,st.bestDay.d)];var wkD=pd.data[st.bestDay.w];if(!wkD)return el;var dayD=wkD&&wkD.days?wkD.days[st.bestDay.d]:null;
  if(dayD&&dayD.ex){var c=h('div',{className:'card'});c.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},dayD.name+' \u2014 W'+st.bestDay.w+' D'+st.bestDay.d));
    dayD.ex.forEach(function(ex,ei){var eLog=log?log['e'+ei]:{};if(!eLog)return;var exVol=0;Object.keys(eLog).forEach(function(sk){if(sk.startsWith('s')){var s=eLog[sk];exVol+=(parseFloat(s.w)||0)*(parseFloat(s.r)||0);}});
      if(exVol>0)c.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}},h('span',{style:{fontSize:'12px',fontWeight:600}},ex.n),h('span',{style:{fontSize:'12px',fontWeight:700,color:'var(--accent)'}},Math.round(exVol).toLocaleString()+' lbs')));});
    el.appendChild(c);}
  // Compare to other sessions
  var sorted=st.recentLogs.slice().sort(function(a,b){return b.vol-a.vol;});
  if(sorted.length>1){var rc=h('div',{className:'card'});rc.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'All Sessions Ranked'));
    sorted.slice(0,10).forEach(function(log,i){rc.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border)'}},h('span',{style:{fontSize:'11px',fontWeight:600,color:i===0?'var(--accent)':'var(--text)'}},(i===0?'\uD83E\uDD47 ':'')+'W'+log.w+'D'+log.d+' '+log.name),h('span',{style:{fontSize:'11px',fontWeight:700}},Math.round(log.vol).toLocaleString())));});el.appendChild(rc);}return el;}

function rDrillPR(el){
  el.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,marginBottom:'14px'}},'\uD83C\uDFC6 Personal Records'));
  var keys=Object.keys(S.prs);if(keys.length===0){el.appendChild(h('p',{style:{color:'var(--text2)',textAlign:'center',padding:'30px'}},'No PRs yet. Start logging workouts!'));return el;}
  keys.sort(function(a,b){return S.prs[b]-S.prs[a];});
  var c=h('div',{className:'card'});keys.forEach(function(k,i){c.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<keys.length-1?'1px solid var(--border)':'none'}},h('span',{style:{fontSize:'13px',fontWeight:600}},k.replace(/_/g,' ')),h('span',{style:{fontSize:'14px',fontWeight:800,color:'var(--accent)'}},S.prs[k]+' lbs')));});el.appendChild(c);return el;}

function rDrillTopEx(el){var st=getDashStats();if(!st)return el;
  el.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,marginBottom:'14px'}},'Top Exercises by Volume'));
  if(st.topExes.length===0){el.appendChild(h('p',{style:{color:'var(--text2)',textAlign:'center',padding:'30px'}},'No data yet.'));return el;}
  var c=h('div',{className:'card'});var maxV=st.topExes[0].vol||1;
  st.topExes.forEach(function(ex,i){var pct=(ex.vol/maxV*100);
    var row=h('div',{style:{marginBottom:'10px'}});row.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:'3px'}},h('span',{style:{fontSize:'12px',fontWeight:600}},(i+1)+'. '+ex.name),h('span',{style:{fontSize:'11px',fontWeight:700,color:'var(--accent)'}},Math.round(ex.vol).toLocaleString()+' lbs')));
    var bg=h('div',{style:{background:'var(--border)',borderRadius:'4px',height:'8px',overflow:'hidden'}});bg.appendChild(h('div',{style:{width:pct+'%',height:'100%',background:'var(--accent)',borderRadius:'4px'}}));row.appendChild(bg);c.appendChild(row);});
  el.appendChild(c);
  // Clickable to drill into each exercise
  el.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'11px',marginTop:'8px',textAlign:'center'}},'Use Exercise Database for per-exercise analytics'));return el;}

function rDrillExDB(el){
  var db=getExDB();var exNames=Object.keys(db).sort();
  // If viewing a specific exercise
  if(S.exDB){var ex=db[S.exDB];if(!ex){S.exDB=null;return rDrillExDB(el);}
    el.appendChild(h('button',{className:'back-btn',innerHTML:svg('left',14,'var(--accent)')+' All Exercises',onClick:function(){S.exDB=null;R();}}));
    el.appendChild(h('h2',{style:{fontSize:'18px',fontWeight:800,marginBottom:'4px'}},ex.name));
    // 1RM Calculator
    if(ex.bestW>0){var bestEntry=ex.entries.filter(function(e){return e.w===ex.bestW;})[0];var bestReps=bestEntry?bestEntry.r:1;var estimated1rm=est1RM(ex.bestW,bestReps);
    el.appendChild(h('div',{style:{background:'var(--accent-light)',borderRadius:'8px',padding:'10px',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}},
      h('div',null,h('p',{style:{fontSize:'10px',fontWeight:700,color:'var(--accent)'}},'ESTIMATED 1RM (Epley)'),h('p',{style:{fontSize:'20px',fontWeight:800,margin:'2px 0 0'}},estimated1rm+' lbs')),
      h('div',{style:{textAlign:'right'}},h('p',{style:{fontSize:'10px',color:'var(--text2)'}},'Based on '+ex.bestW+'lbs \u00D7 '+bestReps),h('p',{style:{fontSize:'9px',color:'var(--text2)',marginTop:'2px'}},'Strength zones:'),h('p',{style:{fontSize:'9px',color:'var(--text2)'}},Math.round(estimated1rm*0.85)+' (85%) \u00B7 '+Math.round(estimated1rm*0.7)+' (70%)'))
    ));}
    el.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px',marginBottom:'14px'}},ex.sessions+' sessions \u00B7 Best: '+ex.bestW+' lbs \u00B7 Total: '+Math.round(ex.totalVol).toLocaleString()+' lbs'));
    // Progression stats
    var wEntries=ex.entries.filter(function(e){return e.w>0;});
    if(wEntries.length>=2){
      var pCard=h('div',{className:'card',style:{marginBottom:'10px'}});
      pCard.appendChild(h('h3',{style:{fontSize:'13px',fontWeight:700,marginBottom:'8px'}},'\uD83D\uDCC8 Progression'));
      var bestVol=0,bestSet=null;ex.entries.forEach(function(e){if(e.vol>bestVol){bestVol=e.vol;bestSet=e;}});
      if(bestSet){pCard.appendChild(h('div',{style:{background:'rgba(16,185,129,0.08)',borderRadius:'8px',padding:'8px 10px',marginBottom:'8px',display:'flex',justifyContent:'space-between'}},
        h('span',{style:{fontSize:'11px',fontWeight:600}},'\uD83C\uDFC6 Best Set'),
        h('span',{style:{fontSize:'11px',fontWeight:800,color:'#10b981'}},bestSet.w+'lbs \u00D7 '+bestSet.r+' = '+Math.round(bestVol)+' vol')
      ));}
      if(wEntries.length>=3){
      var first3=wEntries.slice(0,3);var last3=wEntries.slice(-3);
      var avgFirst=first3.reduce(function(s,e){return s+e.w;},0)/first3.length;
      var avgLast=last3.reduce(function(s,e){return s+e.w;},0)/last3.length;
      var change=avgLast-avgFirst;var pctChange=avgFirst>0?((change/avgFirst)*100):0;
      var trendIcon=change>0?'\u2191':change<0?'\u2193':'\u2192';
      var trendColor=change>0?'#10b981':change<0?'var(--accent)':'var(--text2)';
      var pgrid=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',textAlign:'center'}});
      pgrid.appendChild(h('div',null,h('p',{style:{fontSize:'14px',fontWeight:800,margin:0}},Math.round(avgFirst)+''),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'First 3 avg')));
      pgrid.appendChild(h('div',null,h('p',{style:{fontSize:'14px',fontWeight:800,margin:0,color:trendColor}},trendIcon+' '+Math.abs(pctChange).toFixed(1)+'%'),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'Change')));
      pgrid.appendChild(h('div',null,h('p',{style:{fontSize:'14px',fontWeight:800,margin:0}},Math.round(avgLast)+''),h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:0}},'Last 3 avg')));
      pCard.appendChild(pgrid);
      var volFirst=first3.reduce(function(s,e){return s+e.vol;},0);var volLast=last3.reduce(function(s,e){return s+e.vol;},0);
      var volChange=volLast-volFirst;var volPct=volFirst>0?((volChange/volFirst)*100):0;
      pCard.appendChild(h('p',{style:{fontSize:'10px',color:'var(--text2)',marginTop:'8px',textAlign:'center'}},'Volume: '+(volFirst/1000).toFixed(1)+'k \u2192 '+(volLast/1000).toFixed(1)+'k ('+(volChange>0?'+':'')+volPct.toFixed(0)+'%)'));
      var desc=pctChange>10?'Strong progress! Weight consistently increasing.':pctChange>3?'Steady gains. Keep it up.':pctChange>-3?'Maintaining. Consider progressive overload if plateau persists.':'Weight trending down. Could be intentional deload or time to reassess.';
      pCard.appendChild(h('p',{style:{fontSize:'10px',color:trendColor,marginTop:'4px',textAlign:'center',fontStyle:'italic'}},desc));
      }
      if(ex.entries.length>=2){var firstDate=new Date(ex.entries[0].date);var lastDate=new Date(ex.entries[ex.entries.length-1].date);var daySpan=Math.max(1,(lastDate-firstDate)/(1000*60*60*24));var freq=(ex.sessions/daySpan*7).toFixed(1);
      pCard.appendChild(h('p',{style:{fontSize:'10px',color:'var(--text2)',marginTop:'6px',textAlign:'center'}},'Frequency: ~'+freq+'x/week over '+Math.round(daySpan)+' days'));}
      el.appendChild(pCard);
    }
    // Weight progression chart
    var wts=ex.entries.filter(function(e){return e.w>0;});
    if(wts.length>1){var cc=h('div',{className:'card'});cc.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'Weight Progression'));
      var maxW=0;wts.forEach(function(e){if(e.w>maxW)maxW=e.w;});
      var bc=h('div',{style:{display:'flex',alignItems:'flex-end',gap:'2px',height:'80px'}});
      wts.forEach(function(e){var pct=maxW>0?(e.w/maxW*100):0;
        var b=h('div',{style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'1px'}});
        b.appendChild(h('span',{style:{fontSize:'7px',color:'var(--text2)'}},e.w>0?''+Math.round(e.w):''));
        b.appendChild(h('div',{style:{width:'100%',height:Math.max(pct,4)+'%',background:'var(--accent)',borderRadius:'2px 2px 0 0'}}));bc.appendChild(b);});
      cc.appendChild(bc);el.appendChild(cc);}
    // Full log table
    var tc=h('div',{className:'card'});tc.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'All Sets'));
    var th=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 60px 50px 70px',gap:'4px',paddingBottom:'4px',borderBottom:'1px solid var(--border)'}});
    ['Date','Weight','Reps','Volume'].forEach(function(t){th.appendChild(h('span',{className:'set-hdr'},t));});tc.appendChild(th);
    ex.entries.slice().reverse().forEach(function(e){var row=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 60px 50px 70px',gap:'4px',padding:'4px 0',borderBottom:'1px solid var(--border)',fontSize:'11px'}});
      row.appendChild(h('span',null,new Date(e.date).toLocaleDateString()));
      row.appendChild(h('span',{style:{fontWeight:700}},e.w>0?e.w+'':''));
      row.appendChild(h('span',null,e.r>0?''+e.r:''));
      row.appendChild(h('span',{style:{fontWeight:700,color:'var(--accent)'}},e.vol>0?Math.round(e.vol).toLocaleString():''));
      tc.appendChild(row);});el.appendChild(tc);return el;}
  // Exercise list
  el.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,marginBottom:'4px'}},'Exercise Database'));
  el.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px',marginBottom:'14px'}},exNames.length+' exercises tracked'));
  if(exNames.length===0){el.appendChild(h('p',{style:{color:'var(--text2)',textAlign:'center',padding:'30px'}},'No exercise data yet. Complete some workouts!'));return el;}
  exNames.forEach(function(name){var ex=db[name];
    var c=h('div',{className:'ex-db-card',style:{cursor:'pointer'},onClick:function(){S.exDB=name;R();}});
    c.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},h('div',null,h('p',{style:{fontWeight:700,fontSize:'13px',margin:0}},name),h('p',{style:{color:'var(--text2)',fontSize:'10px',margin:'2px 0 0'}},ex.sessions+'x \u00B7 Best: '+ex.bestW+'lbs')),h('span',{innerHTML:svg('right',14,'var(--text2)')})));
    // Mini progression
    if(ex.entries.length>2){var maxW=ex.bestW||1;var mc=h('div',{className:'mini-chart'});
      var recent=ex.entries.slice(-15);recent.forEach(function(e){mc.appendChild(h('div',{className:'mini-bar',style:{height:Math.max(e.w/maxW*100,4)+'%'}}));});c.appendChild(mc);}
    el.appendChild(c);});return el;}
