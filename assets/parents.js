/* ============================================================
   Austin Speedrun registration → Supabase register_participant
   Referrals: parents.html?ref=CODE#join (+ optional code field)
   Success shows invite link; COPPA next-step copy by child age.
   ============================================================ */
const REF_STORAGE_KEY = "asrReferralCode";

const studentsEl = document.getElementById("students");
const regForm = document.getElementById("regForm");
const zipInput = document.getElementById("in-zip");
let kidSeq = 0;

function normalizeReferralCode(raw) {
  if (!raw) return "";
  return String(raw).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function getSupabaseClient() {
  const cfg = window.ASR_SUPABASE;
  if (!cfg?.url || !cfg?.anonKey || cfg.url.includes("YOUR_PROJECT_REF")) return null;
  if (!window.supabase?.createClient) return null;
  return window.supabase.createClient(cfg.url, cfg.anonKey);
}

function getReferralCodeFromUrl() {
  try {
    return normalizeReferralCode(new URLSearchParams(window.location.search).get("ref"));
  } catch (_) {
    return "";
  }
}

function loadStoredReferralCode() {
  try {
    return normalizeReferralCode(sessionStorage.getItem(REF_STORAGE_KEY) || "");
  } catch (_) {
    return "";
  }
}

function storeReferralCode(code) {
  try {
    if (code) sessionStorage.setItem(REF_STORAGE_KEY, code);
    else sessionStorage.removeItem(REF_STORAGE_KEY);
  } catch (_) {}
}

function inviteUrlForCode(code) {
  const url = new URL("parents.html", window.location.href);
  url.search = "";
  url.searchParams.set("ref", code);
  url.hash = "join";
  return url.toString();
}

async function resolveReferredByLabel(code) {
  const client = getSupabaseClient();
  if (!client || !code) return code ? `Referred by ${code}` : "";
  try {
    const { data } = await client
      .from("referral_code_public")
      .select("display_name")
      .eq("referral_code", code)
      .maybeSingle();
    if (data?.display_name) return `Referred by ${data.display_name}`;
  } catch (_) {}
  return `Referred by ${code}`;
}

async function applyReferralCode(code) {
  const input = document.getElementById("in-referral");
  const banner = document.getElementById("referredBy");
  const normalized = normalizeReferralCode(code);
  if (input) input.value = normalized;
  if (!banner) return;
  if (!normalized) {
    banner.hidden = true;
    banner.textContent = "";
    return;
  }
  banner.textContent = await resolveReferredByLabel(normalized);
  banner.hidden = false;
}

function kidBlock(n) {
  return `<div class="kid-block" data-k="${n}">
    <div class="kid-head"><span>Child ${n}</span><button type="button" class="rm-kid">Remove</button></div>
    <div class="field kf-name"><label>Child's full legal name</label><input class="k-name" type="text"><span class="err">Enter the child's legal name.</span></div>
    <div class="form-row">
      <div class="field kf-dob"><label>Date of birth</label><input class="k-dob" type="date"><span class="err">Enter a valid date of birth.</span></div>
      <div class="field kf-grade"><label>Grade (2026&#8211;27)</label><select class="k-grade"><option value="">Select&#8230;</option><option>6th</option><option>7th</option><option>8th</option></select><span class="err">Select a grade.</span></div>
    </div>
    <div class="form-row">
      <div class="field kf-school"><label>School name</label><input class="k-school" type="text"><span class="err">Enter the school.</span></div>
      <div class="field kf-stype"><label>School type</label><select class="k-stype"><option value="">Select&#8230;</option><option>Public</option><option>Private</option><option>Charter</option><option>Microschool</option><option>Homeschool</option></select><span class="err">Select a type.</span></div>
    </div>
    <div class="field kf-email"><label>Student's email <span class="opt">(optional, 13+ only)</span></label><input class="k-email" type="email"><span class="err">Student email is for ages 13+ &#8212; or enter a valid address.</span></div>
    <div class="field"><label>Accommodations (IEP/504), if any <span class="opt">(optional)</span></label><input class="k-accom" type="text"></div>
    <label class="ck"><input type="checkbox" class="k-device"><span>We have a device + reliable internet at home</span></label>
  </div>`;
}

function refreshKids() {
  const blocks = studentsEl.querySelectorAll(".kid-block");
  blocks.forEach((b, i) => {
    b.querySelector(".kid-head span").textContent = "Child " + (i + 1);
    const rm = b.querySelector(".rm-kid");
    if (rm) rm.style.display = blocks.length > 1 ? "" : "none";
  });
}

function addKid() {
  kidSeq++;
  studentsEl.insertAdjacentHTML("beforeend", kidBlock(kidSeq));
  refreshKids();
}

studentsEl.addEventListener("click", (e) => {
  const rm = e.target.closest(".rm-kid");
  if (rm) {
    rm.closest(".kid-block").remove();
    refreshKids();
  }
});
document.getElementById("addKid").addEventListener("click", addKid);
addKid();

zipInput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5);
});

