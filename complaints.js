
let compressedPhoto="";
let evidencePhotos=[null,null,null];
let evidenceMeta=[null,null,null];
let activeCaptureIndex=0;
let activeCameraStream=null;

function setupReportPage(){
  const photo=document.getElementById("photo");
  if(photo){
    photo.addEventListener("change",()=>{
      const files=[...photo.files].slice(0,3);
      Promise.all(files.map(f=>compressImage(f,1000,.80))).then(arr=>{
        evidencePhotos=[null,null,null];
        evidenceMeta=[null,null,null];
        arr.forEach((v,i)=>{evidencePhotos[i]=v;evidenceMeta[i]={type:"upload",timestamp:new Date().toISOString()}});
        compressedPhoto=evidencePhotos[0]||"";
        renderEvidence();
      });
    });
  }
  document.querySelectorAll(".capture-btn").forEach(btn=>{
    btn.addEventListener("click",()=>openCamera(Number(btn.dataset.shot)));
  });
  const uploadBtn=document.getElementById("uploadEvidenceBtn");
  if(uploadBtn)uploadBtn.addEventListener("click",()=>document.getElementById("photo")?.click());
  const form=document.getElementById("reportForm");
  if(form)form.addEventListener("submit",submitComplaint);
  renderEvidence();
}

function stopCamera(){
  if(activeCameraStream){
    activeCameraStream.getTracks().forEach(t=>t.stop());
    activeCameraStream=null;
  }
}

async function openCamera(index){
  activeCaptureIndex=index;
  const isSecure=window.isSecureContext || location.hostname==="localhost" || location.hostname==="127.0.0.1";
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !isSecure){
    showCameraFallback("Camera access requires HTTPS or localhost. Use the included RUN_CIVICCONNECT.bat / Live Server, then try Capture Now again.");
    return;
  }
  try{
    stopCamera();
    activeCameraStream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},
      audio:false
    });
    const modal=document.createElement("div");
    modal.className="camera-modal-backdrop";
    modal.id="cameraModal";
    modal.innerHTML=`
      <div class="camera-modal">
        <div class="camera-head">
          <div><span class="eyebrow">LIVE EVIDENCE CAPTURE</span><h2>View ${index+1} of 3</h2></div>
          <button class="icon-btn" id="closeCamera">✕</button>
        </div>
        <div class="camera-stage">
          <video id="liveCamera" autoplay playsinline muted></video>
          <div class="camera-overlay"><span>● LIVE</span><small>View ${index+1} / 3</small></div>
          <div class="camera-guide"></div>
        </div>
        <div class="camera-meta">
          <span>🕐 ${new Date().toLocaleString()}</span>
          <span>📍 ${document.getElementById("latitude")?.value||"GPS pending"}, ${document.getElementById("longitude")?.value||"GPS pending"}</span>
        </div>
        <div class="camera-actions">
          <button class="btn ghost" id="cameraCancel">Cancel</button>
          <button class="capture-shutter" id="takePhoto" aria-label="Take photo">📸</button>
          <button class="btn secondary" id="cameraSwitch">🔄 Switch</button>
        </div>
        <p class="camera-note">Take each view separately. Location and timestamp are stamped onto the evidence.</p>
      </div>`;
    document.body.appendChild(modal);
    const video=modal.querySelector("#liveCamera");
    video.srcObject=activeCameraStream;
    await video.play().catch(()=>{});
    const close=()=>{stopCamera();modal.remove()};
    modal.querySelector("#closeCamera").onclick=close;
    modal.querySelector("#cameraCancel").onclick=close;
    modal.querySelector("#takePhoto").onclick=()=>takeCameraPhoto(video,index,close);
    modal.querySelector("#cameraSwitch").onclick=async()=>{
      stopCamera();
      const current=video.style.transform;
      // Front/back switching is best-effort; request the opposite camera.
      const facing=current==="scaleX(-1)"?"environment":"user";
      try{
        activeCameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing}},audio:false});
        video.srcObject=activeCameraStream;
        video.style.transform=facing==="user"?"scaleX(-1)":"none";
        await video.play().catch(()=>{});
      }catch(e){showToast("Could not switch camera.");}
    };
  }catch(err){
    stopCamera();
    showCameraFallback("The browser blocked camera access. Allow camera permission and try again. If you opened the ZIP with file://, run it through localhost using the included launcher.");
  }
}

