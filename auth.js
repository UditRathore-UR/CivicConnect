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
