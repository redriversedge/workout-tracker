// === PROFILE (with edit mode) ===
function rProfile(){var el=h('div',{className:'page active'});el.appendChild(h('h2',{style:{fontSize:'20px',fontWeight:800,marginBottom:'14px'}},'Profile'));
var pC=h('div',{className:'card'});
// Avatar + name
var av=h('div',{style:{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}});av.appendChild(h('div',{style:{width:'50px',height:'50px',borderRadius:'14px',background:'linear-gradient(135deg,var(--accent),#8b0000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:800,color:'#fff'}},(S.profile.name||'A')[0].toUpperCase()));
if(!S.editProfile){av.appendChild(h('div',null,h('h3',{style:{fontSize:'16px',fontWeight:800,margin:0}},S.profile.name||'Athlete'),h('p',{style:{color:'var(--text2)',fontSize:'11px'}},S.profile.level||'')));}
else{var ni=h('input',{className:'input',value:S.profile.name||'',style:{padding:'8px 12px',fontSize:'16px'}});ni.addEventListener('change',function(e){S.profile.name=e.target.value;sv();});av.appendChild(ni);}
pC.appendChild(av);
// Edit toggle
pC.appendChild(h('button',{className:'btn btn-sm '+(S.editProfile?'btn-primary':'btn-secondary'),style:{marginBottom:'14px'},onClick:function(){S.editProfile=!S.editProfile;R();}},S.editProfile?'\u2713 Done Editing':'Edit Profile'));

// Profile fields - ALL editable now
var OB_OPTS={
  level:['Just Starting Out','Beginner','Intermediate','Advanced'],
  goals:['Strength','Muscle Building','Fat Loss','General Fitness','Endurance','Flexibility & Mobility','Running','HIIT / Conditioning','Pilates','Prenatal Fitness'],
  equipment:['Full Gym','Barbells & Racks','Dumbbells','Kettlebells','Pull-Up Bar','Resistance Bands','Yoga Mat','Foam Roller','Medicine Ball','Cable Machine','Rowing Machine','Bodyweight Only'],
  time:['20 min','30 min','45 min','60 min','90 min'],
  days:['2 days','3 days','4 days','5 days','6 days'],
  injuries:['None','Lower Back','Shoulders','Knees','Wrists','Neck','Hips','Ankles','Elbows'],
  sex:['Male','Female','Prefer not to disclose'],
  pregnant:['No','Yes \u2014 1st trimester','Yes \u2014 2nd trimester','Yes \u2014 3rd trimester']
};
var fields=[{l:'Goals',id:'goals',t:'multi'},{l:'Equipment',id:'equipment',t:'multi'},{l:'Session',id:'time',t:'single'},{l:'Days',id:'days',t:'single'},{l:'Limitations',id:'injuries',t:'multi'}];
// Add pregnancy status field if user is female
if(S.profile.sex==='Female'){fields.push({l:'Pregnancy Status',id:'pregnant',t:'single'});}
fields.forEach(function(f){var val=S.profile[f.id];var display=Array.isArray(val)?val.join(', '):(val||'Not set');
  if(!S.editProfile){pC.appendChild(h('div',{className:'edit-row'},h('div',null,h('p',{className:'edit-label'},f.l),h('p',{className:'edit-val'},display))));}
  else{var sec=h('div',{style:{padding:'10px 0',borderBottom:'1px solid var(--border)'}});
    sec.appendChild(h('p',{className:'edit-label'},f.l));
    var opts=OB_OPTS[f.id]||[];
    var pills=h('div',{style:{display:'flex',flexWrap:'wrap',gap:'5px',marginTop:'5px'}});
    opts.forEach(function(opt){var sel=f.t==='single'?val===opt:(Array.isArray(val)&&val.indexOf(opt)>-1);
      pills.appendChild(h('button',{className:'pill'+(sel?' active':''),style:{padding:'5px 10px',fontSize:'11px'},onClick:function(){
        if(f.t==='single'){S.profile[f.id]=opt;
        // Sync profile changes to enrolled programs
        if(f.id==='days'){var nd=parseInt(opt);if(nd&&S.enrolled){S.enrolled.forEach(function(en){en.days=nd;});}}
        }
        else{var c=Array.isArray(val)?val.slice():[];if(opt==='None')c=['None'];else{c=c.filter(function(v){return v!=='None';});var i=c.indexOf(opt);i>-1?c.splice(i,1):c.push(opt);}S.profile[f.id]=c;}
        sv();R();
      }},opt));});sec.appendChild(pills);
    // Custom input for multi-select fields
    if(f.t==='multi'){
      var ciRow=h('div',{style:{display:'flex',gap:'6px',marginTop:'8px'}});
      var ciInp=h('input',{className:'input',placeholder:'Add other...',value:'',style:{flex:1,padding:'8px 10px',fontSize:'16px'}});
      ciRow.appendChild(ciInp);
      ciRow.appendChild(h('button',{className:'btn btn-primary btn-sm',innerHTML:svg('plus',12,'#fff'),onClick:function(){
        var v=ciInp.value.trim();if(!v)return;
        var c=Array.isArray(S.profile[f.id])?S.profile[f.id].filter(function(x){return x!=='None';}):[];
        c.push(v);S.profile[f.id]=c;sv();R();
      }}));sec.appendChild(ciRow);
    }
    pC.appendChild(sec);}});
el.appendChild(pC);

// Height - saved display with edit toggle
// Height is in measurements section (onboarding)

// Enrolled programs
var eC=h('div',{className:'card'});eC.appendChild(h('h3',{style:{fontSize:'14px',fontWeight:700,marginBottom:'10px'}},'My Programs'));
S.enrolled.forEach(function(en){var pd=gPD(en.id);if(!pd)return;eC.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}},h('div',null,h('p',{style:{fontWeight:600,fontSize:'13px'}},pd.name),h('p',{style:{color:'var(--text2)',fontSize:'10px'}},en.days+' days/wk')),h('button',{className:'btn btn-danger btn-sm',onClick:function(){var pn=pd.name;S.modal={type:'confirm',title:'Remove Program?',msg:'Remove '+pn+' from your enrolled programs?',confirmText:'Remove',cancelText:'Keep',onConfirm:function(){S.enrolled=S.enrolled.filter(function(e){return e.id!==en.id;});if(S.active===en.id)S.active=S.enrolled.length?S.enrolled[0].id:null;sv();S.modal=null;R();}};R();}},'Remove')));});
eC.appendChild(h('button',{className:'btn btn-secondary btn-block',style:{marginTop:'8px'},innerHTML:svg('plus',14)+' Add Program',onClick:function(){S.tab='programs';R();}}));
el.appendChild(eC);

// Dark mode
var dm=h('div',{className:'card',style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px'}});
dm.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'8px'}},h('span',{innerHTML:S.dark?svg('moon',16,'var(--accent)'):svg('sun',16,'var(--warn)')}),h('span',{style:{fontWeight:600,fontSize:'13px'}},'Dark Mode')));
var tog=h('button',{className:'toggle'+(S.dark?' on':'')});tog.appendChild(h('div',{className:'toggle-knob'}));tog.addEventListener('click',function(){S.dark=!S.dark;document.body.classList.toggle('dark');sv();R();});dm.appendChild(tog);el.appendChild(dm);
// Backup: export (share sheet on iPhone) and restore. Import accepts v18c, v19 and v20 backups.
var _lb=Backup.lastBackup();
var _lbDays=_lb?Math.floor((Date.now()-parseLocalDate(_lb).getTime())/86400000):null;
var _bk=h('div',{className:'card',style:{marginBottom:'10px'}});
_bk.appendChild(h('p',{className:'label'},'Your data'));
_bk.appendChild(h('p',{style:{fontSize:'12px',color:_lb&&_lbDays<30?'var(--text2)':'var(--warn)',margin:'4px 0 10px',lineHeight:'1.5'}},
  _lb?('Last backup: '+(_lbDays===0?'today':_lbDays===1?'yesterday':_lbDays+' days ago')+'.'+(_lbDays>=30?' Worth saving a fresh copy.':'')):'Your workouts live only on this phone. Save a backup so they are safe if you switch phones or clear Safari.'));
