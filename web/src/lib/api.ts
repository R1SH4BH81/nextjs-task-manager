export type Tokens = { accessToken: string; refreshToken: string };

const API_URL = "http://localhost:4000";

function getTokens(): Tokens | null {
  const a = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const r = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
  if (a && r) return { accessToken: a, refreshToken: r };
  return null;
}

function setTokens(t: Tokens) {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", t.accessToken);
    localStorage.setItem("refreshToken", t.refreshToken);
  }
}

async function refresh() {
  const tokens = getTokens();
  if (!tokens) throw new Error("No tokens");
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken })
  });
  if (!res.ok) throw new Error("Refresh failed");
  const data = await res.json();
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? tokens.refreshToken });
  return data.accessToken as string;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const tokens = getTokens();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init?.headers as any) };
  if (tokens?.accessToken) headers["Authorization"] = `Bearer ${tokens.accessToken}`;
  let res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401 && tokens?.refreshToken) {
    try {
      const newAccess = await refresh();
      const retryHeaders = { ...headers, Authorization: `Bearer ${newAccess}` };
      res = await fetch(`${API_URL}${path}`, { ...init, headers: retryHeaders });
    } catch {}
  }
  return res;
}

export async function register(email: string, name: string, password: string) {
  const res = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, name, password }) });
  if (!res.ok) throw new Error("Registration failed");
  const data = await res.json();
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function login(email: string, password: string) {
  const res = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function logout() {
  const tokens = getTokens();
  await apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: tokens?.refreshToken }) });
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

export type Task = { id: number; title: string; description: string; status: "PENDING" | "COMPLETED" };
export type TaskList = { items: Task[]; total: number; page: number; pageSize: number };

export async function listTasks(params: { page?: number; limit?: number; status?: "PENDING" | "COMPLETED"; q?: string }) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  const res = await apiFetch(`/tasks?${query.toString()}`, { method: "GET" });
  if (!res.ok) throw new Error("Failed to load tasks");
  return (await res.json()) as TaskList;
}

export async function createTask(payload: { title: string; description?: string }) {
  const res = await apiFetch("/tasks", { method: "POST", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error("Create failed");
  return (await res.json()) as Task;
}

export async function updateTask(id: number, payload: Partial<{ title: string; description: string; status: "PENDING" | "COMPLETED" }>) {
  const res = await apiFetch(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  if (!res.ok) throw new Error("Update failed");
  return (await res.json()) as Task;
}

export async function deleteTask(id: number) {
  const res = await apiFetch(`/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return await res.json();
}

export async function toggleTask(id: number) {
  const res = await apiFetch(`/tasks/${id}/toggle`, { method: "POST" });
  if (!res.ok) throw new Error("Toggle failed");
  return (await res.json()) as Task;
}

export function hasTokens() {
  if (typeof window === "undefined") return false;
  const a = localStorage.getItem("accessToken");
  const r = localStorage.getItem("refreshToken");
  return !!a && !!r;
}
