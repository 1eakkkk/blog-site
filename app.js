/* ======== blog front-end app.js ======== */
const API = "https://api.1eak.cool";
const $ = (s) => document.querySelector(s);

/* ---------- utils ---------- */
function qs(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function fmt(ts) {
  // 服务器时间戳为秒；转成本地时间
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}
function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}
function setUserBox(name) {
  const el = $("#userbox");
  if (!el) return;
  el.innerHTML = name
    ? `<span class="muted">已登录：</span>${escapeHtml(name)}`
    : `<span class="muted">未登录</span>`;
}

/* ---------- state ---------- */
let USERNAME = localStorage.getItem("username") || "";

/* ---------- auth ---------- */
function bindAuth() {
  const reg   = $("#btnRegister");
  const login = $("#btnLogin");
  const logout= $("#btnLogout");
  const u = $("#username");
  const p = $("#password");
  const msg = $("#authMsg");

  setUserBox(USERNAME);

  console.log("[auth] elements:", {
    reg: !!reg, login: !!login, logout: !!logout, u: !!u, p: !!p, msg: !!msg
  });

  if (reg) reg.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const payload = { username: (u?.value || "").trim(), password: p?.value || "" };
      if (!payload.username || payload.password.length < 6) {
        msg && (msg.textContent = "用户名不能为空，密码至少 6 位。");
        return;
      }
      console.log("[auth] register ->", payload.username);
      const r = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => ({}));
      console.log("[auth] register resp:", r.status, j);
      if (r.ok && j.ok) {
        msg && (msg.textContent = "注册成功，请登录。");
      } else {
        msg && (msg.textContent = `注册失败：${j.error || r.status}`);
      }
    } catch (err) {
      console.error(err);
      msg && (msg.textContent = "注册请求失败（看 Console 日志）");
    }
  });

  if (login) login.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const payload = { username: (u?.value || "").trim(), password: p?.value || "" };
      if (!payload.username || !payload.password) {
        msg && (msg.textContent = "请填写用户名和密码。");
        return;
      }
      console.log("[auth] login ->", payload.username);
      const r = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => ({}));
      console.log("[auth] login resp:", r.status, j);
      if (r.ok && j.ok) {
        USERNAME = j.username || payload.username;
        localStorage.setItem("username", USERNAME);
        setUserBox(USERNAME);
        msg && (msg.textContent = "登录成功。");
      } else {
        msg && (msg.textContent = `登录失败：${j.error || r.status}`);
      }
    } catch (err) {
      console.error(err);
      msg && (msg.textContent = "登录请求失败（看 Console 日志）");
    }
  });

  if (logout) logout.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      console.log("[auth] logout ->");
      const r = await fetch(`${API}/api/logout`, {
        method: "POST",
        credentials: "include"
      });
      const j = await r.json().catch(() => ({}));
      console.log("[auth] logout resp:", r.status, j);
      if (r.ok && j.ok) {
        USERNAME = "";
        localStorage.removeItem("username");
        setUserBox("");
        msg && (msg.textContent = "已退出。");
      } else {
        msg && (msg.textContent = `退出失败：${j.error || r.status}`);
      }
    } catch (err) {
      console.error(err);
      msg && (msg.textContent = "退出请求失败（看 Console 日志）");
    }
  });
}

/* ---------- comments (post.html) ---------- */
function bindComments() {
  if (!location.pathname.endsWith("post.html")) return;

  const slug = qs("slug") || "hello-world";
  const title = $("#title");
  const meta = $("#meta");
  const list = $("#commentList");
  const msg  = $("#cmtMsg");
  const ta   = $("#commentInput");
  const send = $("#btnSend");

  if (title) title.textContent = slug.replace(/[-_]/g, " ").toUpperCase();
  if (meta)  meta.textContent  = `Slug: ${slug}`;

  async function load() {
    try {
      const r = await fetch(`${API}/api/comments?slug=${encodeURIComponent(slug)}`, {
        credentials: "include"
      });
      const j = await r.json().catch(() => ({}));
      if (!(r.ok && j.ok)) {
        msg && (msg.textContent = `加载失败：${j.error || r.status}`);
        return;
      }
      if (!list) return;
      list.innerHTML = "";
      for (const c of j.list || []) {
        const li = document.createElement("div");
        li.className = "comment";
        li.innerHTML = `
          <div class="meta">@${escapeHtml(c.username)} · ${fmt(c.created_at)}</div>
          <div class="text">${escapeHtml(c.content)}</div>
        `;
        list.appendChild(li);
      }
    } catch (err) {
      console.error(err);
      msg && (msg.textContent = "评论加载失败（看 Console 日志）");
    }
  }

  async function sendCmt() {
    const content = (ta?.value || "").trim();
    if (!content) { msg && (msg.textContent = "内容不能为空"); return; }
    try {
      const r = await fetch(`${API}/api/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug, content })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        if (ta) ta.value = "";
        await load();
        msg && (msg.textContent = "已发布。");
      } else {
        msg && (msg.textContent = `发布失败：${j.error || r.status}`);
      }
    } catch (err) {
      console.error(err);
      msg && (msg.textContent = "发布失败（看 Console 日志）");
    }
  }

  if (send && ta) {
    send.onclick = sendCmt;
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        sendCmt();
      }
    });
  }

  load();
}

/* ---------- init ---------- */
window.addEventListener("DOMContentLoaded", () => {
  console.log("[init] DOM ready");
  setYear();
  bindAuth();
  bindComments();
});
/* ============ end ============ */
