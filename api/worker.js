export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve UI
    if (req.method === "GET") {
      if (path === "/") return landingUI();
      if (path === "/login") return loginUI();
      if (path === "/register") return registerUI();
      if (path === "/dashboard") return dashboardUI(req, env);
    }

    // API routes
    if (path === "/api/register" && req.method === "POST") return register(req, env);
    if (path === "/api/login" && req.method === "POST") return login(req, env);
    if (path === "/api/reset-key" && req.method === "POST") return resetKey(req, env);
    if (path === "/api/me" && req.method === "GET") return me(req, env);
    if (path === "/api/ai" && req.method === "POST") return aiHandler(req, env);

    return new Response("Not Found", { status: 404 });
  }
};

/* -------------------------------------------------------
  UI TEMPLATES
  Full modern glassmorphism + neon + animations
------------------------------------------------------- */

function landingUI() {
  return html(`
  <html>
  <head>
    <title>Wanz AI Platform</title>
    <style>
      body {
        margin:0;
        font-family: 'Inter', sans-serif;
        background: linear-gradient(135deg, #0d0d0e, #14172b, #1b1e38);
        color:white;
        height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        overflow:hidden;
      }
      .card {
        padding:40px;
        width:420px;
        text-align:center;
        border-radius:18px;
        background:rgba(255,255,255,0.06);
        box-shadow:0 0 35px rgba(0,0,0,0.4);
        backdrop-filter:blur(15px);
        animation:fade 1s ease;
      }
      .btn {
        padding:12px 20px;
        background:#5865F2;
        border:none;
        border-radius:10px;
        font-weight:600;
        cursor:pointer;
        color:white;
        margin-top:20px;
        transition:.3s;
      }
      .btn:hover {
        transform:scale(1.05);
        background:#4654e0;
      }
      @keyframes fade {
        from { opacity:0; transform:translateY(20px); }
        to { opacity:1; transform:translateY(0); }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>⚡ Wanz AI Platform</h1>
      <p>Multi-Model AI API • Ultra Fast • Dashboard Futuristik</p>
      <a href="/login"><button class="btn">Login</button></a>
      <a href="/register"><button class="btn" style="margin-left:10px;background:#00c3ff">Register</button></a>
    </div>
  </body>
  </html>
  `);
}

function loginUI() {
  return html(`
  <html>
  <head>
    <title>Login • Wanz AI</title>
    <style>
      body { margin:0; font-family:Inter; background:#0d0d12; display:flex; justify-content:center; align-items:center; height:100vh; color:white; }
      .box { width:380px; padding:35px; border-radius:15px; background:rgba(255,255,255,0.05); backdrop-filter:blur(12px); box-shadow:0 0 25px rgba(0,0,0,0.3); animation:fade 1s ease; }
      input { width:100%; padding:12px; margin-top:10px; border-radius:10px; border:none; background:rgba(255,255,255,0.1); color:white; }
      .btn { margin-top:20px; width:100%; padding:12px; background:#5865F2; border:none; color:white; font-weight:600; border-radius:10px; cursor:pointer; }
      .btn:hover { background:#4754d8; }
      @keyframes fade { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
    </style>
  </head>
  <body>
    <div class="box">
      <h2>Login</h2>
      <input id="email" placeholder="Email">
      <input id="pass" type="password" placeholder="Password">
      <button class="btn" onclick="login()">Login</button>
      <p style="margin-top:15px;">Tidak punya akun? <a href="/register" style="color:#00c3ff;">Register</a></p>
    </div>
    <script>
      async function login(){
        let email = document.getElementById('email').value;
        let password = document.getElementById('pass').value;

        let r = await fetch('/api/login',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email,password})
        });
        let j = await r.json();

        if(j.success){
          localStorage.setItem('email', email);
          location.href='/dashboard';
        } else alert(j.error);
      }
    </script>
  </body>
  </html>
  `);
}

