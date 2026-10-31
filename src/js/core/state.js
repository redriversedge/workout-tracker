// === STATE ===
var S={dark:true,screen:'onboarding',tab:'home',obStep:0,profile:{},enrolled:[],active:null,week:1,day:1,logs:{},bodyLogs:[],curLog:{},timer:null,tSec:60,tRun:false,tTotal:60,tInt:null,toast:null,tCls:'',ci:'',show:{},chatMsgs:[],chatIn:'',chatLoad:false,modal:null,sessTimer:0,sessRun:false,sessInt:null,prs:{},drill:null,exDB:null,editProfile:false,restDayLogs:{},customWks:[],ssMode:false,cwForm:{},bodyEdit:null,heightEdit:false,coachCache:{},redInsights:[],warmupDone:false,cooldownDone:false,transcripts:{},_curLogKey:'',_sessStartAt:null,_dismissedAlerts:[],_introLoading:false};

// === STORAGE MIGRATIONS ===
// rre2_schema records which data shape is on this device. v18/v19 never wrote it (= 1).
// Before migrating, the raw rre2_* data is copied once to rre2_backup_pre_v2 as a safety net.
var STORAGE_SCHEMA=2;
var STORAGE_KEYS=['dark','profile','enrolled','active','logs','body','chat','prs','restdays','customwks','coachcache','startdate','curlog','sesstimer','dismissed'];
function _lsGet(k){try{var v=localStorage.getItem('rre2_'+k);return v?JSON.parse(v):null;}catch(e){return null;}}
function _lsSet(k,v){try{localStorage.setItem('rre2_'+k,JSON.stringify(v));return true;}catch(e){return false;}}
// Normalizes chat history to {role:'user'|'bot', text}, dropping error/outage noise.
function normalizeChat(list){
  if(!Array.isArray(list))return [];
  return list.filter(function(m){return m&&typeof m==='object';}).map(function(m){
    var text=typeof m.text==='string'?m.text:(typeof m.content==='string'?m.content:'');
    var out={role:m.role==='user'?'user':'bot',text:text};
    if(m.isAction){out.isAction=true;out.action=m.action;}
    return out;
  }).filter(function(m){
    if(!m.text)return false;
    if(m.role==='bot'&&/^\u26A0/.test(m.text))return false;
    if(m.role==='bot'&&/^(Hey, I had trouble|Got an empty response)/.test(m.text))return false;
    return true;
  });
}
var MIGRATIONS={
  // 1 -> 2: clean chat history left by the v19 outage and normalize message shape;
  // drop empty cached coaching text so it regenerates.
  2:function(){
    var chat=_lsGet('chat');
    if(Array.isArray(chat))_lsSet('chat',normalizeChat(chat));
    var cc=_lsGet('coachcache');
    if(cc&&typeof cc==='object'){Object.keys(cc).forEach(function(k){if(!cc[k]||typeof cc[k]!=='string'||/^Hey, I had trouble/.test(cc[k]))delete cc[k];});_lsSet('coachcache',cc);}
  }
};
function migrateStorage(){
  var cur=1;
  try{var raw=localStorage.getItem('rre2_schema');if(raw)cur=parseInt(raw,10)||1;}catch(e){return;}
  if(cur>=STORAGE_SCHEMA)return;
  var hasData=false;
  try{var snap={};STORAGE_KEYS.forEach(function(k){var v=localStorage.getItem('rre2_'+k);if(v!==null){snap[k]=v;hasData=true;}});
    if(hasData&&!localStorage.getItem('rre2_backup_pre_v2'))localStorage.setItem('rre2_backup_pre_v2',JSON.stringify({savedAt:localISOStr(),schema:cur,data:snap}));
  }catch(e){if(window.console)console.warn('[RRE] could not save pre-migration snapshot',e);}
  for(var v=cur+1;v<=STORAGE_SCHEMA;v++){
    try{if(MIGRATIONS[v])MIGRATIONS[v]();}catch(e){if(window.console)console.warn('[RRE] migration '+v+' failed',e);}
  }
  try{localStorage.setItem('rre2_schema',String(STORAGE_SCHEMA));}catch(e){}
}

