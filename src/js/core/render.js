// === H5 TITAN DOG LOGO SVG ===
var REDWOLF_SVG='<svg width="22" height="22" viewBox="0 0 100 100" style="vertical-align:middle;margin-right:4px"><g fill="#c8102e"><polygon points="50,16 76,32 80,56 68,72 32,72 20,56 24,32"/><polygon points="50,16 24,32 20,56 32,72 50,76" fill="#a00d24" opacity="0.6"/><polygon points="24,32 12,10 40,24"/><polygon points="76,32 88,10 60,24"/><polygon points="25,31 16,14 38,25" fill="#8b0000"/><polygon points="75,31 84,14 62,25" fill="#8b0000"/><polygon points="50,46 66,54 60,68 40,68 34,54" fill="#8b0000"/><polygon points="46,50 50,46 54,50 50,53" fill="#0a0a0a"/><ellipse cx="38" cy="40" rx="6" ry="4.5" fill="#fff"/><circle cx="39" cy="40" r="3" fill="#0a0a0a"/><circle cx="39.8" cy="39.5" r="1" fill="#fff"/><ellipse cx="62" cy="40" rx="6" ry="4.5" fill="#fff"/><circle cx="61" cy="40" r="3" fill="#0a0a0a"/><circle cx="61.8" cy="39.5" r="1" fill="#fff"/><polygon points="26,32 32,28 44,36 42,38" fill="#8b0000"/><polygon points="74,32 68,28 56,36 58,38" fill="#8b0000"/><line x1="50" y1="16" x2="50" y2="46" stroke="#8b0000" stroke-width="1" opacity="0.4"/><rect x="28" y="72" width="44" height="5" rx="2" fill="#8b0000"/><rect x="38" y="73" width="4" height="3" rx="1" fill="#555"/><rect x="48" y="73" width="4" height="3" rx="1" fill="#555"/><rect x="58" y="73" width="4" height="3" rx="1" fill="#555"/></g></svg>';

// === MAIN RENDER ===

function showFatalError(err){console.error('[RRE] FATAL:',err);
  var app=document.getElementById('app');
  var d=document.createElement('div');
  d.style.cssText='padding:40px;text-align:center;font-family:system-ui';
  var h2=document.createElement('h2');
  h2.style.color='#c8102e';h2.textContent='App Error';
  var p=document.createElement('p');
  p.style.cssText='color:#666;margin:12px 0;font-size:13px;word-break:break-all';
  p.textContent=err.message||'Unknown error';
  var b1=document.createElement('button');
  b1.style.cssText='padding:10px 20px;background:#c8102e;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px';
  b1.textContent='Retry';
  b1.onclick=function(){S.tab='home';S.drill=null;try{R();}catch(e){location.reload();}};
  var b2=document.createElement('button');
  b2.style.cssText='padding:8px 16px;margin-top:8px;background:#666;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;display:block;margin-left:auto;margin-right:auto';
  b2.textContent='Reset App';
  b2.onclick=function(){localStorage.clear();location.reload();};
  d.appendChild(h2);d.appendChild(p);d.appendChild(b1);d.appendChild(document.createElement('br'));d.appendChild(b2);
  app.innerHTML='';app.appendChild(d);
}

