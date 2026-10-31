// === EXERCISE HISTORY & ANALYTICS ENGINE ===
function getExHistory(exName){
  var hist=[];
  Object.keys(S.logs).forEach(function(k){
    var log=S.logs[k];if(!log||!log.date)return;
    Object.keys(log).forEach(function(ek){
      if(!ek.startsWith('e'))return;
      var eData=log[ek];if(!eData||!eData._name)return;
      if(eData._name!==exName)return;
      var sets=[];
      Object.keys(eData).sort().forEach(function(sk){
        if(!sk.startsWith('s'))return;
        var s=eData[sk];
        if(s&&(s.w||s.r))sets.push({w:parseFloat(s.w)||0,r:parseInt(s.r)||0});
      });
      if(sets.length>0){
        var maxW=0,totalVol=0;
        sets.forEach(function(s){if(s.w>maxW)maxW=s.w;totalVol+=s.w*s.r;});
        hist.push({date:log.date.split('T')[0],sets:sets,maxW:maxW,vol:totalVol});
      }
    });
  });
  hist.sort(function(a,b){return a.date<b.date?-1:1;});
  return hist;
}

function getLastPerformance(exName){
  var hist=getExHistory(exName);
  return hist.length>0?hist[hist.length-1]:null;
}

function suggestWeight(exName,targetReps){
  var last=getLastPerformance(exName);
  if(!last||!last.sets||!last.sets.length)return null;
  var bestSet=null;
  last.sets.forEach(function(s){if(s.w>0&&(!bestSet||s.w>bestSet.w))bestSet=s;});
  if(!bestSet)return null;
  var w=bestSet.w,r=bestSet.r,tr=parseInt(targetReps)||r;
  // If they completed all reps at this weight, suggest small increase
  if(r>=tr)return{w:Math.ceil((w*1.025)/2.5)*2.5,note:'Up from '+w+'lbs'};
  // If they didn't complete reps, suggest same weight
  return{w:w,note:'Hit all reps at '+w+'lbs first'};
}

function calc1RM(weight,reps){
  if(!weight||weight<=0||!reps||reps<=0)return 0;
  if(reps===1)return weight;
  return Math.round(weight*(1+reps/30));// Epley
}

function getExercise1RM(exName){
  var hist=getExHistory(exName);
  var best=0;
  hist.forEach(function(h){h.sets.forEach(function(s){
    var rm=calc1RM(s.w,s.r);if(rm>best)best=rm;
  });});
  return best;
}

// Streak tracking
function getStreak(){
  var dates={};
  Object.keys(S.logs).forEach(function(k){
    var l=S.logs[k];if(l&&l.date)dates[l.date.split('T')[0]]=true;
  });
  if(S.customWks)S.customWks.forEach(function(c){if(c&&c.date)dates[c.date.split('T')[0]]=true;});
  // Count consecutive training weeks (not days \u2014 rest days are expected)
  var sortedDates=Object.keys(dates).sort();
  if(sortedDates.length===0)return{current:0,best:0,totalDays:0,thisWeek:0};
  // Current streak: consecutive weeks with at least 1 session
  var now=new Date();var curWeek=getWeekKey(now);
  var streak=0,d=new Date(now);
  for(var i=0;i<52;i++){
    var wk=getWeekKey(d);
    var hasSession=sortedDates.some(function(ds){return getWeekKey(new Date(ds+'T12:00:00'))===wk;});
    if(hasSession)streak++;
    else if(i>0)break; // allow current week to have no sessions yet
    d.setDate(d.getDate()-7);
  }
  // This week count
  var thisWeek=sortedDates.filter(function(ds){return getWeekKey(new Date(ds+'T12:00:00'))===curWeek;}).length;
  return{current:streak,totalDays:sortedDates.length,thisWeek:thisWeek};
}
function getWeekKey(d){var dd=new Date(d);var day=dd.getDay();dd.setDate(dd.getDate()-((day+6)%7));return localDateStr(dd);}

// Heat map data (last 12 weeks)
function getHeatMap(){
  var dates={};
  Object.keys(S.logs).forEach(function(k){var l=S.logs[k];if(l&&l.date)dates[l.date.split('T')[0]]=(dates[l.date.split('T')[0]]||0)+1;});
  if(S.customWks)S.customWks.forEach(function(c){if(c&&c.date){var ds=c.date.split('T')[0];dates[ds]=(dates[ds]||0)+1;}});
  var weeks=[];var d=new Date();d.setDate(d.getDate()-83);// 12 weeks back
  d.setDate(d.getDate()-((d.getDay()+6)%7));// align to Monday
  for(var w=0;w<12;w++){var week=[];for(var dd=0;dd<7;dd++){var cur=new Date(d);cur.setDate(d.getDate()+w*7+dd);var ds=localDateStr(cur);week.push({date:ds,count:dates[ds]||0});}weeks.push(week);}
  return weeks;
}

