export default {
    async fetch(req, env) {
        const url = new URL(req.url);

        // ROUTES
        if (url.pathname === "/") return docPage();
        if (url.pathname === "/api") return handleAPI(req, env);

        return new Response("Not Found", { status: 404 });
    }
};

// =================================================
// API ENDPOINT – CLEAN, TANPA KV
// =================================================
async function handleAPI(req, env) {
    const body = await req.json().catch(() => null);
    if (!body || !body.prompt) {
        return json({ error: "Missing prompt" }, 400);
    }

    const model = body.model || "llama-3.1-8b-instruct";

    const ai = new Ai(env.AI);
    const result = await ai.run(model, { prompt: body.prompt });

    return json(result);
}

// =================================================
// DOCUMENTATION PAGE – MODERN & PROFESIONAL
// =================================================
function docPage() {
    return html(`
    <style>
        body {
            background: #080808;
            font-family: 'Segoe UI', Arial;
            color: #e6e6e6;
            padding: 30px;
        }
        h1 {
            color: #00e5ff;
            text-align: center;
            font-size: 38px;
            margin-bottom: 10px;
        }
        h2 {
            color: #00eaff;
            font-size: 24px;
        }
        p {
            font-size: 16px;
            color: #ccc;
        }
        .card {
            background: #0e0e0e;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
            border: 1px solid #1a1a1a;
            box-shadow: 0 0 15px rgba(0,255,255,0.05);
        }
        code, pre {
            background: #111;
            padding: 12px;
            border-radius: 10px;
            color: #00ffc3;
            font-size: 14px;
            display: block;
            white-space: pre-wrap;
            border: 1px solid #1a1a1a;
        }
        footer {
            text-align: center;
            color: #666;
            margin-top: 40px;
            font-size: 13px;
        }
        hr {
            border: none;
            border-top: 1px solid #222;
            margin: 25px 0;
        }
    </style>

    <h1>⚡ Wanz Cloud AI API</h1>
    <p style="text-align:center; font-size:18px;">
        API AI modern tanpa API key. Simple, cepat, dan gratis digunakan.
    </p>

    <hr>

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
const res = await fetch("https://domain/api", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Halo, apa kabar?"
  })
});
console.log(await res.json());
</pre>
    </div>

    <div class="card">
        <h2>🐘 PHP Example</h2>
<pre>
$ch = curl_init("https://domain/api");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "prompt" => "Halo"
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Content-Type: application/json"
]);
echo curl_exec($ch);
</pre>
    </div>

    <div class="card">
        <h2>🐍 Python Example</h2>
<pre>
import requests

r = requests.post("https://domain/api", json={
  "prompt": "Halo!"
})
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

    <footer>
        © 2025 Wanz Cloud AI — Simple Professional API
    </footer>
    `);
}

// =================================================
// HELPERS
// =================================================
function json(obj, code = 200) {
    return new Response(JSON.stringify(obj), {
        status: code,
        headers: { "Content-Type": "application/json" }
    });
}

function html(content) {
    return new Response(
        `<!DOCTYPE html><html><body>${content}</body></html>`,
        { headers: { "Content-Type": "text/html" } }
    );
}
