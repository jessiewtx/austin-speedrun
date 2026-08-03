/* ============================================================
   SIGNUP — Supabase register_participant
   Referral links: signup.html?ref=CODE
   After signup, show the family's invite link + code to share.
   ============================================================ */
const REF_STORAGE_KEY = "asrReferralCode";

function normalizeReferralCode(raw) {
  if (!raw) return "";
  return String(raw).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function inviteUrlForCode(code) {
  const url = new URL("signup.html", window.location.href);
  url.search = "";
  url.searchParams.set("ref", code);
  return url.toString();
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

function getSupabaseClient() {
  const cfg = window.ASR_SUPABASE;
  if (!cfg?.url || !cfg?.anonKey || cfg.url.includes("YOUR_PROJECT_REF")) return null;
  if (!window.supabase?.createClient) return null;
  return window.supabase.createClient(cfg.url, cfg.anonKey);
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
  if (!input || !banner) return;
  const normalized = normalizeReferralCode(code);
  input.value = normalized;
  if (!normalized) {
    banner.hidden = true;
    banner.textContent = "";
    return;
  }
  banner.textContent = await resolveReferredByLabel(normalized);
  banner.hidden = false;
}

function renderSignupSuccess({ first, email, zip, children, creditedRef, myCode }) {
  const card = document.getElementById("formCard");
  const credited = creditedRef
    ? `<div class="ss-detail">Referral credited</div>`
    : "";
  const kidsLine = children
    .map((c) => `${escapeHtml(c.first_name)} · ${escapeHtml(c.grade)}`)
    .join(" · ");

  let inviteBlock = "";
  if (myCode) {
    const link = inviteUrlForCode(myCode);
    inviteBlock = `
      <div class="invite-box">
        <p class="invite-kicker">Your invite link</p>
        <p class="invite-help">Share this so friends count as your referrals when they sign up.</p>
        <p class="invite-code" id="inviteCode">${escapeHtml(myCode)}</p>
        <div class="invite-row">
          <input class="invite-url" id="inviteUrl" type="text" readonly value="${escapeHtml(link)}" aria-label="Invite link">
          <button type="button" class="invite-copy" id="copyInvite">Copy</button>
        </div>
        <p class="invite-copied" id="inviteCopied" hidden>Copied — ready to share.</p>
      </div>`;
  }

  card.innerHTML = `
    <div class="form-success">
      <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h3>You're signed up, ${escapeHtml(first)}!</h3>
      <p>You're registered for Austin Speedrun in <b>${escapeHtml(zip)}</b>. We'll email next steps to <b>${escapeHtml(email)}</b>.</p>
      <div class="ss-detail">Registered · ${kidsLine} · ${escapeHtml(zip)}</div>
      ${credited}
      ${inviteBlock}
    </div>`;

  const copyBtn = document.getElementById("copyInvite");
  const urlInput = document.getElementById("inviteUrl");
  const copied = document.getElementById("inviteCopied");
  if (copyBtn && urlInput) {
    copyBtn.addEventListener("click", async () => {
      const text = urlInput.value;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else {
          urlInput.focus();
          urlInput.select();
          document.execCommand("copy");
        }
        copyBtn.textContent = "Copied";
        if (copied) copied.hidden = false;
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 2000);
      } catch (_) {
        urlInput.focus();
        urlInput.select();
        if (copied) {
          copied.hidden = false;
          copied.textContent = "Select the link and copy it.";
        }
      }
    });
  }

  card.scrollIntoView({ behavior: "smooth", block: "center" });
}

const referralInput = document.getElementById("in-referral");
referralInput.addEventListener("input", () => {
  const normalized = normalizeReferralCode(referralInput.value);
  if (referralInput.value !== normalized) referralInput.value = normalized;
  storeReferralCode(normalized);
  applyReferralCode(normalized);
});

const urlRef = getReferralCodeFromUrl();
if (urlRef) storeReferralCode(urlRef);
applyReferralCode(urlRef || loadStoredReferralCode());

const GRADE_OPTIONS = ["6th grade", "7th grade", "8th grade"];
const MAX_KIDS = 5;
let kidSeq = 1;

const kidsList = document.getElementById("kidsList");
const addChildBtn = document.getElementById("addChild");

function syncRemoveButtons() {
  const rows = kidsList.querySelectorAll(".kid-row");
  rows.forEach((row) => {
    const btn = row.querySelector(".btn-remove-child");
    if (btn) btn.hidden = rows.length <= 1;
  });
  if (addChildBtn) addChildBtn.hidden = rows.length >= MAX_KIDS;
}

function makeKidRow(index) {
  const row = document.createElement("div");
  row.className = "kid-row";
  row.dataset.kid = String(index);
  const gradeOpts = GRADE_OPTIONS.map((g) => `<option>${g}</option>`).join("");
  row.innerHTML = `
    <div class="form-row">
      <div class="field">
        <label for="in-child-first-${index}">First name</label>
        <input id="in-child-first-${index}" class="kid-first" type="text" autocomplete="off" placeholder="First name">
        <span class="err">Enter a first name.</span>
      </div>
      <div class="field kid-grade-field">
        <label for="in-grade-${index}">Grade (2026–27)</label>
        <div class="kid-grade-wrap">
          <select id="in-grade-${index}" class="kid-grade">
            <option value="">Select…</option>
            ${gradeOpts}
          </select>
          <button type="button" class="btn-remove-child" aria-label="Remove child">×</button>
        </div>
        <span class="err">Select a grade.</span>
      </div>
    </div>`;
  row.querySelector(".btn-remove-child").addEventListener("click", () => {
    row.remove();
    syncRemoveButtons();
  });
  return row;
}

