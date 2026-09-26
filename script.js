/* =========================================================
   Rock Media — site behaviour
   ========================================================= */

/*
  FORM DELIVERY
  Paste a form endpoint here (e.g. a free Formspree form: https://formspree.io/f/xxxxxxx)
  and every form on the site will submit straight to your inbox.
  Left empty, forms still validate and then hand the finished message off
  to Instagram DM / Discord, with the text copied to the clipboard.
*/
const FORM_ENDPOINT = "";

const INSTAGRAM_DM = "https://ig.me/m/rockmedia.co";
const DISCORD_HANDLE = "rockmedia.co";

document.documentElement.classList.add("js");

/* ---------- Toast ---------- */
const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
toast.setAttribute("aria-live", "polite");
document.body.appendChild(toast);
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-secure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

/* ---------- Header ---------- */
const header = document.querySelector(".site-header");
const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
function setNav(open) {
  document.body.classList.toggle("nav-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.querySelector(".nav-toggle-label").textContent = open ? "Close" : "Menu";
  if (open) {
    const bottom = header.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty("--header-offset", `${Math.max(bottom, 0)}px`);
  }
}
if (navToggle && nav) {
  navToggle.addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 960) setNav(false); });
}

// Mark current page in nav
const page = document.body.dataset.page;
document.querySelectorAll(`[data-nav="${page}"]`).forEach((a) => a.setAttribute("aria-current", "page"));

/* ---------- Copy buttons (Discord etc.) ---------- */
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const ok = await copyText(btn.dataset.copy);
    showToast(ok ? `Copied “${btn.dataset.copy}” — add us on Discord` : `Discord: ${btn.dataset.copy}`);
  });
});

/* ---------- Year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Reveal on scroll ---------- */
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in"));
}

/* ---------- Prefill from URL (?plan=growth&type=brand) ---------- */
const params = new URLSearchParams(location.search);
function prefill(name, value) {
  if (!value) return;
  document.querySelectorAll(`[name="${name}"]`).forEach((el) => {
    if (el.tagName === "SELECT") {
      const opt = [...el.options].find((o) => o.value.toLowerCase() === value.toLowerCase());
      if (opt) el.value = opt.value;
    } else if (el.type === "radio" || el.type === "checkbox") {
      if (el.value.toLowerCase() === value.toLowerCase()) el.checked = true;
    }
  });
}
prefill("plan", params.get("plan"));
prefill("enquiry", params.get("type"));

