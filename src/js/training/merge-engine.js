// === SCHEDULE MERGE ENGINE ===
// Training science: merges multiple programs into a safe, progressive weekly plan
// Rules:
// 1. Never pair heavy lower-body lifting with long runs (same day)
// 2. Hard days followed by easy/rest days
// 3. Minimum 1 full rest day per week
// 4. Running after upper-body lifting is OK (legs fresh)
// 5. Yoga serves as active recovery or warm-up/cool-down enhancement
// 6. Short runs (20-30 min) can pair with lifting
// 7. Long runs need their own day

var MERGE_TEMPLATES = {
  // Strength + Running merge templates by total days
  'strength+running': {
    3: [
      {type:'hybrid_upper_shortrun',label:'Upper Body + Short Run',types:['strength','running'],desc:'Upper body lift followed by 15-20 min easy run'},
      {type:'run_focus',label:'Running Focus',types:['running'],desc:'Longer run \u2014 tempo or intervals'},
      {type:'hybrid_lower_recovery',label:'Lower Body + Mobility',types:['strength'],desc:'Lower body lift with extra mobility work'}
    ],
    4: [
      {type:'strength_push',label:'Push Day',types:['strength'],desc:'Chest, shoulders, triceps \u2014 full effort'},
      {type:'run_easy',label:'Easy Run + Core',types:['running'],desc:'Easy pace 25-30 min, core work after'},
      {type:'strength_pull',label:'Pull + Legs',types:['strength'],desc:'Back, biceps, and compound legs'},
      {type:'run_long',label:'Long Run',types:['running'],desc:'Distance focus \u2014 build aerobic base'}
    ],
    5: [
      {type:'strength_upper',label:'Upper Body',types:['strength'],desc:'Push/pull compound lifts'},
      {type:'run_easy',label:'Easy Run',types:['running'],desc:'Recovery pace 20-25 min'},
      {type:'strength_lower',label:'Lower Body',types:['strength'],desc:'Squats, deadlifts, lunges'},
      {type:'rest',label:'Rest',types:[],desc:'Full recovery day',isRest:true},
      {type:'hybrid_full_longrun',label:'Light Lift + Long Run',types:['strength','running'],desc:'Light full-body circuit then distance run'}
    ],
    6: [
      {type:'strength_push',label:'Push Day',types:['strength'],desc:'Bench, OHP, triceps'},
      {type:'run_easy',label:'Easy Run',types:['running'],desc:'Recovery pace \u2014 shake out legs'},
      {type:'strength_pull',label:'Pull Day',types:['strength'],desc:'Rows, pull-ups, biceps'},
      {type:'run_tempo',label:'Tempo Run',types:['running'],desc:'Moderate effort sustained pace'},
      {type:'strength_legs',label:'Leg Day',types:['strength'],desc:'Squats, RDLs, lunges'},
      {type:'run_long',label:'Long Run',types:['running'],desc:'Distance \u2014 longest run of the week'}
    ]
  },
  'strength+yoga': {
    3: [
      {type:'strength_full',label:'Full Body Strength',types:['strength'],desc:'Compound lifts \u2014 squat, press, row'},
      {type:'yoga_recovery',label:'Yoga Recovery',types:['yoga'],desc:'Deep stretches and recovery flow'},
      {type:'strength_full2',label:'Full Body Strength B',types:['strength'],desc:'Deadlift, bench, pull-ups'}
    ],
    4: [
      {type:'strength_upper',label:'Upper Body',types:['strength'],desc:'Push and pull compounds'},
      {type:'yoga_flow',label:'Power Yoga',types:['yoga'],desc:'Strength-building flow with holds'},
      {type:'strength_lower',label:'Lower Body',types:['strength'],desc:'Squat and hinge patterns'},
      {type:'yoga_recovery',label:'Yin Yoga',types:['yoga'],desc:'Deep passive stretches \u2014 3-5 min holds'}
    ],
    5: [
      {type:'strength_push',label:'Push Day',types:['strength'],desc:'Chest, shoulders, triceps'},
      {type:'yoga_flow',label:'Vinyasa Flow',types:['yoga'],desc:'Dynamic flow for mobility'},
      {type:'strength_pull',label:'Pull Day',types:['strength'],desc:'Back and biceps focus'},
      {type:'strength_legs',label:'Leg Day',types:['strength'],desc:'Squats, lunges, RDLs'},
      {type:'yoga_recovery',label:'Recovery Yoga',types:['yoga'],desc:'Hip openers, twists, gentle stretches'}
    ],
    6: [
      {type:'strength_push',label:'Push Day',types:['strength'],desc:'Bench, OHP, dips'},
      {type:'yoga_flow',label:'Power Yoga',types:['yoga'],desc:'Warrior flows and balance'},
      {type:'strength_pull',label:'Pull Day',types:['strength'],desc:'Rows, pull-ups, curls'},
      {type:'yoga_recovery',label:'Yin Yoga',types:['yoga'],desc:'Long holds \u2014 hip and spine focus'},
      {type:'strength_legs',label:'Leg Day',types:['strength'],desc:'Heavy squats and deadlifts'},
      {type:'yoga_mobility',label:'Mobility Yoga',types:['yoga'],desc:'Active recovery and joint mobility'}
    ]
  },
  'running+yoga': {
    3: [
      {type:'run_easy',label:'Easy Run',types:['running'],desc:'Conversational pace 25-30 min'},
      {type:'yoga_recovery',label:'Recovery Yoga',types:['yoga'],desc:'Hip openers and hamstring stretches'},
      {type:'run_long',label:'Long Run',types:['running'],desc:'Build endurance at easy pace'}
    ],
    4: [
      {type:'run_tempo',label:'Tempo Run',types:['running'],desc:'Moderate-hard sustained effort'},
      {type:'yoga_flow',label:'Dynamic Yoga',types:['yoga'],desc:'Sun salutations and warrior flows'},
      {type:'run_long',label:'Long Run',types:['running'],desc:'Distance focus \u2014 slow and steady'},
      {type:'yoga_recovery',label:'Yin Yoga',types:['yoga'],desc:'Deep stretches for runner recovery'}
    ],
    5: [
      {type:'run_easy',label:'Easy Run',types:['running'],desc:'Recovery pace with strides'},
      {type:'yoga_flow',label:'Vinyasa Flow',types:['yoga'],desc:'Build strength and balance'},
      {type:'run_tempo',label:'Tempo Run',types:['running'],desc:'Threshold pace 20-25 min'},
      {type:'yoga_recovery',label:'Recovery Yoga',types:['yoga'],desc:'Gentle stretches and breathing'},
      {type:'run_long',label:'Long Run',types:['running'],desc:'Longest run of the week'}
    ],
    6: [
      {type:'run_easy',label:'Easy Run',types:['running'],desc:'Shake out 20 min'},
      {type:'yoga_flow',label:'Power Yoga',types:['yoga'],desc:'Standing poses and core'},
      {type:'run_intervals',label:'Intervals',types:['running'],desc:'Speed work with recovery jogs'},
      {type:'yoga_recovery',label:'Yin Yoga',types:['yoga'],desc:'Long holds for deep recovery'},
      {type:'run_long',label:'Long Run',types:['running'],desc:'Aerobic base building'},
      {type:'yoga_mobility',label:'Mobility Flow',types:['yoga'],desc:'Joint mobility and balance'}
    ]
  },
  'strength+running+yoga': {
    3: [
      {type:'strength_full',label:'Full Body Strength',types:['strength'],desc:'Major compound lifts'},
      {type:'run_easy',label:'Easy Run + Yoga Cool-Down',types:['running','yoga'],desc:'25 min run then 10 min yoga stretches'},
      {type:'hybrid_strength_yoga',label:'Strength + Yoga Flow',types:['strength','yoga'],desc:'Light lifting then power yoga flow'}
    ],
    4: [
      {type:'strength_upper',label:'Upper Body',types:['strength'],desc:'Push/pull compounds'},
      {type:'run_tempo',label:'Tempo Run',types:['running'],desc:'Moderate effort 20-25 min'},
      {type:'strength_lower',label:'Lower Body',types:['strength'],desc:'Squat and hinge focus'},
      {type:'yoga_recovery',label:'Recovery Yoga',types:['yoga'],desc:'Full body recovery flow'}
    ],
    5: [
      {type:'strength_push',label:'Push Day',types:['strength'],desc:'Chest, shoulders, triceps'},
      {type:'run_easy',label:'Easy Run',types:['running'],desc:'Recovery pace 20-25 min'},
      {type:'strength_pull_legs',label:'Pull + Legs',types:['strength'],desc:'Back, biceps, compound legs'},
      {type:'yoga_flow',label:'Yoga Flow',types:['yoga'],desc:'Dynamic strength-building flow'},
      {type:'run_long',label:'Long Run',types:['running'],desc:'Distance \u2014 aerobic base'}
    ],
    6: [
      {type:'strength_push',label:'Push Day',types:['strength'],desc:'Bench, OHP, dips, triceps'},
      {type:'run_easy',label:'Easy Run',types:['running'],desc:'Shake out legs 20 min'},
      {type:'strength_pull',label:'Pull Day',types:['strength'],desc:'Rows, pull-ups, curls'},
      {type:'yoga_flow',label:'Power Yoga',types:['yoga'],desc:'Balance, core, warrior flows'},
      {type:'strength_legs',label:'Leg Day',types:['strength'],desc:'Squats, RDLs, lunges'},
      {type:'run_long',label:'Long Run + Stretch',types:['running','yoga'],desc:'Long run then yoga cool-down'}
    ]
  }
};