addChildBtn.addEventListener("click", () => {
  if (kidsList.querySelectorAll(".kid-row").length >= MAX_KIDS) return;
  kidsList.appendChild(makeKidRow(kidSeq++));
  syncRemoveButtons();
  const newest = kidsList.querySelector(".kid-row:last-child .kid-first");
  if (newest) newest.focus();
});

kidsList.querySelector(".btn-remove-child")?.addEventListener("click", (e) => {
  const row = e.currentTarget.closest(".kid-row");
  if (row && kidsList.querySelectorAll(".kid-row").length > 1) {
    row.remove();
    syncRemoveButtons();
  }
});
syncRemoveButtons();

const zipIn = document.getElementById("in-zip");
zipIn.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5);
});

const form = document.getElementById("signupForm");
function setErr(id, bad) {
  document.getElementById(id).classList.toggle("invalid", bad);
}

function collectChildren() {
  return [...kidsList.querySelectorAll(".kid-row")].map((row) => ({
    first_name: row.querySelector(".kid-first")?.value.trim() || "",
    grade: row.querySelector(".kid-grade")?.value || "",
    row,
  }));
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const hp = document.getElementById("in-company");
  if (hp && hp.value.trim()) return;

  const first = document.getElementById("in-first").value.trim();
  const last = document.getElementById("in-last").value.trim();
  const email = document.getElementById("in-email").value.trim();
  const zip = document.getElementById("in-zip").value.trim();
  const childrenRaw = collectChildren();
  const referral_code = normalizeReferralCode(
    document.getElementById("in-referral")?.value || loadStoredReferralCode(),
  );

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const zip5 = /^\d{5}$/.test(zip);
  const zipData = window.ZIP_DATA || null;
  const inMetro = zip5 && !!zipData && Object.prototype.hasOwnProperty.call(zipData, zip);
  const zipErr = document.querySelector("#f-zip .err");

  let ok = true;
  if (!first) { setErr("f-first", true); ok = false; } else setErr("f-first", false);
  if (!last) { setErr("f-last", true); ok = false; } else setErr("f-last", false);
  if (!emailOk) { setErr("f-email", true); ok = false; } else setErr("f-email", false);
  if (!zip5) {
    if (zipErr) zipErr.textContent = "Enter a 5-digit ZIP.";
    setErr("f-zip", true); ok = false;
  } else if (!inMetro) {
    if (zipErr)
      zipErr.textContent =
        "That ZIP isn't in the 5-county Austin metro (Travis, Williamson, Hays, Bastrop, Caldwell).";
    setErr("f-zip", true); ok = false;
  } else setErr("f-zip", false);

  childrenRaw.forEach((c) => {
    const nameField = c.row.querySelector(".kid-first")?.closest(".field");
    const gradeField = c.row.querySelector(".kid-grade")?.closest(".field");
    const nameBad = !c.first_name;
    const gradeBad = !c.grade;
    if (nameField) nameField.classList.toggle("invalid", nameBad);
    if (gradeField) gradeField.classList.toggle("invalid", gradeBad);
    if (nameBad || gradeBad) ok = false;
  });
  if (!ok) return;

  const children = childrenRaw.map(({ first_name, grade }) => ({ first_name, grade }));

  const btn = form.querySelector(".form-submit");
  const errBox = document.getElementById("form-error");
  if (errBox) {
    errBox.style.display = "none";
    errBox.textContent = "Hmm, that didn't send. Please check your connection and try again.";
  }
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Signing you up…";

  const client = getSupabaseClient();
  if (!client) {
    btn.disabled = false;
    btn.textContent = label;
    if (errBox) {
      errBox.textContent =
        "Signup isn't connected yet. Add assets/supabase-config.js (see supabase-config.example.js).";
      errBox.style.display = "block";
    }
    return;
  }

  let result = null;
  let errMsg = "";
  try {
    const { data, error } = await client.rpc("register_participant", {
      p_parent_first_name: first,
      p_parent_last_name: last,
      p_email: email,
      p_zip: zip,
      p_children: children,
      p_referral_code: referral_code || null,
    });
    if (error) throw error;
    if (!data) throw new Error("No response from signup");
    result = typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    errMsg = err?.message || err?.error_description || String(err || "");
    console.error("Signup failed:", err);
  }

  btn.disabled = false;
  btn.textContent = label;
  if (!result) {
    if (errBox) {
      const needsPatch =
        /register_participant|schema cache|does not exist|PGRST202/i.test(errMsg);
      errBox.textContent = needsPatch
        ? "Signup database function is missing. In Supabase SQL Editor, run patch-signup-children.sql, then try again."
        : errMsg
          ? `Hmm, that didn't send: ${errMsg}`
          : "Hmm, that didn't send. Please check your connection and try again.";
      errBox.style.display = "block";
    }
    return;
  }

  renderSignupSuccess({
    first,
    email,
    zip,
    children,
    creditedRef: referral_code,
    myCode: normalizeReferralCode(result.referral_code),
  });
});
