// === HELPERS ===
function h(t,a){var el=document.createElement(t);if(a)Object.keys(a).forEach(function(k){if(k==='className')el.className=a[k];else if(k==='style'&&typeof a[k]==='object')Object.assign(el.style,a[k]);else if(k.startsWith('on'))el.addEventListener(k.slice(2).toLowerCase(),a[k]);else if(k==='innerHTML')el.innerHTML=a[k];else el.setAttribute(k,a[k]);});for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(typeof c==='string'||typeof c==='number')el.appendChild(document.createTextNode(c));else if(Array.isArray(c))c.forEach(function(cc){if(cc)el.appendChild(cc);});else el.appendChild(c);}return el;}
function pRest(r){if(!r||r==='-'||r==='Circuit'||r==='Light')return 60;var m=r.match(/(\d+(?:\.\d+)?)/);if(!m)return 60;var n=parseFloat(m[1]);return r.indexOf('min')>-1?Math.round(n*60):n;}
function fmtT(s){var m=Math.floor(s/60),ss=s%60;return m+':'+('0'+ss).slice(-2);}
function toast(m,c){S.toast=m;S.tCls=c||'';R();setTimeout(function(){S.toast=null;R();},2800);}
function gAP(){return S.enrolled.find(function(p){return p.id===S.active;});}
function gPD(id){return PROGRAMS[id];}
function lk(pid,w,d){return pid+'_w'+w+'d'+d;}

// Local timezone date helpers
function localDateStr(d){d=d||new Date();var y=d.getFullYear(),m=d.getMonth()+1,dd=d.getDate();return y+'-'+(m<10?'0'+m:m)+'-'+(dd<10?'0'+dd:dd);}
function localISOStr(d){d=d||new Date();return localDateStr(d)+'T'+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2);}
// Parses stored dates as LOCAL time. "2026-10-31" must mean Oct 31 here, not UTC midnight
// (which is Oct 30 evening in the US). Date-only strings land at local noon so they
// sort and range-compare safely; full timestamps parse as written.
function parseLocalDate(v){
  if(v instanceof Date)return new Date(v.getTime());
  if(typeof v!=='string')return new Date(v);
  var m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m)return new Date(parseInt(m[1],10),parseInt(m[2],10)-1,parseInt(m[3],10),12,0,0);
  m=v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if(m)return new Date(parseInt(m[1],10),parseInt(m[2],10)-1,parseInt(m[3],10),parseInt(m[4],10),parseInt(m[5],10),parseInt(m[6]||'0',10));
  return new Date(v);
}

function ensL(ei,sn,eName){if(!S.curLog['e'+ei])S.curLog['e'+ei]={};if(eName)S.curLog['e'+ei]._name=eName;if(!S.curLog['e'+ei]['s'+sn])S.curLog['e'+ei]['s'+sn]={};autosaveCL();}

function getStreakNum(){var s=getStreak();return s.current||0;}
// Detect rep unit from exercise rep scheme (e.g. "30s" \u2192 "secs", "1 min" \u2192 "time", "10" \u2192 "reps")
function repUnit(r){if(!r||r==='-')return{hdr:'Reps',ph:'reps'};var rs=String(r).toLowerCase();if(rs.match(/\d+s$|sec|seconds/))return{hdr:'Secs',ph:'secs'};if(rs.match(/min/))return{hdr:'Time',ph:'time'};if(rs.match(/breath/))return{hdr:'Breaths',ph:'breaths'};if(rs.match(/cal/))return{hdr:'Cals',ph:'cals'};if(rs.match(/\d+m$|meter|yard|yd|mile/))return{hdr:'Dist',ph:'dist'};return{hdr:'Reps',ph:'reps'};}
function checkPR(name,w){if(!w||w<=0)return false;var k=name.replace(/\s/g,'_');var p=S.prs[k]||0;if(w>p){S.prs[k]=w;return true;}return false;}