_bk.appendChild(h('button',{className:'btn btn-primary btn-block',style:{marginBottom:'8px'},onClick:function(){Backup.exportJSON().then(function(){toast('Backup saved');R();},function(e){if(!e||e.name!=='AbortError'){toast('Backup failed');console.error(e);}});}},'Save Backup'));
_bk.appendChild(h('button',{className:'btn btn-secondary btn-block',onClick:function(){Backup.promptImport(function(err){if(err)console.error('[RRE] import error:',err);});}},'Restore from Backup'));
if(Backup.hasUndo())_bk.appendChild(h('button',{className:'btn btn-block',style:{marginTop:'8px',background:'transparent',border:'1px solid var(--border)',color:'var(--text2)'},onClick:function(){S.modal={type:'confirm',title:'Undo restore?',msg:'Puts back the data that was on this phone before your last restore.',confirmText:'Undo restore',cancelText:'Keep',onConfirm:function(){Backup.undoImport();S.modal=null;toast('Restore undone');R();}};R();}},'Undo last restore'));
el.appendChild(_bk);
el.appendChild(h('button',{className:'btn btn-block',style:{background:'transparent',color:'var(--danger)',border:'1px solid var(--danger)'},onClick:function(){S.modal={type:'confirm',title:'Reset App?',msg:'This will erase ALL your data \u2014 workouts, measurements, programs, chat history \u2014 everything. This cannot be undone.',confirmText:'Yes, Reset Everything',cancelText:'Cancel',onConfirm:function(){['rre2_dark','rre2_profile','rre2_enrolled','rre2_active','rre2_logs','rre2_body','rre2_chat','rre2_prs','rre2_restdays','rre2_customwks','rre2_coachcache'].forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});S.dark=false;S.screen='onboarding';S.tab='home';S.obStep=0;S.profile={};S.enrolled=[];S.active=null;S.week=1;S.day=1;S.logs={};S.bodyLogs=[];S.curLog={};S.chatMsgs=[];S.chatIn='';S.prs={};S.customWks=[];S.restDayLogs={};S.coachCache={};S.redInsights=[];S.transcripts={};S.modal=null;document.body.classList.remove('dark');R();}};R();}},'Reset App'));return el;}