function showCameraFallback(message){
  const old=document.getElementById("cameraHelpModal"); if(old)old.remove();
  const modal=document.createElement("div");
  modal.id="cameraHelpModal";
  modal.className="camera-modal-backdrop";
  modal.innerHTML=`<div class="camera-modal camera-help">
    <div class="camera-head"><div><span class="eyebrow">CAMERA ACCESS</span><h2>Capture Now needs browser camera access</h2></div><button class="icon-btn" onclick="this.closest('.camera-modal-backdrop').remove()">✕</button></div>
    <div class="camera-help-icon">📷</div>
    <p>${escapeHTML(message)}</p>
    <div class="camera-help-grid">
      <div><strong>1.</strong><span>Run CivicConnect on <b>localhost</b> or HTTPS.</span></div>
      <div><strong>2.</strong><span>Allow camera permission when Chrome asks.</span></div>
      <div><strong>3.</strong><span>Return here and press <b>Capture Now</b>.</span></div>
    </div>
    <button class="btn secondary full" onclick="document.getElementById('photo')?.click();this.closest('.camera-modal-backdrop').remove()">Use existing photo instead</button>
  </div>`;
  document.body.appendChild(modal);
}

function takeCameraPhoto(video,index,close){
  const w=video.videoWidth||1280,h=video.videoHeight||720;
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");ctx.drawImage(video,0,0,w,h);
  const lat=document.getElementById("latitude")?.value||"N/A";
  const lon=document.getElementById("longitude")?.value||"N/A";
  const now=new Date();
  ctx.fillStyle="rgba(88,75,83,.86)";ctx.fillRect(0,h-58,w,58);
  ctx.fillStyle="#fff";ctx.font=Math.max(16,w/70)+"px sans-serif";
  ctx.fillText(`CivicConnect • ${now.toLocaleString()} • ${lat}, ${lon}`,18,h-22);
  evidencePhotos[index]=canvas.toDataURL("image/jpeg",.82);
  evidenceMeta[index]={type:"camera",timestamp:now.toISOString(),latitude:lat,longitude:lon};
  compressedPhoto=evidencePhotos[0]||"";
  renderEvidence();
  if(evidencePhotos.filter(Boolean).length===3)markEvidenceChallenge();
  showToast(`📸 View ${index+1} captured`);
  close();
}

function renderEvidence(){
  document.querySelectorAll(".evidence-tile").forEach((el,i)=>{
    if(evidencePhotos[i]){
      const meta=evidenceMeta[i]||{};
      el.innerHTML=`<img src="${evidencePhotos[i]}" alt="Evidence view ${i+1}">
        <span class="capture-badge">${meta.type==="camera"?"📸 Captured now":"📁 Uploaded"}</span>
        <button type="button" class="evidence-retake" onclick="openCamera(${i})">Retake</button>`;
      el.classList.add("has-evidence");
    }else{
      el.classList.remove("has-evidence");
      el.innerHTML=`<div class="empty-camera">📷<small>View ${i+1}</small></div><button type="button" class="btn secondary capture-btn" data-shot="${i}">Capture Now</button>`;
      el.querySelector(".capture-btn").addEventListener("click",()=>openCamera(i));
    }
  });
}

