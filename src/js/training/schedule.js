// === MISSED WORKOUT SHIFT SYSTEM ===
// Returns the next unlogged non-rest workout in program sequence
function getNextWorkout(ap,pd){
  if(!ap||!pd||!pd.data)return null;
  for(var w=1;w<=pd.weeks;w++){
    var wk=pd.data[w];if(!wk||!wk.days)continue;
    for(var d=1;d<=ap.days;d++){
      var dy=wk.days[d];if(!dy||dy.isRest)continue;
      if(!S.logs[lk(ap.id,w,d)])return{w:w,d:d,name:dy.name,dy:dy};
    }
  }
  return null;
}

// Returns info about missed/shifted workouts
function getMissedInfo(ap,pd){
  if(!ap||!pd||!pd.data)return{missed:0,msg:''};
  var startDate=ap.startDate||S.startDate;
  if(!startDate)return{missed:0,msg:''};
  var dpw=ap.days||pd.daysPerWeek||3;
  var trainingDays=getTrainingDayPattern(dpw);
  // Count how many training days have passed since start
  var start=parseLocalDate(startDate);
  var now=new Date();now.setHours(23,59,59);
  var expectedSlots=0;
  var cursor=new Date(start);
  while(cursor<=now){
    if(trainingDays.indexOf(cursor.getDay())>-1)expectedSlots++;
    cursor.setDate(cursor.getDate()+1);
  }
  // Count logged workouts
  var logged=0;
  for(var w=1;w<=pd.weeks;w++){
    var wk=pd.data[w];if(!wk||!wk.days)continue;
    for(var d=1;d<=ap.days;d++){
      var dy=wk.days[d];if(!dy||dy.isRest)continue;
      if(S.logs[lk(ap.id,w,d)])logged++;
    }
  }
  var missed=Math.max(0,expectedSlots-logged);
  var msg='';
  if(missed===1)msg="You missed a session, so I shifted it to today. No big deal \u2014 we just pick up where we left off.";
  else if(missed===2)msg="You've got "+missed+" sessions to catch up on. I've shifted your schedule forward. Let's knock them out.";
  else if(missed>=3)msg="It's been a minute \u2014 "+missed+" sessions behind. I've compressed the schedule to get you back on track. Let's go.";
  return{missed:missed,msg:msg};
}

// Returns training day pattern (which days of week are training days)
function getTrainingDayPattern(dpw){
  if(dpw>=6)return[1,2,3,4,5,6];
  if(dpw===5)return[1,2,3,4,5];
  if(dpw===4)return[1,2,4,5];
  if(dpw===3)return[1,3,5];
  if(dpw===2)return[1,4];
  return[1,3,5];
}

// Builds a shifted calendar schedule: maps dates to workouts
function getShiftedSchedule(ap,pd){
  if(!ap||!pd||!pd.data)return{};
  var schedule={};
  var dpw=ap.days||pd.daysPerWeek||3;
  var trainingDays=getTrainingDayPattern(dpw);
  // Build workout sequence (all non-rest workouts)
  var seq=[];
  for(var w=1;w<=pd.weeks;w++){
    var wk=pd.data[w];if(!wk||!wk.days)continue;
    for(var d=1;d<=ap.days;d++){
      var dy=wk.days[d];if(!dy||dy.isRest)continue;
      seq.push({w:w,d:d,name:dy.name,logKey:lk(ap.id,w,d),type:pd.type||'strength'});
    }
  }
  // Phase 1: place logged workouts on their actual dates
  var placed={};
  seq.forEach(function(s){
    var log=S.logs[s.logKey];
    if(log&&log.date){
      var ds=log.date.split('T')[0];
      placed[s.logKey]=ds;
      if(!schedule[ds])schedule[ds]=[];
      schedule[ds].push({w:s.w,d:s.d,name:s.name,done:true,type:s.type,id:ap.id});
    }
  });
  // Phase 2: assign unlogged workouts to future training days
  var missedInfo=getMissedInfo(ap,pd);
  var borrowRest=missedInfo.missed>=2;
  var today=new Date();today.setHours(0,0,0,0);
  var cursor=new Date(today);
  seq.forEach(function(s){
    if(placed[s.logKey])return;
    // Find next available day
    for(var safety=0;safety<365;safety++){
      var dow=cursor.getDay();
      var isTraining=trainingDays.indexOf(dow)>-1;
      var isSunday=dow===0;
      if(isTraining||(borrowRest&&!isSunday)){
        var ds=localDateStr(cursor);
        if(!schedule[ds])schedule[ds]=[];
        // Don't double-book a date
        var alreadyHasUnlogged=schedule[ds].some(function(x){return!x.done&&x.id===ap.id;});
        if(!alreadyHasUnlogged){
          schedule[ds].push({w:s.w,d:s.d,name:s.name,done:false,type:s.type,id:ap.id});
          cursor.setDate(cursor.getDate()+1);
          return;
        }
      }
      cursor.setDate(cursor.getDate()+1);
    }
  });
  return schedule;
}