const FRIEND_HEARD = "Friend or family";
const referralField = document.getElementById("f-referral");
const referralInput = document.getElementById("in-referral");
const heardSelect = document.getElementById("in-heard");

function setReferralFieldVisible(show) {
  if (!referralField) return;
  referralField.hidden = !show;
  referralField.classList.toggle("is-collapsed", !show);
}

function syncReferralFieldFromHeard() {
  setReferralFieldVisible((heardSelect?.value || "") === FRIEND_HEARD);
}

if (referralInput) {
  referralInput.addEventListener("input", () => {
    const normalized = normalizeReferralCode(referralInput.value);
    if (referralInput.value !== normalized) referralInput.value = normalized;
    storeReferralCode(normalized);
    applyReferralCode(normalized);
  });
}

if (heardSelect) {
  heardSelect.addEventListener("change", syncReferralFieldFromHeard);
  heardSelect.addEventListener("input", syncReferralFieldFromHeard);
}

const urlRef = getReferralCodeFromUrl();
const initialRef = urlRef || loadStoredReferralCode();
if (urlRef) storeReferralCode(urlRef);
// Only auto-select Friend/family when they arrived via a referral link
if (urlRef && heardSelect) {
  heardSelect.value = FRIEND_HEARD;
}
syncReferralFieldFromHeard();
applyReferralCode(initialRef);

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}
function mark(id, bad) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("invalid", !!bad);
}
function markEl(el, bad) {
  if (el) el.classList.toggle("invalid", !!bad);
}
function ageOf(dobStr) {
  const d = new Date(dobStr);
  if (!dobStr || isNaN(d.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
}

function renderSuccess({ first, email, zip, kids, anyUnder13, myCode, creditedRef }) {
  const many = kids.length > 1;
  const body = anyUnder13
    ? `<h3>Almost there, ${escapeHtml(first)}!</h3>
       <p>Because ${many ? "one or more of your children is" : "your child is"} <b>under 13</b>, a parent has to sign the <b>consent forms</b> before they can start. We'll email next steps to <b>${escapeHtml(email)}</b>.</p>
       <p class="ss-note">Any child 13+ can get TimeBack setup at that email too.</p>`
    : `<h3>You're in, ${escapeHtml(first)}!</h3>
       <p>We'll email <b>${escapeHtml(email)}</b> a link to set up your ${many ? "children's" : "child's"} <b>TimeBack</b> account.</p>`;

  const credited = creditedRef ? `<div class="ss-detail">Referral credited</div>` : "";
  let inviteBlock = "";
  if (myCode) {
    const link = inviteUrlForCode(myCode);
    inviteBlock = `
      <div class="invite-box">
        <p class="invite-code">Referral code <span>${escapeHtml(myCode)}</span></p>
        <p class="invite-kicker">Your invite link</p>
        <p class="invite-help">Share this so friends count as your referrals when they sign up.</p>
        <div class="invite-row">
          <input class="invite-url" id="inviteUrl" type="text" readonly value="${escapeHtml(link)}" aria-label="Invite link">
          <button type="button" class="invite-copy" id="copyInvite">Copy</button>
        </div>
      </div>`;
  }

  document.getElementById("formCard").innerHTML = `
    <div class="form-success">
      <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>
      ${body}
      <div class="ss-detail">Registered · ${kids.length} child${many ? "ren" : ""} · ZIP ${escapeHtml(zip)}</div>
      ${credited}
      ${inviteBlock}
    </div>`;

  const copyBtn = document.getElementById("copyInvite");
  const urlInput = document.getElementById("inviteUrl");
  if (copyBtn && urlInput) {
    copyBtn.addEventListener("click", async () => {
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(urlInput.value);
        else {
          urlInput.focus();
          urlInput.select();
          document.execCommand("copy");
        }
        copyBtn.textContent = "Copied";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 2000);
      } catch (_) {
        urlInput.focus();
        urlInput.select();
      }
    });
  }

  document.getElementById("formCard").scrollIntoView({ behavior: "smooth", block: "center" });
}

regForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const hp = document.getElementById("in-company");
  if (hp && hp.value.trim()) return;

  let ok = true;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const zipData = window.ZIP_DATA || null;

  const pname = val("in-pname");
  const phone = val("in-phone");
  const email = val("in-email");
  const street = val("in-street");
  const unit = val("in-unit");
  const city = val("in-city");
  const state = val("in-state");
  const zip = val("in-zip");
  const heard = val("in-heard");
  const sign = val("in-sign");
  const referral_code = normalizeReferralCode(
    document.getElementById("in-referral")?.value || loadStoredReferralCode(),
  );

  const need = (id, good) => {
    mark(id, !good);
    if (!good) ok = false;
  };
  need("f-pname", !!pname);
  need("f-phone", phone.replace(/\D/g, "").length >= 7);
  need("f-email", emailRe.test(email));
  need("f-street", !!street);
  need("f-city", !!city);
  need("f-state", !!state);

  const zip5 = /^\d{5}$/.test(zip);
  const inMetro = zip5 && !!zipData && Object.prototype.hasOwnProperty.call(zipData, zip);
  const zipErr = document.querySelector("#f-zip .err");
  if (!zip5) {
    if (zipErr) zipErr.textContent = "Enter a 5-digit ZIP.";
    mark("f-zip", true);
    ok = false;
  } else if (!inMetro) {
    if (zipErr)
      zipErr.textContent =
        "That ZIP isn't in the 5-county Austin metro (Travis, Williamson, Hays, Bastrop, Caldwell).";
    mark("f-zip", true);
    ok = false;
  } else mark("f-zip", false);

  const kids = [];
  let anyUnder13 = false;
  studentsEl.querySelectorAll(".kid-block").forEach((b) => {
    const name = b.querySelector(".k-name").value.trim();
    const dob = b.querySelector(".k-dob").value;
    const grade = b.querySelector(".k-grade").value;
    const school = b.querySelector(".k-school").value.trim();
    const stype = b.querySelector(".k-stype").value;
    const semail = b.querySelector(".k-email").value.trim();
    const accom = b.querySelector(".k-accom").value.trim();
    const device = b.querySelector(".k-device").checked;
    const age = ageOf(dob);
    const dobBad = age === null || age < 8 || age > 18;
    let emailBad = false;
    if (semail) emailBad = (age !== null && age < 13) || !emailRe.test(semail);
    markEl(b.querySelector(".kf-name"), !name);
    if (!name) ok = false;
    markEl(b.querySelector(".kf-dob"), dobBad);
    if (dobBad) ok = false;
    markEl(b.querySelector(".kf-grade"), !grade);
    if (!grade) ok = false;
    markEl(b.querySelector(".kf-school"), !school);
    if (!school) ok = false;
    markEl(b.querySelector(".kf-stype"), !stype);
    if (!stype) ok = false;
    markEl(b.querySelector(".kf-email"), emailBad);
    if (emailBad) ok = false;
    if (age !== null && age < 13) anyUnder13 = true;
    kids.push({
      full_name: name,
      date_of_birth: dob,
      age,
      grade,
      school_name: school,
      school_type: stype,
      student_email: semail,
      accommodations: accom,
      has_home_device: device,
    });
  });

  const ckR = document.getElementById("ck-rules");
  const ckE = document.getElementById("ck-res");
  const ckP = document.getElementById("ck-priv");
  ckR.closest(".ck").classList.toggle("invalid", !ckR.checked);
  ckE.closest(".ck").classList.toggle("invalid", !ckE.checked);
  ckP.closest(".ck").classList.toggle("invalid", !ckP.checked);
  if (!(ckR.checked && ckE.checked && ckP.checked)) ok = false;
  need("f-sign", sign.length > 1);

  if (!ok) return;

  const btn = regForm.querySelector(".form-submit");
  const errBox = document.getElementById("form-error");
  if (errBox) {
    errBox.style.display = "none";
    errBox.textContent = "Hmm, that didn't send. Please check your connection and try again.";
  }
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Registering…";

  const client = getSupabaseClient();
  if (!client) {
    btn.disabled = false;
    btn.textContent = label;
    if (errBox) {
      errBox.textContent =
        "Registration isn't connected yet. Add assets/supabase-config.js (see supabase-config.example.js).";
      errBox.style.display = "block";
    }
    return;
  }

  let result = null;
  let errMsg = "";
  try {
    const { data, error } = await client.rpc("register_participant", {
      p_parent_name: pname,
      p_email: email,
      p_phone: phone,
      p_street: street,
      p_unit: unit,
      p_city: city,
      p_state: state,
      p_zip: zip,
      p_heard_about: heard || null,
      p_signed_by: sign,
      p_children: kids.map((k) => ({
        full_name: k.full_name,
        date_of_birth: k.date_of_birth,
        grade: k.grade,
        school_name: k.school_name,
        school_type: k.school_type,
        student_email: k.student_email || null,
        accommodations: k.accommodations || null,
        has_home_device: !!k.has_home_device,
      })),
      p_referral_code: referral_code || null,
    });
    if (error) throw error;
    if (!data) throw new Error("No response from registration");
    result = typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    errMsg = err?.message || err?.error_description || String(err || "");
    console.error("Registration failed:", err);
  }

  btn.disabled = false;
  btn.textContent = label;
  if (!result) {
    if (errBox) {
      const needsPatch =
        /register_participant|schema cache|does not exist|PGRST202/i.test(errMsg);
      errBox.textContent = needsPatch
        ? "Registration database function is missing. In Supabase SQL Editor, run patch-register-full.sql, then try again."
        : errMsg
          ? `Hmm, that didn't send: ${errMsg}`
          : "Hmm, that didn't send. Please check your connection and try again.";
      errBox.style.display = "block";
    }
    return;
  }

  renderSuccess({
    first: pname.split(" ")[0] || pname,
    email,
    zip,
    kids,
    anyUnder13: !!result.coppa_required || anyUnder13,
    myCode: normalizeReferralCode(result.referral_code),
    creditedRef: referral_code,
  });
});