// Exercise Database: scan all logs for exercise history
function getExDB(){var db={};Object.keys(S.logs).forEach(function(logKey){var log=S.logs[logKey];if(!log||!log.date)return;
// Find which program/week/day this log belongs to
var parts=logKey.match(/(.+)_w(\d+)d(\d+)/);if(!parts)return;var pid=parts[1],wk=parseInt(parts[2]),dy=parseInt(parts[3]);
var pd=gPD(pid);if(!pd)return;var wkD=pd.data[wk];if(!wkD||!wkD.days)return;var dayD=wkD.days[dy];if(!dayD||!dayD.ex)return;
dayD.ex.forEach(function(ex,ei){var eLog=log['e'+ei];if(!eLog)return;
if(!db[ex.n])db[ex.n]={name:ex.n,entries:[]};
Object.keys(eLog).forEach(function(sk){if(!sk.startsWith('s'))return;var s=eLog[sk];var w=parseFloat(s.w)||0,r=parseFloat(s.r)||0;
if(w>0||r>0)db[ex.n].entries.push({date:log.date,w:w,r:r,vol:w*r});});});});
// Sort entries by date and compute stats
Object.keys(db).forEach(function(k){var ex=db[k];ex.entries.sort(function(a,b){return parseLocalDate(a.date)-parseLocalDate(b.date);});
ex.bestW=0;ex.bestVol=0;ex.totalVol=0;ex.sessions=0;
var dates={};ex.entries.forEach(function(e){if(e.w>ex.bestW)ex.bestW=e.w;if(e.vol>ex.bestVol)ex.bestVol=e.vol;ex.totalVol+=e.vol;dates[e.date.split('T')[0]]=1;});ex.sessions=Object.keys(dates).length;});return db;}

// Dashboard analytics

function adaptProgramDays(progData, userDays, progDays) {
  // If same, no adaptation needed
  if (userDays === progDays || !progData) return progData;
  var adapted = {};
  Object.keys(progData).forEach(function(wkKey) {
    var week = progData[wkKey];
    if (!week) { adapted[wkKey] = week; return; }
if (!week.days) { var wd={};Object.keys(week).forEach(function(k){var n=parseInt(k);if(!isNaN(n)&&week[k]&&week[k].ex)wd[k]=week[k];});if(Object.keys(wd).length>0){week={name:week.name||'Week '+wkKey,days:wd};}else{adapted[wkKey]=week;return;} }
    var dayKeys = Object.keys(week.days).map(Number).sort(function(a,b){return a-b;});
    var srcDays = dayKeys.length;
    var newDays = {};

    if (userDays < srcDays) {
      // FEWER DAYS: Prioritize by type importance
      // Priority: key workout days > strength > run workout > easy/recovery
      var ranked = dayKeys.map(function(dk) {
        var d = week.days[dk];
        var priority = 5; // default
        var name = (d.name || '').toLowerCase();
        var type = (d.type || '').toLowerCase();
        if (name.includes('rest')) priority = 10;
        else if (name.includes('active recovery') || name.includes('recovery')) priority = 9;
        else if (name.includes('easy') && !name.includes('workout')) priority = 8;
        else if (type === 'mobility' || type === 'pilates' || type === 'prenatal') priority = 6;
        else if (name.includes('long run') || name.includes('race')) priority = 2;
        else if (name.includes('tempo') || name.includes('speed') || name.includes('workout')) priority = 3;
        else if (type === 'strength' || type === 'hiit') priority = 3;
        else if (type === 'run') priority = 4;
        return { dk: dk, d: d, priority: priority };
      });
      ranked.sort(function(a, b) { return a.priority - b.priority; });
      // Take top N days
      var selected = ranked.slice(0, userDays);
      selected.sort(function(a, b) { return a.dk - b.dk; }); // restore order
      selected.forEach(function(item, i) {
        newDays[i + 1] = item.d;
      });
    } else {
      // MORE DAYS: Keep all original days, add recovery/mobility for extras
      dayKeys.forEach(function(dk, i) {
        newDays[i + 1] = week.days[dk];
      });
      for (var extra = srcDays + 1; extra <= userDays; extra++) {
        newDays[extra] = {
          name: 'Active Recovery',
          type: 'mobility',
          ex: [
            { n: 'Foam Roll (full body)', s: 1, r: '10 min', rest: '-' },
            { n: "World's Greatest Stretch", s: 2, r: '5/side', rest: '30s' },
            { n: "Cat-Cow", s: 2, r: '10', rest: '15s' },
            { n: 'Pigeon Stretch', s: 2, r: '45s/side', rest: '15s' },
            { n: "Child's Pose", s: 1, r: '60s', rest: '-' }
          ]
        };
      }
    }
    adapted[wkKey] = Object.assign({}, week, { days: newDays });
  });
  return adapted;
}