function registerUI() {
  return html(`
  <html>
  <head>
    <title>Register • Wanz AI</title>
    <style>
      body { margin:0; font-family:Inter; background:#0d0d12; display:flex; justify-content:center; align-items:center; height:100vh; color:white; }
      .box { width:380px; padding:35px; border-radius:15px; background:rgba(255,255,255,0.05); backdrop-filter:blur(12px); box-shadow:0 0 25px rgba(0,0,0,0.3); animation:fade 1s ease; }
      input { width:100%; padding:12px; margin-top:10px; border-radius:10px; border:none; background:rgba(255,255,255,0.1); color:white; }
      .btn { margin-top:20px; width:100%; padding:12px; background:#00c3ff; border:none; color:white; font-weight:600; border-radius:10px; cursor:pointer; }
      .btn:hover { background:#00a3dd; }
      @keyframes fade { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
    </style>
  </head>
  <body>
    <div class="box">
      <h2>Register</h2>
      <input id="email" placeholder="Email">
      <input id="pass" type="password" placeholder="Password">
      <button class="btn" onclick="regis()">Register</button>
      <p style="margin-top:15px;">Sudah punya akun? <a href="/login" style="color:#5865F2;">Login</a></p>
    </div>
    <script>
      async function regis(){
        let email = document.getElementById('email').value;
        let password = document.getElementById('pass').value;

        let r = await fetch('/api/register',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email,password})
        });
        let j = await r.json();

        if(j.success){
          alert("Akun dibuat! Silakan login");
          location.href='/login';
        } else alert(j.error);
      }
    </script>
  </body>
  </html>
  `);
}

async function dashboardUI(req, env) {
  const email = req.headers.get("X-Email") || "";

  return html(`
  <html>
  <head>
    <title>Dashboard • Wanz AI</title>
    <style>
      body { margin:0; font-family:Inter; background:#0a0a0f; color:white; }
      .nav { padding:20px; background:#11121a; box-shadow:0 0 20px rgba(0,0,0,0.3); }
      .container { padding:30px; animation:fade .8s ease; }
      .card {
        padding:20px; border-radius:15px;
        background:rgba(255,255,255,0.05);
        backdrop-filter:blur(10px);
        box-shadow:0 0 20px rgba(0,0,0,0.3);
        margin-bottom:20px;
      }
      .btn {
        padding:10px 15px; background:#5865F2; border:none;
        border-radius:10px; color:white; cursor:pointer; 
        transition:.3s;
      }
      .btn:hover { background:#4654e0; transform:scale(1.03); }
      @keyframes fade { from{opacity:0;transform:translateY(15px);} to{opacity:1;transform:translateY(0);} }
    </style>
  </head>
  <body>
    <div class="nav"><h2>Wanz AI Dashboard</h2></div>
    <div class="container">
      <div class="card">
        <h3>Your API Key</h3>
        <p id="key">Loading...</p>
        <button class="btn" onclick="resetKey()">Reset Key</button>
      </div>

      <div class="card">
        <h3>API Usage Today</h3>
        <p id="usage">Loading...</p>
      </div>

      <div class="card">
        <h3>Send AI Request</h3>
        <textarea id="prompt" style="width:100%;height:80px;background:#0002;color:white;border-radius:10px;padding:10px;"></textarea>
        <button class="btn" onclick="sendAI()">Send</button>
        <pre id="result" style="margin-top:15px;white-space:pre-wrap"></pre>
      </div>
    </div>

    <script>
      async function loadMe(){
        let email = localStorage.getItem("email");
        let r = await fetch("/api/me",{headers:{ "X-Email":email }});
        let j = await r.json();

        document.getElementById("key").innerText = j.api_key;
        document.getElementById("usage").innerText = 
          j.used_today + " / " + j.limit_daily;
      }

      async function resetKey(){
        let email = localStorage.getItem("email");
        let r = await fetch("/api/reset-key",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({email})
        });
        let j = await r.json();
        document.getElementById("key").innerText = j.api_key;
      }

      async function sendAI(){
        let key = document.getElementById("key").innerText;
        let prompt = document.getElementById("prompt").value;

        let r = await fetch("/api/ai",{
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+key
          },
          body:JSON.stringify({ model:"llama-3.1-8b-instruct", prompt })
        });

        let j = await r.json();
        document.getElementById("result").innerText = JSON.stringify(j,null,2);
      }

      loadMe();
    </script>
  </body>
  </html>
  `);
}

