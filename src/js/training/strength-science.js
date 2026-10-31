// === CSCS ENHANCEMENTS ===
// 1RM Estimation Coefficients (Epley formula: weight * (1 + reps/30))
function est1RM(w,r){if(r<=0||w<=0)return 0;if(r===1)return w;return Math.round(w*(1+r/30));}

// RPE to % 1RM mapping
var RPE_PCT={6:73,6.5:75,7:77,7.5:80,8:83,8.5:85,9:88,9.5:92,10:100};

// Deload detection thresholds
var DELOAD_CFG={weeksBeforeDeload:3,volumeDropPct:40,triggerFeelingAvg:4.5,consecutiveLowSessions:3};

// Red's coaching commentary templates
