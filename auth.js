function setupLogin(role,formId,userIdField,passwordField,errorId){
  document.getElementById(formId).addEventListener("submit",e=>{
    e.preventDefault();
    const username=document.getElementById(userIdField).value.trim();
    const password=document.getElementById(passwordField).value;
    const user=getDB().users.find(u=>u.username===username&&u.password===password&&u.role===role);
    if(!user){document.getElementById(errorId).textContent="Invalid demo credentials.";return;}
    setSession({userId:user.id,role:user.role,loginAt:Date.now()});
    location.href=role==="citizen"?"citizen-dashboard.html":"admin-dashboard.html";
  });
}
function requireRole(role){
  const s=getSession();
  if(!s || s.role!==role){location.href=role==="citizen"?"citizen-login.html":"admin-login.html";}
}
function logout(){clearSession(); location.href="index.html";}

// Citizen-only localStorage authentication used by the demo registration flow.
function setupCitizenLogin(formId,userIdField,passwordField,errorId){
  const form=document.getElementById(formId); if(!form)return;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const identifier=document.getElementById(userIdField).value.trim();
    const password=document.getElementById(passwordField).value;
    const error=document.getElementById(errorId);
    const db=getDB();
    const user=db.users.find(u=>u.role==="citizen" && (u.username===identifier || u.email===identifier) && u.password===password);
    if(!user){error.textContent="Invalid email/user ID or password.";form.classList.remove("auth-shake");void form.offsetWidth;form.classList.add("auth-shake");return;}
    error.textContent="";
    setSession({userId:user.id,role:user.role,loginAt:Date.now()});
    const button=form.querySelector(".auth-submit");
    if(button){button.disabled=true;button.querySelector("span").textContent="Opening Citizen Portal...";}
    setTimeout(()=>location.href="citizen-dashboard.html",260);
  });
}

function setupCitizenRegister(formId,errorId,onCreated){
  const form=document.getElementById(formId); if(!form)return;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const error=document.getElementById(errorId);
    const name=document.getElementById("regName").value.trim();
    const email=document.getElementById("regEmail").value.trim().toLowerCase();
    const mobile=document.getElementById("regMobile").value.trim();
    const address=document.getElementById("regAddress").value.trim();
    const password=document.getElementById("regPassword").value;
    const confirm=document.getElementById("regConfirm").value;
    const db=getDB();
    if(password!==confirm){error.textContent="Passwords do not match.";return;}
    if(db.users.some(u=>u.email?.toLowerCase()===email)){error.textContent="An account with this email already exists.";return;}
    let base=(email.split("@")[0]||"citizen").replace(/[^a-z0-9_]/gi,"").toLowerCase()||"citizen";
    let username=base, n=1;
    while(db.users.some(u=>u.username===username)){username=base+(++n);}
    const user={
      id:"u"+Date.now()+Math.floor(Math.random()*1000),username,password,name,email,mobile,address,
      profilePhoto:"",role:"citizen",points:0,badges:[]
    };
    db.users.push(user); saveDB(db);
    form.reset();
    document.getElementById("username").value=email;
    error.textContent="";
    const button=form.querySelector(".auth-submit");
    if(button){button.disabled=true;button.querySelector("span").textContent="Account Created ✓";}
    setTimeout(()=>{
      if(button){button.disabled=false;button.querySelector("span").textContent="Create Account";}
      showToast("Account created successfully ✓");
      if(typeof onCreated==="function")onCreated();
    },650);
  });
}

