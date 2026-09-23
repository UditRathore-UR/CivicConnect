let compressedPhoto="";
function setupReportPage(){
  const photo=document.getElementById("photo"), preview=document.getElementById("photoPreview");
  photo.addEventListener("change",()=>{
    const file=photo.files[0]; if(!file)return;
    compressImage(file,700,0.72).then(data=>{
      compressedPhoto=data; preview.innerHTML=`<img src="${data}" alt="Evidence preview">`;
    });
  });
  document.getElementById("gpsBtn").addEventListener("click",()=>{
    const status=document.getElementById("locationStatus");
    if(!navigator.geolocation){status.textContent="GPS unavailable";return;}
    status.textContent="Detecting...";
    navigator.geolocation.getCurrentPosition(pos=>{
      document.getElementById("latitude").value=pos.coords.latitude.toFixed(6);
      document.getElementById("longitude").value=pos.coords.longitude.toFixed(6);
      status.textContent="Location captured";
      status.className="pill success";
      updateMapPreview();
    },()=>{status.textContent="Permission denied — use manual location";status.className="pill warning";});
  });
  ["manualLocation","latitude","longitude"].forEach(id=>document.getElementById(id).addEventListener("input",updateMapPreview));
  document.getElementById("reportForm").addEventListener("submit",submitComplaint);
}
function compressImage(file,maxSize,quality){
  return new Promise(resolve=>{
    const reader=new FileReader(); reader.onload=e=>{
      const img=new Image(); img.onload=()=>{
        const scale=Math.min(1,maxSize/Math.max(img.width,img.height));
        const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",quality));
      };img.src=e.target.result;
    };reader.readAsDataURL(file);
  });
}
function updateMapPreview(){
  const loc=document.getElementById("manualLocation").value.trim(),lat=document.getElementById("latitude").value,lon=document.getElementById("longitude").value;
  const box=document.getElementById("mapPreview");
  if(loc||lat||lon) box.innerHTML=`📍 <strong>${escapeHTML(loc||"Selected coordinates")}</strong><br><small>${lat&&lon?`${lat}, ${lon}`:"Manual location selected"}</small>`;
  else box.textContent="📍 Location preview will appear here";
}
function submitComplaint(e){
  e.preventDefault();
  const user=currentUser(),id=nextComplaintId();
  const c={id,userId:user.id,category:document.getElementById("category").value,description:document.getElementById("description").value.trim(),location:document.getElementById("manualLocation").value.trim()||"GPS location captured",latitude:document.getElementById("latitude").value,longitude:document.getElementById("longitude").value,photo:compressedPhoto,status:"Submitted",department:"Unassigned",createdAt:new Date().toISOString(),deadline:new Date(Date.now()+48*3600000).toISOString(),resolvedAt:"",resolution:"",points:20};
  saveComplaint(c); addNotification(user.id,`${id} was submitted successfully. +20 civic points.`);
  document.getElementById("submitMessage").innerHTML=`<div class="demo-box"><strong>✅ Complaint Submitted</strong><br>Complaint ID: <strong>${id}</strong><br>Status: Submitted<br>🎁 +20 Civic Points</div>`;
  document.getElementById("reportForm").reset(); compressedPhoto="";
  document.getElementById("photoPreview").textContent="No photo selected";
  document.getElementById("locationStatus").textContent="Not selected";
  document.getElementById("locationStatus").className="pill neutral";
}
function renderTimeline(status){
  const stages=["Submitted","Verified","Assigned","In Progress","Resolved"], idx=stages.indexOf(status);
  return `<div class="timeline">${stages.map((s,i)=>`<div class="timeline-step ${i<=idx?"done":""}">${s}</div>`).join("")}</div>`;
}
function renderCitizenComplaints(){
  const user=currentUser(), list=getComplaintsForUser(user.id), el=document.getElementById("complaintList");
  el.innerHTML=list.length?list.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(c=>`
  <article class="complaint-card">
    <div class="panel-head"><div><h2>${escapeHTML(c.id)} • ${escapeHTML(c.category)}</h2><small>${formatDate(c.createdAt)}</small></div><span class="pill ${statusClass(c.status)}">${escapeHTML(c.status)}</span></div>
    <p>${escapeHTML(c.description)}</p><div class="complaint-meta"><span>📍 ${escapeHTML(c.location)}</span><span>🏛️ ${escapeHTML(c.department)}</span></div>
    ${c.photo?`<img src="${c.photo}" alt="Evidence">`:""}
    ${renderTimeline(c.status)}
    ${c.resolution?`<div class="demo-box">✅ <strong>Resolution:</strong> ${escapeHTML(c.resolution)}</div>`:""}
    <small class="muted">SLA deadline: ${formatDate(c.deadline)}</small>
  </article>`).join(""):"<div class='panel'>No complaints yet. Create your first report.</div>";
}