function getAdaptedProgram(progId, userDays) {
  var prog = PROGRAMS[progId];
  if (!prog || !prog.data) return null;
  var firstWk=prog.data[1];var progDays = prog.daysPerWeek || (firstWk&&firstWk.days?Object.keys(firstWk.days).length:4);
  if (userDays === progDays) return prog.data;
  return adaptProgramDays(prog.data, userDays, progDays);
}


function checkPregEnroll(progId, cb) {
  var isPreg = S.profile.pregnant && S.profile.pregnant !== 'No';
  if (!isPreg) { cb(); return; }
  var status = PREG_SAFETY.getStatus(progId);
  if (status === 'unsafe') {
    S.modal = {
      type: 'confirm',
      title: 'Not Recommended During Pregnancy',
      msg: PREG_SAFETY.getReason(progId) + ' Your RPYT-certified coach Red strongly recommends choosing a safer program. The Prenatal Mobility program was designed specifically for you.',
      confirmText: 'I understand, enroll anyway',
      cancelText: 'Choose safer program',
      onConfirm: function() { S.modal = null; cb(); R(); }
    };
    R();
  } else if (status === 'caution') {
    S.modal = {
      type: 'confirm',
      title: 'Use Caution During Pregnancy',
      msg: 'This program can be done during pregnancy with modifications. Red will guide you through safe alternatives for any contraindicated exercises. Listen to your body and stop if anything feels wrong.',
      confirmText: 'Enroll with modifications',
      cancelText: 'Choose another program',
      onConfirm: function() { S.modal = null; cb(); R(); }
    };
    R();
  } else {
    cb();
  }
}

