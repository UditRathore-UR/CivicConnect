function setupTheme(){
  const saved=localStorage.getItem("civicconnect_theme")||"light";
  document.documentElement.dataset.theme=saved==="dark"?"dark":"light";
  const btn=document.getElementById("themeToggle");
  if(btn){btn.textContent=saved==="dark"?"☀️":"🌙";btn.onclick=()=>{
    const dark=document.documentElement.dataset.theme!=="dark";
    document.documentElement.dataset.theme=dark?"dark":"light";
    localStorage.setItem("civicconnect_theme",dark?"dark":"light");
    btn.textContent=dark?"☀️":"🌙";
  }}
}
function escapeHTML(str=""){return String(str).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function formatDate(date){return new Date(date).toLocaleString([], {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});}
function statusClass(s){return s==="Resolved"?"success":s==="In Progress"||s==="Assigned"?"warning":s==="Verified"?"info":"neutral";}
function showToast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
function getRank(userId){const users=getDB().users.filter(u=>u.role==="citizen").sort((a,b)=>b.points-a.points);return users.findIndex(u=>u.id===userId)+1;}
document.addEventListener("DOMContentLoaded",setupTheme);