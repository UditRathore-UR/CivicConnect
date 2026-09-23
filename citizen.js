function loadCitizenDashboard(){
  const u=currentUser(), cs=getComplaintsForUser(u.id);
  document.getElementById("welcome").textContent=`Welcome, ${u.name} 👋`;
  document.getElementById("totalReports").textContent=cs.length;
  document.getElementById("progressReports").textContent=cs.filter(c=>c.status==="In Progress"||c.status==="Assigned").length;
  document.getElementById("resolvedReports").textContent=cs.filter(c=>c.status==="Resolved").length;
  document.getElementById("points").textContent=u.points;
  document.getElementById("badgeCount").textContent=u.badges.length;
  document.getElementById("rank").textContent="#"+getRank(u.id);
  document.getElementById("nextBadge").textContent=u.points>=150?"Community Champion next!":"Next goal: 150 points";
  const recent=document.getElementById("recentComplaints");
  recent.innerHTML=cs.slice(-4).reverse().map(c=>`<div class="list-item"><div><strong>${escapeHTML(c.id)} • ${escapeHTML(c.category)}</strong><small>${escapeHTML(c.location)}</small></div><span class="pill ${statusClass(c.status)}">${escapeHTML(c.status)}</span></div>`).join("");
}
function renderProfile(){ renderCitizenProfile(); }
