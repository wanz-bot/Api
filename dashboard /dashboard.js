async function load() {
  const email = localStorage.getItem("email");

  const res = await fetch("/api/me", {
    headers: { "X-Email": email }
  });

  const data = await res.json();

  document.getElementById("email").innerText = data.email;
  document.getElementById("apiKey").innerText = data.api_key;
  document.getElementById("limit").innerText = data.limit_daily;
  document.getElementById("today").innerText = data.used_today;
  document.getElementById("total").innerText = data.total_used;
}

async function resetKey() {
  const email = localStorage.getItem("email");

  await fetch("/api/reset-key", {
    method: "POST",
    body: JSON.stringify({ email })
  });

  load();
}

window.onload = load;