// Maps enrolled programs to a MERGE_TEMPLATES key. Order-independent, and maps program types
// onto the template vocabulary (flexibility programs use the 'yoga' templates; HIIT schedules
// like strength). Returns the matching template key, or the joined types if none exists.
var MERGE_TYPE_ALIAS={flexibility:'yoga',hiit:'strength'};
function getMergeKey(programs){
  var types=programs.map(function(p){var pd=gPD(p.id);var t=pd?pd.type:'unknown';return MERGE_TYPE_ALIAS[t]||t;});
  types=types.filter(function(t,i){return types.indexOf(t)===i;}).sort();
  var want=types.join('+');
  var keys=Object.keys(MERGE_TEMPLATES);
  for(var i=0;i<keys.length;i++){if(keys[i].split('+').sort().join('+')===want)return keys[i];}
  return want;
}

function getMergedSchedule(){try{
  if(S.enrolled.length<=1)return null;
  var key=getMergeKey(S.enrolled);
  var templates=MERGE_TEMPLATES[key];
  if(!templates)return null;
  // Calculate total training days (use max of enrolled days, capped at 6)
  var totalDays=Math.min(Math.max.apply(null,S.enrolled.map(function(e){return e.days;})),6);
  var sched=templates[totalDays];
  if(!sched){// Find closest available
    var avail=Object.keys(templates).map(Number).sort();
    var closest=avail[0];avail.forEach(function(d){if(Math.abs(d-totalDays)<Math.abs(closest-totalDays))closest=d;});
    sched=templates[closest];totalDays=closest;
  }
  return{days:totalDays,schedule:sched,key:key};
}catch(e){console.error("Merge error:",e);return null;}}