const VALID_GOV_IDS = ["gov123","gov456","gov789"];
function verifyGovId(inputId,buttonId,statusId){
  const input=document.getElementById(inputId), button=document.getElementById(buttonId), status=document.getElementById(statusId);
  if(!input||!button||!status)return;
  button.addEventListener("click",()=>{
    const value=input.value.trim().toLowerCase();
    button.disabled=true;status.className="gov-status checking";status.textContent="Verifying government ID…";
    setTimeout(()=>{
      const ok=VALID_GOV_IDS.includes(value);
      status.className=`gov-status ${ok?"verified":"not-verified"}`;
      status.textContent=ok?"✓ Government ID verified":"✕ Government ID not verified";
      input.dataset.verified=ok?"true":"false";
      button.disabled=false;
      showGovPopup(ok);
    },850);
  });
}
function showGovPopup(ok){
  const old=document.getElementById("govVerifyPopup");old?.remove();
  const el=document.createElement("div");el.id="govVerifyPopup";el.className="gov-popup-backdrop";
  el.innerHTML=`<div class="gov-popup"><div class="gov-popup-icon">${ok?"✓":"!"}</div><h3>${ok?"Verified successfully":"Verification failed"}</h3><p>${ok?"The provided government ID matches the demo verification registry.":"That government ID is not present in the demo verification registry."}</p><button class="btn primary" type="button">Continue</button></div>`;
  document.body.appendChild(el);el.querySelector("button").onclick=()=>el.remove();
}
function requireVerifiedGovId(inputId,errorId){
  const input=document.getElementById(inputId);
  if(!input||input.dataset.verified!=="true"){document.getElementById(errorId).textContent="Please verify your government ID before continuing.";input?.focus();return false;}
  return true;
}

// Admin localStorage authentication used by the demo registration flow.
function setupAdminLogin(formId,userIdField,passwordField,errorId){
  const form=document.getElementById(formId); if(!form)return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const identifier=document.getElementById(userIdField).value.trim();
    const password=document.getElementById(passwordField).value;
    const error=document.getElementById(errorId);
    const govInput=document.getElementById("adminLoginGovId");
    if(!govInput || !requireVerifiedGovId("adminLoginGovId",errorId)) return;
    const govId=govInput.value.trim().toLowerCase();
    const db=getDB();
    const user=db.users.find(u=>u.role==='admin' && u.govId===govId && (u.username===identifier || u.email===identifier) && u.password===password);
    if(!user){error.textContent='Invalid email/user ID or password.';form.classList.remove('auth-shake');void form.offsetWidth;form.classList.add('auth-shake');return;}
    error.textContent='';
    setSession({userId:user.id,role:user.role,loginAt:Date.now()});
    const button=form.querySelector('.auth-submit');
    if(button){button.disabled=true;button.querySelector('span').textContent='Opening Admin Console...';}
    setTimeout(()=>location.href='admin-dashboard.html',260);
  });
}

function setupAdminRegister(formId,errorId,onCreated){
  const form=document.getElementById(formId); if(!form)return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const error=document.getElementById(errorId);
    const name=document.getElementById('adminRegName').value.trim();
    const email=document.getElementById('adminRegEmail').value.trim().toLowerCase();
    const mobile=document.getElementById('adminRegMobile').value.trim();
    const address=document.getElementById('adminRegAddress').value.trim();
    const password=document.getElementById('adminRegPassword').value;
    const confirm=document.getElementById('adminRegConfirm').value;
    const govId=document.getElementById('adminRegGovId').value.trim().toLowerCase();
    const db=getDB();
    if(!requireVerifiedGovId("adminRegGovId",errorId)) return;
    if(password!==confirm){error.textContent='Passwords do not match.';return;}
    if(db.users.some(u=>u.email?.toLowerCase()===email)){error.textContent='An account with this email already exists.';return;}
    let base=(email.split('@')[0]||'admin').replace(/[^a-z0-9_]/gi,'').toLowerCase()||'admin';
    let username=base,n=1;
    while(db.users.some(u=>u.username===username)){username=base+(++n);}
    const user={id:'a'+Date.now()+Math.floor(Math.random()*1000),username,password,name,email,mobile,address,govId,profilePhoto:'',role:'admin',points:0,badges:[]};
    db.users.push(user);saveDB(db);
    form.reset();
    document.getElementById('adminUsername').value=email;
    error.textContent='';
    const button=form.querySelector('.auth-submit');
    if(button){button.disabled=true;button.querySelector('span').textContent='Account Created ✓';}
    setTimeout(()=>{
      if(button){button.disabled=false;button.querySelector('span').textContent='Create Admin Account';}
      showToast('Admin account created successfully ✓');
      if(typeof onCreated==='function')onCreated();
    },650);
  });
}
