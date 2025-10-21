const API = "https://api.1eak.cool";
const $ = (s) => document.querySelector(s);

function qs(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}
function fmt(ts) {
  // 服务器返回的是秒；转本地时间字符串
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function setYear(){ const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear(); }
setYear();

function setUserBox(name){
  const el = $("#userbox");
  if (!el) return;
  if (name) el.innerHTML = `<span class="muted">已登录：</span>${name}`;
  else el.innerHTML = `<span class="muted">未登录</span>`;
}

// 尝试读取登录状态（通过访问一个需要凭证但仅返回健康信息的接口也行，这里简化：登录成功时前端自己记）
let USERNAME = localStorage.getItem("username") || "";

function bindAuth(){
  const reg = $("#btnRegister"), login=$("#btnLogin"), logout=$("#btnLogout");
  const u=$("#username"), p=$("#password"), msg=$("#authMsg");
  setUserBox(USERNAME);

  if (reg) reg.onclick = async ()=>{
    const r = await fetch(`${API}/api/register`, {
      method:"POST", headers:{ "content-type":"application/json" },
      body: JSON.stringify({ username: u.value.trim(), password: p.value })
    });
    const j = await r.json();
    msg.textContent = j.ok ? "注册成功，请登录。" : `注册失败：${j.error||r.status}`;
  };

  if (login) login.onclick = async ()=>{
    const r = await fetch(`${API}/api/login`, {
      method:"POST", headers:{ "content-type":"application/json" },
      credentials:"include",
      body: JSON.stringify({ username: u.value.trim(), password: p.value })
    });
    const j = await r.json();
    if (j.ok) {
      USERNAME = j.username;
      localStorage.setItem("username", USERNAME);
      setUserBox(USERNAME);
      msg.textContent = "登录成功。";
    } else {
      msg.textContent = `登录失败：${j.error||r.status}`;
    }
  };

  if (logout) logout.onclick = async ()=>{
    const r = await fetch(`${API}/api/logout`, { method:"POST", credentials:"include" });
    const j = await r.json();
    if (j.ok) {
      USERNAME = "";
      localStorage.removeItem("username");
      setUserBox("");
      msg.textContent = "已退出。";
    } else {
      msg.textContent = `退出失败：${j.error||r.status}`;
    }
  };
}

function bindComments(){
  if (!location.pathname.endsWith("post.html")) return;
  const slug = qs("slug") || "hello-world";
  $("#title").textContent = slug.replace(/[-_]/g," ").toUpperCase();
  $("#meta").textContent = `Slug: ${slug}`;

  const list = $("#commentList"), msg=$("#cmtMsg"), ta=$("#commentInput"), send=$("#btnSend");

  async function load(){
    const r = await fetch(`${API}/api/comments?slug=${encodeURIComponent(slug)}`, { credentials:"include" });
    const j = await r.json();
    if (!j.ok) { msg.textContent = `加载失败：${j.error||r.status}`; return; }
    list.innerHTML = "";
    for (const c of j.list) {
      const li = document.createElement("div");
      li.className="comment";
      li.innerHTML = `
        <div class="meta">@${escapeHtml(c.username)} · ${fmt(c.created_at)}</div>
        <div class="text">${escapeHtml(c.content)}</div>
      `;
      list.appendChild(li);
    }
  }

  async function sendCmt(){
    const content = ta.value.trim();
    if (!content) { msg.textContent = "内容不能为空"; return; }
    const r = await fetch(`${API}/api/comments`, {
      method:"POST",
      headers:{ "content-type":"application/json" },
      credentials:"include",
      body: JSON.stringify({ slug, content })
    });
    const j = await r.json();
    if (j.ok) {
      ta.value = "";
      await load();
      msg.textContent = "已发布。";
    } else {
      msg.textContent = `发布失败：${j.error||r.status}`;
    }
  }

  send.onclick = sendCmt;
  ta.addEventListener("keydown", (e)=>{
    if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); sendCmt(); }
  });

  load();
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function bindAuth(){
  const reg = $("#btnRegister"), login=$("#btnLogin"), logout=$("#btnLogout");
  const u=$("#username"), p=$("#password"), msg=$("#authMsg");
  setUserBox(USERNAME);

  console.log("[auth] app.js loaded, elements:", {reg: !!reg, login: !!login, logout: !!logout, u: !!u, p: !!p});

  if (reg) reg.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      console.log("[auth] register clicked");
      const r = await fetch(`${API}/api/register`, {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ username: u.value.trim(), password: p.value })
      });
      const j = await r.json();
      console.log("[auth] register resp:", j);
      msg.textContent = j.ok ? "注册成功，请登录。" : `注册失败：${j.error||r.status}`;
    } catch (err) {
      console.error(err);
      msg.textContent = "注册请求失败（看 Console 日志）";
    }
  });

  if (login) login.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      console.log("[auth] login clicked");
      const r = await fetch(`${API}/api/login`, {
        method:"POST",
        headers:{ "content-type":"application/json" },
        credentials:"include",
        body: JSON.stringify({ username: u.value.trim(), password: p.value })
      });
      const j = await r.json();
      console.log("[auth] login resp:", j);
      if (j.ok) {
        USERNAME = j.username;
        localStorage.setItem("username", USERNAME);
        setUserBox(USERNAME);
        msg.textContent = "登录成功。";
      } else {
        msg.textContent = `登录失败：${j.error||r.status}`;
      }
    } catch (err) {
      console.error(err);
      msg.textContent = "登录请求失败（看 Console 日志）";
    }
  });

  if (logout) logout.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      console.log("[auth] logout clicked");
      const r = await fetch(`${API}/api/logout`, { method:"POST", credentials:"include" });
      const j = await r.json();
      console.log("[auth] logout resp:", j);
      if (j.ok) {
        USERNAME = "";
        localStorage.removeItem("username");
        setUserBox("");
        msg.textContent = "已退出。";
      } else {
        msg.textContent = `退出失败：${j.error||r.status}`;
      }
    } catch (err) {
      console.error(err);
      msg.textContent = "退出请求失败（看 Console 日志）";
    }
  });
}

bindComments();