// Map merged day types to actual exercises from the enrolled programs
// Intent words in a merge template's day type -> words that identify a matching program day.
var MERGE_DAY_MATCH={
  push:['push','chest','press','bench'],
  pull:['pull','back','row','bicep'],
  legs:['leg','lower','squat','hinge','posterior','swing','deadlift'],
  lower:['leg','lower','squat','hinge','posterior','swing','deadlift'],
  upper:['upper','push','pull','chest','press','shoulder','back','arm'],
  full:['full','strength day','grind','complex'],
  easy:['easy','run day'],
  long:['long'],
  tempo:['tempo','workout'],
  intervals:['interval','speed','sprint','acceleration'],
  focus:['tempo','interval','workout','speed'],
  shortrun:['easy','run day'],
  longrun:['long'],
  recovery:['recovery','gentle','restore','foundation','yin'],
  flow:['flow'],
  mobility:['mobility','hip','spine','shoulder','prep','ankle'],
  yoga:['flow','mobility','full body']
};
var MERGE_UPPER_WORDS=['upper','push','pull','chest','press','shoulder','arm','bicep','back'];
var MERGE_LOWER_WORDS=['leg','lower','squat','hinge','posterior'];

// Scores how well a program day fits a merged day template (higher is better, never 0 for a
// training day so there is always a fallback).
function mergeDayScore(templateType,dayName){
  var t=(templateType||'').toLowerCase(),n=(dayName||'').toLowerCase(),score=1;
  var intents=t.split('_');
  intents.forEach(function(word){
    var keys=MERGE_DAY_MATCH[word];if(!keys)return;
    for(var i=0;i<keys.length;i++){if(n.indexOf(keys[i])>-1){score+=10;break;}}
  });
  var wantsLower=intents.indexOf('lower')>-1||intents.indexOf('legs')>-1;
  var wantsUpper=intents.indexOf('upper')>-1||intents.indexOf('push')>-1||intents.indexOf('pull')>-1;
  var isUpper=MERGE_UPPER_WORDS.some(function(w){return n.indexOf(w)>-1;});
  var isLower=MERGE_LOWER_WORDS.some(function(w){return n.indexOf(w)>-1;});
  if(wantsLower&&!wantsUpper&&isUpper&&!isLower)score-=8;
  if(wantsUpper&&!wantsLower&&isLower&&!isUpper)score-=8;
  return score;
}