function compressImage(file,maxSize,quality){
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const scale=Math.min(1,maxSize/Math.max(img.width,img.height));
        const canvas=document.createElement("canvas");
        canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",quality));
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateMapPreview(){}

function submitComplaint(e){
  e.preventDefault();
  const user=currentUser(),id=nextComplaintId();
  const photos=evidencePhotos.filter(Boolean);
  const lat=document.getElementById("latitude").value,lon=document.getElementById("longitude").value;
  const c={
    id,userId:user.id,category:document.getElementById("category").value,
    description:document.getElementById("description").value.trim(),
    location:document.getElementById("manualLocation").value.trim()||"GPS location captured",
    latitude:lat,longitude:lon,photo:compressedPhoto,photos,evidenceMeta,
    status:"Submitted",department:"Unassigned",createdAt:new Date().toISOString(),
    deadline:new Date(Date.now()+48*3600000).toISOString(),resolvedAt:"",resolution:"",
    points:0,trustStatus:"Pending verification",beforePhoto:"",afterPhoto:""
  };
  saveComplaint(c);
  const db=getDB(),x=db.users.find(v=>v.id===user.id);
  x.reportCount=(x.reportCount||0)+1;
  if(x.reportCount%10===0)x.mysteryBoxes=(x.mysteryBoxes||0)+1;
  saveDB(db);
  updateChallengeProgress("report",1);
  addNotification(user.id,`${id} was submitted. Verification pending; points are awarded after validation.`);

  const msg=document.getElementById("submitMessage");
  if(msg)msg.innerHTML=`<div class="submit-success-card"><div class="success-icon">✓</div><div><strong>Complaint Submitted</strong><p>ID <b>${id}</b> · Verification pending</p><small>🛡️ If a report is duplicate, spam or fake, Civic Points and Reputation Score may be deducted.</small></div></div>`;
  const form=document.getElementById("reportForm"); if(form)form.reset();
  compressedPhoto="";evidencePhotos=[null,null,null];evidenceMeta=[null,null,null];renderEvidence();
  const ls=document.getElementById("locationStatus");if(ls){ls.textContent="Not selected";ls.className="pill neutral";}
}

function renderTimeline(status){
  const stages=["Submitted","Verified","Assigned","In Progress","Resolved"],idx=stages.indexOf(status);
  return `<div class="timeline">${stages.map((s,i)=>`<div class="timeline-step ${i<=idx?"done":""}">${i<=idx?"✓":i+1}<span>${s}</span></div>`).join("")}</div>`;
}

function renderCitizenComplaints(){
  const user=currentUser(), list=getComplaintsForUser(user.id), el=document.getElementById("complaintList");
  if(el)el.innerHTML=list.length?list.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(c=>`
    <article class="complaint-card">
      <div class="panel-head"><div><h2>${escapeHTML(c.id)} • ${escapeHTML(c.category)}</h2><small>${formatDate(c.createdAt)}</small></div><span class="pill ${statusClass(c.status)}">${escapeHTML(c.status)}</span></div>
      <p>${escapeHTML(c.description)}</p><div class="complaint-meta"><span>📍 ${escapeHTML(c.location)}</span><span>🏛️ ${escapeHTML(c.department)}</span></div>
      ${c.photo?`<img src="${c.photo}" alt="Evidence">`:""}
      ${renderTimeline(c.status)}
      ${c.resolution?`<div class="demo-box">✅ <strong>Resolution:</strong> ${escapeHTML(c.resolution)}</div>`:""}
      ${c.beforePhoto||c.afterPhoto?`<div class="admin-evidence-grid">${c.beforePhoto?`<figure><img src="${c.beforePhoto}" alt="Before"><figcaption>Before</figcaption></figure>`:""}${c.afterPhoto?`<figure><img src="${c.afterPhoto}" alt="After"><figcaption>After</figcaption></figure>`:""}</div>`:""}
      <small class="muted">SLA deadline: ${formatDate(c.deadline)}</small>
    </article>`).join(""):"<div class='panel'>No complaints yet. Create your first report.</div>";

  renderCommunityVerification();
}

function renderCommunityVerification(){
  const el=document.getElementById("communityVerification"); if(!el)return;
  const me=currentUser(),db=getDB();
  const others=db.complaints.filter(c=>c.userId!==me.id && c.status!=="Resolved").slice(-6).reverse();
  el.innerHTML=others.length?others.map(c=>{
    const verified=(c.verifiedBy||[]).includes(me.id);
    return `<div class="community-report">
      <div><span class="pill info">${escapeHTML(c.category)}</span><h3>${escapeHTML(c.id)} · ${escapeHTML(c.location)}</h3><p>${escapeHTML(c.description)}</p></div>
      ${c.photo?`<img src="${c.photo}" alt="Community evidence">`:""}
      <div class="community-actions"><span>👥 ${(c.verifiedBy||[]).length} verified</span>
      <button class="btn ${verified?"ghost":"primary"}" ${verified?"disabled":""} onclick="verifyCommunityReport('${c.id}')">${verified?"✓ Verified":"Verify Report +35"}</button></div>
    </div>`;
  }).join(""):"<div class='empty-state'>No community reports waiting for verification.</div>";
}

function verifyCommunityReport(id){
  const me=currentUser(),db=getDB(),c=db.complaints.find(x=>x.id===id);
  if(!c||c.userId===me.id)return;
  c.verifiedBy=c.verifiedBy||[];
  if(c.verifiedBy.includes(me.id)){showToast("You already verified this report.");return;}
  c.verifiedBy.push(me.id);
  const u=db.users.find(x=>x.id===me.id);
  u.verifiedCount=(u.verifiedCount||0)+1;
  u.points=(u.points||0)+15;
  u.reputation=Math.min(100,(u.reputation||0)+1);
  saveDB(db);
  updateChallengeProgress("verify",1);
  addNotification(c.userId,`Another citizen verified your report ${c.id}.`);
  showToast("🔎 Report verified! +15 Civic Points");
  renderCommunityVerification();
}
