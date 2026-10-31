// === NORMALIZE S&C PROGRAM DATA ===
// S&C programs use data[week][day] format, normalize to data[week].days[day]
['sc_jso','sc_beg','sc_int','sc_adv'].forEach(function(id){
  var p=PROGRAMS[id];if(!p||!p.data)return;
  var newData={};
  Object.keys(p.data).forEach(function(wk){
    var wd=p.data[wk];
    if(wd&&wd.days){newData[wk]=wd;return;}
    var days={};var dayNames=[];
    Object.keys(wd).forEach(function(dk){
      if(!isNaN(parseInt(dk))){days[dk]=wd[dk];if(wd[dk]&&wd[dk].name)dayNames.push(wd[dk].name);}
    });
    newData[wk]={name:'Week '+wk,focus:dayNames.slice(0,2).join(' / ')||'Training',rpe:'',int:'',days:days};
  });
  p.data=newData;
});


// Normalize S&C program data: data[w][d] -> data[w].days[d]
console.log('[RRE] Running S&C normalization...');
['sc_jso','sc_beg','sc_int','sc_adv'].forEach(function(pid){
  var prog=PROGRAMS[pid];
  if(!prog||!prog.data)return;
  // Check if already normalized (has .days wrapper)
  var firstWeek=prog.data[1];
  if(!firstWeek)return;
  if(firstWeek.days)return; // Already has days wrapper
  // Needs normalization: week keys contain day objects directly
  var newData={};
  Object.keys(prog.data).forEach(function(wk){
    var weekObj=prog.data[wk];
    if(!weekObj)return;
    var days={};
    var weekMeta={};
    Object.keys(weekObj).forEach(function(k){
      var num=parseInt(k);
      if(!isNaN(num)&&weekObj[k]&&weekObj[k].ex){
        days[k]=weekObj[k];
      }else{
        weekMeta[k]=weekObj[k];
      }
    });
    newData[wk]=Object.assign({},weekMeta,{name:weekMeta.name||'Week '+wk,days:days});
  });
  prog.data=newData;
});

console.log('[RRE] S&C normalization complete. sc_int.data[1].days:', typeof (PROGRAMS.sc_int&&PROGRAMS.sc_int.data&&PROGRAMS.sc_int.data[1]&&PROGRAMS.sc_int.data[1].days));

var PREG_SAFETY = {
  unsafe: ['str_bb_int','str_bb_adv','str_db_int','str_db_adv','str_kb_int','str_kb_adv','hiit_int','hiit_adv','run_half','run_marathon','run_sprint'],
  caution: ['str_bb_beg','str_db_beg','str_kb_beg','str_bw_int','str_bw_adv','hiit_jso','run_5k','run_10k'],
  safe: ['flex_jso','flex_general','flex_athletic','flex_pilates','flex_prenatal','str_bw_jso','str_bb_jso','str_db_jso','str_kb_jso','run_w2r'],
  recommended: ['flex_prenatal'],
  getStatus: function(progId) {
    if (this.recommended.indexOf(progId) > -1) return 'recommended';
    if (this.safe.indexOf(progId) > -1) return 'safe';
    if (this.caution.indexOf(progId) > -1) return 'caution';
    if (this.unsafe.indexOf(progId) > -1) return 'unsafe';
    return 'unknown';
  },
  getReason: function(progId) {

    var prog = PROGRAMS[progId];
    if (!prog) return '';
    var reasons = [];
    if (prog.type === 'strength' && (prog.level === 'Intermediate' || prog.level === 'Advanced')) {
      reasons.push('Heavy loading increases intra-abdominal pressure and Valsalva risk');
    }
    if (prog.type === 'hiit' && prog.level !== 'Just Starting Out') {
      reasons.push('High-intensity intervals can elevate core temperature and heart rate beyond safe ranges');
    }
    if (prog.type === 'running' && ['run_half','run_marathon','run_sprint'].indexOf(progId) > -1) {
      reasons.push('High-volume or sprint running increases impact forces and fall risk');
    }
    if (reasons.length === 0) reasons.push('This program has elements that may not be appropriate during pregnancy');
    return reasons.join('. ') + '.';
  }
};
