// === TEXT COACHING & TRANSCRIPTS ===

// Coaching script prompts for API
var COACH_PROMPTS={
  intro:function(ap,pd,wk,dy,exDB){
    var hist='';var sortedL=Object.keys(S.logs).map(function(k){return{key:k,log:S.logs[k]};}).filter(function(x){return x.log&&x.log.date;}).sort(function(a,b){return a.log.date>b.log.date?-1:1;}).slice(0,3);
    sortedL.forEach(function(sl){var info=sl.key.replace(/_/g,' ');if(sl.log.feeling)info+=', feel:'+sl.log.feeling+'/10';hist+='\n'+info;});
    return{
      system:"You are Red, a certified coach (NSCA-CSCS, CNS, SFB StrongFirst Bodyweight, E-RYT 500, USATF Level 3). Write a brief, motivating pre-workout coaching message. Conversational and warm \u2014 use contractions, mix short direct sentences with longer flowing ones. Keep it 80-150 words. End with one brief, practical nutrition tip (1 sentence max, grounded in your CNS expertise)."+(S.profile.level==='Just Starting Out'?"\nThis person is just starting out. Be extra warm and encouraging. Explain what they will feel, build their confidence.":""),
      user:"Write a workout intro for today.\nUser: "+(S.profile.name||'Athlete')+", Level: "+(S.profile.level||'Intermediate')+", Program: "+pd.name+"\nToday: Week "+S.week+", Day "+S.day+" \u2014 "+dy.name+"\nExercises: "+dy.ex.map(function(e){return e.n+" "+e.s+"x"+e.r;}).join(", ")+(hist?"\nRecent history:"+hist:"")+"\nReference specific exercises and any recent performance data."+(function(){var _mi=getMissedInfo(ap,pd);return _mi.missed>0?"\nIMPORTANT: This workout was shifted forward because the user missed "+_mi.missed+" session(s). Briefly acknowledge this warmly (no lectures) and get them moving.":"";})()+"\n"
    };
  },
  exercise:function(exName,exData,ap,pd){
    return{
      system:"You are Red, a certified coach (NSCA-CSCS, CNS, SFB StrongFirst Bodyweight, E-RYT 500, USATF Level 3). Write brief coaching cues for a specific exercise. Direct, warm, conversational. 40-80 words. Focus on form cues, common mistakes, what to feel, breathing."+(S.profile.level==='Just Starting Out'?"\nThis person is just starting out \u2014 zero experience assumed. Be very detailed on form, very encouraging.":""),
      user:"Coach me through: "+exName+"\nPrescribed: "+exData.s+"x"+exData.r+(exData.rest?" rest "+exData.rest:"")+"\nUser level: "+(S.profile.level||'Intermediate')+"\nForm cues, breathing, and what to focus on."
    };
  },
  postWorkout:function(ap,pd,wk,dy,curLog,feeling){
    var sessSummary=buildSessionSummary(dy,curLog);
    var recentHistory=buildRecentHistory(ap.id);
    var adjF=getAdjFactor();
    return{
      system:"You are Red, a certified coach (NSCA-CSCS, CNS, SFB StrongFirst Bodyweight, E-RYT 500, USATF Level 3). Give post-workout feedback after a completed session.\n\nYour feedback has 3 parts (use NO headers/labels, just flow naturally):\n1. WHAT YOU NOTICED \u2014 specific observations from the logged data. Reference actual weights, reps, changes from last time. Be concrete.\n2. WHAT TO KEEP DOING \u2014 reinforce what's working. One sentence.\n3. WHAT TO IMPROVE \u2014 constructive coaching for next session. One sentence.\n\nPROGRAM ADJUSTMENT RULES (CRITICAL):\n- If program does NOT need adjusting: say NOTHING about adjustments. Zero mention.\n- If data TRENDS toward needing adjustment (weights stalling 2+ weeks, consistent max RPE, reps declining): give a HEADS-UP warning. \"I'm noticing X trend. If it continues next session, I'll adjust Y.\"\n- If an adjustment IS being made (adjFactor != 1): explain WHY clearly. \"I've adjusted X because Y. This isn't a step back \u2014 it's how you break through.\"\n\nTone: Like a coach in the locker room after a session. Conversational, direct, warm. Use contractions. 4-6 sentences total for main feedback. NOT a report, NOT generic praise.\n\nAfter your coaching feedback, add a line break then one SHORT nutrition tip (1 sentence) relevant to the session type. Start it with a food emoji."+(S.profile.level==='Just Starting Out'?"\nThis person is just starting out. Be extra encouraging about showing up and completing the work.":""),
      user:"Post-workout feedback for "+(S.profile.name||'Athlete')+".\nLevel: "+(S.profile.level||'Intermediate')+"\nProgram: "+pd.name+", Week "+S.week+", Day "+S.day+" \u2014 "+dy.name+"\nFeeling: "+(feeling||'not rated')+"/10\n\nTODAY'S SESSION:\n"+sessSummary+"\nDuration: "+(curLog.dur?fmtT(curLog.dur):'not tracked')+"\n"+(recentHistory?"\nRECENT HISTORY (last 3 sessions for comparison):\n"+recentHistory:"")+(adjF!==1?"\nNOTE: Program is currently adjusted to "+Math.round(adjF*100)+"% \u2014 explain this to the user.":"")+"\n"
    };
  }
};

