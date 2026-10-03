const SUPPORT_RECIPIENTS = ["civicconnect@help.in", "civicconnect@support.in"];

function setupSupport(){
  const host=document.getElementById("supportContainer");
  if(!host || host.dataset.ready==="1") return;
  host.dataset.ready="1";
  host.innerHTML=`
    <div class="support-home-card">
      <div class="support-home-copy">
        <span class="eyebrow">CIVICCONNECT SUPPORT</span>
        <h2>Need help with CivicConnect?</h2>
        <p>Contact the CivicConnect website handlers directly for technical issues, account help, complaints, maps, or anything else.</p>
        <div class="support-home-emails"><span>✉</span><span>civicconnect@help.in</span><span>•</span><span>civicconnect@support.in</span></div>
      </div>
      <button class="btn primary support-open-btn" id="supportOpenBtn" type="button">Contact Support →</button>
    </div>
    <div class="support-modal" id="supportWidget" hidden aria-hidden="true">
      <div class="support-backdrop" data-support-close></div>
      <section class="support-card" role="dialog" aria-modal="true" aria-labelledby="supportTitle">
        <button class="support-close" type="button" data-support-close aria-label="Close support">×</button>
        <div class="support-icon">✉️</div>
        <span class="eyebrow">CIVICCONNECT SUPPORT</span>
        <h2 id="supportTitle">How can we help?</h2>
        <p class="muted">Send a message directly to the CivicConnect website handlers.</p>
        <div class="support-recipient"><span>Support handlers</span><strong>civicconnect@help.in</strong><strong>civicconnect@support.in</strong></div>
        <form id="supportForm" class="support-form">
          <label>Topic<select id="supportTopic"><option>Technical issue</option><option>Complaint help</option><option>Account / login</option><option>Location / map</option><option>Other</option></select></label>
          <label>Message<textarea id="supportMessage" rows="4" required placeholder="Tell us what you need help with..."></textarea></label>
          <button class="btn primary full" type="submit">✉ Send to CivicConnect Support</button>
          <small class="muted">Your device's configured mail application will open with both support addresses.</small>
        </form>
      </section>
    </div>`;

  const modal=document.getElementById("supportWidget");
  const message=document.getElementById("supportMessage");
  const setOpen=(open)=>{
    modal.hidden=!open;
    modal.setAttribute("aria-hidden",String(!open));
    document.body.classList.toggle("support-open",open);
    if(open) setTimeout(()=>message.focus(),0);
  };
  const close=()=>setOpen(false);

  document.getElementById("supportOpenBtn").addEventListener("click",()=>setOpen(true));
  modal.querySelectorAll("[data-support-close]").forEach(el=>el.addEventListener("click",close));
  document.addEventListener("keydown",e=>{if(e.key==="Escape" && !modal.hidden) close();});
  document.getElementById("supportForm").addEventListener("submit",e=>{
    e.preventDefault();
    const topic=document.getElementById("supportTopic").value;
    const text=message.value.trim();
    if(!text) return;
    const user=typeof currentUser==="function"?currentUser():null;
    const context=user?`\n\nName: ${user.name||""}\nEmail: ${user.email||""}\nRole: ${user.role||""}`:"";
    const subject=encodeURIComponent(`CivicConnect Support — ${topic}`);
    const body=encodeURIComponent(`${text}${context}\n\nSent from CivicConnect.`);
    window.location.href=`mailto:${SUPPORT_RECIPIENTS.join(",")}?subject=${subject}&body=${body}`;
    message.value="";
    close();
  });
}

document.addEventListener("DOMContentLoaded",setupSupport);
