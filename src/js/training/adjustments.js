var ADJUST_RULES=[
  {condition:'low_feeling',trigger:function(logs){var recent=[];Object.keys(logs).forEach(function(k){var l=logs[k];if(l&&l.feeling&&l.date){recent.push({date:l.date,f:l.feeling});}});recent.sort(function(a,b){return new Date(b.date)-new Date(a.date);});var last3=recent.slice(0,3);if(last3.length<3)return null;var avg=last3.reduce(function(s,x){return s+x.f;},0)/3;if(avg<DELOAD_CFG.triggerFeelingAvg)return{type:'deload_suggest',avg:avg.toFixed(1)};return null;},
    redMsg:"I noticed your last few sessions have been tough (avg feeling: {avg}/10). Your body might be asking for a lighter week. Want me to reduce your weights by 40% for the next 3 sessions? You'll come back stronger \u2014 I promise.",
    action:'reduce_volume'},
  {condition:'high_feeling',trigger:function(logs){var recent=[];Object.keys(logs).forEach(function(k){var l=logs[k];if(l&&l.feeling&&l.date){recent.push({date:l.date,f:l.feeling});}});recent.sort(function(a,b){return new Date(b.date)-new Date(a.date);});var last3=recent.slice(0,3);if(last3.length<3)return null;var avg=last3.reduce(function(s,x){return s+x.f;},0)/3;if(avg>=8.5)return{type:'intensity_up',avg:avg.toFixed(1)};return null;},
    redMsg:"You've been crushing it! Avg feeling {avg}/10 over your last 3 sessions. Ready to bump up the intensity? I can add 5-10% to your working weights.",
    action:'increase_intensity'},
  {condition:'missed_sessions',trigger:function(logs){var dates=[];Object.keys(logs).forEach(function(k){var l=logs[k];if(l&&l.date)dates.push(new Date(l.date));});if(dates.length<2)return null;dates.sort(function(a,b){return b-a;});var gap=(dates[0]-dates[1])/(1000*60*60*24);if(gap>10)return{type:'comeback',days:Math.round(gap)};return null;},
    redMsg:"Welcome back! It's been {days} days since your last workout. No judgment \u2014 life happens. Let's ease back in with reduced weights (80% of your last logged) for a session or two.",
    action:'reduce_comeback'}
];

function checkAdjustments(){
  var results=[];
  ADJUST_RULES.forEach(function(rule){
    var trigger=rule.trigger(S.logs);
    if(trigger){
      var msg=rule.redMsg;
      Object.keys(trigger).forEach(function(k){msg=msg.replace('{'+k+'}',trigger[k]);});
      results.push({type:trigger.type,msg:msg,action:rule.action,data:trigger});
    }
  });
  return results;
}

// Apply program adjustments and save
function applyAdjustment(adj){
  if(adj.action==='reduce_volume'){
    // Create adjusted log entries with reduced weights
    S.profile.activeAdj={type:'deload',startDate:localISOStr(),sessionsLeft:3,factor:0.6};
    sv();toast('Red adjusted your next 3 sessions \u2014 lighter weights for recovery');
  }else if(adj.action==='increase_intensity'){
    S.profile.activeAdj={type:'intensity_up',startDate:localISOStr(),sessionsLeft:3,factor:1.1};
    sv();toast('Red bumped your weights up 10%! Let\'s go \uD83D\uDCAA');
  }else if(adj.action==='reduce_comeback'){
    S.profile.activeAdj={type:'comeback',startDate:localISOStr(),sessionsLeft:2,factor:0.8};
    sv();toast('Welcome back! Easing you in at 80%');
  }
  return true;
}

// Get adjustment factor for current session
function getAdjFactor(){
  var adj=S.profile.activeAdj;
  if(!adj||adj.sessionsLeft<=0){if(adj)delete S.profile.activeAdj;return 1;}
  return adj.factor||1;
}
function useAdjSession(){
  var adj=S.profile.activeAdj;
  if(adj&&adj.sessionsLeft>0){adj.sessionsLeft--;if(adj.sessionsLeft<=0)delete S.profile.activeAdj;sv();}
}

// Rest day activity logging
var REST_ACTIVITIES=[
  {id:'foam_roll',name:'Foam Rolling',icon:'\uD83E\uDDF4',dur:'10-15 min'},
  {id:'walk',name:'Walk',icon:'\uD83D\uDEB6',dur:'20-30 min'},
  {id:'stretch',name:'Stretching',icon:'\uD83E\uDDD8',dur:'10-15 min'},
  {id:'yoga_light',name:'Light Yoga',icon:'\uD83D\uDE4F',dur:'15-20 min'},
  {id:'swim',name:'Swimming',icon:'\uD83C\uDFCA',dur:'20-30 min'},
  {id:'ice_bath',name:'Cold Exposure',icon:'\uD83E\uDDCA',dur:'2-5 min'},
  {id:'sauna',name:'Sauna/Heat',icon:'\uD83D\uDD25',dur:'15-20 min'},
  {id:'sleep',name:'Extra Sleep',icon:'\uD83D\uDE34',dur:'1+ hr'}
];
