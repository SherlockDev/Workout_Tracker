const API_BASE = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

function withProfile(path) {
  const pid = localStorage.getItem("activeProfileId");
  if (!pid) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}profile_id=${pid}`;
}

async function request(path, options = {}, { skipProfile = false } = {}) {
  const url = `${API_BASE}${skipProfile ? path : withProfile(path)}`;
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

const json = (method, data) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const api = {
  get: (path, opts) => request(path, {}, opts),
  post: (path, data, opts) => request(path, json("POST", data), opts),
  put: (path, data, opts) => request(path, json("PUT", data), opts),
};
