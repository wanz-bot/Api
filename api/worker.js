export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    // ----------------- ROUTES ----------------------
    if (path === "/register" && req.method === "POST")
      return register(req, env);

    if (path === "/login" && req.method === "POST")
      return login(req, env);

    if (path === "/reset-key" && req.method === "POST")
      return resetKey(req, env);

    if (path === "/me" && req.method === "GET")
      return me(req, env);

    if (path === "/ai" && req.method === "POST")
      return aiHandler(req, env);

    return new Response("Not Found", { status: 404 });
  }
};

// -------------------------------------------------
//  REGISTER USER
// -------------------------------------------------
async function register(req, env) {
  const { email, password } = await req.json();

  const exists = await env.KV_USERS.get(`user:${email}`);
  if (exists) return json({ error: "Email already registered" }, 400);

  const api_key = crypto.randomUUID();

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

  return json({ success: true, api_key });
}

// -------------------------------------------------
//  LOGIN
// -------------------------------------------------
async function login(req, env) {
  const { email, password } = await req.json();

  const userJSON = await env.KV_USERS.get(`user:${email}`);
  if (!userJSON) return json({ error: "User not found" }, 404);

  const user = JSON.parse(userJSON);
  if (user.password !== password) return json({ error: "Wrong password" }, 401);

  return json({ success: true, user });
}

// -------------------------------------------------
//  RESET API KEY
// -------------------------------------------------
async function resetKey(req, env) {
  const { email } = await req.json();

  const userJSON = await env.KV_USERS.get(`user:${email}`);
  if (!userJSON) return json({ error: "User not found" }, 404);

  const user = JSON.parse(userJSON);
  const newKey = "WANZ-" + crypto.randomUUID();

  user.api_key = newKey;

  await env.KV_USERS.put(`user:${email}`, JSON.stringify(user));
  await env.KV_USAGE.put(`usage:${newKey}`, JSON.stringify({
    used_today: 0,
    total_used: 0,
    logs: []
  }));

  return json({ success: true, api_key: newKey });
}

// -------------------------------------------------
//  GET PROFILE
// -------------------------------------------------
async function me(req, env) {
  const email = req.headers.get("X-Email");
  if (!email) return json({ error: "No email" }, 401);

  const userJSON = await env.KV_USERS.get(`user:${email}`);
  if (!userJSON) return json({ error: "Not found" }, 404);

  const user = JSON.parse(userJSON);

  const usageJSON = await env.KV_USAGE.get(`usage:${user.api_key}`);
  const usage = usageJSON ? JSON.parse(usageJSON) : {};

  return json({
    email: user.email,
    api_key: user.api_key,
    limit_daily: user.limit_daily,
    used_today: usage.used_today,
    total_used: usage.total_used,
    logs: usage.logs
  });
}

// -------------------------------------------------
//  AI PROCESSING
// -------------------------------------------------
async function aiHandler(req, env) {
  const headers = req.headers;
  const apiKey = headers.get("Authorization")?.replace("Bearer ", "");

  if (!apiKey) return json({ error: "Missing API key" }, 400);

  // Get user by scanning KV (best practice: store reverse index)
  let user;
  const users = await env.KV_USERS.list({ prefix: "user:" });

  for (const u of users.keys) {
    const data = JSON.parse(await env.KV_USERS.get(u.name));
    if (data.api_key === apiKey) {
      user = data;
      break;
    }
  }

  if (!user) return json({ error: "Invalid API key" }, 403);

  const usageJSON = await env.KV_USAGE.get(`usage:${apiKey}`);
  const usage = usageJSON ? JSON.parse(usageJSON) : { used_today: 0, total_used: 0, logs: [] };

  if (usage.used_today >= user.limit_daily)
    return json({ error: "Daily limit reached" }, 429);

  const body = await req.json();
  const model = body.model || "llama-3.1-8b-instruct";
  const prompt = body.prompt || "Hello!";

  const ai = new Ai(env.AI);
  const result = await ai.run(model, { prompt });

  // update usage
  usage.used_today++;
  usage.total_used++;
  usage.logs.push({
    t: Date.now(),
    model,
    tokens: result.usage?.total_tokens || 0
  });

  await env.KV_USAGE.put(`usage:${apiKey}`, JSON.stringify(usage));

  return json(result);
}

// -------------------------------------------------
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
                      }
