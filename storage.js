const DB_KEY = "civicconnect_db_v1";
const SESSION_KEY = "civicconnect_session_v1";

const DEMO_USERS = [
  {id:"u1", username:"citizen01", password:"citizen123", name:"Udit", email:"citizen@civicconnect.demo", mobile:"+91 98765 43210", address:"Ratibad, Bhopal, Madhya Pradesh", profilePhoto:"", role:"citizen", points:120, badges:["First Reporter","Civic Watcher"]},
  {id:"u2", username:"rahul", password:"rahul123", name:"Rahul", email:"rahul@demo.local", mobile:"+91 90000 11111", address:"Kolar, Bhopal", profilePhoto:"", role:"citizen", points:95, badges:["First Reporter"]},
  {id:"u3", username:"aman", password:"aman123", name:"Aman", email:"aman@demo.local", mobile:"+91 90000 22222", address:"MP Nagar, Bhopal", profilePhoto:"", role:"citizen", points:80, badges:["Community Helper"]},
  {id:"a1", username:"admin", password:"admin123", name:"Municipal Admin", email:"admin@civicconnect.demo", mobile:"+91 755 400 1000", address:"Municipal Corporation Office, Bhopal", profilePhoto:"", role:"admin", points:0, badges:[]}
];

function makeComplaint(id, userId, category, description, location, status, hoursAgo, photo=""){
  const now = Date.now() - hoursAgo*3600000;
  const slaHours = 48;
  return {
    id,userId,category,description,location,
    latitude:"",longitude:"",
    photo,status,
    department: status==="Submitted" ? "Unassigned" : "Road Maintenance",
    createdAt:new Date(now).toISOString(),
    deadline:new Date(now + slaHours*3600000).toISOString(),
    resolvedAt:status==="Resolved" ? new Date(now+18*3600000).toISOString() : "",
    resolution:status==="Resolved" ? "Issue inspected and marked resolved by the municipal team." : "",
    points: status==="Resolved" ? 20 : 10
  };
}

function seedDB(){
  if(localStorage.getItem(DB_KEY)) return;
  const complaints=[
    makeComplaint("CIV001","u1","Pothole","Large pothole causing difficulty for two-wheelers.","Ratibad Road, Bhopal","In Progress",30),
    makeComplaint("CIV002","u1","Garbage / Sanitation","Garbage overflowing near the community bin.","Kolar Road, Bhopal","Resolved",70),
    makeComplaint("CIV003","u1","Broken Streetlight","Streetlight is not working after sunset.","MP Nagar, Bhopal","Submitted",3),
    makeComplaint("CIV004","u1","Water Leakage","Water is leaking continuously from a roadside pipe.","Shahpura, Bhopal","Verified",16),
    makeComplaint("CIV005","u1","Stray Animal","Stray animal concern near the public park.","Ayodhya Bypass, Bhopal","Assigned",25),
    makeComplaint("CIV006","u1","Damaged Public Infrastructure","Footpath tiles are broken and uneven.","Arera Colony, Bhopal","Resolved",90)
  ];
  const db={users:DEMO_USERS,complaints,notifications:[
    {id:"n1",userId:"u1",text:"CIV002 was marked Resolved.",createdAt:new Date().toISOString(),read:false},
    {id:"n2",userId:"u1",text:"CIV004 was verified by the authority.",createdAt:new Date().toISOString(),read:false}
  ]};
  localStorage.setItem(DB_KEY,JSON.stringify(db));
}

function getDB(){seedDB(); return JSON.parse(localStorage.getItem(DB_KEY));}
function saveDB(db){localStorage.setItem(DB_KEY,JSON.stringify(db));}
function getSession(){return JSON.parse(localStorage.getItem(SESSION_KEY)||"null");}
function setSession(session){localStorage.setItem(SESSION_KEY,JSON.stringify(session));}
function clearSession(){localStorage.removeItem(SESSION_KEY);}
function currentUser(){const s=getSession(); if(!s)return null; return getDB().users.find(u=>u.id===s.userId)||null;}
function saveComplaint(c){const db=getDB(); db.complaints.push(c); saveDB(db); return c;}
function updateComplaint(id, patch){const db=getDB(); const i=db.complaints.findIndex(c=>c.id===id); if(i<0)return null; db.complaints[i]={...db.complaints[i],...patch}; saveDB(db); return db.complaints[i];}
function addNotification(userId,text){const db=getDB(); db.notifications.unshift({id:"n"+Date.now(),userId,text,createdAt:new Date().toISOString(),read:false}); saveDB(db);}
function getComplaintsForUser(userId){return getDB().complaints.filter(c=>c.userId===userId);}
function nextComplaintId(){const nums=getDB().complaints.map(c=>parseInt(c.id.replace("CIV",""),10)||0); return "CIV"+String(Math.max(0,...nums)+1).padStart(3,"0");}
seedDB();