// === STORAGE ===
function load(){migrateStorage();try{
var keys=['dark','profile','enrolled','active','logs','body','chat','prs','restdays','customwks','coachcache','startdate'];
keys.forEach(function(k){
  var v=localStorage.getItem('rre2_'+k);
  if(!v)return;
  try{var p=JSON.parse(v);
  if(k==='dark')S.dark=p;
  else if(k==='profile'){S.profile=p;if(p.name)S.screen='app';}
  else if(k==='enrolled')S.enrolled=p;
  else if(k==='active')S.active=p;
  else if(k==='logs')S.logs=p;
  else if(k==='body')S.bodyLogs=p;
  else if(k==='chat')S.chatMsgs=p;
  else if(k==='coachcache')S.coachCache=p;
  else if(k==='prs')S.prs=p;
  else if(k==='restdays')S.restDayLogs=p;
  else if(k==='customwks')S.customWks=p;
  else if(k==='startdate')S.startDate=p;
  }catch(e){}
});
}catch(e){}if(document.body){if(S.dark)document.body.classList.add('dark');else document.body.classList.remove('dark');}if(S.enrolled.length>0&&!S.active)S.active=S.enrolled[0].id;
// Load autosave, timer, dismissed alerts
try{var _cl=localStorage.getItem('rre2_curlog');if(_cl){var _clp=JSON.parse(_cl);if(_clp&&_clp.key&&_clp.data){S._curLogKey=_clp.key;S.curLog=_clp.data;}}
var _st=localStorage.getItem('rre2_sesstimer');if(_st){var _stp=JSON.parse(_st);if(_stp&&_stp.startAt){S._sessStartAt=_stp.startAt;S.sessRun=!!_stp.running;}}
var _da=localStorage.getItem('rre2_dismissed');if(_da)S._dismissedAlerts=JSON.parse(_da)||[];
}catch(e){}}
function sv(){try{
localStorage.setItem('rre2_dark',JSON.stringify(S.dark));
localStorage.setItem('rre2_profile',JSON.stringify(S.profile));
localStorage.setItem('rre2_enrolled',JSON.stringify(S.enrolled));
localStorage.setItem('rre2_active',JSON.stringify(S.active));
localStorage.setItem('rre2_logs',JSON.stringify(S.logs));
localStorage.setItem('rre2_body',JSON.stringify(S.bodyLogs));
localStorage.setItem('rre2_chat',JSON.stringify(S.chatMsgs));
localStorage.setItem('rre2_coachcache',JSON.stringify(S.coachCache||{}));
localStorage.setItem('rre2_prs',JSON.stringify(S.prs));
localStorage.setItem('rre2_restdays',JSON.stringify(S.restDayLogs));
localStorage.setItem('rre2_customwks',JSON.stringify(S.customWks));
localStorage.setItem('rre2_startdate',JSON.stringify(S.startDate||''));
localStorage.setItem('rre2_curlog',JSON.stringify({key:S._curLogKey||'',data:S.curLog}));
localStorage.setItem('rre2_sesstimer',JSON.stringify({key:S._curLogKey||'',startAt:S._sessStartAt||null,running:S.sessRun}));
localStorage.setItem('rre2_dismissed',JSON.stringify(S._dismissedAlerts||[]));
}catch(e){}}

var _autosaveTimer=null;
function autosaveCL(){clearTimeout(_autosaveTimer);_autosaveTimer=setTimeout(function(){try{localStorage.setItem('rre2_curlog',JSON.stringify({key:S._curLogKey||'',data:S.curLog}));if(S._sessStartAt)localStorage.setItem('rre2_sesstimer',JSON.stringify({key:S._curLogKey||'',startAt:S._sessStartAt,running:S.sessRun}));}catch(e){}},400);}