/* ---------- Forms ---------- */
const storage = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  remove(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fieldWrap(el) { return el.closest(".field"); }

function setError(el, msg) {
  const wrap = fieldWrap(el);
  if (!wrap) return;
  wrap.classList.toggle("invalid", !!msg);
  let err = wrap.querySelector(".field-error");
  if (!err) {
    err = document.createElement("p");
    err.className = "field-error";
    err.id = `${el.name || el.id}-error`;
    wrap.appendChild(err);
  }
  err.textContent = msg || "";
  wrap.querySelectorAll("input, select, textarea").forEach((c) => {
    if (msg) { c.setAttribute("aria-invalid", "true"); c.setAttribute("aria-describedby", err.id); }
    else { c.removeAttribute("aria-invalid"); }
  });
}

function validateField(el) {
  if (el.type === "radio" || el.type === "checkbox") {
    if (!el.required) return true;
    const group = el.form.querySelectorAll(`[name="${el.name}"]`);
    const ok = [...group].some((g) => g.checked);
    setError(el, ok ? "" : el.dataset.msg || "Please choose an option.");
    return ok;
  }
  const v = el.value.trim();
  let msg = "";
  if (el.required && !v) msg = el.dataset.msg || "This field is required.";
  else if (v && el.type === "email" && !EMAIL_RE.test(v)) msg = "Please enter a valid email address.";
  else if (v && el.type === "url" && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/i.test(v)) msg = "Please enter a valid link.";
  else if (v && el.minLength > 0 && v.length < el.minLength) msg = `Please write at least ${el.minLength} characters.`;
  setError(el, msg);
  return !msg;
}

function labelFor(el) {
  const fs = el.closest(".field");
  const l = fs && fs.querySelector(":scope > label, :scope > .label");
  return l ? l.childNodes[0].textContent.trim() : el.name;
}

function buildSummary(form) {
  const title = form.dataset.title || "Website enquiry";
  const lines = [`${title} — rockmedia website`, ""];
  const seen = new Set();
  form.querySelectorAll("input, select, textarea").forEach((el) => {
    if (!el.name || seen.has(el.name) || el.closest(".hp") || el.type === "submit" || el.type === "hidden") return;
    let value;
    if (el.type === "radio" || el.type === "checkbox") {
      const group = [...form.querySelectorAll(`[name="${el.name}"]`)];
      seen.add(el.name);
      if (el.name === "consent") return;
      value = group.filter((g) => g.checked).map((g) => g.dataset.label || g.value).join(", ");
    } else {
      seen.add(el.name);
      value = el.tagName === "SELECT" && el.selectedIndex > -1 && el.value ? el.options[el.selectedIndex].text : el.value.trim();
    }
    if (value) lines.push(`${labelFor(el)}: ${value}`);
  });
  return lines.join("\n");
}

function formData(form) {
  const data = {};
  new FormData(form).forEach((v, k) => {
    if (k === "_gotcha") return;
    data[k] = data[k] ? `${data[k]}, ${v}` : v;
  });
  data._subject = `${form.dataset.title || "Website enquiry"} — ${data.name || data.full_name || data.brand || ""}`.trim();
  return data;
}

function renderSuccess(form, summary, sent) {
  const box = form.parentElement.querySelector(".form-success");
  if (!box) return;
  box.querySelector("[data-success-title]").textContent = sent ? "Thank you — it’s with us." : "Almost there.";
  box.querySelector("[data-success-body]").textContent = sent
    ? "We’ve received your message and will get back to you soon. You can also reach us directly on Instagram."
    : "Your message is ready. Send it to us on Instagram (or Discord) and we’ll get back to you.";
  const handoff = box.querySelector("[data-handoff]");
  handoff.hidden = sent;
  box.querySelector(".summary").textContent = summary;

  box.querySelector("[data-send-ig]").onclick = async (e) => {
    e.preventDefault();
    const ok = await copyText(summary);
    showToast(ok ? "Message copied — paste it into the DM" : "Couldn’t copy — select the text above");
    window.open(INSTAGRAM_DM, "_blank", "noopener");
  };
  box.querySelector("[data-send-discord]").onclick = async () => {
    const ok = await copyText(summary);
    await new Promise((r) => setTimeout(r, 50));
    showToast(ok ? `Message copied — DM ${DISCORD_HANDLE} on Discord` : `Discord: ${DISCORD_HANDLE}`);
  };
  box.querySelector("[data-reset]").onclick = () => {
    form.reset();
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("invalid"));
    form.querySelectorAll(".field-error").forEach((f) => (f.textContent = ""));
    box.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  form.hidden = true;
  box.hidden = false;
  const top = box.getBoundingClientRect().top + window.scrollY - 110;
  window.scrollTo({ top, behavior: "smooth" });
  box.querySelector("h3").focus({ preventScroll: true });
}

document.querySelectorAll("form[data-form]").forEach((form) => {
  const key = `rm-draft-${form.dataset.form}`;
  const fields = () => form.querySelectorAll("input:not([type=hidden]), select, textarea");

  // Restore draft (URL params take priority)
  const draft = storage.get(key);
  if (draft) {
    fields().forEach((el) => {
      if (!(el.name in draft) || el.closest(".hp")) return;
      if (params.has(el.name) || (el.name === "enquiry" && params.has("type"))) return;
      if (el.type === "radio" || el.type === "checkbox") el.checked = [].concat(draft[el.name]).includes(el.value);
      else el.value = draft[el.name];
    });
  }

  const saveDraft = () => {
    const d = {};
    fields().forEach((el) => {
      if (!el.name || el.closest(".hp")) return;
      if (el.type === "radio" || el.type === "checkbox") { if (el.checked) d[el.name] = [].concat(d[el.name] || [], el.value); }
      else d[el.name] = el.value;
    });
    storage.set(key, d);
  };

  form.addEventListener("input", saveDraft);
  form.addEventListener("change", (e) => {
    saveDraft();
    if (fieldWrap(e.target)?.classList.contains("invalid")) validateField(e.target);
  });
  form.addEventListener("focusout", (e) => {
    const el = e.target;
    if (el.matches("input:not([type=radio]):not([type=checkbox]), select, textarea") && el.value) validateField(el);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = form.querySelector(".form-status");
    status.textContent = "";

    let firstBad = null;
    const checked = new Set();
    fields().forEach((el) => {
      if (el.closest(".hp")) return;
      if ((el.type === "radio" || el.type === "checkbox") && checked.has(el.name)) return;
      checked.add(el.name);
      if (!validateField(el) && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = "Please check the highlighted fields.";
      firstBad.focus();
      return;
    }

    // Honeypot — silently drop bots
    const hp = form.querySelector(".hp input");
    if (hp && hp.value) return;

    const summary = buildSummary(form);
    const submit = form.querySelector("[type=submit]");

    if (!FORM_ENDPOINT) {
      storage.remove(key);
      renderSuccess(form, summary, false);
      return;
    }

    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = "Sending…";
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...formData(form), message_summary: summary }),
      });
      if (!res.ok) throw new Error(String(res.status));
      storage.remove(key);
      renderSuccess(form, summary, true);
    } catch {
      // Network / endpoint failure: fall back to DM hand-off so nothing is lost
      renderSuccess(form, summary, false);
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
});