// Map merged day types to actual exercises from the enrolled programs
function getMergedDayExercises(dayTemplate,weekNum){
  var exercises=[];
  S.enrolled.forEach(function(en){
    var pd=gPD(en.id);if(!pd)return;
    var mType=MERGE_TYPE_ALIAS[pd.type]||pd.type;
    if(dayTemplate.types.indexOf(mType)===-1)return;
    var wk=pd.data[weekNum]||pd.data[1];if(!wk||!wk.days)return;
    var bestDay=null,bestScore=-Infinity;
    Object.keys(wk.days).forEach(function(dk){
      var dy=wk.days[dk];if(!dy||dy.isRest||!dy.ex)return;
      var score=mergeDayScore(dayTemplate.type,dy.name);
      if(score>bestScore){bestScore=score;bestDay=dy;}
    });
    if(bestDay&&bestDay.ex){
      // Hybrid days (lift + run or lift + flow) keep the strength part short.
      var exList=bestDay.ex;
      if(dayTemplate.types.length>1&&mType==='strength'){
        exList=exList.slice(0,Math.min(exList.length,4));
      }
      exercises=exercises.concat(exList.map(function(ex){return Object.assign({},ex,{source:pd.type});}));
    }
  });
  return exercises;
}

// Next unlogged training day in the merged plan, starting at the current week.
// Merged workouts are stored under merged_w{week}d{day}.
function getNextMergedDay(merged){
  merged=merged||getMergedSchedule();if(!merged||!merged.schedule)return null;
  var maxW=1;S.enrolled.forEach(function(e){var p=gPD(e.id);if(p&&p.weeks>maxW)maxW=p.weeks;});
  for(var w=Math.max(1,S.week||1);w<=maxW;w++){
    for(var i=0;i<merged.schedule.length;i++){
      var t=merged.schedule[i];if(!t||t.isRest)continue;
      if(!S.logs['merged_w'+w+'d'+(i+1)])return{w:w,d:i+1,name:t.label};
    }
  }
  return null;
}
// Points S.curLog at the merged workout for S.week/S.day, keeping an autosave only if it
// belongs to that same workout (an autosave from single-program mode never leaks in).
function loadMergedCL(){
  var key='merged_w'+S.week+'d'+S.day;
  if(S._curLogKey===key&&S.curLog&&Object.keys(S.curLog).length>0)return;
  S._curLogKey=key;
  S.curLog=JSON.parse(JSON.stringify(S.logs[key]||{}));
}
