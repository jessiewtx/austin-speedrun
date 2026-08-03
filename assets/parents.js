/* ============================================================
   WAITLIST — writes to Supabase (Austin Speedrun Tracker DB).
   Requires assets/supabase-config.js (from supabase-config.example.js).
   Referrals are NOT applied on the waitlist — only on the future signup form.
   ============================================================ */

function getSupabaseClient() {
  const cfg = window.ASR_SUPABASE;
  if (!cfg?.url || !cfg?.anonKey || cfg.url.includes("YOUR_PROJECT_REF")) return null;
  if (!window.supabase?.createClient) return null;
  return window.supabase.createClient(cfg.url, cfg.anonKey);
}

const zipIn = document.getElementById("in-zip");
zipIn.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5);
});

const form = document.getElementById("waitForm");
function setErr(id, bad) {
  document.getElementById(id).classList.toggle("invalid", bad);
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const hp = document.getElementById("in-company");
  if (hp && hp.value.trim()) return;

  const first = document.getElementById("in-first").value.trim();
  const last = document.getElementById("in-last").value.trim();
  const name = `${first} ${last}`.trim();
  const email = document.getElementById("in-email").value.trim();
  const zip = document.getElementById("in-zip").value.trim();
  const grade = document.getElementById("in-grade").value;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const zip5 = /^\d{5}$/.test(zip);
  const zipData = window.ZIP_DATA || null;
  const inMetro = zip5 && !!zipData && Object.prototype.hasOwnProperty.call(zipData, zip);
  const zipErr = document.querySelector("#f-zip .err");
  let ok = true;
  if (!first) {
    setErr("f-first", true);
    ok = false;
  } else setErr("f-first", false);
  if (!last) {
    setErr("f-last", true);
    ok = false;
  } else setErr("f-last", false);
  if (!emailOk) {
    setErr("f-email", true);
    ok = false;
  } else setErr("f-email", false);
  if (!zip5) {
    if (zipErr) zipErr.textContent = "Enter a 5-digit ZIP.";
    setErr("f-zip", true);
    ok = false;
  } else if (!inMetro) {
    if (zipErr)
      zipErr.textContent =
        "That ZIP isn't in the 5-county Austin metro (Travis, Williamson, Hays, Bastrop, Caldwell).";
    setErr("f-zip", true);
    ok = false;
  } else setErr("f-zip", false);
  if (!grade) {
    setErr("f-grade", true);
    ok = false;
  } else setErr("f-grade", false);
  if (!ok) return;

  const btn = form.querySelector(".form-submit");
  const errBox = document.getElementById("form-error");
  if (errBox) {
    errBox.style.display = "none";
    errBox.textContent = "Hmm, that didn't send. Please check your connection and try again.";
  }
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Adding you…";

  const client = getSupabaseClient();
  if (!client) {
    btn.disabled = false;
    btn.textContent = label;
    if (errBox) {
      errBox.textContent =
        "Waitlist isn't connected yet. Add assets/supabase-config.js (see supabase-config.example.js).";
      errBox.style.display = "block";
    }
    return;
  }

  try {
    const arr = JSON.parse(localStorage.getItem("asrWaitlist") || "[]");
    arr.push({ name, email, zip, grade, ts: Date.now() });
    localStorage.setItem("asrWaitlist", JSON.stringify(arr));
  } catch (_) {}

  let saved = false;
  try {
    // Waitlist only — never pass a referral code (referrals are signup-only).
    const { error } = await client.rpc("waitlist_participant", {
      p_parent_name: name,
      p_email: email,
      p_zip: zip,
      p_grade: grade,
    });
    if (error) throw error;
    saved = true;
  } catch (_) {
    saved = false;
  }

  btn.disabled = false;
  btn.textContent = label;

  if (!saved) {
    if (errBox) errBox.style.display = "block";
    return;
  }

  document.getElementById("formCard").innerHTML = `
    <div class="form-success">
      <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h3>You're on the list, ${first}!</h3>
      <p>We'll email you when registration opens for <b>${zip}</b> at <b>${email}</b>. Watch for details on how to unlock more prizes for your zip.</p>
      <div class="ss-detail">Waitlisted · ${zip} · ${grade}</div>
    </div>`;
  document.getElementById("formCard").scrollIntoView({ behavior: "smooth", block: "center" });
});
