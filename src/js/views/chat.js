// === CHAT (Red AI Coach via Netlify proxy) ===
function rChat(){
// Use dvh if supported, fall back to vh
var chatH=typeof CSS!=='undefined'&&CSS.supports&&CSS.supports('height','100dvh')?'calc(100dvh - 56px - env(safe-area-inset-top,0px) - 60px - env(safe-area-inset-bottom,0px))':'calc(100vh - 56px - 60px)';
var el=h('div',{className:'page active chat-page',style:{padding:'0',display:'flex',flexDirection:'column',height:chatH,overflow:'hidden',position:'relative'}});
var wrap=h('div',{className:'chat-wrap',style:{height:'100%'}});
var msgs=h('div',{className:'chat-msgs',id:'cmsg'});
if(S.chatMsgs.length===0)msgs.appendChild(h('div',{className:'chat-msg bot'},h('div',{className:'bubble'},"Hey! I'm Red, your coach at RedRiversEdgeFitness. \uD83D\uDCAA Form tips, program questions, motivation \u2014 I'm here. What's up?")));
S.chatMsgs.forEach(function(msg){
  if(msg.isAction){
    var ab=h('div',{className:'chat-msg bot'});var bub=h('div',{className:'bubble',style:{padding:'8px'}});
    bub.appendChild(h('p',{style:{fontSize:'11px',marginBottom:'6px'}},msg.text));
    var btns=h('div',{style:{display:'flex',gap:'6px'}});
    if(msg.action==='reduce'){
      btns.appendChild(h('button',{className:'btn btn-primary btn-sm',onClick:function(){applyAdjustment({action:'reduce_volume'});S.chatMsgs.push({role:'bot',text:"Done! I've lightened your next 3 sessions by 40%. You'll bounce back stronger."});sv();R();}},'Yes, lighten up'));
    }else if(msg.action==='increase'){
      btns.appendChild(h('button',{className:'btn btn-primary btn-sm',onClick:function(){applyAdjustment({action:'increase_intensity'});S.chatMsgs.push({role:'bot',text:"Weights bumped 10%! Let's see what you've got."});sv();R();}},'Bump it up'));
    }
    btns.appendChild(h('button',{className:'btn btn-secondary btn-sm',onClick:function(){S.chatMsgs=S.chatMsgs.filter(function(m){return m!==msg;});sv();R();}},'Skip'));
    bub.appendChild(btns);ab.appendChild(bub);msgs.appendChild(ab);
  }else if(msg.isError){
    var eb=h('div',{className:'chat-msg bot'});var ebub=h('div',{className:'bubble chat-err'});
    ebub.appendChild(h('p',{style:{margin:'0 0 8px'}},msg.text));
    if(msg.retryText&&!S.chatLoad)ebub.appendChild(h('button',{className:'btn btn-secondary btn-sm',onClick:function(){
      S.chatMsgs=S.chatMsgs.filter(function(m){return m!==msg;});
      for(var i=S.chatMsgs.length-1;i>=0;i--){if(S.chatMsgs[i].role==='user'&&S.chatMsgs[i].text===msg.retryText){S.chatMsgs.splice(i,1);break;}}
      S.chatIn=msg.retryText;sendC();}},'Try again'));
    eb.appendChild(ebub);msgs.appendChild(eb);
  }else{msgs.appendChild(h('div',{className:'chat-msg '+msg.role},h('div',{className:'bubble'},msg.text)));}});
if(S.chatLoad)msgs.appendChild(h('div',{className:'chat-msg bot'},h('div',{className:'bubble',style:{color:'var(--text2)'}},'Red is thinking...')));
wrap.appendChild(msgs);

// Input row with auto-growing textarea
var ir=h('div',{className:'chat-ir'});
var ta=h('textarea',{className:'chat-ta',placeholder:'Ask Red anything...',rows:1,id:'chat-f'});
ta.value=S.chatIn||'';

// Auto-grow textarea
function autoGrow(){ta.style.height='40px';ta.style.height=Math.min(ta.scrollHeight,120)+'px';}

ta.addEventListener('input',function(e){S.chatIn=e.target.value;autoGrow();});
ta.addEventListener('keydown',function(e){
  // Enter sends (without shift). Shift+Enter = new line.
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(S.chatIn&&S.chatIn.trim())sendC();}
});