// Weekly check-in data
function getWeeklyStats(){
  var now=new Date();var wkKey=getWeekKey(now);
  var prevD=new Date(now);prevD.setDate(prevD.getDate()-7);var prevWk=getWeekKey(prevD);
  var cur={sessions:0,vol:0,sets:0},prev={sessions:0,vol:0,sets:0};
  Object.keys(S.logs).forEach(function(k){
    var l=S.logs[k];if(!l||!l.date)return;
    var d=parseLocalDate(l.date);var wk=getWeekKey(d);
    var stats=wk===wkKey?cur:wk===prevWk?prev:null;
    if(!stats)return;
    stats.sessions++;
    Object.keys(l).forEach(function(ek){
      if(!ek.startsWith('e'))return;var ed=l[ek];if(!ed)return;
      Object.keys(ed).forEach(function(sk){
        if(!sk.startsWith('s'))return;var s=ed[sk];
        if(s&&s.w&&s.r){stats.vol+=parseFloat(s.w)*parseInt(s.r);stats.sets++;}
      });
    });
  });
  var volChange=prev.vol>0?Math.round((cur.vol-prev.vol)/prev.vol*100):0;
  return{cur:cur,prev:prev,volChange:volChange};
}

// Exercise substitution map based on injuries
var INJURY_SUBS={
  'Lower Back':{
    'Barbell Back Squat':'Goblet Squat','Barbell Deadlift':'Trap Bar Deadlift',
    'Barbell Romanian Deadlift':'Dumbbell Romanian Deadlift (light)',
    'Barbell Bent-Over Row':'Chest-Supported Row','Good Morning':'Bird Dog'
  },
  'Shoulders':{
    'Barbell Overhead Press':'Landmine Press','Dumbbell Overhead Press':'Dumbbell Lateral Raise',
    'Military Press':'Landmine Press','Arnold Press':'Lateral Raise',
    'Behind-the-Neck Press':'Front Raise'
  },
  'Knees':{
    'Barbell Back Squat':'Box Squat (partial ROM)','Barbell Front Squat':'Leg Press (partial)',
    'Barbell Walking Lunges':'Reverse Lunge','Leg Extension':'Terminal Knee Extension',
    'Jump Squat':'Bodyweight Squat','Box Jump':'Step-Up'
  },
  'Wrists':{
    'Barbell Bench Press':'Dumbbell Bench Press (neutral grip)',
    'Barbell Front Squat':'Cross-Arm Front Squat','Barbell Curl':'Hammer Curl',
    'Push-Up':'Fist Push-Up or Push-Up on Handles'
  },
  'Hips':{
    'Barbell Back Squat':'Goblet Squat','Barbell Walking Lunges':'Step-Up',
    'Sumo Deadlift':'Conventional Deadlift','Hip Thrust':'Glute Bridge'
  }
};

function getSubstitution(exName){
  var injuries=S.profile.injuries||[];
  if(!Array.isArray(injuries)||injuries.indexOf('None')>-1)return null;
  for(var i=0;i<injuries.length;i++){
    var subs=INJURY_SUBS[injuries[i]];
    if(subs&&subs[exName])return{original:exName,sub:subs[exName],reason:injuries[i]+' modification'};
  }
  return null;
}

// Deload detection
function needsDeload(ap,pd){
  if(!ap||!pd)return false;
  var currentWeek=ap.week||S.week||1;
  if(currentWeek<4)return false;// too early
  // Check last 3 weeks of RPE
  var highRPE=0;
  for(var w=Math.max(1,currentWeek-2);w<=currentWeek;w++){
    var wk=pd.data[w];
    if(wk&&wk.rpe){var rpe=parseFloat(wk.rpe);if(rpe>=8)highRPE++;}
  }
  // Check if current week is already a deload
  var curWk=pd.data[currentWeek];
  if(curWk&&curWk.name&&curWk.name.toLowerCase().indexOf('deload')>-1)return false;
  return highRPE>=2;
}

// Nutrition tips by goal
function getNutritionTip(){
  var goals=S.profile.goals||[];
  var tips={
    fatLoss:["Get protein in within an hour \u2014 aim for 30-40g to protect that muscle while you cut.","Hydrate well \u2014 dehydration makes you feel hungrier than you actually are.","Solid work. Don't skip your post-workout meal, your metabolism is fired up right now."],
    muscle:["Eat within 30 min \u2014 protein plus carbs. Your muscles are primed to absorb nutrients right now.","Great session. Make sure you're hitting protein at every meal today, not just post-workout.","Your muscles need fuel to grow \u2014 don't be afraid of carbs after a session like this."],
    running:["Refuel with carbs and protein \u2014 your glycogen stores need replenishing after that effort.","Hydration check: aim for 16-20oz of water in the next hour. Your body just lost a lot.","Good run. A mix of carbs and protein within 30 min will speed your recovery."],
    general:["Get some protein in within the next hour \u2014 your body is primed for recovery right now.","Don't forget to hydrate \u2014 water first, food within the hour.","Your muscles did the work, now feed them. Protein and whole foods over the next couple hours."]
  };
  var pool=tips.general;
  if(goals.indexOf('Fat Loss')>-1)pool=tips.fatLoss;
  else if(goals.indexOf('Muscle Building')>-1)pool=tips.muscle;
  else if(goals.indexOf('Running')>-1)pool=tips.running;
  return pool[Math.floor(Math.random()*pool.length)];
}
