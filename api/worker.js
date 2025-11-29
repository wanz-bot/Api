// ==========================================
// CONFIG
// ==========================================
export default {
    async fetch(req, env, ctx) {
        const url = new URL(req.url);

        // Routes
        if (url.pathname === "/") return docPage();
        if (url.pathname === "/api") return handleAPI(req, env);
        if (url.pathname === "/admin") return adminPage(req, env);

        return new Response("Not Found", { status: 404 });
    }
};

// ==========================================
// API ENDPOINT (AI MODEL)
// ==========================================
async function handleAPI(req, env) {
    const ip = req.headers.get("CF-Connecting-IP");

    // Check blocklist
    const blocked = await env.KV_BLOCK.get(ip);
    if (blocked) return json({ error: "Your IP is blocked" }, 403);

    const body = await req.json().catch(() => null);
    if (!body || !body.prompt)
        return json({ error: "Missing prompt" }, 400);

    const model = body.model || "llama-3.1-8b-instruct";

    const ai = new Ai(env.AI);
    const result = await ai.run(model, { prompt: body.prompt });

    // Log activity
    await env.KV_LOG.put(
        `log:${Date.now()}`,
        JSON.stringify({
            ip,
            model,
            prompt: body.prompt.slice(0, 200),
            time: Date.now()
        })
    );

    return json(result);
}

// ==========================================
// HIDDEN LOGIN ADMIN PANEL
// ==========================================
async function adminPage(req, env) {
    const url = new URL(req.url);
    const auth = url.searchParams.get("auth");

    if (auth !== env.ADMIN_PASS)
        return new Response(" ", { status: 200 }); // halaman kosong (tersembunyi)

    // Action: Block IP
    if (url.searchParams.get("block")) {
        await env.KV_BLOCK.put(url.searchParams.get("block"), "1");
    }

    // Action: Unblock IP
    if (url.searchParams.get("unblock")) {
        await env.KV_BLOCK.delete(url.searchParams.get("unblock"));
    }

    // Action: Reset logs
    if (url.searchParams.get("reset") === "1") {
        const logs = await env.KV_LOG.list({ prefix: "log:" });
        for (const L of logs.keys) await env.KV_LOG.delete(L.name);
    }

    // Load logs
    const list = await env.KV_LOG.list({ prefix: "log:" });
    let logHTML = "";
    for (const L of list.keys.reverse()) {
        const d = JSON.parse(await env.KV_LOG.get(L.name));
        logHTML += `
            <tr>
                <td>${d.ip}</td>
                <td>${d.model}</td>
                <td>${d.prompt}</td>
                <td>${new Date(d.time).toLocaleString()}</td>
                <td><a class="btn2" href="/admin?auth=${env.ADMIN_PASS}&block=${d.ip}">Block</a></td>
            </tr>
        `;
    }

    // Blocked list
    const blocked = await env.KV_BLOCK.list();
    let blockHTML = "";
    for (const i of blocked.keys) {
        blockHTML += `
            <tr>
                <td>${i.name}</td>
                <td><a class="btn2" href="/admin?auth=${env.ADMIN_PASS}&unblock=${i.name}">Unblock</a></td>
            </tr>`;
    }

    return html(`
    <style>
        body {
            background: #0a0a0a;
            color: #f2f2f2;
            font-family: Arial;
        }
        h1 {
            text-align: center;
            font-size: 30px;
            margin-bottom: 30px;
            color: #00eaff;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: #111;
            margin-bottom: 40px;
        }
        th, td {
            padding: 10px;
            border-bottom: 1px solid #333;
        }
        th {
            color: #00eaff;
        }
        .btn2 {
            background: #00eaff;
            padding: 5px 10px;
            color: #000;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
        }
        .btn3 {
            display:block;
            width:200px;
            margin: 20px auto;
            text-align:center;
            background:red;
            color:white;
            padding:10px;
            border-radius:10px;
            text-decoration:none;
            font-weight:bold;
        }
        .card {
            background:#131313;
            padding:20px;
            border-radius:10px;
            margin-bottom:20px;
            border:1px solid #222;
        }
    </style>

    <h1>Admin Dashboard</h1>

    <div class="card">
        <h2>Log Aktivitas</h2>
        <table>
            <tr><th>IP</th><th>Model</th><th>Prompt</th><th>Time</th><th>Action</th></tr>
            ${logHTML}
        </table>
    </div>

    <div class="card">
        <h2>Blocked IP</h2>
        <table>
            <tr><th>IP</th><th>Action</th></tr>
            ${blockHTML}
        </table>
    </div>

    <a class="btn3" href="/admin?auth=${env.ADMIN_PASS}&reset=1">RESET LOG</a>
    <p style="text-align:center;"><a style="color:#00eaff" href="/">Kembali ke Dokumentasi</a></p>
    `);
}

// ==========================================
// DOCUMENTATION PAGE (MODERN UI)
// ==========================================
function docPage() {
    return html(`
    <style>
        body { background:#050505; color:#fff; font-family:Arial; padding:20px; }
        h1 { color:#00eaff; font-size:32px; }
        code, pre {
            background:#111;
            color:#00ffcc;
            padding:10px;
            border-radius:10px;
            display:block;
            white-space:pre-wrap;
        }
        a { color:#00eaff; }
        .card {
            background:#0f0f0f;
            padding:20px;
            border-radius:10px;
            margin-bottom:20px;
            border:1px solid #222;
        }
    </style>

    <h1>⚡ Wanz Cloud AI API</h1>
    <p>AI API modern tanpa API key. Bebas pakai.</p>
    <hr><br>

    <div class="card">
        <h2>📌 Endpoint</h2>
        <code>POST /api</code>
    </div>

    <div class="card">
        <h2>📥 Request Body</h2>
        <pre>{
  "model": "llama-3.1-8b-instruct",
  "prompt": "Halo"
}</pre>
    </div>

    <div class="card">
        <h2>🟦 JavaScript Example</h2>
        <pre>
const res = await fetch("/api", {
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body: JSON.stringify({ prompt:"Halo" })
});
console.log(await res.json());
        </pre>
    </div>

    <div class="card">
        <h2>🐘 PHP Example</h2>
        <pre>
$ch = curl_init("https://domain/api");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["prompt"=>"Halo"]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
echo curl_exec($ch);
        </pre>
    </div>

    <div class="card">
        <h2>🐍 Python Example</h2>
        <pre>
import requests

r = requests.post("https://domain/api", json={"prompt":"Halo"})
print(r.json())
        </pre>
    </div>

    <div class="card">
        <h2>🌀 cURL Example</h2>
        <pre>
curl -X POST https://domain/api \\
-H "Content-Type: application/json" \\
-d '{"prompt":"Halo"}'
        </pre>
    </div>

    <p style="text-align:center;margin-top:40px;">
        <a href="/admin">🔒 Admin (Hidden Login Required)</a>
    </p>
    `);
}

// ==========================================
// HELPERS
// ==========================================
function json(obj, code = 200) {
    return new Response(JSON.stringify(obj), {
        status: code,
        headers: { "Content-Type": "application/json" }
    });
}

function html(content) {
    return new Response(`<!DOCTYPE html><html><body>${content}</body></html>`, {
        headers: { "Content-Type": "text/html" }
    });
}