var sb=h('button',{className:'chat-sb',innerHTML:svg('send',16,'#fff'),onClick:function(){if(S.chatIn&&S.chatIn.trim())sendC();}});

ir.appendChild(ta);ir.appendChild(sb);wrap.appendChild(ir);el.appendChild(wrap);

// Scroll to bottom + focus management
setTimeout(function(){
  var m=document.getElementById('cmsg');if(m)m.scrollTop=m.scrollHeight;
  // Auto-grow on initial render
  var f=document.getElementById('chat-f');if(f&&f.value)autoGrow();
},50);

// visualViewport keyboard handling (Claude-style)
setTimeout(function(){
  if(!window.visualViewport)return;
  var chatWrap=el.querySelector('.chat-wrap');
  var navBar=document.querySelector('.bottom-nav');
  function onVPResize(){
    var vvh=window.visualViewport.height;
    var kbOpen=window.innerHeight-vvh>100;
    if(kbOpen){
      // Keyboard is open: resize chat to fit, hide nav
      chatWrap.style.height=vvh-56+'px';
      if(navBar)navBar.style.display='none';
      el.style.height=vvh+'px';
      el.style.paddingBottom='0';
    }else{
      // Keyboard closed: restore
      chatWrap.style.height='';
      if(navBar)navBar.style.display='';
      el.style.height='';
      el.style.paddingBottom='';
    }
    // Always scroll to bottom when viewport changes
    var m=document.getElementById('cmsg');if(m)m.scrollTop=m.scrollHeight;
  }
  window.visualViewport.addEventListener('resize',onVPResize);
  window.visualViewport.addEventListener('scroll',onVPResize);
  // Clean up when leaving chat tab
  el._vpCleanup=function(){
    window.visualViewport.removeEventListener('resize',onVPResize);
    window.visualViewport.removeEventListener('scroll',onVPResize);
    if(navBar)navBar.style.display='';
  };
},100);

return el;}