/* -------------------------------------------------------
  JSON RESPONSE
------------------------------------------------------- */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

/* -------------------------------------------------------
  HTML RESPONSE
------------------------------------------------------- */
function html(content) {
  return new Response(content, {
    headers:{ "Content-Type":"text/html" }
  });
}

/* -------------------------------------------------------
  BACKEND: Register
------------------------------------------------------- */
async function register(req, env) {
  const { email, password } = await req.json();
  const exists = await env.KV_USERS.get(`user:${email}`);
  if (exists) return json({ error: "Email already registered" }, 400);

  const api_key = "WANZ-" + crypto.randomUUID();

  await env.KV_USERS.put(`user:${email}`, JSON.stringify({
    email,
    password,
    api_key,
    limit_daily: 1000
  }));

  await env.KV_USAGE.put(`usage:${api_key}`, JSON.stringify({
    used_today: 0,
    total_used: 0,
    logs: []
  }));

  return json({ success: true });
}

/* -------------------------------------------------------
  BACKEND: Login
------------------------------------------------------- */
async function login(req, env) {
  const { email, password } = await req.json();
  const userJSON = await env.KV_USERS.get(`user:${email}`);
  if (!userJSON) return json({ error:"User not found" },404);

  const user = JSON.parse(userJSON);
  if (user.password !== password) return json({ error:"Wrong password" },401);

  return json({ success:true });
}

/* -------------------------------------------------------
  BACKEND: Reset Key
------------------------------------------------------- */
async function resetKey(req, env) {
  const { email } = await req.json();
  const userJSON = await env.KV_USERS.get(`user:${email}`);
  if (!userJSON) return json({ error:"Not found" },404);

  const user = JSON.parse(userJSON);
  const newKey = "WANZ-" + crypto.randomUUID();
  user.api_key = newKey;

  await env.KV_USERS.put(`user:${email}`, JSON.stringify(user));
  await env.KV_USAGE.put(`usage:${newKey}`, JSON.stringify({
    used_today:0, total_used:0, logs:[]
  }));

  return json({ success:true, api_key:newKey });
}

/* -------------------------------------------------------
  BACKEND: Get Profile
------------------------------------------------------- */
async function me(req, env) {
  const email = req.headers.get("X-Email");
  const userJSON = await env.KV_USERS.get(`user:${email}`);
  const user = JSON.parse(userJSON);

  const usageJSON = await env.KV_USAGE.get(`usage:${user.api_key}`);
  const usage = JSON.parse(usageJSON);

  return json({
    email,
    api_key:user.api_key,
    limit_daily:user.limit_daily,
    used_today:usage.used_today,
    total_used:usage.total_used,
    logs:usage.logs
  });
}

/* -------------------------------------------------------
  BACKEND: AI Handler
------------------------------------------------------- */
async function aiHandler(req, env) {
  const apiKey = req.headers.get("Authorization")?.replace("Bearer ","");
  if (!apiKey) return json({ error:"Missing API key" },400);

  let user;
  const all = await env.KV_USERS.list({ prefix:"user:" });

  for (const u of all.keys) {
    const data = JSON.parse(await env.KV_USERS.get(u.name));
    if (data.api_key === apiKey) user = data;
  }

  if (!user) return json({ error:"Invalid API key" },403);

  const usageJSON = await env.KV_USAGE.get(`usage:${apiKey}`);
  const usage = JSON.parse(usageJSON);

  if (usage.used_today >= user.limit_daily)
    return json({ error:"Limit reached" },429);

  const { model, prompt } = await req.json();

  const ai = new Ai(env.AI);
  const result = await ai.run(model || "llama-3.1-8b-instruct", { prompt });

  usage.used_today++;
  usage.total_used++;
  usage.logs.push({ t:Date.now(), model, tokens:result.usage?.total_tokens });

  await env.KV_USAGE.put(`usage:${apiKey}`, JSON.stringify(usage));

  return json(result);
}
