// =============================
// CONFIG
// =============================
const TOKEN = "7950650582:AAG8-VcC-rYXdQfsgqVl3Hvq-ZKGDi5wK-c";
const ADMIN_ID = 6837025112; // ganti dengan telegram admin ID
const BOT_API = `https://api.telegram.org/bot${TOKEN}`;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    // ROUTES
    if (url.pathname === "/") return docPage();
    if (url.pathname === "/api") return handleAPI(req, env, ctx);
    if (url.pathname === "/admin") return adminPage(env);
    if (url.pathname === "/telegram") return handleTelegram(req, env);

    return new Response("Not Found", { status: 404 });
  }
};

// =============================
// API: AI MODEL
// =============================
async function handleAPI(req, env, ctx) {
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
  const log = {
    ip,
    model,
    prompt: body.prompt.substring(0, 150),
    time: Date.now()
  };
  await env.KV_LOG.put(`log:${Date.now()}`, JSON.stringify(log));

  // Notify Telegram Admin
  fetch(`${BOT_API}/sendMessage`, {
    method: "POST",
    body: JSON.stringify({
      chat_id: ADMIN_ID,
      text: `📌 *AI USED*\nIP: ${ip}\nModel: ${model}\nPrompt: ${body.prompt.substring(0, 100)}...`,
      parse_mode: "Markdown"
    })
  });

  return json(result);
}

// =============================
// WEB — Documentation Page
// =============================
function docPage() {
  return html(`
    <h1>Wanz AI API</h1>
    <p>Tanpa API key - Bebas pakai.</p>

    <h2>Endpoint</h2>
    <code>POST /api</code>

    <h2>Request Body</h2>
    <pre>{
  "model": "llama-3.1-8b-instruct",
  "prompt": "Halo AI"
}</pre>

    <h2>JavaScript Example</h2>
    <pre>
const res = await fetch("/api", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "Halo" })
});
console.log(await res.json());
    </pre>

    <h2>PHP Example</h2>
    <pre>
$ch = curl_init("https://domain/api");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["prompt"=>"Halo"]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
echo curl_exec($ch);
    </pre>

    <h2>cURL Example</h2>
    <pre>
curl -X POST https://domain/api \\
 -H "Content-Type: application/json" \\
 -d '{"prompt":"Halo"}'
    </pre>
  `);
}

// =============================
// WEB — Admin Page
// =============================
async function adminPage(env) {
  const logs = await env.KV_LOG.list({ prefix: "log:" });
  let htmlRows = "";

  for (const row of logs.keys) {
    const item = JSON.parse(await env.KV_LOG.get(row.name));
    htmlRows += `
      <tr>
        <td>${item.ip}</td>
        <td>${item.model}</td>
        <td>${item.prompt}</td>
        <td>${new Date(item.time).toLocaleString()}</td>
        <td><a href="/admin?block=${item.ip}">Block</a></td>
      </tr>
    `;
  }

  return html(`
    <h1>Admin Logs</h1>
    <p>Only monitoring — no login.</p>

    <table border="1" cellpadding="5">
      <tr>
        <th>IP</th><th>Model</th><th>Prompt</th><th>Time</th><th>Action</th>
      </tr>
      ${htmlRows}
    </table>
  `);
}

// =============================
// BOT TELEGRAM ADMIN PANEL
// =============================
async function handleTelegram(req, env) {
  const update = await req.json();
  const msg = update.message;

  if (!msg) return new Response("OK");

  const chat = msg.chat.id;
  const text = msg.text || "";

  if (chat !== ADMIN_ID) {
    return tgSend(chat, "❌ Kamu bukan admin.");
  }

  // Commands
  if (text === "/start") {
    return tgSend(chat, `
ADMIN PANEL BOT

/lastlog - Lihat 10 aktivitas terakhir
/block <ip> - Blokir IP
/unblock <ip> - Unblokir IP
/reset - Hapus semua log
    `);
  }

  if (text === "/lastlog") {
    const logs = await env.KV_LOG.list({ prefix: "log:" });
    const all = logs.keys.slice(-10);

    let pack = "📌 *10 Aktivitas Terakhir:*\n\n";
    for (const row of all) {
      const item = JSON.parse(await env.KV_LOG.get(row.name));
      pack += `• ${item.ip} | ${item.prompt.substring(0, 40)}...\n`;
    }

    return tgSend(chat, pack);
  }

  if (text.startsWith("/block ")) {
    const ip = text.split(" ")[1];
    await env.KV_BLOCK.put(ip, "blocked");
    return tgSend(chat, `IP ${ip} diblokir.`);
  }

  if (text.startsWith("/unblock ")) {
    const ip = text.split(" ")[1];
    await env.KV_BLOCK.delete(ip);
    return tgSend(chat, `IP ${ip} dihapus dari blocklist.`);
  }

  if (text === "/reset") {
    const logs = await env.KV_LOG.list({ prefix: "log:" });
    for (const l of logs.keys) await env.KV_LOG.delete(l.name);
    return tgSend(chat, "Log berhasil dihapus.");
  }

  return tgSend(chat, "Perintah tidak dikenal.");
}

// =============================
// HELPERS
// =============================
function json(obj, code = 200) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: { "Content-Type": "application/json" }
  });
}

function html(body) {
  return new Response(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px">${body}</body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

async function tgSend(chat_id, text) {
  return fetch(`${BOT_API}/sendMessage`, {
    method: "POST",
    body: JSON.stringify({
      chat_id,
      text,
      parse_mode: "Markdown"
    })
  });
}
