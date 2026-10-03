
function ensureGamification(u){
  const db=getDB();
  const x=db.users.find(v=>v.id===u.id);
  let changed=false;
  if(x.reputation==null){x.reputation=78;changed=true}
  if(x.streak==null){x.streak=0;changed=true}
  if(!x.lastCheckin){x.lastCheckin="";changed=true}
  if(x.reportCount==null){x.reportCount=0;changed=true}
  if(x.mysteryBoxes==null){x.mysteryBoxes=0;changed=true}
  if(x.verifiedCount==null){x.verifiedCount=0;changed=true}
  if(!x.challengeProgress || typeof x.challengeProgress!=="object"){x.challengeProgress={};changed=true}
  if(!x.completedChallenges || typeof x.completedChallenges!=="object"){x.completedChallenges={};changed=true}
  if(changed)saveDB(db);
  return x;
}

function challengeForToday(){
  const day=Math.floor(Date.now()/86400000);
  const challenges=[
    {icon:"📣",title:"Report 3 Genuine Issues",text:"Submit 3 legitimate civic reports today.",goal:3,action:"report",reward:60,link:"report.html"},
    {icon:"🔎",title:"Community Verifier",text:"Verify 1 report from another citizen.",goal:1,action:"verify",reward:35,link:"citizen-complaints.html#community"},
    {icon:"🗺️",title:"City Explorer",text:"Explore the report map and discover a civic issue.",goal:1,action:"explore",reward:40,link:"citizen-complaints.html"},
    {icon:"📸",title:"Evidence Expert",text:"Capture all 3 evidence views for one report.",goal:1,action:"evidence",reward:45,link:"report.html"}
  ];
  return challenges[day%challenges.length];
}
function dailyChallenge(){ return challengeForToday(); }

function challengeState(u,c){
  const key=new Date().toDateString()+"_"+c.action;
  return {
    key,
    progress:Number(u.challengeProgress?.[key]||0),
    completed:Boolean(u.completedChallenges?.[key])
  };
}
function updateChallengeProgress(action, amount=1){
  const u=currentUser(); if(!u)return;
  const c=challengeForToday();
  if(c.action!==action)return;
  const db=getDB(),x=db.users.find(v=>v.id===u.id);
  x.challengeProgress=x.challengeProgress||{};
  x.completedChallenges=x.completedChallenges||{};
  const key=new Date().toDateString()+"_"+action;
  x.challengeProgress[key]=Math.min(c.goal,(Number(x.challengeProgress[key]||0)+amount));
  if(x.challengeProgress[key]>=c.goal && !x.completedChallenges[key]){
    x.completedChallenges[key]=true;
    x.points=(x.points||0)+c.reward;
    x.reputation=Math.min(100,(x.reputation||0)+2);
    addNotification(x.id,`Daily challenge completed: ${c.title}. +${c.reward} Civic Points!`);
    showToast(`🎉 Quest complete! +${c.reward} Civic Points`);
  }
  saveDB(db);
}
function resetOldChallengeKeys(u){
  const today=new Date().toDateString();
  if(!u.challengeProgress)u.challengeProgress={};
  if(!u.completedChallenges)u.completedChallenges={};
  // Old keys are retained harmlessly; today's key is always date-scoped.
  return u;
}

function doCheckin(){
  const u=ensureGamification(currentUser()),today=new Date().toDateString();
  if(u.lastCheckin===today){showToast("Already checked in today ✓");return}
  const db=getDB(),x=db.users.find(v=>v.id===u.id);
  const last=x.lastCheckin?new Date(x.lastCheckin):null,now=new Date();
  const yesterday=new Date(now); yesterday.setHours(0,0,0,0); yesterday.setDate(yesterday.getDate()-1);
  const lastDay=last?new Date(last):null; if(lastDay)lastDay.setHours(0,0,0,0);
  x.streak=(lastDay&&lastDay.getTime()===yesterday.getTime())?Math.min((x.streak||0)+1,30):1;
  const pts=5+Math.min(x.streak-1,9)*2;
  x.points=(x.points||0)+pts;
  x.lastCheckin=today;
  saveDB(db);
  showToast(`🔥 ${x.streak}-day streak! +${pts} points`);
  renderGamification();
}

function renderGamification(){
  const u=ensureGamification(currentUser());
  const el=id=>document.getElementById(id);
  const c=challengeForToday(), state=challengeState(u,c);
  if(el("streakCount"))el("streakCount").textContent=u.streak;
  if(el("rewardStreak"))el("rewardStreak").textContent=u.streak;
  if(el("checkinPoints"))el("checkinPoints").textContent=u.lastCheckin===new Date().toDateString()?"Claimed":"+"+(5+Math.min(Math.max(u.streak,0),9)*2);
  if(el("checkinBtn"))el("checkinBtn").disabled=u.lastCheckin===new Date().toDateString();
  if(el("reputationScore"))el("reputationScore").textContent=u.reputation;

  const html=`
    <div class="challenge-icon">${c.icon}</div>
    <div class="challenge-main">
      <strong>${escapeHTML(c.title)}</strong>
      <p>${escapeHTML(c.text)}</p>
      <div class="challenge-progress"><i style="width:${Math.min(100,state.progress/c.goal*100)}%"></i></div>
      <small>${state.progress}/${c.goal} completed · <b>+${c.reward} XP</b></small>
    </div>
    <a class="btn secondary challenge-start" href="${c.link}">${state.completed?"✓ Done":"Start"} →</a>`;
  if(el("dailyChallenge"))el("dailyChallenge").innerHTML=html;
}

function openMysteryBox(){
  const u=ensureGamification(currentUser());
  if((u.mysteryBoxes||0)<1){showToast("🎁 Your next Mystery Box unlocks after 10 reports.");return}
  const rewards=[
    {text:"🎁 +50 Civic Points",points:50},
    {text:"🏅 New Civic Badge",badge:"Mystery Reward"},
    {text:"🎟️ Sponsored Discount Coupon",coupon:true},
    {text:"🛡️ +5 Reputation",rep:5}
  ];
  const reward=rewards[Math.floor(Math.random()*rewards.length)];
  const db=getDB(),x=db.users.find(v=>v.id===u.id);
  x.mysteryBoxes--;
  if(reward.points)x.points=(x.points||0)+reward.points;
  if(reward.badge){x.badges=x.badges||[];if(!x.badges.includes(reward.badge))x.badges.push(reward.badge);}
  if(reward.rep)x.reputation=Math.min(100,(x.reputation||0)+reward.rep);
  saveDB(db);
  const out=document.getElementById("mysteryResult");
  if(out)out.innerHTML=`<div class="mystery-win">🎉 ${reward.text}</div>`;
  showToast("🎁 Mystery reward unlocked!");
  renderGamification();
}

function markEvidenceChallenge(){
  updateChallengeProgress("evidence",1);
}
