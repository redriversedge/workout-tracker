// === SUPERSET ENGINE ===
var SS_PAIRS=(function(){var p={
// Original Strength pairs
'Barbell Bench Press':'Barbell Bent-Over Row',
'Incline Barbell Press':'T-Bar Rows',
'Incline Dumbbell Press':'Chest-Supported Rows',
'Dumbbell Overhead Press':'Pull-Ups',
'Dumbbell Lateral Raises':'Rear Delt Flyes',
'Overhead Tricep Extension':'Barbell Bicep Curls',
'Dumbbell Bicep Curls':'Tricep Rope Pushdowns',
'Barbell Back Squat':'Leg Curls',
'Romanian Deadlift':'Leg Press',
'Dumbbell Lunges':'Calf Raises',
'Cable Lateral Raises':'Face Pulls',
'Weighted Pull-Ups':'Weighted Dips',
// Dumbbell Strength pairs
'Dumbbell Bench Press':'Dumbbell Bent-Over Row',
'Dumbbell Incline Press':'Single-Arm Dumbbell Row',
'Dumbbell Arnold Press':'Dumbbell Rear Delt Flyes',
'Dumbbell Hammer Curls':'Dumbbell Skull Crushers',
'Dumbbell Bicep Curls':'Dumbbell Tricep Kickbacks',
'Dumbbell Goblet Squat':'Dumbbell RDL',
'Dumbbell Step-Ups':'Dumbbell Single-Leg RDL',
'Dumbbell Bulgarian Split Squat':'Dumbbell Hip Thrust',
'Dumbbell Overhead Press':'Dumbbell Bent-Over Row',
'Dumbbell Concentration Curls':'Dumbbell Close-Grip Press',
'Dumbbell Sumo Squat':'Dumbbell Calf Raises',
'Dumbbell Lunges':'Dumbbell Calf Raises',
// Bodyweight pairs
'Push-Ups':'Inverted Rows',
'Decline Push-Ups':'Australian Pull-Ups',
'Diamond Push-Ups':'Chin-Ups',
'Pike Push-Ups':'Doorframe Rows',
'Archer Push-Ups':'Pull-Ups (or Negatives)',
'Tricep Dips (Chair)':'Dead Hang',
'Bodyweight Squat':'Glute Bridges',
'Jump Squats':'Reverse Lunges',
'Bulgarian Split Squats':'Single-Leg Glute Bridge',
'Plank to Push-Up':'Superman Hold',
'Burpees':'Mountain Climbers',
'Push-Ups (Knee)':'Superman Hold',
// Kettlebell pairs
'Kettlebell Clean & Press':'Kettlebell Row',
'Kettlebell Floor Press':'Kettlebell Windmill',
'Kettlebell Swing':'Kettlebell Goblet Squat',
'Kettlebell Snatch':'Kettlebell Front Squat',
'Kettlebell Thruster':'Kettlebell Russian Twist',
'Kettlebell Clean & Jerk':'Kettlebell Single-Leg Deadlift',
'Kettlebell Lunge':'Kettlebell Swing (Heavy)',
'Kettlebell Bottoms-Up Press':'Kettlebell Turkish Get-Up',
'Kettlebell Step-Up':'Kettlebell Reverse Lunge',
// HIIT pairs
'Squat Jumps':'Push-Ups',
'Box Jumps':'Plank Jacks',
'Speed Skaters':'Commando Planks',
'Tuck Jumps':'Bear Crawl',
'High Knees':'Shoulder Taps',
'Broad Jumps':'Renegade Rows',
'Burpee Box Jumps':'Mountain Climbers',
'Walking Lunges':'Push-Up Variations'
};
// Build bidirectional map
var m={};Object.keys(p).forEach(function(k){m[k]=p[k];if(!m[p[k]])m[p[k]]=k;});return m;})();
function getSupersets(exercises){
  if(!exercises||exercises.length<2)return[];
  var used={},groups=[];
  for(var i=0;i<exercises.length;i++){
    if(used[i])continue;var pair=SS_PAIRS[exercises[i].n];
    if(pair){for(var j=i+1;j<exercises.length;j++){if(!used[j]&&exercises[j].n===pair){groups.push({a:i,b:j});used[i]=true;used[j]=true;break;}}}
  }
  return groups;
}
function renderSSToggle(el,exercises){
  if(!exercises||exercises.length<2)return;
  var pairs=getSupersets(exercises);
  if(pairs.length===0)return;
  var tb=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--card)',borderRadius:'12px',marginBottom:'8px',border:'1px solid var(--border)'}});
  tb.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'8px'}},
    h('span',{className:'ss-badge'},'SS'),
    h('div',null,
      h('span',{style:{fontSize:'12px',fontWeight:700}},'Superset Mode'),
      h('p',{style:{fontSize:'9px',color:'var(--text2)',margin:'1px 0 0'}},pairs.length+' pair'+(pairs.length>1?'s':'')+' detected \u2014 saves ~'+Math.round(pairs.length*3)+' min')
    )
  ));
  var tog=h('button',{className:'toggle'+(S.ssMode?' on':'')});tog.appendChild(h('div',{className:'toggle-knob'}));
  tog.addEventListener('click',function(){S.ssMode=!S.ssMode;R();});
  tb.appendChild(tog);el.appendChild(tb);
  if(S.ssMode){el.appendChild(h('p',{style:{fontSize:'10px',color:'#a855f7',margin:'-4px 0 6px',fontStyle:'italic'}},'Alternate sets between paired exercises. 60s rest between rounds.'));}
}