function R(){var app=document.getElementById('app');app.innerHTML='';try{
// State validation
if(!S)S={};
if(!S.enrolled)S.enrolled=[];
if(!S.tab)S.tab='home';
if(!S.screen)S.screen='app';
if(!S.profile)S.profile={};
if(!S.logs)S.logs={};
if(!S.prs)S.prs={};
if(!S.show)S.show={};
if(!S.chatMsgs)S.chatMsgs=[];
if(!S.bodyLogs)S.bodyLogs=[];
if(!S.coachCache)S.coachCache={};
if(!S.customWks)S.customWks=[];
if(!S.restDayLogs)S.restDayLogs={};
if(!S.redInsights)S.redInsights=[];
if(!S.chatH)S.chatH=[];
if(!S.curLog)S.curLog={};
S.week=S.week||1;S.day=S.day||1;
if(S.screen==='onboarding'){app.appendChild(rOB());return;}
var top=h('div',{className:'top-bar'});
var logo=h('h1',{onClick:function(){S.drill=null;S.exDB=null;S.tab='home';R();},style:{cursor:'pointer'}});
logo.innerHTML=REDWOLF_SVG.replace('width="22"','width="36"').replace('height="22"','height="36"');logo.appendChild(document.createTextNode(' RedRiversEdgeFitness'));
top.appendChild(logo);
var pInit=(S.profile.name||'U')[0].toUpperCase();
var pBtn=h('button',{'aria-label':'Open profile',style:{width:'32px',height:'32px',borderRadius:'50%',border:'2px solid #c8102e',background:'transparent',color:'#c8102e',fontSize:'14px',fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit',letterSpacing:'-0.5px',flexShrink:0},onClick:function(){S.tab='profile';S.drill=null;S.exDB=null;R();}});
pBtn.textContent=pInit;
if(S.tab==='profile')pBtn.style.background='#c8102e',pBtn.style.color='#fff';
top.appendChild(pBtn);app.appendChild(top);
var content=h('div',{style:{paddingTop:'10px'}});
// Cleanup chat viewport listeners when leaving chat tab
var prevChat=document.querySelector('.page._vpActive');
if(prevChat&&prevChat._vpCleanup){prevChat._vpCleanup();prevChat.classList.remove('_vpActive');}
var navBar=document.querySelector('.bottom-nav');
if(navBar)navBar.style.display='';

// Safe tab rendering with visible diagnostics
var merged=null;
try{merged=getMergedSchedule();}catch(me){console.error('[RRE] merge error:',me);}

function safeRender(fn,name){
  var caughtErr=null;
  try{
    var result=fn();
    if(result&&result.nodeType){content.appendChild(result);return true;}
    caughtErr={message:name+' returned non-element: '+typeof result,stack:''};
    console.error('[RRE]',name,'returned non-element:',typeof result);
  }catch(err){
    caughtErr=err;
    console.error('[RRE]',name,'crashed:',err);
  }
  // Fallback: show error with state info
  var errDiv=h('div',{style:{padding:'20px',margin:'20px',border:'2px solid #c8102e',borderRadius:'12px',background:'#fff',color:'#333'}});
  errDiv.appendChild(h('h3',{style:{color:'#c8102e',margin:'0 0 8px'}},name+' failed to load'));
  if(caughtErr){errDiv.appendChild(h('p',{style:{fontSize:'11px',margin:'4px 0',color:'#c8102e',fontWeight:700,wordBreak:'break-all'}},'ERROR: '+(caughtErr.message||String(caughtErr))));errDiv.appendChild(h('p',{style:{fontSize:'9px',margin:'4px 0',color:'#666',wordBreak:'break-all',whiteSpace:'pre-wrap',maxHeight:'120px',overflow:'auto'}},(caughtErr.stack||'no stack').substring(0,500)));}
  errDiv.appendChild(h('p',{style:{fontSize:'12px',margin:'4px 0'}},'Tab: '+S.tab));
  errDiv.appendChild(h('p',{style:{fontSize:'12px',margin:'4px 0'}},'Enrolled: '+S.enrolled.length+' programs'));
  errDiv.appendChild(h('p',{style:{fontSize:'12px',margin:'4px 0'}},'Active: '+(S.active||'none')));
  errDiv.appendChild(h('p',{style:{fontSize:'12px',margin:'4px 0'}},'Active exists in PROGRAMS: '+(S.active&&PROGRAMS[S.active]?'YES':'NO')));
  errDiv.appendChild(h('p',{style:{fontSize:'12px',margin:'4px 0'}},'S.week='+S.week+' S.day='+S.day));
  if(S.enrolled.length>0){
    errDiv.appendChild(h('p',{style:{fontSize:'12px',margin:'4px 0'}},'Enrolled IDs: '+S.enrolled.map(function(e){return e.id;}).join(', ')));
    errDiv.appendChild(h('p',{style:{fontSize:'12px',margin:'4px 0'}},'All exist in PROGRAMS: '+S.enrolled.every(function(e){return !!PROGRAMS[e.id];})));
  }
  errDiv.appendChild(h('button',{className:'btn btn-primary btn-sm',style:{marginTop:'12px'},onClick:function(){S.tab='home';S.drill=null;R();}},'Retry Home'));
  errDiv.appendChild(h('button',{className:'btn btn-secondary btn-sm',style:{marginTop:'8px',marginLeft:'8px'},onClick:function(){
    S.enrolled=[];S.active='';sv();S.tab='home';R();
  }},'Reset Programs'));
  content.appendChild(errDiv);
  return false;
}

if(S.tab==='home')safeRender(rHome,'rHome');
else if(S.tab==='program')safeRender(rProg,'rProg');
else if(S.tab==='track'){
  // Auto-navigate to next unlogged workout (unless user chose specific day)
  var _isMerged=!!(merged&&S.enrolled.length>1);
  // Editing a day (even a finished one) pins Track to it until Save.
  var _curDayKey=_isMerged?'merged_w'+S.week+'d'+S.day:(gAP()?lk(gAP().id,S.week,S.day):'');
  var _editing=!!(_curDayKey&&S._curLogKey===_curDayKey&&curLogHasSets(S.curLog)&&JSON.stringify(S.curLog)!==JSON.stringify(S.logs[_curDayKey]||{}));
  if(!S._trackManual&&!_editing){
    if(_isMerged){
      // Merged plans log under merged_w*d*, so they need their own "next workout".
      if(S.logs['merged_w'+S.week+'d'+S.day]||!merged.schedule[S.day-1]||merged.schedule[S.day-1].isRest){
        var _mn=getNextMergedDay(merged);
        if(_mn&&(S.week!==_mn.w||S.day!==_mn.d)){S.week=_mn.w;S.day=_mn.d;}
      }
    } else {
      var _ap=gAP(),_pd=_ap?gPD(_ap.id):null;
      if(_ap&&_pd){
        var _nxt=getNextWorkout(_ap,_pd);
        if(_nxt&&(S.week!==_nxt.w||S.day!==_nxt.d)){
          S.week=_nxt.w;S.day=_nxt.d;loadCL();
        }
      }
    }
  }
  S._trackManual=false;
  if(_isMerged)safeRender(rMergedTrack,'rMergedTrack');
  else safeRender(rTrack,'rTrack');
}
else if(S.tab==='progress')safeRender(rProgress,'rProgress');
else if(S.tab==='chat'){
  safeRender(function(){var cp=rChat();if(cp)cp.classList.add('_vpActive');return cp;},'rChat');
}
else if(S.tab==='programs')safeRender(rPP,'rPP');
else if(S.tab==='profile')safeRender(rProfile,'rProfile');
app.appendChild(content);
var nav=h('div',{className:'bottom-nav'});
[{id:'home',l:'Home',i:'home'},{id:'track',l:'Track',i:'dumbbell'},{id:'chat',l:'Red',i:'red_wolf'},{id:'progress',l:'Progress',i:'chart'},{id:'program',l:'Program',i:'book'}].forEach(function(tab){
if(tab.i==='red_wolf'){
  var btn=h('button',{className:'nav-btn nav-red'+(S.tab===tab.id?' active':'')});
  var tabWrap=h('div',{className:'red-tab'});
  var tabBg=h('div',{className:'red-tab-bg'});
  var glowOuter=h('div',{className:'red-glow-outer'});
  var glowInner=h('div',{className:'red-glow-inner'});
  var wolfWrap=h('div',{className:'red-wolf-wrap',style:{position:'relative'}});
  // Notification badge for pending insights
  var pendingInsights=S.redInsights&&S.redInsights.length>0;
  if(pendingInsights&&S.tab!==tab.id){var badge=h('div',{style:{position:'absolute',top:'-2px',right:'-2px',width:'10px',height:'10px',borderRadius:'50%',background:'var(--accent)',border:'2px solid var(--bg)',zIndex:5}});wolfWrap.appendChild(badge);}
  var wolfSize=S.tab===tab.id?'60':'56';
  wolfWrap.innerHTML=REDWOLF_SVG.replace('width="22"','width="'+wolfSize+'"').replace('height="22"','height="'+wolfSize+'"').replace('vertical-align:middle;margin-right:4px','display:block');
  tabWrap.appendChild(tabBg);tabWrap.appendChild(glowOuter);tabWrap.appendChild(glowInner);tabWrap.appendChild(wolfWrap);
  var redLabel=h('span',{className:'red-label'},'RED');
  tabWrap.appendChild(redLabel);btn.appendChild(tabWrap);
  btn.addEventListener('click',function(){S.tab=tab.id;S.drill=null;S.exDB=null;R();});nav.appendChild(btn);
}else{
  var btn=h('button',{className:'nav-btn'+(S.tab===tab.id?' active':'')});btn.innerHTML=svg(tab.i,18,S.tab===tab.id?'var(--accent)':'var(--text2)');btn.appendChild(h('span',null,tab.l));
  btn.addEventListener('click',function(){S.tab=tab.id;S.drill=null;S.exDB=null;if(tab.id==='track')loadCL();R();});nav.appendChild(btn);
}});app.appendChild(nav);
if(S.modal==='adjustDays'){var ov=h('div',{className:'modal-ov',onClick:function(e){if(e.target===ov){S.modal=null;R();}}});ov.appendChild(rAD());app.appendChild(ov);}
if(S.modal==='customWk'){var ov=h('div',{className:'modal-ov',onClick:function(e){if(e.target===ov){S.modal=null;R();}}});ov.appendChild(rCWModal());app.appendChild(ov);}
if(S.modal&&S.modal.type==='confirm'){var ov=h('div',{className:'modal-ov',onClick:function(e){if(e.target===ov){S.modal=null;R();}}});var box=h('div',{className:'card',style:{maxWidth:'340px',width:'100%',padding:'24px'}});box.appendChild(h('h3',{style:{fontSize:'16px',fontWeight:700,marginBottom:'8px',color:'var(--danger)'}},S.modal.title||'Confirm'));box.appendChild(h('p',{style:{fontSize:'13px',color:'var(--text2)',marginBottom:'20px',lineHeight:'1.5'}},S.modal.msg||'Are you sure?'));var mBtns=h('div',{style:{display:'flex',gap:'8px'}});mBtns.appendChild(h('button',{className:'btn btn-secondary',style:{flex:1},onClick:function(){S.modal=null;R();}},S.modal.cancelText||'Cancel'));mBtns.appendChild(h('button',{className:'btn',style:{flex:1,background:'var(--danger)',color:'#fff',border:'none'},onClick:S.modal.onConfirm},S.modal.confirmText||'Confirm'));box.appendChild(mBtns);ov.appendChild(box);app.appendChild(ov);}
// Celebration Modal
if(S.modal&&S.modal.type==='celebration'){
  var _ov=h('div',{className:'modal-ov'});
  var _box=h('div',{className:'card',style:{maxWidth:'380px',width:'90%',padding:'24px',maxHeight:'85vh',overflowY:'auto'}});
  // 1. CONGRATS
  _box.appendChild(h('div',{style:{textAlign:'center',marginBottom:'16px'}},
    h('div',{style:{fontSize:'48px',marginBottom:'4px'}},'\uD83D\uDD25'),
    h('h2',{style:{fontSize:'20px',fontWeight:800,margin:'0 0 4px'}},'Workout Complete!'),
    h('p',{style:{color:'var(--accent)',fontWeight:600,fontSize:'14px',margin:0}},S.modal.dayName)));
  // Streak
  var _sk=getStreak();
  if(_sk.current>0)_box.appendChild(h('div',{style:{background:'var(--accent-light)',padding:'8px 12px',borderRadius:'8px',marginBottom:'16px',fontSize:'12px',textAlign:'center'}},
    h('span',{style:{fontWeight:700,color:'var(--accent)'}},'\uD83D\uDD25 '+(_sk.current||0)+' week streak \u00B7 '+(_sk.thisWeek||0)+(_sk.thisWeek===1?' session':' sessions')+' this week')));
  // 2. FEELING RATING (before Red's feedback so it's unbiased)
  if(S.modal.feeling===null){
    _box.appendChild(h('div',{style:{textAlign:'center',marginBottom:'16px'}},
      h('p',{style:{fontWeight:700,fontSize:'14px',margin:'0 0 10px'}},'How did that feel?')));
    var _feelRow=h('div',{style:{display:'flex',justifyContent:'center',gap:'6px',marginBottom:'8px',flexWrap:'wrap'}});
    for(var _f=1;_f<=10;_f++){(function(ff){
      var _label=ff<=3?'\uD83D\uDE2B':ff<=5?'\uD83D\uDE10':ff<=7?'\uD83D\uDE0A':ff<=9?'\uD83D\uDCAA':'\uD83D\uDD25';
      _feelRow.appendChild(h('button',{style:{width:'36px',height:'44px',borderRadius:'8px',border:'2px solid var(--border)',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'14px',transition:'all 0.15s'},
        onMouseOver:function(){this.style.borderColor='var(--accent)';this.style.transform='scale(1.1)';},
        onMouseOut:function(){this.style.borderColor='var(--border)';this.style.transform='scale(1)';},
        onClick:function(){
          S.modal.feeling=ff;
          // Save feeling to workout log
          // The Track tab has already advanced to the next workout, so use the key captured at Save.
          var _lk=S.modal.logKey||lk(S.modal.ap.id,S.modal.w||S.week,S.modal.d||S.day);
          if(S.logs[_lk])S.logs[_lk].feeling=ff;
          sv();
          // Trigger Red's post-workout feedback \u2014 pass the live log, not the stale modal snapshot
          var _liveLog=S.logs[_lk]||S.modal.curLog||S.curLog||{};
                    S.modal.redLoading=true;R();
          var _prompt=COACH_PROMPTS.postWorkout(S.modal.ap,S.modal.pd,S.modal.wk,S.modal.dy,_liveLog,ff,S.modal.w,S.modal.d);
          var _modalRef=S.modal;
          redRequest({system:_prompt.system,user:_prompt.user,maxTokens:550}).then(function(_txt){
            _modalRef.redFeedback=_txt;_modalRef.redLoading=false;if(S.modal===_modalRef)R();
          },function(e){
            _modalRef.redFeedback=(e.userMessage||"Red couldn't load the full breakdown.")+"\n\nNice work getting this one done. Get some protein in within the hour, your muscles earned it.";
            _modalRef.redFailed=true;_modalRef.redLoading=false;if(S.modal===_modalRef)R();
          });
        }},
        h('span',{style:{fontSize:'14px',lineHeight:1}},_label),
        h('span',{style:{fontSize:'10px',fontWeight:700,color:'var(--text2)'}},ff)));
    })(_f);}
    _box.appendChild(_feelRow);
    _box.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',fontSize:'9px',color:'var(--text2)',padding:'0 4px'}},
      h('span',null,'Rough'),h('span',null,'Crushed it')));
  } else {
    // Show selected feeling
    var _fLabel=S.modal.feeling<=3?'Tough one':S.modal.feeling<=5?'Solid grind':S.modal.feeling<=7?'Felt good':S.modal.feeling<=9?'Strong session':'Absolutely crushed it';
    _box.appendChild(h('div',{style:{textAlign:'center',padding:'8px 12px',background:'var(--accent-light)',borderRadius:'8px',marginBottom:'16px',fontSize:'12px'}},
      h('span',{style:{fontWeight:700,color:'var(--accent)'}},S.modal.feeling+'/10 \u2014 '+_fLabel)));
    // 3. RED'S POST-WORKOUT FEEDBACK
    if(S.modal.redLoading){
      _box.appendChild(h('div',{style:{padding:'16px',textAlign:'center'}},
        h('div',{style:{width:'28px',height:'28px',borderRadius:'50%',background:'var(--accent)',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:'8px'}},h('span',{style:{color:'#fff',fontSize:'12px',fontWeight:800}},'R')),
        h('p',{style:{fontSize:'12px',color:'var(--text2)',fontStyle:'italic',margin:'8px 0 0'}},'\u23F3 Red is reviewing your session...')));
    } else if(S.modal.redFeedback){
      var _fbWrap=h('div',{style:{borderLeft:'3px solid var(--accent)',padding:'12px 14px',background:'rgba(200,16,46,0.03)',borderRadius:'0 10px 10px 0',marginBottom:'16px'}});
      var _fbHeader=h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}});
      _fbHeader.appendChild(h('div',{style:{width:'24px',height:'24px',borderRadius:'50%',background:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}},h('span',{style:{color:'#fff',fontSize:'10px',fontWeight:800}},'R')));
      _fbHeader.appendChild(h('span',{style:{fontWeight:700,fontSize:'13px',color:'var(--accent)'}},"Red's Take"));
      _fbWrap.appendChild(_fbHeader);
      // Split feedback - main coaching and nutrition tip
      var _fbParts=S.modal.redFeedback.split('\n\n');
      var _mainFb=_fbParts.length>1?_fbParts.slice(0,-1).join('\n\n'):S.modal.redFeedback;
      var _nutLine=_fbParts.length>1?_fbParts[_fbParts.length-1]:'';
      _fbWrap.appendChild(h('p',{style:{fontSize:'12px',lineHeight:'1.6',color:'var(--text)',margin:0,whiteSpace:'pre-line'}},_mainFb));
      _box.appendChild(_fbWrap);
      // 4. NUTRITION TIP (separated from Red's feedback)
      if(_nutLine){_box.appendChild(h('div',{style:{background:'rgba(16,185,129,0.08)',padding:'10px 12px',borderRadius:'8px',marginBottom:'16px',borderLeft:'3px solid #10b981'}},
        h('p',{style:{fontSize:'11px',color:'var(--text)',margin:0,lineHeight:'1.4'}},_nutLine)));}
      // Chat link
      _box.appendChild(h('button',{className:'btn',style:{width:'100%',background:'transparent',border:'1px solid var(--border)',color:'var(--text2)',fontSize:'11px',marginBottom:'12px'},onClick:function(){S.modal=null;S.tab='chat';S.chatIn='Break down my workout in more detail';R();}},'Want Red to break it down? \u2192 Chat'));
    }
  }
  // Navigation buttons (always visible)
  var _nw=S.modal.nextW;
  if(S.modal.redLoading){
    _box.appendChild(h('button',{className:'btn btn-secondary',style:{width:'100%'},onClick:function(){S.modal=null;R();}},'Close (your workout is saved)'));
  }
  if(S.modal.feeling!==null&&!S.modal.redLoading){
    _box.appendChild(h('button',{className:'btn btn-primary',style:{width:'100%',marginBottom:'8px'},onClick:function(){
      if(_nw){S.week=_nw.w;S.day=_nw.d;if(S.modal.merged){loadMergedCL();S._trackManual=true;S.tab='track';}else{loadCL();}}
      S.modal=null;R();
    }},_nw?'Next: W'+_nw.w+' D'+_nw.d+' \u2014 '+_nw.name:'Back to Home'));
    _box.appendChild(h('button',{className:'btn btn-secondary',style:{width:'100%'},onClick:function(){S.modal=null;S.tab='home';R();}},'Home'));
  }
  _ov.appendChild(_box);app.appendChild(_ov);
}
// Exercise History Modal
if(S.modal&&S.modal.type==='exHistory'){
  var _ov=h('div',{className:'modal-ov',onClick:function(e){if(e.target===_ov){S.modal=null;R();}}});
  var _box=h('div',{className:'card',style:{maxWidth:'380px',width:'90%',padding:'20px',maxHeight:'80vh',overflowY:'auto'}});
  _box.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}},
    h('h3',{style:{fontSize:'16px',fontWeight:800,margin:0}},S.modal.exName),
    h('button',{style:{background:'none',border:'none',fontSize:'18px',color:'var(--text2)',cursor:'pointer'},onClick:function(){S.modal=null;R();}},'\u2715')));
  var _hist=getExHistory(S.modal.exName);
  var _rm=getExercise1RM(S.modal.exName);
  if(_rm>0)_box.appendChild(h('div',{style:{background:'var(--accent-light)',padding:'8px 12px',borderRadius:'8px',marginBottom:'12px',fontSize:'12px'}},
    h('span',{style:{fontWeight:700,color:'var(--accent)'}},'Est. 1RM: '+_rm+' lbs')));
  if(_hist.length===0){_box.appendChild(h('p',{style:{color:'var(--text2)',fontSize:'12px'}},'No history yet. Complete a workout to see your progress.'));}
  else{
    // Volume chart
    if(_hist.length>=2){
      var _chartWrap=h('div',{style:{height:'100px',display:'flex',alignItems:'flex-end',gap:'3px',marginBottom:'12px',padding:'8px',background:'var(--bg)',borderRadius:'8px'}});
      var _maxVol=Math.max.apply(null,_hist.map(function(h){return h.vol;}));
      _hist.slice(-12).forEach(function(hh){
        var pct=_maxVol>0?hh.vol/_maxVol*100:0;
        var bar=h('div',{style:{flex:1,minWidth:'12px',height:Math.max(4,pct)+'%',background:'var(--accent)',borderRadius:'3px 3px 0 0',position:'relative',cursor:'default'},title:hh.date+': '+hh.vol+' lbs vol'});
        _chartWrap.appendChild(bar);
      });
      _box.appendChild(h('p',{style:{fontSize:'10px',fontWeight:700,color:'var(--text2)',marginBottom:'4px'}},'VOLUME TREND (last '+Math.min(12,_hist.length)+' sessions)'));
      _box.appendChild(_chartWrap);
    }
    // Session list
    _hist.slice().reverse().slice(0,10).forEach(function(hh){
      var _row=h('div',{style:{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:'12px'}});
      _row.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between'}},
        h('span',{style:{fontWeight:600}},hh.date),
        h('span',{style:{color:'var(--accent)',fontWeight:700}},'Max: '+hh.maxW+' lbs')));
      _row.appendChild(h('div',{style:{color:'var(--text2)',fontSize:'10px',marginTop:'2px'}},
        hh.sets.map(function(s){return s.w+'\u00D7'+s.r;}).join(' \u00B7 ')+' \u00B7 Vol: '+hh.vol+' lbs'));
      _box.appendChild(_row);
    });
  }
  _ov.appendChild(_box);app.appendChild(_ov);
}
if(S.timer)app.appendChild(rTimer());
if(S.toast){var t=h('div',{className:'toast'+(S.tCls?' '+S.tCls:'')});t.innerHTML=svg('check',14,'#fff')+' '+S.toast;app.appendChild(t);}
}catch(fatalErr){console.error('FATAL R():',fatalErr);showFatalError(fatalErr);}}
