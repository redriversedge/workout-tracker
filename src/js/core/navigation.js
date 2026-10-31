// === ANDROID BACK BUTTON / BROWSER BACK ===
// Prevent back button from leaving the app; instead navigate within the app
history.pushState({rre:true},'','');
window.addEventListener('popstate',function(e){
  // Always push state back so we never actually leave
  history.pushState({rre:true},'','');
  // Handle back: close modals first, then drill/exDB views, then go to home
  if(S.modal){S.modal=null;R();return;}
  if(S.timer){S.timer=null;R();return;}
  if(S.exDB){S.exDB=null;R();return;}
  if(S.drill){S.drill=null;R();return;}
  if(S.tab!=='home'){S.tab='home';R();return;}
});