function sendC(){var msg=S.chatIn.trim();if(!msg)return;S.chatMsgs.push({role:'user',text:msg});S.chatIn='';S.chatLoad=true;sv();R();
var ctx='User: '+(S.profile.name||'Athlete')+'. Level: '+(S.profile.level||'Intermediate')+'. Sex: '+(S.profile.sex||'Not disclosed')+'. Pregnancy: '+(S.profile.pregnant&&S.profile.pregnant!=='No'?S.profile.pregnant:'No')+'. Goals: '+(Array.isArray(S.profile.goals)?S.profile.goals.join(', '):'General Fitness')+'. Equipment: '+(Array.isArray(S.profile.equipment)?S.profile.equipment.join(', '):'Full Gym')+'. Limitations: '+(Array.isArray(S.profile.injuries)?S.profile.injuries.join(', '):'None')+'. Logged '+Object.keys(S.logs).length+' workouts. Week '+S.week+', Day '+S.day+'. Streak: '+getStreakNum()+' weeks.';
var adjState=S.profile.activeAdj?('Active adjustment: '+S.profile.activeAdj.type+', '+S.profile.activeAdj.sessionsLeft+' sessions left, factor: '+S.profile.activeAdj.factor):'No active adjustments';
var cwCount=S.customWks?S.customWks.length:0;
var feelData=[];Object.keys(S.logs).forEach(function(k){var l=S.logs[k];if(l&&l.feeling&&l.date)feelData.push({d:l.date.split('T')[0],f:l.feeling});});feelData.sort(function(a,b){return b.d<a.d?-1:1;});var recentFeel=feelData.slice(0,5).map(function(f){return f.f;}).join(',');
// Build recent workout history with notes for Red
var sortedL=Object.keys(S.logs).map(function(k){return{key:k,log:S.logs[k]};}).filter(function(x){return x.log&&x.log.date;}).sort(function(a,b){return a.log.date>b.log.date?-1:1;}).slice(0,5);
var histStr='';sortedL.forEach(function(sl){var e=sl.log;var info=sl.key.replace(/_/g,' ')+' ('+e.date.split('T')[0]+')';if(e.feeling)info+=', feel:'+e.feeling+'/10';if(e.custom)info+=', CUSTOM:'+e.customName;
  var exD=[];Object.keys(e).forEach(function(ek){if(ek.startsWith('e')){var sets=[];Object.keys(e[ek]).forEach(function(sk){if(sk.startsWith('s')){var s=e[ek][sk];if(s.w||s.r)sets.push((s.w||'?')+'x'+(s.r||'?'));}});if(sets.length)exD.push('Ex'+ek.slice(1)+':'+sets.join(','));}});
  if(exD.length)info+=', '+exD.slice(0,3).join('; ');
  if(e.notes)info+=', notes:"'+e.notes.substring(0,80)+'"';
  if(e.custom){var cwM=(S.customWks||[]).filter(function(cw){return cw&&cw.date&&cw.date.split('T')[0]===e.date.split('T')[0]&&cw.name===e.customName;});if(cwM.length&&cwM[0].notes)info+=', cwNotes:"'+cwM[0].notes.substring(0,80)+'"';}
  histStr+='\n  '+info;});
// Top exercise progressions
var db=getExDB();var topEx=Object.keys(db).sort(function(a,b){return db[b].sessions-db[a].sessions;}).slice(0,3);
var exProg='';topEx.forEach(function(nm){var ex=db[nm];exProg+='\n  '+nm+': '+ex.sessions+' sessions, best '+ex.bestW+'lbs, vol '+Math.round(ex.totalVol)+'lbs';});
// PRs
var prStr='';var prK2=Object.keys(S.prs);if(prK2.length>0)prStr='\nPRs: '+prK2.sort(function(a,b){return S.prs[b]-S.prs[a];}).slice(0,5).map(function(k){return k.replace(/_/g,' ')+' '+S.prs[k]+'lbs';}).join(', ');
// Body measurements
var bodyStr='';if(S.bodyLogs&&S.bodyLogs.length>0){var lat=S.bodyLogs[S.bodyLogs.length-1];var bp=[];if(lat.wt)bp.push('Wt:'+lat.wt+'lbs');if(lat.wa)bp.push('Waist:'+lat.wa+'in');if(lat.ch)bp.push('Chest:'+lat.ch+'in');if(lat.ar)bp.push('Arms:'+lat.ar+'in');if(bp.length)bodyStr='\nBody: '+bp.join(', ');if(S.bodyLogs.length>1){var fst=S.bodyLogs[0];if(fst.wt&&lat.wt){var chg=parseFloat(lat.wt)-parseFloat(fst.wt);bodyStr+=' (change:'+(chg>0?'+':'')+chg.toFixed(1)+'lbs)';}}}
// Rest day notes
var restN='';if(S.restDayLogs){var rKeys=Object.keys(S.restDayLogs).slice(-3);rKeys.forEach(function(d){var rl=S.restDayLogs[d];if(rl&&rl.notes)restN+='\n  '+d+':"'+rl.notes.substring(0,60)+'"';});}
var enrolledStr="";S.enrolled.forEach(function(en){var pd=PROGRAMS[en.id];if(pd)enrolledStr+=pd.name+" ("+pd.level+", "+pd.weeks+"wk, "+en.days+"d/wk), ";});
var appCtx="\nAPP KNOWLEDGE (answer user questions about the app):"+"\nRedRiversEdgeFitness is a Progressive Web App with these features:"+"\n- Programs tab: Browse and enroll in training programs. Each has a level (Just Starting Out, Beginner, Intermediate, Advanced)."+"\n- "+redProgramCatalog()+"\n- Tracker: Log weights, reps, sets for each exercise. Has rest timer, session timer, and feeling rating (1-10) after each workout."+"\n- Superset Mode: Toggle in tracker when exercise pairs detected. Pairs push+pull or upper+lower exercises to save time. Purple SS badge."+"\n- Custom Workouts: Log outside activities (gym classes, sports, hikes) via + button on any training day."+"\n- Progress tab: Training summary, feeling trend chart, weekly volume chart, strength tracking, body measurement charts, Red insights."+"\n- Exercise Database: Tap any exercise name to see history, best sets, 1RM calculator with strength zones, progression analysis, frequency."+"\n- Profile: Edit name, goals, equipment, session time, days/week, limitations. Height in feet/inches. Dark mode toggle. Export/import/reset."+"\n- Merge Engine: Enrolled in 2+ programs? App merges schedules intelligently (strength priority, yoga/running fill gaps)."+"\n- Red (you): AI coaching chat in Chat tab. You see their workout history, PRs, body data, notes."+"\n- Rest Days: Log rest day activities with notes."+"\n- Weekly Summary: Recap with volume, sets, feeling average, Red commentary."+"\n- Data: Saves to phone (localStorage). Export/import JSON backups from Profile."+"\nUser setup: "+(enrolledStr||"No programs yet")+". Dark mode: "+(S.dark?"on":"off")+". Session: "+(S.profile.time||"not set")+". Days/wk: "+(S.profile.days||"not set")+".";
var sys="You are Red, the built-in fitness coach for RedRiversEdgeFitness. You hold the following certifications: NSCA-CSCS (Certified Strength and Conditioning Specialist), CNS (Certified Nutrition Specialist), SFB (StrongFirst Bodyweight Certification \u2014 expert-level bodyweight training methodology emphasizing tension techniques, grinding strength, and movement quality), E-RYT 500 (Experienced Registered Yoga Teacher, 500-hour), RPYT (Registered Prenatal Yoga Teacher), RCYT (Registered Children's Yoga Teacher), Pilates Master Instructor, USATF Level 3 Coach (highest USA Track and Field certification), RRCA Level 2 Running Coach. You have 40+ years coaching experience spanning beginners to Olympic champions, competitive bodybuilding, CrossFit methodology, Olympic weightlifting, and HIIT programming. You genuinely love helping people get stronger and healthier.\nPERSONALITY: Motivating like a teammate, not a poster on a gym wall. Warm and approachable - you talk like a knowledgeable friend, not a textbook. Funny when it fits - you will crack a joke but never force it. Confident but not preachy.\nSTYLE: Default to simple clear language. Skip jargon unless asked. If they want the deep dive into biomechanics or nutrition science, go there but check first: Want the nerdy breakdown or the quick version? Keep it conversational and concise, like a coach mid-session. Use encouragement that feels real, not generic.\nTONE EXAMPLES: Rest days - 'Rest days are not lazy days, that is when your muscles actually grow. Think of it like charging your phone.' PR hit - 'Lets GO. That is what consistency looks like. Your week-one self would be impressed.' Technical Q - 'Short answer: progressive overload. Want me to break down how that works in your program specifically?'\nHELP WITH: Form, technique, programming, nutrition, recovery, motivation, adjusting the program, AND answering questions about how the app works. If users ask about features, settings, or navigation, guide them using your APP KNOWLEDGE section. Explain the why behind exercises.\nNUTRITION (CNS expertise): You are a Certified Nutrition Specialist. Offer brief, practical nutrition tips naturally in coaching \u2014 things like 'Get protein in within the hour' or 'Training hard this week? Don't skimp on carbs, your muscles need fuel.' Keep unprompted nutrition advice to 1-2 sentences max. Never volunteer meal plans, macro breakdowns, calorie counting, or supplement stacks unless specifically asked. If they ask detailed nutrition questions in chat, you can go deeper with your CNS expertise, but always stay practical and actionable. Nutrition tips should feel like a coach's aside, not a nutrition lecture.\nPROGRAM ADJUSTMENTS: When the user says workouts are too hard, too easy, they are tired, sore, or want changes, suggest adjustments. Tell them what you would change and why. Use phrases like 'I can reduce your weights by X% for the next few sessions' or 'Let me bump your intensity up'. The app handles the actual adjustment.\nINSIGHTS: Proactively offer observations about their training data: volume trends, strength gains, consistency, recovery patterns, body composition changes. Reference specific numbers from their history. Make advice personal by connecting to their actual data.\nDO NOT: Diagnose injuries (say see a doc or PT), push through pain, shame anyone for their level or missed workouts. Meet people where they are.\nPREGNANCY: If the user has disclosed pregnancy, coach with RPYT expertise. Prioritize safety: no supine exercises after 1st trimester, no high-impact plyometrics, no heavy Valsalva, no exercises with fall risk. Modify all core work. Monitor exertion \u2014 keep RPE moderate. Encourage hydration and rest. If anything feels wrong, stop.\nJSO USERS: If the user's level is 'Just Starting Out', provide significantly more detail and encouragement. Explain WHY each exercise matters. Use more words, more coaching cues, more warmth. These users have never trained before \u2014 build their confidence.\nNUTRITION (CNS): You are a Certified Nutrition Specialist. When giving unprompted nutrition advice (post-workout summaries, dashboard, chat), keep it brief and practical \u2014 one sentence max. Good: 'Make sure you get protein within an hour of this session.' Bad: lengthy macro breakdowns, meal plans, supplement stacks. If a user ASKS detailed nutrition questions in chat, you can go deeper with your CNS expertise \u2014 but your default is brief and actionable."+appCtx+"\nTRAINING CONTEXT: "+ctx+"\nRecent feeling scores (newest first): "+recentFeel+"\n"+adjState+"\nCustom/outside workouts: "+cwCount+(histStr?"\nRecent workouts:"+histStr:"")+(exProg?"\nTop exercises:"+exProg:"")+(restN?"\nRecovery notes:"+restN:"")+prStr+bodyStr+"\nKeep responses under 150 words.";
redRequest({system:sys,messages:S.chatMsgs.slice(-12),maxTokens:600}).then(function(reply){
S.chatMsgs.push({role:'bot',text:reply});S.chatLoad=false;
// Check if Red suggested an adjustment
var rl=reply.toLowerCase();
if((rl.indexOf('reduce')>-1||rl.indexOf('lower')>-1||rl.indexOf('lighter')>-1||rl.indexOf('deload')>-1)&&(rl.indexOf('weight')>-1||rl.indexOf('intensity')>-1||rl.indexOf('volume')>-1)){
  if(!S.profile.activeAdj){S.chatMsgs.push({role:'bot',text:'Want me to apply that? Tap below.',isAction:true,action:'reduce'});}
}else if((rl.indexOf('increase')>-1||rl.indexOf('bump')>-1||rl.indexOf('raise')>-1)&&(rl.indexOf('weight')>-1||rl.indexOf('intensity')>-1)){
  if(!S.profile.activeAdj){S.chatMsgs.push({role:'bot',text:'Ready to level up? Tap below.',isAction:true,action:'increase'});}
}
sv();R();},function(err){
  S.chatMsgs.push({role:'bot',text:err.userMessage||"Red couldn't respond just now. Try again in a moment.",isError:true,retryText:msg});
  S.chatLoad=false;sv();R();});}