function getProgramTypeStats(){
  var ap=gAP(),pd=ap?gPD(ap.id):null;
  if(!ap||!pd)return null;
  var stats={type:pd.type,level:pd.level,isJSO:pd.level==='Just Starting Out'};
  var logKeys=Object.keys(S.logs).filter(function(k){return k.startsWith(ap.id);});
  var completedSessions=logKeys.filter(function(k){return S.logs[k]&&S.logs[k].date;}).length;
  stats.completedSessions=completedSessions;
  stats.totalSessions=pd.weeks*pd.daysPerWeek;
  stats.completionPct=Math.round((completedSessions/stats.totalSessions)*100);
  // Warmup/cooldown tracking
  var wuCount=0,cdCount=0;
  logKeys.forEach(function(k){var l=S.logs[k];if(l&&l.warmupDone)wuCount++;if(l&&l.cooldownDone)cdCount++;});
  stats.warmupRate=completedSessions>0?Math.round((wuCount/completedSessions)*100):0;
  stats.cooldownRate=completedSessions>0?Math.round((cdCount/completedSessions)*100):0;
  
  if(pd.type==='strength'){
    // Strength-specific: volume trends, 1RM estimates, PR count
    var db=getExDB();stats.exercises=db;
    stats.prCount=Object.keys(S.prs).length;
    var totalVol=0;Object.keys(db).forEach(function(nm){totalVol+=db[nm].totalVol||0;});
    stats.totalVolume=Math.round(totalVol);
  } else if(pd.type==='running'){
    // Running: total distance proxy (sessions x avg duration), consistency
    stats.runSessions=completedSessions;
    stats.consistencyStreak=getStreakNum();
  } else if(pd.type==='flexibility'){
    stats.mobilityScore=Math.min(100,completedSessions*8); // Progressive score
    stats.consistencyStreak=getStreakNum();
  } else if(pd.type==='hiit'){
    stats.hiitSessions=completedSessions;
    stats.avgFeeling=0;var fCount=0;
    logKeys.forEach(function(k){var l=S.logs[k];if(l&&l.feeling){stats.avgFeeling+=l.feeling;fCount++;}});
    if(fCount>0)stats.avgFeeling=Math.round(stats.avgFeeling/fCount*10)/10;
  }
  return stats;
}
function getDashStats(){var ap=gAP(),pd=ap?gPD(ap.id):null;
// Also scan merged logs
var merged=getMergedSchedule();
if(!ap&&!merged)return null;
if(!pd&&!merged)return null;
if(!pd){// Pure merged mode - create minimal stats
  var mst={totalVol:0,totalWk:0,totalSets:0,totalReps:0,bestDay:{vol:0,date:''},exCount:{},topExes:[],weekVols:[],recentLogs:[]};
  Object.keys(S.logs).filter(function(k){return k.startsWith('merged_');}).forEach(function(k){
    var log=S.logs[k];if(!log)return;mst.totalWk++;var dayVol=0;
    Object.keys(log).forEach(function(ek){if(ek.startsWith('e'))Object.keys(log[ek]).forEach(function(sk){if(sk.startsWith('s')){var s=log[ek][sk];var wt=parseFloat(s.w)||0,rp=parseFloat(s.r)||0;var v=wt*rp;dayVol+=v;mst.totalSets++;mst.totalReps+=rp;}});});
    mst.totalVol+=dayVol;if(dayVol>mst.bestDay.vol)mst.bestDay={vol:dayVol,date:log.date||'',w:0,d:0};
    if(log.date)mst.recentLogs.push({date:log.date,vol:dayVol,w:0,d:0,name:'Merged'});
  });mst.recentLogs.sort(function(a,b){return parseLocalDate(b.date)-parseLocalDate(a.date);});return mst;}
var stats={totalVol:0,totalWk:0,totalSets:0,totalReps:0,bestDay:{vol:0,date:''},exCount:{},topExes:[],weekVols:[],recentLogs:[]};
for(var w=1;w<=pd.weeks;w++){var wVol=0;for(var d=1;d<=6;d++){var log=S.logs[lk(ap.id,w,d)];if(!log)continue;stats.totalWk++;
var wkD=pd.data[w];if(!wkD||!wkD.days)continue;var dayD=wkD.days[d];if(!dayD||!dayD.ex)continue;
var dayVol=0;dayD.ex.forEach(function(ex,ei){var eLog=log['e'+ei];if(!eLog)return;Object.keys(eLog).forEach(function(sk){if(!sk.startsWith('s'))return;var s=eLog[sk];var wt=parseFloat(s.w)||0,rp=parseFloat(s.r)||0;var v=wt*rp;dayVol+=v;stats.totalSets++;stats.totalReps+=rp;if(!stats.exCount[ex.n])stats.exCount[ex.n]=0;stats.exCount[ex.n]+=v;});});
stats.totalVol+=dayVol;wVol+=dayVol;if(dayVol>stats.bestDay.vol){stats.bestDay={vol:dayVol,date:log.date||'',w:w,d:d};}
if(log.date)stats.recentLogs.push({date:log.date,vol:dayVol,w:w,d:d,name:dayD.name});}stats.weekVols.push(wVol);}
stats.recentLogs.sort(function(a,b){return parseLocalDate(b.date)-parseLocalDate(a.date);});
var exArr=Object.keys(stats.exCount).map(function(k){return{name:k,vol:stats.exCount[k]};});exArr.sort(function(a,b){return b.vol-a.vol;});stats.topExes=exArr.slice(0,10);
return stats;}
