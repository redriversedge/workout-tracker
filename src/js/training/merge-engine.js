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

function getMergeKey(programs){
  var types=programs.map(function(p){var pd=gPD(p.id);return pd?pd.type:"unknown";}).sort();
  types=types.filter(function(t,i){return types.indexOf(t)===i;});// unique
  return types.join('+');
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
function getMergedDayExercises(dayTemplate,weekNum){
  var exercises=[];
  S.enrolled.forEach(function(en){
    var pd=gPD(en.id);if(!pd)return;
    if(dayTemplate.types.indexOf(pd.type)===-1)return;
    var wk=pd.data[weekNum]||pd.data[1];if(!wk)return;
    // Find best matching day from program
    var bestDay=null,bestScore=0;
    Object.keys(wk.days).forEach(function(dk){
      var dy=wk.days?wk.days[dk]:wk[dk];if(!dy||dy.isRest)return;
      var score=0;
      if(dayTemplate.type.indexOf('push')>-1&&dy.name&&dy.name.toLowerCase().indexOf('push')>-1)score+=10;
      if(dayTemplate.type.indexOf('pull')>-1&&dy.name&&dy.name.toLowerCase().indexOf('pull')>-1)score+=10;
      if(dayTemplate.type.indexOf('leg')>-1&&dy.name&&(dy.name.toLowerCase().indexOf('leg')>-1||dy.name.toLowerCase().indexOf('lower')>-1))score+=10;
      if(dayTemplate.type.indexOf('upper')>-1&&dy.name&&(dy.name.toLowerCase().indexOf('upper')>-1||dy.name.toLowerCase().indexOf('push')>-1))score+=10;
      if(dayTemplate.type.indexOf('full')>-1)score+=5;
      if(dayTemplate.type.indexOf('easy')>-1&&dy.name&&dy.name.toLowerCase().indexOf('easy')>-1)score+=10;
      if(dayTemplate.type.indexOf('long')>-1&&dy.name&&dy.name.toLowerCase().indexOf('long')>-1)score+=10;
      if(dayTemplate.type.indexOf('tempo')>-1&&dy.name&&dy.name.toLowerCase().indexOf('tempo')>-1)score+=10;
      if(dayTemplate.type.indexOf('interval')>-1&&dy.name&&dy.name.toLowerCase().indexOf('interval')>-1)score+=10;
      if(dayTemplate.type.indexOf('flow')>-1&&dy.name&&dy.name.toLowerCase().indexOf('flow')>-1)score+=10;
      if(dayTemplate.type.indexOf('recovery')>-1&&dy.name&&(dy.name.toLowerCase().indexOf('yin')>-1||dy.name.toLowerCase().indexOf('recovery')>-1||dy.name.toLowerCase().indexOf('restore')>-1))score+=10;
      if(score===0)score=1;// fallback: any non-rest day
      if(score>bestScore){bestScore=score;bestDay=dy;}
    });
    if(bestDay&&bestDay.ex){
      // For hybrid days with running, limit strength exercises
      var exList=bestDay.ex;
      if(dayTemplate.types.length>1&&pd.type==='strength'){
        exList=exList.slice(0,Math.min(exList.length,4));// Cap at 4 exercises for hybrid
      }
      exercises=exercises.concat(exList.map(function(ex){return Object.assign({},ex,{source:pd.type});}));
    }
  });
  return exercises;
}
