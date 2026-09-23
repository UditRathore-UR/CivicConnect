function renderRewards(){
 const u=currentUser(),users=getDB().users.filter(x=>x.role==="citizen").sort((a,b)=>b.points-a.points);
 document.getElementById("rewardPoints").textContent=u.points;document.getElementById("rewardBadges").textContent=u.badges.length;document.getElementById("rewardRank").textContent="#"+getRank(u.id);
 document.getElementById("badges").innerHTML=u.badges.map(b=>`<div class="badge-item"><div class="role-icon">🏅</div><strong>${escapeHTML(b)}</strong><small class="muted">Civic contribution badge</small></div>`).join("");
 document.getElementById("leaderboard").innerHTML=users.map((x,i)=>`<div class="leader-row"><strong>${i+1}</strong><span>${escapeHTML(x.name)}${x.id===u.id?" (You)":""}</span><strong>${x.points}</strong></div>`).join("");
}