// Build session summary from logged data for Red's post-workout feedback
function buildSessionSummary(dy,curLog){
  var lines=[];
  if(!dy||!dy.ex)return'No exercise data.';
  curLog=curLog||{};
  dy.ex.forEach(function(ex,ei){
    if(ex.n&&(ex.n.indexOf('Dynamic Warm-Up')>-1||ex.n.indexOf('Dynamic Stretches')>-1))return;
    var eLog=curLog['e'+ei];
    var _hasAny=false;
    if(eLog){for(var _sk in eLog){if(_sk.charAt(0)==='s'){var _sd=eLog[_sk];if(_sd&&(_sd.done===true||parseFloat(_sd.w)>0||parseInt(_sd.r,10)>0)){_hasAny=true;break;}}}}
    if(!_hasAny){lines.push(ex.n+': not completed');return;}
    var sets=[];var totalVol=0;
    for(var si=1;si<=parseInt(ex.s)||5;si++){
      var sd=eLog['s'+si];
      if(sd&&(sd.w||sd.r)){
        var w=parseFloat(sd.w)||0;var r=parseInt(sd.r)||0;
        sets.push((w>0?w+'lbs':'BW')+'x'+r);
        totalVol+=w*r;
      }
    }
    if(sets.length>0){
      var lastPerf=getLastPerformance(ex.n);
      var comp='';
      if(lastPerf&&lastPerf.maxW>0){
        var todayMax=0;
        for(var si2=1;si2<=parseInt(ex.s)||5;si2++){var sd2=eLog['s'+si2];if(sd2&&parseFloat(sd2.w)>todayMax)todayMax=parseFloat(sd2.w);}
        if(todayMax>0){var diff=todayMax-lastPerf.maxW;if(diff>0)comp=' [+'+diff+'lbs vs last]';else if(diff<0)comp=' ['+diff+'lbs vs last]';}
      }
      lines.push(ex.n+' (prescribed '+ex.s+'x'+ex.r+'): '+sets.join(', ')+comp+(totalVol>0?' \u2014 vol: '+totalVol+'lbs':''));
    }else{lines.push(ex.n+': no sets logged');}
  });
  return lines.join('\n');
}

// Build recent history summary for trend analysis
function buildRecentHistory(progId){
  var recent=Object.keys(S.logs).filter(function(k){return k.startsWith(progId+'_')&&S.logs[k]&&S.logs[k].date;}).map(function(k){return{key:k,log:S.logs[k]};}).sort(function(a,b){return a.log.date>b.log.date?-1:1;}).slice(0,3);
  if(recent.length===0)return'';
  return recent.map(function(r){
    var parts=r.key.split('_');var info=r.key.replace(/_/g,' ');
    if(r.log.feeling)info+=', feel: '+r.log.feeling+'/10';
    if(r.log.dur)info+=', dur: '+fmtT(r.log.dur);
    return info;
  }).join('\n');
}

function generateCoaching(type,key,promptFn,cb){
  var cacheKey=key;
  var cached=S.coachCache[cacheKey];
  if(cached){cb(cached);return;}
  var prompt=promptFn();
  fetch('/.netlify/functions/chat',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,system:prompt.system,messages:[{role:'user',content:prompt.user}]})
  }).then(function(r){return r.json();}).then(function(d){
    var txt=(d.content&&d.content[0]&&d.content[0].text)||'';
    S.coachCache[cacheKey]=txt;sv();cb(txt);
  }).catch(function(e){cb('Hey, I had trouble loading that coaching. Let me try again next time.');});
}
